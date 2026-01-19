import { Card, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { useProperty } from '@/hooks/api/useProperties'
import {
  calculateCostSegPotential,
  calculateCostSegFirstYearBenefit,
  calculateCostBasis,
  getDepreciationSchedule,
  DEFAULT_MARGINAL_TAX_RATE,
} from '@/utils/finances'

interface CostSegregationPanelProps {
  propertyId: string
}

/**
 * CostSegregationPanel component - Displays cost segregation potential and study results
 * Shows: Cost seg potential, accelerated depreciation opportunities, first-year tax benefit
 */
export const CostSegregationPanel = ({ propertyId }: CostSegregationPanelProps) => {
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

  // Get property data
  const acquisition = property.acquisition
  const propertyType = property.characteristics?.propertyType

  // Calculate cost basis
  const purchasePrice = acquisition?.purchasePrice
    ? Number(acquisition.purchasePrice)
    : null
  const closingCosts = acquisition?.closingCosts
    ? Number(acquisition.closingCosts)
    : 0

  if (!purchasePrice) {
    return (
      <Card
        variant="rounded"
        padding="lg"
        radius="xl"
        className="bg-gradient-to-br from-purple-500/10 to-transparent"
      >
        <div className="flex justify-between items-center mb-6">
          <Typography
            variant="h5"
            className="uppercase tracking-tighter text-purple-500"
          >
            Cost Segregation
          </Typography>
        </div>
        <Typography variant="body" className="text-slate-500 dark:text-slate-400">
          Add purchase price to analyze cost segregation potential.
        </Typography>
      </Card>
    )
  }

  // Calculate cost basis
  const costBasis = calculateCostBasis(purchasePrice, closingCosts)
  const depreciationYears = getDepreciationSchedule(propertyType)

  // Calculate cost seg potential
  const costSegPotential = calculateCostSegPotential(costBasis.depreciableBasis)

  // Estimate accelerated amounts (before actual study)
  const estimatedAccelerated = costSegPotential?.potentialValue || 0
  const estimated5Year = Math.round(estimatedAccelerated * 0.5) // ~50% to 5-year
  const estimated7Year = Math.round(estimatedAccelerated * 0.2) // ~20% to 7-year
  const estimated15Year = Math.round(estimatedAccelerated * 0.3) // ~30% to 15-year

  // Current bonus depreciation rate (phases out: 80% in 2023, 60% in 2024, etc.)
  const currentYear = new Date().getFullYear()
  let bonusPercent = 0
  if (currentYear <= 2022) bonusPercent = 1.0
  else if (currentYear === 2023) bonusPercent = 0.8
  else if (currentYear === 2024) bonusPercent = 0.6
  else if (currentYear === 2025) bonusPercent = 0.4
  else if (currentYear === 2026) bonusPercent = 0.2
  else bonusPercent = 0

  // Calculate first year benefit
  const firstYearBenefit = calculateCostSegFirstYearBenefit(
    estimated5Year,
    estimated7Year,
    estimated15Year,
    bonusPercent,
    DEFAULT_MARGINAL_TAX_RATE,
  )

  // Learning snippets
  const learningSnippets = [
    {
      title: 'What is Cost Segregation?',
      content: 'Cost segregation is an IRS-approved tax strategy that allows property owners to accelerate depreciation on certain building components. Instead of depreciating everything over 27.5 or 39 years, some items can be depreciated over 5, 7, or 15 years.',
    },
    {
      title: 'Bonus Depreciation',
      content: `Bonus depreciation allows you to deduct a large percentage of accelerated components in year one. In ${currentYear}, the bonus depreciation rate is ${(bonusPercent * 100).toFixed(0)}%. This phases out by 20% each year after 2022.`,
    },
    {
      title: 'What Gets Reclassified?',
      content: '5-year property includes appliances, carpeting, and blinds. 7-year property includes furniture and fixtures. 15-year property includes land improvements like landscaping, parking lots, and sidewalks.',
    },
    {
      title: 'Is a Study Worth It?',
      content: 'Cost segregation studies typically cost $5,000-$15,000 but can generate tax savings of 10x or more. They\'re most beneficial for properties over $500,000 and when you have other income to offset.',
    },
  ]

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="bg-gradient-to-br from-purple-500/10 to-transparent"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Typography
          variant="h5"
          className="uppercase tracking-tighter text-purple-500"
        >
          Cost Segregation
        </Typography>
        <div className="flex items-center gap-3">
          <LearningHubButton
            snippets={learningSnippets}
            title="Cost Segregation Learning Hub"
            subtitle="Accelerated depreciation strategies"
            componentKey="cost-segregation"
          />
        </div>
      </div>

      {/* Potential Level Badge */}
      {costSegPotential && (
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`px-4 py-2 rounded-xl ${
              costSegPotential.level === 'High Alpha'
                ? 'bg-emerald-500/10'
                : costSegPotential.level === 'Medium'
                ? 'bg-amber-500/10'
                : 'bg-slate-500/10'
            }`}
          >
            <Typography
              variant="h4"
              className={`uppercase tracking-tighter ${
                costSegPotential.level === 'High Alpha'
                  ? 'text-emerald-500'
                  : costSegPotential.level === 'Medium'
                  ? 'text-amber-500'
                  : 'text-slate-500'
              }`}
            >
              {costSegPotential.level}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" className="text-slate-500 uppercase tracking-widest">
              Potential
            </Typography>
            <Typography variant="body-sm" weight="bold" className="text-purple-500">
              ~{costSegPotential.percentage}% acceleratable
            </Typography>
          </div>
        </div>
      )}

      {/* First Year Benefit */}
      {firstYearBenefit > 0 && (
        <div className="mb-8">
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest font-black"
          >
            Estimated First Year Tax Benefit
          </Typography>
          <Typography
            variant="h1"
            className="tabular-nums tracking-tighter text-emerald-500 dark:text-emerald-400"
          >
            ${Math.round(firstYearBenefit).toLocaleString()}
          </Typography>
          <Typography
            variant="overline"
            className="text-slate-400 dark:text-slate-500 mt-1"
          >
            with {(bonusPercent * 100).toFixed(0)}% bonus depreciation
          </Typography>
        </div>
      )}

      {/* Estimated Breakdown */}
      <div className="mb-8 p-4 bg-white/50 dark:bg-white/5 rounded-xl">
        <Typography
          variant="caption"
          className="text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest font-black"
        >
          Estimated Reclassification
        </Typography>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <Typography variant="body-sm" className="text-slate-600 dark:text-slate-400">
                5-Year Property
              </Typography>
            </div>
            <Typography variant="body-sm" weight="bold" className="tabular-nums">
              ${estimated5Year.toLocaleString()}
            </Typography>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <Typography variant="body-sm" className="text-slate-600 dark:text-slate-400">
                7-Year Property
              </Typography>
            </div>
            <Typography variant="body-sm" weight="bold" className="tabular-nums">
              ${estimated7Year.toLocaleString()}
            </Typography>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <Typography variant="body-sm" className="text-slate-600 dark:text-slate-400">
                15-Year Property
              </Typography>
            </div>
            <Typography variant="body-sm" weight="bold" className="tabular-nums">
              ${estimated15Year.toLocaleString()}
            </Typography>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-white/10">
            <Typography variant="body-sm" weight="bold" className="text-slate-900 dark:text-white">
              Total Acceleratable
            </Typography>
            <Typography variant="body-sm" weight="black" className="tabular-nums text-purple-500">
              ${estimatedAccelerated.toLocaleString()}
            </Typography>
          </div>
        </div>
      </div>

      {/* Bonus Depreciation Status */}
      <div className="p-4 bg-amber-500/10 rounded-xl mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Typography
            variant="caption"
            className="text-amber-600 dark:text-amber-400 uppercase tracking-widest font-black"
          >
            {currentYear} Bonus Depreciation
          </Typography>
        </div>
        <div className="flex items-center gap-4">
          <Typography
            variant="h3"
            className="tabular-nums text-amber-600 dark:text-amber-400"
          >
            {(bonusPercent * 100).toFixed(0)}%
          </Typography>
          <div className="flex-1">
            <div className="h-2 w-full bg-amber-200 dark:bg-amber-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${bonusPercent * 100}%` }}
              />
            </div>
            <Typography
              variant="overline"
              className="text-amber-600 dark:text-amber-400 mt-1"
            >
              {bonusPercent > 0 ? 'Act now before phase-out continues' : 'Bonus depreciation has expired'}
            </Typography>
          </div>
        </div>
      </div>

      {/* Typical Components */}
      <div className="space-y-2">
        <Typography
          variant="caption"
          className="text-slate-500 dark:text-slate-400 uppercase tracking-widest"
        >
          Commonly Reclassified Items
        </Typography>
        <div className="flex flex-wrap gap-2">
          {[
            'Appliances',
            'Carpeting',
            'Flooring',
            'Cabinets',
            'HVAC',
            'Plumbing',
            'Electrical',
            'Landscaping',
            'Fencing',
            'Paving',
          ].map((item) => (
            <span
              key={item}
              className="px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs rounded-full"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}
