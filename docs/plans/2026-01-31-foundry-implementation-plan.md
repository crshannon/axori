# Foundry Roadmap System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Foundry section - a product roadmap and release planning hub with Foundries, Features, Releases (Milestones), and Epics (Projects).

**Architecture:** Add two new database tables (foundries, features) and extend existing tables (milestones, projects). Create CRUD APIs for new entities. Build a three-tab admin UI (Timeline, Releases, Foundries) with React Query hooks. Add Active Release widget to Dashboard.

**Tech Stack:** Drizzle ORM, Hono API, React 19, TanStack Query, TanStack Router, Tailwind CSS 4, dnd-kit (drag-drop)

---

## Phase 1: Database Schema

### Task 1.1: Add Foundries Table

**Files:**
- Modify: `packages/db/src/schema/forge.ts`

**Step 1: Add forgeFoundries table after the enums section (around line 160)**

```typescript
// Foundries (business area groupings)
export const forgeFoundries = forgeSchema.table("foundries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#f59e0b"), // amber-500
  icon: text("icon").default("briefcase"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Step 2: Add forgeFoundriesRelations after the other relations (end of file)**

```typescript
export const forgeFoundriesRelations = relations(
  forgeFoundries,
  ({ many }) => ({
    features: many(forgeFeatures),
  })
);
```

**Step 3: Commit**

```bash
git add packages/db/src/schema/forge.ts
git commit -m "feat(db): add forgeFoundries table for business area groupings"
```

---

### Task 1.2: Add Features Table

**Files:**
- Modify: `packages/db/src/schema/forge.ts`

**Step 1: Add forgeFeatures table after forgeFoundries**

```typescript
// Features (long-lived capabilities within a Foundry)
export const forgeFeatures = forgeSchema.table(
  "features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull().unique(), // "FEAT-001"
    name: text("name").notNull(),
    description: text("description"),
    foundryId: uuid("foundry_id").references(() => forgeFoundries.id),
    color: text("color"),
    icon: text("icon"),
    status: text("status").default("active"), // active, deprecated, planned
    owner: text("owner"),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    foundryIdx: index("idx_forge_features_foundry").on(table.foundryId),
    identifierIdx: index("idx_forge_features_identifier").on(table.identifier),
  })
);
```

**Step 2: Add forgeFeaturesRelations**

```typescript
export const forgeFeaturesRelations = relations(
  forgeFeatures,
  ({ one, many }) => ({
    foundry: one(forgeFoundries, {
      fields: [forgeFeatures.foundryId],
      references: [forgeFoundries.id],
    }),
    projects: many(forgeProjects), // projects = epics
  })
);
```

**Step 3: Commit**

```bash
git add packages/db/src/schema/forge.ts
git commit -m "feat(db): add forgeFeatures table for long-lived capabilities"
```

---

### Task 1.3: Extend Milestones Table (Releases)

**Files:**
- Modify: `packages/db/src/schema/forge.ts`

**Step 1: Add version and isActive fields to forgeMilestones (around line 167)**

Find the `forgeMilestones` table definition and add these fields after `sortOrder`:

```typescript
  version: text("version"), // "0.1.0" semver
  isActive: boolean("is_active").default(false), // Only ONE release is active
```

**Step 2: Commit**

```bash
git add packages/db/src/schema/forge.ts
git commit -m "feat(db): add version and isActive fields to milestones for release tracking"
```

---

### Task 1.4: Extend Projects Table (Epics)

**Files:**
- Modify: `packages/db/src/schema/forge.ts`

**Step 1: Add featureId field to forgeProjects (around line 186)**

Find the `forgeProjects` table definition and add after `milestoneId`:

```typescript
  featureId: uuid("feature_id").references(() => forgeFeatures.id),
```

**Step 2: Update forgeProjectsRelations to include feature relation**

```typescript
export const forgeProjectsRelations = relations(
  forgeProjects,
  ({ one, many }) => ({
    milestone: one(forgeMilestones, {
      fields: [forgeProjects.milestoneId],
      references: [forgeMilestones.id],
    }),
    feature: one(forgeFeatures, {
      fields: [forgeProjects.featureId],
      references: [forgeFeatures.id],
    }),
    tickets: many(forgeTickets),
  })
);
```

**Step 3: Commit**

```bash
git add packages/db/src/schema/forge.ts
git commit -m "feat(db): add featureId to projects table to link epics to features"
```

---

### Task 1.5: Export Types

**Files:**
- Modify: `packages/db/src/types.ts`

**Step 1: Add type exports for new tables**

Find the forge types section and add:

```typescript
// Foundries
export type ForgeFoundry = InferSelectModel<typeof forgeFoundries>;
export type ForgeFoundryInsert = InferInsertModel<typeof forgeFoundries>;

// Features
export type ForgeFeature = InferSelectModel<typeof forgeFeatures>;
export type ForgeFeatureInsert = InferInsertModel<typeof forgeFeatures>;
```

**Step 2: Commit**

```bash
git add packages/db/src/types.ts
git commit -m "feat(db): export ForgeFoundry and ForgeFeature types"
```

---

### Task 1.6: Generate and Apply Migration

**Step 1: Generate migration**

```bash
pnpm db:generate
```

Expected: New migration file created in `packages/db/drizzle/`

**Step 2: Apply migration**

```bash
pnpm db:migrate
```

Expected: Migration applied successfully

**Step 3: Verify**

```bash
pnpm db:status
```

Expected: All migrations applied

**Step 4: Commit migration file**

```bash
git add packages/db/drizzle/
git commit -m "chore(db): add migration for foundry system tables"
```

---

## Phase 2: API Routes

### Task 2.1: Create Foundries API

**Files:**
- Create: `apps/api/src/routes/forge/foundries.ts`

**Step 1: Create the foundries route file**

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db, forgeFoundries, forgeFeatures } from "@axori/db";
import { requireAuth, withErrorHandling } from "../../middleware";
import { validateData, ApiError } from "../../utils/errors";

const router = new Hono();

// Validation schemas
const createFoundrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional(),
});

const updateFoundrySchema = createFoundrySchema.partial();

// GET /forge/foundries - List all foundries with features
router.get(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const foundries = await db.query.forgeFoundries.findMany({
      orderBy: [asc(forgeFoundries.sortOrder), asc(forgeFoundries.name)],
      with: {
        features: {
          orderBy: [asc(forgeFeatures.sortOrder), asc(forgeFeatures.name)],
        },
      },
    });
    return c.json(foundries);
  })
);

// GET /forge/foundries/:id - Get single foundry
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();
    const foundry = await db.query.forgeFoundries.findFirst({
      where: eq(forgeFoundries.id, id),
      with: {
        features: {
          orderBy: [asc(forgeFeatures.sortOrder), asc(forgeFeatures.name)],
        },
      },
    });
    if (!foundry) {
      throw new ApiError("Foundry not found", 404);
    }
    return c.json(foundry);
  })
);

// POST /forge/foundries - Create foundry
router.post(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const body = await c.req.json();
    const validated = validateData(body, createFoundrySchema, {
      operation: "createFoundry",
    });

    const [created] = await db
      .insert(forgeFoundries)
      .values(validated)
      .returning();

    return c.json(created, 201);
  })
);

// PUT /forge/foundries/:id - Update foundry
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const validated = validateData(body, updateFoundrySchema, {
      operation: "updateFoundry",
    });

    const [updated] = await db
      .update(forgeFoundries)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(forgeFoundries.id, id))
      .returning();

    if (!updated) {
      throw new ApiError("Foundry not found", 404);
    }

    return c.json(updated);
  })
);

// DELETE /forge/foundries/:id - Delete foundry
router.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();

    // Check for existing features
    const features = await db
      .select()
      .from(forgeFeatures)
      .where(eq(forgeFeatures.foundryId, id))
      .limit(1);

    if (features.length > 0) {
      throw new ApiError(
        "Cannot delete foundry with existing features. Delete features first.",
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
  })
);

export default router;
```

