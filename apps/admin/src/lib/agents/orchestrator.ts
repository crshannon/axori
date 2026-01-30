/**
 * Agent Orchestrator
 *
 * Manages the execution of AI agents for tickets, including:
 * - Protocol selection and configuration
 * - Execution lifecycle management
 * - Token tracking and budget enforcement
 * - Checkpoint/resume support for long-running tasks
 */

import {
  db,
  eq,
  forgeAgentExecutions,
  forgeFileLocks,
  forgeTickets,
  forgeTokenBudgets,
  forgeTokenUsage,
  sql,
} from "@axori/db"
import { getGitHubClient } from "../github/client"
import {  getAnthropicClient } from "./anthropic"
import {  PROTOCOLS, calculateEstimatedCost } from "./protocols"
import { createToolExecutors, getToolDefinitions } from "./tools"
import type {AnthropicMessage} from "./anthropic";
import type {AgentProtocol} from "./protocols";

// =============================================================================
// TYPES
// =============================================================================

export interface ExecutionContext {
  ticketId: string
  ticketIdentifier: string
  executionId: string
  protocol: AgentProtocol
  workingBranch: string
  additionalContext?: string
}

export interface ExecutionResult {
  success: boolean
  executionId: string
  status: "completed" | "failed" | "paused"
  branchCreated?: string
  filesChanged?: Array<string>
  prUrl?: string
  prNumber?: number
  tokensUsed: number
  costCents: number
  durationMs: number
  error?: string
  executionLog: string
}

export interface ExecutionOptions {
  maxIterations?: number
  checkpointInterval?: number
  onProgress?: (message: string) => void
  onToolUse?: (tool: string, input: Record<string, unknown>) => void
}

// =============================================================================
// ORCHESTRATOR CLASS
// =============================================================================

export class AgentOrchestrator {
  private anthropic = getAnthropicClient()
  private github = getGitHubClient()

