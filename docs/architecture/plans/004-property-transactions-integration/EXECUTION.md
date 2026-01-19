# Property Transactions Integration - Execution Plan

**Plan Version:** 004  
**Created:** 2025-01-16  
**Status:** Planning

## Current State Analysis

### What Exists Now

- **Schema**: Unified `property_transactions` table created with:
  - `type` enum (income, expense, capital)
  - `transactionDate`, `amount`, `category`, `subcategory`
  - `vendor` (for expenses), `payer` (for income)
  - Review workflow fields (`reviewStatus`, `isExcluded`, `notes`, etc.)
  - Document linking (`documentId`)
  - Source tracking (`source`, `externalId`)

- **Types**: `PropertyTransaction` and `PropertyTransactionInsert` types exported from `@axori/db/types`

- **Component**: PLRecord component built with TanStack Table but currently uses legacy `usePropertyExpenses` hook

- **Legacy System**: Old `property_expenses` table and hooks still exist but should be replaced

### Issues/Problems

1. **No Zod Schemas**: Need to generate validation schemas for `property_transactions`
2. **No API Routes**: Need unified transaction endpoints
3. **No Hooks**: Need React Query hooks for transaction operations
4. **Component Mismatch**: PLRecord uses old expense hooks instead of transaction hooks
5. **Migration Needed**: Need to migrate from expense system to transaction system

## Implementation Phases

### Phase 1: Zod Schema Generation

**Goal:** Generate base and enhanced Zod schemas for `property_transactions` following Drizzle-Zod workflow

**Steps:**

1. [ ] Create base schema file
   - File: `packages/shared/src/validation/base/transactions.ts`
   - Use `createInsertSchema()` and `createSelectSchema()` from `drizzle-zod`
   - Import `propertyTransactions` from `@axori/db/src/schema`
   - Example:
     ```typescript
     import { createInsertSchema, createSelectSchema } from "drizzle-zod";
     import { propertyTransactions } from "@axori/db/src/schema";
     
     export const propertyTransactionInsertSchema = createInsertSchema(propertyTransactions);
     export const propertyTransactionSelectSchema = createSelectSchema(propertyTransactions);
     ```

2. [ ] Create enhanced schema file
   - File: `packages/shared/src/validation/enhanced/transactions.ts`
   - Extend base schema with API-specific validation
   - Override numeric fields (string → number) for API
   - Add custom validation rules
   - Create update schema using `.partial()`
   - Example:
     ```typescript
     import { propertyTransactionInsertSchema } from "../base/transactions";
     import { z } from "zod";
     
     export const propertyTransactionInsertApiSchema = propertyTransactionInsertSchema
       .extend({
         amount: z.number().positive("Amount must be positive"),
         transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
         // Add validation for type-specific fields
       })
       .refine((data) => {
         // If expense, vendor should be provided
         if (data.type === "expense" && !data.vendor) {
           return false;
         }
         // If income, payer should be provided
         if (data.type === "income" && !data.payer) {
           return false;
         }
         return true;
       }, {
         message: "Vendor required for expenses, payer required for income"
       });
     
     export const propertyTransactionUpdateApiSchema = propertyTransactionInsertApiSchema
       .partial()
       .extend({
         id: z.string().uuid("Transaction ID must be a valid UUID"),
       });
     ```

3. [ ] Export types from shared types
   - File: `packages/shared/src/types/index.ts`
   - Add `PropertyTransactionInsertApi` and `PropertyTransactionUpdateApi` types
   - Example:
     ```typescript
     import type { z as zod } from "zod";
     import {
       propertyTransactionInsertApiSchema,
       propertyTransactionUpdateApiSchema,
     } from "../validation";
     
     export type PropertyTransactionInsertApi = zod.infer<typeof propertyTransactionInsertApiSchema>;
     export type PropertyTransactionUpdateApi = zod.infer<typeof propertyTransactionUpdateApiSchema>;
     ```

4. [ ] Export schemas from validation index
   - File: `packages/shared/src/validation/index.ts`
   - Export base and enhanced transaction schemas

**Verification:**
- [ ] Base schemas compile without errors
- [ ] Enhanced schemas validate correctly
- [ ] Types are exported and accessible
- [ ] Can import schemas in API routes

### Phase 2: API Routes

**Goal:** Create unified transaction endpoints with proper validation and authorization

**Steps:**

