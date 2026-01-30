/**
 * Forge Agent Tools
 *
 * Real implementations of tools that agents can use to interact
 * with the codebase, run commands, and manage git operations.
 *
 * Token Optimization Features:
 * - Smart file reading with automatic summarization for large files
 * - Focused file reading (specific line ranges)
 * - Code structure extraction instead of full content
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { Octokit } from "@octokit/rest";

const execAsync = promisify(exec);

// =============================================================================
// Token-Optimized File Reading
// =============================================================================

/**
 * Configuration for smart file reading
 */
export interface SmartReadOptions {
  maxTokens?: number; // Max tokens to return (default: 2000)
  mode?: "full" | "summary" | "structure"; // Reading mode
  lineStart?: number; // Start line for focused reading
  lineEnd?: number; // End line for focused reading
  includeLineNumbers?: boolean; // Include line numbers in output
}

const DEFAULT_READ_OPTIONS: SmartReadOptions = {
  maxTokens: 2000,
  mode: "full",
  includeLineNumbers: false,
};

/**
 * Extract code structure (imports, exports, function signatures, etc.)
 */
function extractCodeStructure(content: string, filePath: string): string {
  const lines = content.split("\n");
  const ext = path.extname(filePath).toLowerCase();

  const structures: Array<{ type: string; line: number; text: string }> = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // TypeScript/JavaScript patterns
    if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
      if (trimmed.startsWith("import ")) {
        structures.push({ type: "import", line: idx + 1, text: trimmed });
      } else if (trimmed.startsWith("export ")) {
        structures.push({ type: "export", line: idx + 1, text: trimmed.slice(0, 150) });
      } else if (trimmed.match(/^(async\s+)?function\s+\w+/)) {
        structures.push({ type: "function", line: idx + 1, text: trimmed.slice(0, 100) });
      } else if (trimmed.match(/^(export\s+)?(default\s+)?class\s+\w+/)) {
        structures.push({ type: "class", line: idx + 1, text: trimmed.slice(0, 100) });
      } else if (trimmed.match(/^(export\s+)?(type|interface)\s+\w+/)) {
        structures.push({ type: "type", line: idx + 1, text: trimmed.slice(0, 100) });
      } else if (trimmed.match(/^(const|let|var)\s+\w+\s*=/)) {
        // Only top-level declarations (not indented)
        if (!line.startsWith(" ") && !line.startsWith("\t")) {
          structures.push({ type: "const", line: idx + 1, text: trimmed.slice(0, 100) });
        }
      }
    }

    // Python patterns
    if (ext === ".py") {
      if (trimmed.startsWith("import ") || trimmed.startsWith("from ")) {
        structures.push({ type: "import", line: idx + 1, text: trimmed });
      } else if (trimmed.startsWith("def ")) {
        structures.push({ type: "function", line: idx + 1, text: trimmed.slice(0, 100) });
      } else if (trimmed.startsWith("class ")) {
        structures.push({ type: "class", line: idx + 1, text: trimmed.slice(0, 100) });
      }
    }
  });

  // Group by type
  const grouped: Record<string, Array<{ line: number; text: string }>> = {};
  for (const s of structures) {
    if (!grouped[s.type]) grouped[s.type] = [];
    grouped[s.type].push({ line: s.line, text: s.text });
  }

  // Format output
  let output = `# File Structure: ${filePath}\n`;
  output += `# Total lines: ${lines.length}\n\n`;

  const order = ["import", "type", "class", "function", "export", "const"];
  for (const type of order) {
    if (grouped[type] && grouped[type].length > 0) {
      output += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s (${grouped[type].length})\n`;
      for (const item of grouped[type].slice(0, 20)) {
        output += `L${item.line}: ${item.text}\n`;
      }
      if (grouped[type].length > 20) {
        output += `... and ${grouped[type].length - 20} more\n`;
      }
      output += "\n";
    }
  }

  return output;
}

/**
 * Create a summary of file content
 */
function summarizeFileContent(content: string, filePath: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;

  // Start with structure
  const structure = extractCodeStructure(content, filePath);
  if (structure.length <= maxChars) {
    return structure;
  }

  // If structure is too long, truncate it
  return structure.slice(0, maxChars - 50) + "\n\n[Structure truncated]";
}

// =============================================================================
// Configuration
// =============================================================================

// The root directory of the codebase - agents work within this directory
// Use a getter to ensure env is read after it's loaded
function getRepoRoot(): string {
  const root = process.env.FORGE_REPO_ROOT || process.cwd();
  console.log(`[tools] FORGE_REPO_ROOT=${root}`);
  return root;
}

// GitHub configuration - use getters to ensure env is read after it's loaded
function getGithubToken(): string | undefined {
  return process.env.GITHUB_TOKEN;
}
function getGithubOwner(): string {
  return process.env.GITHUB_OWNER || "axori";
}
function getGithubRepo(): string {
  return process.env.GITHUB_REPO || "axori";
}

// Safety: commands that are allowed to run
const ALLOWED_COMMANDS = [
  "pnpm",
  "npm",
  "npx",
  "node",
  "git",
  "ls",
  "cat",
  "head",
  "tail",
  "grep",
  "find",
  "echo",
  "pwd",
  "wc",
];

// Safety: paths that should never be accessed
const FORBIDDEN_PATHS = [
  ".env",
  ".env.local",
  ".env.production",
  "node_modules",
  ".git/config",
  ".git/credentials",
];

// Safety: dangerous git subcommands that should be blocked
// These can destroy work or change state in unexpected ways
const FORBIDDEN_GIT_SUBCOMMANDS = [
  "restore",    // Can revert changes
  "reset",      // Can lose commits
  "checkout",   // Can switch branches unexpectedly or revert files
  "clean",      // Can delete untracked files
  "stash",      // Can hide changes
  "rebase",     // Can rewrite history
  "merge",      // Can cause conflicts
  "cherry-pick", // Can duplicate commits
  "revert",     // Can create revert commits
  "push",       // Should use create_pr instead
  "pull",       // Can cause conflicts
  "fetch",      // Not needed for agent workflow
];

// =============================================================================
// Path Safety
// =============================================================================

/**
 * Resolve and validate a path is within the repo
 */
function safePath(inputPath: string): string {
  // Resolve to absolute path
  const resolved = path.resolve(getRepoRoot(), inputPath);

  // Ensure it's within the repo root
  if (!resolved.startsWith(getRepoRoot())) {
    throw new Error(`Path "${inputPath}" is outside the repository`);
  }

  // Check against forbidden paths
  const relative = path.relative(getRepoRoot(), resolved);
  for (const forbidden of FORBIDDEN_PATHS) {
    if (relative === forbidden || relative.startsWith(forbidden + "/")) {
      throw new Error(`Access to "${inputPath}" is not allowed`);
    }
  }

  return resolved;
}

/**
 * Check if a command is allowed
 */
function isCommandAllowed(command: string): boolean {
  const words = command.trim().split(/\s+/);
  const firstWord = words[0];

  if (!ALLOWED_COMMANDS.includes(firstWord)) {
    return false;
  }

  // Special handling for git commands - block dangerous subcommands
  if (firstWord === "git" && words.length > 1) {
    const gitSubcommand = words[1];
    if (FORBIDDEN_GIT_SUBCOMMANDS.includes(gitSubcommand)) {
      return false;
    }
  }

  return true;
}

// =============================================================================
// File Tools
// =============================================================================

/**
 * Read a file's contents with smart token optimization
 *
 * @param filePath - Path to the file
 * @param options - Smart reading options
 */
export async function readFile(
  filePath: string,
  options?: SmartReadOptions
): Promise<string> {
  const resolved = safePath(filePath);
  const opts = { ...DEFAULT_READ_OPTIONS, ...options };

  try {
    const content = await fs.readFile(resolved, "utf-8");
    const lines = content.split("\n");
    const maxChars = (opts.maxTokens || 2000) * 4;

    // Handle focused line range reading
    if (opts.lineStart !== undefined || opts.lineEnd !== undefined) {
      const start = Math.max(0, (opts.lineStart || 1) - 1);
      const end = Math.min(lines.length, opts.lineEnd || lines.length);
      const selectedLines = lines.slice(start, end);

      let output = `# ${filePath} (lines ${start + 1}-${end} of ${lines.length})\n\n`;
      if (opts.includeLineNumbers) {
        output += selectedLines
          .map((line, idx) => `${(start + idx + 1).toString().padStart(4)}: ${line}`)
          .join("\n");
      } else {
        output += selectedLines.join("\n");
      }

      // Truncate if still too large
      if (output.length > maxChars) {
        return output.slice(0, maxChars - 50) + "\n\n[Output truncated]";
      }
      return output;
    }

    // Handle different reading modes
    switch (opts.mode) {
      case "structure":
        return extractCodeStructure(content, filePath);

      case "summary":
        return summarizeFileContent(content, filePath, opts.maxTokens || 2000);

      case "full":
      default:
        // For small files, return full content
        if (content.length <= maxChars) {
          return content;
        }

        // For medium files (up to 50k chars), truncate with notice
        if (content.length <= 50000) {
          return (
            content.slice(0, maxChars - 100) +
            `\n\n[File truncated - showing ${maxChars} of ${content.length} characters. ` +
            `Use mode: "structure" to see file overview, or specify lineStart/lineEnd for specific sections]`
          );
        }

        // For large files, auto-switch to structure mode
        console.log(
          `[readFile] Large file detected (${content.length} chars), auto-switching to structure mode`
        );
        return (
          `[Large file: ${content.length} characters, ${lines.length} lines - showing structure]\n\n` +
          extractCodeStructure(content, filePath)
        );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Read file with explicit structure extraction (token-efficient)
 */
export async function readFileStructure(filePath: string): Promise<string> {
  return readFile(filePath, { mode: "structure" });
}

/**
 * Read specific lines from a file (token-efficient)
 */
export async function readFileLines(
  filePath: string,
  lineStart: number,
  lineEnd: number
): Promise<string> {
  return readFile(filePath, { lineStart, lineEnd, includeLineNumbers: true });
}

/**
 * Write content to a file
 */
export async function writeFile(filePath: string, content: string): Promise<string> {
  const resolved = safePath(filePath);

  // Create parent directories if needed
  await fs.mkdir(path.dirname(resolved), { recursive: true });

  await fs.writeFile(resolved, content, "utf-8");
  return `Successfully wrote ${content.length} characters to ${filePath}`;
}

/**
 * List files in a directory
 */
export async function listFiles(dirPath: string, pattern?: string): Promise<string> {
  const resolved = safePath(dirPath);

  try {
    const entries = await fs.readdir(resolved, { withFileTypes: true });

    let files = entries.map((entry) => {
      const prefix = entry.isDirectory() ? "[dir] " : "      ";
      return prefix + entry.name;
    });

    // Filter by pattern if provided
    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      files = files.filter((f) => regex.test(f));
    }

    return files.join("\n") || "(empty directory)";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    throw error;
  }
}

/**
 * Search for a pattern in files
 */
export async function searchCode(pattern: string, searchPath?: string): Promise<string> {
  const resolved = safePath(searchPath || ".");

  try {
    // Use grep for searching
    const { stdout } = await execAsync(
      `grep -r -n --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md" "${pattern}" "${resolved}" 2>/dev/null | head -50`,
      { cwd: getRepoRoot(), timeout: 30000 }
    );

    if (!stdout.trim()) {
      return `No matches found for "${pattern}"`;
    }

    // Make paths relative for cleaner output
    const lines = stdout
      .split("\n")
      .map((line) => line.replace(getRepoRoot() + "/", ""))
      .join("\n");

    return lines;
  } catch (error) {
    // grep returns exit code 1 when no matches found
    if ((error as { code?: number }).code === 1) {
      return `No matches found for "${pattern}"`;
    }
    throw error;
  }
}

// =============================================================================
// Command Tools
// =============================================================================

/**
 * Run a shell command
 */
export async function runCommand(command: string): Promise<string> {
  if (!isCommandAllowed(command)) {
    const words = command.trim().split(/\s+/);
    // Provide helpful error for blocked git subcommands
    if (words[0] === "git" && words.length > 1 && FORBIDDEN_GIT_SUBCOMMANDS.includes(words[1])) {
      throw new Error(
        `Git subcommand "${words[1]}" is not allowed. Use the dedicated git tools instead: create_branch, commit_changes, create_pr`
      );
    }
    throw new Error(
      `Command not allowed. Allowed commands: ${ALLOWED_COMMANDS.join(", ")}`
    );
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: getRepoRoot(),
      timeout: 120000, // 2 minute timeout
      maxBuffer: 1024 * 1024, // 1MB max output
    });

    let output = stdout;
    if (stderr) {
      output += "\n[stderr]:\n" + stderr;
    }

    // Truncate very long output
    if (output.length > 50000) {
      output = output.slice(0, 50000) + "\n\n[Output truncated]";
    }

    return output || "(no output)";
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return `Command failed: ${err.message}\n${err.stderr || ""}`;
  }
}

