# CLAUDE.md - Axori Project Guide

This file provides guidance for Claude Code when working with the Axori codebase.

## Project Overview

Axori is a property management platform built as a monorepo with three apps and four packages.

## Tech Stack

- **Web**: TanStack Start + React 19 + Vite + Tailwind CSS 4
- **API**: Hono
- **Mobile**: React Native + Expo
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Auth**: Clerk
- **Package Manager**: pnpm with workspaces
- **Build**: Turborepo

## Project Structure

```
apps/
  web/          # TanStack Start web app (port 3000)
  api/          # Hono API server (port 3001)
  mobile/       # React Native/Expo app
packages/
  db/           # Drizzle schema, migrations, database client
  shared/       # Utilities, types, integrations, validation
  ui/           # Design system components
  permissions/  # Permission system
```

## Common Commands

```bash
# Development
pnpm dev                # Start web dev server
pnpm dev:api            # Start API server
pnpm dev:mobile         # Start mobile app

# Building
pnpm build              # Build all packages
pnpm build:web          # Build web only

# Testing
pnpm test               # Run all tests (Vitest)
pnpm test:e2e           # Run Playwright E2E tests
pnpm test:e2e:ui        # E2E with UI

# Code Quality
pnpm lint               # Run ESLint
pnpm format             # Run Prettier
pnpm check              # Format + lint fix
pnpm type-check         # TypeScript checks

# Database (Drizzle)
pnpm db:generate        # Generate SQL migrations from schema
pnpm db:migrate         # Apply pending migrations
pnpm db:status          # Check migration status
pnpm db:verify          # Verify database state
pnpm db:push            # Push schema directly (dev only)
pnpm db:pull            # Pull schema from database
pnpm db:studio          # Open Drizzle Studio
pnpm db:seed            # Seed market data
```

---

## Pre-Push Checklist

**CRITICAL: Always run these checks before pushing code:**

```bash
pnpm type-check         # Must pass - no TypeScript errors
pnpm lint               # Must pass - no ESLint errors
pnpm test               # Must pass - all tests green
```

These checks run in GitHub Actions CI. Failing to run them locally wastes CI time and blocks merges.

---

## Database Migrations

All migration logic lives in `packages/db/`. There is ONE source of truth for migrations.

### Migration Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `pnpm db:generate` | Generate SQL from schema changes | After modifying schema |
| `pnpm db:migrate` | Apply pending migrations | Production deployments |
| `pnpm db:status` | Check migration status | Debugging |
| `pnpm db:verify` | Verify database state | After migrations |
| `pnpm db:push` | Push schema directly | ⚠️ Known bug - use db:generate + db:migrate |

### Development Workflow

**Note:** `db:push` has a known bug with this Supabase database (drizzle-kit fails to parse certain check constraints). Use the migration workflow instead:

```bash
# 1. Modify schema in packages/db/src/schema/index.ts
# 2. Generate migration
pnpm db:generate
# 3. Apply migration
pnpm db:migrate
```

### Production Workflow

For production, always use managed migrations:

```bash
# 1. Modify schema
# 2. Generate SQL migration
pnpm db:generate

# 3. Review generated SQL in packages/db/drizzle/
# 4. Apply migrations
pnpm db:migrate
```

### Migration Files

```
packages/db/
├── drizzle/                    # SQL migrations (generated)
│   ├── 0000_*.sql              # Migration files
│   └── meta/_journal.json      # Migration metadata
├── drizzle.config.ts           # Drizzle Kit config
└── src/
    └── migrations/
        └── runner.ts           # Unified migration runner
```

### Verification

The migration runner automatically verifies database state after applying migrations:
- Checks critical tables exist
- Validates required columns
- Verifies data integrity constraints

Run verification manually:
```bash
pnpm db:verify
```

---

## Feature Implementation Patterns

### CRITICAL: Feature Implementation Checklist

When implementing a new feature, follow this order:

1. **Database Schema** (`packages/db/src/schema/index.ts`)
   - Add/modify Drizzle schema
   - Run `pnpm db:generate` then `pnpm db:push`

2. **Validation Schemas** (`packages/shared/src/validation/`)
   - Create base schema using `drizzle-zod`
   - Create enhanced API schema with business logic
   - Create form schema for frontend validation

