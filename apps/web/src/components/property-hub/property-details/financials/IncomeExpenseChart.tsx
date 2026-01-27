import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, Typography, cn } from '@axori/ui'
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
 * - Clean summary row
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
    const totalIncome = chartData.reduce((sum, m) => sum + m.income, 0)
    const totalExpenses = chartData.reduce((sum, m) => sum + m.expenses, 0)
    const netTotal = totalIncome - totalExpenses

    return {
      totalIncome,
      totalExpenses,
      netTotal,
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
            <span className="text-sm text-emerald-500">Income</span>
            <span className="text-sm font-bold tabular-nums text-emerald-500">
              ${data.income.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-rose-500">Expenses</span>
            <span className="text-sm font-bold tabular-nums text-rose-500">
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
                  'text-sm font-bold tabular-nums',
                  data.net >= 0 ? 'text-emerald-500' : 'text-rose-500',
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
        <Typography variant="h5" className="mb-4">
          Income vs Expenses
        </Typography>
        <Typography
          variant="body-sm"
          className="text-slate-500 dark:text-slate-400"
        >
          No transaction data available. Add income and expense transactions to
          see trends.
        </Typography>
      </Card>
    )
  }

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h5">Income vs Expenses</Typography>
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
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
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

      {/* Summary Row */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-400"
            >
              Income
            </Typography>
            <Typography
              variant="body-sm"
              weight="bold"
              className="tabular-nums text-emerald-500"
            >
              {formatCurrency(summary.totalIncome)}
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-rose-500" />
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-400"
            >
              Expenses
            </Typography>
            <Typography
              variant="body-sm"
              weight="bold"
              className="tabular-nums text-rose-500"
            >
              {formatCurrency(summary.totalExpenses)}
            </Typography>
          </div>
        </div>
        <div className="text-right">
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400 block"
          >
            Net
          </Typography>
          <Typography
            variant="h4"
            className={cn(
              'tabular-nums',
              summary.netTotal >= 0 ? 'text-emerald-500' : 'text-rose-500',
            )}
          >
            {summary.netTotal >= 0 ? '+' : ''}
            {formatCurrency(summary.netTotal)}
          </Typography>
        </div>
      </div>
    </Card>
  )
}
