import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, Overline, Typography, cn } from '@axori/ui'
import { AlertCircle, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useMonthlyMetrics } from '@/hooks/computed/useMonthlyMetrics'

interface IncomeExpenseChartProps {
  propertyId: string
}

type TimePeriod = 3 | 6 | 12

/**
 * IncomeExpenseChart - Shows income vs expenses breakdown over time
 *
 * Features:
 * - Grouped bar chart: Income (green) vs Expenses (red)
 * - Time range selector (3M, 6M, 1Y)
 * - Summary stats: Total income, total expenses, net
 * - Trend indicator
 */
export const IncomeExpenseChart = ({ propertyId }: IncomeExpenseChartProps) => {
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
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        monthFull: month.month,
        income: month.actual?.income ?? 0,
        expenses: month.actual?.expenses ?? 0,
        net: (month.actual?.income ?? 0) - (month.actual?.expenses ?? 0),
      }
    })
  }, [months])

  // Calculate summary stats
  const summary = useMemo(() => {
    // Only count months with actual data for accurate averages
    const monthsWithData = chartData.filter(
      (m) => m.income > 0 || m.expenses > 0,
    )
    const totalIncome = chartData.reduce((sum, m) => sum + m.income, 0)
    const totalExpenses = chartData.reduce((sum, m) => sum + m.expenses, 0)
    const netTotal = totalIncome - totalExpenses
    const avgMonthlyNet =
      monthsWithData.length > 0 ? netTotal / monthsWithData.length : 0

    // Calculate trend (compare last 3 months average to previous 3 months)
    const recentMonths = monthsWithData.slice(-3)
    const previousMonths = monthsWithData.slice(-6, -3)

    const recentAvg =
      recentMonths.length > 0
        ? recentMonths.reduce((sum, m) => sum + m.net, 0) / recentMonths.length
        : 0
    const previousAvg =
      previousMonths.length > 0
        ? previousMonths.reduce((sum, m) => sum + m.net, 0) /
          previousMonths.length
        : recentAvg

    const trend =
      previousAvg === 0
        ? 0
        : ((recentAvg - previousAvg) / Math.abs(previousAvg)) * 100

    // Calculate data coverage
    const dataMonths = monthsWithData.length
    const totalMonths = chartData.length
    const isSparseData = dataMonths < totalMonths / 2 // Less than half the months have data

    return {
      totalIncome,
      totalExpenses,
      netTotal,
      avgMonthlyNet,
      trend,
      dataMonths,
      totalMonths,
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
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              Income
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ${data.income.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-rose-500 dark:text-rose-400">
              Expenses
            </span>
            <span className="text-sm font-bold text-rose-500 dark:text-rose-400">
              ${data.expenses.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-slate-200 dark:border-white/10 pt-1 mt-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Net
              </span>
              <span
                className={cn(
                  'text-sm font-bold',
                  data.net >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400',
                )}
              >
                {data.net >= 0 ? '+' : ''}${data.net.toLocaleString()}
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
            Income vs Expenses
          </Typography>
          <Typography variant="body-sm" className="text-slate-500">
            No transaction data available. Add income and expense transactions
            to see trends.
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
              Income vs Expenses
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
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4">
            <Overline className="text-emerald-600 dark:text-emerald-400 mb-1">
              Total Income
            </Overline>
            <Typography
              variant="h4"
              className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums"
            >
              {formatCurrency(summary.totalIncome)}
            </Typography>
          </div>
          <div className="bg-rose-50 dark:bg-rose-500/10 rounded-xl p-4">
            <Overline className="text-rose-600 dark:text-rose-400 mb-1">
              Total Expenses
            </Overline>
            <Typography
              variant="h4"
              className="text-rose-600 dark:text-rose-400 font-black tabular-nums"
            >
              {formatCurrency(summary.totalExpenses)}
            </Typography>
          </div>
          <div
            className={cn(
              'rounded-xl p-4',
              summary.netTotal >= 0
                ? 'bg-slate-100 dark:bg-white/5'
                : 'bg-amber-50 dark:bg-amber-500/10',
            )}
          >
            <Overline
              className={cn(
                'mb-1',
                summary.netTotal >= 0
                  ? 'text-slate-600 dark:text-slate-400'
                  : 'text-amber-600 dark:text-amber-400',
              )}
            >
              Net Total
            </Overline>
            <Typography
              variant="h4"
              className={cn(
                'font-black tabular-nums',
                summary.netTotal >= 0
                  ? 'text-slate-900 dark:text-white'
                  : 'text-amber-600 dark:text-amber-400',
              )}
            >
              {summary.netTotal >= 0 ? '+' : ''}
              {formatCurrency(summary.netTotal)}
            </Typography>
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
              Limited data: Only {summary.dataMonths} of {summary.totalMonths}{' '}
              months have transactions
            </Typography>
          </div>
        )}

        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Striped pattern for empty months */}
                <pattern
                  id="incomePattern"
                  patternUnits="userSpaceOnUse"
                  width="4"
                  height="4"
                >
                  <path
                    d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
                    stroke="#10b981"
                    strokeWidth="0.5"
                    strokeOpacity="0.3"
                  />
                </pattern>
                <pattern
                  id="expensePattern"
                  patternUnits="userSpaceOnUse"
                  width="4"
                  height="4"
                >
                  <path
                    d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
                    stroke="#f43f5e"
                    strokeWidth="0.5"
                    strokeOpacity="0.3"
                  />
                </pattern>
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
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="rect"
                formatter={(value) => (
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer with data coverage */}
        {summary.isSparseData && (
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Showing {summary.dataMonths} month{summary.dataMonths !== 1 && 's'}{' '}
            of data • Averages calculated from months with transactions only
          </div>
        )}
      </div>
    </Card>
  )
}
