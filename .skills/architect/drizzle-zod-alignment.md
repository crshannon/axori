# Drizzle-Zod Alignment Guide

This guide ensures proper alignment between Drizzle ORM schemas and Zod validation schemas using `drizzle-zod` as the single source of truth.

## Core Principle: Single Source of Truth

**Drizzle schema is the single source of truth.** All Zod schemas are generated from Drizzle schemas using `drizzle-zod`, ensuring perfect alignment and eliminating drift.

## Schema Generation Pattern

### Step 1: Define Drizzle Schema

Always start with the Drizzle schema definition:

```typescript
// packages/db/src/schema/index.ts
import { pgTable, uuid, text, numeric, pgEnum } from "drizzle-orm/pg-core";

// Define enums using pgEnum (not text())
export const loanTypeEnum = pgEnum("loan_type", [
  "conventional",
  "fha",
  "va",
  "usda",
  "dscr",
  "portfolio",
  "hard_money",
  "bridge",
  "heloc",
  "construction",
  "owner_financed",
  "seller_finance",
  "commercial",
  "other",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "active",
  "paid_off",
  "refinanced",
  "defaulted",
  "sold",
]);

export const loans = pgTable("loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id)
    .notNull(),
  loanType: loanTypeEnum("loan_type").notNull().default("conventional"),
  status: loanStatusEnum("status").notNull().default("active"),
  lenderName: text("lender_name").notNull(),
  originalLoanAmount: numeric("original_loan_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 4 }).notNull(), // Stored as decimal (0.065)
  termMonths: integer("term_months").notNull(),
  currentBalance: numeric("current_balance", {
    precision: 12,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Step 2: Generate Base Zod Schemas

Use `drizzle-zod` to generate base schemas automatically:

```typescript
// packages/shared/src/validation/base/loans.ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { loans } from "@axori/db";

// Auto-generated base schemas
export const loanInsertSchema = createInsertSchema(loans);
export const loanSelectSchema = createSelectSchema(loans);
```

**Key Points:**

- `createInsertSchema()` automatically excludes auto-generated fields (id, createdAt, updatedAt)
- Numeric fields from Drizzle generate as `z.string()` (because PostgreSQL numeric is stored as string)
- Enum fields from `pgEnum()` generate as `z.enum()` with correct values
- All field names use camelCase (matching Drizzle code layer)

### Step 3: Create Enhanced Schemas for API

Create API-specific validation schemas that extend the base schemas:

```typescript
// packages/shared/src/validation/enhanced/loans.ts
import { loanInsertSchema, loanSelectSchema } from "../base/loans";
import { z } from "zod";

/**
 * Loan insert schema for API usage
 * - interestRate: Expects percentage (0-100), will be converted to decimal for DB
 * - userId: Added for authorization (not stored in loans table)
 * - Numeric fields: Converted from string (DB) to number (API)
 */
export const loanInsertApiSchema = loanInsertSchema.extend({
  // API expects interestRate as percentage (0-100), override string from base schema
  interestRate: z
    .number()
    .min(0)
    .max(100, "Interest rate must be between 0 and 100"),
  // userId for authorization (not stored in loans table)
  userId: z.string().uuid("User ID must be a valid UUID"),
  // Convert numeric string fields to numbers for API
  originalLoanAmount: z
    .number()
    .min(0, "Original loan amount must be positive"),
  currentBalance: z.number().min(0, "Current balance must be positive"),
  // termMonths is already a number in base schema, just add validation
  termMonths: z.number().int().min(1, "Term must be at least 1 month"),
}) as unknown as z.ZodType<any>;

/**
 * Loan update schema for API usage
 * All fields optional except propertyId
 */
export const loanUpdateApiSchema = loanInsertApiSchema
  .omit({ userId: true }) // userId not needed for updates
  .partial()
  .extend({
    propertyId: z.string().uuid("Property ID must be a valid UUID"),
  }) as unknown as z.ZodType<any>;
```

**Key Points:**

- Enhanced schemas extend base schemas with API-specific validation
- Override field types when needed (e.g., numeric strings → numbers)
- Add fields not in the database (e.g., `userId` for authorization)
- Use `.partial()` for update schemas
- Type annotations may be needed due to Zod version mismatches (doesn't affect runtime)

### Step 4: Export Types for Frontend

Export Zod-inferred types for use in frontend hooks:

```typescript
// packages/shared/src/types/index.ts
import type { z as zod } from "zod";
import { loanInsertApiSchema, loanUpdateApiSchema } from "../validation";

