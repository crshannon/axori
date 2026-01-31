/**
 * Forge Registry API Routes
 *
 * CRUD operations for Forge registry items (codebase knowledge graph)
 * Plus scan endpoint to trigger codebase analysis
 */

import { Hono } from "hono";
import { z } from "zod";
import { db, forgeRegistry, eq, desc, ilike, and, or } from "@axori/db";
import { requireAuth } from "../../middleware/permissions";
import { withErrorHandling, validateData, ApiError } from "../../utils/errors";
import {
  scanDirectory,
  scanUIComponents,
  scanHooks,
  scanUtilities,
  type RegistryScanResult,
} from "../../services/forge/registry-scanner";
import * as path from "path";

const router = new Hono();

// =============================================================================
// Validation Schemas
// =============================================================================

const registryTypeEnum = z.enum([
  "component",
  "hook",
  "utility",
  "api",
  "table",
  "integration",
]);

const registryStatusEnum = z.enum(["active", "deprecated", "planned"]);

const createRegistrySchema = z.object({
  type: registryTypeEnum,
  name: z.string().min(1, "Name is required").max(200),
  filePath: z.string().min(1, "File path is required").max(500),
  description: z.string().max(2000).optional(),
  status: registryStatusEnum.optional().default("active"),
  exports: z.array(z.string()).optional().default([]),
  dependencies: z.array(z.string()).optional().default([]),
  usedBy: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  deprecatedBy: z.string().uuid().optional(),
  deprecationNotes: z.string().max(1000).optional(),
  relatedTickets: z.array(z.string()).optional().default([]),
});

const updateRegistrySchema = createRegistrySchema.partial();

const scanRequestSchema = z.object({
  scanType: z
    .enum(["full", "ui", "hooks", "utilities", "custom"])
    .optional()
    .default("full"),
  customPath: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the project root directory
 * In development, we're running from apps/api, so we go up two levels
 */
function getProjectRoot(): string {
  // During development, __dirname points to the compiled dist folder
  // We need to find the project root (where packages/ and apps/ are)
  const cwd = process.cwd();

  // If cwd ends with apps/api, we're in the right place
  if (cwd.endsWith("apps/api")) {
    return path.resolve(cwd, "../..");
  }

  // Otherwise, assume we're at the project root
  return cwd;
}

/**
 * Upsert a registry item (insert if not exists, update if exists)
 */
async function upsertRegistryItem(
  item: RegistryScanResult
): Promise<{ action: "created" | "updated"; id: string }> {
  // Check if item already exists by type + name (unique constraint)
  const [existing] = await db
    .select()
    .from(forgeRegistry)
    .where(
      and(eq(forgeRegistry.type, item.type), eq(forgeRegistry.name, item.name))
    )
    .limit(1);

  if (existing) {
    // Update existing item
    const [updated] = await db
      .update(forgeRegistry)
      .set({
        filePath: item.filePath,
        description: item.description || existing.description,
        exports: item.exports,
        dependencies: item.dependencies,
        lastUpdated: new Date(),
      })
      .where(eq(forgeRegistry.id, existing.id))
      .returning();

    return { action: "updated", id: updated.id };
  } else {
    // Create new item
    const [created] = await db
      .insert(forgeRegistry)
      .values({
        type: item.type,
        name: item.name,
        filePath: item.filePath,
        description: item.description,
        exports: item.exports,
        dependencies: item.dependencies,
        status: "active",
      })
      .returning();

    return { action: "created", id: created.id };
  }
}

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /forge/registry
 * List all registry items with optional filters
 */
router.get(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const type = c.req.query("type");
      const status = c.req.query("status");
      const search = c.req.query("search");

      let query = db.select().from(forgeRegistry).$dynamic();

      const conditions = [];

      if (type) {
        const parsed = registryTypeEnum.safeParse(type);
        if (parsed.success) {
          conditions.push(eq(forgeRegistry.type, parsed.data));
        }
      }

      if (status) {
        const parsed = registryStatusEnum.safeParse(status);
        if (parsed.success) {
          conditions.push(eq(forgeRegistry.status, parsed.data));
        }
      }

      if (search) {
        conditions.push(
          or(
            ilike(forgeRegistry.name, `%${search}%`),
            ilike(forgeRegistry.description, `%${search}%`),
            ilike(forgeRegistry.filePath, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        for (const condition of conditions) {
          if (condition) {
            query = query.where(condition);
          }
        }
      }

      const items = await query.orderBy(desc(forgeRegistry.lastUpdated));

      return c.json(items);
    },
    { operation: "listForgeRegistry" }
  )
);

/**
 * GET /forge/registry/:id
 * Get a single registry item
 */
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [item] = await db
        .select()
        .from(forgeRegistry)
        .where(eq(forgeRegistry.id, id))
        .limit(1);

      if (!item) {
        throw new ApiError("Registry item not found", 404);
      }

      return c.json(item);
    },
    { operation: "getForgeRegistryItem" }
  )
);

/**
 * POST /forge/registry
 * Create a new registry item manually
 */
router.post(
  "/",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, createRegistrySchema, {
        operation: "createForgeRegistryItem",
      });

      // Check for unique constraint (type + name)
      const [existing] = await db
        .select()
        .from(forgeRegistry)
        .where(
          and(
            eq(forgeRegistry.type, validated.type),
            eq(forgeRegistry.name, validated.name)
          )
        )
        .limit(1);

      if (existing) {
        throw new ApiError(
          `Registry item with type '${validated.type}' and name '${validated.name}' already exists`,
          409
        );
      }

      const [created] = await db
        .insert(forgeRegistry)
        .values({
          ...validated,
          deprecatedBy: validated.deprecatedBy || null,
        })
        .returning();

      return c.json(created, 201);
    },
    { operation: "createForgeRegistryItem" }
  )
);

