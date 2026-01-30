/**
 * Forge Agent Orchestrator
 *
 * Manages the execution of AI agents against tickets.
 * Handles the full lifecycle: start, checkpoint, pause, resume, complete.
 */

import {
  db,
  forgeAgentExecutions,
  forgeTickets,
  forgeTokenUsage,
  eq,
} from "@axori/db";
import {
  getAnthropicClient,
  type ClaudeModel,
  type ToolDefinition,
} from "./anthropic";
import { executeTool, type ToolContext } from "./tools";

// =============================================================================
// Types
// =============================================================================

interface ExecutionContext {
  executionId: string;
  ticketId: string;
  ticketIdentifier: string;
  ticketTitle: string;
  ticketDescription: string | null;
  protocol: string;
  prompt: string;
}

interface ProtocolConfig {
  model: ClaudeModel;
  maxTokens: number;
  systemPrompt: string;
  tools: Array<ToolDefinition>;
}

// =============================================================================
// Protocol Configurations
// =============================================================================

const PROTOCOL_CONFIGS: Record<string, ProtocolConfig> = {
  opus_full_feature: {
    model: "claude-opus-4-5-20251101",
    maxTokens: 8192,
    systemPrompt: `You are an expert software engineer working on implementing a feature.
You have access to tools to read files, write files, and run commands.
Your goal is to fully implement the feature described in the ticket.

Guidelines:
- Start by understanding the codebase structure
- Plan your implementation before coding
- Write clean, well-tested code
- Follow existing code patterns and conventions
- Create a git branch for your changes
- Commit your work with clear messages`,
    tools: getBasicTools(),
  },
  sonnet_implementation: {
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 8192,
    systemPrompt: `You are an experienced software engineer implementing a feature.
You have access to tools to read files, write files, and run commands.
Focus on clean, efficient implementation.

Guidelines:
- Understand existing patterns before coding
- Write maintainable code
- Include appropriate error handling
- Follow the project's coding standards`,
    tools: getBasicTools(),
  },
  sonnet_bug_fix: {
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 8192,
    systemPrompt: `You are an experienced software engineer debugging an issue.
You have access to tools to read files, write files, and run commands.
Focus on understanding the root cause before fixing.

Guidelines:
- Reproduce the issue first
- Understand the root cause
- Fix the issue without breaking other functionality
- Add tests to prevent regression`,
    tools: getBasicTools(),
  },
  haiku_quick_edit: {
    model: "claude-haiku-4-5-20251001",
    maxTokens: 4096,
    systemPrompt: `You are a helpful assistant making quick edits to code.
You have access to tools to read and write files.
Focus on making the specific change requested efficiently.`,
    tools: getBasicTools(),
  },
  haiku_docs: {
    model: "claude-haiku-4-5-20251001",
    maxTokens: 4096,
    systemPrompt: `You are a technical writer improving documentation.
You have access to tools to read and write files.
Focus on clear, helpful documentation.`,
    tools: getBasicTools(),
  },
};

// Default config for unknown protocols
const DEFAULT_CONFIG: ProtocolConfig = {
  model: "claude-sonnet-4-5-20250929",
  maxTokens: 8192,
  systemPrompt: `You are a helpful software engineer assistant.
Complete the task described in the ticket.`,
  tools: getBasicTools(),
};

// =============================================================================
// Tool Definitions
// =============================================================================

function getBasicTools(): Array<ToolDefinition> {
  return [
    {
      name: "read_file",
      description: "Read the contents of a file",
      input_schema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The file path to read",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "write_file",
      description: "Write content to a file",
      input_schema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The file path to write",
          },
          content: {
            type: "string",
            description: "The content to write",
          },
        },
        required: ["path", "content"],
      },
    },
    {
      name: "list_files",
      description: "List files in a directory",
      input_schema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The directory path to list",
          },
          pattern: {
            type: "string",
            description: "Optional glob pattern to filter files",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "search_code",
      description: "Search for a pattern in files",
      input_schema: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "The search pattern (regex)",
          },
          path: {
            type: "string",
            description: "The directory to search in",
          },
        },
        required: ["pattern"],
      },
    },
    {
      name: "run_command",
      description: "Run a shell command",
      input_schema: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The command to run",
          },
        },
        required: ["command"],
      },
    },
    {
      name: "complete_task",
      description:
        "Mark the task as complete with a summary of what was done",
      input_schema: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Summary of the work completed",
          },
          files_changed: {
            type: "array",
            items: { type: "string" },
            description: "List of files that were modified",
          },
        },
        required: ["summary"],
      },
    },
  ];
}

