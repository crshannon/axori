/**
 * Forge Projects API Routes
 *
 * CRUD operations for Forge projects (ticket groupings)
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  forgeProjects,
  forgeTickets,
  forgeMilestones,
  forgeFeatures,
  eq,
  desc,
  asc,
  sql,
  and,
} from "@axori/db";
import { requireAuth } from "../../middleware/permissions";
import { withErrorHandling, validateData, ApiError } from "../../utils/errors";

const router = new Hono();

// =============================================================================
// Validation Schemas
// =============================================================================

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  color: z.string().optional().default("#6366f1"),
  icon: z.string().optional().default("folder"),
  milestoneId: z.string().uuid().optional().nullable(),
  featureId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

const updateProjectSchema = createProjectSchema.partial();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/projects
 * List all projects (epics)
 */
router.get(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const milestoneId = c.req.query("milestoneId");
      const featureId = c.req.query("featureId");

      const conditions = [];
      if (milestoneId) {
        conditions.push(eq(forgeProjects.milestoneId, milestoneId));
      }
      if (featureId) {
        conditions.push(eq(forgeProjects.featureId, featureId));
      }

      const whereCondition = conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : and(...conditions)
        : undefined;

      const projects = await db
        .select({
          project: forgeProjects,
          milestone: forgeMilestones,
          feature: forgeFeatures,
        })
        .from(forgeProjects)
        .leftJoin(forgeMilestones, eq(forgeProjects.milestoneId, forgeMilestones.id))
        .leftJoin(forgeFeatures, eq(forgeProjects.featureId, forgeFeatures.id))
        .where(whereCondition)
        .orderBy(asc(forgeProjects.sortOrder), desc(forgeProjects.createdAt));

      // Flatten and add ticket counts
      const projectIds = projects.map((p) => p.project.id);

      const ticketCounts =
        projectIds.length > 0
          ? await db
              .select({
                projectId: forgeTickets.projectId,
                count: sql<number>`count(*)::int`,
              })
              .from(forgeTickets)
              .where(sql`${forgeTickets.projectId} = ANY(${projectIds})`)
              .groupBy(forgeTickets.projectId)
          : [];

      const countMap = new Map(ticketCounts.map((tc) => [tc.projectId, tc.count]));

      const result = projects.map((p) => ({
        ...p.project,
        milestone: p.milestone,
        feature: p.feature,
        ticketCount: countMap.get(p.project.id) || 0,
      }));

      return c.json(result);
    },
    { operation: "listForgeProjects" }
  )
);

/**
 * GET /forge/projects/:id
 * Get a single project with details
 */
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [result] = await db
        .select({
          project: forgeProjects,
          milestone: forgeMilestones,
        })
        .from(forgeProjects)
        .leftJoin(forgeMilestones, eq(forgeProjects.milestoneId, forgeMilestones.id))
        .where(eq(forgeProjects.id, id))
        .limit(1);

      if (!result) {
        throw new ApiError("Project not found", 404);
      }

      // Get ticket counts by status
      const ticketCounts = await db
        .select({
          status: forgeTickets.status,
          count: sql<number>`count(*)::int`,
        })
        .from(forgeTickets)
        .where(eq(forgeTickets.projectId, id))
        .groupBy(forgeTickets.status);

      return c.json({
        ...result.project,
        milestone: result.milestone,
        ticketCounts,
        totalTickets: ticketCounts.reduce((sum, tc) => sum + tc.count, 0),
      });
    },
    { operation: "getForgeProject" }
  )
);

/**
 * POST /forge/projects
 * Create a new project
 */
router.post(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, createProjectSchema, {
        operation: "createForgeProject",
      });

      // Verify milestone exists if provided
      if (validated.milestoneId) {
        const [milestone] = await db
          .select({ id: forgeMilestones.id })
          .from(forgeMilestones)
          .where(eq(forgeMilestones.id, validated.milestoneId))
          .limit(1);

        if (!milestone) {
          throw new ApiError("Milestone not found", 404);
        }
      }

      const [created] = await db
        .insert(forgeProjects)
        .values(validated)
        .returning();

      return c.json(created, 201);
    },
    { operation: "createForgeProject" }
  )
);

/**
 * PUT /forge/projects/:id
 * Update a project
 */
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const validated = validateData(body, updateProjectSchema, {
        operation: "updateForgeProject",
      });

      // Verify milestone exists if provided
      if (validated.milestoneId) {
        const [milestone] = await db
          .select({ id: forgeMilestones.id })
          .from(forgeMilestones)
          .where(eq(forgeMilestones.id, validated.milestoneId))
          .limit(1);

        if (!milestone) {
          throw new ApiError("Milestone not found", 404);
        }
      }

      const [updated] = await db
        .update(forgeProjects)
        .set({
          ...validated,
          updatedAt: new Date(),
        })
        .where(eq(forgeProjects.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Project not found", 404);
      }

      return c.json(updated);
    },
    { operation: "updateForgeProject" }
  )
);

/**
 * DELETE /forge/projects/:id
 * Delete a project
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
        .where(eq(forgeTickets.projectId, id));

      if (ticketCount && ticketCount.count > 0) {
        throw new ApiError(
          `Cannot delete project with ${ticketCount.count} associated tickets. Remove or reassign tickets first.`,
          400
        );
      }

      const [deleted] = await db
        .delete(forgeProjects)
        .where(eq(forgeProjects.id, id))
        .returning();

      if (!deleted) {
        throw new ApiError("Project not found", 404);
      }

      return c.json({ success: true });
    },
    { operation: "deleteForgeProject" }
  )
);

export default router;
