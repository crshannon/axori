# P&L Record Component Implementation - Execution Plan

**Plan Version:** 003  
**Created:** 2025-01-15  
**Status:** In Progress - Phases 1-2, 5 Complete

## Current State Analysis

### What Exists Now

- **`property_expenses` table**: Tracks expense transactions with fields:
  - `expenseDate`, `amount`, `category`, `subcategory`, `vendor`, `description`
  - `isRecurring`, `recurrenceFrequency`, `recurrenceEndDate`
  - `isTaxDeductible`, `taxCategory`
  - `documentId` (for document linking)
  - `source` (enum: manual, bank_sync, extracted, etc.)
  - `externalId` (for external system integration)
  - `createdBy`, `createdAt`, `updatedAt`

- **`property_rental_income` table**: Tracks expected/budgeted income (1:1 with property)
  - Monthly rent, other income sources
  - **Note**: This is for projections, not actual transaction history

- **Hooks**: `usePropertyExpenses`, `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`

- **PLRecord Component**: Placeholder with mock data, no real functionality

### Issues/Problems

1. **No Income Transactions Table**: We track expenses but not actual income transactions (rent received, etc.)
2. **Missing Review Workflow Fields**: No status field for pending/approved/flagged/excluded
3. **Missing Notes Field**: `property_expenses` doesn't have a `notes` field
4. **No Unified Query**: Need to combine income + expenses for P&L view
5. **TanStack Table Not Installed**: Need to add dependency
6. **No Transaction Drawer**: Need component for adding/editing transactions
7. **Component Uses Mock Data**: Not wired to real API

## Implementation Phases

### Phase 1: Schema Analysis & Extensions

**Goal:** Extend schema to support income transactions and review workflow

**Steps:**

1. [ ] Analyze current `property_expenses` schema
   - File: `packages/db/src/schema/index.ts`
   - Check: What fields exist, what's missing

2. [ ] Add missing fields to `property_expenses`:
   - `notes: text("notes")` - Generic notes field
   - `reviewStatus: pgEnum("review_status", ["pending", "approved", "flagged", "excluded"])` - Review workflow
   - `isExcluded: boolean("is_excluded").default(false)` - Exclude from calculations
   - `reviewedBy: uuid("reviewed_by").references(() => users.id)` - Who reviewed
   - `reviewedAt: timestamp("reviewed_at")` - When reviewed

3. [ ] Create `property_income_transactions` table:
   - Similar structure to `property_expenses`
   - Fields: `id`, `propertyId`, `incomeDate`, `amount`, `category`, `source`, `description`, `notes`, `reviewStatus`, `isExcluded`, `documentId`, `externalId`, `createdBy`, `createdAt`, `updatedAt`

4. [ ] Generate migration
   - Run: `npm run db:generate` in `packages/db`
   - Review migration file
   - Apply: `npm run db:migrate`

**Verification:**

- [ ] Migration runs successfully
- [ ] New fields appear in schema
- [ ] Types are generated correctly

### Phase 2: Dependencies & Setup

**Goal:** Install TanStack Table and create shared components

**Steps:**

1. [ ] Install TanStack Table

   ```bash
   cd apps/web
   npm install @tanstack/react-table
   ```

2. [ ] Create shared table components (if needed)
   - Check if we need generic table wrapper components
   - Consider: `Table`, `TableHeader`, `TableRow`, `TableCell` from design system

3. [ ] Review design system components
   - Check: `Button`, `Input`, `Select`, `Drawer`, `Typography`
   - Ensure we have all needed components

**Verification:**

- [ ] TanStack Table installed
- [ ] Can import and use in component
- [ ] Design system components available

### Phase 3: Base Schema & Types

**Goal:** Generate Zod schemas and types for new/updated tables

**Steps:**

1. [ ] Generate base schemas for `property_expenses` (updated)
   - File: `packages/shared/src/validation/base/expenses.ts`
   - Run: `drizzle-zod` generation (if needed)

2. [ ] Create base schema for `property_income_transactions`
   - File: `packages/shared/src/validation/base/income-transactions.ts`
   - Use `createInsertSchema` and `createSelectSchema`

3. [ ] Create enhanced schemas for API
   - File: `packages/shared/src/validation/enhanced/income-transactions.ts`
   - Handle numeric conversions, validation rules

4. [ ] Export types
   - File: `packages/shared/src/types/index.ts`
   - Export: `IncomeTransaction`, `IncomeTransactionInsert`, `IncomeTransactionInsertApi`, `IncomeTransactionUpdateApi`

**Verification:**

- [ ] Types compile without errors
- [ ] Schemas validate correctly
- [ ] API types match database types

### Phase 4: API Routes & Hooks

**Goal:** Create API routes and hooks for income transactions and unified queries

**Steps:**