// =============================================================================
// Git Tools
// =============================================================================

let octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (!getGithubToken()) {
    throw new Error("GITHUB_TOKEN not configured");
  }
  if (!octokit) {
    octokit = new Octokit({ auth: getGithubToken() });
  }
  return octokit;
}

/**
 * Create a new git branch
 * NOTE: Creates branch from current HEAD without switching to it
 */
export async function createBranch(branchName: string, ticketId: string): Promise<string> {
  // Sanitize branch name
  const safeBranch = branchName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");

  const fullBranchName = `forge/${ticketId.toLowerCase()}/${safeBranch}`;

  try {
    // Create branch without switching to it (keeps user on their current branch)
    await execAsync(`git branch ${fullBranchName}`, {
      cwd: getRepoRoot(),
      timeout: 30000,
    });

    return `Created branch: ${fullBranchName} (from current HEAD)`;
  } catch (error) {
    const err = error as { message?: string };
    // Branch might already exist
    if (err.message?.includes("already exists")) {
      return `Branch ${fullBranchName} already exists, will use it`;
    }
    throw new Error(`Failed to create branch: ${err.message}`);
  }
}

/**
 * Commit changes to a specific branch without switching user's working directory
 * Uses stash to safely move changes to the target branch
 */
export async function commitChanges(message: string, targetBranch?: string): Promise<string> {
  const repoRoot = getRepoRoot();
  console.log(`[commitChanges] targetBranch=${targetBranch}`);

  try {
    // Get current branch to restore later
    const { stdout: currentBranch } = await execAsync("git branch --show-current", {
      cwd: repoRoot,
      timeout: 30000,
    });
    const originalBranch = currentBranch.trim() || "main";
    console.log(`[commitChanges] originalBranch=${originalBranch}, targetBranch=${targetBranch}`);

    // Stage all changes
    await execAsync("git add -A", { cwd: repoRoot, timeout: 30000 });

    // Check if there are changes to commit
    const { stdout: status } = await execAsync("git status --porcelain", {
      cwd: repoRoot,
      timeout: 30000,
    });

    if (!status.trim()) {
      return "No changes to commit";
    }

    console.log(`[commitChanges] Will use stash workflow: ${!!(targetBranch && targetBranch !== originalBranch)}`);
    // If we have a target branch different from current, use stash to move changes
    if (targetBranch && targetBranch !== originalBranch) {
      // Stash the staged changes (include untracked for new files)
      await execAsync("git stash push --include-untracked -m 'forge-agent-changes'", {
        cwd: repoRoot,
        timeout: 30000,
      });

      try {
        // Switch to target branch
        await execAsync(`git checkout ${targetBranch}`, {
          cwd: repoRoot,
          timeout: 30000,
        });

        // Apply stashed changes
        await execAsync("git stash pop", { cwd: repoRoot, timeout: 30000 });

        // Stage and commit
        await execAsync("git add -A", { cwd: repoRoot, timeout: 30000 });
        await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
          cwd: repoRoot,
          timeout: 30000,
        });

        const commitResult = `Committed to ${targetBranch}: ${message}`;

        // Switch back to original branch
        await execAsync(`git checkout ${originalBranch}`, {
          cwd: repoRoot,
          timeout: 30000,
        });

        return commitResult;
      } catch (error) {
        // Try to recover - switch back to original branch
        await execAsync(`git checkout ${originalBranch}`, {
          cwd: repoRoot,
          timeout: 30000,
        }).catch(() => {});
        throw error;
      }
    }

    // No target branch specified, commit on current branch
    await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: repoRoot,
      timeout: 30000,
    });

    return `Committed: ${message}`;
  } catch (error) {
    const err = error as { message?: string };
    throw new Error(`Failed to commit: ${err.message}`);
  }
}

