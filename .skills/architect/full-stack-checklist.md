# Full-Stack Feature Development Checklist

Use this checklist when adding a new feature to ensure consistency across all layers of the application.

## Phase 1: Database Schema

### Drizzle Schema Definition

- [ ] Create table schema in `packages/db/src/schema/index.ts`
- [ ] Use appropriate column types (uuid, text, timestamp, etc.)
- [ ] Set primary key with `.primaryKey()`
- [ ] Add `.notNull()` constraints for required fields
- [ ] Add `.defaultRandom()` for UUID primary keys
- [ ] Add `.defaultNow()` for timestamp fields (createdAt, updatedAt)
- [ ] Add `.unique()` constraints where needed
- [ ] **If user-scoped**: Add `userId` foreign key referencing users table
- [ ] Use camelCase for field names in code (maps to snake_case in DB)
- [ ] Add comments for complex fields or business logic

### Example Checklist Item

```typescript
// ✅ Complete schema example
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(), // User-scoped
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  propertyType: text("property_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## Phase 2: Type Exports

### Type Inference and Export

- [ ] Export inferred types from `packages/db/src/types.ts`
- [ ] Use `InferSelectModel` for read operations
- [ ] Use `InferInsertModel` for insert operations
- [ ] Add JSDoc comments for clarity
- [ ] Re-export from `packages/db/src/index.ts`
- [ ] **Do NOT** manually define types in `packages/shared/src/types/index.ts`

### Example Checklist Item

```typescript
// ✅ Correct type export
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { properties } from "./schema";

export type Property = InferSelectModel<typeof properties>;
export type PropertyInsert = InferInsertModel<typeof properties>;
```

## Phase 3: Zod Validation Schemas

### Step 3.1: Generate Base Schemas (Auto-Generated)

- [ ] Create base schema file in `packages/shared/src/validation/base/`
- [ ] Use `createInsertSchema()` from `drizzle-zod` to generate insert schema
- [ ] Use `createSelectSchema()` from `drizzle-zod` to generate select schema
- [ ] **Never manually edit base schemas** - they are auto-generated
- [ ] Base schemas automatically exclude auto-generated fields (id, createdAt, updatedAt)
- [ ] Base schemas automatically match Drizzle `.notNull()` constraints
- [ ] Numeric fields from Drizzle generate as `z.string()` (PostgreSQL stores as string)
- [ ] Enum fields from `pgEnum()` generate as `z.enum()` with correct values

### Example Base Schema

```typescript
// packages/shared/src/validation/base/properties.ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { properties } from "@axori/db";

// Auto-generated base schemas
export const propertyInsertSchema = createInsertSchema(properties);
export const propertySelectSchema = createSelectSchema(properties);
```

### Step 3.2: Create Enhanced Schemas (API-Specific)

- [ ] Create enhanced schema file in `packages/shared/src/validation/enhanced/`
- [ ] Extend base schemas with API-specific validation
- [ ] Override numeric fields (string → number) for API usage
- [ ] Add authorization fields (e.g., `userId`) if needed (not stored in DB)
- [ ] Add custom validation rules (min/max, regex, etc.)
- [ ] Create update schema using `.partial()` on enhanced insert schema
- [ ] Add helpful error messages

### Example Enhanced Schema

```typescript
// packages/shared/src/validation/enhanced/properties.ts
import { propertyInsertSchema } from "../base/properties";
import { z } from "zod";