3. **API Routes** (`apps/api/src/routes/`)
   - Use `withErrorHandling` wrapper
   - Use `requireAuth()` middleware
   - Validate with `validateData()`

4. **API Hooks** (`apps/web/src/hooks/api/`)
   - Create TanStack Query hooks
   - Follow naming: `use[Entity]s`, `use[Entity]`, `useCreate[Entity]`, etc.

5. **UI Components** (`apps/web/src/components/`)
   - Create drawer for create/edit
   - Create list/detail components
   - Use `@axori/ui` components

6. **Drawer Registration** (`apps/web/src/lib/drawer.ts`)
   - Add drawer to `DRAWERS` enum
   - Register in drawer factory

---

## Schema Alignment (Drizzle → Zod)

### Three-Tier Validation Schema Pattern

```
packages/shared/src/validation/
├── base/           # Auto-generated from Drizzle (drizzle-zod)
├── enhanced/       # API schemas with business logic
└── forms/          # Frontend form validation
```

### Step 1: Base Schema (Auto-generated)

```typescript
// packages/shared/src/validation/base/loans.ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { loans } from "@axori/db";

export const loanInsertSchema = createInsertSchema(loans);
export const loanSelectSchema = createSelectSchema(loans);
```

### Step 2: Enhanced API Schema

```typescript
// packages/shared/src/validation/enhanced/loans.ts
import { loanInsertSchema } from "../base/loans";
import { z } from "zod";

export const loanInsertApiSchema = loanInsertSchema.extend({
  // Override numeric strings → numbers for API
  interestRate: z.number().min(0).max(100, "Interest rate must be 0-100"),
  // Add fields not in database
  userId: z.string().uuid("User ID must be a valid UUID"),
});
```

### Step 3: Form Schema (Frontend)

```typescript
// packages/shared/src/validation/forms/loans.ts
export const loanFormSchema = z.object({
  // Form-specific validation (user-friendly messages)
  interestRate: z.string()
    .transform((v) => parseFloat(v))
    .refine((v) => v >= 0 && v <= 100, "Enter a rate between 0-100"),
});
```

---

## Type Safety Patterns

### CRITICAL: Never Manually Define Types

Always use type inference from Drizzle or Zod:

```typescript
// ✅ CORRECT - Infer from Drizzle
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { properties } from '@axori/db';

export type Property = InferSelectModel<typeof properties>;
export type PropertyInsert = InferInsertModel<typeof properties>;

// ✅ CORRECT - Infer from Zod
import type { z } from "zod";
export type LoanInsertApi = z.infer<typeof loanInsertApiSchema>;

// ❌ WRONG - Manual type definition
export type Property = {
  id: string;
  address: string;
  // ... manually defined
};
```

### Type Export Location

All inferred types should be exported from `packages/db/src/types.ts`.

---

## API Route Patterns

### Standard Route Structure

```typescript
// apps/api/src/routes/[entity].ts
import { Hono } from "hono";
import { requireAuth, withErrorHandling } from "../middleware";
import { validateData } from "../utils/validation";
import { entityInsertApiSchema } from "@axori/shared/src/validation";

const app = new Hono();

// GET all - with auth
app.get("/", requireAuth(), withErrorHandling(async (c) => {
  const userId = c.get("userId");
  // ... fetch logic
  return c.json(results);
}));

// GET by ID
app.get("/:id", requireAuth(), withErrorHandling(async (c) => {
  const { id } = c.req.param();
  // ... fetch logic
  return c.json(result);
}));

// POST create
app.post("/", requireAuth(), withErrorHandling(async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const validated = validateData(entityInsertApiSchema, body);
  // ... create logic
  return c.json(created, 201);
}));

// PUT update
app.put("/:id", requireAuth(), withErrorHandling(async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const validated = validateData(entityUpdateApiSchema, body);
  // ... update logic
  return c.json(updated);
}));

// DELETE
app.delete("/:id", requireAuth(), withErrorHandling(async (c) => {
  const { id } = c.req.param();
  // ... delete logic
  return c.json({ success: true });
}));

export default app;
```

### Error Handling

```typescript
// Always use withErrorHandling wrapper
app.get("/", withErrorHandling(async (c) => {
  // Errors are automatically caught and formatted
}));

// Use AppError for custom errors
import { AppError } from "../utils/errors";

throw new AppError("NOT_FOUND", "Entity not found");
throw new AppError("FORBIDDEN", "Access denied");
throw new AppError("VALIDATION_ERROR", "Invalid data");
```

