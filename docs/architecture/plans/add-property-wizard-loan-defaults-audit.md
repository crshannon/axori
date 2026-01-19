# Add Property Wizard - Loan Default Properties Audit

**Created:** 2024-12-19  
**Status:** Complete  
**Related Plans:** add-property-wizard-finance-alignment-audit

## Overview

This audit identifies all loan properties that should be explicitly set behind the scenes when creating a loan via the wizard, even if they're not part of the form. These include:

- Fields with database defaults that should be explicit
- Calculated fields that should be stored
- Required fields that might not be obvious

## Database Schema Defaults

From `packages/db/src/schema/index.ts` (loans table):

```typescript
// Status fields (have defaults, but should be explicit)
status: loanStatusEnum("status").notNull().default("active"),
isPrimary: boolean("is_primary").default(true),
loanPosition: integer("loan_position").default(1), // 1st lien, 2nd lien, etc.

// Payment fields (have defaults)
monthlyEscrow: numeric("monthly_escrow", { precision: 10, scale: 2 }).default("0"),
monthlyPmi: numeric("monthly_pmi", { precision: 10, scale: 2 }).default("0"),
monthlyMip: numeric("monthly_mip", { precision: 10, scale: 2 }).default("0"),
monthlyHoaCollected: numeric("monthly_hoa_collected", { precision: 10, scale: 2 }).default("0"),
extraPrincipalMonthly: numeric("extra_principal_monthly", { precision: 10, scale: 2 }).default("0"),
paymentDueDay: integer("payment_due_day").default(1),
lateFeeGraceDays: integer("late_fee_grace_days").default(15),

// Feature flags (have defaults)
isArm: boolean("is_arm").default(false),
isInterestOnly: boolean("is_interest_only").default(false),
hasBalloon: boolean("has_balloon").default(false),
hasPrepaymentPenalty: boolean("has_prepayment_penalty").default(false),
```

## Current Wizard Mapping

What we're currently setting in `usePropertyPersistence.ts`:

```typescript
loan: {
  loanType: 'conventional',
  originalLoanAmount: parseFloat(formData.loanAmount.replace(/,/g, '')),
  interestRate: parseFloat(formData.interestRate), // percentage 0-100
  termMonths: parseInt(formData.loanTerm) * 12,
  currentBalance: parseFloat(formData.loanAmount.replace(/,/g, '')),
  lenderName: formData.provider.trim(),
  status: 'active', // ✅ Explicitly set
  isPrimary: true,  // ✅ Explicitly set
}
```

## Fields We Should Explicitly Set

### 1. `loanPosition` - Recommended ✅

**Why:**

- First loan for a property should be `loanPosition: 1`
- Makes intent clear even though schema defaults to 1
- Important for multi-loan scenarios (2nd liens, etc.)

**Recommendation:** Set to `1` explicitly

### 2. `monthlyPrincipalInterest` - Calculate & Store ✅ RECOMMENDED

**Why:**

- Wizard already calculates P&I via `calculatePI()` in `AddPropertyWizard.tsx`
- Storing this value ensures consistency
- Finance components can use this directly instead of recalculating
- Improves accuracy for debt service calculations

**Current State:**

- Wizard calculates: `calculatePI()` returns formatted P&I string
- Not stored in loan mapping

**Recommendation:**

- Parse the calculated P&I from `calculatePI()` or recalculate
- Store in `monthlyPrincipalInterest` field

### 3. `monthlyEscrow` - Optional (Default OK)

**Why:**

- Default is "0" which is correct for new loans
- User hasn't provided this data in wizard
- Can be updated later when available

**Recommendation:** Leave as default ("0"), or set explicitly to `0` for clarity

### 4. `totalMonthlyPayment` - Calculate & Store ✅ RECOMMENDED

**Why:**

- Should be `monthlyPrincipalInterest + monthlyEscrow + monthlyPmi`
- For new loans: `monthlyPrincipalInterest + 0 + 0 = monthlyPrincipalInterest`
- Finance components use this for debt service calculations

**Recommendation:**

- Calculate: `monthlyPrincipalInterest` (from above)
- Store: `totalMonthlyPayment: monthlyPrincipalInterest` (for new loans)

### 5. `startDate` - Optional (Not in Wizard)

**Why:**

- Would be useful for maturity date calculation
- Not collected in wizard currently
- Can be added in future enhancement

**Recommendation:** Leave as null for now (Phase 2 enhancement)

### 6. `paymentDueDay` - Optional (Default OK)

**Why:**

- Default is `1` which is reasonable
- Not collected in wizard
- Can be updated later if needed

**Recommendation:** Leave as default (`1`)

## Recommended Changes

### Priority 1: Store Calculated P&I ✅

The wizard calculates P&I but doesn't store it. We should:

```typescript
// In usePropertyPersistence.ts
const monthlyPI = formData.loanAmount && formData.interestRate && formData.loanTerm
  ? calculateMonthlyPI(
      parseFloat(formData.loanAmount.replace(/,/g, '')),
      parseFloat(formData.interestRate),
      parseInt(formData.loanTerm) * 12
    )
  : null

loan: {
  // ... existing fields
  monthlyPrincipalInterest: monthlyPI,
  totalMonthlyPayment: monthlyPI, // For new loans, P&I = total (no escrow/PMI yet)
  loanPosition: 1, // Explicit for clarity
}
```

### Priority 2: Explicit Defaults for Clarity

Set common defaults explicitly for clarity:

```typescript
loan: {
  // ... required fields
  status: 'active',
  isPrimary: true,
  loanPosition: 1,
  monthlyEscrow: 0, // Explicit default
  monthlyPmi: 0, // Explicit default
  monthlyMip: 0, // Explicit default
  paymentDueDay: 1, // Explicit default
}
```

## P&I Calculation

The wizard uses this formula (from `AddPropertyWizard.tsx`):

```typescript
const calculatePI = () => {
  const p = parseFloat(formData.loanAmount.replace(/,/g, "")) || 0;
  const r = (parseFloat(formData.interestRate) || 0) / 100 / 12; // Monthly rate
  const n = (parseInt(formData.loanTerm) || 30) * 12; // Total months
  if (r === 0) return (p / n).toFixed(2);
  const pi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return pi.toLocaleString(undefined, { maximumFractionDigits: 0 });
};
```

This should be extracted to a utility and used in mapping.

## Implementation Checklist

- [ ] Extract P&I calculation to utility function
- [ ] Calculate `monthlyPrincipalInterest` in loan mapping
- [ ] Set `totalMonthlyPayment = monthlyPrincipalInterest` for new loans
- [ ] Add `loanPosition: 1` explicitly
- [ ] (Optional) Set explicit defaults for clarity: `monthlyEscrow: 0`, `paymentDueDay: 1`

## Impact

**Before:**

- Loan saved without `monthlyPrincipalInterest` or `totalMonthlyPayment`
- Finance components must calculate P&I on the fly
- Potential inconsistencies if calculation logic differs

**After:**

- Loan saved with stored `monthlyPrincipalInterest` and `totalMonthlyPayment`
- Finance components use stored values (consistent)
- Can recalculate later if loan terms change
- Clear intent with explicit defaults

## Notes

- Database defaults will apply if we don't set these, but explicit is better
- Storing calculated values ensures consistency across components
- Can add `startDate` in future to enable maturity date calculation
- Monthly P&I calculation is standard amortization formula
