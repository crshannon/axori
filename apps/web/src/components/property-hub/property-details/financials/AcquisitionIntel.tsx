import { Button, Card, EmptyStateCard, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import { generateAcquisitionLearning } from '@/data/learning-hub/acquisition-snippets'
import { useAcquisitionIntel } from '@/hooks/computed/useAcquisitionIntel'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyPermissions } from '@/hooks/api'
import { ReadOnlyBanner } from '@/components/property-hub/ReadOnlyBanner'
import { useDrawer, DRAWERS } from '@/lib/drawer'

interface AcquisitionIntelProps {
  propertyId: string
}

/**
 * AcquisitionIntel component - Displays acquisition and equity metrics
 *
 * @see AXO-93 - Uses drawer factory for opening edit drawer
 */
export const AcquisitionIntel = ({ propertyId }: AcquisitionIntelProps) => {
  const { openDrawer } = useDrawer()
  const { data: property, isLoading } = useProperty(propertyId)
  const metrics = useAcquisitionIntel(propertyId)
  const { canEdit, isReadOnly } = usePropertyPermissions(propertyId)

  // Generate learning snippets based on acquisition data
  const learningSnippets = metrics.hasAcquisitionData
    ? generateAcquisitionLearning(
        metrics.currentBasis,
        metrics.currentValue,
        metrics.unrealizedGain,
        metrics.purchasePrice,
      )
    : []

  const handleManageAcquisition = () => {
    openDrawer(DRAWERS.ACQUISITION, { propertyId })
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
        description={
          canEdit
            ? 'Initialize acquisition data to track Equity Velocity and Tax Basis.'
            : 'No acquisition data has been added to this property yet.'
        }
        highlightedTerms={canEdit ? ['Equity Velocity', 'Tax Basis'] : []}
        buttonText={canEdit ? 'Initialize Basis' : undefined}
        onButtonClick={canEdit ? handleManageAcquisition : undefined}
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
            {isReadOnly && <ReadOnlyBanner variant="badge" />}
          </div>
        </div>

        <div className="space-y-6">
          {/* Primary Metrics - Equity and Equity Velocity (Most Important) */}
          <div className="grid grid-cols-2 gap-6">
            {/* Current Equity - PRIMARY METRIC (What the user actually owns) */}
            {(() => {
              // Calculate equity: current value - total loan amount
              const currentValue =
                property.valuation?.currentValue ||
                property.acquisition?.currentValue ||
                null
              const currentValueNum =
                currentValue !== null && currentValue !== undefined
                  ? typeof currentValue === 'string'
                    ? parseFloat(currentValue)
                    : Number(currentValue)
                  : null

              const activeLoan = property.loans?.find(
                (loan) => loan.status === 'active' && loan.isPrimary,
              )
              const totalLoanAmount = activeLoan?.originalLoanAmount
                ? Number(activeLoan.originalLoanAmount)
                : 0

              const equity =
                currentValueNum !== null &&
                !isNaN(currentValueNum) &&
                currentValueNum > 0
                  ? currentValueNum - totalLoanAmount
                  : null

              return equity !== null ? (
                <div>
                  <Typography
                    variant="caption"
                    className="text-slate-500 dark:text-slate-400 mb-1 opacity-100"
                  >
                    Current Equity
                  </Typography>
                  <Typography
                    variant="h3"
                    className="tabular-nums text-violet-500 dark:text-violet-400"
                  >
                    ${Math.round(equity).toLocaleString()}
                  </Typography>
                  <Typography
                    variant="overline"
                    className="text-slate-400 dark:text-slate-500 mt-1"
                  >
                    Your stake in the property
                  </Typography>
                </div>
              ) : null
            })()}

            {/* Equity Velocity - Performance Indicator */}
            {metrics.equityVelocity !== null && (
              <div>
                <Typography
                  variant="caption"
                  className="text-slate-500 dark:text-slate-400 mb-1 opacity-100"
                >
                  Equity Velocity
                </Typography>
                <Typography
                  variant="h4"
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

          {/* Secondary Metric - Current Basis (Tax/Accounting) */}
          {metrics.currentBasis !== null && (
            <div className="pt-4 border-t border-slate-200 dark:border-white/5">
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
              <Typography
                variant="overline"
                className="text-slate-400 dark:text-slate-500 mt-1 block"
              >
                Tax basis for depreciation
              </Typography>
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

      {/* Manage Button - only show for users with edit permission */}
      {canEdit && (
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
      )}
    </Card>
  )
}
