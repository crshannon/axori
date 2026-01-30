/**
 * Forge Agent Executions API Routes
 *
 * Routes for managing AI agent executions against tickets
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  forgeAgentExecutions,
  forgeTickets,
  forgeTokenUsage,
  eq,
  desc,
  and,
  sql,
} from "@axori/db";
import { requireAuth } from "../../middleware/permissions";
import { withErrorHandling, validateData, ApiError } from "../../utils/errors";
import { startExecution, checkHealth } from "../../services/forge";

const router = new Hono();

// =============================================================================
// Validation Schemas
// =============================================================================

const agentProtocolEnum = z.enum([
  "opus_full_feature",
  "opus_architecture",
  "opus_planning",
  "sonnet_implementation",
  "sonnet_bug_fix",
  "sonnet_tests",
  "haiku_quick_edit",
  "haiku_docs",
]);

const executionStatusEnum = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "paused",
]);

const createExecutionSchema = z.object({
  ticketId: z.string().uuid(),
  protocol: agentProtocolEnum,
  prompt: z.string().min(1),
});

const updateExecutionSchema = z.object({
  status: executionStatusEnum.optional(),
  planOutput: z.string().optional(),
  executionLog: z.string().optional(),
  checkpointData: z.record(z.unknown()).optional(),
  checkpointStep: z.number().int().optional(),
  branchCreated: z.string().optional(),
  filesChanged: z.array(z.string()).optional(),
  prUrl: z.string().url().optional().or(z.literal("")),
  tokensUsed: z.number().int().optional(),
  costCents: z.number().int().optional(),
  durationMs: z.number().int().optional(),
});

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/executions
 * List all executions with optional filters
 */
router.get(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const ticketId = c.req.query("ticketId");
      const status = c.req.query("status");
      const limit = parseInt(c.req.query("limit") || "50", 10);

      const conditions = [];
      if (ticketId) {
        conditions.push(eq(forgeAgentExecutions.ticketId, ticketId));
      }
      if (status) {
        const parsed = executionStatusEnum.safeParse(status);
        if (parsed.success) {
          conditions.push(eq(forgeAgentExecutions.status, parsed.data));
        }
      }

      const executions = await db
        .select({
          execution: forgeAgentExecutions,
          ticket: {
            id: forgeTickets.id,
            identifier: forgeTickets.identifier,
            title: forgeTickets.title,
          },
        })
        .from(forgeAgentExecutions)
        .leftJoin(forgeTickets, eq(forgeAgentExecutions.ticketId, forgeTickets.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(forgeAgentExecutions.createdAt))
        .limit(limit);

      return c.json(
        executions.map((e) => ({
          ...e.execution,
          ticket: e.ticket,
        }))
      );
    },
    { operation: "listForgeExecutions" }
  )
);

/**
 * GET /forge/executions/:id
 * Get a single execution with details
 */
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [result] = await db
        .select({
          execution: forgeAgentExecutions,
          ticket: forgeTickets,
        })
        .from(forgeAgentExecutions)
        .leftJoin(forgeTickets, eq(forgeAgentExecutions.ticketId, forgeTickets.id))
        .where(eq(forgeAgentExecutions.id, id))
        .limit(1);

      if (!result) {
        throw new ApiError("Execution not found", 404);
      }

      // Get token usage records
      const tokenUsage = await db
        .select()
        .from(forgeTokenUsage)
        .where(eq(forgeTokenUsage.executionId, id))
        .orderBy(desc(forgeTokenUsage.createdAt));

      return c.json({
        ...result.execution,
        ticket: result.ticket,
        tokenUsage,
      });
    },
    { operation: "getForgeExecution" }
  )
);

/**
 * POST /forge/executions
 * Create a new execution (trigger agent)
 */
router.post(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, createExecutionSchema, {
        operation: "createForgeExecution",
      });

      // Verify ticket exists
      const [ticket] = await db
        .select({ id: forgeTickets.id })
        .from(forgeTickets)
        .where(eq(forgeTickets.id, validated.ticketId))
        .limit(1);

      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      // Check for running executions on this ticket
      const [runningExecution] = await db
        .select({ id: forgeAgentExecutions.id })
        .from(forgeAgentExecutions)
        .where(
          and(
            eq(forgeAgentExecutions.ticketId, validated.ticketId),
            eq(forgeAgentExecutions.status, "running")
          )
        )
        .limit(1);

      if (runningExecution) {
        throw new ApiError(
          "An execution is already running for this ticket",
          409
        );
      }

      const [created] = await db
        .insert(forgeAgentExecutions)
        .values({
          ticketId: validated.ticketId,
          protocol: validated.protocol,
          prompt: validated.prompt,
          status: "pending",
        })
        .returning();

      // Update ticket with assigned agent
      await db
        .update(forgeTickets)
        .set({
          assignedAgent: validated.protocol,
          agentSessionId: created.id,
          updatedAt: new Date(),
        })
        .where(eq(forgeTickets.id, validated.ticketId));

      // Trigger agent execution in background
      // We don't await this - the execution runs asynchronously
      startExecution(created.id).catch((error) => {
        console.error(`[${created.id}] Background execution failed:`, error);
      });

      return c.json(created, 201);
    },
    { operation: "createForgeExecution" }
  )
);