**Step 2: Commit**

```bash
git add apps/api/src/routes/forge/foundries.ts
git commit -m "feat(api): add CRUD endpoints for foundries"
```

---

### Task 2.2: Create Features API

**Files:**
- Create: `apps/api/src/routes/forge/features.ts`

**Step 1: Create the features route file**

```typescript
import { Hono } from "hono";
import { z } from "zod";
import { eq, asc, ilike, and, sql } from "drizzle-orm";
import { db, forgeFeatures, forgeFoundries, forgeProjects } from "@axori/db";
import { requireAuth, withErrorHandling } from "../../middleware";
import { validateData, ApiError } from "../../utils/errors";

const router = new Hono();

// Validation schemas
const createFeatureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  foundryId: z.string().uuid().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["active", "deprecated", "planned"]).optional(),
  owner: z.string().optional(),
  sortOrder: z.number().optional(),
});

const updateFeatureSchema = createFeatureSchema.partial();

// Helper: Generate next identifier
async function generateIdentifier(): Promise<string> {
  const result = await db
    .select({ identifier: forgeFeatures.identifier })
    .from(forgeFeatures)
    .orderBy(sql`${forgeFeatures.identifier} DESC`)
    .limit(1);

  if (result.length === 0) {
    return "FEAT-001";
  }

  const lastNum = parseInt(result[0].identifier.split("-")[1], 10);
  return `FEAT-${String(lastNum + 1).padStart(3, "0")}`;
}

// GET /forge/features - List features with optional filters
router.get(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const foundryId = c.req.query("foundryId");
    const status = c.req.query("status");
    const search = c.req.query("search");

    let query = db
      .select()
      .from(forgeFeatures)
      .orderBy(asc(forgeFeatures.sortOrder), asc(forgeFeatures.name))
      .$dynamic();

    const conditions = [];

    if (foundryId) {
      conditions.push(eq(forgeFeatures.foundryId, foundryId));
    }
    if (status) {
      conditions.push(eq(forgeFeatures.status, status));
    }
    if (search) {
      conditions.push(ilike(forgeFeatures.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const features = await query;
    return c.json(features);
  })
);

// GET /forge/features/:id - Get single feature with epics
router.get(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();
    const feature = await db.query.forgeFeatures.findFirst({
      where: eq(forgeFeatures.id, id),
      with: {
        foundry: true,
        projects: {
          with: {
            milestone: true,
          },
        },
      },
    });
    if (!feature) {
      throw new ApiError("Feature not found", 404);
    }
    return c.json(feature);
  })
);

// POST /forge/features - Create feature
router.post(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const body = await c.req.json();
    const validated = validateData(body, createFeatureSchema, {
      operation: "createFeature",
    });

    const identifier = await generateIdentifier();

    const [created] = await db
      .insert(forgeFeatures)
      .values({ ...validated, identifier })
      .returning();

    return c.json(created, 201);
  })
);

// PUT /forge/features/:id - Update feature
router.put(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const validated = validateData(body, updateFeatureSchema, {
      operation: "updateFeature",
    });

    const [updated] = await db
      .update(forgeFeatures)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(forgeFeatures.id, id))
      .returning();

    if (!updated) {
      throw new ApiError("Feature not found", 404);
    }

    return c.json(updated);
  })
);

// DELETE /forge/features/:id - Delete feature
router.delete(
  "/:id",
  requireAuth(),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();

    // Check for existing epics (projects)
    const epics = await db
      .select()
      .from(forgeProjects)
      .where(eq(forgeProjects.featureId, id))
      .limit(1);

    if (epics.length > 0) {
      throw new ApiError(
        "Cannot delete feature with existing epics. Delete epics first.",
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
  })
);

export default router;
```

**Step 2: Commit**

```bash
git add apps/api/src/routes/forge/features.ts
git commit -m "feat(api): add CRUD endpoints for features"
```

---

### Task 2.3: Enhance Milestones API (Releases)

**Files:**
- Modify: `apps/api/src/routes/forge/milestones.ts`

**Step 1: Add activate endpoint and active release query**

Add after existing routes:

```typescript
// GET /forge/milestones/active - Get active release with stats
router.get(
  "/active",
  requireAuth(),
  withErrorHandling(async (c) => {
    const milestone = await db.query.forgeMilestones.findFirst({
      where: eq(forgeMilestones.isActive, true),
      with: {
        projects: {
          with: {
            feature: true,
            tickets: true,
          },
        },
      },
    });

    if (!milestone) {
      return c.json(null);
    }

    // Calculate stats
    const totalTickets = milestone.projects.reduce(
      (sum, p) => sum + p.tickets.length,
      0
    );
    const doneTickets = milestone.projects.reduce(
      (sum, p) => sum + p.tickets.filter((t) => t.status === "done").length,
      0
    );
    const blockedTickets = milestone.projects.reduce(
      (sum, p) => sum + p.tickets.filter((t) => t.status === "blocked").length,
      0
    );

    return c.json({
      ...milestone,
      stats: {
        totalEpics: milestone.projects.length,
        totalTickets,
        doneTickets,
        blockedTickets,
        progress: totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0,
      },
    });
  })
);

// PUT /forge/milestones/:id/activate - Set as active release
router.put(
  "/:id/activate",
  requireAuth(),
  withErrorHandling(async (c) => {
    const { id } = c.req.param();

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
  })
);
```