---

## TanStack Query Hook Patterns

### Standard Hook Structure

```typescript
// apps/web/src/hooks/api/use[Entity].ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Query keys (consistent naming)
export const entityKeys = {
  all: ["entities"] as const,
  lists: () => [...entityKeys.all, "list"] as const,
  list: (filters: Filters) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, "detail"] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};

// GET all
export function useEntities(filters?: Filters) {
  return useQuery({
    queryKey: entityKeys.list(filters ?? {}),
    queryFn: () => api.get("/entities", { params: filters }),
  });
}

// GET by ID
export function useEntity(id: string) {
  return useQuery({
    queryKey: entityKeys.detail(id),
    queryFn: () => api.get(`/entities/${id}`),
    enabled: !!id,
  });
}

// POST create
export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EntityInsert) => api.post("/entities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}

// PUT update
export function useUpdateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: EntityUpdate & { id: string }) =>
      api.put(`/entities/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}

// DELETE
export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/entities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}
```

---

## Drawer System Pattern

### URL-Based Drawer Factory

Drawers are managed via URL search parameters, not React state.

```typescript
// apps/web/src/lib/drawer.ts

// 1. Define drawer names
export const DRAWERS = {
  PROPERTY_CREATE: "property-create",
  PROPERTY_EDIT: "property-edit",
  DOCUMENT_UPLOAD: "document-upload",
  // ... add new drawers here
} as const;

// 2. Use drawer hook
import { useDrawer, DRAWERS } from "@/lib/drawer";

function MyComponent() {
  const { openDrawer, closeDrawer } = useDrawer();

  // Open with optional data
  openDrawer(DRAWERS.PROPERTY_EDIT, { propertyId: "123" });

  // Close
  closeDrawer();
}

// 3. Drawer component pattern
export const PropertyEditDrawer = ({
  isOpen,
  onClose,
  propertyId,
}: DrawerProps) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Property"
      subtitle="PROPERTY DETAILS"
      width="lg"
      footer={/* action buttons */}
    >
      {/* drawer content */}
    </Drawer>
  );
};
```

---

## UI Component Patterns

### Always Use @axori/ui Components

```typescript
// ✅ CORRECT
import { Button, Input, Select, Drawer, Card } from "@axori/ui";

// ❌ WRONG
<button className="...">Click</button>
<input className="..." />
```

### Available Components

| Component | Usage |
|-----------|-------|
| `Button` | Primary/secondary actions |
| `Input` | Text input with `variant="rounded"` |
| `Select` | Dropdown selection |
| `Textarea` | Multi-line text |
| `Drawer` | Side panel for forms |
| `Card` | Content containers |
| `ErrorCard` | Error display |
| `DeleteConfirmationCard` | Delete confirmation |
| `EmptyState` | No data placeholder |
| `LoadingSpinner` | Loading indicator |

### Drawer Section Pattern

```typescript
import { DrawerSectionTitle } from "./DrawerSectionTitle";

<section className="space-y-6">
  <DrawerSectionTitle title="Property Details" color="violet" />
  {/* form fields */}
</section>
```

---

## Tailwind CSS Patterns

### Use CSS Variables for Theming

```typescript
// ✅ CORRECT - Use semantic dark mode classes
className="bg-white dark:bg-slate-900"
className="text-slate-900 dark:text-white"
className="border-slate-200 dark:border-white/10"

// ✅ CORRECT - Use CSS variables from design system
className="bg-[var(--color-surface)]"
```

### Common Patterns

```typescript
// Buttons
className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest"

// Cards
className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"

// Accent colors (dark mode)
className="dark:bg-[#E8FF4D] dark:text-black"  // Primary accent
className="text-violet-600 dark:text-violet-400"  // Secondary
```

### Layout Guidelines

- Use `space-y-*` for vertical spacing
- Use `gap-*` with flex/grid
- Prefer `rounded-xl` or `rounded-2xl` for cards
- Use `font-black uppercase tracking-widest` for labels

---

## Drizzle ORM Patterns

### Query Patterns

```typescript
import { db } from "@axori/db";
import { eq, and, desc } from "drizzle-orm";
import { properties, users } from "@axori/db/schema";

