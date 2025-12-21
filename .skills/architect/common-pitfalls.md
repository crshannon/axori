# Common Pitfalls and Solutions

This guide documents known issues, common mistakes, and their solutions.

## Schema Alignment Issues

### Pitfall 1: Field Name Mismatch (camelCase vs snake_case)

**Problem**: Using snake_case in Zod schemas when Drizzle uses camelCase in code.

```typescript
// ❌ WRONG - Zod uses snake_case
export const propertySchema = z.object({
  zip_code: z.string(),  // Wrong! Should be zipCode
  created_at: z.date(),   // Wrong! Should be createdAt
});

// ✅ CORRECT - Zod uses camelCase to match Drizzle code layer
export const propertySchema = z.object({
  zipCode: z.string(),    // Matches Drizzle's camelCase
  createdAt: z.date(),    // Matches Drizzle's camelCase
});
```

**Solution**: Always use camelCase in Zod schemas to match Drizzle's code layer. The snake_case mapping happens automatically in the database.

### Pitfall 2: Including Auto-Generated Fields in Insert Schemas

**Problem**: Including `id`, `createdAt`, or `updatedAt` in insert validation schemas.

```typescript
// ❌ WRONG - Includes auto-generated fields
export const propertyInsertSchema = z.object({
  id: z.string().uuid(),           // Auto-generated!
  address: z.string(),
  createdAt: z.date(),             // Auto-generated!
  updatedAt: z.date(),             // Auto-generated!
});

// ✅ CORRECT - Excludes auto-generated fields
export const propertyInsertSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  // id, createdAt, updatedAt excluded
});
```

**Solution**: Create separate schemas for insert and select operations. Insert schemas should exclude all auto-generated fields.

### Pitfall 3: Missing Required Fields in Zod Schemas

**Problem**: Zod schema doesn't match Drizzle's `.notNull()` constraints.

```typescript
// Drizzle schema
export const properties = pgTable("properties", {
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),  // Nullable
});

// ❌ WRONG - Missing required fields or marking nullable as required
export const propertySchema = z.object({
  address: z.string().optional(),  // Wrong! Should be required
  state: z.string().min(1),        // Wrong! Should be optional
});

// ✅ CORRECT - Matches Drizzle constraints
export const propertySchema = z.object({
  address: z.string().min(1),     // Required (matches .notNull())
  city: z.string().min(1),         // Required (matches .notNull())
  state: z.string().optional(),     // Optional (matches nullable)
});
```

**Solution**: Always match Zod validation to Drizzle constraints. Required fields in Drizzle (`.notNull()`) must be required in Zod.

## Type Duplication Issues

### Pitfall 4: Manually Defining Types Instead of Using Inference

**Problem**: Manually defining types in `packages/shared/src/types/index.ts` that duplicate Drizzle schemas.

```typescript
// ❌ WRONG - Manual type definition
// packages/shared/src/types/index.ts
export type Property = {
  id: string;
  address: string;
  city: string;
  // ... manually defined
};

// ✅ CORRECT - Use Drizzle inference
// packages/db/src/types.ts
export type Property = InferSelectModel<typeof properties>

// packages/shared/src/types/index.ts
export type { Property } from '@axori/db'
```

**Solution**: Always use `InferSelectModel` and `InferInsertModel` from Drizzle. Export from `packages/db/src/types.ts` and re-export in shared package.

### Pitfall 5: Types Drifting Out of Sync

**Problem**: Schema changes but manual types aren't updated.

```typescript
// Schema updated
export const properties = pgTable("properties", {
  // ... existing fields
  newField: text("new_field").notNull(),  // Added new field
});

// ❌ WRONG - Manual type not updated
export type Property = {
  id: string;
  address: string;
  // newField missing!
};

// ✅ CORRECT - Type automatically includes new field
export type Property = InferSelectModel<typeof properties>
// newField automatically included!
```

**Solution**: Using Drizzle inference ensures types always match schemas automatically.

## Security Issues

### Pitfall 6: Missing User Filtering in Queries

**Problem**: API endpoints return all users' data instead of filtering by authenticated user.

```typescript
// ❌ WRONG - Returns all properties
propertiesRouter.get("/", async (c) => {
  const allProperties = await db.select().from(properties);
  return c.json({ properties: allProperties });  // Security vulnerability!
});

// ✅ CORRECT - Filters by authenticated user
propertiesRouter.get("/", async (c) => {
  const { userId: clerkId } = c.req.var.auth;
  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  
  const userProperties = await db.select()
    .from(properties)
    .where(eq(properties.userId, user.id));  // Filtered!
  
  return c.json({ properties: userProperties });
});
```

**Solution**: Always filter queries by authenticated user's ID for user-scoped resources.

### Pitfall 7: Trusting Client-Supplied User ID

**Problem**: Allowing clients to set `userId` in request body.

