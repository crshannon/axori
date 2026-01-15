import { Button, Card, CardHeader, EmptyStateCard, Typography } from '@axori/ui'
import { useNavigate } from '@tanstack/react-router'
import { useProperty } from '@/hooks/api/useProperties'

interface AcquisitionIntelProps {
  propertyId: string
}

export const AcquisitionIntel = ({ propertyId }: AcquisitionIntelProps) => {
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(propertyId)

  const handleManageAcquisition = () => {
    navigate({
      to: '/property-hub/$propertyId/financials',
      params: { propertyId },
      search: (prev) => ({ ...prev, drawer: 'acquisition', loanId: undefined }),
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

  const acquisition = property.acquisition
  const valuation = property.valuation

  // Calculate values
  const purchasePrice = acquisition?.purchasePrice
    ? Number(acquisition.purchasePrice)
    : null
  const closingCosts = acquisition?.closingCosts
    ? Number(acquisition.closingCosts)
    : null
  const currentValue = valuation?.currentValue
    ? Number(valuation.currentValue)
    : acquisition?.currentValue
      ? Number(acquisition.currentValue)
      : null

  // Calculate current basis (purchase price + closing costs)
  const currentBasis =
    purchasePrice && closingCosts ? purchasePrice + closingCosts : null

  // Calculate total acquisition cost (purchase price + closing costs + earnest money - seller credits)
  const earnestMoney = (acquisition as any)?.earnestMoney
    ? Number((acquisition as any).earnestMoney)
    : null
  const sellerCredits = (acquisition as any)?.sellerCredits
    ? Number((acquisition as any).sellerCredits)
    : null
  const closingCostsTotal = (acquisition as any)?.closingCostsTotal
    ? Number((acquisition as any).closingCostsTotal)
    : closingCosts

  const totalAcquisitionCost =
    purchasePrice && closingCostsTotal
      ? purchasePrice +
        closingCostsTotal +
        (earnestMoney || 0) -
        (sellerCredits || 0)
      : null

  // Calculate equity velocity ((current value - purchase price) / purchase price) * 100
  const equityVelocity =
    purchasePrice && currentValue && purchasePrice > 0
      ? ((currentValue - purchasePrice) / purchasePrice) * 100
      : null

  // Calculate cash in deal (down payment + closing costs)
  // Note: downPaymentAmount might not be in the Property interface yet
  const downPaymentAmount = (acquisition as any)?.downPaymentAmount
    ? Number((acquisition as any).downPaymentAmount)
    : null
  const cashInDeal =
    downPaymentAmount && closingCosts
      ? downPaymentAmount + closingCosts
      : downPaymentAmount || closingCosts

  // Format acquisition method
  const formatAcquisitionMethod = (method: string | null | undefined) => {
    if (!method) return null
    return method
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const acquisitionMethod = formatAcquisitionMethod(
    (acquisition as any)?.acquisitionMethod,
  )

  // Format purchase date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return null
    }
  }

  const purchaseDate = formatDate(acquisition?.purchaseDate ?? null)

  // Empty state - no acquisition data
  if (!acquisition || (!purchasePrice && !purchaseDate)) {
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
      className="flex flex-col justify-between group relative overflow-hidden cursor-pointer hover:border-violet-500 dark:hover:border-[#E8FF4D]/40 transition-all"
      onClick={handleManageAcquisition}
    >
      {/* Decorative SVG Background */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] scale-150 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">
        <svg width="180" height="180" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>

      <div>
        <CardHeader className="p-0 pb-8">
          <Typography variant="h5">Acquisition Intel</Typography>
        </CardHeader>

        <div className="space-y-6">
          {/* Entry Value */}
          {purchasePrice !== null && (
            <div>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400 mb-1 opacity-100"
              >
                Entry Value
              </Typography>
              <Typography
                variant="h3"
                className="tabular-nums text-slate-900 dark:text-white"
              >
                ${purchasePrice.toLocaleString()}
              </Typography>
            </div>
          )}

          {/* Current Basis */}
          {currentBasis !== null && (
            <div>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400 mb-1 opacity-100"
              >
                Current Basis
              </Typography>
              <Typography
                variant="h3"
                className="tabular-nums text-emerald-500"
              >
                ${currentBasis.toLocaleString()}
              </Typography>
            </div>
          )}

          {/* Total Acquisition Cost */}
          {totalAcquisitionCost !== null && (
            <div>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400 mb-1 opacity-100"
              >
                Total Acquisition Cost
              </Typography>
              <Typography
                variant="h3"
                className="tabular-nums text-violet-500 dark:text-violet-400"
              >
                ${totalAcquisitionCost.toLocaleString()}
              </Typography>
            </div>
          )}
        </div>

        {/* Additional Metrics */}
        {(equityVelocity !== null ||
          cashInDeal !== null ||
          acquisitionMethod ||
          purchaseDate) && (
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 space-y-4">
            {equityVelocity !== null && (
              <div className="flex justify-between items-center">
                <Typography variant="caption" className="opacity-40 uppercase">
                  Equity Velocity
                </Typography>
                <Typography
                  variant="body-sm"
                  weight="black"
                  className={
                    equityVelocity >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }
                >
                  {equityVelocity >= 0 ? '+' : ''}
                  {equityVelocity.toFixed(1)}%
                </Typography>
              </div>
            )}

            {cashInDeal !== null && (
              <div className="flex justify-between items-center">
                <Typography variant="caption" className="opacity-40 uppercase">
                  Cash in Deal
                </Typography>
                <Typography variant="body-sm" weight="black">
                  ${cashInDeal.toLocaleString()}
                </Typography>
              </div>
            )}

            {(acquisitionMethod || purchaseDate) && (
              <Typography
                variant="overline"
                className="text-slate-500 dark:text-slate-400 italic mt-4 opacity-100"
              >
                {acquisitionMethod && (
                  <>
                    Acquisition via{' '}
                    <span className="text-violet-500 dark:text-[#E8FF4D]">
                      {acquisitionMethod}
                    </span>
                    {purchaseDate && ' '}
                  </>
                )}
                {purchaseDate && `on ${purchaseDate}.`}
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