// Enhanced insert schema for API
export const propertyInsertApiSchema = propertyInsertSchema.extend({
  // Override numeric fields if needed (base schema has them as strings)
  // Add custom validation
  address: z.string().min(1, "Address is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  // Add userId for authorization (not in DB)
  userId: z.string().uuid("User ID must be a valid UUID"),
}) as unknown as z.ZodType<any>;

// Enhanced update schema
export const propertyUpdateApiSchema = propertyInsertApiSchema
  .omit({ userId: true }) // Remove fields not needed for updates
  .partial()
  .extend({
    id: z.string().uuid("Property ID must be a valid UUID"),
  }) as unknown as z.ZodType<any>;
```

### Step 3.3: Export Types

- [ ] Export Zod-inferred types in `packages/shared/src/types/index.ts`
- [ ] Use `z.infer<typeof schema>` to infer types from enhanced schemas
- [ ] Export types with descriptive names (e.g., `PropertyInsertApi`, `PropertyUpdateApi`)

### Example Type Exports

```typescript
// packages/shared/src/types/index.ts
import type { z as zod } from "zod";
import {
  propertyInsertApiSchema,
  propertyUpdateApiSchema,
} from "../validation";

// Property API types (for frontend use)
export type PropertyInsertApi = zod.infer<typeof propertyInsertApiSchema>;
export type PropertyUpdateApi = zod.infer<typeof propertyUpdateApiSchema>;
```

### Step 3.4: Export from Validation Index

- [ ] Export base schemas from `packages/shared/src/validation/base/`
- [ ] Export enhanced schemas from `packages/shared/src/validation/enhanced/`
- [ ] Update `packages/shared/src/validation/index.ts` to export all schemas

## Phase 4: API Routes

### API Endpoint Implementation

- [ ] Create route file in `apps/api/src/routes/`
- [ ] Import Drizzle schema and types
- [ ] Import **enhanced** Zod validation schemas (not base schemas)
- [ ] **If user-scoped**: Use Clerk authentication middleware
- [ ] **If user-scoped**: Extract authenticated user from request
- [ ] **If user-scoped**: Filter all queries by user ID
- [ ] **If user-scoped**: Set userId from auth context (never from request)
- [ ] **If user-scoped**: Verify ownership before mutations
- [ ] Validate request bodies with enhanced Zod schemas
- [ ] Convert API format to DB format (e.g., percentage → decimal for numeric fields)
- [ ] Convert numeric fields from number (API) to string (DB) for `numeric()` columns
- [ ] Use proper HTTP status codes (200, 201, 400, 401, 404, 500)
- [ ] Return consistent JSON response format
- [ ] Handle errors gracefully with appropriate messages
- [ ] Register route in `apps/api/src/index.ts`

### Example Checklist Item

```typescript
// ✅ Complete API route example
import { Hono } from "hono";
import { db } from "@axori/db";
import { properties, users } from "@axori/db/src/schema";
import { eq, and } from "drizzle-orm";
import {
  propertyInsertApiSchema,
  propertyUpdateApiSchema,
} from "@axori/shared/src/validation";

const propertiesRouter = new Hono();

// GET /api/properties - List user's properties
propertiesRouter.get("/", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const userProperties = await db
    .select()
    .from(properties)
    .where(eq(properties.userId, user.id));

  return c.json({ properties: userProperties });
});