// Simple select
const property = await db
  .select()
  .from(properties)
  .where(eq(properties.id, id))
  .limit(1);

// With relations
const propertyWithOwner = await db
  .select({
    property: properties,
    owner: users,
  })
  .from(properties)
  .leftJoin(users, eq(properties.userId, users.id))
  .where(eq(properties.id, id));

// Insert
const [created] = await db
  .insert(properties)
  .values({ ...data, userId })
  .returning();

// Update
const [updated] = await db
  .update(properties)
  .set({ ...data, updatedAt: new Date() })
  .where(and(eq(properties.id, id), eq(properties.userId, userId)))
  .returning();

// Delete
await db
  .delete(properties)
  .where(and(eq(properties.id, id), eq(properties.userId, userId)));
```

### Schema Patterns

```typescript
// packages/db/src/schema/index.ts
import { pgTable, uuid, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const propertyTypeEnum = pgEnum("property_type", ["sfr", "multi", "condo"]);

// Tables
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  address: text("address").notNull(),
  propertyType: propertyTypeEnum("property_type").notNull(),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

## Testing Patterns

### Unit Test Structure

```typescript
// apps/web/src/components/__tests__/MyComponent.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<MyComponent onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button"));

    expect(onSubmit).toHaveBeenCalled();
  });
});
```

### Test File Location

- Unit tests: Colocate in `__tests__/` folder next to source
- E2E tests: `apps/web/tests/e2e/`

---

## Code Style

- **ESLint**: `--max-warnings 0` enforced
- **Prettier**: double quotes, trailing commas (es5), 80 char width
- **TypeScript**: strict mode, no unused locals/parameters
- **Unused vars**: prefix with `_` to ignore (`argsIgnorePattern: "^_"`)

---

## Key File Locations

| What | Where |
|------|-------|
| Web routes | `apps/web/src/routes/` |
| API routes | `apps/api/src/routes/` |
| Database schema | `packages/db/src/schema/index.ts` |
| Validation schemas | `packages/shared/src/validation/` |
| UI components | `packages/ui/src/components/` |
| API hooks | `apps/web/src/hooks/api/` |
| Drawer system | `apps/web/src/lib/drawer.ts` |
| Architecture docs | `docs/architecture/` |

---

## Deployment Strategy

### Overview

We use a **tag-based release strategy** for production deployments:

| Trigger | Environment | Description |
|---------|-------------|-------------|
| Push to `main` | **Staging** | Automatic deployment for testing |
| Tag `v*` (e.g., `v1.0.0`) | **Production** | Manual release via Git tags |
| Manual dispatch | Either | On-demand deployment |

### Hosting Providers

| App | Provider | Staging URL | Production URL |
|-----|----------|-------------|----------------|
| Web | Vercel | `staging.axori.com` | `axori.com` |
| API | Railway | `staging-api.axori.com` | `api.axori.com` |
| Admin | Vercel | `staging-admin.axori.com` | `admin.axori.com` |

### GitHub Environments

Secrets are configured per-environment in GitHub (Settings → Environments):

**Staging Environment:**
- `RAILWAY_TOKEN` - Railway API token
- `RAILWAY_PROJECT_ID` - Railway project ID
- `RAILWAY_SERVICE_ID` - Staging service ID
- `RAILWAY_ENVIRONMENT_NAME` - `staging`

**Production Environment:**
- Same secrets as staging, but pointing to production service/environment

### Workflow Files

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `api-deploy.yml` | Deploy API to Railway | Push to main (staging) or tag (production) |
| `preview.yml` | Preview deployments | PRs and feature branches |
| `staging.yml` | Web staging deployment | Push to main |
| `production.yml` | Web production deployment | Tag releases |

### Creating a Production Release

```bash
# 1. Ensure main is stable and tested on staging
# 2. Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

This triggers production deployments across all services.

---

## Important Notes

- Use `workspace:*` for internal package dependencies
- Web app uses path alias `@/*` → `./src/*`
- Prefer `@axori/ui` components over raw HTML
- Database uses Supabase - requires `prepare: false` for postgres client
- Always validate with Zod before database operations
- Use `withErrorHandling` wrapper on all API routes
- Drawers are URL-based, not React state