/**
 * Push branch and create PR
 */
export async function createPullRequest(
  title: string,
  body: string,
  branchName: string
): Promise<{ prUrl: string; prNumber: number }> {
  const client = getOctokit();

  try {
    // Push branch to remote
    await execAsync(`git push -u origin ${branchName}`, {
      cwd: getRepoRoot(),
      timeout: 60000,
    });

    // Create PR via GitHub API
    const { data: pr } = await client.pulls.create({
      owner: getGithubOwner(),
      repo: getGithubRepo(),
      title,
      body: body + "\n\n---\n🤖 Created by Forge AI Agent",
      head: branchName,
      base: "main",
    });

    return {
      prUrl: pr.html_url,
      prNumber: pr.number,
    };
  } catch (error) {
    const err = error as { message?: string };
    throw new Error(`Failed to create PR: ${err.message}`);
  }
}

// =============================================================================
// Tool Executor
// =============================================================================

export interface ToolContext {
  executionId: string;
  ticketId: string;
  ticketIdentifier: string;
  branchName?: string;
  prUrl?: string;
  prNumber?: number;
}

/**
 * Execute a tool call with real implementations
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  context: ToolContext
): Promise<string> {
  console.log(`[${context.executionId}] Tool: ${name}`, JSON.stringify(input).slice(0, 200));

  switch (name) {
    case "read_file":
      return readFile(input.path as string);

    case "write_file":
      return writeFile(input.path as string, input.content as string);

    case "list_files":
      return listFiles(input.path as string, input.pattern as string | undefined);

    case "search_code":
      return searchCode(input.pattern as string, input.path as string | undefined);

    case "run_command":
      return runCommand(input.command as string);

    case "create_branch": {
      const branchName = input.name as string || context.ticketIdentifier;
      const result = await createBranch(branchName, context.ticketIdentifier);
      // Store branch name in context for later use
      context.branchName = `forge/${context.ticketIdentifier.toLowerCase()}/${branchName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
      return result;
    }

    case "commit_changes":
      console.log(`[executeTool] commit_changes called with context.branchName=${context.branchName}`);
      return commitChanges(input.message as string, context.branchName);

    case "create_pr": {
      if (!context.branchName) {
        throw new Error("No branch created yet. Use create_branch first.");
      }
      const { prUrl, prNumber } = await createPullRequest(
        input.title as string,
        input.body as string || "",
        context.branchName
      );
      // Store PR info in context for ticket update
      context.prUrl = prUrl;
      context.prNumber = prNumber;
      return `Created PR #${prNumber}: ${prUrl}`;
    }

    case "complete_task":
      return `Task completed: ${input.summary}`;

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// =============================================================================
// Health Check
// =============================================================================

export function checkToolsHealth(): {
  fileSystemAccess: boolean;
  gitAccess: boolean;
  githubAccess: boolean;
  repoRoot: string;
} {
  return {
    fileSystemAccess: true, // Would check fs access
    gitAccess: true, // Would check git is available
    githubAccess: !!getGithubToken(),
    repoRoot: getRepoRoot(),
  };
}