// POST /api/properties - Create property
propertiesRouter.post("/", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Validate with enhanced schema
  const body = await c.req.json();
  const validated = propertyInsertApiSchema.parse({
    ...body,
    userId: user.id, // Add userId for validation
  });

  // Convert API format to DB format
  const propertyDataForDb = {
    userId: user.id, // From auth, not request
    address: validated.address,
    city: validated.city,
    state: validated.state,
    zipCode: validated.zipCode,
    // Convert numeric fields if needed (string → string for DB)
    // ... other fields
  };

  const [property] = await db
    .insert(properties)
    .values(propertyDataForDb)
    .returning();

  return c.json({ property }, 201);
});
```

## Phase 5: Migration

### Database Migration

- [ ] Generate migration: `pnpm --filter @axori/db db:generate`
- [ ] Review generated migration SQL
- [ ] Test migration on development database
- [ ] Apply migration: `pnpm --filter @axori/db db:migrate`
- [ ] Verify schema in database matches Drizzle schema
- [ ] Document any breaking changes

## Phase 6: Type Safety Verification

### Cross-Layer Type Checking

- [ ] Verify types flow correctly: Schema → Types → API → Frontend
- [ ] Check that API responses match inferred types
- [ ] Ensure Zod schemas align with Drizzle types
- [ ] Run TypeScript type checking: `pnpm type-check`
- [ ] Fix any type errors or mismatches

## Phase 7: Security Review

### Security Checklist

- [ ] **If user-scoped**: Schema includes `userId` foreign key
- [ ] **If user-scoped**: API route uses Clerk authentication middleware
- [ ] **If user-scoped**: All queries filter by authenticated user's ID
- [ ] **If user-scoped**: Mutations set `userId` from auth context
- [ ] **If user-scoped**: Individual resource access verifies ownership
- [ ] **If user-scoped**: Error messages don't leak information
- [ ] **If user-scoped**: Zod schemas don't include `userId` in insert schemas
- [ ] Input validation prevents SQL injection (using Drizzle parameterized queries)
- [ ] Input validation prevents XSS (sanitize user input)
- [ ] Rate limiting considered for public endpoints
- [ ] CORS configured correctly

## Phase 8: Testing

### Test Coverage

- [ ] Unit tests for Zod validation schemas
- [ ] Integration tests for API endpoints
- [ ] **If user-scoped**: Test unauthorized access is rejected
- [ ] **If user-scoped**: Test users can only access their own data
- [ ] **If user-scoped**: Test users cannot access other users' data
- [ ] **If user-scoped**: Test users cannot modify other users' data
- [ ] Test error handling and edge cases
- [ ] Test database constraints and validations

## Phase 9: Documentation

### Code Documentation

- [ ] Update API documentation with new endpoints
- [ ] Document any new types or schemas
- [ ] Add JSDoc comments to complex functions
- [ ] Update README if needed
- [ ] Document any breaking changes

### Architectural Plan Documentation

**For major changes (new tables, migrations, refactors):**

- [ ] Create versioned plan folder in `docs/architecture/plans/` (e.g., `003-feature-name/`)
- [ ] Create `SUMMARY.md` - Quick read (1-2 pages) describing:
  - What we aim to accomplish
  - Why this is needed
  - Key goals
  - Expected outcome
  - Main phases (high-level)
- [ ] Create `EXECUTION.md` - Detailed step-by-step guide with:
  - Current state analysis
  - Detailed phases with checkboxes
  - File changes summary
  - Code examples
  - Testing strategy
  - Rollback plan
- [ ] Update plan documents as you work through phases
- [ ] After completion:
  - [ ] Create `COMPLETION.md` - Summary of accomplishments
  - [ ] Mark plan as "Complete" in `SUMMARY.md` and `EXECUTION.md`
  - [ ] Move plan folder to `docs/architecture/completed/`

**For minor changes (bug fixes, small features):**

- [ ] Add comments to code explaining changes
- [ ] Update relevant documentation files
- [ ] Note changes in commit messages

See [planning-workflow.md](../.skills/architect/planning-workflow.md) for templates and detailed workflow.

## Phase 10: Frontend Hooks

### Step 10.1: API Hooks (Data Fetching)

**Use for:** Direct API calls, data fetching, mutations

- [ ] Create hook file in `apps/web/src/hooks/api/`
- [ ] Import Zod-inferred types from `@axori/shared` (not Drizzle types directly)
- [ ] Use `useMutation` or `useQuery` from TanStack Query
- [ ] Type mutation function parameters with Zod-inferred types
- [ ] Ensure types match API expectations (e.g., percentage for interestRate)
- [ ] Handle loading, error, and success states
- [ ] Export hook from `apps/web/src/hooks/api/index.ts`

### Example API Hook

```typescript
// apps/web/src/hooks/api/useProperties.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import type { PropertyInsertApi, PropertyUpdateApi } from "@axori/shared";

