/**
 * Tax Shield & Depreciation Calculation Utilities
 *
 * Utilities for calculating tax shield metrics including:
 * - IRS straight-line depreciation (27.5 years residential, 39 years commercial)
 * - Mid-month convention for partial year calculations
 * - Accumulated depreciation tracking
 * - Cost segregation potential and adjustments
 * - Tax shield value calculation
 * - Paper loss vs actual cash flow comparison
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DepreciationScheduleItem {
  year: number
  monthsDepreciated: number
  beginningBasis: number
  depreciation: number
  accumulatedDepreciation: number
  remainingBasis: number
}

export interface DepreciationSummary {
  annualDepreciation: number
  monthlyDepreciation: number
  accumulatedDepreciation: number
  remainingBasis: number
  yearsRemaining: number
  totalDepreciableYears: number
  yearsCompleted: number
}

export interface CostSegregationResult {
  percentage: number
  level: 'High Alpha' | 'Medium' | 'Low'
  potentialValue: number | null
}

export interface TaxShieldValue {
  annualTaxShield: number
  monthlyTaxShield: number
  totalTaxShieldToDate: number
  marginalTaxRate: number
}

export interface PaperLossComparison {
  actualCashFlow: number
  paperLoss: number // depreciation (non-cash expense)
  taxableIncome: number // actual - paper loss
  effectiveCashFlow: number // actual + tax savings
  taxSavings: number
}

export interface CostBasisComponents {
  purchasePrice: number
  closingCosts: number
  initialImprovements: number
  totalCostBasis: number
  landValue: number
  depreciableBasis: number
}

// ============================================================================
// Constants
// ============================================================================

/** Residential rental property depreciation period (years) */
export const RESIDENTIAL_DEPRECIATION_YEARS = 27.5

/** Commercial property depreciation period (years) */
export const COMMERCIAL_DEPRECIATION_YEARS = 39

/** Default marginal tax rate if not specified */
export const DEFAULT_MARGINAL_TAX_RATE = 0.24

/** Default land value ratio if not specified */
export const DEFAULT_LAND_VALUE_RATIO = 0.2

// Mid-month convention table - fraction of month allowed for depreciation
// in first and last year based on month placed in service
const MID_MONTH_FRACTIONS: Record<number, number> = {
  1: 11.5 / 12,
  2: 10.5 / 12,
  3: 9.5 / 12,
  4: 8.5 / 12,
  5: 7.5 / 12,
  6: 6.5 / 12,
  7: 5.5 / 12,
  8: 4.5 / 12,
  9: 3.5 / 12,
  10: 2.5 / 12,
  11: 1.5 / 12,
  12: 0.5 / 12,
}

// ============================================================================
// Depreciation Schedule Functions
// ============================================================================

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
    return RESIDENTIAL_DEPRECIATION_YEARS // Default to residential
  }

  const residentialTypes = ['SFR', 'Duplex', 'Triplex', 'Fourplex', 'Condo', 'Townhouse']
  const normalizedType = propertyType.trim()

  // Check if it's a residential type
  if (residentialTypes.includes(normalizedType)) {
    return RESIDENTIAL_DEPRECIATION_YEARS
  }

  // Multifamily and commercial use 39-year schedule
  return COMMERCIAL_DEPRECIATION_YEARS
}

/**
 * Calculate the cost basis for depreciation
 * Cost Basis = Purchase Price + Closing Costs + Initial Improvements
 * Depreciable Basis = Cost Basis - Land Value
 *
 * @param purchasePrice - Property purchase price
 * @param closingCosts - Total closing costs
 * @param initialImprovements - Pre-rental improvements
 * @param landValue - Land value (not depreciable)
 * @returns Cost basis components
 */
export function calculateCostBasis(
  purchasePrice: number,
  closingCosts: number = 0,
  initialImprovements: number = 0,
  landValue: number | null = null,
): CostBasisComponents {
  const totalCostBasis = purchasePrice + closingCosts + initialImprovements

  // If land value not provided, estimate using default ratio
  const calculatedLandValue = landValue ?? totalCostBasis * DEFAULT_LAND_VALUE_RATIO
  const depreciableBasis = Math.max(0, totalCostBasis - calculatedLandValue)

  return {
    purchasePrice,
    closingCosts,
    initialImprovements,
    totalCostBasis,
    landValue: calculatedLandValue,
    depreciableBasis,
  }
}

