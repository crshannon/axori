/**
 * Agent Tools
 *
 * Defines the tools available to agents for interacting with the codebase,
 * GitHub, and the Forge registry/decisions system.
 */

import type { ToolDefinition } from "./anthropic"
import { getGitHubClient } from "../github/client"
import { db, forgeRegistry, forgeDecisions, eq, and, sql } from "@axori/db"

// =============================================================================
// TOOL DEFINITIONS (for Anthropic API)
// =============================================================================

export const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  read_file: {
    name: "read_file",
    description:
      "Read the contents of a file from the repository. Returns the file content as a string.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the file relative to repository root",
        },
        branch: {
          type: "string",
          description: "Optional branch name. Defaults to the working branch.",
        },
      },
      required: ["path"],
    },
  },

  write_file: {
    name: "write_file",
    description:
      "Write or update a file in the repository. Creates the file if it doesn't exist.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the file relative to repository root",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
        message: {
          type: "string",
          description: "The commit message for this change",
        },
      },
      required: ["path", "content", "message"],
    },
  },

  list_directory: {
    name: "list_directory",
    description: "List the contents of a directory in the repository.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The path to the directory relative to repository root",
        },
        branch: {
          type: "string",
          description: "Optional branch name. Defaults to the working branch.",
        },
      },
      required: ["path"],
    },
  },

  search_codebase: {
    name: "search_codebase",
    description:
      "Search for code in the repository. Returns file paths containing the search term.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        path: {
          type: "string",
          description: "Optional path to limit search to",
        },
        extension: {
          type: "string",
          description: "Optional file extension filter (e.g., 'ts', 'tsx')",
        },
      },
      required: ["query"],
    },
  },

  run_command: {
    name: "run_command",
    description:
      "Run a shell command. Use for build, test, lint commands only. Limited to safe commands.",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description:
            "The command to run. Must be a safe command (pnpm, npm, git status, etc.)",
        },
        cwd: {
          type: "string",
          description: "Working directory for the command. Defaults to repository root.",
        },
      },
      required: ["command"],
    },
  },

  create_branch: {
    name: "create_branch",
    description:
      "Create a new git branch from the default branch. Returns branch info.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "The branch name. Should follow pattern: feature/AXO-XXX-description or fix/AXO-XXX-description",
        },
        base: {
          type: "string",
          description: "Optional base branch. Defaults to the default branch.",
        },
      },
      required: ["name"],
    },
  },

  create_pr: {
    name: "create_pr",
    description: "Create a pull request for the current branch.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The PR title. Should be descriptive and include ticket ID.",
        },
        body: {
          type: "string",
          description:
            "The PR description. Include summary, changes made, and testing notes.",
        },
        head: {
          type: "string",
          description: "The branch containing changes",
        },
        base: {
          type: "string",
          description: "The target branch. Defaults to the default branch.",
        },
        draft: {
          type: "boolean",
          description: "Whether to create as draft PR. Defaults to false.",
        },
      },
      required: ["title", "body", "head"],
    },
  },

  get_registry: {
    name: "get_registry",
    description:
      "Query the Forge registry for existing components, hooks, utilities, and APIs. Use this to check what already exists before creating new code.",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["component", "hook", "utility", "api", "table", "integration"],
          description: "Filter by registry item type",
        },
        search: {
          type: "string",
          description: "Search term to filter by name or description",
        },
        status: {
          type: "string",
          enum: ["active", "deprecated", "planned"],
          description: "Filter by status. Defaults to active.",
        },
      },
    },
  },

  get_decisions: {
    name: "get_decisions",
    description:
      "Get relevant architectural decisions that should inform your implementation. Always check this before starting implementation.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: [
            "code_standards",
            "architecture",
            "testing",
            "design",
            "process",
            "tooling",
            "product",
            "performance",
          ],
          description: "Filter by decision category",
        },
        scope: {
          type: "string",
          description:
            "Scope tag to filter by (e.g., 'api', 'validation', 'hooks', 'components')",
        },
      },
    },
  },
}

// =============================================================================
// TOOL EXECUTORS
// =============================================================================

export type ToolExecutor = (input: Record<string, unknown>) => Promise<string>

// Safe commands that can be run
const SAFE_COMMANDS = [
  "pnpm",
  "npm",
  "yarn",
  "node",
  "npx",
  "git status",
  "git log",
  "git diff",
  "git branch",
  "tsc",
  "vitest",
  "jest",
  "eslint",
  "prettier",
  "ls",
  "cat",
  "head",
  "tail",
  "grep",
  "find",
  "wc",
  "echo",
]

function isCommandSafe(command: string): boolean {
  const trimmedCommand = command.trim().toLowerCase()
  return SAFE_COMMANDS.some(
    (safe) =>
      trimmedCommand.startsWith(safe.toLowerCase()) ||
      trimmedCommand.startsWith(`${safe.toLowerCase()} `)
  )
}

