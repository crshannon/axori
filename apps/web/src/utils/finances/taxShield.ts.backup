/**
 * Tax Shield Calculation Utilities
 *
 * Utilities for calculating tax shield metrics including unclaimed depreciation
 * and cost segregation potential for rental properties.
 */

/**
 * Determines depreciation schedule based on property type
 * - Residential properties: 27.5 years (SFR, Duplex, Triplex, Fourplex, Condo, Townhouse)
 * - Commercial properties: 39 years (Multifamily 5+ units or commercial)
 *
 * @param propertyType - Property type string (e.g., "SFR", "Duplex", "Multifamily")
 * @returns Depreciation schedule in years (27.5 for residential, 39 for commercial)
 */
export function getDepreciationSchedule(propertyType: string | null | undefined): number {
  if (!propertyType) {
    return 27.5 // Default to residential
  }

  const residentialTypes = ['SFR', 'Duplex', 'Triplex', 'Fourplex', 'Condo', 'Townhouse']
  const normalizedType = propertyType.trim()

  // Check if it's a residential type
  if (residentialTypes.includes(normalizedType)) {
    return 27.5
  }

  // Multifamily and commercial use 39-year schedule
  // Note: In practice, some Multifamily properties (especially small ones)
  // might use 27.5, but for this calculation we'll use 39 for Multifamily
  return 39
}

/**
 * Calculates unclaimed depreciation from purchase date to current date
 *
 * Formula:
 * - Annual Depreciation = Depreciation Basis / Depreciation Schedule
 * - Months Owned = (Current Date - Purchase Date) in months
 * - Unclaimed Depreciation = Annual Depreciation × (Months Owned / 12)
 *
 * @param purchaseDate - Purchase date in YYYY-MM-DD format or null
 * @param depreciationBasis - Depreciation basis (cost basis for depreciation) or null
 * @param depreciationSchedule - Depreciation schedule in years (27.5 or 39)
 * @returns Unclaimed depreciation amount in dollars, or null if data is missing
 */
export function calculateUnclaimedDepreciation(
  purchaseDate: string | null | undefined,
  depreciationBasis: number | null | undefined,
  depreciationSchedule: number = 27.5,
): number | null {
  // Return null if required data is missing
  if (!purchaseDate || depreciationBasis === null || depreciationBasis === undefined) {
    return null
  }

  const purchase = new Date(purchaseDate)
  const now = new Date()

  // Handle edge case: purchase date in the future
  if (purchase > now) {
    return 0
  }

  // Calculate months owned (using days for precision, then converting)
  const daysDiff = Math.floor((now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24))
  const monthsOwned = daysDiff / 30.44 // Average days per month

  // Calculate annual depreciation
  const annualDepreciation = depreciationBasis / depreciationSchedule

  // Calculate unclaimed depreciation
  const unclaimedDepreciation = annualDepreciation * (monthsOwned / 12)

  // Round to nearest dollar
  return Math.round(unclaimedDepreciation)
}

/**
 * Calculates cost segregation potential as percentage and level
 *
 * Cost segregation studies typically identify 20-40% of a property's basis
 * that can be accelerated (depreciated over 5, 7, or 15 years instead of 27.5/39).
 *
 * This calculation estimates potential based on property value:
 * - Higher value properties typically have better cost seg potential
 * - For now, uses simple heuristics (future: could be based on property features)
 *
 * @param depreciationBasis - Depreciation basis or null
 * @returns Object with percentage and level, or null if basis is missing
 */
export function calculateCostSegPotential(
  depreciationBasis: number | null | undefined,
): { percentage: number; level: 'High Alpha' | 'Medium' | 'Low' } | null {
  if (depreciationBasis === null || depreciationBasis === undefined) {
    return null
  }

  // Estimate percentage based on property value
  // Higher value properties typically have better cost seg potential
  // This is a simplified heuristic - in practice, cost seg studies would
  // analyze property components (improvements, fixtures, etc.)
  let percentage: number

  if (depreciationBasis >= 500000) {
    // High-value properties: 30-40% potential
    percentage = 35
  } else if (depreciationBasis >= 200000) {
    // Medium-value properties: 25-35% potential
    percentage = 30
  } else {
    // Lower-value properties: 20-30% potential
    percentage = 25
  }

  // Determine level based on percentage
  let level: 'High Alpha' | 'Medium' | 'Low'
  if (percentage >= 30) {
    level = 'High Alpha'
  } else if (percentage >= 15) {
    level = 'Medium'
  } else {
    level = 'Low'
  }

  return { percentage, level }
}

