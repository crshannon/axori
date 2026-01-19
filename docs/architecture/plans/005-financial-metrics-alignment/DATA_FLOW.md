# Financial Metrics - Data Flow Architecture

## Monthly Comparison Feature - Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Structured Data Sources                      │
├─────────────────────────────────────────────────────────────────┤
│  propertyRentalIncome                                            │
│    ├─ monthlyRent                                                │
│    ├─ leaseStartDate / leaseEndDate                             │
│    └─ otherIncomeMonthly                                         │
│                                                                   │
│  propertyOperatingExpenses                                       │
│    ├─ propertyTaxAnnual (→ monthly)                              │
│    ├─ insuranceAnnual (→ monthly)                                │
│    ├─ hoaMonthly                                                 │
│    └─ [other monthly expenses]                                    │
│                                                                   │
│  loans                                                           │
│    └─ monthlyPrincipalInterest (constant)                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              useMonthlyMetrics Hook                               │
├─────────────────────────────────────────────────────────────────┤
│  For each month (trailing 12):                                   │
│                                                                   │
│  1. Calculate Projected Income:                                  │
│     - Lease rent (if lease active in month)                      │
│     - Other income (monthly constant)                             │
│                                                                   │
│  2. Calculate Projected Expenses:                               │
│     - Annual expenses / 12                                       │
│     - Monthly expenses (constant)                                │
│     - CapEx reserve (capexRate * gross income)                    │
│                                                                   │
│  3. Calculate Projected NOI:                                    │
│     - Projected Income - Projected Expenses                      │
│                                                                   │
│  4. Calculate Projected Cash Flow:                              │
│     - Projected NOI - Loan Payments                             │
│                                                                   │
│  5. Aggregate Actual from Transactions:                         │
│     - Sum income transactions for month                          │
│     - Sum expense transactions for month                         │
│     - Actual Cash Flow = Income - Expenses                       │
│                                                                   │
│  6. Calculate Variance:                                         │
│     - Variance = Actual - Projected                             │
│     - Variance % = (Variance / Projected) * 100                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Monthly Data Structure                              │
├─────────────────────────────────────────────────────────────────┤
│  Array<{                                                         │
│    month: "2025-01",                                            │
│    projected: {                                                  │
│      income: number,                                             │
│      expenses: number,                                           │
│      noi: number,                                                │
│      cashFlow: number                                            │
│    },                                                             │
│    actual: {                                                     │
│      income: number,                                             │
│      expenses: number,                                            │
│      cashFlow: number                                             │
│    },                                                             │
│    variance: {                                                   │
│      income: number,                                              │
│      expenses: number,                                            │
│      cashFlow: number,                                            │
│      cashFlowPercent: number                                      │
│    }                                                              │
│  }>                                                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ├──────────────────┐
                            ▼                  ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   MonthlyComparisonChart     │  │  useFinancialActionItems     │
├──────────────────────────────┤  ├──────────────────────────────┤
│  Visualizes:                  │  │  Analyzes:                    │
│  - Projected line (baseline)  │  │  - 3+ months below projected │
│  - Actual points (primary)    │  │  - Seasonal patterns          │
│  - Variance annotations       │  │  - Consistent variance         │
│  - Time range selector        │  │  - Outperformance patterns   │
│  - Month drill-down           │  │                               │
└──────────────────────────────┘  └──────────────────────────────┘
                            │                  │
                            └──────────┬───────┘
                                       ▼
                            ┌──────────────────────────────┐
                            │    ActionItemsPanel           │
                            ├──────────────────────────────┤
                            │  Displays:                    │
                            │  - Rent collection issues     │
                            │  - Planned expense alerts     │
                            │  - Rent increase opportunities│
                            │  - Variance warnings          │
                            └──────────────────────────────┘
```

## Component Hierarchy

```
financials.tsx
├── FinancialPulse (shows current month projected vs actual)
├── OperatingCore (shows NOI breakdown)
├── MonthlyComparisonChart (new - shows 12-month trend)
│   ├── Chart visualization (Recharts/Chart.js)
│   ├── TimeRangeSelector
│   └── MonthDetailDrawer (drill-down)
└── ActionItemsPanel (new - shows generated insights)
    └── ActionItemCard (individual insight)
```

## Pattern Detection Logic

### Rent Collection Issue

```typescript
if (consecutiveMonthsBelowProjected >= 3 && variancePercent < -10) {
  generateActionItem({
    type: "rent_collection_issue",
    severity: "high",
    message: "Rent collection below projected for 3+ months",
    suggestedActions: [
      "Review lease agreements",
      "Contact tenants",
      "Check payment processing",
    ],
  });
}
```

### Seasonal Pattern

```typescript
if (sameMonthVariancePattern >= 2 && variancePercent > 20) {
  generateActionItem({
    type: "seasonal_expense",
    severity: "info",
    message: "Recurring expense spike in this month",
    suggestedActions: ["Mark as planned expense", "Budget for next year"],
  });
}
```

### Rent Increase Opportunity

```typescript
if (consecutiveMonthsAboveProjected >= 6 && variancePercent > 15) {
  generateActionItem({
    type: "rent_increase_opportunity",
    severity: "medium",
    message: "Consistent outperformance suggests rent increase potential",
    suggestedActions: ["Review market rates", "Consider lease renewal terms"],
  });
}
```

## Data Caching Strategy

Consider caching monthly aggregates to avoid recalculating on every render:

```typescript
// Cache key: `monthly-metrics-${propertyId}-${startDate}-${endDate}`
// Invalidate when:
// - New transaction added
// - Structured data updated (rent, expenses, loans)
// - Date range changes
```

## Future Enhancements

1. **AI Insights Layer**: Use pattern data to generate natural language insights
2. **Forecasting**: Project future months based on historical patterns
3. **Comparison Views**: Compare multiple properties side-by-side
4. **Export**: PDF/CSV export of monthly comparison data
5. **Alerts**: Email/push notifications for significant variances