/**
 * Calculate mid-month convention fraction for first year
 * IRS requires using mid-month convention for rental property
 *
 * @param placedInServiceMonth - Month property was placed in service (1-12)
 * @returns Fraction of year's depreciation allowed in first year
 */
export function getMidMonthFraction(placedInServiceMonth: number): number {
  if (placedInServiceMonth < 1 || placedInServiceMonth > 12) {
    return 1 // Invalid month, return full year
  }
  return MID_MONTH_FRACTIONS[placedInServiceMonth]
}

/**
 * Calculate annual depreciation using IRS straight-line method
 *
 * @param depreciableBasis - The depreciable basis (cost basis - land value)
 * @param depreciationYears - Total depreciation period (27.5 or 39 years)
 * @returns Annual depreciation amount
 */
export function calculateAnnualDepreciation(
  depreciableBasis: number,
  depreciationYears: number = RESIDENTIAL_DEPRECIATION_YEARS,
): number {
  if (depreciableBasis <= 0 || depreciationYears <= 0) {
    return 0
  }
  return depreciableBasis / depreciationYears
}

/**
 * Calculate monthly depreciation
 *
 * @param depreciableBasis - The depreciable basis
 * @param depreciationYears - Total depreciation period
 * @returns Monthly depreciation amount
 */
export function calculateMonthlyDepreciation(
  depreciableBasis: number,
  depreciationYears: number = RESIDENTIAL_DEPRECIATION_YEARS,
): number {
  return calculateAnnualDepreciation(depreciableBasis, depreciationYears) / 12
}

/**
 * Calculate depreciation for a specific year considering mid-month convention
 *
 * @param depreciableBasis - The depreciable basis
 * @param depreciationYears - Total depreciation period
 * @param yearNumber - Which year of depreciation (1-indexed)
 * @param placedInServiceMonth - Month placed in service (1-12)
 * @param accumulatedDepreciationBefore - Accumulated depreciation before this year
 * @returns Depreciation amount for this year
 */
export function calculateYearDepreciation(
  depreciableBasis: number,
  depreciationYears: number,
  yearNumber: number,
  placedInServiceMonth: number = 1,
  accumulatedDepreciationBefore: number = 0,
): number {
  if (depreciableBasis <= 0 || yearNumber <= 0) {
    return 0
  }

  const annualDepreciation = calculateAnnualDepreciation(depreciableBasis, depreciationYears)
  const totalYearsInt = Math.ceil(depreciationYears)
  const remainingBasis = depreciableBasis - accumulatedDepreciationBefore

  // If nothing left to depreciate
  if (remainingBasis <= 0) {
    return 0
  }

  // First year: apply mid-month convention
  if (yearNumber === 1) {
    const firstYearFraction = getMidMonthFraction(placedInServiceMonth)
    return Math.min(annualDepreciation * firstYearFraction, remainingBasis)
  }

  // Last partial year: For 27.5 years, year 28 gets remaining fraction
  // For 39 years, year 40 gets remaining fraction
  if (yearNumber === totalYearsInt) {
    // Last year gets what's left, which is the complement of first year's fraction
    return Math.min(remainingBasis, annualDepreciation * (1 - getMidMonthFraction(placedInServiceMonth)))
  }

  // Middle years get full depreciation
  return Math.min(annualDepreciation, remainingBasis)
}

/**
 * Generate complete depreciation schedule for a property
 *
 * @param depreciableBasis - The depreciable basis
 * @param depreciationYears - Total depreciation period (27.5 or 39)
 * @param placedInServiceDate - Date property was placed in service
 * @returns Array of yearly depreciation schedule items
 */
