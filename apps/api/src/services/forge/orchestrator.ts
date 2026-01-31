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
import { getRateLimiter, estimateProtocolTokens } from "./rate-limiter";
import {
  matchDecisionsForTicket,
  formatDecisionsForPrompt,
} from "./decisions";

// =============================================================================
// Types
// =============================================================================

interface ExecutionContext {
  executionId: string;
  ticketId: string;
  ticketIdentifier: string;
  ticketTitle: string;
  ticketDescription: string | null;
  ticketType: string | null;
  ticketLabels: Array<string> | null;
  protocol: string;
  prompt: string;
  // Existing branch/PR info to prevent duplicates
  existingBranch: string | null;
  existingPrUrl: string | null;
  existingPrNumber: number | null;
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
You have access to tools to read files, write files, run commands, and manage git operations.
Your goal is to fully implement the feature described in the ticket.

Guidelines:
- Start by understanding the codebase structure
- Plan your implementation before coding
- Write clean, well-tested code
- Follow existing code patterns and conventions

Git Workflow (REQUIRED for all changes):
1. First, create a branch using create_branch with a descriptive name
2. Make your code changes using write_file
3. Commit your changes using commit_changes with a clear message
4. Create a PR using create_pr with a descriptive title and body
5. Finally, call complete_task to summarize what was done`,
    tools: getBasicTools(),
  },
  sonnet_implementation: {
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 8192,
    systemPrompt: `You are an experienced software engineer implementing a feature.
You have access to tools to read files, write files, run commands, and manage git operations.
Focus on clean, efficient implementation.

Guidelines:
- Understand existing patterns before coding
- Write maintainable code
- Include appropriate error handling
- Follow the project's coding standards

Git Workflow (REQUIRED for all changes):
1. First, create a branch using create_branch with a descriptive name
2. Make your code changes using write_file
3. Commit your changes using commit_changes with a clear message
4. Create a PR using create_pr with a descriptive title and body
5. Finally, call complete_task to summarize what was done`,
    tools: getBasicTools(),
  },
  sonnet_bug_fix: {
    model: "claude-sonnet-4-5-20250929",
    maxTokens: 8192,
    systemPrompt: `You are an experienced software engineer debugging an issue.
You have access to tools to read files, write files, run commands, and manage git operations.
Focus on understanding the root cause before fixing.

Guidelines:
- Reproduce the issue first
- Understand the root cause
- Fix the issue without breaking other functionality
- Add tests to prevent regression

Git Workflow (REQUIRED for all changes):
1. First, create a branch using create_branch with a descriptive name
2. Make your code changes using write_file
3. Commit your changes using commit_changes with a clear message
4. Create a PR using create_pr with a descriptive title and body
5. Finally, call complete_task to summarize what was done`,
    tools: getBasicTools(),
  },
  haiku_quick_edit: {
    model: "claude-haiku-4-5-20251001",
    maxTokens: 4096,
    systemPrompt: `You are a helpful assistant making quick edits to code.
You have access to tools to read and write files, and manage git operations.
Focus on making the specific change requested efficiently.

Git Workflow (REQUIRED for all changes):
1. First, create a branch using create_branch with a descriptive name
2. Make your code changes using write_file
3. Commit your changes using commit_changes with a clear message
4. Create a PR using create_pr with a descriptive title and body
5. Finally, call complete_task to summarize what was done`,
    tools: getBasicTools(),
  },
  haiku_docs: {
    model: "claude-haiku-4-5-20251001",
    maxTokens: 4096,
    systemPrompt: `You are a technical writer improving documentation.
You have access to tools to read and write files, and manage git operations.
Focus on clear, helpful documentation.

Git Workflow (REQUIRED for all changes):
1. First, create a branch using create_branch with a descriptive name
2. Make your code changes using write_file
3. Commit your changes using commit_changes with a clear message
4. Create a PR using create_pr with a descriptive title and body
5. Finally, call complete_task to summarize what was done`,
    tools: getBasicTools(),
  },
};

// Default config for unknown protocols
const DEFAULT_CONFIG: ProtocolConfig = {
  model: "claude-sonnet-4-5-20250929",
  maxTokens: 8192,
  systemPrompt: `You are a helpful software engineer assistant.
Complete the task described in the ticket.

Git Workflow (REQUIRED for all changes):
1. First, create a branch using create_branch with a descriptive name
2. Make your code changes using write_file
3. Commit your changes using commit_changes with a clear message
4. Create a PR using create_pr with a descriptive title and body
5. Finally, call complete_task to summarize what was done`,
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
    {
      name: "create_branch",
      description: "Create a new git branch for this ticket. The branch will be named forge/{ticket-id}/{name}. IMPORTANT: Do NOT call this if a branch already exists for this ticket - check the ticket context first.",
      input_schema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Short descriptive name for the branch (will be slugified)",
          },
        },
        required: ["name"],
      },
    },
    {
      name: "commit_changes",
      description: "Stage all changes and create a git commit",
      input_schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The commit message",
          },
        },
        required: ["message"],
      },
    },
    {
      name: "create_pr",
      description: "Push the branch and create a pull request on GitHub",
      input_schema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The PR title",
          },
          body: {
            type: "string",
            description: "The PR description/body",
          },
        },
        required: ["title"],
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

  // Get rate limiter
  const rateLimiter = getRateLimiter();

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

  // Check rate limiter and wait for capacity
  const estimatedTokens = estimateProtocolTokens(execution.protocol);
  console.log(
    `[${executionId}] Checking rate limit capacity for ${execution.protocol} (est. ${estimatedTokens} tokens)`
  );
  await rateLimiter.waitForCapacity(executionId, estimatedTokens);
  console.log(`[${executionId}] Rate limit check passed, starting execution`);

  // Build context
  const context: ExecutionContext = {
    executionId,
    ticketId: ticket.id,
    ticketIdentifier: ticket.identifier,
    ticketTitle: ticket.title || "",
    ticketDescription: ticket.description,
    ticketType: ticket.type,
    ticketLabels: ticket.labels,
    protocol: execution.protocol,
    prompt: execution.prompt,
    // Include existing branch/PR info to prevent duplicates
    existingBranch: ticket.branchName,
    existingPrUrl: ticket.prUrl,
    existingPrNumber: ticket.prNumber,
  };

  // If ticket already has a branch, pre-populate the execution state
  // This prevents the agent from creating a duplicate branch
  if (ticket.branchName) {
    console.log(`[${executionId}] Ticket already has branch: ${ticket.branchName}`);
    executionBranches.set(executionId, ticket.branchName);
  }

  // If ticket already has PR info, pre-populate that too
  if (ticket.prUrl && ticket.prNumber) {
    console.log(`[${executionId}] Ticket already has PR: #${ticket.prNumber}`);
    executionPRs.set(executionId, {
      prUrl: ticket.prUrl,
      prNumber: ticket.prNumber,
    });
  }

  // Build the user message
  const userMessage = await buildUserMessage(context);

  // Pre-flight token estimate
  const toolsJsonSize = JSON.stringify(config.tools).length;
  const systemPromptSize = config.systemPrompt.length;
  const userMessageSize = userMessage.length;
  const estimatedInputTokens = Math.ceil((toolsJsonSize + systemPromptSize + userMessageSize) / 4);

  console.log(`[${executionId}] Pre-flight token estimate:`);
  console.log(`  - Tools: ~${Math.ceil(toolsJsonSize / 4)} tokens`);
  console.log(`  - System prompt: ~${Math.ceil(systemPromptSize / 4)} tokens`);
  console.log(`  - User message: ~${Math.ceil(userMessageSize / 4)} tokens`);
  console.log(`  - Total estimate: ~${estimatedInputTokens} tokens`);

  // Warn if estimate is high (Haiku limit is often 50k TPM)
  if (estimatedInputTokens > 40000) {
    console.warn(`[${executionId}] WARNING: High token estimate (${estimatedInputTokens}). May hit rate limits.`);
  }

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

    // Log token usage and record with rate limiter
    const totalTokens = result.totalInputTokens + result.totalOutputTokens;
    rateLimiter.recordUsage(executionId, totalTokens);
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

    // Build execution history entry
    const historyEntry = {
      executionId,
      protocol: context.protocol,
      status: "completed" as const,
      summary: result.finalResponse?.slice(0, 500) || "Execution completed",
      completedAt: new Date().toISOString(),
      tokensUsed: result.totalInputTokens + result.totalOutputTokens,
    };

    // Get current execution history
    const [currentTicket] = await db
      .select({ executionHistory: forgeTickets.executionHistory })
      .from(forgeTickets)
      .where(eq(forgeTickets.id, context.ticketId))
      .limit(1);

    const updatedHistory = [
      ...(currentTicket?.executionHistory || []),
      historyEntry,
    ];

    // Update ticket: clear agent, add PR info, move to in_review if PR created
    await db
      .update(forgeTickets)
      .set({
        assignedAgent: null,
        agentSessionId: null,
        lastExecutionId: executionId,
        executionHistory: updatedHistory,
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

    // Build failed execution history entry
    const failedHistoryEntry = {
      executionId,
      protocol: context.protocol,
      status: "failed" as const,
      summary: error instanceof Error ? error.message : "Unknown error occurred",
      completedAt: new Date().toISOString(),
    };

    // Get current execution history
    const [currentTicketOnFail] = await db
      .select({ executionHistory: forgeTickets.executionHistory })
      .from(forgeTickets)
      .where(eq(forgeTickets.id, context.ticketId))
      .limit(1);

    const updatedFailHistory = [
      ...(currentTicketOnFail?.executionHistory || []),
      failedHistoryEntry,
    ];

    // Clear agent from ticket (keep in_progress status for manual handling)
    await db
      .update(forgeTickets)
      .set({
        assignedAgent: null,
        agentSessionId: null,
        lastExecutionId: executionId,
        executionHistory: updatedFailHistory,
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
 * Truncate text to fit within a token budget
 * Rough estimate: 4 characters ≈ 1 token
 */
function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars - 50) + `\n\n[... truncated to ${maxTokens} tokens]`;
}

/**
 * Build the user message for the agent with token limits
 *
 * Token budget breakdown (for ~8k total user message):
 * - Title/structure: ~100 tokens
 * - Description: max 3000 tokens
 * - Additional context: max 4000 tokens
 * - Instructions: ~100 tokens
 */
async function buildUserMessage(context: ExecutionContext): Promise<string> {
  // Truncate description and prompt to prevent token explosion
  const description = context.ticketDescription
    ? truncateToTokens(context.ticketDescription, 3000)
    : "";
  const additionalContext = truncateToTokens(context.prompt, 4000);

  // Build existing work section if branch/PR already exists
  let existingWorkSection = "";
  if (context.existingBranch || context.existingPrUrl) {
    existingWorkSection = "\n## Existing Work (DO NOT DUPLICATE)\n";
    if (context.existingBranch) {
      existingWorkSection += `- **Branch already exists**: \`${context.existingBranch}\` - DO NOT create a new branch, work on this existing branch instead\n`;
    }
    if (context.existingPrUrl && context.existingPrNumber) {
      existingWorkSection += `- **PR already exists**: #${context.existingPrNumber} (${context.existingPrUrl}) - DO NOT create a new PR, update the existing one if needed\n`;
    }
    existingWorkSection += "\n";
  }

  // Fetch and format relevant decisions
  let decisionsSection = "";
  try {
    const decisions = await matchDecisionsForTicket({
      title: context.ticketTitle,
      description: context.ticketDescription,
      type: context.ticketType,
      labels: context.ticketLabels,
    });
    decisionsSection = formatDecisionsForPrompt(decisions);
  } catch (error) {
    console.warn("[buildUserMessage] Failed to fetch decisions:", error);
    // Continue without decisions
  }

  const totalEstimate = Math.ceil(
    (context.ticketTitle.length + description.length + additionalContext.length + existingWorkSection.length + decisionsSection.length + 200) / 4
  );
  console.log(`[buildUserMessage] Estimated prompt tokens: ${totalEstimate}`);

  return `# Task: ${context.ticketIdentifier} - ${context.ticketTitle}

${description ? `## Description\n${description}\n\n` : ""}${existingWorkSection}${decisionsSection}## Additional Context
${additionalContext}

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
