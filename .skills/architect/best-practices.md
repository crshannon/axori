# Architectural Best Practices

This guide outlines best practices for maintaining consistency and quality across the Axori application.

## Documentation and Planning

### Plan Before You Build

For any major architectural change (new tables, migrations, refactors):

1. **Create a Plan** - Document your approach before starting
   - Create versioned folder: `docs/architecture/plans/003-feature-name/`
   - Write `SUMMARY.md` - Quick read (1-2 pages) for stakeholders
   - Write `EXECUTION.md` - Detailed guide for implementation

2. **Document as You Go** - Don't wait until the end
   - Update execution plan as you work
   - Note decisions and trade-offs
   - Track file changes

3. **Archive When Complete** - Move to completed folder
   - Create `COMPLETION.md` summary
   - Move folder to `docs/architecture/completed/`

See [planning-workflow.md](./planning-workflow.md) for detailed templates and workflow.

## Naming Conventions

### Database Schema

- **Table names**: Use plural, snake_case (e.g., `properties`, `user_properties`)
- **Column names in DB**: Use snake_case (e.g., `user_id`, `created_at`)
- **Column names in code**: Use camelCase (e.g., `userId`, `createdAt`)
- **Foreign keys**: Use `{tableName}Id` pattern (e.g., `userId`, `propertyId`)

```typescript
// ✅ Correct naming
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### TypeScript Types

- **Type names**: Use PascalCase (e.g., `Property`, `UserProfile`)
- **Insert types**: Suffix with `Insert` (e.g., `PropertyInsert`)
- **Select types**: Use base name (e.g., `Property`)

```typescript
// ✅ Correct type naming
export type Property = InferSelectModel<typeof properties>
export type PropertyInsert = InferInsertModel<typeof properties>
```

### API Routes

- **Route files**: Use plural, kebab-case (e.g., `properties.ts`, `user-properties.ts`)
- **Endpoints**: Use RESTful conventions
  - `GET /api/properties` - List resources
  - `GET /api/properties/:id` - Get single resource
  - `POST /api/properties` - Create resource
  - `PUT /api/properties/:id` - Update resource
  - `DELETE /api/properties/:id` - Delete resource

### Zod Schemas

- **Schema names**: Use descriptive names with suffix (e.g., `propertyInsertSchema`, `propertySelectSchema`)
- **Variable names**: Use camelCase (e.g., `propertySchema`)

## Schema Organization Patterns

### Single File per Domain

Group related tables in the same schema file:

```typescript
// packages/db/src/schema/properties.ts
export const properties = pgTable("properties", { /* ... */ });
export const propertyImages = pgTable("property_images", { /* ... */ });
export const propertyAnalytics = pgTable("property_analytics", { /* ... */ });
```

### Index File Pattern

Re-export all schemas from an index file:

```typescript
// packages/db/src/schema/index.ts
export * from './users'
export * from './properties'
export * from './property-images'
```

### Schema Relationships

Define relationships explicitly with foreign keys:

```typescript
// ✅ Explicit foreign key
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  // ...
});
```

## Migration Best Practices

### Migration Workflow

1. **Modify schema** in `packages/db/src/schema/index.ts`
2. **Generate migration**: `pnpm --filter @axori/db db:generate`
3. **Review SQL** in generated migration file
4. **Test locally** before committing
5. **Commit migration** with schema changes
6. **Apply in order**: Dev → Staging → Production

### Migration Naming

Drizzle generates migrations with timestamps. Always review the generated SQL:

```sql
-- ✅ Good migration
CREATE TABLE "properties" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "address" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "properties_user_id_idx" ON "properties"("user_id");
```

### Breaking Changes

When making breaking changes:

1. **Create migration** for schema changes
2. **Update code** to match new schema
3. **Update Zod schemas** to match
4. **Document changes** in commit message
5. **Coordinate deployment** with frontend changes if needed

## Validation Layer Patterns

### Schema Separation

Create separate schemas for different operations:

```typescript
// Insert schema - excludes auto-generated fields
export const propertyInsertSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  // Excludes: id, userId, createdAt, updatedAt
});

// Select schema - includes all fields
export const propertySelectSchema = propertyInsertSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Update schema - all fields optional except ID
export const propertyUpdateSchema = z.object({
  id: z.string().uuid(),
  address: z.string().min(1).optional(),
  // ... other fields optional
});
```

### Validation Error Messages

Provide clear, user-friendly error messages:

```typescript
// ✅ Good error messages
z.string().min(1, "Address is required")
z.string().email("Please enter a valid email address")
z.string().regex(/^\d{5}(-\d{4})?$/, "ZIP code must be 5 digits (e.g., 12345)")

