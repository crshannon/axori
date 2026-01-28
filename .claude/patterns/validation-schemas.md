# Validation Schema Patterns

Reference for creating Zod validation schemas in Axori.

## Three-Tier Schema Architecture

```
packages/shared/src/validation/
├── base/           # Auto-generated from Drizzle
├── enhanced/       # API-specific validation
└── forms/          # Frontend form validation
```

---

## Tier 1: Base Schemas (drizzle-zod)

Auto-generated from Drizzle schema. These reflect the database exactly.

```typescript
// packages/shared/src/validation/base/[entity].ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { myTable } from "@axori/db";

export const myEntityInsertSchema = createInsertSchema(myTable);
export const myEntitySelectSchema = createSelectSchema(myTable);
```

### What drizzle-zod generates:

| Drizzle Type | Zod Type | Notes |
|--------------|----------|-------|
| `text()` | `z.string()` | |
| `uuid()` | `z.string().uuid()` | |
| `timestamp()` | `z.date()` | |
| `numeric()` | `z.string()` | PostgreSQL stores as string |
| `boolean()` | `z.boolean()` | |
| `pgEnum()` | `z.enum([...])` | From enum values |
| `.notNull()` | Required field | |
| `.default()` | `.optional()` | |

### Auto-excluded fields:
- `id` (when `defaultRandom()`)
- `createdAt` (when `defaultNow()`)
- `updatedAt` (when `defaultNow()`)

---

## Tier 2: Enhanced API Schemas

Extend base schemas with business logic, type transformations, and user-friendly messages.

```typescript
// packages/shared/src/validation/enhanced/[entity].ts
import { z } from "zod";
import { myEntityInsertSchema } from "../base/myEntity";

export const myEntityInsertApiSchema = myEntityInsertSchema.extend({
  // Override numeric fields: string -> number
  amount: z.number().min(0, "Amount must be positive"),
  interestRate: z.number().min(0).max(100, "Rate must be 0-100%"),

  // Add fields not in database
  userId: z.string().uuid("Invalid user ID"),

  // Add custom validation
  email: z.string().email("Invalid email address"),
});

// Update schema (all fields optional except id)
export const myEntityUpdateApiSchema = myEntityInsertApiSchema
  .partial()
  .extend({
    id: z.string().uuid("Invalid ID"),
  });
```

---

## Tier 3: Form Schemas

Frontend-specific validation with string-to-number transformations for form inputs.

```typescript
// packages/shared/src/validation/forms/[entity].ts
import { z } from "zod";

export const myEntityFormSchema = z.object({
  // String inputs that transform to numbers
  amount: z
    .string()
    .min(1, "Amount is required")
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= 0, "Enter a valid positive amount"),

  // Percentage fields
  interestRate: z
    .string()
    .min(1, "Interest rate is required")
    .transform((val) => parseFloat(val))
    .refine(
      (val) => !isNaN(val) && val >= 0 && val <= 100,
      "Enter a rate between 0 and 100"
    ),

  // Date fields (form uses string, API uses Date)
  startDate: z
    .string()
    .min(1, "Start date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
});
```

---

## Common Validation Patterns

### Reusable Patterns
```typescript
// packages/shared/src/validation/patterns.ts

// Email
export const emailSchema = z.string().email("Invalid email address");

// Phone (US format)
export const phoneSchema = z
  .string()
  .regex(/^\d{10}$|^\d{3}-\d{3}-\d{4}$/, "Invalid phone format");

// ZIP Code
export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code");

// US State (2 letter)
export const stateSchema = z
  .string()
  .length(2, "State must be 2 characters")
  .toUpperCase();

// Currency (positive number)
export const currencySchema = z
  .number()
  .min(0, "Amount must be positive");

// Percentage (0-100)
export const percentageSchema = z
  .number()
  .min(0, "Must be at least 0")
  .max(100, "Must be at most 100");

// UUID
export const uuidSchema = z.string().uuid("Invalid ID format");
```

---

## Error Message Guidelines

Always provide user-friendly, descriptive messages:

```typescript
// ✅ Good
z.string().min(1, "Property address is required")
z.number().min(0, "Purchase price must be positive")
z.string().email("Please enter a valid email address")
z.number().max(100, "Interest rate cannot exceed 100%")

// ❌ Bad (uses generic Zod messages)
z.string().min(1)
z.number().min(0)
z.string().email()
```

### Message Patterns:
- Required fields: `"[Field name] is required"`
- Range validation: `"[Field] must be between X and Y"`
- Format validation: `"Invalid [field] format"` or `"Please enter a valid [field]"`
- Positive numbers: `"[Field] must be positive"`

---

## Schema Composition

### Merging Schemas
```typescript
const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: stateSchema,
  zipCode: zipCodeSchema,
});

const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
}).merge(addressSchema);
```

### Extending Schemas
```typescript
const basePropertySchema = propertyInsertSchema.extend({
  // Add new fields
});
```

### Partial Schemas (for updates)
```typescript
const propertyUpdateSchema = propertyInsertSchema.partial();
```

### Pick/Omit
```typescript
const propertyAddressOnly = propertySchema.pick({
  street: true,
  city: true,
  state: true,
  zipCode: true,
});

const propertyWithoutId = propertySchema.omit({
  id: true,
});
```

---

## Type Inference

Always infer types from Zod schemas:

```typescript
import type { z } from "zod";

// Infer input type (before transforms)
export type MyEntityFormInput = z.input<typeof myEntityFormSchema>;

// Infer output type (after transforms)
export type MyEntityFormOutput = z.output<typeof myEntityFormSchema>;

// Standard inference (same as output)
export type MyEntityApi = z.infer<typeof myEntityInsertApiSchema>;
```

---

## API Route Usage

```typescript
// apps/api/src/routes/[entity].ts
import { validateData } from "../utils/validation";
import { myEntityInsertApiSchema } from "@axori/shared/src/validation";

app.post("/", requireAuth(), withErrorHandling(async (c) => {
  const body = await c.req.json();

  // Validates and throws AppError if invalid
  const validated = validateData(myEntityInsertApiSchema, body);

  // validated is now typed as z.infer<typeof myEntityInsertApiSchema>
  const [created] = await db.insert(myTable).values(validated).returning();

  return c.json(created, 201);
}));
```

---

## Export Convention

```typescript
// packages/shared/src/validation/index.ts

// Export base schemas (usually not needed externally)
export * from "./base/myEntity";

// Export enhanced schemas (for API)
export * from "./enhanced/myEntity";

// Export form schemas (for frontend)
export * from "./forms/myEntity";

// Export types
export type { MyEntityApi, MyEntityFormInput } from "./enhanced/myEntity";
```
