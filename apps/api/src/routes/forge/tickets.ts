/**
 * Forge Tickets API Routes
 *
 * CRUD operations for Forge tickets (the main ticket/issue entity)
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  forgeTickets,
  forgeSubtasks,
  forgeTicketComments,
  eq,
  and,
  desc,
  asc,
  sql,
} from "@axori/db";
import {
  requireAuth,
  getAuthenticatedUserId,
} from "../../middleware/permissions";
import {
  withErrorHandling,
  validateData,
  ApiError,
} from "../../utils/errors";
import {
  getPRStatus,
  mergePR,
  isGithubConfigured,
} from "../../services/forge/github";

const router = new Hono();

// =============================================================================
// Validation Schemas
// =============================================================================

const ticketStatusEnum = z.enum([
  "backlog",
  "design",
  "planned",
  "in_progress",
  "in_review",
  "testing",
  "done",
  "blocked",
]);

const ticketPriorityEnum = z.enum(["critical", "high", "medium", "low"]);

const ticketTypeEnum = z.enum([
  "feature",
  "bug",
  "chore",
  "refactor",
  "docs",
  "spike",
  "design",
]);

const ticketPhaseEnum = z.enum([
  "ideation",
  "design",
  "planning",
  "implementation",
  "testing",
  "deployment",
  "documentation",
]);

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

const releaseClassificationEnum = z.enum([
  "feature",
  "enhancement",
  "breaking_change",
  "bug_fix",
  "chore",
  "docs",
]);

// Create ticket schema
const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().optional(),
  status: ticketStatusEnum.optional().default("backlog"),
  priority: ticketPriorityEnum.optional().default("medium"),
  type: ticketTypeEnum.optional().default("feature"),
  phase: ticketPhaseEnum.optional().default("planning"),
  releaseClassification: releaseClassificationEnum.optional().default("feature"),
  parentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  estimate: z.number().int().min(0).max(100).optional(),
  labels: z.array(z.string()).optional(),
  isBreakingChange: z.boolean().optional().default(false),
  migrationNotes: z.string().optional(),
});

// Update ticket schema
const updateTicketSchema = createTicketSchema.partial().extend({
  statusOrder: z.number().int().optional(),
  branchName: z.string().optional(),
  previewUrl: z.string().url().optional().or(z.literal("")),
  prNumber: z.number().int().optional(),
  prUrl: z.string().url().optional().or(z.literal("")),
  assignedAgent: agentProtocolEnum.optional().nullable(),
  blocksDeploy: z.boolean().optional(),
});

// Update status schema (for drag-drop)
const updateStatusSchema = z.object({
  status: ticketStatusEnum,
  statusOrder: z.number().int().optional(),
});

// Filter schema
const ticketFilterSchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  type: ticketTypeEnum.optional(),
  milestoneId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  search: z.string().optional(),
  parentId: z.string().uuid().optional(),
  prefix: z.enum(["FORGE", "AXO"]).optional(), // Filter by identifier prefix
});

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/tickets
 * List all tickets with optional filters
 */
router.get(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const query = c.req.query();
      const filters = ticketFilterSchema.parse(query);

      // Build conditions
      const conditions = [];

      if (filters.status) {
        conditions.push(eq(forgeTickets.status, filters.status));
      }
      if (filters.priority) {
        conditions.push(eq(forgeTickets.priority, filters.priority));
      }
      if (filters.type) {
        conditions.push(eq(forgeTickets.type, filters.type));
      }
      if (filters.milestoneId) {
        conditions.push(eq(forgeTickets.milestoneId, filters.milestoneId));
      }
      if (filters.projectId) {
        conditions.push(eq(forgeTickets.projectId, filters.projectId));
      }
      if (filters.parentId) {
        conditions.push(eq(forgeTickets.parentId, filters.parentId));
      }
      if (filters.search) {
        conditions.push(
          sql`(${forgeTickets.title} ILIKE ${"%" + filters.search + "%"} OR ${forgeTickets.identifier} ILIKE ${"%" + filters.search + "%"})`
        );
      }
      if (filters.prefix) {
        conditions.push(
          sql`${forgeTickets.identifier} LIKE ${filters.prefix + "-%"}`
        );
      }

      const tickets = await db
        .select()
        .from(forgeTickets)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(forgeTickets.statusOrder), desc(forgeTickets.createdAt));

      return c.json(tickets);
    },
    { operation: "listForgeTickets" }
  )
);

