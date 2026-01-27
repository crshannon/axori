import { Card, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { useProperty } from '@/hooks/api/useProperties'
import { cn } from '@/utils/helpers/cn'
import {
  DEFAULT_MARGINAL_TAX_RATE,
  calculateCostBasis,
  calculateCostSegPotential,
  calculateDepreciationSummary,
  calculateTaxShield,
  getDepreciationSchedule,
} from '@/utils/finances'
import { generateTaxShieldLearning } from '@/data/learning-hub/tax-shield-snippets'

interface TaxShieldIntelProps {
  propertyId: string
}

/**
 * TaxShieldIntel component - Tax Shield Node display
 *
 * Shows: Annual Savings, Depreciation Burn, CPA Recommendation
 */
export const TaxShieldIntel = ({ propertyId }: TaxShieldIntelProps) => {
  const { data: property, isLoading } = useProperty(propertyId)

  if (isLoading || !property) {
    return (
      <Card variant="rounded" padding="lg" radius="xl" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-20 bg-slate-200 dark:bg-white/5 rounded-xl" />
        </div>
      </Card>
    )
  }

  // Get property data for calculations
  const acquisition = property.acquisition
  const propertyType = property.characteristics?.propertyType

  // Get cost basis components
  const purchasePrice = acquisition?.purchasePrice
    ? Number(acquisition.purchasePrice)
    : null
  const closingCosts = acquisition?.closingCosts
    ? Number(acquisition.closingCosts)
    : 0
  const placedInServiceDate = acquisition?.purchaseDate || null

  // Calculate depreciation schedule based on property type
  const depreciationYears = getDepreciationSchedule(propertyType)

  // Calculate cost basis
  const costBasis = purchasePrice
    ? calculateCostBasis(purchasePrice, closingCosts)
    : null
  const depreciableBasis = costBasis?.depreciableBasis || null

  // Calculate depreciation summary
  const summary =
    depreciableBasis && placedInServiceDate
      ? calculateDepreciationSummary(
          depreciableBasis,
          depreciationYears,
          placedInServiceDate,
        )
      : null

  // Calculate tax shield
  const taxShield = summary
    ? calculateTaxShield(
        summary.annualDepreciation,
        DEFAULT_MARGINAL_TAX_RATE,
        summary.accumulatedDepreciation,
      )
    : null

  // Calculate cost segregation potential
  const costSeg = calculateCostSegPotential(depreciableBasis)

  // Determine if optimized
  const isOptimized =
    summary && summary.yearsCompleted < summary.totalDepreciableYears

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
          <div className="w-1.5 h-5 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
          <Typography
            variant="h6"
            className="uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Tax Shield Node
          </Typography>
          <LearningHubButton
            snippets={generateTaxShieldLearning(
              summary?.remainingBasis ?? null,
              costSeg?.potentialValue ?? null,
              depreciableBasis,
            )}
            title="Tax Shield Node"
            subtitle="Depreciation & Tax Strategy"
            componentKey="tax-shield"
          />
        </div>
        <span
          className={cn(
            'px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border',
            isOptimized
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          )}
        >
          {isOptimized ? 'Optimized' : 'PENDING'}
        </span>
      </div>

      {/* Annual Savings */}
      <div className="mb-6">
        <Typography
          variant="caption"
          className="text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2"
        >
          Annual Savings
        </Typography>
        <Typography
          variant="h2"
          className="tabular-nums text-emerald-500 tracking-tighter"
        >
          {taxShield
            ? `$${Math.round(taxShield.annualTaxShield).toLocaleString()}`
            : '$0'}
        </Typography>
        {taxShield && (
          <Typography
            variant="caption"
            className="text-slate-400 dark:text-slate-500 mt-1 block"
          >
            at {(taxShield.marginalTaxRate * 100).toFixed(0)}% marginal rate
          </Typography>
        )}
      </div>

      {/* Depreciation Burn */}
      {summary && (
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 uppercase tracking-wider"
            >
              Depreciation Burn
            </Typography>
            <Typography
              variant="caption"
              className="text-amber-400 uppercase tracking-wider font-black"
            >
              {summary.yearsCompleted}/
              {Math.ceil(summary.totalDepreciableYears)} yrs
            </Typography>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{
                width: `${(summary.yearsCompleted / Math.ceil(summary.totalDepreciableYears)) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <Typography
              variant="caption"
              className="text-slate-400 dark:text-slate-500"
            >
              ${Math.round(summary.accumulatedDepreciation).toLocaleString()}{' '}
              claimed
            </Typography>
            <Typography
              variant="caption"
              className="text-slate-400 dark:text-slate-500"
            >
              ${Math.round(summary.remainingBasis).toLocaleString()} left
            </Typography>
          </div>
        </div>
      )}

      {/* CPA Recommendation */}
      {costSeg?.potentialValue && costSeg.potentialValue > 10000 && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
          <Typography
            variant="caption"
            className="text-violet-400 uppercase tracking-wider font-black block mb-1"
          >
            CPA Recommendation
          </Typography>
          <Typography
            variant="body-sm"
            className="text-slate-600 dark:text-slate-300"
          >
            Cost segregation study may accelerate ~$
            {costSeg.potentialValue.toLocaleString()} in deductions
          </Typography>
        </div>
      )}

      {/* No Data State */}
      {!summary && (
        <div className="flex-1 flex items-center justify-center">
          <Typography
            variant="body-sm"
            className="text-slate-500 dark:text-slate-400 text-center"
          >
            Add purchase data to calculate tax shield metrics
          </Typography>
        </div>
      )}
    </Card>
  )
}
