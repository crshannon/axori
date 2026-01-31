/**
 * Forge Decisions API Routes
 *
 * CRUD operations for Forge decisions (decision ledger entries)
 */

import { Hono } from "hono";
import { z } from "zod";
import { db, forgeDecisions, eq, desc, sql, ilike } from "@axori/db";
import { requireAuth } from "../../middleware/permissions";
import { withErrorHandling, validateData, ApiError } from "../../utils/errors";

const router = new Hono();

// =============================================================================
// Validation Schemas
// =============================================================================

const decisionCategoryEnum = z.enum([
  "code_standards",
  "architecture",
  "testing",
  "design",
  "process",
  "tooling",
  "product",
  "performance",
]);

const createDecisionSchema = z.object({
  decision: z.string().min(1, "Decision is required").max(2000),
  context: z.string().optional(),
  category: decisionCategoryEnum,
  scope: z.array(z.string()).optional().default([]),
  active: z.boolean().optional().default(true),
  supersedes: z.string().uuid().optional(),
  createdFromTicket: z.string().optional(),
});

const updateDecisionSchema = createDecisionSchema.partial().extend({
  complianceRate: z.number().min(0).max(100).optional(),
  timesApplied: z.number().int().min(0).optional(),
  timesOverridden: z.number().int().min(0).optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

async function generateNextIdentifier(): Promise<string> {
  const [result] = await db
    .select({
      maxId: sql<string>`MAX(SUBSTRING(identifier FROM 5)::int)`,
    })
    .from(forgeDecisions);

  const nextNum = (result?.maxId ? parseInt(result.maxId, 10) : 0) + 1;
  return `DEC-${nextNum.toString().padStart(3, "0")}`;
}

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/decisions
 * List all decisions with optional filters
 */
router.get(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const category = c.req.query("category");
      const active = c.req.query("active");
      const search = c.req.query("search");

      let query = db.select().from(forgeDecisions).$dynamic();

      const conditions = [];

      if (category) {
        const parsed = decisionCategoryEnum.safeParse(category);
        if (parsed.success) {
          conditions.push(eq(forgeDecisions.category, parsed.data));
        }
      }

      if (active !== undefined && active !== "") {
        const isActive = active === "true";
        conditions.push(eq(forgeDecisions.active, isActive));
      }

      if (search) {
        conditions.push(ilike(forgeDecisions.decision, `%${search}%`));
      }

      if (conditions.length > 0) {
        for (const condition of conditions) {
          query = query.where(condition);
        }
      }

      const decisions = await query.orderBy(desc(forgeDecisions.createdAt));

      return c.json(decisions);
    },
    { operation: "listForgeDecisions" }
  )
);

/**
 * GET /forge/decisions/:id
 * Get a single decision
 */
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [decision] = await db
        .select()
        .from(forgeDecisions)
        .where(eq(forgeDecisions.id, id))
        .limit(1);

      if (!decision) {
        throw new ApiError("Decision not found", 404);
      }

      return c.json(decision);
    },
    { operation: "getForgeDecision" }
  )
);

/**
 * POST /forge/decisions
 * Create a new decision
 */
router.post(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, createDecisionSchema, {
        operation: "createForgeDecision",
      });

      const identifier = await generateNextIdentifier();

      const [created] = await db
        .insert(forgeDecisions)
        .values({
          ...validated,
          identifier,
          supersedes: validated.supersedes || null,
          createdFromTicket: validated.createdFromTicket || null,
        })
        .returning();

      return c.json(created, 201);
    },
    { operation: "createForgeDecision" }
  )
);

/**
 * PUT /forge/decisions/:id
 * Update a decision
 */
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const validated = validateData(body, updateDecisionSchema, {
        operation: "updateForgeDecision",
      });

      // Extract complianceRate and convert to string for numeric column
      const { complianceRate, ...rest } = validated;

      const [updated] = await db
        .update(forgeDecisions)
        .set({
          ...rest,
          supersedes: validated.supersedes || null,
          createdFromTicket: validated.createdFromTicket || null,
          complianceRate:
            complianceRate !== undefined ? String(complianceRate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(forgeDecisions.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Decision not found", 404);
      }

      return c.json(updated);
    },
    { operation: "updateForgeDecision" }
  )
);

/**
 * PATCH /forge/decisions/:id/toggle
 * Toggle active status
 */
router.patch(
  "/:id/toggle",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [existing] = await db
        .select()
        .from(forgeDecisions)
        .where(eq(forgeDecisions.id, id))
        .limit(1);

      if (!existing) {
        throw new ApiError("Decision not found", 404);
      }

      const [updated] = await db
        .update(forgeDecisions)
        .set({
          active: !existing.active,
          updatedAt: new Date(),
        })
        .where(eq(forgeDecisions.id, id))
        .returning();

      return c.json(updated);
    },
    { operation: "toggleForgeDecision" }
  )
);

/**
 * DELETE /forge/decisions/:id
 * Delete a decision
 */
router.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [deleted] = await db
        .delete(forgeDecisions)
        .where(eq(forgeDecisions.id, id))
        .returning();

      if (!deleted) {
        throw new ApiError("Decision not found", 404);
      }

      return c.json({ success: true });
    },
    { operation: "deleteForgeDecision" }
  )
);

export default router;