export function generateDepreciationSchedule(
  depreciableBasis: number,
  depreciationYears: number = RESIDENTIAL_DEPRECIATION_YEARS,
  placedInServiceDate: Date | string | null = null,
): DepreciationScheduleItem[] {
  if (depreciableBasis <= 0) {
    return []
  }

  const schedule: DepreciationScheduleItem[] = []
  const totalYearsInt = Math.ceil(depreciationYears)
  let accumulatedDepreciation = 0

  // Determine placed in service month (default to January)
  let placedInServiceMonth = 1
  let startYear = new Date().getFullYear()

  if (placedInServiceDate) {
    const date = typeof placedInServiceDate === 'string'
      ? new Date(placedInServiceDate)
      : placedInServiceDate
    placedInServiceMonth = date.getMonth() + 1 // JavaScript months are 0-indexed
    startYear = date.getFullYear()
  }

  for (let i = 1; i <= totalYearsInt; i++) {
    const yearDepreciation = calculateYearDepreciation(
      depreciableBasis,
      depreciationYears,
      i,
      placedInServiceMonth,
      accumulatedDepreciation,
    )

    if (yearDepreciation <= 0) break

    const beginningBasis = depreciableBasis - accumulatedDepreciation
    accumulatedDepreciation += yearDepreciation

    // Calculate months depreciated for this year
    let monthsDepreciated = 12
    if (i === 1) {
      // First year: partial based on placed in service date
      monthsDepreciated = 13 - placedInServiceMonth // e.g., January = 12, December = 1
    } else if (i === totalYearsInt) {
      // Last year: remaining months
      monthsDepreciated = 12 - (13 - placedInServiceMonth) + 1 // Complement of first year
    }

    schedule.push({
      year: startYear + i - 1,
      monthsDepreciated: Math.round(monthsDepreciated),
      beginningBasis: Math.round(beginningBasis * 100) / 100,
      depreciation: Math.round(yearDepreciation * 100) / 100,
      accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
      remainingBasis: Math.round((depreciableBasis - accumulatedDepreciation) * 100) / 100,
    })
  }

  return schedule
}

/**
 * Calculate depreciation summary for current state
 *
 * @param depreciableBasis - The depreciable basis
 * @param depreciationYears - Total depreciation period
 * @param placedInServiceDate - Date placed in service
 * @returns Depreciation summary with current state
 */
export function calculateDepreciationSummary(
  depreciableBasis: number,
  depreciationYears: number = RESIDENTIAL_DEPRECIATION_YEARS,
  placedInServiceDate: Date | string | null = null,
): DepreciationSummary | null {
  if (!placedInServiceDate || depreciableBasis <= 0) {
    return null
  }

  const schedule = generateDepreciationSchedule(
    depreciableBasis,
    depreciationYears,
    placedInServiceDate,
  )

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // 1-indexed

  // Calculate accumulated depreciation up to current year
  let accumulatedDepreciation = 0
  let yearsCompleted = 0

  for (const item of schedule) {
    if (item.year < currentYear) {
      accumulatedDepreciation += item.depreciation
      yearsCompleted++
    } else if (item.year === currentYear) {
      // Prorate current year's depreciation by month
      const monthsElapsed = currentMonth
      const proratedDepreciation = (item.depreciation / 12) * monthsElapsed
      accumulatedDepreciation += proratedDepreciation
    }
  }

  const remainingBasis = depreciableBasis - accumulatedDepreciation
  const totalYearsInt = Math.ceil(depreciationYears)
  const yearsRemaining = Math.max(0, totalYearsInt - yearsCompleted)

  return {
    annualDepreciation: calculateAnnualDepreciation(depreciableBasis, depreciationYears),
    monthlyDepreciation: calculateMonthlyDepreciation(depreciableBasis, depreciationYears),
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    remainingBasis: Math.round(remainingBasis * 100) / 100,
    yearsRemaining,
    totalDepreciableYears: depreciationYears,
    yearsCompleted,
  }
}

// ============================================================================
// Unclaimed Depreciation (Backward Compatibility)
// ============================================================================

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
  depreciationSchedule: number = RESIDENTIAL_DEPRECIATION_YEARS,
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

// ============================================================================
// Tax Shield Calculations
// ============================================================================

/**
 * Calculate tax shield value (depreciation × marginal tax rate)
 * The tax shield represents the actual tax savings from depreciation
 *
 * @param annualDepreciation - Annual depreciation amount
 * @param marginalTaxRate - User's marginal tax rate (e.g., 0.24 for 24%)
 * @param accumulatedDepreciation - Total depreciation claimed to date
 * @returns Tax shield values
 */
