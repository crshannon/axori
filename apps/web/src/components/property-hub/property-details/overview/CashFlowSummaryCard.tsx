import { Card, Overline, Typography, cn } from '@axori/ui'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { useFinancialPulse } from '@/hooks/computed/useFinancialPulse'
import { useMonthlyMetrics } from '@/hooks/computed/useMonthlyMetrics'

interface CashFlowSummaryCardProps {
  propertyId: string
}

/**
 * Minimal cash flow summary card for the property overview
 *
 * Shows:
 * - Monthly cash flow (large, primary metric)
 * - Trend indicator (vs previous period)
 * - Data source label
 * - Link to financials tab for details
 */
export const CashFlowSummaryCard = ({
  propertyId,
}: CashFlowSummaryCardProps) => {
  const navigate = useNavigate()
  const metrics = useFinancialPulse(propertyId)
  const { months } = useMonthlyMetrics(propertyId, 6)

  // Primary value: prefer actual, fallback to projected
  const cashFlow = metrics.actualCashFlow ?? metrics.projectedCashFlow ?? 0
  const isPositive = cashFlow >= 0
  const dataSource = metrics.hasActualData
    ? 'From transactions'
    : metrics.hasProjectedData
      ? 'Projected'
      : null

  // Calculate trend from monthly metrics (compare recent 3 months to previous 3)
  const monthsWithData = months.filter(
    (m) => m.actual !== null && (m.actual.income > 0 || m.actual.expenses > 0),
  )
  const recentMonths = monthsWithData.slice(-3)
  const previousMonths = monthsWithData.slice(-6, -3)

  let trendPercent: number | null = null
  let trendDirection: 'up' | 'down' | 'flat' = 'flat'

  if (recentMonths.length > 0 && previousMonths.length > 0) {
    const recentAvg =
      recentMonths.reduce((sum, m) => sum + (m.actual?.cashFlow ?? 0), 0) /
      recentMonths.length
    const previousAvg =
      previousMonths.reduce((sum, m) => sum + (m.actual?.cashFlow ?? 0), 0) /
      previousMonths.length

    if (previousAvg !== 0) {
      trendPercent = ((recentAvg - previousAvg) / Math.abs(previousAvg)) * 100
      trendDirection =
        trendPercent > 2 ? 'up' : trendPercent < -2 ? 'down' : 'flat'
    }
  }

  // Format currency
  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value)
    const formatted =
      absValue >= 1000
        ? `$${(absValue / 1000).toFixed(1)}k`
        : `$${Math.round(absValue).toLocaleString()}`
    return value >= 0 ? `+${formatted}` : `-${formatted.replace('$', '$')}`
  }

  const handleViewDetails = () => {
    navigate({ to: `/property-hub/${propertyId}/financials` })
  }

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleViewDetails}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                isPositive ? 'bg-emerald-500' : 'bg-rose-500',
              )}
            />
            <Overline className="text-slate-500 dark:text-slate-400">
              Monthly Cash Flow
            </Overline>
          </div>
          {trendDirection !== 'flat' && trendPercent !== null && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
                trendDirection === 'up'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300',
              )}
            >
              {trendDirection === 'up' ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>
                {trendPercent >= 0 ? '+' : ''}
                {trendPercent.toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Cash Flow Value */}
        <Typography
          as="div"
          className={cn(
            'text-4xl font-black tabular-nums tracking-tight',
            isPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400',
          )}
        >
          {formatCurrency(cashFlow)}
        </Typography>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
          {dataSource && (
            <Typography
              variant="caption"
              className="text-slate-400 dark:text-slate-500"
            >
              {dataSource}
            </Typography>
          )}
          <div className="flex items-center gap-1 text-violet-600 dark:text-[#E8FF4D] text-xs font-semibold">
            <span>View Details</span>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </Card>
  )
}