**Step 2: Update createMilestoneSchema to include new fields**

```typescript
const createMilestoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
  version: z.string().optional(),
  isActive: z.boolean().optional(),
});
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/forge/milestones.ts
git commit -m "feat(api): add active release endpoints to milestones"
```

---

### Task 2.4: Register New Routes

**Files:**
- Modify: `apps/api/src/routes/forge/index.ts`

**Step 1: Import and register new routes**

Add imports at top:

```typescript
import foundries from "./foundries";
import features from "./features";
```

Add route registrations:

```typescript
app.route("/foundries", foundries);
app.route("/features", features);
```

**Step 2: Commit**

```bash
git add apps/api/src/routes/forge/index.ts
git commit -m "feat(api): register foundries and features routes"
```

---

## Phase 3: React Query Hooks

### Task 3.1: Create Foundries Hooks

**Files:**
- Create: `apps/admin/src/hooks/api/use-foundries.ts`

**Step 1: Create the hooks file**

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type { ForgeFoundry, ForgeFoundryInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api";

// Query key factory
export const foundryKeys = {
  all: ["forge", "foundries"] as const,
  lists: () => [...foundryKeys.all, "list"] as const,
  list: () => [...foundryKeys.lists()] as const,
  details: () => [...foundryKeys.all, "detail"] as const,
  detail: (id: string) => [...foundryKeys.details(), id] as const,
};

// Extended type with features
export interface FoundryWithFeatures extends ForgeFoundry {
  features: Array<{
    id: string;
    identifier: string;
    name: string;
    status: string | null;
  }>;
}

// GET all foundries
export function useFoundries() {
  const { user } = useUser();
  return useQuery({
    queryKey: foundryKeys.list(),
    queryFn: async () =>
      apiFetch<Array<FoundryWithFeatures>>("/api/forge/foundries", {
        clerkId: user?.id,
      }),
    enabled: !!user?.id,
  });
}

// GET single foundry
export function useFoundry(id: string) {
  const { user } = useUser();
  return useQuery({
    queryKey: foundryKeys.detail(id),
    queryFn: async () =>
      apiFetch<FoundryWithFeatures>(`/api/forge/foundries/${id}`, {
        clerkId: user?.id,
      }),
    enabled: !!user?.id && !!id,
  });
}

// CREATE foundry
export function useCreateFoundry() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (data: Omit<ForgeFoundryInsert, "id" | "createdAt" | "updatedAt">) =>
      apiFetch<ForgeFoundry>("/api/forge/foundries", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}

// UPDATE foundry
export function useUpdateFoundry() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ForgeFoundry> & { id: string }) =>
      apiFetch<ForgeFoundry>(`/api/forge/foundries/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: foundryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}

// DELETE foundry
export function useDeleteFoundry() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ success: boolean }>(`/api/forge/foundries/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/hooks/api/use-foundries.ts
git commit -m "feat(admin): add React Query hooks for foundries"
```

---

### Task 3.2: Create Features Hooks

**Files:**
- Create: `apps/admin/src/hooks/api/use-features.ts`

**Step 1: Create the hooks file**

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type { ForgeFeature, ForgeFeatureInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api";
import { foundryKeys } from "./use-foundries";

// Query key factory
export const featureKeys = {
  all: ["forge", "features"] as const,
  lists: () => [...featureKeys.all, "list"] as const,
  list: (filters: FeatureFilters) => [...featureKeys.lists(), filters] as const,
  details: () => [...featureKeys.all, "detail"] as const,
  detail: (id: string) => [...featureKeys.details(), id] as const,
};

export interface FeatureFilters {
  foundryId?: string;
  status?: string;
  search?: string;
}

// GET features with filters
export function useFeatures(filters?: FeatureFilters) {
  const { user } = useUser();
  return useQuery({
    queryKey: featureKeys.list(filters ?? {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.foundryId) params.append("foundryId", filters.foundryId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);

      const query = params.toString();
      return apiFetch<Array<ForgeFeature>>(
        `/api/forge/features${query ? `?${query}` : ""}`,
        { clerkId: user?.id }
      );
    },
    enabled: !!user?.id,
  });
}

// GET single feature with epics
export function useFeature(id: string) {
  const { user } = useUser();
  return useQuery({
    queryKey: featureKeys.detail(id),
    queryFn: async () =>
      apiFetch<ForgeFeature>(`/api/forge/features/${id}`, {
        clerkId: user?.id,
      }),
    enabled: !!user?.id && !!id,
  });
}

// CREATE feature
export function useCreateFeature() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (
      data: Omit<ForgeFeatureInsert, "id" | "identifier" | "createdAt" | "updatedAt">
    ) =>
      apiFetch<ForgeFeature>("/api/forge/features", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}

// UPDATE feature
export function useUpdateFeature() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ForgeFeature> & { id: string }) =>
      apiFetch<ForgeFeature>(`/api/forge/features/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}

