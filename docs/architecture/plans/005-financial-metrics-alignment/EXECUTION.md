# Financial Metrics Alignment - Execution Plan

## Current State Analysis

### Metrics Currently Calculated

1. **NOI** (`useOperatingCore`)
   - Source: Structured data (`propertyRentalIncome`, `propertyOperatingExpenses`)
   - Formula: `Gross Income - Operating Expenses - CapEx Reserve`
   - Excludes: Loan payments
   - Location: `OperatingCore` component

2. **Net Cash Flow** (`useFinancialPulse`)
   - Source: Transactions
   - Formula: `Income Transactions - Expense Transactions`
   - Includes: Everything in transactions (may or may not include loan payments)
   - Location: `FinancialPulse` component

3. **Loan Payments** (`useFinancialPulse`)
   - Source: Loan data (`monthlyPrincipalInterest`)
   - Shown: Separately in `OperatingCore` and `FinancialPulse`

### Issues Identified

1. **Data Source Mismatch**: NOI uses structured data, Net Cash Flow uses transactions
2. **Inconsistent Calculations**: Net Cash Flow may not align with NOI - Loan Payments
3. **User Confusion**: Two different "Net Cash Flow" concepts (projected vs actual)
4. **Missing Integration**: Loan payments shown but not clearly part of cash flow calculation

## Proposed Solution: Three-Tier Metric System

### Tier 1: Operating Metrics (Projected/Budgeted)

**Data Source**: Structured property data

- `propertyRentalIncome` → Gross Income
- `propertyOperatingExpenses` → Operating Expenses
- Calculated NOI (excludes financing)

**Use Case**: Property performance evaluation, underwriting, projections

### Tier 2: Cash Flow Metrics (Projected)

**Data Source**: Structured data + Loan data

- NOI (from Tier 1)
- Loan Payments (from loan data)
- Net Cash Flow = NOI - Loan Payments

**Use Case**: Cash flow planning, debt service coverage

### Tier 3: Actual Metrics (Historical)

**Data Source**: Transactions

- Actual Income (sum of income transactions)
- Actual Expenses (sum of expense transactions)
- Actual Cash Flow = Actual Income - Actual Expenses

**Use Case**: Historical tracking, variance analysis, tax reporting

## Implementation Plan

### Phase 1: Clarify Current Metrics

- [ ] Update `useOperatingCore` to clearly document NOI calculation
- [ ] Update `useFinancialPulse` to clarify what "Net Cash Flow" represents
- [ ] Add comments explaining data sources

### Phase 2: Rename for Clarity

- [ ] Rename "Net Cash Flow" in FinancialPulse to "Projected Cash Flow" or "Actual Cash Flow" based on source
- [ ] Or: Create separate "Projected Cash Flow" = NOI - Loan Payments
- [ ] Keep "Actual Cash Flow" for transaction-based calculation

### Phase 3: Unified Calculation (Recommended)

**Option A: Projected Cash Flow from Structured Data**

- Calculate Net Cash Flow as: `NOI - Loan Payments`
- Use structured data for consistency
- Show in FinancialPulse as "Projected Cash Flow"

**Option B: Keep Both Views**

- Show "Projected Cash Flow" (NOI - Loan Payments) from structured data
- Show "Actual Cash Flow" from transactions
- Allow users to compare projected vs actual

### Phase 4: Component Updates

- [ ] Update `FinancialPulse` to show both projected and actual when available
- [ ] Update labels and tooltips for clarity (show data source)
- [ ] Ensure OperatingCore clearly shows NOI excludes loan payments
- [ ] Add variance indicators (actual vs projected difference)

### Phase 5: Month-Over-Month Comparison Feature

**Goal**: Enable pattern detection through projected vs actual month-over-month comparison

**Data Requirements**:

- [ ] Generate monthly projected values from structured data
  - Lease rent by month (accounting for term dates)
  - Mortgage payment as constant
  - Estimated expenses (flat or seasonally adjusted)
