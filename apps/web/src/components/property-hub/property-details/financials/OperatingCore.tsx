import { Button, Card, Typography } from '@axori/ui'
import { useNavigate } from '@tanstack/react-router'
import { LearningHubButton } from './LearningHubButton'
import { generateOperatingCoreLearning } from '@/data/learning-hub/operating-core-snippets'
import { useFinancialPulse } from '@/hooks/computed/useFinancialPulse'
import { useOperatingCore } from '@/hooks/computed/useOperatingCore'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyPermissions } from '@/hooks/api'
import { ReadOnlyBanner } from '@/components/property-hub/ReadOnlyBanner'

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
  const { canEdit, isReadOnly } = usePropertyPermissions(propertyId)

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
      },
    })
  }

  const handleManageRentalIncome = () => {
    navigate({
      to: '/property-hub/$propertyId/financials',
      params: { propertyId },
      search: {
        drawer: 'rental-income',
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
          {isReadOnly && <ReadOnlyBanner variant="badge" />}
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Lease Income Information Section */}
        <div className="p-6 rounded-[2rem] bg-violet-500/5 border border-violet-500/10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <Typography
                variant="caption"
                className="text-violet-600/70 dark:text-violet-500/70 mb-2"
              >
                Lease Income Information
              </Typography>
              {property.rentalIncome?.monthlyRent ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Typography variant="overline" className="text-slate-400">
                      Monthly Rent
                    </Typography>
                    <Typography
                      variant="h4"
                      className="tabular-nums text-violet-500 dark:text-violet-400"
                    >
                      ${Number(property.rentalIncome.monthlyRent).toLocaleString()}
                    </Typography>
                  </div>
                  {property.rentalIncome.rentSource && (
                    <Typography variant="overline" className="text-slate-400 text-[9px]">
                      Source: {property.rentalIncome.rentSource.charAt(0).toUpperCase() + property.rentalIncome.rentSource.slice(1)}
                    </Typography>
                  )}
                  {(property.rentalIncome.leaseStartDate || property.rentalIncome.leaseEndDate) && (
                    <div className="flex gap-4 mt-2">
                      {property.rentalIncome.leaseStartDate && (
                        <Typography variant="overline" className="text-slate-400 text-[9px]">
                          Start: {new Date(property.rentalIncome.leaseStartDate).toLocaleDateString()}
                        </Typography>
                      )}
                      {property.rentalIncome.leaseEndDate && (
                        <Typography variant="overline" className="text-slate-400 text-[9px]">
                          End: {new Date(property.rentalIncome.leaseEndDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </div>
                  )}
                  {/* Calculate total other income */}
                  {(() => {
                    const otherIncome = [
                      property.rentalIncome.parkingIncomeMonthly,
                      property.rentalIncome.laundryIncomeMonthly,
                      property.rentalIncome.petRentMonthly,
                      property.rentalIncome.storageIncomeMonthly,
                      property.rentalIncome.utilityReimbursementMonthly,
                      property.rentalIncome.otherIncomeMonthly,
                    ]
                      .filter(Boolean)
                      .reduce((sum, val) => sum + Number(val || 0), 0)
                    return otherIncome > 0 ? (
                      <Typography variant="overline" className="text-slate-400 text-[9px]">
                        Other Income: +${otherIncome.toLocaleString()}/mo
                      </Typography>
                    ) : null
                  })()}
                </div>
              ) : (
                <Typography variant="overline" className="text-slate-400">
                  No lease income data configured
                </Typography>
              )}
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="ml-4 py-2 px-4 rounded-xl bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400 dark:bg-violet-500/5 dark:border-violet-500/10 dark:hover:bg-violet-500/10 font-black text-[9px] uppercase tracking-widest transition-all hover:bg-violet-500/20 dark:hover:bg-violet-500/10"
                onClick={(e) => {
                  e.stopPropagation()
                  handleManageRentalIncome()
                }}
              >
                Configure
              </Button>
            )}
          </div>
        </div>

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

          {/* Visual separator before financing costs */}
          <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 mt-3" />

          {/* Loan Payment - Financing Cost (not included in NOI) */}
          <div className="flex justify-between items-center group">
            <div className="flex items-center gap-2">
              <Typography
                variant="body-sm"
                weight="bold"
                className="opacity-40 uppercase tracking-tight"
              >
                Loan Payment
              </Typography>
              <Typography
                variant="overline"
                className="text-slate-400 opacity-60 text-[9px]"
                title="Financing cost - not included in NOI (Net Operating Income)"
              >
                (Financing)
              </Typography>
            </div>
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
            <div className="flex items-center gap-2 mb-1">
              <Typography variant="caption" className="text-slate-500">
                Projected NOI
              </Typography>
              <Typography
                variant="overline"
                className="text-slate-400 opacity-70 text-[9px]"
                title="Net Operating Income = Gross Income - Operating Expenses - CapEx. Excludes financing costs (loan payments)."
              >
                (Excludes Financing)
              </Typography>
            </div>
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

        {/* Manage Button - only show for users with edit permission */}
        {canEdit && (
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
        )}
      </div>
    </Card>
  )
}
