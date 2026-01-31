/**
 * Registry Scanner Service
 *
 * Scans codebase directories using ts-morph for AST parsing to extract
 * exports, dependencies, and metadata for the Forge registry.
 */

import { Project, SourceFile, Node } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

// =============================================================================
// Types
// =============================================================================

export type RegistryItemType =
  | "component"
  | "hook"
  | "utility"
  | "api"
  | "table"
  | "integration";

export interface RegistryScanResult {
  name: string;
  filePath: string;
  type: RegistryItemType;
  exports: Array<string>;
  dependencies: Array<string>;
  description?: string;
}

interface ScanOptions {
  baseDir: string;
}

// =============================================================================
// Project Setup
// =============================================================================

let tsProject: Project | null = null;

/**
 * Get or create a ts-morph Project instance
 * Re-uses the project for better performance across multiple scans
 */
function getProject(tsConfigPath?: string): Project {
  if (!tsProject) {
    tsProject = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true,
    });
  }
  return tsProject;
}

/**
 * Clear the cached project (useful for testing)
 */
export function clearProjectCache(): void {
  tsProject = null;
}

// =============================================================================
// Export Extraction
// =============================================================================

/**
 * Extract all named and default exports from a source file
 */
function extractExports(sourceFile: SourceFile): Array<string> {
  const exports: Array<string> = [];

  // Get named exports (export const X, export function Y, export class Z)
  for (const declaration of sourceFile.getExportedDeclarations()) {
    const [name, declarations] = declaration;
    if (name !== "default") {
      exports.push(name);
    } else {
      // Handle default export - try to get the name
      for (const decl of declarations) {
        const defaultName = getDefaultExportName(decl);
        if (defaultName) {
          exports.push(defaultName);
        }
      }
    }
  }

  return exports;
}

/**
 * Get the name of a default export if possible
 */
function getDefaultExportName(node: Node): string | null {
  // Function declaration: export default function MyFunc() {}
  if (Node.isFunctionDeclaration(node)) {
    return node.getName() ?? null;
  }

  // Class declaration: export default class MyClass {}
  if (Node.isClassDeclaration(node)) {
    return node.getName() ?? null;
  }

  // Variable declaration: export default MyVariable
  if (Node.isIdentifier(node)) {
    return node.getText();
  }

  // Arrow function or expression assigned to variable
  if (Node.isVariableDeclaration(node)) {
    return node.getName();
  }

  return null;
}

// =============================================================================
// Dependency Extraction
// =============================================================================

/**
 * Extract import dependencies from a source file
 * Returns relative paths and package names
 */
function extractDependencies(sourceFile: SourceFile): Array<string> {
  const dependencies: Array<string> = [];

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    dependencies.push(moduleSpecifier);
  }

  return dependencies;
}

// =============================================================================
// Description Extraction
// =============================================================================

/**
 * Extract description from JSDoc comments at the top of the file
 */
function extractDescription(sourceFile: SourceFile): string | undefined {
  // Look for leading comment at start of file
  const firstStatement = sourceFile.getStatements()[0];
  if (!firstStatement) return undefined;

  // Check for JSDoc on the first statement or file-level comments
  const leadingCommentRanges = firstStatement.getLeadingCommentRanges();
  for (const range of leadingCommentRanges) {
    const text = range.getText();
    // Parse JSDoc-style comments
    if (text.startsWith("/**")) {
      const cleaned = text
        .replace(/^\/\*\*\s*\n?/, "")
        .replace(/\n?\s*\*\/$/, "")
        .split("\n")
        .map((line) => line.replace(/^\s*\*\s?/, ""))
        .filter((line) => !line.startsWith("@"))
        .join(" ")
        .trim();
      if (cleaned) return cleaned;
    }
    // Parse single-line comment style
    if (text.startsWith("//")) {
      const cleaned = text.replace(/^\/\/\s*/, "").trim();
      if (cleaned) return cleaned;
    }
  }

  // Check for JSDoc on exported declarations
  const exportedDeclarations = sourceFile.getExportedDeclarations();
  for (const [_name, declarations] of exportedDeclarations) {
    for (const decl of declarations) {
      if (Node.isJSDocable(decl)) {
        const jsDocs = decl.getJsDocs();
        if (jsDocs.length > 0) {
          const description = jsDocs[0].getDescription();
          if (description) return description.trim();
        }
      }
    }
  }

  return undefined;
}

// =============================================================================
// Name Detection
// =============================================================================

