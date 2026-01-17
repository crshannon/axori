import { Button, Card, Typography } from '@axori/ui'
import { useNavigate } from '@tanstack/react-router'
import { LearningHubButton } from './LearningHubButton'
import { generateOperatingCoreLearning } from '@/data/learning-hub/operating-core-snippets'
import { useFinancialPulse } from '@/hooks/computed/useFinancialPulse'
import { useOperatingCore } from '@/hooks/computed/useOperatingCore'
import { useProperty } from '@/hooks/api/useProperties'

interface OperatingCoreProps {
  propertyId: string
}

/**
 * OperatingCore component - Displays operating income and expenses
 * Shows: Gross Income, Fixed Expenses, Debt Service, CapEx Accrual, NOI
 */
export const OperatingCore = ({ propertyId }: OperatingCoreProps) => {
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(propertyId)
  const metrics = useFinancialPulse(propertyId)
  const operatingMetrics = useOperatingCore(propertyId)

  // Get current property value for learning context
  const currentValue =
    property?.acquisition?.currentValue !== null &&
    property?.acquisition?.currentValue !== undefined
      ? Number(property.acquisition.currentValue)
      : null

  // Generate learning snippets based on operating metrics
  const learningSnippets = generateOperatingCoreLearning(
    operatingMetrics.noi,
    operatingMetrics.grossIncome,
    operatingMetrics.margin,
    currentValue,
  )

  const handleManageExpenses = () => {
    navigate({
      to: '/property-hub/$propertyId/financials',
      params: { propertyId },
      search: {
        drawer: 'operating-expenses',
        loanId: undefined,
        bankAccountId: undefined,
      },
    })
  }

  if (isLoading || !property) {
    return (
      <Card variant="rounded" padding="lg" radius="xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-8 w-32 bg-slate-200 dark:bg-white/5 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="h-full flex flex-col gap-10 bg-slate-50/50 dark:bg-[#151518] relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2 relative z-10">
        <div>
          <Typography variant="h5" className="mb-1">
            Operating Core
          </Typography>
          <Typography variant="overline" className="text-slate-400">
            Verified Forecast Protocol
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <LearningHubButton
            snippets={learningSnippets}
            title="Operating Core Learning Hub"
            subtitle="Strategic insights for property operations"
            componentKey="operating-core"
          />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Expected Inflow Card */}
        <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex justify-between items-center mb-1">
            <Typography
              variant="caption"
              className="text-emerald-600/70 dark:text-emerald-500/70"
            >
              Expected Inflow
            </Typography>
            <Typography
              variant="h3"
              className="tabular-nums text-emerald-500 dark:text-emerald-500"
            >
              +${operatingMetrics.grossIncome.toLocaleString()}
            </Typography>
          </div>
          <Typography variant="overline" className="text-slate-400">
            Market Adjusted Base Rent
          </Typography>
        </div>

        {/* Expenses List */}
        <div className="space-y-3 px-2">
          {operatingMetrics.fixedExpenses
            .filter((exp) => exp.amount > 0)
            .map((exp) => (
              <div
                key={exp.id}
                className="flex justify-between items-center group"
              >
                <Typography
                  variant="body-sm"
                  weight="bold"
                  className="opacity-40 group-hover:opacity-100 transition-all uppercase tracking-tight"
                >
                  {exp.label}
                </Typography>
                <Typography
                  variant="body-sm"
                  weight="black"
                  className="tabular-nums"
                >
                  -${exp.amount.toLocaleString()}
                </Typography>
              </div>
            ))}
          <div className="flex justify-between items-center group">
            <Typography
              variant="body-sm"
              weight="bold"
              className="opacity-40 uppercase tracking-tight"
            >
              Loan Payment
            </Typography>
            <Typography
              variant="body-sm"
              weight="black"
              className="tabular-nums"
            >
              -${Math.round(metrics.totalDebtService).toLocaleString()}
            </Typography>
          </div>
          <div className="flex justify-between items-center group">
            <Typography
              variant="body-sm"
              weight="bold"
              className="opacity-40 uppercase tracking-tight"
            >
              CapEx Accrual
            </Typography>
            <Typography
              variant="body-sm"
              weight="black"
              className="tabular-nums"
            >
              -${Math.round(operatingMetrics.capexReserve).toLocaleString()}
            </Typography>
          </div>
        </div>

        {/* NOI Summary */}
        <div className="pt-6 border-t border-slate-500/10 dark:border-white/5 flex justify-between items-end">
          <div>
            <Typography variant="caption" className="text-slate-500 mb-1">
              Projected NOI
            </Typography>
            <Typography
              variant="h1"
              className="tabular-nums tracking-tighter leading-none"
            >
              ${Math.round(operatingMetrics.noi).toLocaleString()}
            </Typography>
          </div>
          <div className="text-right">
            <Typography variant="caption" className="text-slate-500 mb-1">
              Yield Eff.
            </Typography>
            <Typography
              variant="h4"
              className="tabular-nums text-sky-500 dark:text-sky-400"
            >
              {operatingMetrics.margin.toFixed(1)}%
            </Typography>
          </div>
        </div>

        {/* Manage Button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full py-4 mt-8 rounded-2xl bg-slate-900 text-white dark:bg-white/5 dark:border dark:border-white/10 dark:text-white dark:hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-violet-600 dark:hover:bg-[#E8FF4D] dark:hover:text-black"
          onClick={(e) => {
            e.stopPropagation()
            handleManageExpenses()
          }}
        >
          Configure Operating Expenses
        </Button>
      </div>
    </Card>
  )
}
