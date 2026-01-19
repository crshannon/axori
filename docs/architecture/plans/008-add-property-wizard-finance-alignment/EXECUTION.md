# Add Property Wizard - Finance Alignment Audit

**Created:** 2024-12-19  
**Updated:** 2024-12-19  
**Status:** Complete  
**Related Plans:** 007-tax-shield-calculations

## Overview

This audit reviews the Add Property Wizard's loan/financing data collection (Step 4) and ensures it aligns with:

1. Database schema requirements (`loans` table)
2. Finance page components expectations (`TaxShieldIntel`, `DebtLogic`, etc.)
3. Data mapping in `usePropertyPersistence.ts`
4. API route expectations (`apps/api/src/routes/properties.ts`)

## Issues Identified & Fixed

### 1. Loan Type Enum Mismatch ✅ FIXED

**Issue:**

- **Wizard:** Used display names: "Conventional", "FHA", "VA", "DSCR", "Hard Money"
- **Database Schema:** Expected enum values: `"conventional"`, `"fha"`, `"va"`, `"dscr"`, `"hard_money"` (lowercase, snake_case)

**Fix:**

- Updated `Step4Financing.tsx` to use database enum values with display names
- Added all enum options from schema

### 2. Interest Rate Format Conversion ✅ FIXED

**Issue:**

- **Wizard:** Stored as string percentage (e.g., `"6.5"`)
- **API (loanInsertApiSchema):** Expected number 0-100 (e.g., `6.5`)

**Fix:**

- Convert string to number in `usePropertyPersistence.ts`: `parseFloat(formData.interestRate)`
- API route handles conversion to decimal: `String(validated.interestRate / 100)`

### 3. Loan Term Conversion (Years → Months) ✅ FIXED

**Issue:**

- **Wizard:** Stored as years string (e.g., `"30"`)
- **Database:** Expected `termMonths` as integer (e.g., `360`)

**Fix:**

- Convert years to months in mapping: `parseInt(formData.loanTerm) * 12`

### 4. Missing Required Field: `currentBalance` ✅ FIXED

**Issue:**

- **Database Schema:** `currentBalance` is `.notNull()` (required)
- **Wizard:** Did not collect current balance

**Fix:**

- Default `currentBalance` to `originalLoanAmount` for new loans

### 5. Query Invalidation Issue ✅ FIXED

**Issue:**

- After saving loan data, the finance page wasn't refreshing
- `useUpdateProperty` hook only invalidated general queries, not the specific property query
- Finance components use `useProperty(propertyId)` which wasn't being invalidated

**Fix:**

- Updated `useUpdateProperty` hook to also invalidate specific property query: `['properties', variables.id]`
- This ensures `useProperty(propertyId)` refreshes after loan data is saved

### 6. Loan Data Validation ✅ IMPROVED

**Issue:**

- Loan creation condition only checked for truthy values
- Empty strings would pass validation but fail API validation

**Fix:**

- Enhanced validation to check for non-empty strings: `formData.loanAmount.trim()`
- Ensures all required fields have actual values before creating loan

## Database Schema Reference

From `packages/db/src/schema/index.ts`:

```typescript
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

export const loans = pgTable("loans", {
  loanType: loanTypeEnum("loan_type").notNull().default("conventional"),
  lenderName: text("lender_name").notNull(),
  originalLoanAmount: numeric("original_loan_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 5 }).notNull(), // Decimal: 0.06500
  termMonths: integer("term_months").notNull(), // Integer: 360
  currentBalance: numeric("current_balance", {
    precision: 12,
    scale: 2,
  }).notNull(), // Required!
  status: loanStatusEnum("status").notNull().default("active"),
  isPrimary: boolean("is_primary").default(true),
});
```

## Finance Components Expectations

### `DebtLogic.tsx`

