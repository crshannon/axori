import { Card, Typography, cn } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { useFinancialPulse } from '@/hooks/computed/useFinancialPulse'
import { getFinancialPulseSnippets } from '@/data/learning-hub/financials-snippets'

interface FinancialPulseProps {
  propertyId: string
}

/**
 * FinancialPulse component - Financial health snapshot
 *
 * Shows key metrics: Monthly Cash Flow, Gross Income, OPEX + Debt
 * With expense breakdown bar visualization and colored metric cards.
 */
export const FinancialPulse = ({ propertyId }: FinancialPulseProps) => {
  const metrics = useFinancialPulse(propertyId)

  // Primary value: prefer actual, fallback to projected
  const cashFlow = metrics.actualCashFlow ?? metrics.projectedCashFlow ?? 0
  const isPositive = cashFlow >= 0
  const dataSource = metrics.hasActualData
    ? 'LIVE_INGEST_TXS'
    : metrics.hasProjectedData
      ? 'PROJECTED'
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
        ? `$${(absValue / 1000).toFixed(absValue >= 10000 ? 0 : 1)}k`
        : `$${Math.round(absValue).toLocaleString()}`
    if (showSign && value !== 0) {
      return value >= 0 ? `+${formatted}` : `-${formatted.replace('$', '$')}`
    }
    return value < 0 ? `-${formatted}` : formatted
  }

  // Variance indicator
  const variance = metrics.variance
  const variancePercent = metrics.variancePercent

  // Expense breakdown percentages
  const opexPercent =
    totalExpenses > 0 ? (metrics.totalFixedExpenses / totalExpenses) * 100 : 0
  const debtPercent =
    totalExpenses > 0 ? (metrics.totalDebtService / totalExpenses) * 100 : 0

  return (
    <Card variant="rounded" padding="lg" radius="xl" className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
          <Typography
            variant="h6"
            className="uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Financial Pulse
          </Typography>
          <LearningHubButton
            snippets={getFinancialPulseSnippets()}
            title="Financial Pulse"
            subtitle="Cash Flow & Expense Analysis"
            componentKey="financial-pulse"
          />
        </div>
        {dataSource && (
          <span
            className={cn(
              'px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border',
              dataSource === 'LIVE_INGEST_TXS'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20',
            )}
          >
            {dataSource === 'LIVE_INGEST_TXS' ? 'Live_Node: 100%' : dataSource}
          </span>
        )}
      </div>

      {/* Main Metrics Grid - with colored cards like AI Studio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Monthly Net Flow - Primary highlight card */}
        <div
          className={cn(
            'p-6 rounded-3xl border transition-all hover:scale-[1.02]',
            isPositive
              ? 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10'
              : 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10',
          )}
        >
          <Typography
            variant="caption"
            className={cn(
              'uppercase tracking-widest block mb-3 opacity-80',
              isPositive ? 'text-emerald-500' : 'text-rose-500',
            )}
          >
            Monthly Net Flow
          </Typography>
          <Typography
            variant="h1"
            className={cn(
              'tabular-nums tracking-tighter',
              isPositive ? 'text-emerald-500' : 'text-rose-500',
            )}
          >
            {formatCurrency(cashFlow, true)}
          </Typography>
          {variance !== null && variancePercent !== null && (
            <Typography
              variant="caption"
              className={cn(
                'mt-3 block uppercase tracking-wider',
                variance >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60',
              )}
            >
              {variance >= 0 ? '↑' : '↓'} {Math.abs(variancePercent).toFixed(0)}
              % vs proj
            </Typography>
          )}
        </div>

        {/* Gross Income - Neutral card */}
        <div className="p-6 rounded-3xl bg-slate-500/5 border border-slate-500/5 dark:border-white/5">
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3 opacity-60"
          >
            Gross Income
          </Typography>
          <Typography
            variant="h2"
            className="tabular-nums text-slate-900 dark:text-white tracking-tighter"
          >
            {formatCurrency(grossIncome)}
          </Typography>
          <Typography
            variant="caption"
            className="text-slate-400 dark:text-slate-500 mt-3 block uppercase tracking-wider opacity-40"
          >
            Collections
          </Typography>
        </div>

        {/* OPEX + Debt - Rose accent */}
        <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10">
          <Typography
            variant="caption"
            className="text-rose-500 uppercase tracking-widest block mb-3 opacity-80"
          >
            OpEx + Debt
          </Typography>
          <Typography
            variant="h2"
            className="tabular-nums text-rose-500 tracking-tighter"
          >
            {formatCurrency(totalExpenses)}
          </Typography>
          <Typography
            variant="caption"
            className="text-rose-500/60 mt-3 block uppercase tracking-wider"
          >
            Liquidity Drain
          </Typography>
        </div>
      </div>

      {/* Expense Breakdown Bar */}
      <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-white/5">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-50">
          <span>Expense Breakdown</span>
          <span>
            OpEx: {opexPercent.toFixed(0)}% • Debt: {debtPercent.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
          {totalExpenses > 0 && (
            <>
              <div
                className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                style={{ width: `${opexPercent}%` }}
              />
              <div
                className="h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                style={{ width: `${debtPercent}%` }}
              />
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
