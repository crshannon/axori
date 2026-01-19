# Add Property Wizard - Consolidation & Critical Fixes

**Created:** 2024-12-19  
**Status:** Complete  
**Related Plans:** add-property-wizard-finance-alignment-audit

## Overview

This document identifies:

1. **Critical Bug:** API route not saving calculated loan fields
2. **Consolidation Opportunities:** Shared utilities usage
3. **Seed Data Review:** Gaps in property wizard data collection

## Critical Bug Fix: Missing Loan Fields in API Route ⚠️

### Issue

The API route (`apps/api/src/routes/properties.ts`) was **not saving** the calculated loan fields that the wizard sends:

- ❌ `monthlyPrincipalInterest` - Not saved
- ❌ `totalMonthlyPayment` - Not saved
- ❌ `loanPosition` - Not saved
- ❌ `monthlyEscrow` - Not saved
- ❌ `monthlyPmi` - Not saved
- ❌ `paymentDueDay` - Not saved

**Impact:**

- Loans were created but missing payment data
- Finance components couldn't calculate debt service correctly
- P&I calculated in wizard wasn't being stored

### Fix

**Updated `apps/api/src/routes/properties.ts`:**

- Added all calculated payment fields to `loanDataForInsert`
- Convert numbers to strings for DB numeric columns
- Ensure all wizard-sent fields are saved

**Updated `packages/shared/src/validation/enhanced/loans.ts`:**

- Added `totalMonthlyPayment` to validation schema
- Added `paymentDueDay` to validation schema

### Result

✅ Loans now save with all calculated fields  
✅ Finance components receive complete loan data  
✅ P&I stored matches wizard calculation

## Consolidation: Shared Utilities

### ✅ Monthly P&I Calculation - CONSOLIDATED

**Before:**

- Duplicate `calculatePI()` in `AddPropertyWizard.tsx`
- Duplicate `calculateMonthlyPI()` in `usePropertyPersistence.ts`

**After:**

- Single shared utility: `calculateMonthlyPrincipalInterest()` in `apps/web/src/utils/finances/debt.ts`
- Both wizard locations use shared utility
- Ensures consistency across app

**Files Updated:**

- `apps/web/src/utils/finances/debt.ts` - Added shared function
- `apps/web/src/components/property-hub/add-property-wizard/AddPropertyWizard.tsx` - Uses shared utility
- `apps/web/src/components/property-hub/add-property-wizard/hooks/usePropertyPersistence.ts` - Uses shared utility

## Seed Data Review: Property Wizard Gaps

### Seed Data Structure (`packages/db/src/seed/data/properties.ts`)

**Sample Loan Data:**

```typescript
{
  loanType: "conventional",
  lenderName: "First National Bank",
  originalLoanAmount: "205000",
  interestRate: "0.065", // decimal
  termMonths: 360,
  currentBalance: "201500",
  monthlyPrincipalInterest: "1295", // ✅ Calculated
  monthlyEscrow: "500", // ✅ Escrow included
  totalMonthlyPayment: "1795", // ✅ Total payment
  startDate: "2023-06-15",
  maturityDate: "2053-06-15",
  status: "active",
  isPrimary: true,
  loanPosition: 1, // ✅ Position set
}
```

### Wizard Data Gaps (Compared to Seed)

**Currently Collected:**

- ✅ Loan type
- ✅ Lender name (provider)
- ✅ Loan amount
- ✅ Interest rate
- ✅ Loan term (years)

**Not Collected (But in Seed):**

- ❌ `startDate` - Loan start date (not collected, defaults null)
- ❌ `maturityDate` - Calculated from startDate + termMonths (not collected)
- ❌ `monthlyEscrow` - Escrow amount (not collected, defaults to 0)
- ❌ `servicerName` - Current servicer (not collected, defaults null)
- ❌ `loanNumber` - Loan account number (not collected, defaults null)

**Set Behind the Scenes (Good):**

- ✅ `status: 'active'`
- ✅ `isPrimary: true`
- ✅ `loanPosition: 1`
- ✅ `monthlyPrincipalInterest` - Calculated and stored
- ✅ `totalMonthlyPayment` - Calculated and stored
- ✅ `monthlyEscrow: 0` - Explicit default
- ✅ `monthlyPmi: 0` - Explicit default
- ✅ `paymentDueDay: 1` - Explicit default

### Recommendations

**Phase 1 (Current):** ✅ Complete

- All required fields collected
- All calculated fields stored
- All defaults explicitly set

**Phase 2 (Enhancement):** Optional

- Add `startDate` field to wizard (auto-calculate `maturityDate`)
- Add `monthlyEscrow` field (improves debt service accuracy)
- Add `loanNumber` field (for loan management)

## Files Modified

### Critical Fixes

1. **`apps/api/src/routes/properties.ts`**
   - Added missing loan fields to `loanDataForInsert`
   - Now saves: `monthlyPrincipalInterest`, `totalMonthlyPayment`, `loanPosition`, `monthlyEscrow`, `monthlyPmi`, `paymentDueDay`

2. **`packages/shared/src/validation/enhanced/loans.ts`**
   - Added `totalMonthlyPayment` to validation schema
   - Added `paymentDueDay` to validation schema

### Consolidation

3. **`apps/web/src/utils/finances/debt.ts`**
   - Added `calculateMonthlyPrincipalInterest()` shared utility

4. **`apps/web/src/components/property-hub/add-property-wizard/AddPropertyWizard.tsx`**
   - Now uses shared `calculateMonthlyPrincipalInterest()` utility

5. **`apps/web/src/components/property-hub/add-property-wizard/hooks/usePropertyPersistence.ts`**
   - Now uses shared `calculateMonthlyPrincipalInterest()` utility

## Validation

After fixes, verify:

- ✅ Loans save with all calculated fields (`monthlyPrincipalInterest`, `totalMonthlyPayment`)
- ✅ Finance page displays loan data correctly
- ✅ Debt service calculations use stored `totalMonthlyPayment`
- ✅ P&I calculation consistent across wizard and finance components
- ✅ Query invalidation refreshes finance page after loan save

## Summary

### Critical Bug (Fixed)

- **Issue:** API route wasn't saving calculated loan fields
- **Impact:** Loans missing payment data, finance page couldn't calculate debt service
- **Fix:** Added all missing fields to API route loan insertion

### Consolidation (Complete)

- **Issue:** Duplicate P&I calculation in wizard
- **Fix:** Consolidated to shared utility in `utils/finances/debt.ts`

### Seed Data Gaps (Documented)

- Wizard collects all required fields
- Optional fields (startDate, escrow, etc.) documented for Phase 2
- All defaults explicitly set for clarity

## Next Steps

1. ✅ **Test loan creation** - Verify loans save with all fields
2. ✅ **Verify finance page** - Loans should display immediately
3. ⏭️ **Phase 2 (Optional)** - Add optional fields if needed:
   - Loan start date (auto-calculate maturity)
   - Monthly escrow (improve debt service accuracy)
   - Loan number (for management)
