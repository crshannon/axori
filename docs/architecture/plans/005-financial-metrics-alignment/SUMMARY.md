# Financial Metrics Alignment Plan

**Status**: Planning  
**Date**: 2026-01-16  
**Updated**: 2026-01-16  
**Priority**: High

## Problem Statement

We have multiple financial metrics being calculated from different data sources, causing confusion and potential inconsistencies:

1. **NOI (Net Operating Income)** - Calculated from structured data (`propertyRentalIncome`, `propertyOperatingExpenses`)
2. **Net Cash Flow** - Calculated from transactions
3. **Loan Payments** - Shown separately but not clearly integrated
4. **Different data sources** - Structured data vs transactions causing misalignment
5. **No historical comparison** - Missing month-over-month projected vs actual analysis

## Goals

1. **Clarify metric definitions** - What each metric represents and when to use it
2. **Unify data sources** - Consistent approach to calculating metrics
3. **Improve user understanding** - Clear labels and explanations
4. **Enable pattern detection** - Month-over-month projected vs actual comparison
5. **Generate actionable insights** - Automatic flagging of variances and patterns

## Proposed Solution

### Data Source Strategy

**Structured Data (Leases, Mortgages)** → Foundation for projected figures

- Gross Income (from `propertyRentalIncome`)
- Operating Expenses (from `propertyOperatingExpenses`)
- Loan Payments (from loan data)
- **Purpose**: Property performance projections, underwriting, planning

**Transactions** → Validation of reality

- Actual Income (from transactions)
- Actual Expenses (from transactions)
- Actual Cash Flow (from transactions)
- **Purpose**: Historical tracking, variance analysis, pattern detection

### Metric Hierarchy

**Revenue → Operating Expenses → NOI → Debt Service → Net Cash Flow**

1. **Gross Income** (from structured data)
2. **Operating Expenses** (from structured data)
3. **NOI** = Gross Income - Operating Expenses - CapEx Reserve
   - **Excludes**: Loan payments (financing cost, not operating expense)
4. **Debt Service** = Loan Payments (separate from operating expenses)
5. **Net Cash Flow** = NOI - Loan Payments (projected) OR Income - Expenses (actual)

### Month-Over-Month Comparison Feature

**Core Concept**: Show projected vs actual as a month-over-month comparison to enable pattern detection and actionable insights.

**Key Features**:

- **Chart Visualization**: Projected as baseline (subtle reference line/shaded band), actual as primary data points
- **Variance Detection**: Automatic flagging when actual deviates from projected by threshold
- **Action Item Generation**: Pattern-based alerts (e.g., "3 months below projected → rent collection issue")
- **Time Range**: Default to trailing 12 months (captures seasonality), allow drill-down to specific month
- **Empty State**: Show projected line alone with messaging when <3 months of transaction history

**What It Enables**:

- **Pattern Detection**: Three months of actual below projected triggers "rent collection issue" flag
- **Seasonal Awareness**: Maintenance spike in same month each year suggests planned expense
- **Opportunity Identification**: Consistent outperformance signals rent increase opportunity
- **AI Insights Foundation**: Pattern detection becomes straightforward when data is structured for comparison

## Key Decisions (RESOLVED)

1. ✅ **Net Cash Flow data source**: Use structured data (leases, mortgages) for projected figures, transactions for actuals
2. ✅ **Projected vs. Actual**: Show both when data supports it. Display actual as primary with variance from projected as secondary indicator
3. ✅ **Handling data asymmetry**: Always show something when you have any signal. Label where the number comes from ("projected from lease" vs "avg collected"). Prompt specifically for what's missing
4. ✅ **Loan payments placement**: Keep separate from operating expenses. Preserves NOI as distinct metric for property comparison

## Expected Outcome

- Clear, consistent financial metrics with proper data source labeling
- Month-over-month projected vs actual comparison chart
- Automatic pattern detection and action item generation
- Both projected and actual views available with clear source indicators
- Proper separation of operating vs financing costs
- Foundation for AI insights layer
