import { Card, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { useProperty } from '@/hooks/api/useProperties'
import {
  DEFAULT_MARGINAL_TAX_RATE,
  calculateAnnualDepreciation,
  calculateCostBasis,
  calculatePaperLossComparison,
  getDepreciationSchedule,
} from '@/utils/finances'
import { calculateCapExReserve, calculateNOI } from '@/utils/finances/noi'
import { calculateTotalDebtService } from '@/utils/finances/debt'

interface PaperLossComparisonProps {
  propertyId: string
}

/**
 * PaperLossComparison component - Shows "paper loss" vs actual cash flow
 * Demonstrates how depreciation creates tax-advantaged income
 */
export const PaperLossComparison = ({ propertyId }: PaperLossComparisonProps) => {
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

  // Calculate cash flow
  const monthlyRent = property.rentalIncome?.monthlyRent
    ? Number(property.rentalIncome.monthlyRent)
    : 0

  // Get operating expenses
  const opex = property.operatingExpenses
  const propertyTax = opex?.propertyTaxAnnual ? Number(opex.propertyTaxAnnual) : 0
  const insurance = opex?.insuranceAnnual ? Number(opex.insuranceAnnual) : 0
  const hoaMonthly = opex?.hoaMonthly ? Number(opex.hoaMonthly) : 0
  const managementRate = opex?.managementRate ? Number(opex.managementRate) : 0.1
  const vacancyRate = opex?.vacancyRate ? Number(opex.vacancyRate) : 0.05
  const maintenanceRate = opex?.maintenanceRate ? Number(opex.maintenanceRate) : 0.05
  const capexRate = opex?.capexRate || '0.05'

  // Calculate gross income (after vacancy)
  const grossMonthlyIncome = monthlyRent * (1 - vacancyRate)
  const grossAnnualIncome = grossMonthlyIncome * 12

  // Calculate operating expenses (monthly)
  const monthlyOpex =
    propertyTax / 12 +
    insurance / 12 +
    hoaMonthly +
    monthlyRent * maintenanceRate +
    monthlyRent * managementRate

  // Calculate CapEx reserve
  const capexReserve = calculateCapExReserve(grossMonthlyIncome, capexRate)

  // Calculate monthly NOI
  const monthlyNoi = calculateNOI(grossMonthlyIncome, monthlyOpex, capexReserve)
  const annualNoi = monthlyNoi * 12

  // Calculate debt service
  const loans = property.loans || []
  const monthlyDebtService = calculateTotalDebtService(loans)
  const annualDebtService = monthlyDebtService * 12

  // Calculate actual cash flow
  const annualCashFlow = annualNoi - annualDebtService

  if (!purchasePrice) {
    return (
      <Card
        variant="rounded"
        padding="lg"
        radius="xl"
        className="bg-gradient-to-br from-cyan-500/10 to-transparent"
      >
        <div className="flex justify-between items-center mb-6">
          <Typography
            variant="h5"
            className="uppercase tracking-tighter text-cyan-500"
          >
            Paper Loss Analysis
          </Typography>
        </div>
        <Typography variant="body" className="text-slate-500 dark:text-slate-400">
          Add purchase price and income data to analyze paper loss vs cash flow.
        </Typography>
      </Card>
    )
  }

  // Calculate depreciation
  const costBasis = calculateCostBasis(purchasePrice, closingCosts)
  const depreciationYears = getDepreciationSchedule(propertyType)
  const annualDepreciation = calculateAnnualDepreciation(
    costBasis.depreciableBasis,
    depreciationYears,
  )

  // Calculate paper loss comparison
  const comparison = calculatePaperLossComparison(
    annualCashFlow,
    annualDepreciation,
    DEFAULT_MARGINAL_TAX_RATE,
  )

  // Learning snippets
  const learningSnippets = [
    {
      title: 'What is Paper Loss?',
      content: 'A paper loss occurs when your deductions (including depreciation) exceed your income on paper, even though you\'re receiving positive cash flow. This is one of real estate\'s unique tax advantages.',
    },
    {
      title: 'Phantom Income Problem',
      content: 'Without depreciation, you would pay taxes on all your rental income even though much of it goes to expenses. Depreciation helps offset this by creating a non-cash deduction.',
    },
    {
      title: 'Tax-Advantaged Cash Flow',
      content: 'Your effective cash flow includes both the actual money you receive AND the tax savings from depreciation. This makes real estate income more valuable than ordinary income.',
    },
  ]

  // Determine if creating a paper loss
  const hasPaperLoss = comparison.taxableIncome < 0

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="bg-gradient-to-br from-cyan-500/10 to-transparent"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Typography
          variant="h5"
          className="uppercase tracking-tighter text-cyan-500"
        >
          Paper Loss Analysis
        </Typography>
        <div className="flex items-center gap-3">
          <LearningHubButton
            snippets={learningSnippets}
            title="Paper Loss Learning Hub"
            subtitle="Understanding tax-advantaged cash flow"
            componentKey="paper-loss"
          />
        </div>
      </div>

      {/* Visual Flow Diagram */}
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          {/* Actual Cash Flow */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-xl">
            <div>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400 uppercase tracking-widest"
              >
                Actual Cash Flow
              </Typography>
              <Typography variant="body-sm" className="text-slate-500 dark:text-slate-400">
                Money in your pocket
              </Typography>
            </div>
            <Typography
              variant="h3"
              className={`tabular-nums ${
                comparison.actualCashFlow >= 0
                  ? 'text-emerald-500'
                  : 'text-rose-500'
              }`}
            >
              ${Math.round(comparison.actualCashFlow).toLocaleString()}
            </Typography>
          </div>

          {/* Minus Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-white/10 rounded-full">
              <span className="text-slate-500 font-bold">−</span>
            </div>
          </div>

          {/* Depreciation (Paper Loss) */}
          <div className="flex items-center justify-between p-4 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl border-2 border-dashed border-cyan-300 dark:border-cyan-500/30">
            <div>
              <Typography
                variant="caption"
                className="text-cyan-600 dark:text-cyan-400 uppercase tracking-widest"
              >
                Paper Loss (Depreciation)
              </Typography>
              <Typography variant="body-sm" className="text-cyan-500 dark:text-cyan-400">
                Non-cash deduction
              </Typography>
            </div>
            <Typography
              variant="h3"
              className="tabular-nums text-cyan-500"
            >
              ${Math.round(comparison.paperLoss).toLocaleString()}
            </Typography>
          </div>

          {/* Equals Arrow */}
          <div className="flex justify-center">
            <div className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-white/10 rounded-full">
              <span className="text-slate-500 font-bold">=</span>
            </div>
          </div>

          {/* Taxable Income */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-xl">
            <div>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400 uppercase tracking-widest"
              >
                Taxable Income
              </Typography>
              <Typography variant="body-sm" className="text-slate-500 dark:text-slate-400">
                {hasPaperLoss ? 'Creates a loss to offset other income' : 'Amount subject to taxes'}
              </Typography>
            </div>
            <Typography
              variant="h3"
              className={`tabular-nums ${
                comparison.taxableIncome <= 0
                  ? 'text-emerald-500'
                  : 'text-rose-500'
              }`}
            >
              ${Math.round(comparison.taxableIncome).toLocaleString()}
            </Typography>
          </div>
        </div>
      </div>

      {/* Tax Savings Highlight */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl mb-6">
        <div className="flex justify-between items-center">
          <div>
            <Typography
              variant="caption"
              className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-black"
            >
              Annual Tax Savings
            </Typography>
            <Typography variant="body-sm" className="text-emerald-600 dark:text-emerald-400">
              at {(DEFAULT_MARGINAL_TAX_RATE * 100).toFixed(0)}% marginal rate
            </Typography>
          </div>
          <Typography
            variant="h2"
            className="tabular-nums text-emerald-500 dark:text-emerald-400"
          >
            ${Math.round(comparison.taxSavings).toLocaleString()}
          </Typography>
        </div>
      </div>

      {/* Effective Cash Flow */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
        <div className="flex justify-between items-center">
          <div>
            <Typography
              variant="caption"
              className="text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-black"
            >
              Effective Cash Flow
            </Typography>
            <Typography variant="body-sm" className="text-indigo-600 dark:text-indigo-400">
              Actual cash + tax savings
            </Typography>
          </div>
          <Typography
            variant="h2"
            className="tabular-nums text-indigo-500 dark:text-indigo-400"
          >
            ${Math.round(comparison.effectiveCashFlow).toLocaleString()}
          </Typography>
        </div>
      </div>

      {/* Paper Loss Status */}
      {hasPaperLoss && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
          <Typography
            variant="caption"
            className="text-amber-600 dark:text-amber-400 uppercase tracking-widest font-black mb-1"
          >
            Paper Loss Created
          </Typography>
          <Typography variant="body-sm" className="text-amber-600 dark:text-amber-400">
            This ${Math.abs(Math.round(comparison.taxableIncome)).toLocaleString()} loss can offset 
            other passive income or be carried forward (subject to passive activity rules).
          </Typography>
        </div>
      )}
    </Card>
  )
}
