import { useState } from 'react'
import { Button, Card, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import type {DepreciationScheduleItem, DepreciationSummary} from '@/utils/finances';
import { useProperty } from '@/hooks/api/useProperties'
import {
  DEFAULT_MARGINAL_TAX_RATE,
  
  
  RESIDENTIAL_DEPRECIATION_YEARS,
  calculateCostBasis,
  calculateDepreciationSummary,
  calculatePaperLossComparison,
  calculateTaxShield,
  convertDepreciationToCSV,
  generateDepreciationExportData,
  generateDepreciationSchedule,
  getDepreciationSchedule
} from '@/utils/finances'

interface DepreciationScheduleProps {
  propertyId: string
}

/**
 * DepreciationSchedule component - Displays detailed depreciation information
 * Shows: Annual/Monthly depreciation, Accumulated depreciation, Tax shield value
 */
export const DepreciationSchedule = ({ propertyId }: DepreciationScheduleProps) => {
  const { data: property, isLoading } = useProperty(propertyId)
  const [showFullSchedule, setShowFullSchedule] = useState(false)

  if (isLoading || !property) {
    return (
      <Card variant="rounded" padding="lg" radius="xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-8 w-32 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-8 w-32 bg-slate-200 dark:bg-white/5 rounded" />
        </div>
      </Card>
    )
  }

  // Get property data
  const acquisition = property.acquisition
  const propertyType = property.characteristics?.propertyType
  const depreciationYears = getDepreciationSchedule(propertyType)

  // Calculate cost basis
  const purchasePrice = acquisition?.purchasePrice
    ? Number(acquisition.purchasePrice)
    : null
  const closingCosts = acquisition?.closingCosts
    ? Number(acquisition.closingCosts)
    : 0
  const placedInServiceDate = acquisition?.purchaseDate || null

  // Cannot calculate without purchase price
  if (!purchasePrice || !placedInServiceDate) {
    return (
      <Card
        variant="rounded"
        padding="lg"
        radius="xl"
        className="bg-gradient-to-br from-indigo-500/10 to-transparent"
      >
        <div className="flex justify-between items-center mb-6">
          <Typography
            variant="h5"
            className="uppercase tracking-tighter text-indigo-500"
          >
            Depreciation Schedule
          </Typography>
        </div>
        <Typography variant="body" className="text-slate-500 dark:text-slate-400">
          Add purchase price and acquisition date to view depreciation schedule.
        </Typography>
      </Card>
    )
  }

  // Calculate cost basis components
  const costBasis = calculateCostBasis(
    purchasePrice,
    closingCosts,
    0, // initialImprovements - will be enhanced later
    null, // landValue - will be enhanced later
  )

  // Generate depreciation schedule
  const schedule = generateDepreciationSchedule(
    costBasis.depreciableBasis,
    depreciationYears,
    placedInServiceDate,
  )

  // Calculate summary
  const summary = calculateDepreciationSummary(
    costBasis.depreciableBasis,
    depreciationYears,
    placedInServiceDate,
  )

  // Calculate tax shield
  const taxShield = summary
    ? calculateTaxShield(
        summary.annualDepreciation,
        DEFAULT_MARGINAL_TAX_RATE,
        summary.accumulatedDepreciation,
      )
    : null

  const currentYear = new Date().getFullYear()
  const currentYearItem = schedule.find((item) => item.year === currentYear)

  // Calculate years to display
  const displaySchedule = showFullSchedule ? schedule : schedule.slice(0, 5)
  const hasMoreYears = schedule.length > 5

  // Handle CSV export
  const handleExport = () => {
    const exportData = generateDepreciationExportData(
      property.fullAddress || `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`,
      propertyType || 'Unknown',
      purchasePrice,
      closingCosts,
      0,
      null,
      placedInServiceDate,
    )
    const csv = convertDepreciationToCSV(exportData)

    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `depreciation-schedule-${property.address.replace(/\s+/g, '-').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Learning snippets
  const learningSnippets = [
    {
      title: 'What is Depreciation?',
      content: 'Depreciation is a non-cash deduction that allows you to recover the cost of your rental property over time. The IRS allows you to deduct a portion of your property\'s value each year.',
    },
    {
      title: 'Mid-Month Convention',
      content: 'The IRS uses the mid-month convention for rental property, meaning depreciation starts in the middle of the month you placed the property in service, regardless of the actual date.',
    },
    {
      title: 'Tax Shield Value',
      content: 'Your tax shield is the actual dollar amount you save on taxes due to depreciation. It equals your depreciation deduction multiplied by your marginal tax rate.',
    },
  ]

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="bg-gradient-to-br from-indigo-500/10 to-transparent"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Typography
          variant="h5"
          className="uppercase tracking-tighter text-indigo-500"
        >
          Depreciation Schedule
        </Typography>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="text-xs uppercase tracking-wider"
          >
            Export CSV
          </Button>
          <LearningHubButton
            snippets={learningSnippets}
            title="Depreciation Learning Hub"
            subtitle="Understanding tax depreciation"
            componentKey="depreciation-schedule"
          />
        </div>
      </div>

      {/* Summary Metrics */}
      {summary && (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Annual Depreciation */}
          <div>
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest font-black"
            >
              Annual Depreciation
            </Typography>
            <Typography
              variant="h2"
              className="tabular-nums tracking-tighter text-slate-900 dark:text-white"
            >
              ${Math.round(summary.annualDepreciation).toLocaleString()}
            </Typography>
            <Typography
              variant="overline"
              className="text-slate-400 dark:text-slate-500 mt-1"
            >
              ${Math.round(summary.monthlyDepreciation).toLocaleString()}/mo
            </Typography>
          </div>

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
                at {(taxShield.marginalTaxRate * 100).toFixed(0)}% tax rate
              </Typography>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {summary && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <Typography
              variant="caption"
              className="text-slate-500 dark:text-slate-400 uppercase tracking-widest"
            >
              Depreciation Progress
            </Typography>
            <Typography
              variant="caption"
              className="text-indigo-500 uppercase tracking-widest font-black"
            >
              {summary.yearsCompleted} of {Math.ceil(summary.totalDepreciableYears)} years
            </Typography>
          </div>
          <div className="h-2 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
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
              Accumulated: ${Math.round(summary.accumulatedDepreciation).toLocaleString()}
            </Typography>
            <Typography
              variant="overline"
              className="text-slate-400 dark:text-slate-500"
            >
              Remaining: ${Math.round(summary.remainingBasis).toLocaleString()}
            </Typography>
          </div>
        </div>
      )}

      {/* Cost Basis Breakdown */}
      <div className="mb-8 p-4 bg-white/50 dark:bg-white/5 rounded-xl">
        <Typography
          variant="caption"
          className="text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest font-black"
        >
          Cost Basis Breakdown
        </Typography>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Typography variant="body-sm" className="text-slate-600 dark:text-slate-400">
              Purchase Price
            </Typography>
            <Typography variant="body-sm" weight="bold" className="tabular-nums">
              ${costBasis.purchasePrice.toLocaleString()}
            </Typography>
          </div>
          {costBasis.closingCosts > 0 && (
            <div className="flex justify-between">
              <Typography variant="body-sm" className="text-slate-600 dark:text-slate-400">
                Closing Costs
              </Typography>
              <Typography variant="body-sm" weight="bold" className="tabular-nums">
                +${costBasis.closingCosts.toLocaleString()}
              </Typography>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10">
            <Typography variant="body-sm" className="text-slate-600 dark:text-slate-400">
              Total Cost Basis
            </Typography>
            <Typography variant="body-sm" weight="bold" className="tabular-nums">
              ${costBasis.totalCostBasis.toLocaleString()}
            </Typography>
          </div>
          <div className="flex justify-between">
            <Typography variant="body-sm" className="text-slate-600 dark:text-slate-400">
              Land Value (Est. 20%)
            </Typography>
            <Typography variant="body-sm" weight="bold" className="tabular-nums text-rose-500">
              -${Math.round(costBasis.landValue).toLocaleString()}
            </Typography>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10">
            <Typography variant="body-sm" weight="bold" className="text-slate-900 dark:text-white">
              Depreciable Basis
            </Typography>
            <Typography variant="body-sm" weight="black" className="tabular-nums text-indigo-500">
              ${Math.round(costBasis.depreciableBasis).toLocaleString()}
            </Typography>
          </div>
        </div>
      </div>

      {/* Depreciation Type Badge */}
      <div className="flex items-center gap-2 mb-6">
        <div className="px-3 py-1 bg-indigo-500/10 rounded-full">
          <Typography variant="caption" className="text-indigo-500 uppercase tracking-widest font-black">
            {depreciationYears === RESIDENTIAL_DEPRECIATION_YEARS ? 'Residential' : 'Commercial'}
          </Typography>
        </div>
        <Typography variant="caption" className="text-slate-500 dark:text-slate-400">
          {depreciationYears}-year schedule
        </Typography>
      </div>

      {/* Schedule Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 dark:bg-white/5">
              <th className="text-left py-3 px-4">
                <Typography variant="caption" className="uppercase tracking-widest text-slate-500">
                  Year
                </Typography>
              </th>
              <th className="text-right py-3 px-4">
                <Typography variant="caption" className="uppercase tracking-widest text-slate-500">
                  Depreciation
                </Typography>
              </th>
              <th className="text-right py-3 px-4 hidden sm:table-cell">
                <Typography variant="caption" className="uppercase tracking-widest text-slate-500">
                  Accumulated
                </Typography>
              </th>
              <th className="text-right py-3 px-4 hidden md:table-cell">
                <Typography variant="caption" className="uppercase tracking-widest text-slate-500">
                  Remaining
                </Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {displaySchedule.map((item: DepreciationScheduleItem) => (
              <tr
                key={item.year}
                className={`border-t border-slate-200 dark:border-white/5 ${
                  item.year === currentYear
                    ? 'bg-indigo-50 dark:bg-indigo-500/10'
                    : ''
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Typography variant="body-sm" weight="bold" className="tabular-nums">
                      {item.year}
                    </Typography>
                    {item.year === currentYear && (
                      <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] rounded uppercase font-bold">
                        Current
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-right py-3 px-4">
                  <Typography variant="body-sm" weight="bold" className="tabular-nums">
                    ${item.depreciation.toLocaleString()}
                  </Typography>
                </td>
                <td className="text-right py-3 px-4 hidden sm:table-cell">
                  <Typography variant="body-sm" className="tabular-nums text-slate-500">
                    ${item.accumulatedDepreciation.toLocaleString()}
                  </Typography>
                </td>
                <td className="text-right py-3 px-4 hidden md:table-cell">
                  <Typography variant="body-sm" className="tabular-nums text-slate-500">
                    ${item.remainingBasis.toLocaleString()}
                  </Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More/Less Button */}
      {hasMoreYears && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFullSchedule(!showFullSchedule)}
          className="w-full mt-4 text-indigo-500"
        >
          {showFullSchedule
            ? 'Show Less'
            : `Show All ${schedule.length} Years`}
        </Button>
      )}
    </Card>
  )
}