export function useCreateProperty() {
  return useMutation({
    mutationFn: async (data: Omit<PropertyInsertApi, "userId">) => {
      // data is fully typed from Zod schema
      return await apiFetch("/api/properties", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });
}
```

### Step 10.2: Computed Hooks (Business Logic)

**Use for:** Derived/computed data, calculations, combining multiple API hooks

- [ ] Create hook file in `apps/web/src/hooks/computed/`
- [ ] Use `useMemo` for expensive calculations
- [ ] Combine multiple API hooks to compute derived data
- [ ] Return typed interface for computed metrics
- [ ] Add JSDoc comments explaining what the hook calculates
- [ ] Export hook from `apps/web/src/hooks/computed/index.ts`
- [ ] Keep business logic separate from presentation

### Example Computed Hook

```typescript
// apps/web/src/hooks/computed/useFinancialPulse.ts
import { useMemo } from 'react'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'

interface FinancialMetrics {
  netCashFlow: number
  totalFixedExpenses: number
  // ... other metrics
}

/**
 * Hook to calculate financial metrics for a property
 * Fetches property data and transactions, then calculates derived metrics
 */
export function useFinancialPulse(propertyId: string): FinancialMetrics {
  const { data: property } = useProperty(propertyId)
  const { data: transactionsData } = usePropertyTransactions(propertyId, {
    page: 1,
    pageSize: 1000,
  })

  const metrics = useMemo(() => {
    if (!property || !transactionsData?.transactions) {
      return { /* default values */ }
    }

    // Calculate derived metrics from raw data
    const netCashFlow = /* calculation logic */
    
    return {
      netCashFlow,
      // ... other computed values
    }
  }, [property, transactionsData])

  return metrics
}
```

### Hook Organization Guidelines

**API Hooks (`hooks/api/`):**
- Direct API calls (GET, POST, PUT, DELETE)
- React Query hooks (`useQuery`, `useMutation`)
- Data fetching and mutations
- One-to-one mapping with API endpoints

**Computed Hooks (`hooks/computed/`):**
- Derived/computed data from multiple sources
- Business logic calculations
- Combining multiple API hooks
- Expensive calculations with `useMemo`
- Metrics, aggregations, transformations

## Quick Reference: File Locations

- **Drizzle Schema**: `packages/db/src/schema/index.ts`
- **Type Exports**: `packages/db/src/types.ts` (Drizzle-inferred types)
- **Base Zod Schemas**: `packages/shared/src/validation/base/` (auto-generated)
- **Enhanced Zod Schemas**: `packages/shared/src/validation/enhanced/` (API-specific)
- **Zod Schema Exports**: `packages/shared/src/validation/index.ts`
- **Zod-Inferred Types**: `packages/shared/src/types/index.ts`
- **API Routes**: `apps/api/src/routes/`
- **API Index**: `apps/api/src/index.ts`
- **API Hooks**: `apps/web/src/hooks/api/` (data fetching, mutations)
- **Computed Hooks**: `apps/web/src/hooks/computed/` (business logic, derived data)

## Common Mistakes to Avoid

- ❌ Forgetting to add `userId` foreign key for user-scoped resources
- ❌ Not filtering queries by user ID
- ❌ Trusting client-supplied `userId` in requests
- ❌ Manually editing base Zod schemas (they are auto-generated)
- ❌ Using `text()` instead of `pgEnum()` for enum fields
- ❌ Not converting API format to DB format (e.g., percentage → decimal)
- ❌ Not converting numeric fields from number (API) to string (DB)
- ❌ Manually defining types instead of using Drizzle/Zod inference
- ❌ Using snake_case in Zod schemas (should be camelCase)
- ❌ Missing authentication middleware on protected routes
- ❌ Not verifying ownership before mutations
- ❌ Using base schemas in API routes (should use enhanced schemas)
- ❌ Putting computed/business logic hooks in `hooks/api/` (use `hooks/computed/`)
- ❌ Putting API/data fetching hooks in `hooks/computed/` (use `hooks/api/`)
- ❌ Mixing business logic calculations directly in components (extract to computed hooks)

## Summary

Follow this checklist systematically for each new feature to ensure:

- ✅ Schema alignment across all layers
- ✅ Type safety throughout the stack
- ✅ Proper security and user data isolation
- ✅ Consistent patterns and best practices
- ✅ Maintainable and scalable code