  /**
   * Execute an agent for a ticket
   */
  async execute(
    ticketId: string,
    protocol: AgentProtocol,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    const executionLog: Array<string> = []

    const log = (message: string) => {
      const timestamp = new Date().toISOString()
      executionLog.push(`[${timestamp}] ${message}`)
      options.onProgress?.(message)
    }

    try {
      // 1. Get ticket details
      log("Fetching ticket details...")
      const [ticket] = await db
        .select()
        .from(forgeTickets)
        .where(eq(forgeTickets.id, ticketId))
        .limit(1)

      if (!ticket) {
        throw new Error(`Ticket not found: ${ticketId}`)
      }

      log(`Working on: ${ticket.identifier} - ${ticket.title}`)

      // 2. Check budget
      log("Checking token budget...")
      const budgetOk = await this.checkBudget(protocol)
      if (!budgetOk) {
        throw new Error("Daily token budget exceeded. Please wait until tomorrow or increase budget.")
      }

      // 3. Create execution record
      log("Creating execution record...")
      const [execution] = await db
        .insert(forgeAgentExecutions)
        .values({
          ticketId,
          protocol,
          status: "running",
          prompt: this.buildPrompt(ticket, options),
          startedAt: new Date(),
        })
        .returning()

      // 4. Update ticket with execution reference
      await db
        .update(forgeTickets)
        .set({
          assignedAgent: protocol,
          agentSessionId: execution.id,
          status: "in_progress",
          startedAt: ticket.startedAt || new Date(),
        })
        .where(eq(forgeTickets.id, ticketId))

      // 5. Create branch if protocol allows
      let workingBranch = ticket.branchName
      if (!workingBranch && PROTOCOLS[protocol].canCreateBranch) {
        log("Creating feature branch...")
        const branchName = this.generateBranchName(ticket.identifier, ticket.title)
        await this.github.createBranch(branchName)
        workingBranch = branchName

        await db
          .update(forgeTickets)
          .set({ branchName })
          .where(eq(forgeTickets.id, ticketId))

        log(`Branch created: ${branchName}`)
      }

      // 6. Execute agent
      log("Starting agent execution...")
      const context: ExecutionContext = {
        ticketId,
        ticketIdentifier: ticket.identifier,
        executionId: execution.id,
        protocol,
        workingBranch: workingBranch || "main",
      }

      const result = await this.runAgent(context, ticket, options, log)

      // 7. Update execution record
      await db
        .update(forgeAgentExecutions)
        .set({
          status: result.success ? "completed" : "failed",
          executionLog: executionLog.join("\n"),
          branchCreated: result.branchCreated,
          filesChanged: result.filesChanged,
          prUrl: result.prUrl,
          tokensUsed: result.tokensUsed,
          costCents: result.costCents,
          durationMs: Date.now() - startTime,
          completedAt: new Date(),
        })
        .where(eq(forgeAgentExecutions.id, execution.id))

      // 8. Update ticket with results
      const ticketUpdate: Record<string, unknown> = {}
      if (result.prUrl) {
        ticketUpdate.prUrl = result.prUrl
        ticketUpdate.prNumber = result.prNumber
        ticketUpdate.status = "in_review"
      }
      if (result.success) {
        log("Execution completed successfully")
      } else {
        ticketUpdate.status = "blocked"
        log(`Execution failed: ${result.error}`)
      }

      if (Object.keys(ticketUpdate).length > 0) {
        await db
          .update(forgeTickets)
          .set(ticketUpdate)
          .where(eq(forgeTickets.id, ticketId))
      }

      return {
        ...result,
        executionId: execution.id,
        durationMs: Date.now() - startTime,
        executionLog: executionLog.join("\n"),
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      log(`Execution error: ${errorMessage}`)

      return {
        success: false,
        executionId: "",
        status: "failed",
        tokensUsed: 0,
        costCents: 0,
        durationMs: Date.now() - startTime,
        error: errorMessage,
        executionLog: executionLog.join("\n"),
      }
    }
  }

  /**
   * Resume a paused execution
   */
  async resume(executionId: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const [execution] = await db
      .select()
      .from(forgeAgentExecutions)
      .where(eq(forgeAgentExecutions.id, executionId))
      .limit(1)

    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`)
    }

    if (execution.status !== "paused") {
      throw new Error(`Execution is not paused: ${execution.status}`)
    }

    // Get the checkpoint data and resume
    const checkpointData = execution.checkpointData as {
      messages: Array<AnthropicMessage>
      step: number
    } | null

    if (!checkpointData) {
      throw new Error("No checkpoint data available")
    }

    // Resume execution from checkpoint
    return this.execute(execution.ticketId, execution.protocol as AgentProtocol, {
      ...options,
      // Pass checkpoint data for resumption
    })
  }

  /**
   * Pause a running execution
   */
  async pause(executionId: string): Promise<void> {
    await db
      .update(forgeAgentExecutions)
      .set({ status: "paused" })
      .where(eq(forgeAgentExecutions.id, executionId))
  }

  /**
   * Cancel a running execution
   */
  async cancel(executionId: string): Promise<void> {
    await db
      .update(forgeAgentExecutions)
      .set({
        status: "failed",
        completedAt: new Date(),
      })
      .where(eq(forgeAgentExecutions.id, executionId))
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async runAgent(
    context: ExecutionContext,
    ticket: typeof forgeTickets.$inferSelect,
    options: ExecutionOptions,
    log: (message: string) => void
  ): Promise<Omit<ExecutionResult, "executionId" | "durationMs" | "executionLog">> {
    const config = PROTOCOLS[context.protocol]
    const toolExecutors = createToolExecutors({
      workingBranch: context.workingBranch,
      ticketId: context.ticketIdentifier,
    })

    // Build the initial prompt
    const prompt = this.buildPrompt(ticket, options)

    log("Sending initial prompt to Claude...")

    try {
      const result = await this.anthropic.executeWithTools(
        {
          model: config.model,
          max_tokens: config.maxTokens,
          system: config.systemPrompt,
          messages: [{ role: "user", content: prompt }],
          tools: getToolDefinitions(config.tools),
        },
        async (name, input) => {
          log(`Executing tool: ${name}`)
          options.onToolUse?.(name, input)
          const executor = toolExecutors[name]
          if (!executor) {
            throw new Error(`Unknown tool: ${name}`)
          }
          return executor(input)
        },
        {
          maxIterations: options.maxIterations || 50,
          onResponse: (response) => {
            log(`Response received (${response.usage.output_tokens} tokens)`)
          },
          onCheckpoint: async (iteration, messages) => {
            log(`Checkpoint at iteration ${iteration}`)
            await db
              .update(forgeAgentExecutions)
              .set({
                checkpointStep: iteration,
                checkpointData: { messages, step: iteration },
              })
              .where(eq(forgeAgentExecutions.id, context.executionId))
          },
        }
      )

      // Log token usage
      await this.logTokenUsage(
        context.executionId,
        config.model,
        result.totalInputTokens,
        result.totalOutputTokens
      )

      // Extract results from conversation
      const filesChanged = this.extractFilesChanged(result.messages)
      const prInfo = this.extractPRInfo(result.messages)

      return {
        success: true,
        status: "completed",
        branchCreated: context.workingBranch,
        filesChanged,
        prUrl: prInfo?.url,
        prNumber: prInfo?.number,
        tokensUsed: result.totalInputTokens + result.totalOutputTokens,
        costCents: calculateEstimatedCost(
          context.protocol,
          result.totalInputTokens,
          result.totalOutputTokens
        ),
      }
    } catch (error) {
      return {
        success: false,
        status: "failed",
        tokensUsed: 0,
        costCents: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private buildPrompt(
    ticket: typeof forgeTickets.$inferSelect,
    options: ExecutionOptions
  ): string {
    let prompt = `# Task: ${ticket.identifier} - ${ticket.title}

## Description
${ticket.description || "No description provided."}

## Ticket Details
- Type: ${ticket.type}
- Priority: ${ticket.priority}
- Phase: ${ticket.currentPhase}
${ticket.estimate ? `- Estimate: ${ticket.estimate} story points` : ""}
${ticket.labels?.length ? `- Labels: ${ticket.labels.join(", ")}` : ""}

## Instructions
Please implement this ticket following these steps:
1. First, use get_registry to check for existing components/utilities you can use
2. Use get_decisions to check for any relevant architectural decisions
3. Read any relevant files to understand the existing code
4. Create the feature branch if not already created
5. Implement the changes following existing patterns
6. Create a pull request when complete

Remember to:
- Follow existing code patterns and conventions
- Write tests if the protocol supports it
- Create meaningful commit messages
- Document any significant decisions made
`

    if (options.onProgress) {
      prompt += `\n## Additional Context\n${options}\n`
    }

    return prompt
  }

