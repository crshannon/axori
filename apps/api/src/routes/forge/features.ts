/**
 * Forge Features API Routes
 *
 * CRUD operations for Forge features (long-lived capabilities within a Foundry)
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  forgeFeatures,
  forgeFoundries,
  forgeProjects,
  eq,
  asc,
  ilike,
  sql,
} from "@axori/db";
import { requireAuth } from "../../middleware/permissions";
import { withErrorHandling, validateData, ApiError } from "../../utils/errors";

const router = new Hono();

// =============================================================================
// Validation Schemas
// =============================================================================

const featureStatusEnum = z.enum(["active", "deprecated", "planned"]);

const createFeatureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  foundryId: z.string().uuid().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  status: featureStatusEnum.optional(),
  owner: z.string().optional(),
  sortOrder: z.number().optional(),
});

const updateFeatureSchema = createFeatureSchema.partial();

// =============================================================================
// Helper Functions
// =============================================================================

async function generateIdentifier(): Promise<string> {
  const [result] = await db
    .select({
      maxId: sql<string>`MAX(SUBSTRING(identifier FROM 6)::int)`,
    })
    .from(forgeFeatures);

  const nextNum = (result?.maxId ? parseInt(result.maxId, 10) : 0) + 1;
  return `FEAT-${nextNum.toString().padStart(3, "0")}`;
}

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/features
 * List all features with optional filters
 */
router.get(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const foundryId = c.req.query("foundryId");
      const status = c.req.query("status");
      const search = c.req.query("search");

      let query = db.select().from(forgeFeatures).$dynamic();

      const conditions = [];

      if (foundryId) {
        conditions.push(eq(forgeFeatures.foundryId, foundryId));
      }

      if (status) {
        const parsed = featureStatusEnum.safeParse(status);
        if (parsed.success) {
          conditions.push(eq(forgeFeatures.status, parsed.data));
        }
      }

      if (search) {
        conditions.push(ilike(forgeFeatures.name, `%${search}%`));
      }

      if (conditions.length > 0) {
        for (const condition of conditions) {
          query = query.where(condition);
        }
      }

      const features = await query.orderBy(
        asc(forgeFeatures.sortOrder),
        asc(forgeFeatures.createdAt)
      );

      return c.json(features);
    },
    { operation: "listForgeFeatures" }
  )
);

/**
 * GET /forge/features/:id
 * Get a single feature with foundry and projects
 */
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [feature] = await db
        .select()
        .from(forgeFeatures)
        .where(eq(forgeFeatures.id, id))
        .limit(1);

      if (!feature) {
        throw new ApiError("Feature not found", 404);
      }

      // Fetch foundry if feature has one
      let foundry = null;
      if (feature.foundryId) {
        const [foundryResult] = await db
          .select()
          .from(forgeFoundries)
          .where(eq(forgeFoundries.id, feature.foundryId))
          .limit(1);
        foundry = foundryResult;
      }

      // Fetch associated projects (epics)
      const projects = await db
        .select()
        .from(forgeProjects)
        .where(eq(forgeProjects.featureId, id))
        .orderBy(asc(forgeProjects.sortOrder));

      return c.json({
        ...feature,
        foundry,
        projects,
      });
    },
    { operation: "getForgeFeature" }
  )
);

/**
 * POST /forge/features
 * Create a new feature
 */
router.post(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, createFeatureSchema, {
        operation: "createForgeFeature",
      });

      const identifier = await generateIdentifier();

      const [created] = await db
        .insert(forgeFeatures)
        .values({
          ...validated,
          identifier,
          foundryId: validated.foundryId || null,
        })
        .returning();

      return c.json(created, 201);
    },
    { operation: "createForgeFeature" }
  )
);

/**
 * PUT /forge/features/:id
 * Update a feature
 */
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const validated = validateData(body, updateFeatureSchema, {
        operation: "updateForgeFeature",
      });

      const [updated] = await db
        .update(forgeFeatures)
        .set({
          ...validated,
          foundryId: validated.foundryId ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(forgeFeatures.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Feature not found", 404);
      }

      return c.json(updated);
    },
    { operation: "updateForgeFeature" }
  )
);

/**
 * DELETE /forge/features/:id
 * Delete a feature (check for existing projects first)
 */
router.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      // Check for existing projects (epics) under this feature
      const existingProjects = await db
        .select({ id: forgeProjects.id })
        .from(forgeProjects)
        .where(eq(forgeProjects.featureId, id))
        .limit(1);

      if (existingProjects.length > 0) {
        throw new ApiError(
          "Cannot delete feature with existing projects. Remove or reassign projects first.",
          400
        );
      }

      const [deleted] = await db
        .delete(forgeFeatures)
        .where(eq(forgeFeatures.id, id))
        .returning();

      if (!deleted) {
        throw new ApiError("Feature not found", 404);
      }

      return c.json({ success: true });
    },
    { operation: "deleteForgeFeature" }
  )
);

export default router;