// Loan API types (for frontend use)
export type LoanInsertApi = zod.infer<typeof loanInsertApiSchema>;
export type LoanUpdateApi = zod.infer<typeof loanUpdateApiSchema>;
```

### Step 5: Use in API Routes

Use enhanced schemas in API routes:

```typescript
// apps/api/src/routes/properties.ts
import {
  loanInsertApiSchema,
  loanUpdateApiSchema,
} from "@axori/shared/src/validation";

// Create loan
propertiesRouter.post("/:id/loans", async (c) => {
  const validated = loanInsertApiSchema.parse(await c.req.json());

  // Convert API format to DB format
  const loanDataForDb = {
    propertyId: id,
    loanType: validated.loanType,
    lenderName: validated.lenderName,
    originalLoanAmount: String(validated.originalLoanAmount), // DB expects string
    interestRate: String(validated.interestRate / 100), // Convert percentage to decimal
    termMonths: validated.termMonths,
    currentBalance: String(validated.currentBalance),
    // ... other fields
  };

  await db.insert(loans).values(loanDataForDb);
});
```

### Step 6: Use in Frontend Hooks

Use Zod-inferred types in frontend hooks:

```typescript
// apps/web/src/hooks/api/useLoans.ts
import type { LoanInsertApi, LoanUpdateApi } from "@axori/shared";

export function useCreateLoan() {
  return useMutation({
    mutationFn: async ({
      propertyId,
      ...loanData
    }: Omit<LoanInsertApi, "userId"> & {
      propertyId: string;
    }) => {
      // loanData is fully typed from Zod schema
      return await apiFetch(`/api/properties/${propertyId}/loans`, {
        method: "POST",
        body: JSON.stringify(loanData),
      });
    },
  });
}
```

## File Structure

```
packages/shared/src/validation/
├── base/
│   ├── properties.ts    # Generated from Drizzle using drizzle-zod
│   ├── loans.ts         # Generated from Drizzle using drizzle-zod
│   └── expenses.ts      # Generated from Drizzle using drizzle-zod
├── enhanced/
│   ├── loans.ts         # API-specific validation (extends base)
│   └── expenses.ts      # API-specific validation (extends base)
└── index.ts             # Exports base + enhanced schemas
```

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

**Zod schemas generated by drizzle-zod automatically use camelCase** to match the code layer.

## Type Conversions

### Numeric Fields

Drizzle `numeric()` columns generate as `z.string()` in base schemas (because PostgreSQL stores numeric as string). Override in enhanced schemas:

```typescript
// Base schema (auto-generated)
originalLoanAmount: z.string(), // From Drizzle numeric()

// Enhanced schema (API-specific)
originalLoanAmount: z.number().min(0), // Override for API
```

### UUID → String

```typescript
// Drizzle
id: uuid("id").defaultRandom().primaryKey();

// Base schema (auto-generated)
id: z.string().uuid(); // Automatically correct
```

### Timestamp → Date/String

```typescript
// Drizzle
createdAt: timestamp("created_at").defaultNow().notNull();

// Base schema (auto-generated)
// Excluded from insert schema (auto-generated)
// Included in select schema as z.date()
```

### Enums

**Always use `pgEnum()` in Drizzle** - this ensures proper type safety:

```typescript
// Drizzle - Use pgEnum, not text()
export const loanTypeEnum = pgEnum("loan_type", [
  "conventional", "fha", "va", // ... etc
]);

export const loans = pgTable("loans", {
  loanType: loanTypeEnum("loan_type").notNull().default("conventional"),
});

// Base schema (auto-generated)
loanType: z.enum(["conventional", "fha", "va", ...]), // Automatically correct
```

## Required vs Optional Fields

### Matching Drizzle `.notNull()` Constraints

Base schemas automatically match Drizzle constraints:

- Fields with `.notNull()` are required in insert schemas
- Fields without `.notNull()` are optional/nullable
- Auto-generated fields (`.defaultRandom()`, `.defaultNow()`) are excluded from insert schemas

### Update Schemas

For updates, use `.partial()` on the enhanced schema:

```typescript
export const loanUpdateApiSchema = loanInsertApiSchema
  .omit({ userId: true }) // Remove fields not needed for updates
  .partial() // Make all fields optional
  .extend({
    propertyId: z.string().uuid(), // Required for updates
  });
