import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, Overline, Typography, cn } from '@axori/ui'
import {
  AlertCircle,
  DollarSign,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useMonthlyMetrics } from '@/hooks/computed/useMonthlyMetrics'

interface CashFlowPerformanceChartProps {
  propertyId: string
}

type TimePeriod = 3 | 6 | 12

/**
 * CashFlowPerformanceChart - Shows net cash flow trend over time
 *
 * Features:
 * - Area chart showing net cash flow (green above 0, red below)
 * - Break-even reference line at $0
 * - Time range selector (3M, 6M, 1Y)
 * - Summary: Average monthly cash flow, best/worst month
 * - Trend indicator comparing recent vs previous periods
 */
export const CashFlowPerformanceChart = ({
  propertyId,
}: CashFlowPerformanceChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(6)

  const { months, hasActualData } = useMonthlyMetrics(
    propertyId,
    selectedPeriod,
  )

  // Prepare chart data from actual transactions
  const chartData = useMemo(() => {
    return months.map((month) => {
      const [year, monthNum] = month.month.split('-')
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      const income = month.actual?.income ?? 0
      const expenses = month.actual?.expenses ?? 0
      const cashFlow = income - expenses

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        monthFull: month.month,
        cashFlow,
        income,
        expenses,
        // Split cash flow into positive and negative for visualization
        positive: cashFlow >= 0 ? cashFlow : 0,
        negative: cashFlow < 0 ? cashFlow : 0,
      }
    })
  }, [months])

  // Calculate summary stats
  const summary = useMemo(() => {
    const monthsWithData = chartData.filter(
      (m) => m.income > 0 || m.expenses > 0,
    )
    const avgCashFlow =
      monthsWithData.length > 0
        ? monthsWithData.reduce((sum, m) => sum + m.cashFlow, 0) /
          monthsWithData.length
        : 0

    // Find best and worst months
    const sortedByFlow = [...monthsWithData].sort(
      (a, b) => b.cashFlow - a.cashFlow,
    )
    const bestMonth = sortedByFlow.length > 0 ? sortedByFlow[0] : null
    const worstMonth =
      sortedByFlow.length > 0 ? sortedByFlow[sortedByFlow.length - 1] : null

    // Count positive vs negative months
    const positiveMonths = monthsWithData.filter((m) => m.cashFlow >= 0).length
    const negativeMonths = monthsWithData.filter((m) => m.cashFlow < 0).length

    // Calculate trend (compare last 3 months average to previous 3 months)
    const recentMonths = monthsWithData.slice(-3)
    const previousMonths = monthsWithData.slice(-6, -3)

    const recentAvg =
      recentMonths.length > 0
        ? recentMonths.reduce((sum, m) => sum + m.cashFlow, 0) /
          recentMonths.length
        : 0
    const previousAvg =
      previousMonths.length > 0
        ? previousMonths.reduce((sum, m) => sum + m.cashFlow, 0) /
          previousMonths.length
        : recentAvg

    const trend =
      previousAvg === 0
        ? 0
        : ((recentAvg - previousAvg) / Math.abs(previousAvg)) * 100

    // Calculate data coverage
    const dataMonths = monthsWithData.length
    const requestedMonths = chartData.length
    const isSparseData = dataMonths < requestedMonths / 2 // Less than half the months have data

    return {
      avgCashFlow,
      bestMonth,
      worstMonth,
      positiveMonths,
      negativeMonths,
      trend,
      totalMonths: dataMonths,
      requestedMonths,
      isSparseData,
    }
  }, [chartData])

  // Format currency for display
  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value)
    if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`
    }
    return `$${Math.round(value).toLocaleString()}`
  }

  // Format month name
  const formatMonthName = (monthFull: string): string => {
    const [year, monthNum] = monthFull.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'short' })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0].payload
    const [year, monthNum] = data.monthFull.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 shadow-lg">
        <Typography
          variant="caption"
          className="text-slate-500 dark:text-slate-400 mb-2 block"
        >
          {formattedDate}
        </Typography>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Net Cash Flow
            </span>
            <span
              className={cn(
                'text-sm font-bold',
                data.cashFlow >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-500 dark:text-rose-400',
              )}
            >
              {data.cashFlow >= 0 ? '+' : ''}${data.cashFlow.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-slate-200 dark:border-white/10 pt-1 mt-1">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400">
                Income
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                ${data.income.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-rose-500 dark:text-rose-400">Expenses</span>
              <span className="text-rose-500 dark:text-rose-400">
                ${data.expenses.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const timePeriods: Array<{ value: TimePeriod; label: string }> = [
    { value: 3, label: '3M' },
    { value: 6, label: '6M' },
    { value: 12, label: '1Y' },
  ]

  // Empty state
  if (!hasActualData) {
    return (
      <Card variant="rounded" padding="lg" radius="xl">
        <div className="py-12 text-center">
          <Typography variant="h5" className="mb-2">
            Cash Flow Performance
          </Typography>
          <Typography variant="body-sm" className="text-slate-500">
            No transaction data available. Add income and expense transactions
            to see cash flow trends.
          </Typography>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Typography variant="h5" className="mb-1">
              Cash Flow Performance
            </Typography>
            <div className="flex items-center gap-2">
              <Overline className="text-slate-400">
                {selectedPeriod === 12
                  ? 'Last 12 months'
                  : `Last ${selectedPeriod} months`}
              </Overline>
              {summary.trend !== 0 && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                    summary.trend > 0
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : summary.trend < 0
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400',
                  )}
                >
                  {summary.trend > 0 ? (
                    <TrendingUp size={12} />
                  ) : summary.trend < 0 ? (
                    <TrendingDown size={12} />
                  ) : (
                    <Minus size={12} />
                  )}
                  <span>
                    {summary.trend > 0 ? '+' : ''}
                    {summary.trend.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Time Period Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-1">
            {timePeriods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  selectedPeriod === period.value
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign
                size={14}
                className="text-slate-500 dark:text-slate-400"
              />
              <Overline className="text-slate-600 dark:text-slate-400">
                Avg Monthly
              </Overline>
            </div>
            <Typography
              variant="h4"
              className={cn(
                'font-black tabular-nums',
                summary.avgCashFlow >= 0
                  ? 'text-slate-900 dark:text-white'
                  : 'text-amber-600 dark:text-amber-400',
              )}
            >
              {summary.avgCashFlow >= 0 ? '+' : ''}
              {formatCurrency(summary.avgCashFlow)}
            </Typography>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4">
            <Overline className="text-emerald-600 dark:text-emerald-400 mb-1">
              Best Month
            </Overline>
            {summary.bestMonth ? (
              <>
                <Typography
                  variant="h4"
                  className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums"
                >
                  +{formatCurrency(summary.bestMonth.cashFlow)}
                </Typography>
                <Typography
                  variant="caption"
                  className="text-emerald-600/70 dark:text-emerald-400/70"
                >
                  {formatMonthName(summary.bestMonth.monthFull)}
                </Typography>
              </>
            ) : (
              <Typography
                variant="body-sm"
                className="text-emerald-600 dark:text-emerald-400"
              >
                --
              </Typography>
            )}
          </div>
          <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-4">
            <Overline className="text-rose-600 dark:text-rose-400 mb-1">
              Worst Month
            </Overline>
            {summary.worstMonth ? (
              <>
                <Typography
                  variant="h4"
                  className="text-rose-600 dark:text-rose-400 font-black tabular-nums"
                >
                  {summary.worstMonth.cashFlow >= 0 ? '+' : ''}
                  {formatCurrency(summary.worstMonth.cashFlow)}
                </Typography>
                <Typography
                  variant="caption"
                  className="text-rose-600/70 dark:text-rose-400/70"
                >
                  {formatMonthName(summary.worstMonth.monthFull)}
                </Typography>
              </>
            ) : (
              <Typography
                variant="body-sm"
                className="text-rose-600 dark:text-rose-400"
              >
                --
              </Typography>
            )}
          </div>
        </div>

        {/* Sparse data indicator */}
        {summary.isSparseData && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
            <AlertCircle
              size={14}
              className="text-amber-600 dark:text-amber-400 flex-shrink-0"
            />
            <Typography
              variant="caption"
              className="text-amber-700 dark:text-amber-300"
            >
              Limited data: Only {summary.totalMonths} of{' '}
              {summary.requestedMonths} months have transactions
            </Typography>
          </div>
        )}

        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="positiveGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="negativeGradient"
                  x1="0"
                  y1="1"
                  x2="0"
                  y2="0"
                >
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-slate-200 dark:stroke-white/10"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={0}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{
                  value: 'Break-even',
                  position: 'right',
                  className: 'text-xs fill-slate-400',
                }}
              />
              <Area
                type="monotone"
                dataKey="positive"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray={summary.isSparseData ? '5 5' : undefined}
                fill="url(#positiveGradient)"
                dot={
                  summary.isSparseData
                    ? { fill: '#10b981', r: 4, strokeWidth: 0 }
                    : false
                }
              />
              <Area
                type="monotone"
                dataKey="negative"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray={summary.isSparseData ? '5 5' : undefined}
                fill="url(#negativeGradient)"
                dot={
                  summary.isSparseData
                    ? { fill: '#f43f5e', r: 4, strokeWidth: 0 }
                    : false
                }
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {summary.positiveMonths} month
                {summary.positiveMonths !== 1 ? 's' : ''} positive
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>
                {summary.negativeMonths} month
                {summary.negativeMonths !== 1 ? 's' : ''} negative
              </span>
            </div>
          </div>
          <span>
            {summary.totalMonths > 0
              ? `${((summary.positiveMonths / summary.totalMonths) * 100).toFixed(0)}% success rate`
              : 'No data'}
          </span>
        </div>
      </div>
    </Card>
  )
}
