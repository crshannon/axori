# Drizzle-Zod Migration Plan

## Overview

This plan outlines the migration from manually-maintained Zod schemas to auto-generated schemas using `drizzle-zod`, establishing Drizzle schema as the single source of truth.

## Goals

1. **Single Source of Truth**: Drizzle schema becomes the authoritative definition
2. **Eliminate Drift**: Auto-generate Zod schemas to prevent schema mismatches
3. **Type Safety**: Maintain full TypeScript type safety throughout
4. **Custom Validation**: Allow API-specific validation enhancements where needed

## Current State Analysis

### Manual Zod Schemas (To Be Replaced)

Located in `packages/shared/src/validation/normalized-property.ts`:

- `propertyCharacteristicsInsertSchema` / `SelectSchema` / `UpdateSchema`
- `propertyValuationInsertSchema` / `SelectSchema` / `UpdateSchema`
- `propertyAcquisitionInsertSchema` / `SelectSchema` / `UpdateSchema`
- `propertyRentalIncomeInsertSchema` / `SelectSchema` / `UpdateSchema`
- `propertyOperatingExpensesInsertSchema` / `SelectSchema` / `UpdateSchema`
- `propertyManagementInsertSchema` / `SelectSchema` / `UpdateSchema`
- `loanInsertSchema` / `SelectSchema` / `UpdateSchema`
- `propertyExpenseInsertSchema` / `SelectSchema` / `UpdateSchema`

### Drizzle Schema Issues (To Be Fixed)

Located in `packages/db/src/schema/index.ts`:

1. **Enum Fields Using `text()` Instead of `pgEnum()`**:
   - `loans.loanType` - should be `pgEnum("loan_type", [...])`
   - `loans.status` - should be `pgEnum("loan_status", [...])`
   - `propertyExpenses.category` - should be `pgEnum("expense_category", [...])`
   - `propertyExpenses.recurrenceFrequency` - should be `pgEnum("recurrence_frequency", [...])`
   - `propertyExpenses.source` - should be `pgEnum("expense_source", [...])`

2. **Numeric Fields**:
   - Currently using `numeric()` which stores as string in DB
   - Zod schemas expect `number`, need conversion layer

3. **Date Fields**:
   - Using `date()` and `timestamp()` correctly
   - Need to ensure Zod handles ISO strings properly

## Migration Phases

### Phase 1: Setup and Installation

**Tasks:**
- [ ] Install `drizzle-zod` package
  ```bash
  pnpm add -w drizzle-zod
  ```
- [ ] Add to `packages/shared/package.json` dependencies
- [ ] Create new validation file structure:
  ```
  packages/shared/src/validation/
  ├── index.ts (exports)
  ├── base/ (auto-generated from Drizzle)
  │   ├── properties.ts
  │   ├── loans.ts
  │   ├── expenses.ts
  │   └── ...
  └── enhanced/ (custom validation)
      ├── properties.ts
      ├── loans.ts
      ├── expenses.ts
      └── ...
  ```

**Estimated Time:** 30 minutes

---

### Phase 2: Convert Drizzle Enums

**Tasks:**
- [ ] Create `loanTypeEnum` in `packages/db/src/schema/index.ts`:
  ```typescript
  export const loanTypeEnum = pgEnum("loan_type", [
    "conventional",
    "fha",
    "va",
    "usda",
    "portfolio",
    "hard_money",
    "bridge",
    "heloc",
    "construction",
    "owner_financed",
    "other",
  ]);
  ```

- [ ] Create `loanStatusEnum`:
  ```typescript
  export const loanStatusEnum = pgEnum("loan_status", [
    "active",
    "paid_off",
    "refinanced",
    "defaulted",
  ]);
  ```

- [ ] Create `expenseCategoryEnum`:
  ```typescript
  export const expenseCategoryEnum = pgEnum("expense_category", [
    "maintenance",
    "repairs",
    "utilities",
    "insurance",
    "property_taxes",
    "management",
    "advertising",
    "legal",
    "accounting",
    "other",
  ]);
  ```

- [ ] Create `recurrenceFrequencyEnum`:
  ```typescript
  export const recurrenceFrequencyEnum = pgEnum("recurrence_frequency", [
    "monthly",
    "quarterly",
    "annual",
  ]);
  ```

- [ ] Create `expenseSourceEnum`:
  ```typescript
  export const expenseSourceEnum = pgEnum("expense_source", [
    "manual",
    "appfolio",
    "plaid",
    "document_ai",
  ]);
  ```

- [ ] Update `loans` table to use enums:
  ```typescript
  loanType: loanTypeEnum("loan_type").notNull().default("conventional"),
  status: loanStatusEnum("status").notNull().default("active"),
  ```

- [ ] Update `propertyExpenses` table to use enums:
  ```typescript
  category: expenseCategoryEnum("category").notNull(),
  recurrenceFrequency: recurrenceFrequencyEnum("recurrence_frequency"),
  source: expenseSourceEnum("source").default("manual"),
  ```

- [ ] Generate and run migration:
  ```bash
  pnpm --filter @axori/db db:generate
  pnpm --filter @axori/db db:push
  ```