1. [ ] Update properties API route
   - File: `apps/api/src/routes/properties.ts`
   - Add transaction endpoints:
     - `GET /api/properties/:propertyId/transactions` - List all transactions (with filtering)
     - `POST /api/properties/:propertyId/transactions` - Create transaction
     - `GET /api/properties/:propertyId/transactions/:transactionId` - Get single transaction
     - `PUT /api/properties/:propertyId/transactions/:transactionId` - Update transaction
     - `DELETE /api/properties/:propertyId/transactions/:transactionId` - Delete transaction

2. [ ] Implement GET /transactions endpoint
   - Query parameters: `startDate`, `endDate`, `type`, `category`, `reviewStatus`, `page`, `pageSize`
   - Use enhanced select schema for validation
   - Return paginated results
   - Example:
     ```typescript
     app.get("/properties/:propertyId/transactions", async (c) => {
       const { propertyId } = c.req.param();
       const { startDate, endDate, type, category, reviewStatus, page = "1", pageSize = "20" } = c.req.query();
       
       // Validate property access
       // Build query with filters
       // Return paginated results
     });
     ```

3. [ ] Implement POST /transactions endpoint
   - Use `propertyTransactionInsertApiSchema` for validation
   - Set `createdBy` from authenticated user
   - Handle type-specific field validation
   - Example:
     ```typescript
     app.post("/properties/:propertyId/transactions", async (c) => {
       const { propertyId } = c.req.param();
       const body = await c.req.json();
       
       const validated = propertyTransactionInsertApiSchema.parse(body);
       // Insert into database
       // Return created transaction
     });
     ```

4. [ ] Implement PUT /transactions/:transactionId endpoint
   - Use `propertyTransactionUpdateApiSchema` for validation
   - Update `updatedAt` timestamp
   - Validate transaction belongs to property

5. [ ] Implement DELETE /transactions/:transactionId endpoint
   - Soft delete or hard delete (decide based on requirements)
   - Validate ownership

**Verification:**
- [ ] All endpoints respond correctly
- [ ] Validation works (test invalid data)
- [ ] Authorization works (test unauthorized access)
- [ ] Pagination works
- [ ] Filtering works

### Phase 3: React Query Hooks

**Goal:** Create type-safe React Query hooks for transaction operations

**Steps:**

1. [ ] Create transaction hooks file
   - File: `apps/web/src/hooks/api/useTransactions.ts`
   - Follow pattern from `useExpenses.ts`

2. [ ] Implement `usePropertyTransactions` hook
   - Query key: `['properties', propertyId, 'transactions', filters]`
   - Fetch from `/api/properties/:propertyId/transactions`
   - Support filtering options
   - Return `Array<PropertyTransaction>`
   - Example:
     ```typescript
     export function usePropertyTransactions(
       propertyId: string | null | undefined,
       options?: {
         startDate?: string;
         endDate?: string;
         type?: 'income' | 'expense' | 'capital';
         category?: string;
         reviewStatus?: string;
         page?: number;
         pageSize?: number;
       }
     ) {
       // Implementation
     }
     ```

3. [ ] Implement `usePropertyTransaction` hook
   - Get single transaction by ID
   - Query key: `['properties', propertyId, 'transactions', transactionId]`

4. [ ] Implement `useCreateTransaction` hook
   - Use `PropertyTransactionInsertApi` type
   - Mutation function calls POST endpoint
   - Invalidates transaction queries on success

5. [ ] Implement `useUpdateTransaction` hook
   - Use `PropertyTransactionUpdateApi` type
   - Mutation function calls PUT endpoint
   - Invalidates transaction queries on success

6. [ ] Implement `useDeleteTransaction` hook
   - Mutation function calls DELETE endpoint
   - Invalidates transaction queries on success

**Verification:**
- [ ] Hooks compile without errors
- [ ] Can fetch transactions
- [ ] Can create transaction
- [ ] Can update transaction
- [ ] Can delete transaction
- [ ] Query invalidation works

### Phase 4: Component Integration

**Goal:** Update PLRecord component to use new transaction hooks

**Steps:**

1. [ ] Update PLRecord component imports
   - File: `apps/web/src/components/property-hub/property-details/financials/PLRecord.tsx`
   - Replace `usePropertyExpenses` with `usePropertyTransactions`
   - Update type imports to use `PropertyTransaction`

2. [ ] Update transaction transformation
   - Transform `PropertyTransaction` to `TransactionRow` format
   - Handle `type` field (income, expense, capital)
   - Map `vendor`/`payer` to `payee` field
   - Map `transactionDate` to `date`