```typescript
// ❌ WRONG - Trusts client-supplied userId
propertiesRouter.post("/", async (c) => {
  const data = await c.req.json();
  // data.userId could be any user's ID!
  await db.insert(properties).values(data);
});

// ✅ CORRECT - Sets userId from auth context
propertiesRouter.post("/", async (c) => {
  const { userId: clerkId } = c.req.var.auth;
  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  
  const data = await c.req.json();
  const validated = propertyInsertSchema.parse(data);
  
  await db.insert(properties).values({
    ...validated,
    userId: user.id,  // From auth, not request!
  });
});
```

**Solution**: Always set `userId` from authenticated session, never from request body. Exclude `userId` from Zod insert schemas.

### Pitfall 8: Missing Authentication Middleware

**Problem**: Protected endpoints don't require authentication.

```typescript
// ❌ WRONG - No authentication
propertiesRouter.get("/", async (c) => {
  // Anyone can access this!
  const properties = await db.select().from(properties);
  return c.json({ properties });
});

// ✅ CORRECT - Requires authentication
// In apps/api/src/index.ts
app.use("/api/*", clerkMiddleware());

// In route
propertiesRouter.get("/", async (c) => {
  const { userId } = c.req.var.auth;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  // ... rest of logic
});
```

**Solution**: Always use Clerk authentication middleware on user-scoped endpoints.

### Pitfall 9: Missing Ownership Verification

**Problem**: Allowing users to modify resources they don't own.

```typescript
// ❌ WRONG - No ownership check
propertiesRouter.put("/:id", async (c) => {
  const id = c.req.param("id");
  const data = await c.req.json();
  // User can update any property!
  await db.update(properties).set(data).where(eq(properties.id, id));
});

// ✅ CORRECT - Verifies ownership
propertiesRouter.put("/:id", async (c) => {
  const { userId: clerkId } = c.req.var.auth;
  const [user] = await db.select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  
  const id = c.req.param("id");
  
  // Verify ownership
  const [existing] = await db.select()
    .from(properties)
    .where(and(
      eq(properties.id, id),
      eq(properties.userId, user.id)  // Ownership check!
    ))
    .limit(1);
  
  if (!existing) {
    return c.json({ error: "Property not found" }, 404);
  }
  
  // ... update logic
});
```

**Solution**: Always verify resource ownership before allowing mutations.

## Validation Issues

### Pitfall 10: Incomplete Zod Schemas

**Problem**: Zod schema doesn't match all fields in Drizzle schema.

```typescript
// Drizzle schema
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  name: text("name"),
  clerkId: text("clerk_id").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ❌ WRONG - Missing fields
export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  // Missing: firstName, lastName
});

// ✅ CORRECT - Complete schema
export const userInsertSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  // Excludes: id, clerkId, createdAt, updatedAt (auto-generated)
});
```

**Solution**: Ensure Zod schemas include all user-provided fields from Drizzle schema (excluding auto-generated ones).

## Migration Issues

### Pitfall 11: Forgetting to Generate Migrations

**Problem**: Schema changes made but migration not generated.

```bash
# ❌ WRONG - Schema changed but no migration
# Modified packages/db/src/schema/index.ts
# Forgot to run: pnpm --filter @axori/db db:generate

# ✅ CORRECT - Generate migration after schema changes
pnpm --filter @axori/db db:generate
# Review generated migration
pnpm --filter @axori/db db:migrate
```

**Solution**: Always generate and review migrations after schema changes.

### Pitfall 12: Breaking Changes Without Coordination

**Problem**: Making breaking schema changes without coordinating with frontend.

```typescript
// ❌ WRONG - Breaking change without coordination
// Removed field from schema
export const properties = pgTable("properties", {
  // removed: address field
  city: text("city").notNull(),
});

// Frontend still expects address field - breaks!

// ✅ CORRECT - Coordinate breaking changes
// 1. Add migration to remove field
// 2. Update frontend code
// 3. Deploy together or use feature flags
```

**Solution**: Coordinate breaking changes with frontend team. Consider deprecation periods for public APIs.

## Summary of Solutions

1. **Field Naming**: Always use camelCase in Zod schemas (matches Drizzle code layer)
2. **Auto-Generated Fields**: Exclude from insert schemas, include in select schemas
3. **Required Fields**: Match Zod validation to Drizzle `.notNull()` constraints
4. **Type Inference**: Always use Drizzle inference, never manual types
5. **User Filtering**: Always filter queries by authenticated user's ID
6. **User ID**: Set from auth context, never from request body
7. **Authentication**: Use Clerk middleware on all protected endpoints
8. **Ownership**: Verify ownership before mutations
9. **Complete Schemas**: Include all user-provided fields in Zod schemas
10. **Migrations**: Always generate and review migrations after schema changes
11. **Breaking Changes**: Coordinate with frontend team