export function calculateTaxShield(
  annualDepreciation: number,
  marginalTaxRate: number = DEFAULT_MARGINAL_TAX_RATE,
  accumulatedDepreciation: number = 0,
): TaxShieldValue {
  const annualTaxShield = annualDepreciation * marginalTaxRate
  const monthlyTaxShield = annualTaxShield / 12
  const totalTaxShieldToDate = accumulatedDepreciation * marginalTaxRate

  return {
    annualTaxShield: Math.round(annualTaxShield * 100) / 100,
    monthlyTaxShield: Math.round(monthlyTaxShield * 100) / 100,
    totalTaxShieldToDate: Math.round(totalTaxShieldToDate * 100) / 100,
    marginalTaxRate,
  }
}

/**
 * Calculate paper loss vs actual cash flow comparison
 * Shows how depreciation creates a "paper loss" that reduces taxable income
 *
 * @param annualCashFlow - Actual cash flow (NOI - debt service)
 * @param annualDepreciation - Annual depreciation amount
 * @param marginalTaxRate - User's marginal tax rate
 * @returns Paper loss comparison breakdown
 */
export function calculatePaperLossComparison(
  annualCashFlow: number,
  annualDepreciation: number,
  marginalTaxRate: number = DEFAULT_MARGINAL_TAX_RATE,
): PaperLossComparison {
  const paperLoss = annualDepreciation
  const taxableIncome = annualCashFlow - paperLoss

  // Tax savings from depreciation (could result in loss that offsets other income)
  const taxSavings = paperLoss * marginalTaxRate

  // Effective cash flow = actual cash + tax savings
  const effectiveCashFlow = annualCashFlow + taxSavings

  return {
    actualCashFlow: Math.round(annualCashFlow * 100) / 100,
    paperLoss: Math.round(paperLoss * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    effectiveCashFlow: Math.round(effectiveCashFlow * 100) / 100,
    taxSavings: Math.round(taxSavings * 100) / 100,
  }
}

// ============================================================================
// Cost Segregation
// ============================================================================

/**
 * Calculates cost segregation potential as percentage and level
 *
 * Cost segregation studies typically identify 20-40% of a property's basis
 * that can be accelerated (depreciated over 5, 7, or 15 years instead of 27.5/39).
 *
 * This calculation estimates potential based on property value:
 * - Higher value properties typically have better cost seg potential
 *
 * @param depreciationBasis - Depreciation basis or null
 * @returns Object with percentage, level, and potential value
 */
export function calculateCostSegPotential(
  depreciationBasis: number | null | undefined,
): CostSegregationResult | null {
  if (depreciationBasis === null || depreciationBasis === undefined) {
    return null
  }

  // Estimate percentage based on property value
  // Higher value properties typically have better cost seg potential
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

  // Calculate potential value (amount that could be accelerated)
  const potentialValue = Math.round(depreciationBasis * (percentage / 100))

  return { percentage, level, potentialValue }
}

/**
 * Calculate first-year tax benefit from cost segregation
 * Includes bonus depreciation on reclassified components
 *
 * @param amount5Year - Amount reclassified to 5-year property
 * @param amount7Year - Amount reclassified to 7-year property
 * @param amount15Year - Amount reclassified to 15-year property
 * @param bonusPercent - Bonus depreciation percentage (0-1)
 * @param marginalTaxRate - User's marginal tax rate
 * @returns First year tax benefit from cost seg
 */
export function calculateCostSegFirstYearBenefit(
  amount5Year: number = 0,
  amount7Year: number = 0,
  amount15Year: number = 0,
  bonusPercent: number = 0,
  marginalTaxRate: number = DEFAULT_MARGINAL_TAX_RATE,
): number {
  // Bonus depreciation applies to the reclassified amounts
  const totalReclassified = amount5Year + amount7Year + amount15Year
  const bonusDepreciation = totalReclassified * bonusPercent

  // First year benefit is bonus depreciation × tax rate
  return Math.round(bonusDepreciation * marginalTaxRate * 100) / 100
}

// ============================================================================
// Export Functions for CPA
// ============================================================================

export interface DepreciationExportData {
  propertyAddress: string
  propertyType: string
  depreciationType: 'residential' | 'commercial'
  depreciationYears: number
  placedInServiceDate: string
  costBasis: CostBasisComponents
  schedule: DepreciationScheduleItem[]
  summary: DepreciationSummary | null
  taxYearCurrent: number
  currentYearDepreciation: number
  generatedDate: string
}

/**
 * Generate depreciation data for CPA export
 *
 * @param propertyAddress - Full property address
 * @param propertyType - Property type (SFR, Duplex, etc.)
 * @param purchasePrice - Purchase price
 * @param closingCosts - Closing costs
 * @param initialImprovements - Pre-rental improvements
 * @param landValue - Land value
 * @param placedInServiceDate - Date placed in service
 * @returns Export data object for CPA
 */
export function generateDepreciationExportData(
  propertyAddress: string,
  propertyType: string,
  purchasePrice: number,
  closingCosts: number = 0,
  initialImprovements: number = 0,
  landValue: number | null = null,
  placedInServiceDate: Date | string,
): DepreciationExportData {
  const depreciationYears = getDepreciationSchedule(propertyType)
  const depreciationType = depreciationYears === RESIDENTIAL_DEPRECIATION_YEARS
    ? 'residential' as const
    : 'commercial' as const

  const costBasis = calculateCostBasis(
    purchasePrice,
    closingCosts,
    initialImprovements,
    landValue,
  )

  const schedule = generateDepreciationSchedule(
    costBasis.depreciableBasis,
    depreciationYears,
    placedInServiceDate,
  )

  const summary = calculateDepreciationSummary(
    costBasis.depreciableBasis,
    depreciationYears,
    placedInServiceDate,
  )

  const currentYear = new Date().getFullYear()
  const currentYearItem = schedule.find((item) => item.year === currentYear)

  const dateStr = typeof placedInServiceDate === 'string'
    ? placedInServiceDate
    : placedInServiceDate.toISOString().split('T')[0]

  return {
    propertyAddress,
    propertyType,
    depreciationType,
    depreciationYears,
    placedInServiceDate: dateStr,
    costBasis,
    schedule,
    summary,
    taxYearCurrent: currentYear,
    currentYearDepreciation: currentYearItem?.depreciation ?? 0,
    generatedDate: new Date().toISOString(),
  }
}

/**
 * Convert depreciation export data to CSV format
 *
 * @param data - Depreciation export data
 * @returns CSV string
 */
export function convertDepreciationToCSV(data: DepreciationExportData): string {
  const lines: string[] = []

  // Header information
  lines.push('DEPRECIATION SCHEDULE')
  lines.push(`Property Address,${data.propertyAddress}`)
  lines.push(`Property Type,${data.propertyType}`)
  lines.push(`Depreciation Type,${data.depreciationType}`)
  lines.push(`Depreciation Period,${data.depreciationYears} years`)
  lines.push(`Placed in Service Date,${data.placedInServiceDate}`)
  lines.push('')

  // Cost Basis
  lines.push('COST BASIS')
  lines.push(`Purchase Price,$${data.costBasis.purchasePrice.toLocaleString()}`)
  lines.push(`Closing Costs,$${data.costBasis.closingCosts.toLocaleString()}`)
  lines.push(`Initial Improvements,$${data.costBasis.initialImprovements.toLocaleString()}`)
  lines.push(`Total Cost Basis,$${data.costBasis.totalCostBasis.toLocaleString()}`)
  lines.push(`Land Value (Non-Depreciable),$${data.costBasis.landValue.toLocaleString()}`)
  lines.push(`Depreciable Basis,$${data.costBasis.depreciableBasis.toLocaleString()}`)
  lines.push('')

  // Depreciation Schedule
  lines.push('ANNUAL DEPRECIATION SCHEDULE')
  lines.push('Year,Months,Beginning Basis,Depreciation,Accumulated Depreciation,Remaining Basis')

  for (const item of data.schedule) {
    lines.push([
      item.year,
      item.monthsDepreciated,
      `$${item.beginningBasis.toLocaleString()}`,
      `$${item.depreciation.toLocaleString()}`,
      `$${item.accumulatedDepreciation.toLocaleString()}`,
      `$${item.remainingBasis.toLocaleString()}`,
    ].join(','))
  }

  lines.push('')
  lines.push(`Generated on,${data.generatedDate}`)

  return lines.join('\n')
}
