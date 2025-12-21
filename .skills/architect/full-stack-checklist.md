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
  userId: uuid("user_id").references(() => users.id).notNull(), // User-scoped
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
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { properties } from './schema'

export type Property = InferSelectModel<typeof properties>
export type PropertyInsert = InferInsertModel<typeof properties>
```

## Phase 3: Zod Validation Schemas

### Validation Schema Creation

- [ ] Create Zod schema in `packages/shared/src/validation/index.ts`
- [ ] Use camelCase field names (matching Drizzle code layer)
- [ ] Create separate schemas for insert/select/update operations
- [ ] **Insert schema**: Exclude auto-generated fields (id, createdAt, updatedAt)
- [ ] **Insert schema**: Exclude `userId` (set from auth context)
- [ ] **Select schema**: Include all fields including auto-generated ones
- [ ] **Update schema**: Make all fields optional except ID
- [ ] Match required fields to Drizzle `.notNull()` constraints
- [ ] Add validation rules (min length, regex, etc.)
- [ ] Add helpful error messages

### Example Checklist Item

```typescript
// ✅ Complete validation schemas
export const propertyInsertSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  propertyType: z.string().min(1, "Property type is required"),
  // Excludes: id, userId, createdAt, updatedAt
});

export const propertySelectSchema = propertyInsertSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const propertyUpdateSchema = z.object({
  id: z.string().uuid(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code").optional(),
  propertyType: z.string().min(1).optional(),
});
```

## Phase 4: API Routes

### API Endpoint Implementation

- [ ] Create route file in `apps/api/src/routes/`
- [ ] Import Drizzle schema and types
- [ ] Import Zod validation schemas
- [ ] **If user-scoped**: Use Clerk authentication middleware
- [ ] **If user-scoped**: Extract authenticated user from request
- [ ] **If user-scoped**: Filter all queries by user ID
- [ ] **If user-scoped**: Set userId from auth context (never from request)
- [ ] **If user-scoped**: Verify ownership before mutations
- [ ] Validate request bodies with Zod schemas
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
import { propertyInsertSchema, propertyUpdateSchema } from "@axori/shared/src/validation";

const propertiesRouter = new Hono();

// GET /api/properties - List user's properties
propertiesRouter.get("/", async (c) => {
  const { userId: clerkId } = c.req.var.auth;
  
  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const userProperties = await db.select()
    .from(properties)
    .where(eq(properties.userId, user.id));

  return c.json({ properties: userProperties });
});

// POST /api/properties - Create property
propertiesRouter.post("/", async (c) => {
  const { userId: clerkId } = c.req.var.auth;
  
  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const body = await c.req.json();
  const validated = propertyInsertSchema.parse(body);

  const [property] = await db.insert(properties)
    .values({
      ...validated,
      userId: user.id, // From auth, not request
    })
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

### Documentation Updates

- [ ] Update API documentation with new endpoints
- [ ] Document any new types or schemas
- [ ] Add JSDoc comments to complex functions
- [ ] Update README if needed
- [ ] Document any breaking changes

## Quick Reference: File Locations

- **Drizzle Schema**: `packages/db/src/schema/index.ts`
- **Type Exports**: `packages/db/src/types.ts`
- **Zod Schemas**: `packages/shared/src/validation/index.ts`
- **API Routes**: `apps/api/src/routes/`
- **API Index**: `apps/api/src/index.ts`

## Common Mistakes to Avoid

- ❌ Forgetting to add `userId` foreign key for user-scoped resources
- ❌ Not filtering queries by user ID
- ❌ Trusting client-supplied `userId` in requests
- ❌ Including auto-generated fields in insert Zod schemas
- ❌ Manually defining types instead of using Drizzle inference
- ❌ Using snake_case in Zod schemas (should be camelCase)
- ❌ Missing authentication middleware on protected routes
- ❌ Not verifying ownership before mutations

## Summary

Follow this checklist systematically for each new feature to ensure:
- ✅ Schema alignment across all layers
- ✅ Type safety throughout the stack
- ✅ Proper security and user data isolation
- ✅ Consistent patterns and best practices
- ✅ Maintainable and scalable code

