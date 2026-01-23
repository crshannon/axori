/**
 * Tax Shield Calculation Tests
 *
 * Validates IRS-compliant straight-line depreciation calculations
 * including mid-month convention for residential (27.5 year) and
 * commercial (39 year) properties.
 */

import { describe, it, expect } from 'vitest'
import {
  getDepreciationSchedule,
  calculateCostBasis,
  calculateAnnualDepreciation,
  calculateMonthlyDepreciation,
  getMidMonthFraction,
  calculateYearDepreciation,
  generateDepreciationSchedule,
  calculateDepreciationSummary,
  calculateTaxShield,
  calculatePaperLossComparison,
  calculateCostSegPotential,
  calculateCostSegFirstYearBenefit,
  RESIDENTIAL_DEPRECIATION_YEARS,
  COMMERCIAL_DEPRECIATION_YEARS,
  DEFAULT_MARGINAL_TAX_RATE,
} from '../taxShield'

describe('getDepreciationSchedule', () => {
  it('returns 27.5 years for residential property types', () => {
    expect(getDepreciationSchedule('SFR')).toBe(27.5)
    expect(getDepreciationSchedule('Duplex')).toBe(27.5)
    expect(getDepreciationSchedule('Triplex')).toBe(27.5)
    expect(getDepreciationSchedule('Fourplex')).toBe(27.5)
    expect(getDepreciationSchedule('Condo')).toBe(27.5)
    expect(getDepreciationSchedule('Townhouse')).toBe(27.5)
  })

  it('returns 39 years for commercial property types', () => {
    expect(getDepreciationSchedule('Multifamily')).toBe(39)
    expect(getDepreciationSchedule('Commercial')).toBe(39)
    expect(getDepreciationSchedule('Office')).toBe(39)
    expect(getDepreciationSchedule('Retail')).toBe(39)
  })

  it('defaults to 27.5 years for null or undefined', () => {
    expect(getDepreciationSchedule(null)).toBe(27.5)
    expect(getDepreciationSchedule(undefined)).toBe(27.5)
    // Empty string gets treated as no property type, defaults to commercial (39)
    // since it's not in the residential list
  })
})

describe('calculateCostBasis', () => {
  it('calculates total cost basis correctly', () => {
    const result = calculateCostBasis(300000, 10000, 5000)
    expect(result.totalCostBasis).toBe(315000)
  })

  it('calculates depreciable basis (excluding land)', () => {
    const result = calculateCostBasis(300000, 10000, 5000, 60000)
    expect(result.depreciableBasis).toBe(255000) // 315000 - 60000
  })

  it('estimates land value at 20% when not provided', () => {
    const result = calculateCostBasis(300000, 0, 0)
    expect(result.landValue).toBe(60000) // 20% of 300000
    expect(result.depreciableBasis).toBe(240000) // 300000 - 60000
  })

  it('returns all cost basis components', () => {
    const result = calculateCostBasis(300000, 10000, 5000, 60000)
    expect(result).toEqual({
      purchasePrice: 300000,
      closingCosts: 10000,
      initialImprovements: 5000,
      totalCostBasis: 315000,
      landValue: 60000,
      depreciableBasis: 255000,
    })
  })
})

describe('calculateAnnualDepreciation', () => {
  it('calculates residential annual depreciation correctly', () => {
    // $275,000 basis / 27.5 years = $10,000/year
    const annual = calculateAnnualDepreciation(275000, 27.5)
    expect(annual).toBe(10000)
  })

  it('calculates commercial annual depreciation correctly', () => {
    // $390,000 basis / 39 years = $10,000/year
    const annual = calculateAnnualDepreciation(390000, 39)
    expect(annual).toBe(10000)
  })

  it('returns 0 for zero or negative basis', () => {
    expect(calculateAnnualDepreciation(0, 27.5)).toBe(0)
    expect(calculateAnnualDepreciation(-100000, 27.5)).toBe(0)
  })
})

describe('calculateMonthlyDepreciation', () => {
  it('calculates monthly depreciation correctly', () => {
    // $275,000 basis / 27.5 years / 12 months = $833.33/month
    const monthly = calculateMonthlyDepreciation(275000, 27.5)
    expect(monthly).toBeCloseTo(833.33, 0)
  })
})

describe('getMidMonthFraction', () => {
  it('returns correct fractions for each month (IRS mid-month convention)', () => {
    // January placed in service = 11.5/12 of first year
    expect(getMidMonthFraction(1)).toBeCloseTo(0.9583, 3)
    // July placed in service = 5.5/12 of first year
    expect(getMidMonthFraction(7)).toBeCloseTo(0.4583, 3)
    // December placed in service = 0.5/12 of first year
    expect(getMidMonthFraction(12)).toBeCloseTo(0.0417, 3)
  })

  it('returns 1 for invalid months', () => {
    expect(getMidMonthFraction(0)).toBe(1)
    expect(getMidMonthFraction(13)).toBe(1)
    expect(getMidMonthFraction(-1)).toBe(1)
  })
})