**Estimated Time:** 2 hours

---

### Phase 3: Generate Base Zod Schemas

**Tasks:**
- [ ] Create `packages/shared/src/validation/base/properties.ts`:
  ```typescript
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import {
    properties,
    propertyCharacteristics,
    propertyValuation,
    propertyAcquisition,
    propertyRentalIncome,
    propertyOperatingExpenses,
    propertyManagement,
  } from '@axori/db';

  // Base schemas from Drizzle
  export const propertyInsertSchema = createInsertSchema(properties);
  export const propertySelectSchema = createSelectSchema(properties);

  export const propertyCharacteristicsInsertSchema = createInsertSchema(propertyCharacteristics);
  export const propertyCharacteristicsSelectSchema = createSelectSchema(propertyCharacteristics);

  // ... repeat for all normalized tables
  ```

- [ ] Create `packages/shared/src/validation/base/loans.ts`:
  ```typescript
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { loans } from '@axori/db';
  import { z } from 'zod';

  export const loanInsertSchema = createInsertSchema(loans, {
    // Enhance with custom validation
    interestRate: z.number().min(0).max(100), // API expects percentage
    originalLoanAmount: z.number().min(0),
    currentBalance: z.number().min(0),
  });

  export const loanSelectSchema = createSelectSchema(loans);
  ```

- [ ] Create `packages/shared/src/validation/base/expenses.ts`:
  ```typescript
  import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
  import { propertyExpenses } from '@axori/db';
  import { z } from 'zod';

  export const propertyExpenseInsertSchema = createInsertSchema(propertyExpenses, {
    amount: z.number().min(0),
    expenseDate: z.string().date(), // ISO date string
  });

  export const propertyExpenseSelectSchema = createSelectSchema(propertyExpenses);
  ```

- [ ] Update `packages/shared/src/validation/index.ts` to export base schemas

**Estimated Time:** 3 hours

---

### Phase 4: Create Enhanced Validation Schemas

**Tasks:**
- [ ] Create `packages/shared/src/validation/enhanced/loans.ts`:
  ```typescript
  import { loanInsertSchema } from '../base/loans';
  import { z } from 'zod';

  // API-specific enhancements
  export const loanInsertApiSchema = loanInsertSchema.extend({
    // Add API-specific fields (e.g., userId for authorization)
    userId: z.string().uuid(), // For authorization, not stored in loans table
  }).omit({
    // Remove fields that are auto-generated or not user-provided
    id: true,
    createdAt: true,
    updatedAt: true,
  });

  export const loanUpdateApiSchema = loanInsertApiSchema.partial();
  ```

- [ ] Create enhanced schemas for all entities with API-specific requirements
- [ ] Document which schemas are for API vs. internal use

**Estimated Time:** 4 hours

---

### Phase 5: Update API Routes

**Tasks:**
- [ ] Update `apps/api/src/routes/properties.ts`:
  - Replace manual Zod schema imports with base/enhanced schemas
  - Update validation calls to use new schemas
  - Test all endpoints

- [ ] Update `apps/api/src/routes/onboarding.ts`:
  - Ensure onboarding schemas work with new pattern

- [ ] Update any other API routes using manual schemas

**Estimated Time:** 4 hours

---

### Phase 6: Update Frontend Hooks

**Tasks:**
- [ ] Review `apps/web/src/hooks/api/useProperties.ts`
- [ ] Review `apps/web/src/hooks/api/useLoans.ts`
- [ ] Review `apps/web/src/hooks/api/useExpenses.ts`
- [ ] Ensure types align with new schemas
- [ ] Update any manual type definitions

**Estimated Time:** 2 hours

---

### Phase 7: Testing and Validation

**Tasks:**
- [ ] Test all API endpoints with new schemas
- [ ] Verify type safety throughout codebase
- [ ] Test enum values are correctly validated
- [ ] Test numeric/date conversions
- [ ] Update integration tests if needed
- [ ] Document any breaking changes

**Estimated Time:** 3 hours

---

### Phase 8: Cleanup

**Tasks:**
- [ ] Remove old manual Zod schemas from `normalized-property.ts`
- [ ] Update documentation
- [ ] Add migration notes to CHANGELOG
- [ ] Update `SCHEMA_ALIGNMENT_PATTERN.md` with lessons learned

**Estimated Time:** 1 hour

---

## Total Estimated Time

**~20 hours** (2.5 days)

## Risk Mitigation

1. **Breaking Changes**: Test thoroughly before removing old schemas
2. **Enum Migration**: May require data migration for existing records
3. **Type Mismatches**: Use TypeScript strict mode to catch issues early
4. **API Compatibility**: Ensure API contracts remain stable

## Success Criteria

- [ ] All Zod schemas are auto-generated from Drizzle
- [ ] No manual schema definitions remain (except enhancements)
- [ ] All API routes use new schemas
- [ ] All tests pass
- [ ] Type safety maintained throughout
- [ ] Documentation updated

## Notes

- Keep old schemas until migration is complete and tested
- Use feature flags if needed to gradually roll out
- Consider creating a migration script for enum data if needed

