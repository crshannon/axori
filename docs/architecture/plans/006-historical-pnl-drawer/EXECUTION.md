# Historical P&L Registry Drawer - Execution Plan

**Plan Version:** 006  
**Created:** 2026-01-16  
**Status:** In Progress

## Current State Analysis

### What Exists Now

- `PropertyTransactions` component displays transactions in a table
- `propertyTransactions` database table with full schema
- Transaction category enum defined in schema
- Existing drawer patterns (`OperatingExpensesDrawer`, `AddLoanDrawer`)
- API route structure in `apps/api/src/routes/properties.ts`
- Transaction hooks in `apps/web/src/hooks/api/useTransactions.ts`

### Issues/Problems

- No way to manually add transactions to the registry
- Users must rely on automated imports or direct database access
- Missing validation schema for transaction creation
- No API endpoint for creating transactions

## Implementation Phases

### Phase 1: Validation Schema

**Goal:** Create Zod validation schema for transaction creation

**Steps:**
1. [ ] Add transaction insert schema to `packages/shared/src/validation/index.ts`
   - File: `packages/shared/src/validation/index.ts`
   - Create `propertyTransactionInsertSchema` (if not exists)
   - Include all required fields: `type`, `transactionDate`, `amount`, `category`, `propertyId`
   - Include optional fields: `subcategory`, `vendor`, `payer`, `description`, `notes`, `taxCategory`, `isTaxDeductible`, `isRecurring`
   - Use enum validation for `type` and `category`
   - Validate `amount` as positive number
   - Validate `transactionDate` as date string

**Verification:**
- [ ] Schema exports correctly
- [ ] Type inference works
- [ ] Validation errors are clear

### Phase 2: API Endpoint

**Goal:** Add POST endpoint for creating property transactions

**Steps:**
1. [ ] Add POST route to `apps/api/src/routes/properties.ts`
   - File: `apps/api/src/routes/properties.ts`
   - Route: `POST /api/properties/:propertyId/transactions`
   - Validate request body with `propertyTransactionInsertApiSchema`
   - Get `userId` from auth header (Clerk)
   - Insert transaction with `createdBy` set to `userId`
   - Set `source` to `"manual"` by default
   - Set `reviewStatus` to `"pending"` by default
   - Return created transaction

**Verification:**
- [ ] Endpoint accepts valid transaction data
- [ ] Returns 201 with created transaction
- [ ] Returns 400 for invalid data
- [ ] Returns 401 for unauthenticated requests
- [ ] Transaction appears in database

### Phase 3: Drawer Component

**Goal:** Build drawer component with form fields

**Steps:**
1. [ ] Create `AddTransactionDrawer.tsx` component
   - File: `apps/web/src/components/drawers/AddTransactionDrawer.tsx`
   - Use `Drawer` component from `@axori/ui`
   - Use `DrawerSectionTitle` for section headers
   - Form fields:
     - Transaction Type (Select: income, expense, capital)
     - Date (Input: date)
     - Amount (Input: number, required)
     - Category (Select: from enum, required)
     - Subcategory (Input: text, optional)
     - Vendor/Payer (Input: text, conditional based on type)
     - Description (Textarea: optional)
     - Notes (Textarea: optional)
     - Tax Category (Input: text, optional)
     - Is Tax Deductible (Checkbox: default true for expenses)
     - Is Recurring (Checkbox: optional)
   - Form validation with error messages
   - Submit button with loading state
   - Success/error handling

2. [ ] Export drawer from `apps/web/src/components/drawers/index.ts`
   - File: `apps/web/src/components/drawers/index.ts`
   - Add export for `AddTransactionDrawer`

**Verification:**
- [ ] Drawer opens and closes correctly
- [ ] Form fields render properly
- [ ] Validation works for required fields
- [ ] Conditional fields show/hide based on type
- [ ] Submit creates transaction via API

### Phase 4: Integration

**Goal:** Wire up drawer to PropertyTransactions component and financials page

**Steps:**
1. [ ] Add "Add Transaction" button to `PropertyTransactions` component
   - File: `apps/web/src/components/property-hub/property-details/financials/PropertyTransactions.tsx`
   - Add button in header section (next to "Export Ledger")
   - Button opens drawer via URL search param

2. [ ] Add drawer to financials page
   - File: `apps/web/src/routes/_authed/property-hub.$propertyId/financials.tsx`
   - Import `AddTransactionDrawer`
   - Add drawer component with `isOpen` based on search param
   - Handle `onClose` to remove search param
   - Handle `onSuccess` to refresh transactions

3. [ ] Create API hook for creating transactions
   - File: `apps/web/src/hooks/api/useTransactions.ts`
   - Add `useCreateTransaction` hook
   - Use `useMutation` from TanStack Query
   - Invalidate transactions query on success

**Verification:**
- [ ] Button appears in PropertyTransactions header
- [ ] Clicking button opens drawer
- [ ] Submitting transaction refreshes list
- [ ] New transaction appears in table
- [ ] Drawer closes after successful submission

## File Changes Summary

### New Files
- `apps/web/src/components/drawers/AddTransactionDrawer.tsx` - Main drawer component
- `docs/architecture/plans/006-historical-pnl-drawer/SUMMARY.md` - Plan summary
- `docs/architecture/plans/006-historical-pnl-drawer/EXECUTION.md` - This file

### Modified Files
- `packages/shared/src/validation/index.ts` - Add transaction insert schema
- `apps/api/src/routes/properties.ts` - Add POST endpoint for transactions
- `apps/web/src/components/drawers/index.ts` - Export new drawer
- `apps/web/src/components/property-hub/property-details/financials/PropertyTransactions.tsx` - Add button
- `apps/web/src/routes/_authed/property-hub.$propertyId/financials.tsx` - Add drawer
- `apps/web/src/hooks/api/useTransactions.ts` - Add create hook

## Testing Strategy

### Unit Tests
- [ ] Validation schema tests (if test suite exists)

### Integration Tests
- [ ] API endpoint creates transaction correctly
- [ ] Drawer submits and refreshes data

### Manual Testing
- [ ] Open drawer from PropertyTransactions component
- [ ] Fill out form with valid data
- [ ] Submit and verify transaction appears in table
- [ ] Test validation errors for required fields
- [ ] Test conditional fields (vendor/payer based on type)
- [ ] Test error handling (network errors, validation errors)

## Rollback Plan

If something goes wrong:

1. Remove drawer component and exports
2. Remove API endpoint
3. Remove button from PropertyTransactions
4. Remove validation schema (if not used elsewhere)

## Dependencies

- `@axori/ui` - Drawer, Input, Select, Button components
- `@axori/shared` - Validation schemas
- TanStack Query - Data fetching and mutations
- Existing transaction hooks and API structure

## Risks and Mitigation

- **Risk 1:** Validation schema conflicts with existing schemas
  - **Mitigation:** Check for existing transaction schemas first, extend if needed

- **Risk 2:** API endpoint conflicts with existing routes
  - **Mitigation:** Check existing routes, use unique path pattern

- **Risk 3:** Form complexity may be overwhelming
  - **Mitigation:** Start with essential fields, add advanced fields later

## Timeline Estimate

- Phase 1: 30 minutes
- Phase 2: 45 minutes
- Phase 3: 2 hours
- Phase 4: 1 hour
- Total: ~4 hours