  private generateBranchName(ticketId: string, title: string): string {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 30)
    return `feature/${ticketId.toLowerCase()}-${slug}`
  }

  private async checkBudget(protocol: AgentProtocol): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0]

    // Get or create today's budget record
    let [budget] = await db
      .select()
      .from(forgeTokenBudgets)
      .where(eq(forgeTokenBudgets.date, today))
      .limit(1)

    if (!budget) {
      ;[budget] = await db
        .insert(forgeTokenBudgets)
        .values({
          date: today,
          dailyLimitTokens: 500000,
          dailyLimitCents: 500,
          usedTokens: 0,
          usedCents: 0,
        })
        .returning()
    }

    const config = PROTOCOLS[protocol]
    const estimatedMax = config.estimatedTokens.max

    // Check if we have room for this execution
    return (budget.usedTokens || 0) + estimatedMax <= (budget.dailyLimitTokens || 500000)
  }

  private async logTokenUsage(
    executionId: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    const costCents = calculateEstimatedCost(
      "sonnet_implementation", // Use as placeholder for calculation
      inputTokens,
      outputTokens
    )

    // Log usage
    await db.insert(forgeTokenUsage).values({
      executionId,
      model,
      inputTokens,
      outputTokens,
      costCents,
    })

    // Update daily budget
    const today = new Date().toISOString().split("T")[0]
    await db
      .update(forgeTokenBudgets)
      .set({
        usedTokens: sql`${forgeTokenBudgets.usedTokens} + ${inputTokens + outputTokens}`,
        usedCents: sql`${forgeTokenBudgets.usedCents} + ${costCents}`,
      })
      .where(eq(forgeTokenBudgets.date, today))
  }

  private extractFilesChanged(messages: Array<AnthropicMessage>): Array<string> {
    const files = new Set<string>()

    for (const message of messages) {
      if (Array.isArray(message.content)) {
        for (const block of message.content) {
          if (block.type === "tool_result" && typeof block.content === "string") {
            // Look for file paths in tool results
            const fileMatch = block.content.match(/File written.*?(['"]?)([^\s'"]+)\1/)
            if (fileMatch) {
              files.add(fileMatch[2])
            }
          }
        }
      }
    }

    return Array.from(files)
  }

  private extractPRInfo(
    messages: Array<AnthropicMessage>
  ): { url: string; number: number } | null {
    for (const message of messages) {
      if (Array.isArray(message.content)) {
        for (const block of message.content) {
          if (block.type === "tool_result" && typeof block.content === "string") {
            const prMatch = block.content.match(
              /Pull request #(\d+) created: (https:\/\/github\.com\/[^\s]+)/
            )
            if (prMatch) {
              return {
                number: parseInt(prMatch[1], 10),
                url: prMatch[2],
              }
            }
          }
        }
      }
    }
    return null
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let orchestratorInstance: AgentOrchestrator | null = null

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator()
  }
  return orchestratorInstance
}

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

/**
 * Check if a ticket would conflict with other running executions
 * TODO: Implement actual file analysis for conflict detection
 */
export async function checkForConflicts(ticketId: string): Promise<{
  hasConflict: boolean
  conflictingTickets: Array<{ id: string; identifier: string; files: Array<string> }>
}> {
  // Suppress unused variable warning - will be used for conflict analysis
  void ticketId

  // Get running executions (will be used for conflict analysis)
  const runningExecutions = await db
    .select({
      ticketId: forgeAgentExecutions.ticketId,
      filesChanged: forgeAgentExecutions.filesChanged,
    })
    .from(forgeAgentExecutions)
    .where(eq(forgeAgentExecutions.status, "running"))
  void runningExecutions

  // Get file locks (will be used for conflict analysis)
  const locks = await db
    .select()
    .from(forgeFileLocks)
    .where(
      sql`${forgeFileLocks.expectedRelease} IS NULL OR ${forgeFileLocks.expectedRelease} > NOW()`
    )
  void locks

  // For now, return no conflicts (would need actual file analysis)
  return {
    hasConflict: false,
    conflictingTickets: [],
  }
}

/**
 * Acquire file locks for an execution
 */
export async function acquireFileLocks(
  ticketId: string,
  files: Array<string>
): Promise<boolean> {
  try {
    for (const file of files) {
      await db.insert(forgeFileLocks).values({
        filePath: file,
        lockedByTicketId: ticketId,
        lockType: "exclusive",
        expectedRelease: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      })
    }
    return true
  } catch {
    return false
  }
}

/**
 * Release file locks for an execution
 */
export async function releaseFileLocks(ticketId: string): Promise<void> {
  await db
    .delete(forgeFileLocks)
    .where(eq(forgeFileLocks.lockedByTicketId, ticketId))
}