/**
 * Create tool executors with context
 */
export function createToolExecutors(context: {
  workingBranch: string
  ticketId: string
}): Record<string, ToolExecutor> {
  const github = getGitHubClient()

  return {
    read_file: async (input) => {
      const path = input.path as string
      const branch = (input.branch as string) || context.workingBranch

      const content = await github.getFileContent(path, branch)
      if (content === null) {
        return `Error: File not found at '${path}'`
      }
      return content
    },

    write_file: async (input) => {
      const path = input.path as string
      const content = input.content as string
      const message = input.message as string

      const commit = await github.createOrUpdateFile(
        path,
        content,
        `${message} [${context.ticketId}]`,
        context.workingBranch
      )
      return `File written successfully. Commit: ${commit.sha}`
    },

    list_directory: async (input) => {
      const path = input.path as string
      const branch = (input.branch as string) || context.workingBranch

      const contents = await github.listDirectory(path, branch)
      const formatted = contents
        .map((item) => `${item.type === "dir" ? "d" : "f"} ${item.name}`)
        .join("\n")
      return formatted || "Empty directory"
    },

    search_codebase: async (input) => {
      const query = input.query as string
      const path = input.path as string | undefined
      const extension = input.extension as string | undefined

      const results = await github.searchCode(query, { path, extension })
      if (results.length === 0) {
        return "No results found"
      }
      return results.map((r) => r.path).join("\n")
    },

    run_command: async (input) => {
      const command = input.command as string

      if (!isCommandSafe(command)) {
        return `Error: Command not allowed. Only safe commands are permitted: ${SAFE_COMMANDS.join(", ")}`
      }

      // In a real implementation, this would execute the command
      // For now, return a placeholder
      return `Command execution not implemented in this environment. Would run: ${command}`
    },

    create_branch: async (input) => {
      const name = input.name as string
      const base = input.base as string | undefined

      const branch = await github.createBranch(name, base)
      return `Branch '${branch.name}' created from SHA ${branch.sha}`
    },

    create_pr: async (input) => {
      const title = input.title as string
      const body = input.body as string
      const head = input.head as string
      const base = input.base as string | undefined
      const draft = (input.draft as boolean) ?? false

      // Add ticket reference and Forge attribution to PR body
      const fullBody = `${body}

---
*Created by Forge for [${context.ticketId}]*`

      const pr = await github.createPullRequest({
        title: `${title} [${context.ticketId}]`,
        body: fullBody,
        head,
        base,
        draft,
      })

      return `Pull request #${pr.number} created: ${pr.html_url}`
    },

    get_registry: async (input) => {
      const type = input.type as string | undefined
      const search = input.search as string | undefined
      const status = (input.status as string) || "active"

      let query = db.select().from(forgeRegistry).$dynamic()

      const conditions = []
      if (type) {
        // Cast type to expected enum value
        conditions.push(sql`${forgeRegistry.type} = ${type}`)
      }
      if (status) {
        // Cast status to expected enum value
        conditions.push(sql`${forgeRegistry.status} = ${status}`)
      }
      if (search) {
        conditions.push(
          sql`(${forgeRegistry.name} ILIKE ${`%${search}%`} OR ${forgeRegistry.description} ILIKE ${`%${search}%`})`
        )
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions))
      }

      const results = await query.limit(20)

      if (results.length === 0) {
        return "No registry items found matching criteria"
      }

      return results
        .map(
          (item) =>
            `[${item.type}] ${item.name}\n  Path: ${item.filePath}\n  Description: ${item.description || "N/A"}\n  Exports: ${item.exports?.join(", ") || "N/A"}`
        )
        .join("\n\n")
    },

    get_decisions: async (input) => {
      const category = input.category as string | undefined
      const scope = input.scope as string | undefined

      let query = db
        .select()
        .from(forgeDecisions)
        .where(eq(forgeDecisions.active, true))
        .$dynamic()

      if (category) {
        // Cast category to expected enum value
        query = query.where(sql`${forgeDecisions.category} = ${category}`)
      }

      if (scope) {
        query = query.where(sql`${forgeDecisions.scope} @> ARRAY[${scope}]::text[]`)
      }

      const results = await query.limit(20)

      if (results.length === 0) {
        return "No relevant decisions found"
      }

      return results
        .map(
          (decision) =>
            `[${decision.identifier}] ${decision.decision}\n  Category: ${decision.category}\n  Context: ${decision.context || "N/A"}\n  Scope: ${decision.scope?.join(", ") || "All"}`
        )
        .join("\n\n")
    },
  }
}

/**
 * Get tool definitions for a list of tool names
 */
export function getToolDefinitions(toolNames: string[]): ToolDefinition[] {
  return toolNames
    .filter((name) => name in TOOL_DEFINITIONS)
    .map((name) => TOOL_DEFINITIONS[name])
}