/**
 * Determine the primary name for a file based on exports
 * Prefers use* hook names, then filename-matching exports, then PascalCase components
 */
function determinePrimaryName(
  filePath: string,
  exports: Array<string>
): string {
  const fileName = path.basename(filePath, path.extname(filePath));

  // Highest priority: hooks (use* exports)
  // This ensures useTheme is chosen over Theme even if file is named theme.ts
  const hookExport = exports.find((exp) => exp.startsWith("use"));
  if (hookExport) return hookExport;

  // If there's an export matching the filename exactly (case-sensitive), use it
  const exactMatchExport = exports.find((exp) => exp === fileName);
  if (exactMatchExport) return exactMatchExport;

  // If there's an export matching the filename (case-insensitive), use it
  const matchingExport = exports.find(
    (exp) => exp.toLowerCase() === fileName.toLowerCase()
  );
  if (matchingExport) return matchingExport;

  // For components, look for PascalCase exports (excluding types which often end in Props, Context, etc.)
  const componentExport = exports.find(
    (exp) =>
      /^[A-Z][a-zA-Z]+$/.test(exp) &&
      !exp.endsWith("Props") &&
      !exp.endsWith("Context") &&
      !exp.endsWith("Type")
  );
  if (componentExport) return componentExport;

  // Fall back to first export or filename
  return exports[0] || fileName;
}

// =============================================================================
// Type Detection
// =============================================================================

/**
 * Detect the type of item based on file path and content
 */
function detectItemType(
  filePath: string,
  exports: Array<string>
): RegistryItemType {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const fileName = path.basename(filePath);

  // Hook detection: use*.ts files or files with use* exports
  if (
    fileName.startsWith("use") ||
    exports.some((exp) => exp.startsWith("use"))
  ) {
    return "hook";
  }

  // Component detection: .tsx files in components directory
  if (
    normalizedPath.includes("/components/") ||
    normalizedPath.includes("/contexts/")
  ) {
    return "component";
  }

  // Utility detection: utils directory or utility-like patterns
  if (
    normalizedPath.includes("/utils/") ||
    normalizedPath.includes("/helpers/") ||
    normalizedPath.includes("/lib/")
  ) {
    return "utility";
  }

  // Integration detection
  if (normalizedPath.includes("/integrations/")) {
    return "integration";
  }

  // API detection: routes directory
  if (normalizedPath.includes("/routes/") || normalizedPath.includes("/api/")) {
    return "api";
  }

  // Default to utility for .ts files, component for .tsx
  return filePath.endsWith(".tsx") ? "component" : "utility";
}

// =============================================================================
// File Scanning
// =============================================================================

/**
 * Scan a single file and extract registry information
 */
function scanFile(
  filePath: string,
  options: ScanOptions
): RegistryScanResult | null {
  const project = getProject();

  // Read file content
  let fileContent: string;
  try {
    fileContent = fs.readFileSync(filePath, "utf-8");
  } catch {
    console.warn(`[registry-scanner] Could not read file: ${filePath}`);
    return null;
  }

  // Create or get source file in the project
  let sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    sourceFile = project.createSourceFile(filePath, fileContent, {
      overwrite: true,
    });
  }

  // Extract data
  const exports = extractExports(sourceFile);

  // Skip files with no exports (likely internal/index files that re-export)
  if (exports.length === 0) {
    return null;
  }

  const dependencies = extractDependencies(sourceFile);
  const description = extractDescription(sourceFile);
  const type = detectItemType(filePath, exports);
  const name = determinePrimaryName(filePath, exports);

  // Calculate relative path from base directory
  const relativePath = path.relative(options.baseDir, filePath);

  return {
    name,
    filePath: relativePath,
    type,
    exports,
    dependencies,
    description,
  };
}

// =============================================================================
// Directory Scanning
// =============================================================================

/**
 * Recursively find all TypeScript files in a directory
 */
