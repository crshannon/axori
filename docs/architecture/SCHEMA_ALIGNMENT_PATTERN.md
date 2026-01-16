# Schema Alignment Pattern

## Problem: Multiple Sources of Truth

Currently we have:
1. **Drizzle schema** (`packages/db/src/schema/index.ts`) - Database structure
2. **Zod schemas** (`packages/shared/src/validation/`) - Runtime validation
3. **TypeScript types** (`packages/db/src/types.ts`) - Compile-time types

This creates maintenance burden and potential drift.

## Solution: Single Source of Truth with `drizzle-zod`

### Architecture

```
Drizzle Schema (Source of Truth)
    ↓
    ├─→ Auto-generate Zod schemas (drizzle-zod)
    │       └─→ Enhance with custom validation rules
    │
    └─→ Infer TypeScript types (InferSelectModel/InferInsertModel)
            └─→ Export via @axori/shared
```

### Implementation Pattern

1. **Drizzle Schema** = Single source of truth
   - Define all structure, constraints, defaults here
   - Use `pgEnum` for constrained values (not `text()`)

2. **Auto-generate Zod schemas** using `drizzle-zod`
   ```typescript
   import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
   import { loans } from '@axori/db'
   
   // Base schema from Drizzle
   export const loanInsertSchema = createInsertSchema(loans, {
     // Override/enhance specific fields
     interestRate: z.number().min(0).max(100), // Add validation
   })
   ```

3. **Enhance with custom validation** where needed
   - API-specific constraints
   - User-friendly error messages
   - Business logic validation

4. **TypeScript types** come from Drizzle
   - `InferSelectModel<typeof loans>` for reads
   - `InferInsertModel<typeof loans>` for writes
   - Re-export via `@axori/shared/types`

### Benefits

- ✅ Single source of truth (Drizzle schema)
- ✅ No drift between DB and validation
- ✅ Schema changes propagate automatically
- ✅ Type safety maintained
- ✅ Can still add custom validation on top

### Migration Path

1. Install `drizzle-zod`: `pnpm add -w -D drizzle-zod`
2. Convert `text()` fields with constraints to `pgEnum()` in Drizzle
3. Replace manual Zod schemas with auto-generated ones
4. Enhance with custom validation where needed
5. Update API routes to use new schemas

### Example: Loan Schema

**Before (Manual - Drift Risk):**
```typescript
// Drizzle
loanType: text("loan_type").notNull()

// Zod (manually maintained)
loanType: z.enum(["conventional", "fha", ...]).default("conventional")
```

**After (Auto-generated - No Drift):**
```typescript
// Drizzle (source of truth)
loanType: pgEnum("loan_type", [
  "conventional", "fha", "va", ...
]).notNull().default("conventional")

// Zod (auto-generated + enhanced)
export const loanInsertSchema = createInsertSchema(loans, {
  interestRate: z.number().min(0).max(100), // Custom validation
})
```

## When to Deviate

Sometimes you need API-specific validation that doesn't match the DB:

- **Form validation**: Stricter than DB (e.g., required for UI, optional in DB)
- **API constraints**: Business logic rules (e.g., "interestRate must be 0-100%")
- **User messages**: Custom error messages for better UX

These should be **enhancements** on top of the base schema, not replacements.

