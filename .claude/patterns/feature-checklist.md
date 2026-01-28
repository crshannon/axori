# Feature Implementation Checklist

Use this checklist when implementing new features in Axori.

## Pre-Implementation

- [ ] Understand the feature requirements
- [ ] Identify affected database tables
- [ ] Plan validation requirements
- [ ] Review existing similar patterns in codebase

---

## 1. Database Schema

**Location**: `packages/db/src/schema/index.ts`

- [ ] Define table with proper types
- [ ] Add enums if needed (use `pgEnum`)
- [ ] Include standard fields:
  - `id: uuid("id").primaryKey().defaultRandom()`
  - `userId: text("user_id").notNull()`
  - `createdAt: timestamp("created_at").defaultNow().notNull()`
  - `updatedAt: timestamp("updated_at").defaultNow().notNull()`
- [ ] Use `numeric(precision, scale)` for money/decimals
- [ ] Run `pnpm db:generate` to create migration
- [ ] Run `pnpm db:push` to apply migration

---

## 2. Type Exports

**Location**: `packages/db/src/types.ts`

- [ ] Export `InferSelectModel` type for the table
- [ ] Export `InferInsertModel` type for the table

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { myTable } from './schema';

export type MyEntity = InferSelectModel<typeof myTable>;
export type MyEntityInsert = InferInsertModel<typeof myTable>;
```

---

## 3. Validation Schemas

**Location**: `packages/shared/src/validation/`

### 3a. Base Schema (Auto-generated)
- [ ] Create file: `packages/shared/src/validation/base/[entity].ts`
- [ ] Use `drizzle-zod` to generate from Drizzle schema

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { myTable } from "@axori/db";

export const myEntityInsertSchema = createInsertSchema(myTable);
export const myEntitySelectSchema = createSelectSchema(myTable);
```

### 3b. Enhanced API Schema
- [ ] Create file: `packages/shared/src/validation/enhanced/[entity].ts`
- [ ] Override numeric fields (string -> number)
- [ ] Add validation messages
- [ ] Add any non-database fields (e.g., userId)

```typescript
import { myEntityInsertSchema } from "../base/myEntity";
import { z } from "zod";

export const myEntityInsertApiSchema = myEntityInsertSchema.extend({
  amount: z.number().min(0, "Amount must be positive"),
});

export const myEntityUpdateApiSchema = myEntityInsertApiSchema.partial();
```

### 3c. Form Schema (if complex forms needed)
- [ ] Create file: `packages/shared/src/validation/forms/[entity].ts`
- [ ] Handle string -> number transformations for form inputs

### 3d. Export from index
- [ ] Add exports to `packages/shared/src/validation/index.ts`

---

## 4. API Routes

**Location**: `apps/api/src/routes/[entity].ts`

- [ ] Create route file
- [ ] Import required middleware: `requireAuth`, `withErrorHandling`
- [ ] Import validation schema
- [ ] Implement standard endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | List all (filtered by userId) |
| `/:id` | GET | Get single by ID |
| `/` | POST | Create new |
| `/:id` | PUT | Update existing |
| `/:id` | DELETE | Delete |

- [ ] Use `withErrorHandling` wrapper on all handlers
- [ ] Use `validateData()` for request body validation
- [ ] Check ownership before update/delete
- [ ] Register route in `apps/api/src/routes/index.ts`

---

## 5. API Hooks

**Location**: `apps/web/src/hooks/api/use[Entity].ts`

- [ ] Create hooks file
- [ ] Define query keys factory:

```typescript
export const entityKeys = {
  all: ["entities"] as const,
  lists: () => [...entityKeys.all, "list"] as const,
  list: (filters: Filters) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, "detail"] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};
```

- [ ] Implement hooks:
  - `useEntities()` - list query
  - `useEntity(id)` - single query
  - `useCreateEntity()` - create mutation
  - `useUpdateEntity()` - update mutation
  - `useDeleteEntity()` - delete mutation

- [ ] Handle cache invalidation in mutations

---

## 6. Drawer Component

**Location**: `apps/web/src/components/drawers/[Entity]Drawer.tsx`

- [ ] Create drawer component
- [ ] Use `@axori/ui` Drawer component
- [ ] Use `DrawerSectionTitle` for sections
- [ ] Use `Input`, `Select`, `Textarea` from `@axori/ui`
- [ ] Handle form state with `useState`
- [ ] Call appropriate mutation hook on submit
- [ ] Handle loading/error states

### Standard Drawer Structure:

```tsx
<Drawer
  isOpen={isOpen}
  onClose={onClose}
  title="Create Entity"
  subtitle="ENTITY DETAILS"
  width="lg"
  footer={
    <div className="flex gap-4">
      <button onClick={onClose}>Cancel</button>
      <button onClick={handleSubmit}>Save</button>
    </div>
  }
>
  <form className="space-y-10">
    <section className="space-y-6">
      <DrawerSectionTitle title="Basic Info" color="violet" />
      {/* form fields */}
    </section>
  </form>
</Drawer>
```

---

## 7. Drawer Registration

**Location**: `apps/web/src/lib/drawer.ts`

- [ ] Add drawer name to `DRAWERS` enum:

```typescript
export const DRAWERS = {
  // ... existing
  MY_ENTITY_CREATE: "my-entity-create",
  MY_ENTITY_EDIT: "my-entity-edit",
} as const;
```

- [ ] Register drawer component in drawer factory

---

## 8. List/Detail Components

**Location**: `apps/web/src/components/[feature]/`

- [ ] Create list component with:
  - Loading state (`LoadingSpinner`)
  - Empty state (`EmptyState`)
  - Error state (`ErrorCard`)
  - List rendering with proper styling

- [ ] Create detail component if needed

---

## 9. Page Integration

**Location**: `apps/web/src/routes/`

- [ ] Import and use components in appropriate route
- [ ] Set up drawer triggers with `useDrawer` hook

---

## Post-Implementation

- [ ] Run `pnpm type-check` - no TypeScript errors
- [ ] Run `pnpm lint` - no ESLint errors
- [ ] Test CRUD operations manually
- [ ] Add unit tests if complex logic exists
- [ ] Update any affected documentation

---

## Quick Reference: File Locations

| Layer | Location |
|-------|----------|
| Schema | `packages/db/src/schema/index.ts` |
| Types | `packages/db/src/types.ts` |
| Validation | `packages/shared/src/validation/` |
| API Routes | `apps/api/src/routes/` |
| API Hooks | `apps/web/src/hooks/api/` |
| Drawers | `apps/web/src/components/drawers/` |
| Drawer Registry | `apps/web/src/lib/drawer.ts` |
| Components | `apps/web/src/components/` |
| Pages | `apps/web/src/routes/` |