- [ ] Aggregate transactions per month
- [ ] Calculate variance per month (actual - projected)
- [ ] Store monthly aggregates (consider caching/denormalization)

**Component Development**:

- [ ] Create `MonthlyComparisonChart` component
  - Chart library selection (Recharts, Chart.js, or similar)
  - Projected as baseline (subtle reference line or shaded band)
  - Actual as primary data points (line or bar chart)
  - Variance visualization (color coding, annotations)
- [ ] Create `MonthlyMetrics` hook (`useMonthlyMetrics`)
  - Calculate projected values per month
  - Aggregate transactions per month
  - Calculate variances
  - Return data structure: `Array<{ month: string, projected: number, actual: number, variance: number }>`
- [ ] Add time range selector (default: trailing 12 months)
- [ ] Add month drill-down capability (click month → show transaction detail)

**Action Item Generation**:

- [ ] Create `useFinancialActionItems` hook
  - Pattern detection logic:
    - 3+ months actual below projected → "Rent collection issue" flag
    - Maintenance spike in same month each year → "Planned expense" suggestion
    - Consistent outperformance → "Rent increase opportunity" alert
  - Variance threshold configuration (e.g., >10% deviation)
  - Return actionable insights with severity levels
- [ ] Create `ActionItemsPanel` component
  - Display generated action items
  - Group by category (rent collection, expenses, opportunities)
  - Allow dismissal/acknowledgment
- [ ] Integrate action items below chart

**Empty State**:

- [ ] Show projected line alone when <3 months of transaction history
- [ ] Display messaging: "Track actuals over time to see how your property performs against expectations"
- [ ] Prompt for transaction data entry

**Integration Points**:

- [ ] Add to `financials.tsx` page (new section or tab)
- [ ] Consider adding to property overview as summary widget
- [ ] Link from FinancialPulse component ("View monthly trends")

## Decision Points (RESOLVED)

### Decision 1: What should "Net Cash Flow" in FinancialPulse represent?

**✅ DECIDED**: Use structured data (leases, mortgages) for projected figures, transactions for actuals

- Structured data is the foundation for projections
- Transactions validate reality
- Show both when data supports it
- Display actual as primary number with variance from projected as secondary indicator

### Decision 2: Should loan payments be in OperatingCore expenses list?

**✅ DECIDED**: Keep separate from operating expenses

- Preserves NOI as a distinct metric
- Essential for property comparison
- Aligns with standard real estate investment analysis
- Structure: Revenue → Operating Expenses → NOI → Debt Service → Net Cash Flow

### Decision 3: How to handle missing data?

**✅ DECIDED**: Always show something when you have any signal

- Label where the number comes from ("projected from lease" vs "avg collected")
- Prompt specifically for what's missing rather than showing zeros or blanks
- When only one source exists, show what you have with clear label and prompt for missing piece

## Testing Strategy

1. Test with properties that have:
   - Only structured data (no transactions)
   - Only transactions (no structured data)
   - Both structured data and transactions
   - Both but with mismatched values

2. Verify calculations:
   - NOI excludes loan payments
   - Projected Cash Flow = NOI - Loan Payments
   - Actual Cash Flow = Income Transactions - Expense Transactions

3. UI/UX testing:
   - Labels are clear
   - Users understand difference between projected and actual
   - No confusion about what's included/excluded

## File Changes Summary

### New Files

- `apps/web/src/components/property-hub/property-details/financials/MonthlyComparisonChart.tsx`
  - Chart component for projected vs actual comparison
- `apps/web/src/hooks/computed/useMonthlyMetrics.ts`
  - Hook to calculate monthly projected and actual values
- `apps/web/src/hooks/computed/useFinancialActionItems.ts`
  - Hook to generate actionable insights from patterns
- `apps/web/src/components/property-hub/property-details/financials/ActionItemsPanel.tsx`
  - Component to display generated action items
