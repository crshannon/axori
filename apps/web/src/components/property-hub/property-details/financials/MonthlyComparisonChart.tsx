import { useMemo, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, Typography, cn } from '@axori/ui'
import { useMonthlyMetrics } from '@/hooks/computed/useMonthlyMetrics'
import { useDailyMetrics } from '@/hooks/computed/useDailyMetrics'

interface MonthlyComparisonChartProps {
  propertyId: string
  monthsCount?: number
}

type TimePeriod = 1 | 3 | 12

/**
 * MonthlyComparisonChart component - Displays projected vs actual cash flow over time
 *
 * Features:
 * - Projected baseline (area chart, subtle)
 * - Actual data points (line chart, emphasized)
 * - Variance visualization (color-coded)
 * - Time range selector (1 month, 3 months, 1 year)
 * - Month drill-down (on click)
 */
export const MonthlyComparisonChart = ({
  propertyId,
  monthsCount: initialMonthsCount,
}: MonthlyComparisonChartProps) => {
  // Default to 3 months, but allow prop override for initial state
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(
    (initialMonthsCount === 1 ||
    initialMonthsCount === 3 ||
    initialMonthsCount === 12
      ? initialMonthsCount
      : 3) as TimePeriod,
  )
  const monthsCount = selectedPeriod

  // Use daily metrics for 1M and 3M, monthly for 1Y
  const useDailyView = selectedPeriod === 1 || selectedPeriod === 3
  const daysCount = selectedPeriod === 1 ? 30 : selectedPeriod === 3 ? 90 : 0

  const monthlyMetrics = useMonthlyMetrics(
    propertyId,
    useDailyView ? 0 : monthsCount,
  )
  const dailyMetrics = useDailyMetrics(propertyId, daysCount)

  const data = useDailyView ? dailyMetrics.days : monthlyMetrics.months
  const hasProjectedData = useDailyView
    ? dailyMetrics.hasProjectedData
    : monthlyMetrics.hasProjectedData
  const hasActualData = useDailyView
    ? dailyMetrics.hasActualData
    : monthlyMetrics.hasActualData

  // Format month for display (e.g., "2025-01" -> "Jan")
  const formatMonth = (monthStr: string): string => {
    const [, month] = monthStr.split('-')
    const date = new Date(2000, parseInt(month, 10) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'short' })
  }

  // Format date for display (e.g., "2025-01-15" -> "Jan 15" or "15" for daily view)
  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (useDailyView) {
      // For daily view, show day of month (e.g., "15")
      return String(day)
    }
    return date.toLocaleDateString('en-US', { month: 'short' })
  }

  // Format Y-axis values - only use "k" notation for values >= 1000
  const formatYAxisValue = (value: number): string => {
    const absValue = Math.abs(value)
    if (absValue >= 1000) {
      const kValue = value / 1000
      // Round to 1 decimal place if needed
      const rounded = Math.round(kValue * 10) / 10
      return `$${rounded}k`
    }
    // For smaller values, show the full number
    return `$${Math.round(value).toLocaleString()}`
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    if (useDailyView) {
      return dailyMetrics.days.map((day, index) => {
        const [year, month, dayNum] = day.date.split('-').map(Number)
        const date = new Date(year, month - 1, dayNum)
        // Show month label on first day of month or every 7 days for better readability
        const isFirstOfMonth = dayNum === 1
        const showMonthLabel = isFirstOfMonth || (index > 0 && index % 7 === 0)
        const dateLabel = showMonthLabel
          ? `${date.toLocaleDateString('en-US', { month: 'short' })} ${dayNum}`
          : String(dayNum)
        return {
          date: dateLabel,
          dateFull: day.date, // Keep full date for reference
          projected: day.projected?.cashFlow ?? null,
          actual: day.actual?.cashFlow ?? null,
          variance: day.variance?.cashFlow ?? null,
          variancePercent: day.variance?.cashFlowPercent ?? null,
        }
      })
    } else {
      return monthlyMetrics.months.map((month) => {
        const [, monthNum] = month.month.split('-')
        const date = new Date(2000, parseInt(monthNum, 10) - 1, 1)
        return {
          date: date.toLocaleDateString('en-US', { month: 'short' }),
          dateFull: month.month, // Keep full month for reference
          projected: month.projected?.cashFlow ?? null,
          actual: month.actual?.cashFlow ?? null,
          variance: month.variance?.cashFlow ?? null,
          variancePercent: month.variance?.cashFlowPercent ?? null,
        }
      })
    }
  }, [dailyMetrics.days, monthlyMetrics.months, useDailyView])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0].payload
    const projected = data.projected ?? null
    const actual = data.actual ?? null
    const variance = data.variance ?? null

    // Format date for tooltip
    const formatTooltipDate = (dateStr: string) => {
      if (useDailyView) {
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
      const [year, month] = dateStr.split('-').map(Number)
      const date = new Date(year, month - 1, 1)
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    }

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 shadow-lg">
        <Typography
          variant="caption"
          className="text-slate-500 dark:text-slate-400 mb-2 block"
        >
          {formatTooltipDate(data.dateFull)}
        </Typography>
        {projected !== null && (
          <div className="mb-1">
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-300"
            >
              Projected:{' '}
              <span className="font-bold">
                ${Math.round(projected).toLocaleString()}
              </span>
            </Typography>
          </div>
        )}
        {actual !== null && (
          <div className="mb-1">
            <Typography
              variant="body-sm"
              className="text-slate-900 dark:text-white"
            >
              Actual:{' '}
              <span className="font-bold">
                ${Math.round(actual).toLocaleString()}
              </span>
            </Typography>
          </div>
        )}
        {variance !== null && (
          <div>
            <Typography
              variant="body-sm"
              className={
                variance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-500 dark:text-rose-400'
              }
            >
              Variance:{' '}
              <span className="font-bold">
                {variance >= 0 ? '+' : ''}
                {Math.round(variance).toLocaleString()} (
                {data.variancePercent !== null
                  ? `${variance >= 0 ? '+' : ''}${data.variancePercent.toFixed(1)}%`
                  : 'N/A'}
                )
              </span>
            </Typography>
          </div>
        )}
      </div>
    )
  }

  // Empty state: no data
  if (!hasProjectedData && !hasActualData) {
    return (
      <Card variant="rounded" padding="lg" radius="xl">
        <div className="py-12 text-center">
          <Typography variant="h5" className="mb-2">
            Monthly Comparison
          </Typography>
          <Typography variant="body-sm" className="text-slate-500">
            No financial data available. Add property income and expenses to see
            monthly trends.
          </Typography>
        </div>
      </Card>
    )
  }

  // Empty state: projected only, <3 months of actuals (only for monthly view)
  const actualDataPointsCount = useDailyView
    ? dailyMetrics.days.filter((d) => d.actual !== null).length
    : monthlyMetrics.months.filter((m) => m.actual !== null).length
  const showEmptyState =
    !useDailyView && hasProjectedData && actualDataPointsCount < 3

  const timePeriods: Array<{ value: TimePeriod; label: string }> = [
    { value: 1, label: '1M' },
    { value: 3, label: '3M' },
    { value: 12, label: '1Y' },
  ]

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Typography variant="h5" className="mb-1">
              Monthly Comparison
            </Typography>
            <Typography variant="overline" className="text-slate-400">
              Projected vs Actual Cash Flow
            </Typography>
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

        {/* Empty state message */}
        {showEmptyState && (
          <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 border border-slate-200 dark:border-white/10">
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-400"
            >
              Track actuals over time to see how your property performs against
              expectations.
            </Typography>
          </div>
        )}

        {/* Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-slate-200 dark:stroke-white/10"
              />
              <XAxis
                dataKey="date"
                className="text-xs text-slate-500 dark:text-slate-400"
                tick={{ fill: 'currentColor' }}
                angle={useDailyView ? -45 : 0}
                textAnchor={useDailyView ? 'end' : 'middle'}
                height={useDailyView ? 60 : 30}
                interval={useDailyView ? 'preserveStartEnd' : 0}
              />
              <YAxis
                className="text-xs text-slate-500 dark:text-slate-400"
                tick={{ fill: 'currentColor' }}
                tickFormatter={formatYAxisValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                formatter={(value) => (
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {value}
                  </span>
                )}
              />

              {/* Projected baseline (area chart) */}
              {hasProjectedData && (
                <Area
                  type="monotone"
                  dataKey="projected"
                  name="Projected"
                  fill="rgba(16, 185, 129, 0.1)"
                  stroke="rgba(16, 185, 129, 0.3)"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  fillOpacity={0.1}
                />
              )}

              {/* Actual data points (line chart) */}
              {hasActualData && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend/Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            {hasProjectedData && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-emerald-400/30 border-dashed border border-emerald-400/50" />
                <span>Projected</span>
              </div>
            )}
            {hasActualData && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Actual</span>
              </div>
            )}
          </div>
          <Typography variant="overline" className="text-slate-400">
            {monthsCount === 1
              ? 'Last month'
              : monthsCount === 12
                ? 'Last year'
                : `Trailing ${monthsCount} months`}
          </Typography>
        </div>
      </div>
    </Card>
  )
}
