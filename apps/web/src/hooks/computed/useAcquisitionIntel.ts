import { useMemo } from 'react'
import { useProperty } from '@/hooks/api/useProperties'

/**
 * Acquisition intel metrics calculated from property acquisition and valuation data
 */
export interface AcquisitionIntelMetrics {
  // Raw numeric values
  purchasePrice: number | null
  closingCosts: number | null
  currentValue: number | null
  downPaymentAmount: number | null

  // Calculated metrics
  currentBasis: number | null
  equityVelocity: number | null
  cashInDeal: number | null
  closingCostsPercentage: number | null
  unrealizedGain: number | null

  // Formatted display values
  acquisitionMethod: string | null
  purchaseDate: string | null

  // Data availability flags
  hasAcquisitionData: boolean
}

/**
 * Hook to calculate acquisition intel metrics for a property
 *
 * Calculates:
 * - Current Basis: purchase price + closing costs
 * - Equity Velocity: percentage change in value from purchase
 * - Cash in Deal: down payment + closing costs
 * - Formatted acquisition method and purchase date
 *
 * @param propertyId - The property ID to calculate metrics for
 * @returns AcquisitionIntelMetrics with all calculated and formatted values
 */
export function useAcquisitionIntel(
  propertyId: string,
): AcquisitionIntelMetrics {
  const { data: property } = useProperty(propertyId)

  return useMemo(() => {
    const acquisition = property?.acquisition
    const valuation = property?.valuation

    // Extract raw numeric values
    const purchasePrice = acquisition?.purchasePrice
      ? Number(acquisition.purchasePrice)
      : null
    const closingCosts = (acquisition as any)?.closingCostsTotal
      ? Number((acquisition as any).closingCostsTotal)
      : null
    const currentValue = valuation?.currentValue
      ? Number(valuation.currentValue)
      : acquisition?.currentValue
        ? Number(acquisition.currentValue)
        : null
    const downPaymentAmount = (acquisition as any)?.downPaymentAmount
      ? Number((acquisition as any).downPaymentAmount)
      : null

    // Calculate current basis (purchase price + closing costs)
    const currentBasis =
      purchasePrice && closingCosts ? purchasePrice + closingCosts : null

    // Calculate equity velocity ((current value - purchase price) / purchase price) * 100
    const equityVelocity =
      purchasePrice && currentValue && purchasePrice > 0
        ? ((currentValue - purchasePrice) / purchasePrice) * 100
        : null

    // Calculate cash in deal (down payment + closing costs)
    const cashInDeal =
      downPaymentAmount && closingCosts
        ? downPaymentAmount + closingCosts
        : downPaymentAmount || closingCosts

    // Calculate closing costs as percentage of purchase price
    const closingCostsPercentage =
      purchasePrice && closingCosts && purchasePrice > 0
        ? (closingCosts / purchasePrice) * 100
        : null

    // Calculate unrealized gain/loss
    const unrealizedGain =
      purchasePrice && currentValue ? currentValue - purchasePrice : null

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

    // Check if we have minimum acquisition data
    const hasAcquisitionData =
      acquisition !== null && acquisition !== undefined && (purchasePrice !== null || purchaseDate !== null)

    return {
      purchasePrice,
      closingCosts,
      currentValue,
      downPaymentAmount,
      currentBasis,
      equityVelocity,
      cashInDeal,
      closingCostsPercentage,
      unrealizedGain,
      acquisitionMethod,
      purchaseDate,
      hasAcquisitionData,
    }
  }, [property])
}