1. [ ] Create income transaction API routes
   - File: `apps/api/src/routes/properties.ts`
   - Endpoints:
     - `GET /api/properties/:propertyId/income` - List income transactions
     - `POST /api/properties/:propertyId/income` - Create income transaction
     - `PUT /api/properties/:propertyId/income/:incomeId` - Update income transaction
     - `DELETE /api/properties/:propertyId/income/:incomeId` - Delete income transaction

2. [ ] Create unified transactions endpoint
   - Endpoint: `GET /api/properties/:propertyId/transactions`
   - Combines income + expenses
   - Supports filtering, sorting, pagination
   - Returns: `{ transactions: Array<Transaction>, total: number, page: number, pageSize: number }`

3. [ ] Create hooks for income transactions
   - File: `apps/web/src/hooks/api/useIncomeTransactions.ts`
   - Hooks: `usePropertyIncomeTransactions`, `useCreateIncomeTransaction`, `useUpdateIncomeTransaction`, `useDeleteIncomeTransaction`

4. [ ] Create unified transactions hook
   - File: `apps/web/src/hooks/api/useTransactions.ts`
   - Hook: `usePropertyTransactions(propertyId, filters, pagination)`

5. [ ] Update expense hooks to support new fields
   - File: `apps/web/src/hooks/api/useExpenses.ts`
   - Add support for `notes`, `reviewStatus`, `isExcluded`

**Verification:**

- [ ] API routes respond correctly
- [ ] Hooks fetch data successfully
- [ ] Unified query returns combined results
- [ ] Filtering and pagination work

### Phase 5: PLRecord Component with TanStack Table

**Goal:** Build main component with TanStack Table integration

**Steps:**

1. [ ] Set up TanStack Table in PLRecord
   - File: `apps/web/src/components/property-hub/property-details/financials/PLRecord.tsx`
   - Define columns: Date, Payee/Vendor, Description, Category, Source, Amount, Status, Actions
   - Configure sorting, filtering, pagination

2. [ ] Wire up to real data
   - Use `usePropertyTransactions` hook
   - Handle loading and error states

3. [ ] Implement filtering UI
   - Date range picker
   - Category filter
   - Source filter
   - Status filter (pending/approved/flagged/excluded)
   - Search input (payee, description, notes)

4. [ ] Implement sorting
   - Column-based sorting
   - Default sort by date (newest first)

5. [ ] Implement pagination
   - Server-side pagination
   - Page size selector
   - Page navigation

6. [ ] Add refresh button
   - Manual refresh functionality
   - Loading indicator during refresh

7. [ ] Style with design system
   - Use `Typography`, `Button`, `Input`, `Select` from `@axori/ui`
   - Follow design system patterns
   - Support dark mode

**Verification:**

- [ ] Table displays transactions correctly
- [ ] Filtering works
- [ ] Sorting works
- [ ] Pagination works
- [ ] Refresh button works
- [ ] Design matches design system

### Phase 6: Transaction Drawer

**Goal:** Create drawer for adding/editing transactions

**Steps:**

1. [ ] Create `TransactionDrawer` component
   - File: `apps/web/src/components/drawers/TransactionDrawer.tsx`
   - Support both income and expense transactions
   - Use `Drawer` from `@axori/ui`

2. [ ] Form fields:
   - Transaction type (income/expense) - if unified
   - Date picker
   - Amount
   - Category (with subcategory)
   - Vendor/Payee
   - Description
   - Notes
   - Source
   - Tax category (for expenses)
   - Document link
   - Review status

3. [ ] Form validation
   - Use enhanced Zod schemas
   - Show validation errors

4. [ ] Submit handlers
   - Create: `useCreateExpense` or `useCreateIncomeTransaction`
   - Update: `useUpdateExpense` or `useUpdateIncomeTransaction`
   - Handle success/error states

5. [ ] Integrate with PLRecord
   - Open drawer from "Add Transaction" button
   - Open drawer from row actions (edit)
   - Close drawer on success

**Verification:**

- [ ] Drawer opens/closes correctly
- [ ] Form validation works
- [ ] Create transaction works
- [ ] Update transaction works
- [ ] UI matches design system

### Phase 7: Advanced Features

**Goal:** Add review workflow, document linking, and exclusion

**Steps:**

1. [ ] Review workflow UI
   - Status badges in table
   - Quick actions: Approve, Flag, Exclude
   - Bulk actions (if needed)

2. [ ] Document linking
   - Display document icon if linked
   - Link to document viewer (if exists)
   - Add document link in drawer

3. [ ] Exclusion functionality
   - Visual indicator for excluded transactions (muted style)
   - Toggle exclude in drawer or quick actions
   - Excluded transactions don't count in totals

