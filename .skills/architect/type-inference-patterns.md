# Type Inference Patterns

This guide covers proper usage of Drizzle's type inference to avoid type duplication and ensure type safety.

## Core Principle: Always Use Drizzle Inference

**Never manually define types that duplicate Drizzle schemas.** Instead, use Drizzle's built-in type inference utilities.

## Type Inference Utilities

### InferSelectModel

Use `InferSelectModel` for types representing data read from the database:

```typescript
import { InferSelectModel } from 'drizzle-orm'
import { users } from './schema'

export type UserProfile = InferSelectModel<typeof users>
```

This type includes:
- All fields from the schema
- Proper types (Date for timestamps, string for UUIDs, etc.)
- Nullable fields as `T | null`
- Required fields as `T`

### InferInsertModel

Use `InferInsertModel` for types representing data to be inserted:

```typescript
import { InferInsertModel } from 'drizzle-orm'
import { users } from './schema'

export type UserProfileInsert = InferInsertModel<typeof users>
```

This type:
- Excludes auto-generated fields (like `id` with `.defaultRandom()`)
- Makes optional fields that have defaults
- Includes nullable fields as optional

## Export Pattern

### Location: `packages/db/src/types.ts`

All inferred types should be exported from this file:

```typescript
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { users, properties } from './schema'

/**
 * User profile type inferred from Drizzle schema (for read operations)
 */
export type UserProfile = InferSelectModel<typeof users>

/**
 * User profile insert type inferred from Drizzle schema (for insert operations)
 */
export type UserProfileInsert = InferInsertModel<typeof users>

/**
 * Property type inferred from Drizzle schema (for read operations)
 */
export type Property = InferSelectModel<typeof properties>

/**
 * Property insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyInsert = InferInsertModel<typeof properties>
```

### Re-export from Index

Make types available through the package's main export:

```typescript
// packages/db/src/index.ts
export * from './types'
export * from './schema'
export { db } from './client'
```

## Usage in Shared Package

### Import from @axori/db

Instead of defining types in `packages/shared/src/types/index.ts`, import from the db package:

```typescript
// ❌ WRONG - Manual type definition
export type Property = {
  id: string;
  address: string;
  // ... manually defined
};

// ✅ CORRECT - Import from db package
import type { Property, PropertyInsert } from '@axori/db'
export type { Property, PropertyInsert } from '@axori/db'
```

## When to Use Each Type

### InferSelectModel
- API response types
- Component prop types for displaying data
- Type annotations for query results
- Return types from database queries

```typescript
// API route
import type { Property } from '@axori/db'

app.get('/api/properties/:id', async (c) => {
  const property: Property = await db.select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1)
  return c.json({ property })
})
```

### InferInsertModel
- API request body types
- Form data types
- Type annotations for insert operations
- Input validation (used with Zod)

```typescript
// API route
import type { PropertyInsert } from '@axori/db'

app.post('/api/properties', async (c) => {
  const data: PropertyInsert = await c.req.json()
  const [property] = await db.insert(properties).values(data).returning()
  return c.json({ property })
})
```

## Partial Types for Updates

For update operations, use TypeScript's `Partial` utility:

```typescript
import type { PropertyInsert } from '@axori/db'

export type PropertyUpdate = Partial<PropertyInsert> & {
  id: string  // ID is always required for updates
}
```

## Avoiding Type Duplication

### ❌ Anti-Pattern: Manual Type Definition

```typescript
// packages/shared/src/types/index.ts
export type Property = {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  createdAt: Date;
  updatedAt: Date;
};
```

**Problems:**
- Duplicates schema definition
- Can drift out of sync with schema
- Requires manual updates when schema changes
- No type safety guarantee

### ✅ Correct Pattern: Use Inference

```typescript
// packages/shared/src/types/index.ts
export type { Property, PropertyInsert } from '@axori/db'
```

**Benefits:**
- Single source of truth (Drizzle schema)
- Automatically stays in sync
- Type-safe by construction
- No maintenance overhead

## Type Safety Across Layers

### Database Layer → API Layer → Frontend

```typescript
// 1. Database Schema (packages/db/src/schema/index.ts)
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  address: text("address").notNull(),
  // ...
});

// 2. Type Export (packages/db/src/types.ts)
export type Property = InferSelectModel<typeof properties>

// 3. API Route (apps/api/src/routes/properties.ts)
import type { Property } from '@axori/db'
// Use Property type for responses

// 4. Frontend (apps/web/src/components/...)
import type { Property } from '@axori/db'
// Use Property type for props
```

## Common Patterns

### Query Result Types

```typescript
import type { Property } from '@axori/db'

async function getProperty(id: string): Promise<Property | null> {
  const [property] = await db.select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1)
  return property || null
}
```

### Array Results

```typescript
import type { Property } from '@axori/db'

async function getProperties(): Promise<Property[]> {
  return await db.select().from(properties)
}
```

### Insert with Returning

```typescript
import type { Property, PropertyInsert } from '@axori/db'

async function createProperty(data: PropertyInsert): Promise<Property> {
  const [property] = await db.insert(properties)
    .values(data)
    .returning()
  return property
}
```

## Migration Strategy

If you have existing manual types:

1. **Export inferred types** from `packages/db/src/types.ts`
2. **Update imports** in `packages/shared/src/types/index.ts` to re-export from `@axori/db`
3. **Update all usages** to import from `@axori/db` or `@axori/shared`
4. **Remove manual type definitions**

## Type Checking

TypeScript will catch mismatches automatically:

```typescript
// This will error if schema changes
const property: Property = {
  id: "123",
  address: "123 Main St",
  // Missing required fields will cause type error
}
```

## Best Practices

1. **Single Source of Truth**: Drizzle schema is the only definition
2. **Export Once**: Export types from `packages/db/src/types.ts`
3. **Re-export**: Use re-exports in shared package for convenience
4. **Use Inference**: Always prefer `InferSelectModel`/`InferInsertModel` over manual types
5. **Type Safety**: Let TypeScript catch schema mismatches at compile time