- `apps/web/src/utils/financial/monthlyProjections.ts`
  - Utilities for generating monthly projected values from structured data

### Modified Files

- `apps/web/src/hooks/computed/useFinancialPulse.ts`
  - Update to calculate both projected and actual Net Cash Flow
  - Add data source labeling
- `apps/web/src/hooks/computed/useOperatingCore.ts`
  - Ensure clear documentation of NOI calculation
  - Add comments explaining data sources
- `apps/web/src/components/property-hub/property-details/financials/FinancialPulse.tsx`
  - Update to show both projected and actual when available
  - Add variance indicators
  - Update labels with data source
- `apps/web/src/components/property-hub/property-details/financials/OperatingCore.tsx`
  - Ensure clear visual distinction that NOI excludes loan payments
  - Add tooltip/help text explaining NOI

## Rollout Plan

### Phase 1: Foundation (Weeks 1-2)

1. ✅ Document current state (this document)
2. ✅ Get user feedback on proposed approach
3. [ ] Update `useFinancialPulse` to calculate both projected and actual
4. [ ] Update `FinancialPulse` component to show both with clear labeling
5. [ ] Update `OperatingCore` to clarify NOI excludes loan payments
6. [ ] Add tooltips/help text explaining metrics

### Phase 2: Monthly Metrics Hook (Week 3)

1. [ ] Create `useMonthlyMetrics` hook
2. [ ] Implement monthly projection calculation from structured data
3. [ ] Implement monthly aggregation from transactions
4. [ ] Add variance calculation
5. [ ] Test with various data scenarios

### Phase 3: Chart Component (Week 4)

1. [ ] Select and integrate chart library
2. [ ] Create `MonthlyComparisonChart` component
3. [ ] Implement projected baseline visualization
4. [ ] Implement actual data points visualization
5. [ ] Add variance visualization
6. [ ] Add time range selector
7. [ ] Add month drill-down capability

### Phase 4: Action Items (Week 5)

1. [ ] Create `useFinancialActionItems` hook
2. [ ] Implement pattern detection logic
3. [ ] Create `ActionItemsPanel` component
4. [ ] Integrate action items below chart
5. [ ] Test pattern detection with various scenarios

### Phase 5: Integration & Polish (Week 6)

1. [ ] Add monthly comparison to `financials.tsx` page
2. [ ] Implement empty state for <3 months of data
3. [ ] Add loading states
4. [ ] Test thoroughly with edge cases
5. [ ] Update documentation
6. [ ] User acceptance testing

## Testing Strategy

### Unit Tests

- [ ] `useMonthlyMetrics` hook calculations
- [ ] Monthly projection generation
- [ ] Transaction aggregation logic
- [ ] Variance calculations
- [ ] Pattern detection logic in `useFinancialActionItems`

### Integration Tests

- [ ] Chart renders with projected and actual data
- [ ] Action items generate correctly from patterns
- [ ] Month drill-down shows correct transaction details
- [ ] Time range selector updates chart correctly

### Manual Testing Scenarios

1. **Property with only structured data** (no transactions)
   - Should show projected line only
   - Should prompt for transaction data
2. **Property with only transactions** (no structured data)
   - Should show actual line only
   - Should prompt for structured data entry
3. **Property with both** (structured + transactions)
   - Should show both projected and actual
   - Should calculate and display variances
   - Should generate action items when patterns detected
4. **Property with <3 months of transactions**
   - Should show projected line with empty state message
5. **Property with seasonal patterns**
   - Should detect recurring patterns
   - Should suggest planned expenses
6. **Property with consistent variance**
   - Should flag rent collection issues
   - Should suggest rent increase opportunities

### Edge Cases

- [ ] Missing lease term dates
- [ ] Transactions outside property date range
- [ ] Multiple leases overlapping
- [ ] Loan payment changes mid-period
- [ ] Expense spikes that are one-time vs recurring