// ❌ Bad error messages
z.string().min(1)
z.string().email()
z.string().regex(/^\d{5}(-\d{4})?$/)
```

### Reusable Validation Patterns

Create reusable validation patterns:

```typescript
// packages/shared/src/validation/patterns.ts
export const emailSchema = z.string().email("Invalid email address");
export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code");
export const stateSchema = z.string().length(2, "State must be 2 characters");

// Use in schemas
export const propertyInsertSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: stateSchema,
  zipCode: zipCodeSchema,
  // ...
});
```

## Error Handling Consistency

### API Error Response Format

Use consistent error response format:

```typescript
// ✅ Consistent error format
{
  "error": "Property not found",
  "code": "PROPERTY_NOT_FOUND",  // Optional: error code
  "details": {}  // Optional: additional details
}

// Status codes
200 - Success
201 - Created
400 - Bad Request (validation errors)
401 - Unauthorized
404 - Not Found
500 - Internal Server Error
```

### Error Handling Pattern

```typescript
// ✅ Consistent error handling
propertiesRouter.get("/:id", async (c) => {
  try {
    const { userId } = c.req.var.auth;
    
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // ... logic
    
    return c.json({ property });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, 400);
    }
    
    console.error("Error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
```

## Code Organization

### Package Structure

```
packages/
  db/
    src/
      schema/        # Drizzle schemas
      types.ts       # Inferred types
      client.ts      # Database client
      index.ts       # Exports
  shared/
    src/
      validation/   # Zod schemas
      types/         # Re-exported types (from db)
      utils/         # Shared utilities
```

### API Route Structure

```
apps/api/
  src/
    routes/          # Route handlers
      properties.ts
      users.ts
    utils/           # Shared utilities
      auth.ts        # Auth helpers
    index.ts         # App setup
```

### Import Patterns

```typescript
// ✅ Consistent import order
// 1. External dependencies
import { Hono } from "hono";
import { eq } from "drizzle-orm";

// 2. Internal packages
import { db } from "@axori/db";
import { properties } from "@axori/db/src/schema";
import { propertyInsertSchema } from "@axori/shared/src/validation";

// 3. Local imports
import { requireAuth } from "../utils/auth";
```

## Type Safety Patterns

### Type Inference Chain

```typescript
// 1. Define schema
export const properties = pgTable("properties", { /* ... */ });

// 2. Infer types
export type Property = InferSelectModel<typeof properties>
export type PropertyInsert = InferInsertModel<typeof properties>

// 3. Use in API
async function getProperty(id: string): Promise<Property | null> {
  // Type-safe query
}

// 4. Use in validation
const validated: PropertyInsert = propertyInsertSchema.parse(data);
```

### Avoid Type Assertions

```typescript
// ❌ Avoid type assertions
const property = data as Property;

// ✅ Use proper typing
const property: Property = await db.select()...
```

## Performance Considerations

### Database Indexes

Add indexes for frequently queried fields:

```typescript
// Add indexes for foreign keys and search fields
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  address: text("address").notNull(),
  // ...
}, (table) => ({
  userIdIdx: index("properties_user_id_idx").on(table.userId),
  addressIdx: index("properties_address_idx").on(table.address),
}));
```

### Query Optimization

- Use `.limit()` for list queries
- Use `.select()` with specific fields when possible
- Avoid N+1 queries with proper joins
- Use transactions for related operations

## Documentation Standards

### JSDoc Comments

Add JSDoc comments for complex types and functions:

```typescript
/**
 * User profile type inferred from Drizzle schema (for read operations)
 * 
 * @example
 * const user: UserProfile = await db.select().from(users).limit(1)
 */
export type UserProfile = InferSelectModel<typeof users>

/**
 * Creates a new property for the authenticated user
 * 
 * @param data - Property data (validated with Zod)
 * @returns Created property
 * @throws {Error} If user is not authenticated
 */
async function createProperty(data: PropertyInsert): Promise<Property> {
  // ...
}
```

## Summary

Follow these best practices to ensure:
- ✅ Consistent naming across the codebase
- ✅ Maintainable and scalable architecture
- ✅ Type safety throughout the stack
- ✅ Clear error handling and validation
- ✅ Well-organized and documented code

