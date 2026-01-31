# Decision Ledger Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement decision capture, AI-powered matching, and injection into agent prompts.

**Architecture:** Decisions stored in existing `forge.decisions` table, matched via Haiku call before agent execution, injected as markdown section in agent prompts.

**Tech Stack:** Drizzle ORM, Hono API, TanStack Router/Query, Claude Haiku

---

## Task 1: API - Decisions CRUD Endpoints

**Files:**
- Create: `apps/api/src/routes/forge/decisions.ts`
- Modify: `apps/api/src/routes/forge/index.ts`

**Step 1: Create the decisions route file**

```typescript
// apps/api/src/routes/forge/decisions.ts
/**
 * Forge Decisions API Routes
 *
 * CRUD operations for the Decision Ledger
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  forgeDecisions,
  eq,
  desc,
  sql,
} from "@axori/db";
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
  decision: z.string().min(1, "Decision text is required").max(1000),
  context: z.string().max(2000).nullable().optional(),
  category: decisionCategoryEnum,
  scope: z.array(z.string()).nullable().optional(),
});

const updateDecisionSchema = createDecisionSchema.partial().extend({
  active: z.boolean().optional(),
});

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

      let query = db.select().from(forgeDecisions);

      const conditions = [];

      if (category) {
        const parsed = decisionCategoryEnum.safeParse(category);
        if (parsed.success) {
          conditions.push(eq(forgeDecisions.category, parsed.data));
        }
      }

      if (active !== undefined) {
        conditions.push(eq(forgeDecisions.active, active === "true"));
      }

      if (search) {
        conditions.push(
          sql`${forgeDecisions.decision} ILIKE ${"%" + search + "%"}`
        );
      }

      const decisions = await db
        .select()
        .from(forgeDecisions)
        .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
        .orderBy(desc(forgeDecisions.createdAt));

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

      // Generate identifier (DEC-001, DEC-002, etc.)
      const [maxResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(forgeDecisions);
      const nextNum = (maxResult?.count || 0) + 1;
      const identifier = `DEC-${String(nextNum).padStart(3, "0")}`;

      const [created] = await db
        .insert(forgeDecisions)
        .values({
          identifier,
          decision: validated.decision,
          context: validated.context || null,
          category: validated.category,
          scope: validated.scope || null,
          active: true,
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

      const [updated] = await db
        .update(forgeDecisions)
        .set({
          ...validated,
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
 * Toggle a decision's active status
 */
router.patch(
  "/:id/toggle",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const id = c.req.param("id");

      // Get current state
      const [current] = await db
        .select({ active: forgeDecisions.active })
        .from(forgeDecisions)
        .where(eq(forgeDecisions.id, id))
        .limit(1);

      if (!current) {
        throw new ApiError("Decision not found", 404);
      }

      const [updated] = await db
        .update(forgeDecisions)
        .set({
          active: !current.active,
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
```

**Step 2: Register the route in index**

Modify `apps/api/src/routes/forge/index.ts` to add:

```typescript
import decisionsRouter from "./decisions";

// Add after other routes
router.route("/decisions", decisionsRouter);
```

**Step 3: Verify the build**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/routes/forge/decisions.ts apps/api/src/routes/forge/index.ts
git commit -m "feat(api): add decisions CRUD endpoints"
```

---

## Task 2: Frontend - Decisions Query Hooks

**Files:**
- Create: `apps/admin/src/hooks/api/use-decisions.ts`
- Modify: `apps/admin/src/hooks/api/index.ts`

**Step 1: Create the decisions hook file**

```typescript
// apps/admin/src/hooks/api/use-decisions.ts
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ForgeDecision, ForgeDecisionInsert } from "@axori/db/types";
import { apiFetch } from "@/lib/api/client";

// Query keys for decisions
export const decisionKeys = {
  all: ["forge", "decisions"] as const,
  lists: () => [...decisionKeys.all, "list"] as const,
  list: (filters: DecisionFilters) => [...decisionKeys.lists(), filters] as const,
  details: () => [...decisionKeys.all, "detail"] as const,
  detail: (id: string) => [...decisionKeys.details(), id] as const,
};