- Expects `property.loans` array with active loans
- Filters: `property.loans?.filter((loan) => loan.status === 'active')`
- Uses:
  - `loan.interestRate` (decimal, converts to percentage: `Number(loan.interestRate) * 100`)
  - `loan.termMonths` (integer)
  - `loan.currentBalance` (numeric string)
  - `loan.monthlyPrincipalInterest` (optional, numeric string)
  - `loan.monthlyEscrow` (optional, numeric string)
  - `loan.totalMonthlyPayment` (optional, numeric string)

**Data Flow:**

1. Wizard saves loan → `usePropertyPersistence.saveProperty()`
2. Calls `useUpdateProperty.mutateAsync()` with loan data
3. API route creates loan in database
4. `useUpdateProperty` invalidates queries (including specific property)
5. `useProperty(propertyId)` refetches property with loans
6. `DebtLogic` displays active loans

## Implementation Summary

### Files Modified

1. **`apps/web/src/components/property-hub/add-property-wizard/steps/Step4Financing.tsx`**
   - Updated loan type options to use database enum values
   - Added all enum options with display names

2. **`apps/web/src/components/property-hub/add-property-wizard/hooks/usePropertyPersistence.ts`**
   - Fixed loan data mapping with proper conversions
   - Added `currentBalance` default
   - Improved validation (checks for empty strings)
   - Converts `interestRate` string to number
   - Converts `loanTerm` years to `termMonths`

3. **`apps/web/src/components/property-hub/add-property-wizard/types.ts`**
   - Added documentation comments about enum values and conversions

4. **`apps/web/src/hooks/api/useProperties.ts`**
   - Fixed query invalidation to include specific property query
   - Ensures finance page refreshes after loan data is saved

## Validation

After fixes, verify:

- ✅ Loan saves successfully via wizard
- ✅ Finance components display correct loan data
- ✅ Debt service calculations use correct loan amount
- ✅ Interest rate displays correctly (converted from decimal back to percentage)
- ✅ Loan term shows correctly (converted from months back to years in display)
- ✅ Finance page refreshes immediately after saving loan data

## Current Loan Data Mapping

```typescript
// Wizard form data (Step4Financing)
formData: {
  financeType: 'Cash' | 'Mortgage',
  loanType: string, // enum value: "conventional", "fha", etc.
  loanAmount: string, // e.g., "300000"
  interestRate: string, // percentage: "6.5"
  loanTerm: string, // years: "30"
  provider: string, // lender name
}

// Mapped to API format (usePropertyPersistence.ts)
loan: {
  loanType: "conventional", // enum value
  originalLoanAmount: 300000, // number (parseFloat)
  interestRate: 6.5, // number 0-100 (parseFloat)
  termMonths: 360, // integer (parseInt * 12)
  currentBalance: 300000, // number (defaults to originalLoanAmount)
  lenderName: "Chase Bank", // string
  status: "active",
  isPrimary: true,
}

// API converts to DB format
{
  loanType: "conventional", // enum
  originalLoanAmount: "300000", // string (DB numeric)
  interestRate: "0.06500", // string decimal (API: interestRate / 100)
  termMonths: 360, // integer
  currentBalance: "300000", // string (DB numeric)
  lenderName: "Chase Bank",
  status: "active",
  isPrimary: true,
}
```

## Notes

- **API route** (`apps/api/src/routes/properties.ts`) handles:
  - Converting interest rate percentage to decimal: `String(validated.interestRate / 100)`
  - Converting numbers to strings for DB numeric columns
  - Defaulting `status` to `"active"` and `isPrimary` to `true`
  - Marking old active loans as `"paid_off"` when adding new loan

- **Finance utilities** (`apps/web/src/utils/finances/debt.ts`) handle:
  - Converting DB decimal interest rate back to percentage: `parseFloat(primaryLoan.interestRate) * 100`
  - Filtering active loans
  - Using `totalMonthlyPayment` or calculating from P&I + Escrow

- **Query invalidation** ensures:
  - `useProperty(propertyId)` refetches after loan save
  - Finance components receive updated data immediately
  - No stale data displayed on finance page