// DELETE feature
export function useDeleteFeature() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ success: boolean }>(`/api/forge/features/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureKeys.lists() });
      queryClient.invalidateQueries({ queryKey: foundryKeys.lists() });
    },
  });
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/hooks/api/use-features.ts
git commit -m "feat(admin): add React Query hooks for features"
```

---

### Task 3.3: Enhance Milestones Hooks

**Files:**
- Modify: `apps/admin/src/hooks/api/use-milestones.ts`

**Step 1: Add active release hooks**

Add to existing file:

```typescript
// GET active release with stats
export function useActiveRelease() {
  const { user } = useUser();
  return useQuery({
    queryKey: [...milestoneKeys.all, "active"] as const,
    queryFn: async () =>
      apiFetch<ForgeMilestone & {
        stats: {
          totalEpics: number;
          totalTickets: number;
          doneTickets: number;
          blockedTickets: number;
          progress: number;
        };
        projects: Array<{
          id: string;
          name: string;
          feature: { id: string; name: string } | null;
          tickets: Array<{ id: string; status: string }>;
        }>;
      } | null>("/api/forge/milestones/active", { clerkId: user?.id }),
    enabled: !!user?.id,
  });
}

// Activate release
export function useActivateRelease() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (id: string) =>
      apiFetch<ForgeMilestone>(`/api/forge/milestones/${id}/activate`, {
        method: "PUT",
        clerkId: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    },
  });
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/hooks/api/use-milestones.ts
git commit -m "feat(admin): add active release hooks to milestones"
```

---

## Phase 4: Admin UI - Foundation

### Task 4.1: Update Sidebar Navigation

**Files:**
- Modify: `apps/admin/src/components/side-nav/SideNav.tsx`

**Step 1: Import Flame icon**

Add to imports:

```typescript
import {
  // ... existing imports
  Flame,
} from "lucide-react";
```

**Step 2: Replace Milestones nav item with Foundry**

Find the `forgeNavItems` array and change:

```typescript
// From:
{ to: "/milestones", icon: Flag, label: "Milestones", feature: "forge:tickets" },

// To:
{ to: "/foundry", icon: Flame, label: "Foundry", feature: "forge:tickets" },
```

**Step 3: Commit**

```bash
git add apps/admin/src/components/side-nav/SideNav.tsx
git commit -m "feat(admin): replace Milestones with Foundry in sidebar"
```

---

### Task 4.2: Create Foundry Page Shell

**Files:**
- Create: `apps/admin/src/routes/_authed/foundry.tsx`

**Step 1: Create the page with tab structure**

```typescript
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Plus } from "lucide-react";
import { clsx } from "clsx";

export const Route = createFileRoute("/_authed/foundry")({
  component: FoundryPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "timeline",
  }),
});

type Tab = "timeline" | "releases" | "foundries";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-amber-500/20 text-amber-400"
          : "text-slate-400 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function FoundryPage() {
  const { tab } = useSearch({ from: "/_authed/foundry" });
  const navigate = Route.useNavigate();

  const setTab = (newTab: Tab) => {
    navigate({ search: { tab: newTab } });
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Flame className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Foundry</h1>
              <p className="text-sm text-slate-400">
                Product roadmap and release planning
              </p>
            </div>
          </div>

          {/* Action button - changes per tab */}
          {tab === "foundries" && (
            <button className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors">
              <Plus className="h-4 w-4" />
              New Foundry
            </button>
          )}
          {tab === "releases" && (
            <button className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors">
              <Plus className="h-4 w-4" />
              New Release
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-xl bg-white/5 p-1 w-fit">
        <TabButton active={tab === "timeline"} onClick={() => setTab("timeline")}>
          Timeline
        </TabButton>
        <TabButton active={tab === "releases"} onClick={() => setTab("releases")}>
          Releases
        </TabButton>
        <TabButton active={tab === "foundries"} onClick={() => setTab("foundries")}>
          Foundries
        </TabButton>
      </div>

      {/* Tab Content */}
      <div>
        {tab === "timeline" && <TimelinePlaceholder />}
        {tab === "releases" && <ReleasesPlaceholder />}
        {tab === "foundries" && <FoundriesPlaceholder />}
      </div>
    </div>
  );
}

// Placeholder components - will be replaced
function TimelinePlaceholder() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
      <p className="text-slate-400">Timeline view coming soon</p>
    </div>
  );
}

function ReleasesPlaceholder() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
      <p className="text-slate-400">Releases view coming soon</p>
    </div>
  );
}

function FoundriesPlaceholder() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
      <p className="text-slate-400">Foundries view coming soon</p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/routes/_authed/foundry.tsx
git commit -m "feat(admin): add Foundry page shell with tab navigation"
```

---

## Phase 5: Foundries Tab Implementation

### Task 5.1: Create Foundry Card Component

**Files:**
- Create: `apps/admin/src/components/foundry/foundry-card.tsx`

**Step 1: Create the component**

```typescript
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import type { FoundryWithFeatures } from "@/hooks/api/use-foundries";

interface FoundryCardProps {
  foundry: FoundryWithFeatures;
  onEdit: (foundry: FoundryWithFeatures) => void;
  onDelete: (id: string) => void;
  onAddFeature: (foundryId: string) => void;
  onEditFeature: (feature: { id: string; name: string }) => void;
}

// Icon mapping - extend as needed
const ICON_MAP: Record<string, string> = {
  briefcase: "💼",
  code: "🔧",
  megaphone: "📢",
  search: "🔍",
  chart: "📊",
  zap: "⚡",
  settings: "⚙️",
};

export function FoundryCard({
  foundry,
  onEdit,
  onDelete,
  onAddFeature,
  onEditFeature,
}: FoundryCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const icon = ICON_MAP[foundry.icon || "briefcase"] || "💼";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
            style={{ backgroundColor: `${foundry.color}20` }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-white">{foundry.name} Foundry</h3>
            {foundry.description && (
              <p className="text-xs text-slate-500">{foundry.description}</p>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-white/10 bg-slate-900 py-1 shadow-xl">
                <button
                  onClick={() => {
                    onEdit(foundry);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this foundry?")) {
                      onDelete(foundry.id);
                    }
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="mt-4 flex flex-wrap gap-2">
        {foundry.features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => onEditFeature(feature)}
            className={clsx(
              "group rounded-lg bg-white/10 px-3 py-1.5 transition-colors hover:bg-white/15",
              feature.status === "deprecated" && "opacity-50"
            )}
          >
            <span className="text-sm text-white">{feature.name}</span>
          </button>
        ))}
        <button
          onClick={() => onAddFeature(foundry.id)}
          className="rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-xs text-slate-500 hover:border-white/40 hover:text-slate-300 transition-colors"
        >
          + Add Feature
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/components/foundry/foundry-card.tsx
git commit -m "feat(admin): add FoundryCard component"
```

---

### Task 5.2: Create Foundry Modal Component

**Files:**
- Create: `apps/admin/src/components/foundry/foundry-modal.tsx`

**Step 1: Create the modal component**

```typescript
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ForgeFoundry } from "@axori/db/types";

interface FoundryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FoundryFormData) => void;
  foundry?: ForgeFoundry | null;
  isPending?: boolean;
}

export interface FoundryFormData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

const ICON_OPTIONS = [
  { value: "briefcase", label: "💼 Briefcase" },
  { value: "code", label: "🔧 Code" },
  { value: "megaphone", label: "📢 Marketing" },
  { value: "search", label: "🔍 Search" },
  { value: "chart", label: "📊 Analytics" },
  { value: "zap", label: "⚡ Automation" },
  { value: "settings", label: "⚙️ Operations" },
];

const COLOR_OPTIONS = [
  { value: "#f59e0b", label: "Amber" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#10b981", label: "Emerald" },
  { value: "#f43f5e", label: "Rose" },
  { value: "#06b6d4", label: "Cyan" },
];

export function FoundryModal({
  isOpen,
  onClose,
  onSave,
  foundry,
  isPending,
}: FoundryModalProps) {
  const [formData, setFormData] = useState<FoundryFormData>({
    name: "",
    description: "",
    color: "#f59e0b",
    icon: "briefcase",
  });

  useEffect(() => {
    if (foundry) {
      setFormData({
        name: foundry.name,
        description: foundry.description || "",
        color: foundry.color || "#f59e0b",
        icon: foundry.icon || "briefcase",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#f59e0b",
        icon: "briefcase",
      });
    }
  }, [foundry, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {foundry ? "Edit Foundry" : "New Foundry"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Engineering"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What does this foundry cover?"
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none resize-none"
            />
          </div>

          {/* Icon & Color row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Icon
              </label>
              <select
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-amber-500/50 focus:outline-none"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Color
              </label>
              <select
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-amber-500/50 focus:outline-none"
              >
                {COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !formData.name}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving..." : foundry ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/components/foundry/foundry-modal.tsx
git commit -m "feat(admin): add FoundryModal component"
```

---

### Task 5.3: Create Feature Modal Component

**Files:**
- Create: `apps/admin/src/components/foundry/feature-modal.tsx`

**Step 1: Create the modal component**

```typescript
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ForgeFeature } from "@axori/db/types";

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FeatureFormData) => void;
  feature?: ForgeFeature | null;
  foundryId?: string | null;
  isPending?: boolean;
}

export interface FeatureFormData {
  name: string;
  description?: string;
  foundryId?: string;
  status?: "active" | "deprecated" | "planned";
  owner?: string;
}

export function FeatureModal({
  isOpen,
  onClose,
  onSave,
  feature,
  foundryId,
  isPending,
}: FeatureModalProps) {
  const [formData, setFormData] = useState<FeatureFormData>({
    name: "",
    description: "",
    foundryId: foundryId || undefined,
    status: "active",
    owner: "",
  });

  useEffect(() => {
    if (feature) {
      setFormData({
        name: feature.name,
        description: feature.description || "",
        foundryId: feature.foundryId || undefined,
        status: (feature.status as FeatureFormData["status"]) || "active",
        owner: feature.owner || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        foundryId: foundryId || undefined,
        status: "active",
        owner: "",
      });
    }
  }, [feature, foundryId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {feature ? "Edit Feature" : "New Feature"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Authentication"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What does this feature cover?"
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none resize-none"
            />
          </div>

          {/* Status & Owner row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as FeatureFormData["status"],
                  })
                }
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-amber-500/50 focus:outline-none"
              >
                <option value="active" className="bg-slate-900">
                  Active
                </option>
                <option value="planned" className="bg-slate-900">
                  Planned
                </option>
                <option value="deprecated" className="bg-slate-900">
                  Deprecated
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Owner
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
                placeholder="Team or person"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !formData.name}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving..." : feature ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/components/foundry/feature-modal.tsx
git commit -m "feat(admin): add FeatureModal component"
```

---

### Task 5.4: Create Foundries View Component

**Files:**
- Create: `apps/admin/src/components/foundry/foundries-view.tsx`

**Step 1: Create the view component**

```typescript
import { useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import type { ForgeFoundry, ForgeFeature } from "@axori/db/types";
import {
  useFoundries,
  useCreateFoundry,
  useUpdateFoundry,
  useDeleteFoundry,
  type FoundryWithFeatures,
} from "@/hooks/api/use-foundries";
import {
  useCreateFeature,
  useUpdateFeature,
} from "@/hooks/api/use-features";
import { FoundryCard } from "./foundry-card";
import { FoundryModal, type FoundryFormData } from "./foundry-modal";
import { FeatureModal, type FeatureFormData } from "./feature-modal";

interface FoundriesViewProps {
  onOpenModal: () => void;
}

export function FoundriesView({ onOpenModal }: FoundriesViewProps) {
  const { data: foundries, isLoading } = useFoundries();
  const createFoundry = useCreateFoundry();
  const updateFoundry = useUpdateFoundry();
  const deleteFoundry = useDeleteFoundry();
  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();

  // Modal state
  const [foundryModalOpen, setFoundryModalOpen] = useState(false);
  const [editingFoundry, setEditingFoundry] = useState<FoundryWithFeatures | null>(null);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<ForgeFeature | null>(null);
  const [selectedFoundryId, setSelectedFoundryId] = useState<string | null>(null);

  // Foundry handlers
  const handleOpenFoundryModal = (foundry?: FoundryWithFeatures) => {
    setEditingFoundry(foundry || null);
    setFoundryModalOpen(true);
  };

  const handleCloseFoundryModal = () => {
    setFoundryModalOpen(false);
    setEditingFoundry(null);
  };

  const handleSaveFoundry = (data: FoundryFormData) => {
    if (editingFoundry) {
      updateFoundry.mutate(
        { id: editingFoundry.id, ...data },
        { onSuccess: handleCloseFoundryModal }
      );
    } else {
      createFoundry.mutate(data, { onSuccess: handleCloseFoundryModal });
    }
  };

  const handleDeleteFoundry = (id: string) => {
    deleteFoundry.mutate(id);
  };

  // Feature handlers
  const handleOpenFeatureModal = (foundryId: string, feature?: ForgeFeature) => {
    setSelectedFoundryId(foundryId);
    setEditingFeature(feature || null);
    setFeatureModalOpen(true);
  };

  const handleCloseFeatureModal = () => {
    setFeatureModalOpen(false);
    setEditingFeature(null);
    setSelectedFoundryId(null);
  };

  const handleSaveFeature = (data: FeatureFormData) => {
    if (editingFeature) {
      updateFeature.mutate(
        { id: editingFeature.id, ...data },
        { onSuccess: handleCloseFeatureModal }
      );
    } else {
      createFeature.mutate(
        { ...data, foundryId: selectedFoundryId || undefined },
        { onSuccess: handleCloseFeatureModal }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading foundries...</div>
      </div>
    );
  }

  if (!foundries || foundries.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No foundries yet
          </h3>
          <p className="text-sm text-slate-400 mb-4 max-w-md">
            Create foundries to organize your work by business area - Engineering,
            Marketing, Operations, etc.
          </p>
          <button
            onClick={() => handleOpenFoundryModal()}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Create Your First Foundry
          </button>
        </div>

        <FoundryModal
          isOpen={foundryModalOpen}
          onClose={handleCloseFoundryModal}
          onSave={handleSaveFoundry}
          foundry={editingFoundry}
          isPending={createFoundry.isPending || updateFoundry.isPending}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {foundries.map((foundry) => (
          <FoundryCard
            key={foundry.id}
            foundry={foundry}
            onEdit={handleOpenFoundryModal}
            onDelete={handleDeleteFoundry}
            onAddFeature={(foundryId) => handleOpenFeatureModal(foundryId)}
            onEditFeature={(feature) =>
              handleOpenFeatureModal(foundry.id, feature as unknown as ForgeFeature)
            }
          />
        ))}
      </div>

      <FoundryModal
        isOpen={foundryModalOpen}
        onClose={handleCloseFoundryModal}
        onSave={handleSaveFoundry}
        foundry={editingFoundry}
        isPending={createFoundry.isPending || updateFoundry.isPending}
      />

      <FeatureModal
        isOpen={featureModalOpen}
        onClose={handleCloseFeatureModal}
        onSave={handleSaveFeature}
        feature={editingFeature}
        foundryId={selectedFoundryId}
        isPending={createFeature.isPending || updateFeature.isPending}
      />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/components/foundry/foundries-view.tsx
git commit -m "feat(admin): add FoundriesView component with full CRUD"
```

---

### Task 5.5: Wire Up Foundries Tab

**Files:**
- Modify: `apps/admin/src/routes/_authed/foundry.tsx`

**Step 1: Import and use FoundriesView**

Add import at top:

```typescript
import { FoundriesView } from "@/components/foundry/foundries-view";
```

**Step 2: Replace FoundriesPlaceholder usage**

Change:
```typescript
{tab === "foundries" && <FoundriesPlaceholder />}
```

To:
```typescript
{tab === "foundries" && (
  <FoundriesView
    onOpenModal={() => {
      // Will be wired to modal trigger
    }}
  />
)}
```

**Step 3: Delete FoundriesPlaceholder function**

**Step 4: Commit**

```bash
git add apps/admin/src/routes/_authed/foundry.tsx
git commit -m "feat(admin): wire up FoundriesView to Foundry page"
```

---

## Phase 6: Releases Tab Implementation

### Task 6.1: Create Release Card Component

**Files:**
- Create: `apps/admin/src/components/foundry/release-card.tsx`

**Step 1: Create the component**

```typescript
import { Calendar, MoreVertical, Pencil, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import type { ForgeMilestone } from "@axori/db/types";

interface ReleaseCardProps {
  release: ForgeMilestone & {
    projects?: Array<{
      id: string;
      name: string;
      feature?: { name: string } | null;
      tickets?: Array<{ status: string }>;
    }>;
  };
  onEdit: (release: ForgeMilestone) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
}

export function ReleaseCard({
  release,
  onEdit,
  onDelete,
  onActivate,
}: ReleaseCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Calculate progress from tickets
  const totalTickets = release.projects?.reduce(
    (sum, p) => sum + (p.tickets?.length || 0),
    0
  ) || 0;
  const doneTickets = release.projects?.reduce(
    (sum, p) => sum + (p.tickets?.filter((t) => t.status === "done").length || 0),
    0
  ) || 0;
  const progress = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

  // Calculate days remaining
  const daysRemaining = release.targetDate
    ? Math.ceil(
        (new Date(release.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isActive = release.isActive;

  return (
    <div
      className={clsx(
        "rounded-xl border p-5 transition-all",
        isActive
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-white/10 bg-white/5 hover:border-white/20"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          )}
          <h3 className="text-lg font-bold text-white">{release.name}</h3>
          {release.version && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
              {release.version}
            </span>
          )}
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-white/10 bg-slate-900 py-1 shadow-xl">
                <button
                  onClick={() => {
                    onEdit(release);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                {!isActive && (
                  <button
                    onClick={() => {
                      onActivate(release.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10"
                  >
                    <Zap className="h-4 w-4" />
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Delete this release?")) {
                      onDelete(release.id);
                    }
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Target date */}
      {release.targetDate && (
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Calendar className="h-4 w-4" />
          <span>
            Target: {new Date(release.targetDate).toLocaleDateString()}
          </span>
          {daysRemaining !== null && (
            <span
              className={clsx(
                "text-slate-500",
                daysRemaining < 7 && daysRemaining > 0 && "text-amber-400",
                daysRemaining <= 0 && "text-red-400"
              )}
            >
              · {daysRemaining > 0 ? `${daysRemaining} days` : "Overdue"}
            </span>
          )}
        </div>
      )}

      {/* Epic pills */}
      {release.projects && release.projects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {release.projects.slice(0, 4).map((project) => {
            const epicTotal = project.tickets?.length || 0;
            const epicDone = project.tickets?.filter((t) => t.status === "done").length || 0;
            const epicProgress = epicTotal > 0 ? Math.round((epicDone / epicTotal) * 100) : 0;
            return (
              <div
                key={project.id}
                className="rounded-lg bg-white/10 px-2 py-1"
              >
                <span className="text-xs text-white">
                  {project.feature?.name || project.name}
                </span>
                <span className="ml-1 text-xs text-slate-500">{epicProgress}%</span>
              </div>
            );
          })}
          {release.projects.length > 4 && (
            <span className="text-xs text-slate-500 self-center">
              +{release.projects.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="text-xs text-slate-500">
          {release.projects?.length || 0} epics · {totalTickets} tickets
        </span>
        {!isActive && (
          <button
            onClick={() => onActivate(release.id)}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            Set Active
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/components/foundry/release-card.tsx
git commit -m "feat(admin): add ReleaseCard component"
```

---

### Task 6.2: Create Releases View Component

**Files:**
- Create: `apps/admin/src/components/foundry/releases-view.tsx`

**Step 1: Create the view**

```typescript
import { useState } from "react";
import { Flag, Plus } from "lucide-react";
import type { ForgeMilestone } from "@axori/db/types";
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useActivateRelease,
} from "@/hooks/api/use-milestones";
import { ReleaseCard } from "./release-card";
import { ReleaseModal, type ReleaseFormData } from "./release-modal";

interface ReleasesViewProps {
  onOpenModal: () => void;
}

export function ReleasesView({ onOpenModal }: ReleasesViewProps) {
  const { data: releases, isLoading } = useMilestones();
  const createRelease = useCreateMilestone();
  const updateRelease = useUpdateMilestone();
  const deleteRelease = useDeleteMilestone();
  const activateRelease = useActivateRelease();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<ForgeMilestone | null>(null);

  const handleOpenModal = (release?: ForgeMilestone) => {
    setEditingRelease(release || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRelease(null);
  };

  const handleSave = (data: ReleaseFormData) => {
    if (editingRelease) {
      updateRelease.mutate(
        { id: editingRelease.id, ...data },
        { onSuccess: handleCloseModal }
      );
    } else {
      createRelease.mutate(data, { onSuccess: handleCloseModal });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading releases...</div>
      </div>
    );
  }

  if (!releases || releases.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Flag className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No releases yet
          </h3>
          <p className="text-sm text-slate-400 mb-4 max-w-md">
            Create releases to define your roadmap phases - MVP, Alpha, v1.0, etc.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Create Your First Release
          </button>
        </div>

        <ReleaseModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          release={editingRelease}
          isPending={createRelease.isPending || updateRelease.isPending}
        />
      </>
    );
  }

  // Sort: active first, then by sortOrder
  const sortedReleases = [...releases].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedReleases.map((release) => (
          <ReleaseCard
            key={release.id}
            release={release}
            onEdit={handleOpenModal}
            onDelete={(id) => deleteRelease.mutate(id)}
            onActivate={(id) => activateRelease.mutate(id)}
          />
        ))}
      </div>

      <ReleaseModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        release={editingRelease}
        isPending={createRelease.isPending || updateRelease.isPending}
      />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/components/foundry/releases-view.tsx
git commit -m "feat(admin): add ReleasesView component"
```

---

### Task 6.3: Create Release Modal Component

**Files:**
- Create: `apps/admin/src/components/foundry/release-modal.tsx`

**Step 1: Create the modal**

```typescript
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ForgeMilestone } from "@axori/db/types";

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReleaseFormData) => void;
  release?: ForgeMilestone | null;
  isPending?: boolean;
}

export interface ReleaseFormData {
  name: string;
  description?: string;
  version?: string;
  targetDate?: string;
  status?: "active" | "completed" | "archived";
  color?: string;
}

export function ReleaseModal({
  isOpen,
  onClose,
  onSave,
  release,
  isPending,
}: ReleaseModalProps) {
  const [formData, setFormData] = useState<ReleaseFormData>({
    name: "",
    description: "",
    version: "",
    targetDate: "",
    status: "active",
    color: "#f59e0b",
  });

  useEffect(() => {
    if (release) {
      setFormData({
        name: release.name,
        description: release.description || "",
        version: release.version || "",
        targetDate: release.targetDate || "",
        status: release.status || "active",
        color: release.color || "#f59e0b",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        version: "",
        targetDate: "",
        status: "active",
        color: "#f59e0b",
      });
    }
  }, [release, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {release ? "Edit Release" : "New Release"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., MVP"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                placeholder="e.g., 0.1.0"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What's included in this release?"
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Date
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData({ ...formData, targetDate: e.target.value })
                }
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ReleaseFormData["status"],
                  })
                }
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-amber-500/50 focus:outline-none"
              >
                <option value="active" className="bg-slate-900">Active</option>
                <option value="completed" className="bg-slate-900">Completed</option>
                <option value="archived" className="bg-slate-900">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !formData.name}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving..." : release ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/components/foundry/release-modal.tsx
git commit -m "feat(admin): add ReleaseModal component"
```

---

### Task 6.4: Wire Up Releases Tab

**Files:**
- Modify: `apps/admin/src/routes/_authed/foundry.tsx`

**Step 1: Import ReleasesView**

```typescript
import { ReleasesView } from "@/components/foundry/releases-view";
```

**Step 2: Replace ReleasesPlaceholder**

Change:
```typescript
{tab === "releases" && <ReleasesPlaceholder />}
```

To:
```typescript
{tab === "releases" && <ReleasesView onOpenModal={() => {}} />}
```

**Step 3: Delete ReleasesPlaceholder function**

**Step 4: Commit**

```bash
git add apps/admin/src/routes/_authed/foundry.tsx
git commit -m "feat(admin): wire up ReleasesView to Foundry page"
```

---

## Phase 7: Timeline Tab Implementation

### Task 7.1: Create Timeline View Component

**Files:**
- Create: `apps/admin/src/components/foundry/timeline-view.tsx`

**Step 1: Create a simplified timeline view (without drag-drop for now)**

```typescript
import { clsx } from "clsx";
import { useMilestones } from "@/hooks/api/use-milestones";
import { useFoundries } from "@/hooks/api/use-foundries";
import { useProjects } from "@/hooks/api/use-projects";

export function TimelineView() {
  const { data: releases, isLoading: releasesLoading } = useMilestones();
  const { data: foundries, isLoading: foundriesLoading } = useFoundries();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const isLoading = releasesLoading || foundriesLoading || projectsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading timeline...</div>
      </div>
    );
  }

  if (!releases?.length || !foundries?.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
        <p className="text-slate-400 mb-2">
          Create foundries and releases to see the timeline
        </p>
        <p className="text-xs text-slate-500">
          Go to the Foundries and Releases tabs to get started
        </p>
      </div>
    );
  }

  // Sort releases by sortOrder
  const sortedReleases = [...releases].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
  );

  // Group projects (epics) by feature and release
  const epicsByFeatureAndRelease = new Map<string, Map<string, typeof projects>>();

  foundries.forEach((foundry) => {
    foundry.features.forEach((feature) => {
      const featureEpics = new Map<string, typeof projects>();
      sortedReleases.forEach((release) => {
        const epics = projects?.filter(
          (p) => p.featureId === feature.id && p.milestoneId === release.id
        ) || [];
        featureEpics.set(release.id, epics);
      });
      epicsByFeatureAndRelease.set(feature.id, featureEpics);
    });
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header row - releases */}
        <div className="flex border-b border-white/10 pb-4 mb-4">
          <div className="w-48 shrink-0 pr-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              Features
            </span>
          </div>
          {sortedReleases.map((release) => (
            <div
              key={release.id}
              className={clsx(
                "flex-1 min-w-[180px] px-4 border-l border-white/10",
                release.isActive && "bg-amber-500/5 border-l-amber-500/50"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {release.isActive && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
                <span className="font-medium text-white">{release.name}</span>
                {release.version && (
                  <span className="text-xs text-slate-500">{release.version}</span>
                )}
              </div>
              {/* Release progress */}
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${release.progressPercent || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Body - foundries and features */}
        {foundries.map((foundry) => (
          <div key={foundry.id} className="mb-6">
            {/* Foundry header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-white">
                {foundry.name}
              </span>
            </div>

            {/* Features */}
            {foundry.features.map((feature) => (
              <div key={feature.id} className="flex mb-2">
                {/* Feature name */}
                <div className="w-48 shrink-0 pr-4">
                  <span className="text-sm text-slate-300">{feature.name}</span>
                </div>

                {/* Epics per release */}
                {sortedReleases.map((release) => {
                  const featureEpics = epicsByFeatureAndRelease.get(feature.id);
                  const epics = featureEpics?.get(release.id) || [];

                  return (
                    <div
                      key={release.id}
                      className={clsx(
                        "flex-1 min-w-[180px] px-4 border-l border-white/10",
                        release.isActive && "bg-amber-500/5 border-l-amber-500/50"
                      )}
                    >
                      {epics.length > 0 ? (
                        <div className="space-y-1">
                          {epics.map((epic) => {
                            // Calculate epic progress from tickets
                            const totalTickets = epic.tickets?.length || 0;
                            const doneTickets =
                              epic.tickets?.filter((t) => t.status === "done")
                                .length || 0;
                            const progress =
                              totalTickets > 0
                                ? Math.round((doneTickets / totalTickets) * 100)
                                : 0;

                            return (
                              <div
                                key={epic.id}
                                className="rounded-lg border border-white/10 bg-white/5 p-2 hover:border-amber-500/30 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-400">
                                    {epic.name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {doneTickets}/{totalTickets}
                                  </span>
                                </div>
                                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <button className="w-full rounded-lg border border-dashed border-white/10 p-2 text-xs text-slate-600 hover:border-white/30 hover:text-slate-400 transition-colors">
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/components/foundry/timeline-view.tsx
git commit -m "feat(admin): add TimelineView component"
```

---

### Task 7.2: Wire Up Timeline Tab

**Files:**
- Modify: `apps/admin/src/routes/_authed/foundry.tsx`

**Step 1: Import TimelineView**

```typescript
import { TimelineView } from "@/components/foundry/timeline-view";
```

**Step 2: Replace TimelinePlaceholder**

Change:
```typescript
{tab === "timeline" && <TimelinePlaceholder />}
```

To:
```typescript
{tab === "timeline" && <TimelineView />}
```

**Step 3: Delete TimelinePlaceholder function**

**Step 4: Commit**

```bash
git add apps/admin/src/routes/_authed/foundry.tsx
git commit -m "feat(admin): wire up TimelineView to Foundry page"
```

---

## Phase 8: Dashboard Widget

### Task 8.1: Create Active Release Widget

**Files:**
- Create: `apps/admin/src/components/dashboard/active-release-widget.tsx`

**Step 1: Create the widget component**

```typescript
import { Calendar, Target } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import { useActiveRelease } from "@/hooks/api/use-milestones";

export function ActiveReleaseWidget() {
  const { data: release, isLoading } = useActiveRelease();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-4" />
        <div className="h-6 w-48 bg-white/10 rounded mb-2" />
        <div className="h-2 w-full bg-white/10 rounded" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
            <Target className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Active Release
          </span>
        </div>
        <p className="text-sm text-slate-400 mb-4">No active release set</p>
        <Link
          to="/foundry"
          search={{ tab: "releases" }}
          className="text-xs text-amber-400 hover:text-amber-300"
        >
          Set one →
        </Link>
      </div>
    );
  }

  const { stats } = release;
  const daysRemaining = release.targetDate
    ? Math.ceil(
        (new Date(release.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
          <Target className="h-4 w-4 text-amber-400" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
          Active Release
        </span>
      </div>

      {/* Release info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-bold text-white">{release.name}</h3>
          {release.version && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
              {release.version}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-white">{stats.progress}%</span>
        </div>
      </div>

      {/* Target date */}
      {release.targetDate && (
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Calendar className="h-4 w-4" />
          <span>
            Target: {new Date(release.targetDate).toLocaleDateString()}
          </span>
          {daysRemaining !== null && (
            <>
              <span className="text-slate-500">·</span>
              <span
                className={clsx(
                  daysRemaining < 7 && daysRemaining > 0 && "text-amber-400",
                  daysRemaining <= 0 && "text-red-400"
                )}
              >
                {daysRemaining > 0 ? `${daysRemaining} days` : "Overdue"}
              </span>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{stats.totalEpics} epics</span>
          <span>·</span>
          <span>{stats.totalTickets} tickets</span>
          {stats.blockedTickets > 0 && (
            <>
              <span>·</span>
              <span className="text-red-400">{stats.blockedTickets} blocked</span>
            </>
          )}
        </div>
        <Link
          to="/foundry"
          className="text-xs text-amber-400 hover:text-amber-300"
        >
          View →
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/admin/src/components/dashboard/active-release-widget.tsx
git commit -m "feat(admin): add ActiveReleaseWidget for dashboard"
```

---

### Task 8.2: Add Widget to Dashboard

**Files:**
- Modify: `apps/admin/src/routes/_authed/dashboard.tsx`

**Step 1: Import the widget**

```typescript
import { ActiveReleaseWidget } from "@/components/dashboard/active-release-widget";
```

**Step 2: Add widget to dashboard grid**

Find the dashboard layout and add the widget in an appropriate location (likely in the main grid):

```typescript
<ActiveReleaseWidget />
```

**Step 3: Commit**

```bash
git add apps/admin/src/routes/_authed/dashboard.tsx
git commit -m "feat(admin): add ActiveReleaseWidget to dashboard"
```

---

## Phase 9: Verification & Cleanup

### Task 9.1: Run Type Check

**Step 1: Run type check**

```bash
pnpm type-check
```

Expected: No TypeScript errors

### Task 9.2: Run Lint

**Step 1: Run lint**

```bash
pnpm lint
```

Expected: No lint errors

### Task 9.3: Run Tests

**Step 1: Run tests**

```bash
pnpm test
```

Expected: All tests pass

### Task 9.4: Manual Testing

**Step 1: Start dev servers**

```bash
pnpm dev
pnpm dev:api
```

**Step 2: Test Foundry page**

1. Navigate to `/foundry`
2. Verify tabs switch correctly
3. Create a foundry and feature
4. Create a release
5. Verify active release appears on dashboard

### Task 9.5: Final Commit

```bash
git add -A
git commit -m "feat(admin): complete Foundry roadmap system implementation"
```

---

## Summary

This plan implements the Foundry roadmap system with:

| Phase | Tasks | Purpose |
|-------|-------|---------|
| 1 | 1.1-1.6 | Database schema (Foundries, Features, enhanced Milestones/Projects) |
| 2 | 2.1-2.4 | API routes (CRUD for new entities) |
| 3 | 3.1-3.3 | React Query hooks |
| 4 | 4.1-4.2 | Navigation and page shell |
| 5 | 5.1-5.5 | Foundries tab with full CRUD |
| 6 | 6.1-6.4 | Releases tab with full CRUD |
| 7 | 7.1-7.2 | Timeline view (read-only for MVP) |
| 8 | 8.1-8.2 | Dashboard widget |
| 9 | 9.1-9.5 | Verification and cleanup |

**Note:** Timeline drag-and-drop can be added as a follow-up task using dnd-kit.