export interface DecisionFilters {
  category?: ForgeDecision["category"];
  active?: boolean;
  search?: string;
}

/**
 * Fetch all decisions with optional filters
 */
export function useDecisions(
  filters?: DecisionFilters,
  options?: Omit<UseQueryOptions<Array<ForgeDecision>>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: decisionKeys.list(filters ?? {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }
      const queryString = params.toString();
      const endpoint = `/api/forge/decisions${queryString ? `?${queryString}` : ""}`;
      return apiFetch<Array<ForgeDecision>>(endpoint, { clerkId: user?.id });
    },
    enabled: !!user?.id,
    ...options,
  });
}

/**
 * Fetch a single decision by ID
 */
export function useDecision(
  id: string,
  options?: Omit<UseQueryOptions<ForgeDecision>, "queryKey" | "queryFn">
) {
  const { user } = useUser();

  return useQuery({
    queryKey: decisionKeys.detail(id),
    queryFn: async () => {
      return apiFetch<ForgeDecision>(`/api/forge/decisions/${id}`, {
        clerkId: user?.id,
      });
    },
    enabled: !!user?.id && !!id,
    ...options,
  });
}

/**
 * Create a new decision
 */
export function useCreateDecision() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (data: Omit<ForgeDecisionInsert, "id" | "identifier">) => {
      return apiFetch<ForgeDecision>("/api/forge/decisions", {
        method: "POST",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.lists() });
    },
  });
}

/**
 * Update a decision
 */
