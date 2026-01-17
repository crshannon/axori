import { Card, Typography } from '@axori/ui'
import { useFinancialPulse } from '@/hooks/computed/useFinancialPulse'

interface FinancialPulseProps {
  propertyId: string
}

/**
 * FinancialPulse component - Displays key financial metrics for a property
 * Shows: Net Cash Flow (projected vs actual), Fixed Opex Burn, Debt Service
 *
 * Data Sources:
 * - Projected: Structured data (leases, mortgages) → NOI - Loan Payments
 * - Actual: Transactions → Income - Expenses
 */
export const FinancialPulse = ({ propertyId }: FinancialPulseProps) => {
  const metrics = useFinancialPulse(propertyId)

  // Determine which value to display as primary
  const primaryValue = metrics.actualCashFlow ?? metrics.projectedCashFlow ?? 0
  const primarySource = metrics.hasActualData
    ? 'actual'
    : metrics.hasProjectedData
      ? 'projected'
      : null

  // Format variance display
  const formatVariance = () => {
    if (metrics.variance === null || metrics.variancePercent === null) {
      return null
    }
    const isPositive = metrics.variance >= 0
    const sign = isPositive ? '+' : ''
    return {
      value: `${sign}${Math.round(metrics.variance).toLocaleString()}`,
      percent: `${sign}${metrics.variancePercent.toFixed(1)}%`,
      isPositive,
    }
  }

  const variance = formatVariance()

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group border-emerald-500/20 dark:border-emerald-500/10 py-12"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] to-transparent pointer-events-none" />

      {/* Primary KPI - Net Cash Flow */}
      <div className="flex-grow flex flex-col justify-center relative z-10">
        <Typography
          variant="overline"
          className="text-emerald-600 dark:text-[#10b981] mb-4 flex items-center gap-2 tracking-[0.2em] font-black"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Net Cash Flow
        </Typography>
        <Typography
          as="div"
          className={`text-5xl md:text-6xl font-black tabular-nums tracking-tighter ${
            primaryValue >= 0
              ? 'text-slate-900 dark:text-[#E8FF4D]'
              : 'text-rose-500 dark:text-rose-500'
          }`}
        >
          <span className="text-2xl md:text-3xl opacity-30 mr-1">$</span>
          {Math.round(primaryValue).toLocaleString()}
        </Typography>
        <div className="mt-4 space-y-1">
          <Typography
            variant="caption"
            className="text-slate-500 uppercase tracking-widest font-bold"
          >
            Target Sovereign Yield / Monthly
          </Typography>
          {/* Data source and variance indicator */}
          <div className="flex items-center gap-3 text-xs">
            {primarySource && (
              <Typography
                variant="overline"
                className="text-slate-400 opacity-70"
              >
                {primarySource === 'actual'
                  ? 'From transactions'
                  : 'Projected from lease'}
              </Typography>
            )}
            {variance && metrics.hasActualData && metrics.hasProjectedData && (
              <Typography
                variant="overline"
                className={
                  variance.isPositive
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                }
              >
                {variance.value} ({variance.percent}) vs projected
              </Typography>
            )}
          </div>
        </div>
      </div>

      {/* Secondary KPIs - Border Separated Section */}
      <div className="flex gap-12 pr-6 border-l border-slate-200 dark:border-white/10 pl-12 h-full py-2 relative z-10">
        {/* Opex Burn */}
        <div className="flex flex-col justify-center">
          <Typography
            variant="caption"
            weight="black"
            className="text-slate-400 uppercase tracking-widest mb-1"
          >
            OPEX BURN
          </Typography>
          <Typography
            variant="h3"
            className="tabular-nums text-rose-500 dark:text-rose-500"
          >
            ${Math.round(metrics.totalFixedExpenses).toLocaleString()}
          </Typography>
          <Typography
            variant="overline"
            className="opacity-30 uppercase mt-2 font-bold"
          >
            Recurring
          </Typography>
        </div>

        {/* Debt Service */}
        <div className="flex flex-col justify-center">
          <Typography
            variant="caption"
            weight="black"
            className="text-slate-400 uppercase tracking-widest mb-1"
          >
            DEBT SERVICE
          </Typography>
          <Typography
            variant="h3"
            className="tabular-nums text-slate-900 dark:text-white"
          >
            ${Math.round(metrics.totalDebtService).toLocaleString()}
          </Typography>
          <Typography
            variant="overline"
            className="opacity-30 uppercase mt-2 font-bold"
          >
            {metrics.interestRate > 0
              ? `${metrics.interestRate.toFixed(2)}% P&I`
              : 'No Active Loan'}
          </Typography>
        </div>
      </div>
    </Card>
  )
}