/**
 * PUT /forge/executions/:id
 * Update an execution (for agent orchestrator use)
 */
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const validated = validateData(body, updateExecutionSchema, {
        operation: "updateForgeExecution",
      });

      const updateData: Record<string, unknown> = { ...validated };

      // Handle status transitions
      if (validated.status === "running") {
        updateData.startedAt = new Date();
      }
      if (validated.status === "completed" || validated.status === "failed") {
        updateData.completedAt = new Date();
      }

      const [updated] = await db
        .update(forgeAgentExecutions)
        .set(updateData)
        .where(eq(forgeAgentExecutions.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Execution not found", 404);
      }

      // If execution completed/failed, clear agent from ticket
      if (validated.status === "completed" || validated.status === "failed") {
        await db
          .update(forgeTickets)
          .set({
            assignedAgent: null,
            agentSessionId: null,
            updatedAt: new Date(),
          })
          .where(eq(forgeTickets.id, updated.ticketId));
      }

      return c.json(updated);
    },
    { operation: "updateForgeExecution" }
  )
);

/**
 * POST /forge/executions/:id/pause
 * Pause an execution
 */
router.post(
  "/:id/pause",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [execution] = await db
        .select()
        .from(forgeAgentExecutions)
        .where(eq(forgeAgentExecutions.id, id))
        .limit(1);

      if (!execution) {
        throw new ApiError("Execution not found", 404);
      }

      if (execution.status !== "running") {
        throw new ApiError("Can only pause running executions", 400);
      }

      const [updated] = await db
        .update(forgeAgentExecutions)
        .set({ status: "paused" })
        .where(eq(forgeAgentExecutions.id, id))
        .returning();

      return c.json(updated);
    },
    { operation: "pauseForgeExecution" }
  )
);

/**
 * POST /forge/executions/:id/resume
 * Resume a paused execution
 */
router.post(
  "/:id/resume",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [execution] = await db
        .select()
        .from(forgeAgentExecutions)
        .where(eq(forgeAgentExecutions.id, id))
        .limit(1);

      if (!execution) {
        throw new ApiError("Execution not found", 404);
      }

      if (execution.status !== "paused") {
        throw new ApiError("Can only resume paused executions", 400);
      }

      const [updated] = await db
        .update(forgeAgentExecutions)
        .set({ status: "running" })
        .where(eq(forgeAgentExecutions.id, id))
        .returning();

      // TODO: In Phase 1 Step 4, this will resume the agent from checkpoint

      return c.json(updated);
    },
    { operation: "resumeForgeExecution" }
  )
);

/**
 * POST /forge/executions/:id/cancel
 * Cancel an execution
 */
router.post(
  "/:id/cancel",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [execution] = await db
        .select()
        .from(forgeAgentExecutions)
        .where(eq(forgeAgentExecutions.id, id))
        .limit(1);

      if (!execution) {
        throw new ApiError("Execution not found", 404);
      }

      if (execution.status === "completed" || execution.status === "failed") {
        throw new ApiError("Cannot cancel completed or failed executions", 400);
      }

      const [updated] = await db
        .update(forgeAgentExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          executionLog: (execution.executionLog || "") + "\n[CANCELLED BY USER]",
        })
        .where(eq(forgeAgentExecutions.id, id))
        .returning();

      // Clear agent from ticket
      await db
        .update(forgeTickets)
        .set({
          assignedAgent: null,
          agentSessionId: null,
          updatedAt: new Date(),
        })
        .where(eq(forgeTickets.id, execution.ticketId));

      return c.json(updated);
    },
    { operation: "cancelForgeExecution" }
  )
);

/**
 * POST /forge/executions/:id/log-tokens
 * Log token usage for an execution
 */
router.post(
  "/:id/log-tokens",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const executionId = c.req.param("id");
      const body = await c.req.json();

      const schema = z.object({
        model: z.string(),
        inputTokens: z.number().int().min(0),
        outputTokens: z.number().int().min(0),
        costCents: z.number().int().min(0),
      });

      const validated = validateData(body, schema, {
        operation: "logTokenUsage",
      });

      // Verify execution exists
      const [execution] = await db
        .select({ id: forgeAgentExecutions.id })
        .from(forgeAgentExecutions)
        .where(eq(forgeAgentExecutions.id, executionId))
        .limit(1);

      if (!execution) {
        throw new ApiError("Execution not found", 404);
      }

      const [created] = await db
        .insert(forgeTokenUsage)
        .values({
          executionId,
          model: validated.model,
          inputTokens: validated.inputTokens,
          outputTokens: validated.outputTokens,
          costCents: validated.costCents,
        })
        .returning();

      // Update execution totals
      const [totals] = await db
        .select({
          totalTokens: sql<number>`sum(${forgeTokenUsage.inputTokens} + ${forgeTokenUsage.outputTokens})::int`,
          totalCost: sql<number>`sum(${forgeTokenUsage.costCents})::int`,
        })
        .from(forgeTokenUsage)
        .where(eq(forgeTokenUsage.executionId, executionId));

      await db
        .update(forgeAgentExecutions)
        .set({
          tokensUsed: totals?.totalTokens || 0,
          costCents: totals?.totalCost || 0,
        })
        .where(eq(forgeAgentExecutions.id, executionId));

      return c.json(created, 201);
    },
    { operation: "logTokenUsage" }
  )
);

/**
 * GET /forge/executions/health
 * Check orchestrator health and API key configuration
 */
router.get(
  "/health",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const health = await checkHealth();
      return c.json(health);
    },
    { operation: "checkOrchestratorHealth" }
  )
);

export default router;
