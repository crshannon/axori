import { Card, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { useProperty } from '@/hooks/api/useProperties'
import { generateTaxShieldLearning } from '@/data/learning-hub/tax-shield-snippets'
import {
  DEFAULT_MARGINAL_TAX_RATE,
  calculateCostBasis,
  calculateCostSegPotential,
  calculateDepreciationSummary,
  calculateTaxShield,
  getDepreciationSchedule,
} from '@/utils/finances'

interface TaxShieldIntelProps {
  propertyId: string
}

/**
 * TaxShieldIntel component - Displays tax shield metrics and depreciation information
 * Shows: Annual Depreciation, Tax Shield Value, Cost Segregation Potential
 */
export const TaxShieldIntel = ({ propertyId }: TaxShieldIntelProps) => {
  const { data: property, isLoading } = useProperty(propertyId)

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
  const costSegPotential = costSeg?.level ?? 'Low'
  const costSegPercentage = costSeg?.percentage ?? 0

  // Generate learning snippets based on tax shield metrics
  const learningSnippets = generateTaxShieldLearning(
    summary?.accumulatedDepreciation || 0,
    costSeg?.potentialValue || null,
    depreciableBasis,
  )

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="bg-gradient-to-br from-amber-500/10 to-transparent"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Typography
          variant="h5"
          className="uppercase tracking-tighter text-amber-500"
        >
          Tax Shield Intel
        </Typography>
        <div className="flex items-center gap-3">
          <LearningHubButton
            snippets={learningSnippets}
            title="Tax Shield Learning Hub"
            subtitle="Strategic insights for tax optimization"
            componentKey="tax-shield-intel"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Annual Depreciation */}
        {summary ? (
          <div>
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest font-black"
            >
              Annual Depreciation
            </Typography>
            <Typography
              variant="h1"
              className="tabular-nums tracking-tighter text-slate-900 dark:text-white"
            >
              ${Math.round(summary.annualDepreciation).toLocaleString()}
            </Typography>
            <Typography
              variant="overline"
              className="text-slate-400 dark:text-slate-500 mt-1"
            >
              ${Math.round(summary.monthlyDepreciation).toLocaleString()}/mo
              over {depreciationYears} years
            </Typography>
          </div>
        ) : (
          <div>
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest font-black"
            >
              Annual Depreciation
            </Typography>
            <Typography
              variant="body"
              className="text-slate-500 dark:text-slate-400"
            >
              Add purchase data to calculate
            </Typography>
          </div>
        )}

        {/* Tax Shield Value */}
        {taxShield && (
          <div>
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest font-black"
            >
              Annual Tax Shield
            </Typography>
            <Typography
              variant="h2"
              className="tabular-nums tracking-tighter text-emerald-500 dark:text-emerald-400"
            >
              ${Math.round(taxShield.annualTaxShield).toLocaleString()}
            </Typography>
            <Typography
              variant="overline"
              className="text-slate-400 dark:text-slate-500 mt-1"
            >
              at {(taxShield.marginalTaxRate * 100).toFixed(0)}% marginal rate
            </Typography>
          </div>
        )}

        {/* Accumulated Depreciation Progress */}
        {summary && (
          <div className="pt-4 border-t border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-center mb-2">
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400 uppercase tracking-widest"
              >
                Depreciation Progress
              </Typography>
              <Typography
                variant="caption"
                className="text-amber-500 uppercase tracking-widest font-black"
              >
                {summary.yearsCompleted}/
                {Math.ceil(summary.totalDepreciableYears)} yrs
              </Typography>
            </div>
            <div className="h-2 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${(summary.yearsCompleted / Math.ceil(summary.totalDepreciableYears)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <Typography
                variant="overline"
                className="text-slate-400 dark:text-slate-500"
              >
                ${Math.round(summary.accumulatedDepreciation).toLocaleString()}{' '}
                claimed
              </Typography>
              <Typography
                variant="overline"
                className="text-slate-400 dark:text-slate-500"
              >
                ${Math.round(summary.remainingBasis).toLocaleString()} remaining
              </Typography>
            </div>
          </div>
        )}

        {/* Cost Seg Potential */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/5">
          <div className="flex justify-between items-center">
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 opacity-40 uppercase tracking-widest font-black"
            >
              Cost Seg Potential
            </Typography>
            <Typography
              variant="caption"
              className={`uppercase tracking-widest font-black ${
                costSegPotential === 'High Alpha'
                  ? 'text-emerald-500'
                  : costSegPotential === 'Medium'
                    ? 'text-amber-500'
                    : 'text-slate-500'
              }`}
            >
              {costSegPotential}
            </Typography>
          </div>
          <div className="h-1.5 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                costSegPotential === 'High Alpha'
                  ? 'bg-emerald-500'
                  : costSegPotential === 'Medium'
                    ? 'bg-amber-500'
                    : 'bg-slate-500'
              }`}
              style={{ width: `${costSegPercentage}%` }}
            />
          </div>
          {costSeg?.potentialValue && (
            <Typography
              variant="overline"
              className="text-slate-400 dark:text-slate-500"
            >
              ~${costSeg.potentialValue.toLocaleString()} acceleratable
            </Typography>
          )}
        </div>

        {/* Depreciation Type */}
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-amber-500/10 rounded-full">
            <Typography
              variant="caption"
              className="text-amber-500 uppercase tracking-widest font-black"
            >
              {depreciationYears === 27.5 ? 'Residential' : 'Commercial'}
            </Typography>
          </div>
          <Typography
            variant="caption"
            className="text-slate-400 dark:text-slate-500"
          >
            {depreciationYears}-year schedule
          </Typography>
        </div>
      </div>
    </Card>
  )
}
