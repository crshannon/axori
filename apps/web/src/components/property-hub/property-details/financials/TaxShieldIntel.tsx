import { Card, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { useProperty } from '@/hooks/api/useProperties'
import { generateTaxShieldLearning } from '@/data/learning-hub/tax-shield-snippets'
import {
  calculateCostSegPotential,
  calculateUnclaimedDepreciation,
  getDepreciationSchedule,
} from '@/utils/finances'

interface TaxShieldIntelProps {
  propertyId: string
}

/**
 * TaxShieldIntel component - Displays tax shield metrics and depreciation information
 * Shows: Unclaimed Depreciation, Cost Segregation Potential
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
  const depreciationBasis =
    acquisition != null && (acquisition as any).depreciationBasis != null
      ? Number((acquisition as any).depreciationBasis)
      : null

  // Calculate depreciation schedule based on property type
  const depreciationSchedule = getDepreciationSchedule(propertyType)

  // Calculate unclaimed depreciation
  const unclaimedDepreciation =
    calculateUnclaimedDepreciation(
      acquisition?.purchaseDate || null,
      depreciationBasis,
      depreciationSchedule,
    ) ?? 0

  // Calculate cost segregation potential
  const costSeg = calculateCostSegPotential(depreciationBasis)
  const costSegPotential = costSeg?.level ?? 'Low'
  const costSegPercentage = costSeg?.percentage ?? 0

  // Calculate cost seg potential value (estimate based on depreciation basis and percentage)
  const costSegPotentialValue =
    depreciationBasis !== null && costSeg
      ? Math.round(depreciationBasis * (costSeg.percentage / 100))
      : null

  // Generate learning snippets based on tax shield metrics
  const learningSnippets = generateTaxShieldLearning(
    unclaimedDepreciation,
    costSegPotentialValue,
    depreciationBasis,
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
        <div>
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest font-black"
          >
            Unclaimed Depreciation
          </Typography>
          <Typography
            variant="h1"
            className="tabular-nums tracking-tighter text-slate-900 dark:text-white"
          >
            ${unclaimedDepreciation.toLocaleString()}
          </Typography>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 opacity-40 uppercase tracking-widest font-black"
            >
              Cost Seg Potential
            </Typography>
            <Typography
              variant="caption"
              className="text-amber-500 dark:text-amber-500 uppercase tracking-widest font-black"
            >
              {costSegPotential}
            </Typography>
          </div>
          <div className="h-1.5 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${costSegPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
