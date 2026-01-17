# OperatingCore Component Audit

**Date**: 2026-01-16  
**Status**: Completed

## Audit Summary

Audited the `OperatingCore` component and related hooks (`useOperatingCore`, `useFinancialPulse`) against the full-stack architecture checklist to ensure correct data points and calculations.

## Issues Found

### 1. Missing Use of Structured Data Sources

**Problem**: `useOperatingCore` only uses `propertyTransactions` for calculations, but the schema provides dedicated tables:

- `propertyRentalIncome` - Contains `monthlyRent`, `marketRentEstimate`, and other income sources
- `propertyOperatingExpenses` - Contains structured expense data like `propertyTaxAnnual`, `insuranceAnnual`, `hoaMonthly`, `capexRate`, etc.

**Impact**:

- Calculations may be inconsistent if transactions don't match structured data
- Missing opportunity to use verified/budgeted data from property setup
- CapEx reserve uses incorrect calculation (liquidReserves / 12 instead of capexRate)

### 2. Incorrect CapEx Reserve Calculation

**Current**: `capexReserve = metrics.liquidReserves / 12`

**Should be**: Use `propertyOperatingExpenses.capexRate` \* `monthlyRent` (or gross income)

### 3. Gross Income Calculation

**Current**: Sum of all income transactions

**Should be**: Prefer `propertyRentalIncome.monthlyRent` + other income sources when available, fallback to transactions

### 4. Fixed Expenses Source

**Current**: Only from transactions filtered by `isRecurring && recurrenceFrequency === 'monthly'`

**Should be**: Combine structured expenses from `propertyOperatingExpenses` (propertyTaxAnnual/12, insuranceAnnual/12, hoaMonthly, etc.) with transaction-based expenses

## Solutions Implemented

### Updated `useOperatingCore` Hook

1. **Priority order for gross income**:
   - Use `property.rentalIncome.monthlyRent` + other income fields when available
   - Fallback to transactions if rental income not set
   - Combine both sources for complete picture

2. **Fixed expenses calculation**:
   - Start with structured expenses from `propertyOperatingExpenses`:
     - Property tax (annual / 12)
     - Insurance (annual / 12)
     - HOA, utilities, services (monthly)
   - Add transaction-based recurring expenses
   - Combine and deduplicate

3. **CapEx reserve**:
   - Use `propertyOperatingExpenses.capexRate` \* gross income
   - Fallback to estimated calculation if not set

4. **Debt service**:
   - Continue using `useFinancialPulse` but verified calculation is correct

### Updated `useFinancialPulse` Hook

1. **Debt service calculation**:
   - Use actual `monthlyPrincipalInterest` from loan if available
   - Fallback to calculated estimate

## Data Source Priority

When both structured data and transactions are available:

1. **Primary**: Use structured data from `propertyRentalIncome` and `propertyOperatingExpenses`
2. **Secondary**: Use transactions for historical/actual data
3. **Combined**: Merge both sources for comprehensive view

## Seed Data Updates

Updated seed data to include comprehensive examples:

- Complete `propertyRentalIncome` data
- Complete `propertyOperatingExpenses` data
- Examples showing both monthly and annual expenses
- CapEx rate set for proper reserve calculations

## Changes Made

### 1. Updated `useOperatingCore` Hook (`apps/web/src/hooks/computed/useOperatingCore.ts`)

- ✅ Added `useProperty` hook to access `property.rentalIncome` and `property.operatingExpenses`
- ✅ Gross income now prioritizes structured `rentalIncome` data (monthlyRent + other income sources)
- ✅ Fixed expenses now combine structured `operatingExpenses` data with transaction-based expenses
- ✅ CapEx reserve now uses `capexRate * grossIncome` from `operatingExpenses` table
- ✅ Added fallback logic when structured data is missing (uses transactions)

### 2. Updated `useFinancialPulse` Hook (`apps/web/src/hooks/computed/useFinancialPulse.ts`)

- ✅ Debt service calculation now uses actual `monthlyPrincipalInterest` from loan when available
- ✅ Fallback to estimated calculation if actual payment not set

### 3. Updated Seed Data (`packages/db/src/seed/data/properties.ts`)

- ✅ Added `capexRate: "0.08"` (8%) to `sampleOperatingExpenses`
- ✅ Added `managementRate: "0.10"` (10%) to `sampleOperatingExpenses`
- ✅ Added `maintenanceRate: "0.05"` (5%) to `sampleOperatingExpenses`
- ✅ Expanded `sampleRentalIncome` with all income fields (petRentMonthly, etc.)
- ✅ Added `monthlyPrincipalInterest`, `monthlyEscrow`, and `totalMonthlyPayment` to `sampleLoan`

## Testing Recommendations

1. Test with properties that have structured data only (no transactions)
2. Test with properties that have transactions only (no structured data)
3. Test with properties that have both
4. Verify NOI calculations match expected values
5. Verify CapEx reserve uses correct rate (capexRate \* grossIncome)
6. Verify debt service uses actual loan payment when available

## Files Modified

1. `apps/web/src/hooks/computed/useOperatingCore.ts` - Major refactor to use structured data
2. `apps/web/src/hooks/computed/useFinancialPulse.ts` - Updated debt service calculation
3. `packages/db/src/seed/data/properties.ts` - Enhanced seed data examples