4. [ ] Notes display
   - Show notes in table (expandable or tooltip)
   - Edit notes in drawer

5. [ ] Export functionality
   - Export button (CSV/Excel)
   - Include filtered data
   - Include all columns

**Verification:**

- [ ] Review workflow works
- [ ] Document linking works
- [ ] Exclusion works and affects totals
- [ ] Notes display/edit works
- [ ] Export works

### Phase 8: Integration & Testing

**Goal:** Final integration, testing, and polish

**Steps:**

1. [ ] Test all features end-to-end
   - Create income transaction
   - Create expense transaction
   - Edit transaction
   - Delete transaction
   - Filter transactions
   - Sort transactions
   - Paginate transactions
   - Review workflow
   - Document linking
   - Exclusion

2. [ ] Test edge cases
   - Empty state
   - Loading state
   - Error state
   - Large datasets
   - Invalid data

3. [ ] Performance testing
   - Large number of transactions
   - Filtering performance
   - Pagination performance

4. [ ] Design system compliance
   - All components use design system
   - Dark mode works
   - Responsive design works

5. [ ] Documentation
   - Update component documentation
   - Add JSDoc comments

**Verification:**

- [ ] All tests pass
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Design system compliant
- [ ] Documentation complete

## File Changes Summary

### New Files

- `docs/architecture/plans/003-pl-record-implementation/SUMMARY.md` - Plan summary
- `docs/architecture/plans/003-pl-record-implementation/EXECUTION.md` - This file
- `packages/shared/src/validation/base/income-transactions.ts` - Base Zod schemas
- `packages/shared/src/validation/enhanced/income-transactions.ts` - Enhanced Zod schemas
- `apps/web/src/hooks/api/useIncomeTransactions.ts` - Income transaction hooks
- `apps/web/src/hooks/api/useTransactions.ts` - Unified transaction hooks
- `apps/web/src/components/drawers/TransactionDrawer.tsx` - Transaction drawer component

### Modified Files

- `packages/db/src/schema/index.ts` - Add fields to `property_expenses`, create `property_income_transactions` table
- `packages/shared/src/validation/base/expenses.ts` - Update with new fields
- `packages/shared/src/validation/enhanced/expenses.ts` - Update with new fields
- `packages/shared/src/types/index.ts` - Export new types
- `apps/api/src/routes/properties.ts` - Add income transaction endpoints, unified transactions endpoint
- `apps/web/src/hooks/api/useExpenses.ts` - Update to support new fields
- `apps/web/src/components/property-hub/property-details/financials/PLRecord.tsx` - Complete rewrite with TanStack Table

### Deleted Files

- None

## Testing Strategy

### Unit Tests

- [ ] Test Zod schemas validation
- [ ] Test API route handlers
- [ ] Test hook functions

### Integration Tests

- [ ] Test API endpoints with real database
- [ ] Test hooks with API
- [ ] Test component with hooks

### Manual Testing

- [ ] Create income transaction
- [ ] Create expense transaction
- [ ] Edit transaction
- [ ] Delete transaction
- [ ] Filter by date range
- [ ] Filter by category
- [ ] Filter by status
- [ ] Sort by different columns
- [ ] Paginate through results
- [ ] Review workflow (approve, flag, exclude)
- [ ] Link document
- [ ] Export data
- [ ] Test with large dataset

## Rollback Plan

If something goes wrong:

1. **Schema Changes**: Revert migration if needed
2. **Component Changes**: Git revert to previous version
3. **API Changes**: Keep old endpoints until new ones are verified
4. **Dependencies**: Remove TanStack Table if issues arise

## Dependencies

- `@tanstack/react-table` - Table library
- Existing: `@axori/ui`, `@axori/shared`, `@axori/db`
- Existing: `@tanstack/react-query` for data fetching

## Risks and Mitigation

- **Risk 1:** Schema changes break existing expense data
  - **Mitigation:** Migration includes default values, test on staging first

- **Risk 2:** TanStack Table adds bundle size
  - **Mitigation:** Tree-shaking should minimize impact, monitor bundle size

- **Risk 3:** Unified query performance with large datasets
  - **Mitigation:** Implement proper pagination, add database indexes

- **Risk 4:** Missing income transaction data
  - **Mitigation:** Start with expenses only, add income transactions gradually

## Timeline Estimate

- Phase 1: 2-3 hours (Schema analysis & extensions)
- Phase 2: 1 hour (Dependencies & setup)
- Phase 3: 2 hours (Base schema & types)
- Phase 4: 4-5 hours (API routes & hooks)
- Phase 5: 6-8 hours (PLRecord component)
- Phase 6: 4-5 hours (Transaction drawer)
- Phase 7: 3-4 hours (Advanced features)
- Phase 8: 2-3 hours (Integration & testing)
- **Total: 24-33 hours**
