import { Button, Card, EmptyStateCard, Typography } from '@axori/ui'
import { useNavigate } from '@tanstack/react-router'
import { LearningHubButton } from './LearningHubButton'
import { generateAcquisitionLearning } from '@/data/learning-hub/acquisition-snippets'
import { useAcquisitionIntel } from '@/hooks/computed/useAcquisitionIntel'
import { useProperty } from '@/hooks/api/useProperties'

interface AcquisitionIntelProps {
  propertyId: string
}

export const AcquisitionIntel = ({ propertyId }: AcquisitionIntelProps) => {
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(propertyId)
  const metrics = useAcquisitionIntel(propertyId)

  // Generate learning snippets based on acquisition data
  const learningSnippets = metrics.hasAcquisitionData
    ? generateAcquisitionLearning(
        metrics.currentBasis,
        metrics.currentValue,
        metrics.unrealizedGain,
      )
    : []

  const handleManageAcquisition = () => {
    navigate({
      to: '/property-hub/$propertyId/financials',
      params: { propertyId },
      search: {
        drawer: 'acquisition',
      },
    })
  }

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

  // Empty state - no acquisition data
  if (!metrics.hasAcquisitionData) {
    return (
      <EmptyStateCard
        title="Acquisition Intel"
        statusMessage="Data Required"
        description="Initialize acquisition data to track Equity Velocity and Tax Basis."
        highlightedTerms={['Equity Velocity', 'Tax Basis']}
        buttonText="Initialize Basis"
        onButtonClick={handleManageAcquisition}
        variant="violet"
      />
    )
  }

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="flex flex-col justify-between group relative overflow-hidden hover:border-violet-500 dark:hover:border-[#E8FF4D]/40 transition-all"
    >
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Typography variant="h5">Acquisition Intel</Typography>
          <div className="flex items-center gap-3">
            <LearningHubButton
              snippets={learningSnippets}
              title="Acquisition Intel Learning Hub"
              subtitle="Strategic insights for property acquisition"
              componentKey="acquisition-intel"
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Current Basis - Primary Metric */}
          {metrics.currentBasis !== null && (
            <div>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400 mb-1 opacity-100"
              >
                Current Basis
              </Typography>
              <Typography
                variant="h3"
                className="tabular-nums text-emerald-500 dark:text-emerald-400"
              >
                ${metrics.currentBasis.toLocaleString()}
              </Typography>
              {metrics.purchasePrice !== null &&
                metrics.currentBasis !== metrics.purchasePrice &&
                metrics.closingCostsPercentage !== null && (
                  <Typography
                    variant="overline"
                    className="text-slate-400 dark:text-slate-500 mt-1"
                  >
                    Includes {metrics.closingCostsPercentage.toFixed(1)}%
                    closing costs
                  </Typography>
                )}
            </div>
          )}

          {/* Equity Velocity - Secondary Metric (Performance Indicator) */}
          {metrics.equityVelocity !== null && (
            <div>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400 mb-1 opacity-100"
              >
                Equity Velocity
              </Typography>
              <Typography
                variant="h3"
                className={`tabular-nums ${
                  metrics.equityVelocity >= 0
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {metrics.equityVelocity >= 0 ? '+' : ''}
                {metrics.equityVelocity.toFixed(1)}%
              </Typography>
              {metrics.unrealizedGain !== null && (
                <Typography
                  variant="overline"
                  className="text-slate-400 dark:text-slate-300 mt-1"
                >
                  ${metrics.unrealizedGain.toLocaleString()} unrealized{' '}
                  {metrics.unrealizedGain >= 0 ? 'gain' : 'loss'}
                </Typography>
              )}
            </div>
          )}
        </div>

        {/* Additional Metrics */}
        {(metrics.cashInDeal !== null ||
          metrics.acquisitionMethod ||
          metrics.purchaseDate) && (
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 space-y-4">
            {metrics.cashInDeal !== null && (
              <div className="flex justify-between items-center">
                <Typography variant="caption" className="opacity-40 uppercase">
                  Cash in Deal
                </Typography>
                <Typography variant="body-sm" weight="black">
                  ${metrics.cashInDeal.toLocaleString()}
                </Typography>
              </div>
            )}

            {(metrics.acquisitionMethod || metrics.purchaseDate) && (
              <Typography
                variant="overline"
                className="text-slate-500 dark:text-slate-400 italic mt-4 opacity-100"
              >
                {metrics.acquisitionMethod && (
                  <>
                    Acquisition via{' '}
                    <span className="text-violet-500 dark:text-[#E8FF4D]">
                      {metrics.acquisitionMethod}
                    </span>
                    {metrics.purchaseDate && ' '}
                  </>
                )}
                {metrics.purchaseDate && `on ${metrics.purchaseDate}.`}
              </Typography>
            )}
          </div>
        )}
      </div>

      {/* Manage Button */}
      <Button
        variant="outline"
        size="lg"
        className="w-full py-4 mt-8 rounded-2xl bg-slate-900 text-white dark:bg-white/5 dark:border dark:border-white/10 dark:text-white dark:hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all group-hover:bg-violet-600"
        onClick={(e) => {
          e.stopPropagation()
          handleManageAcquisition()
        }}
      >
        Manage Purchase Data
      </Button>
    </Card>
  )
}