/**
 * GET /forge/tickets/:id
 * Get a single ticket by ID
 */
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [ticket] = await db
        .select()
        .from(forgeTickets)
        .where(eq(forgeTickets.id, id))
        .limit(1);

      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      // Get subtasks
      const subtasks = await db
        .select()
        .from(forgeSubtasks)
        .where(eq(forgeSubtasks.ticketId, id))
        .orderBy(asc(forgeSubtasks.sortOrder));

      // Get comments
      const comments = await db
        .select()
        .from(forgeTicketComments)
        .where(eq(forgeTicketComments.ticketId, id))
        .orderBy(desc(forgeTicketComments.createdAt));

      return c.json({
        ...ticket,
        subtasks,
        comments,
      });
    },
    { operation: "getForgeTicket" }
  )
);

/**
 * POST /forge/tickets
 * Create a new ticket
 */
router.post(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, createTicketSchema, {
        operation: "createForgeTicket",
      });

      // Generate identifier (FORGE-XXX for Forge tickets)
      const [lastTicket] = await db
        .select({ identifier: forgeTickets.identifier })
        .from(forgeTickets)
        .orderBy(desc(forgeTickets.createdAt))
        .limit(1);

      let nextNumber = 1;
      if (lastTicket?.identifier) {
        // Support both FORGE- and legacy AXO- prefixes
        const match = lastTicket.identifier.match(/(?:FORGE|AXO)-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      const identifier = `FORGE-${nextNumber.toString().padStart(3, "0")}`;

      const [created] = await db
        .insert(forgeTickets)
        .values({
          ...validated,
          identifier,
        })
        .returning();

      return c.json(created, 201);
    },
    { operation: "createForgeTicket" }
  )
);

/**
 * PUT /forge/tickets/:id
 * Update a ticket
 */
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const validated = validateData(body, updateTicketSchema, {
        operation: "updateForgeTicket",
      });

      // Track status changes
      const updateData: Record<string, unknown> = {
        ...validated,
        updatedAt: new Date(),
      };

      // If status changed to in_progress, set startedAt
      if (validated.status === "in_progress") {
        const [existing] = await db
          .select({ status: forgeTickets.status, startedAt: forgeTickets.startedAt })
          .from(forgeTickets)
          .where(eq(forgeTickets.id, id))
          .limit(1);

        if (existing && existing.status !== "in_progress" && !existing.startedAt) {
          updateData.startedAt = new Date();
        }
      }

      // If status changed to done, set completedAt
      if (validated.status === "done") {
        updateData.completedAt = new Date();
      }

      const [updated] = await db
        .update(forgeTickets)
        .set(updateData)
        .where(eq(forgeTickets.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Ticket not found", 404);
      }

      return c.json(updated);
    },
    { operation: "updateForgeTicket" }
  )
);

/**
 * PATCH /forge/tickets/:id/status
 * Update ticket status (optimized for drag-drop)
 */
