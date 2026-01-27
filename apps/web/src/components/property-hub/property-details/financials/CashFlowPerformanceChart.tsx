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
import { Card, Typography, cn } from '@axori/ui'
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
 * - Clean summary row
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

    // Count positive vs negative months
    const positiveMonths = monthsWithData.filter((m) => m.cashFlow >= 0).length
    const negativeMonths = monthsWithData.filter((m) => m.cashFlow < 0).length
    const totalMonths = monthsWithData.length

    return {
      avgCashFlow,
      positiveMonths,
      negativeMonths,
      totalMonths,
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
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Net Cash Flow
            </span>
            <span
              className={cn(
                'text-sm font-bold tabular-nums',
                data.cashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {data.cashFlow >= 0 ? '+' : ''}${data.cashFlow.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-slate-200 dark:border-white/10 pt-1 mt-1">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-emerald-500">Income</span>
              <span className="tabular-nums text-emerald-500">
                ${data.income.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-rose-500">Expenses</span>
              <span className="tabular-nums text-rose-500">
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
        <Typography variant="h5" className="mb-4">
          Cash Flow Performance
        </Typography>
        <Typography
          variant="body-sm"
          className="text-slate-500 dark:text-slate-400"
        >
          No transaction data available. Add income and expense transactions to
          see cash flow trends.
        </Typography>
      </Card>
    )
  }

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h5">Cash Flow Performance</Typography>
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

      {/* Chart */}
      <div className="h-48 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="1" x2="0" y2="0">
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
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="positive"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#positiveGradient)"
            />
            <Area
              type="monotone"
              dataKey="negative"
              stroke="#f43f5e"
              strokeWidth={2}
              fill="url(#negativeGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Row */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-400"
            >
              {summary.positiveMonths} positive
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-400"
            >
              {summary.negativeMonths} negative
            </Typography>
          </div>
        </div>
        <div className="text-right">
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400 block"
          >
            Avg Monthly
          </Typography>
          <Typography
            variant="h4"
            className={cn(
              'tabular-nums',
              summary.avgCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500',
            )}
          >
            {summary.avgCashFlow >= 0 ? '+' : ''}
            {formatCurrency(summary.avgCashFlow)}
          </Typography>
        </div>
      </div>
    </Card>
  )
}