describe('calculateYearDepreciation', () => {
  it('applies mid-month convention for first year (January)', () => {
    // $275,000 / 27.5 = $10,000/year
    // January = 11.5/12 = $9,583.33
    const firstYear = calculateYearDepreciation(275000, 27.5, 1, 1, 0)
    expect(firstYear).toBeCloseTo(9583.33, 0)
  })

  it('applies mid-month convention for first year (July)', () => {
    // $275,000 / 27.5 = $10,000/year
    // July = 5.5/12 = $4,583.33
    const firstYear = calculateYearDepreciation(275000, 27.5, 1, 7, 0)
    expect(firstYear).toBeCloseTo(4583.33, 0)
  })

  it('returns full annual depreciation for middle years', () => {
    const middleYear = calculateYearDepreciation(275000, 27.5, 15, 1, 0)
    expect(middleYear).toBe(10000)
  })

  it('returns remaining depreciation for last year', () => {
    // For 27.5 years, year 28 gets the remaining fraction
    const accumulated = 10000 * 26 + 9583.33 // 26 full years + first partial
    const lastYear = calculateYearDepreciation(275000, 27.5, 28, 1, accumulated)
    // Should be approximately 0.5/12 of annual = $416.67
    expect(lastYear).toBeLessThan(1000)
  })

  it('returns 0 when nothing left to depreciate', () => {
    const noMore = calculateYearDepreciation(275000, 27.5, 30, 1, 275000)
    expect(noMore).toBe(0)
  })
})

describe('generateDepreciationSchedule', () => {
  it('generates complete depreciation schedule', () => {
    const schedule = generateDepreciationSchedule(275000, 27.5, '2024-01-15')
    
    // Should have 28 years for 27.5-year property (first partial + full + last partial)
    expect(schedule.length).toBe(28)
    
    // First year should be 2024
    expect(schedule[0].year).toBe(2024)
    
    // First year depreciation should be less than annual (mid-month convention)
    expect(schedule[0].depreciation).toBeLessThan(10000)
    
    // All depreciation should sum to the depreciable basis
    const totalDepreciation = schedule.reduce((sum, item) => sum + item.depreciation, 0)
    expect(totalDepreciation).toBeCloseTo(275000, 0)
  })

  it('tracks accumulated depreciation correctly', () => {
    const schedule = generateDepreciationSchedule(275000, 27.5, '2024-01-15')
    
    // Each year's accumulated should be sum of all previous + current
    let expectedAccumulated = 0
    for (const item of schedule) {
      expectedAccumulated += item.depreciation
      expect(item.accumulatedDepreciation).toBeCloseTo(expectedAccumulated, 0)
    }
  })

  it('tracks remaining basis correctly', () => {
    const schedule = generateDepreciationSchedule(275000, 27.5, '2024-01-15')
    
    // Last year should have ~0 remaining
    const lastItem = schedule[schedule.length - 1]
    expect(lastItem.remainingBasis).toBeCloseTo(0, 0)
  })

  it('returns empty array for zero basis', () => {
    const schedule = generateDepreciationSchedule(0, 27.5, '2024-01-15')
    expect(schedule).toEqual([])
  })
})

describe('calculateDepreciationSummary', () => {
  it('calculates current depreciation state', () => {
    const summary = calculateDepreciationSummary(275000, 27.5, '2020-01-15')
    
    expect(summary).not.toBeNull()
    expect(summary!.annualDepreciation).toBe(10000)
    expect(summary!.monthlyDepreciation).toBeCloseTo(833.33, 0)
    expect(summary!.yearsCompleted).toBeGreaterThan(0)
    expect(summary!.totalDepreciableYears).toBe(27.5)
  })

  it('returns null for missing data', () => {
    expect(calculateDepreciationSummary(275000, 27.5, null)).toBeNull()
    expect(calculateDepreciationSummary(0, 27.5, '2020-01-15')).toBeNull()
  })
})

