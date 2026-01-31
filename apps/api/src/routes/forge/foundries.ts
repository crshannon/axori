/**
 * Forge Foundries API Routes
 *
 * CRUD operations for Forge foundries (business area groupings)
 */

import { Hono } from "hono";
import { z } from "zod";
import { db, forgeFoundries, forgeFeatures, eq, asc } from "@axori/db";
import { requireAuth } from "../../middleware/permissions";
import { withErrorHandling, validateData, ApiError } from "../../utils/errors";

const router = new Hono();

// =============================================================================
// Validation Schemas
// =============================================================================

const createFoundrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
});

const updateFoundrySchema = createFoundrySchema.partial();

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/foundries
 * List all foundries with their features
 */
router.get(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      // Get all foundries
      const foundries = await db
        .select()
        .from(forgeFoundries)
        .orderBy(asc(forgeFoundries.sortOrder));

      // Get all features and group by foundryId
      const features = await db
        .select()
        .from(forgeFeatures)
        .orderBy(asc(forgeFeatures.sortOrder));

      // Map features to their foundries
      const foundryMap = new Map<string, typeof features>();
      for (const feature of features) {
        if (feature.foundryId) {
          const existing = foundryMap.get(feature.foundryId) ?? [];
          existing.push(feature);
          foundryMap.set(feature.foundryId, existing);
        }
      }

      // Combine foundries with their features
      const foundriesWithFeatures = foundries.map((foundry) => ({
        ...foundry,
        features: foundryMap.get(foundry.id) ?? [],
      }));

      return c.json(foundriesWithFeatures);
    },
    { operation: "listForgeFoundries" }
  )
);

/**
 * GET /forge/foundries/:id
 * Get a single foundry with its features
 */
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [foundry] = await db
        .select()
        .from(forgeFoundries)
        .where(eq(forgeFoundries.id, id))
        .limit(1);

      if (!foundry) {
        throw new ApiError("Foundry not found", 404);
      }

      // Get features for this foundry
      const features = await db
        .select()
        .from(forgeFeatures)
        .where(eq(forgeFeatures.foundryId, id))
        .orderBy(asc(forgeFeatures.sortOrder));

      return c.json({ ...foundry, features });
    },
    { operation: "getForgeFoundry" }
  )
);

/**
 * POST /forge/foundries
 * Create a new foundry
 */
router.post(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, createFoundrySchema, {
        operation: "createForgeFoundry",
      });

      const [created] = await db
        .insert(forgeFoundries)
        .values({
          ...validated,
          sortOrder: validated.sortOrder ?? 0,
        })
        .returning();

      return c.json(created, 201);
    },
    { operation: "createForgeFoundry" }
  )
);

/**
 * PUT /forge/foundries/:id
 * Update a foundry
 */
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const validated = validateData(body, updateFoundrySchema, {
        operation: "updateForgeFoundry",
      });

      const [updated] = await db
        .update(forgeFoundries)
        .set({
          ...validated,
          updatedAt: new Date(),
        })
        .where(eq(forgeFoundries.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Foundry not found", 404);
      }

      return c.json(updated);
    },
    { operation: "updateForgeFoundry" }
  )
);

/**
 * DELETE /forge/foundries/:id
 * Delete a foundry (only if no features exist)
 */
router.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      // Check for existing features
      const existingFeatures = await db
        .select({ id: forgeFeatures.id })
        .from(forgeFeatures)
        .where(eq(forgeFeatures.foundryId, id))
        .limit(1);

      if (existingFeatures.length > 0) {
        throw new ApiError(
          "Cannot delete foundry with existing features. Delete or reassign features first.",
          400
        );
      }

      const [deleted] = await db
        .delete(forgeFoundries)
        .where(eq(forgeFoundries.id, id))
        .returning();

      if (!deleted) {
        throw new ApiError("Foundry not found", 404);
      }

      return c.json({ success: true });
    },
    { operation: "deleteForgeFoundry" }
  )
);

export default router;
