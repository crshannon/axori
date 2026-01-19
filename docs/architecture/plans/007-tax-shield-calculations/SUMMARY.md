# Tax Shield Calculations - Summary

**Plan Version:** 007  
**Created:** 2024-12-19  
**Status:** Complete

## What We Aimed to Accomplish

Replace placeholder values in `TaxShieldIntel` component with real calculations for unclaimed depreciation and cost segregation potential based on actual property data (purchase date, depreciation basis, property type). Additionally, refactor financial calculation utilities into a shared `finances` folder structure for reuse across hooks.

## Why This Was Needed

The `TaxShieldIntel` component was using hardcoded placeholder values (`unclaimedDepreciation = 42100`, `costSegPotential = 'High Alpha'`, `costSegPercentage = 85`) instead of calculating these metrics from actual property data. Additionally, financial calculation logic was duplicated across multiple hooks (`useFinancialPulse`, `useOperatingCore`, `useMonthlyMetrics`, `useDailyMetrics`), leading to code duplication and potential inconsistencies.

## Key Goals

- Calculate unclaimed depreciation based on property purchase date, depreciation basis, and property type (residential vs commercial)
- Calculate cost segregation potential as a percentage of depreciation basis
- Determine cost segregation potential level ("High Alpha", "Medium", "Low") based on calculated percentage
- Create a reusable calculation utility structure (`apps/web/src/utils/finances/`)
- Refactor hooks to use shared calculation utilities, eliminating code duplication
- Ensure calculations handle edge cases (missing data, null values, future dates)

## Expected Outcome

The `TaxShieldIntel` component now displays accurate, property-specific calculations for:

- **Unclaimed Depreciation**: The amount of depreciation that could have been claimed but hasn't been (based on purchase date, basis, and property type)
- **Cost Segregation Potential**: A percentage and level indicator showing how much of the basis could be accelerated through cost segregation studies

Additionally, a shared `finances` utilities folder structure was created with reusable calculation functions used across all financial hooks:

- `income.ts` - Gross income calculations
- `expenses.ts` - Fixed expenses and management fee calculations
- `noi.ts` - NOI (Net Operating Income) and CapEx reserve calculations
- `debt.ts` - Debt service and interest rate calculations
- `taxShield.ts` - Tax shield (depreciation, cost seg) calculations

## Main Phases

1. **Phase 1: Analysis & Planning** - Review current data structure, identify calculation requirements ✅
2. **Phase 2: Calculation Utilities** - Create reusable utility functions for depreciation and cost seg calculations ✅
3. **Phase 3: Component Integration** - Integrate calculations into `TaxShieldIntel` component ✅
4. **Phase 4: Financial Utilities Refactoring** - Extract shared calculation logic from hooks into `finances` folder structure ✅
5. **Phase 5: Hook Refactoring** - Update `useFinancialPulse`, `useOperatingCore`, `useMonthlyMetrics`, and `useDailyMetrics` to use shared utilities ✅

## Implementation Summary

### Tax Shield Calculations

- Created `apps/web/src/utils/finances/taxShield.ts` with:
  - `getDepreciationSchedule()` - Determines 27.5 or 39-year schedule based on property type
  - `calculateUnclaimedDepreciation()` - Calculates unclaimed depreciation from purchase date to current
  - `calculateCostSegPotential()` - Calculates cost segregation percentage and level
- Updated `TaxShieldIntel.tsx` to use calculated values instead of placeholders

### Financial Utilities Refactoring

- Created shared calculation utilities in `apps/web/src/utils/finances/`:
  - `income.ts` - Income calculation utilities (from structured data and transactions)
  - `expenses.ts` - Expense calculation utilities (structured expenses, management fees, recurring transactions)
  - `noi.ts` - NOI, CapEx reserve, and cash flow calculations
  - `debt.ts` - Debt service and interest rate calculations
  - `index.ts` - Central export point for all utilities
- Refactored all financial hooks to use shared utilities:
  - `useFinancialPulse` - Now uses shared income, expense, NOI, debt utilities
  - `useOperatingCore` - Now uses shared income, NOI, CapEx utilities
  - `useMonthlyMetrics` - Now uses shared income, expense, NOI, debt utilities
  - `useDailyMetrics` - Now uses shared income, expense, NOI, debt utilities

## Benefits Achieved

- **Single Source of Truth**: All financial calculations are now centralized in shared utilities
- **Code Reusability**: Eliminated ~300+ lines of duplicate calculation logic
- **Consistency**: All hooks use the same calculation methods, ensuring consistent results
- **Maintainability**: Updates to calculation logic only need to be made in one place
- **Type Safety**: Consistent TypeScript types across all calculation utilities

## Related Plans

- Related to property financial metrics calculations
- May reference property transaction data in future enhancements
- Foundation for future financial calculation features

## Notes

- Residential properties use 27.5-year depreciation schedule
- Commercial properties use 39-year depreciation schedule
- Cost segregation typically allows 20-40% of basis to be accelerated
- All utilities handle cases where purchase date or depreciation basis is missing
- Type definitions match database schema (support `null` values where appropriate)