```

## Validation Rules

### Adding Custom Validation

Add validation in enhanced schemas, not base schemas:

```typescript
// Enhanced schema
export const loanInsertApiSchema = loanInsertSchema.extend({
  interestRate: z
    .number()
    .min(0)
    .max(100, "Interest rate must be between 0 and 100"),
  originalLoanAmount: z
    .number()
    .min(0, "Original loan amount must be positive"),
});
```

### Business Logic Validation

Keep base schemas simple - they reflect the database structure. Add business logic validation in enhanced schemas.

## Schema Organization Pattern

### 1. Base Schemas (Auto-Generated)

Located in `packages/shared/src/validation/base/`:

- Generated using `createInsertSchema()` and `createSelectSchema()`
- Never manually edit these files
- Regenerate when Drizzle schema changes

### 2. Enhanced Schemas (API-Specific)

Located in `packages/shared/src/validation/enhanced/`:

- Extend base schemas with API-specific validation
- Override field types when needed (e.g., string → number)
- Add fields not in database (e.g., `userId` for authorization)
- Add custom validation rules

### 3. Type Exports

Located in `packages/shared/src/types/index.ts`:

- Export Drizzle-inferred types from `@axori/db`
- Export Zod-inferred types from enhanced schemas
- Single source of truth for all types

## Migration Workflow

When adding a new table or modifying an existing one:

1. **Update Drizzle Schema** (`packages/db/src/schema/index.ts`)
   - Use `pgEnum()` for enum fields (not `text()`)
   - Use proper types (uuid, text, numeric, timestamp, etc.)
   - Add relations if needed

2. **Generate Base Schemas**

   ```bash
   # Base schemas are generated automatically when you run:
   pnpm --filter @axori/shared type-check
   # Or manually create/update base/*.ts files using:
   # createInsertSchema() and createSelectSchema()
   ```

3. **Create Enhanced Schemas** (`packages/shared/src/validation/enhanced/`)
   - Extend base schemas
   - Add API-specific validation
   - Override types when needed

4. **Export Types** (`packages/shared/src/types/index.ts`)
   - Export Zod-inferred types from enhanced schemas

5. **Update API Routes** (`apps/api/src/routes/`)
   - Use enhanced schemas for validation
   - Convert API format to DB format (e.g., percentage → decimal)

6. **Update Frontend Hooks** (`apps/web/src/hooks/api/`)
   - Use Zod-inferred types from `@axori/shared`
   - Ensure types match API expectations

7. **Generate Migration**

   ```bash
   pnpm --filter @axori/db db:generate
   ```

8. **Apply Migration**
   ```bash
   pnpm --filter @axori/db db:migrate
   ```

## Common Patterns

### Pattern: Numeric Field Conversion

```typescript
// Drizzle: numeric() stores as string
interestRate: numeric("interest_rate", { precision: 5, scale: 4 }),

// Base schema: z.string()
interestRate: z.string(),

// Enhanced schema: z.number() for API
interestRate: z.number().min(0).max(100),

// API route: Convert percentage to decimal
interestRate: String(validated.interestRate / 100), // 6.5% → "0.065"
```

### Pattern: Authorization Field

```typescript
// Enhanced schema: Add userId for authorization
export const loanInsertApiSchema = loanInsertSchema.extend({
  userId: z.string().uuid(), // Not in DB, used for authorization
});

// API route: Use userId for authorization, don't store in DB
const validated = loanInsertApiSchema.parse(body);
// validated.userId used for auth check
// Don't include in loanDataForDb
```

### Pattern: Date Fields

```typescript
// Drizzle: date or timestamp
purchaseDate: date("purchase_date"),

// Base schema: z.string().date() or z.date()
purchaseDate: z.string().date(),

// Enhanced schema: Keep as string for API
purchaseDate: z.string().date("Purchase date must be a valid date"),

// API route: Already string, use directly
purchaseDate: validated.purchaseDate, // Already ISO date string
```

## Validation Checklist

When creating schemas for a new Drizzle table:

- [ ] Use `pgEnum()` for enum fields (not `text()`)
- [ ] Generate base schemas using `createInsertSchema()` and `createSelectSchema()`
- [ ] Create enhanced schema for API-specific validation
- [ ] Override numeric fields (string → number) in enhanced schema
- [ ] Add authorization fields (e.g., `userId`) in enhanced schema if needed
- [ ] Export Zod-inferred types in `packages/shared/src/types/index.ts`
- [ ] Use enhanced schemas in API routes
- [ ] Use Zod-inferred types in frontend hooks
- [ ] Convert API format to DB format in API routes (e.g., percentage → decimal)
- [ ] Generate and apply database migration

## Example: Complete Workflow

See the completed Drizzle-Zod migration documentation:

- `docs/architecture/completed/drizzle-zod-migration-complete.md`
- `docs/architecture/completed/drizzle-zod-phase5-test-results.md`
- `docs/architecture/completed/drizzle-zod-phase6-summary.md`

## Important Notes

1. **Never manually edit base schemas** - they are auto-generated
2. **Always use `pgEnum()` for enums** - ensures type safety and proper Zod generation
3. **Enhanced schemas are for API validation** - base schemas reflect database structure
4. **Type annotations may be needed** - due to Zod version mismatches, but doesn't affect runtime
5. **Convert types in API routes** - API uses numbers, DB uses strings for numeric fields
