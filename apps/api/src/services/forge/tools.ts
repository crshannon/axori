/**
 * Forge Agent Tools
 *
 * Real implementations of tools that agents can use to interact
 * with the codebase, run commands, and manage git operations.
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { Octokit } from "@octokit/rest";

const execAsync = promisify(exec);

// =============================================================================
// Configuration
// =============================================================================

// The root directory of the codebase - agents work within this directory
// Use a getter to ensure env is read after it's loaded
function getRepoRoot(): string {
  return process.env.FORGE_getRepoRoot() || process.cwd();
}

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "axori";
const GITHUB_REPO = process.env.GITHUB_REPO || "axori";

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
  const firstWord = command.trim().split(/\s+/)[0];
  return ALLOWED_COMMANDS.includes(firstWord);
}

// =============================================================================
// File Tools
// =============================================================================

/**
 * Read a file's contents
 */
export async function readFile(filePath: string): Promise<string> {
  const resolved = safePath(filePath);

  try {
    const content = await fs.readFile(resolved, "utf-8");
    // Truncate very large files
    if (content.length > 100000) {
      return content.slice(0, 100000) + "\n\n[File truncated - showing first 100k characters]";
    }
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
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
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN not configured");
  }
  if (!octokit) {
    octokit = new Octokit({ auth: GITHUB_TOKEN });
  }
  return octokit;
}

/**
 * Create a new git branch
 */
export async function createBranch(branchName: string, ticketId: string): Promise<string> {
  // Sanitize branch name
  const safeBranch = branchName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");

  const fullBranchName = `forge/${ticketId.toLowerCase()}/${safeBranch}`;

  try {
    // First, commit any staged changes and create branch locally
    await execAsync(`git checkout -b ${fullBranchName}`, {
      cwd: getRepoRoot(),
      timeout: 30000,
    });

    return `Created branch: ${fullBranchName}`;
  } catch (error) {
    const err = error as { message?: string };
    throw new Error(`Failed to create branch: ${err.message}`);
  }
}

/**
 * Commit changes
 */
export async function commitChanges(message: string): Promise<string> {
  try {
    // Stage all changes
    await execAsync("git add -A", { cwd: getRepoRoot(), timeout: 30000 });

    // Check if there are changes to commit
    const { stdout: status } = await execAsync("git status --porcelain", {
      cwd: getRepoRoot(),
      timeout: 30000,
    });

    if (!status.trim()) {
      return "No changes to commit";
    }

    // Commit
    await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: getRepoRoot(),
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
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
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
      return commitChanges(input.message as string);

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
    githubAccess: !!GITHUB_TOKEN,
    repoRoot: getRepoRoot(),
  };
}