router.patch(
  "/:id/status",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const validated = validateData(body, updateStatusSchema, {
        operation: "updateForgeTicketStatus",
      });

      const updateData: Record<string, unknown> = {
        status: validated.status,
        updatedAt: new Date(),
      };

      if (validated.statusOrder !== undefined) {
        updateData.statusOrder = validated.statusOrder;
      }

      // Track status transitions
      const [existing] = await db
        .select({ status: forgeTickets.status, startedAt: forgeTickets.startedAt })
        .from(forgeTickets)
        .where(eq(forgeTickets.id, id))
        .limit(1);

      if (existing) {
        if (validated.status === "in_progress" && existing.status !== "in_progress" && !existing.startedAt) {
          updateData.startedAt = new Date();
        }
        if (validated.status === "done") {
          updateData.completedAt = new Date();
        }
      }

      const [updated] = await db
        .update(forgeTickets)
        .set(updateData)
        .where(eq(forgeTickets.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Ticket not found", 404);
      }

      return c.json(updated);
    },
    { operation: "updateForgeTicketStatus" }
  )
);

/**
 * POST /forge/tickets/:id/assign-agent
 * Assign an agent protocol to a ticket
 */
router.post(
  "/:id/assign-agent",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();

      const schema = z.object({
        protocol: agentProtocolEnum,
        additionalContext: z.string().optional(),
      });

      const validated = validateData(body, schema, {
        operation: "assignAgentToTicket",
      });

      const [updated] = await db
        .update(forgeTickets)
        .set({
          assignedAgent: validated.protocol,
          updatedAt: new Date(),
        })
        .where(eq(forgeTickets.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Ticket not found", 404);
      }

      // TODO: In Phase 1 Step 4, this will also create an agent execution record
      // and trigger the agent orchestrator

      return c.json(updated);
    },
    { operation: "assignAgentToTicket" }
  )
);

/**
 * DELETE /forge/tickets/:id
 * Delete a ticket
 */
router.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [deleted] = await db
        .delete(forgeTickets)
        .where(eq(forgeTickets.id, id))
        .returning();

      if (!deleted) {
        throw new ApiError("Ticket not found", 404);
      }

      return c.json({ success: true });
    },
    { operation: "deleteForgeTicket" }
  )
);

// =============================================================================
// Subtasks Routes
// =============================================================================

/**
 * POST /forge/tickets/:id/subtasks
 * Create a subtask for a ticket
 */
router.post(
  "/:id/subtasks",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const ticketId = c.req.param("id");
      const body = await c.req.json();

      const schema = z.object({
        title: z.string().min(1).max(500),
        sortOrder: z.number().int().optional(),
      });

      const validated = validateData(body, schema, {
        operation: "createSubtask",
      });

      // Verify ticket exists
      const [ticket] = await db
        .select({ id: forgeTickets.id })
        .from(forgeTickets)
        .where(eq(forgeTickets.id, ticketId))
        .limit(1);

      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      const [created] = await db
        .insert(forgeSubtasks)
        .values({
          ticketId,
          title: validated.title,
          sortOrder: validated.sortOrder ?? 0,
        })
        .returning();

      return c.json(created, 201);
    },
    { operation: "createSubtask" }
  )
);

/**
 * PATCH /forge/tickets/:id/subtasks/:subtaskId
 * Update a subtask
 */
router.patch(
  "/:id/subtasks/:subtaskId",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const subtaskId = c.req.param("subtaskId");
      const body = await c.req.json();

      const schema = z.object({
        title: z.string().min(1).max(500).optional(),
        completed: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        branchName: z.string().optional(),
        prNumber: z.number().int().optional(),
      });

      const validated = validateData(body, schema, {
        operation: "updateSubtask",
      });

      const updateData: Record<string, unknown> = { ...validated };
      if (validated.completed === true) {
        updateData.completedAt = new Date();
      } else if (validated.completed === false) {
        updateData.completedAt = null;
      }

      const [updated] = await db
        .update(forgeSubtasks)
        .set(updateData)
        .where(eq(forgeSubtasks.id, subtaskId))
        .returning();

      if (!updated) {
        throw new ApiError("Subtask not found", 404);
      }

      return c.json(updated);
    },
    { operation: "updateSubtask" }
  )
);

/**
 * DELETE /forge/tickets/:id/subtasks/:subtaskId
 * Delete a subtask
 */