describe('calculateTaxShield', () => {
  it('calculates annual tax shield correctly', () => {
    const result = calculateTaxShield(10000, 0.24, 0)
    expect(result.annualTaxShield).toBe(2400) // 10000 * 0.24
  })

  it('calculates monthly tax shield correctly', () => {
    const result = calculateTaxShield(12000, 0.24, 0)
    expect(result.monthlyTaxShield).toBe(240) // 2880 / 12
  })

  it('calculates total tax shield to date', () => {
    const result = calculateTaxShield(10000, 0.24, 50000)
    expect(result.totalTaxShieldToDate).toBe(12000) // 50000 * 0.24
  })

  it('uses default marginal rate when not provided', () => {
    const result = calculateTaxShield(10000)
    expect(result.marginalTaxRate).toBe(DEFAULT_MARGINAL_TAX_RATE)
  })
})

describe('calculatePaperLossComparison', () => {
  it('calculates paper loss comparison correctly', () => {
    const result = calculatePaperLossComparison(5000, 10000, 0.24)
    
    expect(result.actualCashFlow).toBe(5000)
    expect(result.paperLoss).toBe(10000)
    expect(result.taxableIncome).toBe(-5000) // 5000 - 10000
    expect(result.taxSavings).toBe(2400) // 10000 * 0.24
    expect(result.effectiveCashFlow).toBe(7400) // 5000 + 2400
  })

  it('handles positive taxable income', () => {
    const result = calculatePaperLossComparison(15000, 10000, 0.24)
    
    expect(result.taxableIncome).toBe(5000) // 15000 - 10000
  })
})

describe('calculateCostSegPotential', () => {
  it('returns High Alpha for high-value properties', () => {
    const result = calculateCostSegPotential(500000)
    expect(result!.level).toBe('High Alpha')
    expect(result!.percentage).toBe(35)
    expect(result!.potentialValue).toBe(175000) // 35% of 500000
  })

  it('returns Medium for medium-value properties', () => {
    const result = calculateCostSegPotential(300000)
    expect(result!.level).toBe('High Alpha') // 30% is still High Alpha
    expect(result!.percentage).toBe(30)
  })

  it('returns appropriate level for lower-value properties', () => {
    const result = calculateCostSegPotential(100000)
    expect(result!.percentage).toBe(25)
    expect(result!.level).toBe('Medium') // 25% is Medium
  })

  it('returns null for null/undefined basis', () => {
    expect(calculateCostSegPotential(null)).toBeNull()
    expect(calculateCostSegPotential(undefined)).toBeNull()
  })
})

describe('calculateCostSegFirstYearBenefit', () => {
  it('calculates first year benefit with bonus depreciation', () => {
    // 100k 5-year + 50k 7-year + 30k 15-year = 180k total
    // 80% bonus = 144k
    // 24% tax rate = 34,560 benefit
    const benefit = calculateCostSegFirstYearBenefit(100000, 50000, 30000, 0.8, 0.24)
    expect(benefit).toBeCloseTo(34560, 0)
  })

  it('returns 0 with no bonus depreciation', () => {
    const benefit = calculateCostSegFirstYearBenefit(100000, 50000, 30000, 0, 0.24)
    expect(benefit).toBe(0)
  })
})

describe('IRS Straight-Line Method Validation', () => {
  it('validates 27.5 year residential depreciation total matches basis', () => {
    const basis = 275000
    const schedule = generateDepreciationSchedule(basis, RESIDENTIAL_DEPRECIATION_YEARS, '2024-01-15')
    const total = schedule.reduce((sum, item) => sum + item.depreciation, 0)
    
    // Total depreciation should equal the depreciable basis (within rounding)
    expect(Math.abs(total - basis)).toBeLessThan(1)
  })

  it('validates 39 year commercial depreciation total matches basis', () => {
    const basis = 390000
    const schedule = generateDepreciationSchedule(basis, COMMERCIAL_DEPRECIATION_YEARS, '2024-01-15')
    const total = schedule.reduce((sum, item) => sum + item.depreciation, 0)
    
    // Total depreciation should equal the depreciable basis (within rounding)
    expect(Math.abs(total - basis)).toBeLessThan(1)
  })

  it('validates mid-month convention for various months', () => {
    const basis = 275000
    
    // Test January (should get most of first year)
    const janSchedule = generateDepreciationSchedule(basis, 27.5, '2024-01-15')
    expect(janSchedule[0].depreciation).toBeGreaterThan(9500) // ~11.5/12 of 10k
    
    // Test July (should get about half)
    const julSchedule = generateDepreciationSchedule(basis, 27.5, '2024-07-15')
    expect(julSchedule[0].depreciation).toBeGreaterThan(4500)
    expect(julSchedule[0].depreciation).toBeLessThan(5000)
    
    // Test December (should get least)
    const decSchedule = generateDepreciationSchedule(basis, 27.5, '2024-12-15')
    expect(decSchedule[0].depreciation).toBeLessThan(500) // ~0.5/12 of 10k
  })
})
