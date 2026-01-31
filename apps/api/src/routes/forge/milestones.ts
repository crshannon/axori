/**
 * Forge Milestones API Routes
 *
 * CRUD operations for Forge milestones (feature set groupings)
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  forgeMilestones,
  forgeProjects,
  forgeTickets,
  eq,
  desc,
  asc,
  sql,
} from "@axori/db";
import { requireAuth } from "../../middleware/permissions";
import { withErrorHandling, validateData, ApiError } from "../../utils/errors";

const router = new Hono();

// =============================================================================
// Validation Schemas
// =============================================================================

const milestoneStatusEnum = z.enum(["active", "completed", "archived"]);

const createMilestoneSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  targetDate: z.string().optional(), // ISO date string
  status: milestoneStatusEnum.optional().default("active"),
  color: z.string().optional().default("#6366f1"),
  sortOrder: z.number().int().optional().default(0),
  version: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateMilestoneSchema = createMilestoneSchema.partial().extend({
  progressPercent: z.number().int().min(0).max(100).optional(),
});

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/milestones
 * List all milestones
 */
router.get(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const status = c.req.query("status");

      const conditions = [];
      if (status) {
        const parsed = milestoneStatusEnum.safeParse(status);
        if (parsed.success) {
          conditions.push(eq(forgeMilestones.status, parsed.data));
        }
      }

      const milestones = await db
        .select()
        .from(forgeMilestones)
        .where(conditions.length > 0 ? conditions[0] : undefined)
        .orderBy(asc(forgeMilestones.sortOrder), desc(forgeMilestones.createdAt));

      return c.json(milestones);
    },
    { operation: "listForgeMilestones" }
  )
);

/**
 * GET /forge/milestones/active
 * Get the active release with stats
 */
router.get(
  "/active",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      // Get the active milestone
      const [milestone] = await db
        .select()
        .from(forgeMilestones)
        .where(eq(forgeMilestones.isActive, true))
        .limit(1);

      if (!milestone) {
        return c.json(null);
      }

      // Get projects for this milestone
      const projects = await db
        .select()
        .from(forgeProjects)
        .where(eq(forgeProjects.milestoneId, milestone.id));

      // Get ticket stats for all projects in this milestone
      const projectIds = projects.map((p) => p.id);
      let totalTickets = 0;
      let doneTickets = 0;
      let blockedTickets = 0;

      if (projectIds.length > 0) {
        const ticketStats = await db
          .select({
            status: forgeTickets.status,
            count: sql<number>`count(*)::int`,
          })
          .from(forgeTickets)
          .where(eq(forgeTickets.milestoneId, milestone.id))
          .groupBy(forgeTickets.status);

        totalTickets = ticketStats.reduce((sum, ts) => sum + ts.count, 0);
        doneTickets =
          ticketStats.find((ts) => ts.status === "done")?.count || 0;
        blockedTickets =
          ticketStats.find((ts) => ts.status === "blocked")?.count || 0;
      }

      return c.json({
        ...milestone,
        projects,
        stats: {
          totalEpics: projects.length,
          totalTickets,
          doneTickets,
          blockedTickets,
          progress:
            totalTickets > 0
              ? Math.round((doneTickets / totalTickets) * 100)
              : 0,
        },
      });
    },
    { operation: "getActiveRelease" }
  )
);

/**
 * GET /forge/milestones/:id
 * Get a single milestone with ticket counts
 */
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [milestone] = await db
        .select()
        .from(forgeMilestones)
        .where(eq(forgeMilestones.id, id))
        .limit(1);

      if (!milestone) {
        throw new ApiError("Milestone not found", 404);
      }

      // Get ticket counts by status
      const ticketCounts = await db
        .select({
          status: forgeTickets.status,
          count: sql<number>`count(*)::int`,
        })
        .from(forgeTickets)
        .where(eq(forgeTickets.milestoneId, id))
        .groupBy(forgeTickets.status);

      const totalTickets = ticketCounts.reduce((sum, tc) => sum + tc.count, 0);
      const completedTickets =
        ticketCounts.find((tc) => tc.status === "done")?.count || 0;

      return c.json({
        ...milestone,
        ticketCounts,
        totalTickets,
        completedTickets,
        calculatedProgress:
          totalTickets > 0
            ? Math.round((completedTickets / totalTickets) * 100)
            : 0,
      });
    },
    { operation: "getForgeMilestone" }
  )
);

/**
 * POST /forge/milestones
 * Create a new milestone
 */
router.post(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, createMilestoneSchema, {
        operation: "createForgeMilestone",
      });

      const [created] = await db
        .insert(forgeMilestones)
        .values({
          ...validated,
          targetDate: validated.targetDate || null,
        })
        .returning();

      return c.json(created, 201);
    },
    { operation: "createForgeMilestone" }
  )
);

/**
 * PUT /forge/milestones/:id
 * Update a milestone
 */
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const validated = validateData(body, updateMilestoneSchema, {
        operation: "updateForgeMilestone",
      });

      const [updated] = await db
        .update(forgeMilestones)
        .set({
          ...validated,
          targetDate: validated.targetDate || null,
          updatedAt: new Date(),
        })
        .where(eq(forgeMilestones.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Milestone not found", 404);
      }

      return c.json(updated);
    },
    { operation: "updateForgeMilestone" }
  )
);

/**
 * PUT /forge/milestones/:id/activate
 * Set a milestone as the active release
 */
router.put(
  "/:id/activate",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      // Deactivate all other milestones
      await db
        .update(forgeMilestones)
        .set({ isActive: false })
        .where(eq(forgeMilestones.isActive, true));

      // Activate this one
      const [updated] = await db
        .update(forgeMilestones)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(forgeMilestones.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Milestone not found", 404);
      }

      return c.json(updated);
    },
    { operation: "activateMilestone" }
  )
);

/**
 * DELETE /forge/milestones/:id
 * Delete a milestone
 */
router.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      // Check for associated tickets
      const [ticketCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(forgeTickets)
        .where(eq(forgeTickets.milestoneId, id));

      if (ticketCount && ticketCount.count > 0) {
        throw new ApiError(
          `Cannot delete milestone with ${ticketCount.count} associated tickets. Remove or reassign tickets first.`,
          400
        );
      }

      const [deleted] = await db
        .delete(forgeMilestones)
        .where(eq(forgeMilestones.id, id))
        .returning();

      if (!deleted) {
        throw new ApiError("Milestone not found", 404);
      }

      return c.json({ success: true });
    },
    { operation: "deleteForgeMilestone" }
  )
);

export default router;
