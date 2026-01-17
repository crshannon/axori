import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, Typography } from '@axori/ui'
import { useMonthlyMetrics } from '@/hooks/computed/useMonthlyMetrics'

interface MonthlyComparisonChartProps {
  propertyId: string
  monthsCount?: number
}

/**
 * MonthlyComparisonChart component - Displays projected vs actual cash flow over time
 * 
 * Features:
 * - Projected baseline (area chart, subtle)
 * - Actual data points (line chart, emphasized)
 * - Variance visualization (color-coded)
 * - Time range selector (trailing 12 months default)
 * - Month drill-down (on click)
 */
export const MonthlyComparisonChart = ({
  propertyId,
  monthsCount = 12,
}: MonthlyComparisonChartProps) => {
  const { months, hasProjectedData, hasActualData } =
    useMonthlyMetrics(propertyId, monthsCount)

  // Format month for display (e.g., "2025-01" -> "Jan")
  const formatMonth = (monthStr: string): string => {
    const [, month] = monthStr.split('-')
    const date = new Date(2000, parseInt(month, 10) - 1, 1)
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
  const chartData = months.map((month) => ({
    month: formatMonth(month.month),
    monthFull: month.month, // Keep full month for reference
    projected: month.projected?.cashFlow ?? null,
    actual: month.actual?.cashFlow ?? null,
    variance: month.variance?.cashFlow ?? null,
    variancePercent: month.variance?.cashFlowPercent ?? null,
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload[0].payload
    const projected = data.projected ?? null
    const actual = data.actual ?? null
    const variance = data.variance ?? null

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3 shadow-lg">
        <Typography
          variant="caption"
          className="text-slate-500 dark:text-slate-400 mb-2 block"
        >
          {data.monthFull}
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

  // Empty state: projected only, <3 months of actuals
  const actualMonthsCount = months.filter((m) => m.actual !== null).length
  const showEmptyState = hasProjectedData && actualMonthsCount < 3

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Typography variant="h5" className="mb-1">
            Monthly Comparison
          </Typography>
          <Typography variant="overline" className="text-slate-400">
            Projected vs Actual Cash Flow
          </Typography>
        </div>

        {/* Empty state message */}
        {showEmptyState && (
          <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-4 border border-slate-200 dark:border-white/10">
            <Typography variant="body-sm" className="text-slate-600 dark:text-slate-400">
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
                dataKey="month"
                className="text-xs text-slate-500 dark:text-slate-400"
                tick={{ fill: 'currentColor' }}
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
            Trailing {monthsCount} months
          </Typography>
        </div>
      </div>
    </Card>
  )
}