export function useUpdateDecision() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ForgeDecision> & { id: string }) => {
      return apiFetch<ForgeDecision>(`/api/forge/decisions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        clerkId: user?.id,
      });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: decisionKeys.lists() });
    },
  });
}

/**
 * Toggle a decision's active status
 */
export function useToggleDecision() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<ForgeDecision>(`/api/forge/decisions/${id}/toggle`, {
        method: "PATCH",
        clerkId: user?.id,
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: decisionKeys.lists() });
    },
  });
}

/**
 * Delete a decision
 */
export function useDeleteDecision() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ success: boolean }>(`/api/forge/decisions/${id}`, {
        method: "DELETE",
        clerkId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: decisionKeys.lists() });
    },
  });
}
```

**Step 2: Export from index**

Add to `apps/admin/src/hooks/api/index.ts`:

```typescript
export * from "./use-decisions";
```

**Step 3: Verify the build**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/admin/src/hooks/api/use-decisions.ts apps/admin/src/hooks/api/index.ts
git commit -m "feat(admin): add decisions query hooks"
```

---

## Task 3: Frontend - Decisions List Page

**Files:**
- Create: `apps/admin/src/routes/_authed/decisions.tsx`
- Create: `apps/admin/src/components/decisions/decision-card.tsx`
- Create: `apps/admin/src/components/decisions/decision-modal.tsx`

**Step 1: Create the decision card component**

```typescript
// apps/admin/src/components/decisions/decision-card.tsx
import { clsx } from "clsx";
import { MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ForgeDecision } from "@axori/db/types";

interface DecisionCardProps {
  decision: ForgeDecision;
  onEdit: (decision: ForgeDecision) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  code_standards: "bg-blue-500/20 text-blue-400",
  architecture: "bg-purple-500/20 text-purple-400",
  testing: "bg-green-500/20 text-green-400",
  design: "bg-pink-500/20 text-pink-400",
  process: "bg-amber-500/20 text-amber-400",
  tooling: "bg-cyan-500/20 text-cyan-400",
  product: "bg-orange-500/20 text-orange-400",
  performance: "bg-red-500/20 text-red-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  code_standards: "Code Standards",
  architecture: "Architecture",
  testing: "Testing",
  design: "Design",
  process: "Process",
  tooling: "Tooling",
  product: "Product",
  performance: "Performance",
};

export function DecisionCard({
  decision,
  onEdit,
  onToggle,
  onDelete,
}: DecisionCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={clsx(
        "group relative rounded-xl border p-4 transition-all",
        decision.active
          ? "border-white/10 bg-white/5 hover:border-white/20"
          : "border-white/5 bg-white/[0.02] opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">
            {decision.identifier}
          </span>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              CATEGORY_COLORS[decision.category] || "bg-slate-500/20 text-slate-400"
            )}
          >
            {CATEGORY_LABELS[decision.category] || decision.category}
          </span>
          {!decision.active && (
            <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-500">
              Inactive
            </span>
          )}
        </div>

        {/* Actions Menu */}
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
                    onEdit(decision);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onToggle(decision.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Power className="h-4 w-4" />
                  {decision.active ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this decision?")) {
                      onDelete(decision.id);
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

      {/* Decision Text */}
      <p className="text-sm text-white mb-2">{decision.decision}</p>

      {/* Context */}
      {decision.context && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
          {decision.context}
        </p>
      )}

      {/* Scope Tags */}
      {decision.scope && decision.scope.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {decision.scope.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-700/50 px-1.5 py-0.5 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create the decision modal component**

```typescript
// apps/admin/src/components/decisions/decision-modal.tsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import type { ForgeDecision } from "@axori/db/types";

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DecisionFormData) => void;
  decision?: ForgeDecision | null;
  isPending?: boolean;
}

export interface DecisionFormData {
  decision: string;
  context: string | null;
  category: ForgeDecision["category"];
  scope: Array<string> | null;
}

const CATEGORIES = [
  { value: "code_standards", label: "Code Standards" },
  { value: "architecture", label: "Architecture" },
  { value: "testing", label: "Testing" },
  { value: "design", label: "Design" },
  { value: "process", label: "Process" },
  { value: "tooling", label: "Tooling" },
  { value: "product", label: "Product" },
  { value: "performance", label: "Performance" },
] as const;

export function DecisionModal({
  isOpen,
  onClose,
  onSave,
  decision,
  isPending,
}: DecisionModalProps) {
  const [decisionText, setDecisionText] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<ForgeDecision["category"]>("code_standards");
  const [scopeInput, setScopeInput] = useState("");
  const [scope, setScope] = useState<Array<string>>([]);

  // Reset form when modal opens/closes or decision changes
  useEffect(() => {
    if (isOpen && decision) {
      setDecisionText(decision.decision);
      setContext(decision.context || "");
      setCategory(decision.category);
      setScope(decision.scope || []);
    } else if (isOpen) {
      setDecisionText("");
      setContext("");
      setCategory("code_standards");
      setScope([]);
    }
    setScopeInput("");
  }, [isOpen, decision]);

  const handleAddScope = () => {
    const tag = scopeInput.trim().toLowerCase();
    if (tag && !scope.includes(tag)) {
      setScope([...scope, tag]);
    }
    setScopeInput("");
  };

  const handleRemoveScope = (tag: string) => {
    setScope(scope.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (!decisionText.trim()) return;

    onSave({
      decision: decisionText.trim(),
      context: context.trim() || null,
      category,
      scope: scope.length > 0 ? scope : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {decision ? "Edit Decision" : "Capture Decision"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Decision */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Decision *
            </label>
            <textarea
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              placeholder="Always use Zod for API validation"
              rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Context (why?)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Had runtime type errors in production..."
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ForgeDecision["category"])}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-slate-900">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Scope Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={scopeInput}
                onChange={(e) => setScopeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddScope();
                  }
                }}
                placeholder="api, validation, hooks..."
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
              <button
                type="button"
                onClick={handleAddScope}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                Add
              </button>
            </div>
            {scope.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {scope.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-1 text-xs text-violet-300"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveScope(tag)}
                      className="hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!decisionText.trim() || isPending}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all",
              "bg-violet-600 hover:bg-violet-500 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isPending ? "Saving..." : decision ? "Save Changes" : "Save Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create the decisions page**

```typescript
// apps/admin/src/routes/_authed/decisions.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Scale, Search } from "lucide-react";
import { clsx } from "clsx";
import type { ForgeDecision } from "@axori/db/types";
import {
  useDecisions,
  useCreateDecision,
  useUpdateDecision,
  useToggleDecision,
  useDeleteDecision,
} from "@/hooks/api/use-decisions";
import { DecisionCard } from "@/components/decisions/decision-card";
import { DecisionModal, type DecisionFormData } from "@/components/decisions/decision-modal";

export const Route = createFileRoute("/_authed/decisions" as any)({
  component: DecisionsPage,
});

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "code_standards", label: "Code Standards" },
  { value: "architecture", label: "Architecture" },
  { value: "testing", label: "Testing" },
  { value: "design", label: "Design" },
  { value: "process", label: "Process" },
  { value: "tooling", label: "Tooling" },
  { value: "product", label: "Product" },
  { value: "performance", label: "Performance" },
] as const;

function DecisionsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<ForgeDecision | null>(null);

  const { data: decisions, isLoading } = useDecisions({
    category: categoryFilter || undefined,
    active: showInactive ? undefined : true,
    search: search || undefined,
  });

  const createDecision = useCreateDecision();
  const updateDecision = useUpdateDecision();
  const toggleDecision = useToggleDecision();
  const deleteDecision = useDeleteDecision();

  const handleOpenModal = (decision?: ForgeDecision) => {
    setEditingDecision(decision || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDecision(null);
  };

  const handleSave = (data: DecisionFormData) => {
    if (editingDecision) {
      updateDecision.mutate(
        { id: editingDecision.id, ...data },
        { onSuccess: handleCloseModal }
      );
    } else {
      createDecision.mutate(data, { onSuccess: handleCloseModal });
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20">
              <Scale className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Decisions</h1>
              <p className="text-sm text-slate-400">
                Institutional memory for your codebase
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Decision
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:border-violet-500/50 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-violet-500/50 focus:outline-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value} className="bg-slate-900">
              {cat.label}
            </option>
          ))}
        </select>

        {/* Show Inactive Toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500/50"
          />
          Show inactive
        </label>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading decisions...</div>
        </div>
      ) : decisions && decisions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onEdit={handleOpenModal}
              onToggle={(id) => toggleDecision.mutate(id)}
              onDelete={(id) => deleteDecision.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Scale className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            No decisions yet
          </h3>
          <p className="text-sm text-slate-400 mb-4 max-w-md">
            Capture coding decisions, architectural choices, and conventions.
            They'll be injected into agent prompts to maintain consistency.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Capture Your First Decision
          </button>
        </div>
      )}

      {/* Modal */}
      <DecisionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        decision={editingDecision}
        isPending={createDecision.isPending || updateDecision.isPending}
      />
    </div>
  );
}
```

**Step 4: Verify the build**

Run: `pnpm type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/admin/src/routes/_authed/decisions.tsx apps/admin/src/components/decisions/
git commit -m "feat(admin): add decisions list page and components"
```

---

## Task 4: Decision Matching Service

**Files:**
- Create: `apps/api/src/services/forge/decisions.ts`

**Step 1: Create the decision matching service**

```typescript
// apps/api/src/services/forge/decisions.ts
/**
 * Decision Matching Service
 *
 * Matches relevant decisions to tickets using Haiku for intelligent selection.
 */

import { db, forgeDecisions, eq } from "@axori/db";
import type { ForgeDecision } from "@axori/db/types";
import Anthropic from "@anthropic-ai/sdk";

// =============================================================================
// Types
// =============================================================================

interface TicketContext {
  title: string;
  description: string | null;
  type: string | null;
  labels: Array<string> | null;
}

// =============================================================================
// Client
// =============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Get all active decisions from the database
 */
export async function getActiveDecisions(): Promise<Array<ForgeDecision>> {
  return db
    .select()
    .from(forgeDecisions)
    .where(eq(forgeDecisions.active, true));
}

/**
 * Match decisions to a ticket using Haiku
 *
 * Uses a small, fast model to pick which decisions are relevant
 * to the given ticket context.
 */
export async function matchDecisionsForTicket(
  context: TicketContext
): Promise<Array<ForgeDecision>> {
  const allDecisions = await getActiveDecisions();

  // If no decisions, return empty
  if (allDecisions.length === 0) {
    return [];
  }

  // If only a few decisions, include all of them
  if (allDecisions.length <= 5) {
    return allDecisions;
  }

  try {
    const client = getAnthropicClient();

    // Build the prompt for Haiku
    const decisionsList = allDecisions
      .map(
        (d) =>
          `- ${d.identifier}: ${d.decision}${d.scope?.length ? ` [tags: ${d.scope.join(", ")}]` : ""}`
      )
      .join("\n");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are helping select relevant coding decisions for a development task.

Given this ticket:
- Title: ${context.title}
- Description: ${context.description || "None"}
- Type: ${context.type || "Unknown"}
- Labels: ${context.labels?.join(", ") || "None"}

Which of these decisions are relevant to this work? Return ONLY a JSON array of decision identifiers (e.g., ["DEC-001", "DEC-003"]). Return at most 7 decisions. If none are relevant, return [].

Decisions:
${decisionsList}

Respond with just the JSON array, no explanation.`,
        },
      ],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== "text") {
      console.warn("[matchDecisions] Unexpected response type:", content.type);
      return allDecisions.slice(0, 5); // Fallback to first 5
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }

    const matchedIds = JSON.parse(jsonText) as Array<string>;

    if (!Array.isArray(matchedIds)) {
      console.warn("[matchDecisions] Invalid response format:", jsonText);
      return allDecisions.slice(0, 5);
    }

    // Filter to matched decisions
    const matched = allDecisions.filter((d) =>
      matchedIds.includes(d.identifier)
    );

    console.log(
      `[matchDecisions] Matched ${matched.length}/${allDecisions.length} decisions for "${context.title}"`
    );

    return matched;
  } catch (error) {
    console.error("[matchDecisions] Error matching decisions:", error);
    // Fallback: return first 5 decisions on error
    return allDecisions.slice(0, 5);
  }
}

/**
 * Format decisions for injection into agent prompt
 */
export function formatDecisionsForPrompt(decisions: Array<ForgeDecision>): string {
  if (decisions.length === 0) {
    return "";
  }

  const decisionLines = decisions
    .map((d) => `- ${d.identifier}: ${d.decision}`)
    .join("\n");

  return `## Decisions to Follow

These are established conventions for this codebase:

${decisionLines}

Follow these unless you have a specific reason to deviate.

`;
}
```

**Step 2: Verify the build**

Run: `pnpm type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/api/src/services/forge/decisions.ts
git commit -m "feat(forge): add decision matching service with Haiku"
```

---

## Task 5: Integrate Decisions into Orchestrator

**Files:**
- Modify: `apps/api/src/services/forge/orchestrator.ts`

**Step 1: Import the decisions service**

Add to the imports at the top of `orchestrator.ts`:

```typescript
import {
  matchDecisionsForTicket,
  formatDecisionsForPrompt,
} from "./decisions";
```

**Step 2: Update ExecutionContext interface**

Add ticket type and labels to the context (around line 27):

```typescript
interface ExecutionContext {
  executionId: string;
  ticketId: string;
  ticketIdentifier: string;
  ticketTitle: string;
  ticketDescription: string | null;
  ticketType: string | null;       // Add this
  ticketLabels: Array<string> | null; // Add this
  protocol: string;
  prompt: string;
  existingBranch: string | null;
  existingPrUrl: string | null;
  existingPrNumber: number | null;
}
```

**Step 3: Update context creation**

Where the context is created (around line 415), add the new fields:

```typescript
const context: ExecutionContext = {
  executionId,
  ticketId: ticket.id,
  ticketIdentifier: ticket.identifier,
  ticketTitle: ticket.title || "",
  ticketDescription: ticket.description,
  ticketType: ticket.type,           // Add this
  ticketLabels: ticket.labels,       // Add this
  protocol: execution.protocol,
  prompt: execution.prompt,
  existingBranch: ticket.branchName,
  existingPrUrl: ticket.prUrl,
  existingPrNumber: ticket.prNumber,
};
```

**Step 4: Update buildUserMessage to include decisions**

Modify the `buildUserMessage` function to fetch and include decisions:

```typescript
async function buildUserMessage(context: ExecutionContext): Promise<string> {
  // Truncate description and prompt to prevent token explosion
  const description = context.ticketDescription
    ? truncateToTokens(context.ticketDescription, 3000)
    : "";
  const additionalContext = truncateToTokens(context.prompt, 4000);

  // Build existing work section if branch/PR already exists
  let existingWorkSection = "";
  if (context.existingBranch || context.existingPrUrl) {
    existingWorkSection = "\n## Existing Work (DO NOT DUPLICATE)\n";
    if (context.existingBranch) {
      existingWorkSection += `- **Branch already exists**: \`${context.existingBranch}\` - DO NOT create a new branch, work on this existing branch instead\n`;
    }
    if (context.existingPrUrl && context.existingPrNumber) {
      existingWorkSection += `- **PR already exists**: #${context.existingPrNumber} (${context.existingPrUrl}) - DO NOT create a new PR, update the existing one if needed\n`;
    }
    existingWorkSection += "\n";
  }

  // Fetch and format relevant decisions
  let decisionsSection = "";
  try {
    const decisions = await matchDecisionsForTicket({
      title: context.ticketTitle,
      description: context.ticketDescription,
      type: context.ticketType,
      labels: context.ticketLabels,
    });
    decisionsSection = formatDecisionsForPrompt(decisions);
  } catch (error) {
    console.warn("[buildUserMessage] Failed to fetch decisions:", error);
    // Continue without decisions
  }

  const totalEstimate = Math.ceil(
    (context.ticketTitle.length + description.length + additionalContext.length + existingWorkSection.length + decisionsSection.length + 200) / 4
  );
  console.log(`[buildUserMessage] Estimated prompt tokens: ${totalEstimate}`);

  return `# Task: ${context.ticketIdentifier} - ${context.ticketTitle}

${description ? `## Description\n${description}\n\n` : ""}${existingWorkSection}${decisionsSection}## Additional Context
${additionalContext}

Please complete this task. Use the available tools to read files, make changes, and complete the work.
When you're done, use the complete_task tool to summarize what you did.`;
}
```

**Step 5: Update call site to await buildUserMessage**

Find where `buildUserMessage` is called and make it await the result. It should be around line 470-480 in the `runAgentLoop` or similar function:

```typescript
// Change from:
const userMessage = buildUserMessage(context);

