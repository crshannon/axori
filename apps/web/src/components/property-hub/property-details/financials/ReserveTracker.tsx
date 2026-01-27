import { Card, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { useBankAccountAllocations } from '@/hooks/api/useBankAccounts'
import { useReserveTracking } from '@/hooks/computed/useReserveTracking'
import { cn } from '@/utils/helpers/cn'
import { getReserveTrackerSnippets } from '@/data/learning-hub/financials-snippets'

interface ReserveTrackerProps {
  propertyId: string
}

/**
 * ReserveTracker component - Reserve Nodes display
 *
 * Shows Maintenance and CapEx reserves with horizontal progress bars
 * and liquidity buffer total.
 */
export const ReserveTracker = ({ propertyId }: ReserveTrackerProps) => {
  const reserves = useReserveTracking(propertyId)
  const allocations = useBankAccountAllocations(propertyId)

  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value)
    if (absValue >= 1000) {
      return `$${(absValue / 1000).toFixed(1)}k`
    }
    return `$${Math.round(absValue).toLocaleString()}`
  }

  // Calculate totals
  const totalMonthlyAccrual = reserves.hasData
    ? reserves.maintenance.monthlyAccrual + reserves.capex.monthlyAccrual
    : 0
  const liquidityBuffer = reserves.hasData ? reserves.combined.balance : 0

  // Determine status
  const hasGoodFunding =
    allocations.hasBankAccount &&
    allocations.maintenance.percent >= 80 &&
    allocations.capex.percent >= 80

  if (!reserves.hasData) {
    return (
      <Card
        variant="rounded"
        padding="lg"
        radius="xl"
        className="h-full flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-cyan-500 rounded-full" />
            <Typography
              variant="h6"
              className="uppercase tracking-widest text-slate-900 dark:text-white"
            >
              Reserve Nodes
            </Typography>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded bg-slate-500/20 text-slate-400">
            NO_DATA
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Typography
            variant="body-sm"
            className="text-slate-500 dark:text-slate-400 text-center"
          >
            Add transaction data to track reserve fund accumulation
          </Typography>
        </div>
      </Card>
    )
  }

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-cyan-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
          <Typography
            variant="h6"
            className="uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Reserve Nodes
          </Typography>
          <LearningHubButton
            snippets={getReserveTrackerSnippets()}
            title="Reserve Nodes"
            subtitle="Maintenance & CapEx Reserves"
            componentKey="reserve-tracker"
          />
        </div>
        <span
          className={cn(
            'px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border',
            hasGoodFunding
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
          )}
        >
          {hasGoodFunding ? 'Synced' : 'Building'}
        </span>
      </div>

      {/* Progress Bars Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8 flex-grow">
        {/* Maintenance */}
        <div className="space-y-5">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest text-slate-900 dark:text-white">
              Maintenance
            </span>
            <span className="text-base font-black tabular-nums text-emerald-500">
              {allocations.hasBankAccount
                ? `${allocations.maintenance.percent}%`
                : formatCurrency(reserves.maintenance.balance)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/5">
            <div
              className="h-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-700"
              style={{
                width: `${Math.min(allocations.hasBankAccount ? allocations.maintenance.percent : reserves.maintenance.balance > 0 ? 50 : 0, 100)}%`,
              }}
            />
          </div>
          {allocations.hasBankAccount && (
            <Typography
              variant="caption"
              className="text-slate-400 dark:text-slate-500 tabular-nums"
            >
              {formatCurrency(allocations.maintenance.funded)} /{' '}
              {formatCurrency(allocations.maintenance.target)}
            </Typography>
          )}
        </div>

        {/* CapEx */}
        <div className="space-y-5">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest text-slate-900 dark:text-white">
              CapEx
            </span>
            <span className="text-base font-black tabular-nums text-indigo-500">
              {allocations.hasBankAccount
                ? `${allocations.capex.percent}%`
                : formatCurrency(reserves.capex.balance)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/5">
            <div
              className="h-full rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)] transition-all duration-700"
              style={{
                width: `${Math.min(allocations.hasBankAccount ? allocations.capex.percent : reserves.capex.balance > 0 ? 50 : 0, 100)}%`,
              }}
            />
          </div>
          {allocations.hasBankAccount && (
            <Typography
              variant="caption"
              className="text-slate-400 dark:text-slate-500 tabular-nums"
            >
              {formatCurrency(allocations.capex.funded)} /{' '}
              {formatCurrency(allocations.capex.target)}
            </Typography>
          )}
        </div>
      </div>

      {/* Liquidity Buffer */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-500/10 mt-auto">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest text-slate-900 dark:text-white block mb-2">
              Liquidity Buffer
            </span>
            <Typography
              variant="h2"
              className={cn(
                'tabular-nums tracking-tighter',
                liquidityBuffer >= 0 ? 'text-emerald-500' : 'text-rose-500',
              )}
            >
              {formatCurrency(liquidityBuffer)}
            </Typography>
          </div>
          <div className="text-right">
            <span className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-emerald-500/10 text-emerald-500 border-emerald-500/10 shadow-lg shadow-emerald-500/5">
              +{formatCurrency(totalMonthlyAccrual)}/mo
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
