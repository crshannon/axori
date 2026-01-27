import { Button, Card, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { usePropertyPermissions } from '@/hooks/api'
import { useProperty } from '@/hooks/api/useProperties'
import { useFinancialPulse } from '@/hooks/computed/useFinancialPulse'
import { useOperatingCore } from '@/hooks/computed/useOperatingCore'
import { DRAWERS, useDrawer } from '@/lib/drawer'
import { generateOperatingCoreLearning } from '@/data/learning-hub/operating-core-snippets'

interface OperatingCoreProps {
  propertyId: string
}

/**
 * OperatingCore component - Displays operating income and expenses
 * Shows: Gross Income, Fixed Expenses, Debt Service, CapEx Accrual, NOI
 *
 * @see AXO-93 - Uses drawer factory for opening edit drawers
 */
export const OperatingCore = ({ propertyId }: OperatingCoreProps) => {
  const { openDrawer } = useDrawer()
  const { data: property, isLoading } = useProperty(propertyId)
  const metrics = useFinancialPulse(propertyId)
  const operatingMetrics = useOperatingCore(propertyId)
  const { canEdit } = usePropertyPermissions(propertyId)

  const handleManageExpenses = () => {
    openDrawer(DRAWERS.OPERATING_EXPENSES, { propertyId })
  }

  // Check if there are active leases
  const hasActiveLeases =
    property?.rentalIncome?.monthlyRent &&
    Number(property.rentalIncome.monthlyRent) > 0

  if (isLoading || !property) {
    return (
      <Card variant="rounded" padding="lg" radius="xl" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-20 bg-slate-200 dark:bg-white/5 rounded-xl" />
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
          <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
          <Typography
            variant="h6"
            className="uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Operating Core
          </Typography>
          <LearningHubButton
            snippets={generateOperatingCoreLearning(
              operatingMetrics.noi,
              operatingMetrics.grossIncome,
              operatingMetrics.margin,
              property.valuation?.currentValue
                ? Number(property.valuation.currentValue)
                : null,
            )}
            title="Operating Core"
            subtitle="Income, Expenses & NOI Analysis"
            componentKey="operating-core"
          />
        </div>
        <span
          className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${
            hasActiveLeases
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}
        >
          {hasActiveLeases ? 'Active_Engine' : 'NO_LEASES'}
        </span>
      </div>

      <div className="space-y-0">
        {/* Gross Income */}
        <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-white/5">
          <div>
            <Typography
              variant="body-sm"
              weight="bold"
              className="text-slate-900 dark:text-white"
            >
              Gross Income
            </Typography>
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400"
            >
              {property.rentalIncome?.monthlyRent
                ? `$${Number(property.rentalIncome.monthlyRent).toLocaleString()}/mo rent`
                : 'No rent configured'}
            </Typography>
          </div>
          <Typography variant="h4" className="tabular-nums text-emerald-500">
            +${operatingMetrics.grossIncome.toLocaleString()}
          </Typography>
        </div>

        {/* Fixed Expenses */}
        {operatingMetrics.fixedExpenses
          .filter((exp) => exp.amount > 0)
          .map((exp) => (
            <div
              key={exp.id}
              className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-white/5"
            >
              <Typography
                variant="body-sm"
                className="text-slate-600 dark:text-slate-400"
              >
                {exp.label}
              </Typography>
              <Typography
                variant="body-sm"
                weight="bold"
                className="tabular-nums text-slate-900 dark:text-white"
              >
                -${exp.amount.toLocaleString()}
              </Typography>
            </div>
          ))}

        {/* Debt Service */}
        <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-white/5">
          <Typography
            variant="body-sm"
            className="text-slate-600 dark:text-slate-400"
          >
            Debt Service
          </Typography>
          <Typography
            variant="body-sm"
            weight="bold"
            className="tabular-nums text-slate-900 dark:text-white"
          >
            -${Math.round(metrics.totalDebtService).toLocaleString()}
          </Typography>
        </div>

        {/* CapEx Accrual */}
        <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-white/5">
          <Typography
            variant="body-sm"
            className="text-slate-600 dark:text-slate-400"
          >
            CapEx Accrual
          </Typography>
          <Typography
            variant="body-sm"
            weight="bold"
            className="tabular-nums text-slate-900 dark:text-white"
          >
            -${Math.round(operatingMetrics.capexReserve).toLocaleString()}
          </Typography>
        </div>

        {/* NOI Summary */}
        <div className="flex justify-between items-end pt-6">
          <div>
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 mb-1 block"
            >
              Projected NOI
            </Typography>
            <Typography
              variant="h3"
              className="tabular-nums text-slate-900 dark:text-white tracking-tighter"
            >
              ${Math.round(operatingMetrics.noi).toLocaleString()}
            </Typography>
          </div>
          <div className="text-right">
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 mb-1 block"
            >
              Margin
            </Typography>
            <Typography
              variant="h4"
              className="tabular-nums text-slate-900 dark:text-white"
            >
              {operatingMetrics.margin.toFixed(1)}%
            </Typography>
          </div>
        </div>
      </div>

      {/* Configure Button */}
      {canEdit && (
        <Button
          variant="outline"
          size="lg"
          className="w-full py-4 mt-auto pt-6 rounded-2xl bg-slate-900 text-white dark:bg-white/5 dark:border dark:border-white/10 dark:text-white dark:hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all"
          onClick={(e) => {
            e.stopPropagation()
            handleManageExpenses()
          }}
        >
          Configure Expenses
        </Button>
      )}
    </Card>
  )
}