// =============================================================================
// Tool Executor
// =============================================================================

// Store execution state (branch names, PR info) per execution
const executionBranches = new Map<string, string>();
const executionPRs = new Map<string, { prUrl: string; prNumber: number }>();

/**
 * Execute a tool call with real implementations
 */
async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
  context: ExecutionContext
): Promise<string> {
  // Build tool context
  const toolContext: ToolContext = {
    executionId: context.executionId,
    ticketId: context.ticketId,
    ticketIdentifier: context.ticketIdentifier,
    branchName: executionBranches.get(context.executionId),
  };

  // Execute the tool
  const result = await executeTool(name, input, toolContext);

  // Store branch name if one was created
  if (toolContext.branchName && !executionBranches.has(context.executionId)) {
    executionBranches.set(context.executionId, toolContext.branchName);
  }

  // Store PR info if a PR was created
  if (toolContext.prUrl && toolContext.prNumber) {
    executionPRs.set(context.executionId, {
      prUrl: toolContext.prUrl,
      prNumber: toolContext.prNumber,
    });
  }

  return result;
}

// =============================================================================
// Orchestrator
// =============================================================================

/**
 * Start executing an agent for a ticket
 */
export async function startExecution(executionId: string): Promise<void> {
  const client = getAnthropicClient();

  if (!client.isConfigured()) {
    throw new Error("Anthropic API key not configured");
  }

  // Get execution and ticket details
  const [result] = await db
    .select({
      execution: forgeAgentExecutions,
      ticket: forgeTickets,
    })
    .from(forgeAgentExecutions)
    .leftJoin(forgeTickets, eq(forgeAgentExecutions.ticketId, forgeTickets.id))
    .where(eq(forgeAgentExecutions.id, executionId))
    .limit(1);

  if (!result || !result.ticket) {
    throw new Error("Execution or ticket not found");
  }

  const { execution, ticket } = result;

  // Update status to running
  await db
    .update(forgeAgentExecutions)
    .set({
      status: "running",
      startedAt: new Date(),
    })
    .where(eq(forgeAgentExecutions.id, executionId));

  // Get protocol config
  const config = PROTOCOL_CONFIGS[execution.protocol] || DEFAULT_CONFIG;

  // Build context
  const context: ExecutionContext = {
    executionId,
    ticketId: ticket.id,
    ticketIdentifier: ticket.identifier,
    ticketTitle: ticket.title || "",
    ticketDescription: ticket.description,
    protocol: execution.protocol,
    prompt: execution.prompt,
  };

  // Build the user message
  const userMessage = buildUserMessage(context);

  try {
    // Execute with tools
    const result = await client.executeWithTools(
      {
        model: config.model,
        max_tokens: config.maxTokens,
        system: config.systemPrompt,
        messages: [{ role: "user", content: userMessage }],
        tools: config.tools,
      },
      (name, input) => executeToolCall(name, input, context),
      {
        maxIterations: 30,
        onToolUse: async (name, input) => {
          console.log(`[${executionId}] Tool use: ${name}`, input);
          // Save tool call to execution log for UI monitoring
          await appendToExecutionLog(executionId, `🔧 ${name}: ${JSON.stringify(input).slice(0, 200)}`);
        },
        onIteration: async (iteration, messages) => {
          // Save checkpoint every 5 iterations
          if (iteration % 5 === 0) {
            await saveCheckpoint(executionId, iteration, messages);
          }
        },
      }
    );

    // Log token usage
    await logTokenUsage(executionId, config.model, result);

    // Update execution as completed
    await db
      .update(forgeAgentExecutions)
      .set({
        status: "completed",
        completedAt: new Date(),
        executionLog: result.finalResponse,
        tokensUsed: result.totalInputTokens + result.totalOutputTokens,
      })
      .where(eq(forgeAgentExecutions.id, executionId));

    // Get PR info if created
    const prInfo = executionPRs.get(executionId);
    const branchName = executionBranches.get(executionId);

    // Update ticket: clear agent, add PR info, move to in_review if PR created
    await db
      .update(forgeTickets)
      .set({
        assignedAgent: null,
        agentSessionId: null,
        // If PR was created, link it and move to in_review
        ...(prInfo && {
          prUrl: prInfo.prUrl,
          prNumber: prInfo.prNumber,
          status: "in_review",
        }),
        // Store branch name if created
        ...(branchName && { branchName }),
        updatedAt: new Date(),
      })
      .where(eq(forgeTickets.id, context.ticketId));

    // Clean up execution state
    executionBranches.delete(executionId);
    executionPRs.delete(executionId);

    console.log(`[${executionId}] Execution completed successfully${prInfo ? ` - PR #${prInfo.prNumber}` : ""}`);
  } catch (error) {
    console.error(`[${executionId}] Execution failed:`, error);

    // Update execution as failed
    await db
      .update(forgeAgentExecutions)
      .set({
        status: "failed",
        completedAt: new Date(),
        executionLog:
          error instanceof Error ? error.message : "Unknown error occurred",
      })
      .where(eq(forgeAgentExecutions.id, executionId));

    // Clear agent from ticket (keep in_progress status for manual handling)
    await db
      .update(forgeTickets)
      .set({
        assignedAgent: null,
        agentSessionId: null,
        updatedAt: new Date(),
      })
      .where(eq(forgeTickets.id, context.ticketId));

    // Clean up execution state
    executionBranches.delete(executionId);
    executionPRs.delete(executionId);

    throw error;
  }
}

/**
 * Build the user message for the agent
 */
function buildUserMessage(context: ExecutionContext): string {
  return `# Task: ${context.ticketIdentifier} - ${context.ticketTitle}

${context.ticketDescription ? `## Description\n${context.ticketDescription}\n\n` : ""}## Additional Context
${context.prompt}

Please complete this task. Use the available tools to read files, make changes, and complete the work.
When you're done, use the complete_task tool to summarize what you did.`;
}

/**
 * Append a message to the execution log for real-time monitoring
 */
async function appendToExecutionLog(
  executionId: string,
  message: string
): Promise<void> {
  const timestamp = new Date().toISOString().slice(11, 19);
  const logEntry = `[${timestamp}] ${message}\n`;

  // Get current log and append
  const [current] = await db
    .select({ log: forgeAgentExecutions.executionLog })
    .from(forgeAgentExecutions)
    .where(eq(forgeAgentExecutions.id, executionId))
    .limit(1);

  const newLog = (current?.log || '') + logEntry;

  await db
    .update(forgeAgentExecutions)
    .set({ executionLog: newLog })
    .where(eq(forgeAgentExecutions.id, executionId));
}

/**
 * Save a checkpoint for the execution
 */
async function saveCheckpoint(
  executionId: string,
  step: number,
  messages: Array<{ role: string; content: unknown }>
): Promise<void> {
  await db
    .update(forgeAgentExecutions)
    .set({
      checkpointStep: step,
      checkpointData: { messages },
    })
    .where(eq(forgeAgentExecutions.id, executionId));
}

/**
 * Log token usage for billing tracking
 */
async function logTokenUsage(
  executionId: string,
  model: string,
  result: {
    totalInputTokens: number;
    totalOutputTokens: number;
  }
): Promise<void> {
  // Calculate cost based on model pricing (approximate)
  const pricing: Record<string, { input: number; output: number }> = {
    "claude-opus-4-5-20251101": { input: 15, output: 75 }, // per million tokens
    "claude-sonnet-4-5-20250929": { input: 3, output: 15 },
    "claude-haiku-4-5-20251001": { input: 0.25, output: 1.25 },
  };

  const modelPricing = pricing[model] || pricing["claude-sonnet-4-5-20250929"];
  const costCents = Math.ceil(
    (result.totalInputTokens * modelPricing.input +
      result.totalOutputTokens * modelPricing.output) /
      10000
  );

  await db.insert(forgeTokenUsage).values({
    executionId,
    model,
    inputTokens: result.totalInputTokens,
    outputTokens: result.totalOutputTokens,
    costCents,
  });
}

/**
 * Check the health of the orchestrator
 */
export async function checkHealth(): Promise<{
  configured: boolean;
  message: string;
}> {
  const client = getAnthropicClient();

  if (!client.isConfigured()) {
    return {
      configured: false,
      message: "ANTHROPIC_API_KEY not configured",
    };
  }

  return {
    configured: true,
    message: "Orchestrator ready",
  };
}
