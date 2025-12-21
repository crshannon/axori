# Drizzle-Zod Alignment Guide

This guide ensures proper alignment between Drizzle ORM schemas and Zod validation schemas.

## Field Naming Conventions

### Database Layer vs Code Layer

Drizzle uses **camelCase** in your TypeScript code but maps to **snake_case** in the database:

```typescript
// Drizzle Schema (camelCase in code)
export const properties = pgTable("properties", {
  zipCode: text("zip_code").notNull(), // camelCase → snake_case
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Zod schemas must use camelCase** to match the code layer:

```typescript
// Zod Schema (camelCase to match code)
export const propertySchema = z.object({
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  // createdAt excluded - auto-generated
});
```

### Rule: Always use camelCase in Zod schemas

The database column name (snake_case) is only relevant for migrations. Your application code and validation should use camelCase.

## Type Conversions

### UUID → String

```typescript
// Drizzle
id: uuid("id").defaultRandom().primaryKey();

// Zod
id: z.string().uuid().optional(); // Optional for inserts, required for selects
```

### Timestamp → Date/String

```typescript
// Drizzle
createdAt: timestamp("created_at").defaultNow().notNull();

// Zod
// Exclude from insert schemas (auto-generated)
// Include in select schemas as: z.date() or z.string().datetime()
```

### Text → String

```typescript
// Drizzle
address: text("address").notNull();

// Zod
address: z.string().min(1, "Address is required");
```

### Nullable Fields

```typescript
// Drizzle
firstName: text("first_name"); // Nullable

// Zod
firstName: z.string().optional(); // or .nullable() depending on use case
```

## Required vs Optional Fields

### Matching Drizzle `.notNull()` Constraints

If a Drizzle field has `.notNull()`, the Zod schema must require it (unless it's auto-generated):

```typescript
// Drizzle
address: text("address").notNull();

// Zod - Required
address: z.string().min(1, "Address is required");
```

### Auto-Generated Fields

Fields with `.defaultRandom()`, `.defaultNow()`, or computed values should be **excluded from insert schemas**:

```typescript
// Drizzle
id: uuid("id").defaultRandom().primaryKey();
createdAt: timestamp("created_at").defaultNow().notNull();

// Zod Insert Schema - Exclude these
export const propertyInsertSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  // id and createdAt excluded - auto-generated
});

// Zod Select Schema - Include these
export const propertySelectSchema = z.object({
  id: z.string().uuid(),
  address: z.string(),
  createdAt: z.date(),
  // ... other fields
});
```

### Nullable Fields

```typescript
// Drizzle
firstName: text("first_name"); // No .notNull() = nullable

// Zod
firstName: z.string().optional(); // or z.string().nullable()
```

## Validation Rules Matching DB Constraints

### String Length Constraints

```typescript
// Drizzle
state: text("state").notNull();

// Zod - Add validation matching business rules
state: z.string().length(2, "State must be 2 characters");
```

### Unique Constraints

```typescript
// Drizzle
email: text("email").notNull().unique();

// Zod - Validate format, uniqueness checked at DB level
email: z.string().email("Invalid email address");
```

### Regex Patterns

```typescript
// Drizzle
zipCode: text("zip_code").notNull();

// Zod - Add format validation
zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code");
```

## Schema Organization Pattern

### Separate Insert and Select Schemas

Create separate schemas for inserts (without auto-generated fields) and selects (with all fields):

```typescript
// Insert schema - excludes auto-generated fields
export const propertyInsertSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  propertyType: z.string().min(1, "Property type is required"),
  // Excludes: id, createdAt, updatedAt
});

// Select schema - includes all fields
export const propertySelectSchema = propertyInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

### Update Schemas

For updates, make all fields optional except the ID:

```typescript
export const propertyUpdateSchema = z.object({
  id: z.string().uuid(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  // ... other fields optional
});
```

## Common Patterns

### User Foreign Keys

```typescript
// Drizzle
userId: uuid("user_id")
  .references(() => users.id)
  .notNull();

// Zod Insert
userId: z.string().uuid(); // Usually comes from auth context, not user input

// Zod Select
userId: z.string().uuid();
```

### Enums

```typescript
// Drizzle
import { pgEnum } from "drizzle-orm/pg-core";
export const propertyTypeEnum = pgEnum("property_type", [
  "house",
  "apartment",
  "condo",
]);

// Zod
propertyType: z.enum(["house", "apartment", "condo"]);
```

## Validation Checklist

When creating a Zod schema for a Drizzle table:

- [ ] All field names use camelCase (matching Drizzle code layer)
- [ ] Required fields match Drizzle `.notNull()` constraints
- [ ] Auto-generated fields (id, timestamps) excluded from insert schemas
- [ ] Nullable fields marked as `.optional()` or `.nullable()`
- [ ] Validation rules match business requirements
- [ ] Separate schemas for insert/select/update operations
- [ ] Foreign keys properly typed as UUID strings

## Example: Complete Alignment

```typescript
// Drizzle Schema
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  propertyType: text("property_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Insert Schema
export const propertyInsertSchema = z.object({
  userId: z.string().uuid(), // From auth context
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  propertyType: z.string().min(1, "Property type is required"),
});

// Zod Select Schema
export const propertySelectSchema = propertyInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```