// To:
const userMessage = await buildUserMessage(context);
```

**Step 6: Verify the build**

Run: `pnpm type-check`
Expected: PASS

**Step 7: Commit**

```bash
git add apps/api/src/services/forge/orchestrator.ts
git commit -m "feat(forge): inject matched decisions into agent prompts"
```

---

## Task 6: Verify End-to-End

**Step 1: Start the dev servers**

Run: `pnpm dev:api` (in one terminal)
Run: `pnpm dev` (in another terminal, for admin app)

**Step 2: Create a test decision**

1. Navigate to `/decisions` in the admin app
2. Click "Add Decision"
3. Create a decision:
   - Decision: "Always use Zod for API validation"
   - Context: "Prevents runtime type errors"
   - Category: Code Standards
   - Scope: api, validation

**Step 3: Verify decision appears in list**

Expected: Decision card appears with DEC-001 identifier

**Step 4: Test toggle and edit**

1. Click the menu on the decision card
2. Try "Disable" - card should show inactive state
3. Try "Enable" - card should return to active
4. Try "Edit" - modal should open with data

**Step 5: Test agent execution (if you have a ticket)**

1. Assign an agent to a ticket
2. Check the execution logs
3. Verify the decisions section appears in the agent's context

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat(forge): complete Decision Ledger v1 implementation"
```

---

## Summary

**Files Created:**
- `apps/api/src/routes/forge/decisions.ts` - CRUD API endpoints
- `apps/api/src/services/forge/decisions.ts` - Haiku matching service
- `apps/admin/src/hooks/api/use-decisions.ts` - Query hooks
- `apps/admin/src/routes/_authed/decisions.tsx` - List page
- `apps/admin/src/components/decisions/decision-card.tsx` - Card component
- `apps/admin/src/components/decisions/decision-modal.tsx` - Modal component

**Files Modified:**
- `apps/api/src/routes/forge/index.ts` - Register decisions route
- `apps/admin/src/hooks/api/index.ts` - Export decisions hooks
- `apps/api/src/services/forge/orchestrator.ts` - Inject decisions into prompts

**What Works After Implementation:**
1. Create/edit/delete decisions via UI
2. Filter by category, search, active status
3. Toggle decisions active/inactive
4. Haiku picks relevant decisions for each ticket
5. Decisions injected into agent prompts automatically