3. [ ] Update column definitions
   - Ensure columns work with new transaction structure
   - Update category display (unified categories)
   - Update type indicators (income vs expense vs capital)

4. [ ] Add transaction type filter
   - Add filter dropdown for transaction type
   - Update query to include type filter

5. [ ] Test component
   - Verify transactions display correctly
   - Verify filtering works
   - Verify sorting works
   - Verify pagination works

**Verification:**
- [ ] Component displays transactions correctly
- [ ] All transaction types show (income, expense, capital)
- [ ] Filtering works
- [ ] No TypeScript errors
- [ ] No runtime errors

### Phase 5: Migration & Testing

**Goal:** Test end-to-end and handle migration from legacy system

**Steps:**

1. [ ] Generate database migration
   - Run: `pnpm --filter @axori/db db:generate`
   - Review migration file
   - Check for any issues

2. [ ] Apply migration
   - Run: `pnpm --filter @axori/db db:migrate`
   - Verify table created correctly
   - Verify indexes created

3. [ ] Test API endpoints
   - Create income transaction
   - Create expense transaction
   - Create capital transaction
   - Update transaction
   - Delete transaction
   - Filter transactions
   - Paginate transactions

4. [ ] Test frontend hooks
   - Fetch transactions
   - Create transaction
   - Update transaction
   - Delete transaction

5. [ ] Test PLRecord component
   - Display all transaction types
   - Filter by type
   - Filter by category
   - Sort columns
   - Paginate results
   - Search functionality

6. [ ] Remove legacy code (if ready)
   - Remove `property_expenses` references from API
   - Remove `useExpenses` hooks (or mark as deprecated)
   - Update any remaining references

**Verification:**
- [ ] Migration applied successfully
- [ ] All API endpoints work
- [ ] All hooks work
- [ ] Component works end-to-end
- [ ] No legacy code references remain

## File Changes Summary

### New Files

- `packages/shared/src/validation/base/transactions.ts` - Base Zod schemas
- `packages/shared/src/validation/enhanced/transactions.ts` - Enhanced API schemas
- `apps/web/src/hooks/api/useTransactions.ts` - Transaction hooks

### Modified Files

- `packages/shared/src/types/index.ts` - Add transaction API types
- `packages/shared/src/validation/index.ts` - Export transaction schemas
- `apps/api/src/routes/properties.ts` - Add transaction endpoints
- `apps/web/src/components/property-hub/property-details/financials/PLRecord.tsx` - Use new hooks

### Deleted Files

- None (legacy code removal is optional in Phase 5)

## Testing Strategy

### Unit Tests

- [ ] Test Zod schema validation
- [ ] Test API route handlers
- [ ] Test hook functions

### Integration Tests

- [ ] Test API endpoints with real database
- [ ] Test hooks with API
- [ ] Test component with hooks

### Manual Testing

- [ ] Create income transaction
- [ ] Create expense transaction
- [ ] Create capital transaction
- [ ] Update transaction
- [ ] Delete transaction
- [ ] Filter by type
- [ ] Filter by category
- [ ] Filter by date range
- [ ] Sort by different columns
- [ ] Paginate results
- [ ] Search transactions

## Rollback Plan

If something goes wrong:

1. **Schema Issues**: Revert migration if needed
2. **API Issues**: Keep old endpoints until new ones are verified
3. **Component Issues**: Revert to using `usePropertyExpenses` temporarily
4. **Type Issues**: Use type assertions as temporary workaround

## Dependencies

- `drizzle-zod` - Schema generation
- `@tanstack/react-query` - Data fetching
- `zod` - Validation
- Existing: `@axori/db`, `@axori/shared`, `@axori/ui`

## Risks and Mitigation

- **Risk 1:** Schema validation too strict
  - **Mitigation:** Start with lenient validation, tighten as needed

- **Risk 2:** Migration breaks existing data
  - **Mitigation:** Test migration on staging first, backup database

- **Risk 3:** Performance issues with large transaction sets
  - **Mitigation:** Implement proper pagination, add database indexes

- **Risk 4:** Type mismatches between API and frontend
  - **Mitigation:** Use shared types, test type inference

## Timeline Estimate

- Phase 1: 2-3 hours (Zod schema generation)
- Phase 2: 4-5 hours (API routes)
- Phase 3: 3-4 hours (React Query hooks)
- Phase 4: 2-3 hours (Component integration)
- Phase 5: 2-3 hours (Migration & testing)
- **Total: 13-18 hours**