/**
 * PUT /forge/registry/:id
 * Update a registry item
 */
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");
      const body = await c.req.json();
      const validated = validateData(body, updateRegistrySchema, {
        operation: "updateForgeRegistryItem",
      });

      // If updating type or name, check for unique constraint
      if (validated.type || validated.name) {
        const [current] = await db
          .select()
          .from(forgeRegistry)
          .where(eq(forgeRegistry.id, id))
          .limit(1);

        if (!current) {
          throw new ApiError("Registry item not found", 404);
        }

        const newType = validated.type || current.type;
        const newName = validated.name || current.name;

        // Only check uniqueness if type or name is actually changing
        if (newType !== current.type || newName !== current.name) {
          const [existing] = await db
            .select()
            .from(forgeRegistry)
            .where(
              and(
                eq(forgeRegistry.type, newType),
                eq(forgeRegistry.name, newName)
              )
            )
            .limit(1);

          if (existing && existing.id !== id) {
            throw new ApiError(
              `Registry item with type '${newType}' and name '${newName}' already exists`,
              409
            );
          }
        }
      }

      const [updated] = await db
        .update(forgeRegistry)
        .set({
          ...validated,
          deprecatedBy: validated.deprecatedBy || null,
          lastUpdated: new Date(),
        })
        .where(eq(forgeRegistry.id, id))
        .returning();

      if (!updated) {
        throw new ApiError("Registry item not found", 404);
      }

      return c.json(updated);
    },
    { operation: "updateForgeRegistryItem" }
  )
);

/**
 * DELETE /forge/registry/:id
 * Delete a registry item
 */
router.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      const [deleted] = await db
        .delete(forgeRegistry)
        .where(eq(forgeRegistry.id, id))
        .returning();

      if (!deleted) {
        throw new ApiError("Registry item not found", 404);
      }

      return c.json({ success: true });
    },
    { operation: "deleteForgeRegistryItem" }
  )
);

/**
 * POST /forge/registry/scan
 * Trigger a codebase scan to update registry items
 */
router.post(
  "/scan",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const body = await c.req.json();
      const validated = validateData(body, scanRequestSchema, {
        operation: "scanForgeRegistry",
      });

      const projectRoot = getProjectRoot();
      let scanResults: Array<RegistryScanResult> = [];

      switch (validated.scanType) {
        case "ui": {
          const uiPath = path.join(projectRoot, "packages", "ui");
          scanResults = await scanUIComponents(uiPath);
          break;
        }

        case "hooks": {
          const hooksPath = path.join(
            projectRoot,
            "apps",
            "web",
            "src",
            "hooks"
          );
          scanResults = await scanHooks(hooksPath);
          break;
        }

        case "utilities": {
          const sharedUtilsPath = path.join(
            projectRoot,
            "packages",
            "shared",
            "src"
          );
          scanResults = await scanUtilities(sharedUtilsPath);
          break;
        }

        case "custom": {
          if (!validated.customPath) {
            throw new ApiError(
              "customPath is required when scanType is 'custom'",
              400
            );
          }
          // Resolve custom path relative to project root
          const customFullPath = path.isAbsolute(validated.customPath)
            ? validated.customPath
            : path.join(projectRoot, validated.customPath);
          scanResults = await scanDirectory(customFullPath);
          break;
        }

        case "full":
        default: {
          // Scan all major locations
          const uiPath = path.join(projectRoot, "packages", "ui");
          const webHooksPath = path.join(
            projectRoot,
            "apps",
            "web",
            "src",
            "hooks"
          );
          const webComponentsPath = path.join(
            projectRoot,
            "apps",
            "web",
            "src",
            "components"
          );
          const sharedPath = path.join(projectRoot, "packages", "shared", "src");
          const adminHooksPath = path.join(
            projectRoot,
            "apps",
            "admin",
            "src",
            "hooks"
          );
          const adminComponentsPath = path.join(
            projectRoot,
            "apps",
            "admin",
            "src",
            "components"
          );

          const [
            uiResults,
            webHooksResults,
            webComponentsResults,
            sharedResults,
            adminHooksResults,
            adminComponentsResults,
          ] = await Promise.all([
            scanUIComponents(uiPath).catch(() => []),
            scanHooks(webHooksPath).catch(() => []),
            scanDirectory(webComponentsPath, "component").catch(() => []),
            scanUtilities(sharedPath).catch(() => []),
            scanHooks(adminHooksPath).catch(() => []),
            scanDirectory(adminComponentsPath, "component").catch(() => []),
          ]);

          scanResults = [
            ...uiResults,
            ...webHooksResults,
            ...webComponentsResults,
            ...sharedResults,
            ...adminHooksResults,
            ...adminComponentsResults,
          ];
          break;
        }
      }

      // If dry run, just return what would be created/updated
      if (validated.dryRun) {
        return c.json({
          dryRun: true,
          itemsFound: scanResults.length,
          items: scanResults,
        });
      }

      // Upsert all items
      const results = {
        created: 0,
        updated: 0,
        errors: [] as Array<{ name: string; error: string }>,
      };

      for (const item of scanResults) {
        try {
          const result = await upsertRegistryItem(item);
          if (result.action === "created") {
            results.created++;
          } else {
            results.updated++;
          }
        } catch (error) {
          results.errors.push({
            name: item.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return c.json({
        success: true,
        scanType: validated.scanType,
        itemsFound: scanResults.length,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      });
    },
    { operation: "scanForgeRegistry" }
  )
);

export default router;