function findTypeScriptFiles(dirPath: string): Array<string> {
  const files: Array<string> = [];

  if (!fs.existsSync(dirPath)) {
    console.warn(`[registry-scanner] Directory does not exist: ${dirPath}`);
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, dist, and test directories
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === "__tests__" ||
        entry.name === "__mocks__"
      ) {
        continue;
      }
      files.push(...findTypeScriptFiles(fullPath));
    } else if (entry.isFile()) {
      // Include .ts and .tsx files, exclude test files
      if (
        (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
        !entry.name.endsWith(".test.ts") &&
        !entry.name.endsWith(".test.tsx") &&
        !entry.name.endsWith(".spec.ts") &&
        !entry.name.endsWith(".spec.tsx") &&
        !entry.name.endsWith(".d.ts")
      ) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Scan a directory for TypeScript files and extract registry information
 *
 * @param dirPath - Absolute path to the directory to scan
 * @param type - Optional type override for all items in this directory
 * @returns Array of scan results
 */
export async function scanDirectory(
  dirPath: string,
  type?: RegistryItemType
): Promise<Array<RegistryScanResult>> {
  const results: Array<RegistryScanResult> = [];
  const files = findTypeScriptFiles(dirPath);

  // Determine base directory for relative paths
  const baseDir = path.dirname(dirPath);
  const options: ScanOptions = { baseDir };

  for (const filePath of files) {
    const result = scanFile(filePath, options);
    if (result) {
      // Override type if specified
      if (type) {
        result.type = type;
      }
      results.push(result);
    }
  }

  return results;
}

// =============================================================================
// Specialized Scanners
// =============================================================================

/**
 * Scan packages/ui for UI components
 */
export async function scanUIComponents(
  uiPackagePath: string
): Promise<Array<RegistryScanResult>> {
  const componentsPath = path.join(uiPackagePath, "src", "components");
  const contextsPath = path.join(uiPackagePath, "src", "contexts");
  const utilsPath = path.join(uiPackagePath, "src", "utils");

  const results: Array<RegistryScanResult> = [];

  // Scan components
  if (fs.existsSync(componentsPath)) {
    const components = await scanDirectory(componentsPath, "component");
    results.push(...components);
  }

  // Scan contexts (also components in React)
  if (fs.existsSync(contextsPath)) {
    const contexts = await scanDirectory(contextsPath, "component");
    results.push(...contexts);
  }

  // Scan utils
  if (fs.existsSync(utilsPath)) {
    const utils = await scanDirectory(utilsPath, "utility");
    results.push(...utils);
  }

  return results;
}

/**
 * Scan for hooks (use*.ts files)
 */
export async function scanHooks(
  hooksPath: string
): Promise<Array<RegistryScanResult>> {
  return scanDirectory(hooksPath, "hook");
}

/**
 * Scan for utilities
 */
export async function scanUtilities(
  utilsPath: string
): Promise<Array<RegistryScanResult>> {
  return scanDirectory(utilsPath, "utility");
}

// =============================================================================
// Unused Export Detection
// =============================================================================

interface UnusedExportResult {
  name: string;
  filePath: string;
  unusedExports: Array<string>;
}

/**
 * Detect unused exports by analyzing import statements across files
 *
 * @param scanResults - Array of scan results to analyze
 * @returns Array of files with unused exports
 */
export function detectUnusedExports(
  scanResults: Array<RegistryScanResult>
): Array<UnusedExportResult> {
  // Build a map of all imports across the codebase
  const importedNames = new Set<string>();

  // Note: A more complete implementation would parse actual import specifiers
  // from the AST to track which specific exports are used. For now, we use
  // a simplified check based on file path matching in dependencies.

  // For now, we track all exports and mark those not imported elsewhere
  const allExports = new Map<string, { filePath: string; exports: Set<string> }>();

  for (const result of scanResults) {
    allExports.set(result.filePath, {
      filePath: result.filePath,
      exports: new Set(result.exports),
    });
  }

  // Build import graph by checking if each file is imported by other files
  for (const result of scanResults) {
    // Check if this file's exports are imported by other files
    for (const otherResult of scanResults) {
      if (otherResult.filePath !== result.filePath) {
        // Simplified check: if another file has a relative import that matches this file
        const hasImport = otherResult.dependencies.some((dep) => {
          if (dep.startsWith(".")) {
            // Relative import - check if it references this file
            const baseName = path.basename(
              result.filePath,
              path.extname(result.filePath)
            );
            return dep.includes(baseName);
          }
          return false;
        });
        if (hasImport) {
          // Mark all exports from this file as used
          for (const exp of result.exports) {
            importedNames.add(exp);
          }
          break; // No need to check more files once we know it's imported
        }
      }
    }
  }

  // Find exports that aren't imported anywhere
  const unusedResults: Array<UnusedExportResult> = [];

  for (const result of scanResults) {
    const unusedExports = result.exports.filter(
      (exp) => !importedNames.has(exp)
    );
    if (unusedExports.length > 0) {
      unusedResults.push({
        name: result.name,
        filePath: result.filePath,
        unusedExports,
      });
    }
  }

  return unusedResults;
}
