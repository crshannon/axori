import { Button, Card, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { useProperty } from '@/hooks/api/useProperties'
import { useFinancialPulse } from '@/hooks/computed/useFinancialPulse'
import { getEquityVelocitySnippets } from '@/data/learning-hub/financials-snippets'

interface EquityVelocityProps {
  propertyId: string
}

/**
 * EquityVelocity component - Shows equity position and returns
 *
 * Displays:
 * - PORTFOLIO STAKE (total equity in property)
 * - UNREALIZED ROI
 * - CALCULATED BASIS (purchase price + closing costs)
 *
 * Note: Uses placeholder calculations for now - actual equity tracking
 * will require additional schema fields for tracking contributions/distributions.
 */
export const EquityVelocity = ({ propertyId }: EquityVelocityProps) => {
  const { data: property, isLoading } = useProperty(propertyId)
  const metrics = useFinancialPulse(propertyId)

  if (isLoading || !property) {
    return (
      <Card variant="rounded" padding="lg" radius="xl" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-white/5 rounded" />
        </div>
      </Card>
    )
  }

  // Calculate equity metrics from available data
  const purchasePrice = property.acquisition?.purchasePrice
    ? Number(property.acquisition.purchasePrice)
    : 0
  const downPayment = property.acquisition?.downPayment
    ? Number(property.acquisition.downPayment)
    : 0
  const closingCosts = property.acquisition?.closingCosts
    ? Number(property.acquisition.closingCosts)
    : 0

  // Calculate portfolio stake (down payment + estimated principal paid)
  // For now, use down payment as proxy - future: track actual principal payments
  const portfolioStake = downPayment > 0 ? downPayment : purchasePrice * 0.2 // Default 20% if no data

  // Calculate annualized ROI
  // ROI = (Annual Cash Flow / Total Investment) * 100
  const annualCashFlow = (metrics.projectedCashFlow ?? 0) * 12
  const totalInvestment = downPayment + closingCosts
  const unrealizedROI =
    totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0

  // Calculated basis = purchase price + closing costs
  const calculatedBasis = purchasePrice + closingCosts

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`
    }
    return `$${Math.round(value).toLocaleString()}`
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
          <div className="w-1.5 h-5 bg-violet-500 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
          <Typography
            variant="h6"
            className="uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Equity Velocity
          </Typography>
          <LearningHubButton
            snippets={getEquityVelocitySnippets()}
            title="Equity Velocity"
            subtitle="Portfolio Stake & ROI Analysis"
            componentKey="equity-velocity"
          />
        </div>
        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
          Tier_Alpha
        </span>
      </div>

      {/* Main Metrics Grid - 2 columns like AI Studio */}
      <div className="grid grid-cols-2 gap-6 mb-8 flex-1">
        <div>
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3 opacity-60"
          >
            Portfolio Stake
          </Typography>
          <Typography
            variant="h2"
            className="tabular-nums text-violet-500 tracking-tighter"
          >
            {formatCurrency(portfolioStake)}
          </Typography>
        </div>
        <div>
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3 opacity-60"
          >
            Unrealized ROI
          </Typography>
          <Typography
            variant="h2"
            className={`tabular-nums tracking-tighter ${unrealizedROI >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
          >
            {unrealizedROI >= 0 ? '+' : ''}
            {unrealizedROI.toFixed(1)}%
          </Typography>
        </div>
      </div>

      {/* Calculated Basis - Separated section */}
      <div className="pt-6 border-t border-slate-200 dark:border-white/5">
        <Typography
          variant="caption"
          className="text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block mb-2 opacity-60"
        >
          Calculated Basis
        </Typography>
        <Typography
          variant="h3"
          className="tabular-nums text-slate-900 dark:text-white tracking-tighter leading-none"
        >
          {formatCurrency(calculatedBasis)}
        </Typography>
        <Typography
          variant="caption"
          className="text-slate-400 dark:text-slate-500 mt-3 block uppercase tracking-widest opacity-40"
        >
          Post-Closing Reconciliation Active
        </Typography>
      </div>

      {/* Exit Audit Button */}
      <Button
        variant="outline"
        size="lg"
        className="w-full py-4 mt-6 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white font-black text-[9px] uppercase tracking-[0.2em] transition-all hover:bg-slate-50 dark:hover:bg-white/5"
      >
        Exit Audit
      </Button>
    </Card>
  )
}