router.delete(
  "/:id/subtasks/:subtaskId",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const subtaskId = c.req.param("subtaskId");

      const [deleted] = await db
        .delete(forgeSubtasks)
        .where(eq(forgeSubtasks.id, subtaskId))
        .returning();

      if (!deleted) {
        throw new ApiError("Subtask not found", 404);
      }

      return c.json({ success: true });
    },
    { operation: "deleteSubtask" }
  )
);

// =============================================================================
// Comments Routes
// =============================================================================

/**
 * POST /forge/tickets/:id/comments
 * Add a comment to a ticket
 */
router.post(
  "/:id/comments",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const ticketId = c.req.param("id");
      const _userId = getAuthenticatedUserId(c); // Reserved for future author tracking
      const body = await c.req.json();

      const schema = z.object({
        content: z.string().min(1),
        authorType: z.enum(["user", "agent", "system"]).default("user"),
        authorName: z.string().optional(),
        metadata: z.record(z.unknown()).optional(),
      });

      const validated = validateData(body, schema, {
        operation: "createComment",
      });

      // Verify ticket exists
      const [ticket] = await db
        .select({ id: forgeTickets.id })
        .from(forgeTickets)
        .where(eq(forgeTickets.id, ticketId))
        .limit(1);

      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      const [created] = await db
        .insert(forgeTicketComments)
        .values({
          ticketId,
          content: validated.content,
          authorType: validated.authorType ?? "user",
          authorName: validated.authorName ?? null,
          metadata: validated.metadata ?? null,
        })
        .returning();

      return c.json(created, 201);
    },
    { operation: "createComment" }
  )
);

// =============================================================================
// PR Operations
// =============================================================================

/**
 * GET /forge/tickets/:id/pr-status
 * Get the status of a ticket's pull request
 */
router.get(
  ":id/pr-status",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      if (!isGithubConfigured()) {
        throw new ApiError("GitHub not configured", 503);
      }

      // Get ticket with PR number
      const [ticket] = await db
        .select({
          id: forgeTickets.id,
          prNumber: forgeTickets.prNumber,
          prUrl: forgeTickets.prUrl,
        })
        .from(forgeTickets)
        .where(eq(forgeTickets.id, id))
        .limit(1);

      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      if (!ticket.prNumber) {
        throw new ApiError("Ticket has no associated PR", 404);
      }

      const status = await getPRStatus(ticket.prNumber);
      return c.json(status);
    },
    { operation: "getPRStatus" }
  )
);

/**
 * POST /forge/tickets/:id/merge
 * Merge a ticket's pull request
 */
router.post(
  ":id/merge",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      if (!isGithubConfigured()) {
        throw new ApiError("GitHub not configured", 503);
      }

      // Get ticket with PR number
      const [ticket] = await db
        .select({
          id: forgeTickets.id,
          identifier: forgeTickets.identifier,
          title: forgeTickets.title,
          prNumber: forgeTickets.prNumber,
        })
        .from(forgeTickets)
        .where(eq(forgeTickets.id, id))
        .limit(1);

      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      if (!ticket.prNumber) {
        throw new ApiError("Ticket has no associated PR", 404);
      }

      // Check if PR can be merged
      const status = await getPRStatus(ticket.prNumber);
      if (!status.canMerge) {
        throw new ApiError(
          `PR cannot be merged: ${status.mergeableState}`,
          400
        );
      }

      // Merge the PR
      const result = await mergePR(ticket.prNumber, {
        mergeMethod: "squash",
        commitTitle: `${ticket.identifier}: ${ticket.title}`,
      });

      if (!result.merged) {
        throw new ApiError(`Merge failed: ${result.message}`, 500);
      }

      // Update ticket status to done
      await db
        .update(forgeTickets)
        .set({
          status: "done",
          updatedAt: new Date(),
        })
        .where(eq(forgeTickets.id, id));

      return c.json({
        merged: true,
        sha: result.sha,
        ticketStatus: "done",
      });
    },
    { operation: "mergePR" }
  )
);

export default router;
