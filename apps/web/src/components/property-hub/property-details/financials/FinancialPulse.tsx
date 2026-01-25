import { Card, Overline, Typography, cn } from '@axori/ui'
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react'
import { useFinancialPulse } from '@/hooks/computed/useFinancialPulse'

interface FinancialPulseProps {
  propertyId: string
}

/**
 * FinancialPulse component - Financial health snapshot for a property
 *
 * Shows the key metrics investors care about:
 * - Monthly Cash Flow (the bottom line)
 * - Gross Income (what comes in)
 * - Total Expenses (what goes out, including debt)
 * - Performance indicator (vs projected)
 *
 * Data Sources:
 * - Actual: From transaction data (preferred)
 * - Projected: From structured property data (fallback)
 */
export const FinancialPulse = ({ propertyId }: FinancialPulseProps) => {
  const metrics = useFinancialPulse(propertyId)

  // Primary value: prefer actual, fallback to projected
  const cashFlow = metrics.actualCashFlow ?? metrics.projectedCashFlow ?? 0
  const isPositive = cashFlow >= 0
  const dataSource = metrics.hasActualData
    ? 'actual'
    : metrics.hasProjectedData
      ? 'projected'
      : null

  // Calculate gross income and total expenses
  const grossIncome =
    metrics.actualCashFlow !== null
      ? cashFlow + metrics.totalFixedExpenses + metrics.totalDebtService
      : metrics.projectedCashFlow !== null
        ? metrics.projectedCashFlow +
          metrics.totalFixedExpenses +
          metrics.totalDebtService
        : 0

  const totalExpenses = metrics.totalFixedExpenses + metrics.totalDebtService

  // Format currency
  const formatCurrency = (value: number, showSign = false): string => {
    const absValue = Math.abs(value)
    const formatted =
      absValue >= 1000
        ? `$${(absValue / 1000).toFixed(1)}k`
        : `$${Math.round(absValue).toLocaleString()}`
    if (showSign && value !== 0) {
      return value >= 0 ? `+${formatted}` : `-${formatted.replace('$', '$')}`
    }
    return value < 0 ? `-${formatted}` : formatted
  }

  // Variance indicator
  const variance = metrics.variance
  const variancePercent = metrics.variancePercent

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                isPositive ? 'bg-emerald-500' : 'bg-rose-500',
              )}
            />
            <Typography variant="h5">Financial Pulse</Typography>
          </div>
          {dataSource && (
            <Overline className="text-slate-400">
              {dataSource === 'actual'
                ? 'From transactions'
                : 'Projected from property data'}
            </Overline>
          )}
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Cash Flow - Primary KPI */}
          <div
            className={cn(
              'md:col-span-2 rounded-2xl p-6',
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-500/10'
                : 'bg-rose-50 dark:bg-rose-500/10',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {isPositive ? (
                <TrendingUp
                  size={18}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              ) : (
                <TrendingDown
                  size={18}
                  className="text-rose-600 dark:text-rose-400"
                />
              )}
              <Overline
                className={cn(
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400',
                )}
              >
                Monthly Cash Flow
              </Overline>
            </div>
            <Typography
              as="div"
              className={cn(
                'text-4xl md:text-5xl font-black tabular-nums tracking-tight',
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {formatCurrency(cashFlow, true)}
            </Typography>
            {variance !== null && variancePercent !== null && (
              <div className="flex items-center gap-2 mt-3">
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
                    variance >= 0
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300',
                  )}
                >
                  {variance >= 0 ? (
                    <ArrowUp size={12} />
                  ) : (
                    <ArrowDown size={12} />
                  )}
                  <span>
                    {variance >= 0 ? '+' : ''}
                    {variancePercent.toFixed(0)}% vs projected
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gross Income */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDown
                size={16}
                className="text-emerald-500 dark:text-emerald-400 rotate-180"
              />
              <Overline className="text-slate-500 dark:text-slate-400">
                Income
              </Overline>
            </div>
            <Typography
              variant="h3"
              className="text-slate-900 dark:text-white tabular-nums"
            >
              {formatCurrency(grossIncome)}
            </Typography>
            <Typography variant="caption" className="text-slate-400 mt-1 block">
              Gross monthly
            </Typography>
          </div>

          {/* Total Expenses */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUp
                size={16}
                className="text-rose-500 dark:text-rose-400 rotate-180"
              />
              <Overline className="text-slate-500 dark:text-slate-400">
                Expenses
              </Overline>
            </div>
            <Typography
              variant="h3"
              className="text-slate-900 dark:text-white tabular-nums"
            >
              {formatCurrency(totalExpenses)}
            </Typography>
            <Typography variant="caption" className="text-slate-400 mt-1 block">
              Opex + Debt
            </Typography>
          </div>
        </div>

        {/* Breakdown Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Expense Breakdown</span>
            <span>
              Operating: {formatCurrency(metrics.totalFixedExpenses)} • Debt:{' '}
              {formatCurrency(metrics.totalDebtService)}
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
            {totalExpenses > 0 && (
              <>
                <div
                  className="h-full bg-amber-400 dark:bg-amber-500"
                  style={{
                    width: `${(metrics.totalFixedExpenses / totalExpenses) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-slate-400 dark:bg-slate-500"
                  style={{
                    width: `${(metrics.totalDebtService / totalExpenses) * 100}%`,
                  }}
                />
              </>
            )}
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500" />
              <span className="text-slate-500 dark:text-slate-400">
                Operating (
                {totalExpenses > 0
                  ? (
                      (metrics.totalFixedExpenses / totalExpenses) *
                      100
                    ).toFixed(0)
                  : 0}
                %)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              <span className="text-slate-500 dark:text-slate-400">
                Debt Service (
                {totalExpenses > 0
                  ? ((metrics.totalDebtService / totalExpenses) * 100).toFixed(
                      0,
                    )
                  : 0}
                %)
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
          <div>
            <Typography
              variant="caption"
              className="text-slate-400 uppercase tracking-wider"
            >
              Debt Service
            </Typography>
            <Typography variant="body" weight="bold" className="tabular-nums">
              {formatCurrency(metrics.totalDebtService)}
              <span className="text-slate-400 font-normal">/mo</span>
            </Typography>
          </div>
          <div>
            <Typography
              variant="caption"
              className="text-slate-400 uppercase tracking-wider"
            >
              Interest Rate
            </Typography>
            <Typography variant="body" weight="bold" className="tabular-nums">
              {metrics.interestRate > 0
                ? `${(metrics.interestRate * 100).toFixed(2)}%`
                : '--'}
            </Typography>
          </div>
          <div>
            <Typography
              variant="caption"
              className="text-slate-400 uppercase tracking-wider"
            >
              Operating Costs
            </Typography>
            <Typography variant="body" weight="bold" className="tabular-nums">
              {formatCurrency(metrics.totalFixedExpenses)}
              <span className="text-slate-400 font-normal">/mo</span>
            </Typography>
          </div>
          <div>
            <Typography
              variant="caption"
              className="text-slate-400 uppercase tracking-wider"
            >
              Cash on Cash
            </Typography>
            <Typography
              variant="body"
              weight="bold"
              className={cn(
                'tabular-nums',
                isPositive ? 'text-emerald-600' : 'text-rose-500',
              )}
            >
              {grossIncome > 0
                ? `${((cashFlow / grossIncome) * 100).toFixed(1)}%`
                : '--'}
            </Typography>
          </div>
        </div>
      </div>
    </Card>
  )
}
