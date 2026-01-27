import { useMemo } from 'react'
import type { Property } from '@/hooks/api/useProperties'
import {
  calculateCapExReserve,
  calculateCashFlow,
  calculateGrossIncome,
  calculateNOI,
  calculateTotalDebtService,
  calculateTotalFixedExpenses,
} from '@/utils/finances'
import { usePropertyCompleteness } from '@/components/property-hub/property-details/overview/hooks/usePropertyCompleteness'

export interface PropertyGridMetrics {
  // Completeness score (0-100)
  score: number

  // Cash flow (prefer calculated NOI-based, fallback to simple calculation)
  cashFlow: number
  cashFlowSource: 'calculated' | 'simple'

  // Current value
  currentValue: number | null

  // Additional metrics
  equity: number | null
  capRate: number | null
  ltv: number | null

  // Data completeness status
  dataCompleteness: {
    hasRentalIncome: boolean
    hasCurrentValue: boolean
    missingFields: Array<'rentalIncome' | 'currentValue'>
  }
}

/**
 * Calculate comprehensive property metrics for grid/list views
 * Uses the same calculation logic as useFinancialPulse and usePropertyMetrics
 * but works synchronously with Property objects (no API calls)
 */
export function usePropertyGridMetrics(
  property: Property,
): PropertyGridMetrics {
  // Use the same Asset Fidelity score calculation as the overview page
  const completeness = usePropertyCompleteness(property, property.id)

  return useMemo(() => {
    // Use the Asset Fidelity score from usePropertyCompleteness (same as overview page)
    const score = completeness.score

    // Get current value (convert to number if string)
    // Handle both string and number types, filter out NaN and 0 if they're invalid
    const rawCurrentValue =
      property.valuation?.currentValue ?? property.acquisition?.currentValue
    const currentValue =
      rawCurrentValue !== null && rawCurrentValue !== undefined
        ? (typeof rawCurrentValue === 'string'
            ? parseFloat(rawCurrentValue)
            : Number(rawCurrentValue)) || null
        : null

    // Calculate cash flow using structured data (NOI-based)
    let cashFlow = 0
    let cashFlowSource: 'calculated' | 'simple' = 'simple'

    const rentalIncome = property.rentalIncome
    const operatingExpenses = property.operatingExpenses

    // Check if we have meaningful operating expenses data (not just empty object)
    const hasOperatingExpenses =
      operatingExpenses &&
      typeof operatingExpenses === 'object' &&
      Object.keys(operatingExpenses).length > 0

    // Try to calculate using NOI-based approach (same as useFinancialPulse)
    if (rentalIncome || hasOperatingExpenses) {
      try {
        // Calculate gross income using shared utility
        const grossIncome = calculateGrossIncome(rentalIncome, [])

        // Calculate debt service using shared utility
        const totalDebtService = calculateTotalDebtService(property.loans || [])

        // Calculate total fixed expenses using shared utility
        const totalFixedExpenses = calculateTotalFixedExpenses(
          operatingExpenses,
          [],
          grossIncome,
        )

        // Calculate CapEx reserve using shared utility
        const capexReserve = calculateCapExReserve(
          grossIncome,
          operatingExpenses?.capexRate,
        )

        // Calculate NOI using shared utility
        const noi = calculateNOI(grossIncome, totalFixedExpenses, capexReserve)

        // Calculate cash flow using shared utility: NOI - Loan Payments
        cashFlow = calculateCashFlow(noi, totalDebtService)
        cashFlowSource = 'calculated'
      } catch (error) {
        // Fallback to simple calculation if structured calculation fails
        console.warn('Failed to calculate structured cash flow:', error)
      }
    }

    // Fallback to simple calculation if structured calculation wasn't used
    if (cashFlowSource === 'simple') {
      const monthlyRent = Number(property.rentalIncome?.monthlyRent || 0)
      const monthlyExpenses = 0 // Simplified - will be calculated when operatingExpenses interface is updated
      const activeLoan = property.loans?.find(
        (l) => l.status === 'active' && l.isPrimary,
      )
      const monthlyLoanPayment = activeLoan?.monthlyPrincipalInterest
        ? Number(activeLoan.monthlyPrincipalInterest)
        : 0
      cashFlow = monthlyRent - monthlyExpenses - monthlyLoanPayment
    }

    // Calculate equity
    const purchasePrice = property.acquisition?.purchasePrice
      ? Number(property.acquisition.purchasePrice)
      : null
    const loans = property.loans || []
    const activeLoans = loans.filter((loan) => loan.status === 'active')
    const totalLoanAmount = activeLoans.reduce((sum, loan) => {
      return sum + (loan.currentBalance ? Number(loan.currentBalance) : 0)
    }, 0)

    // Ensure currentValue is a valid number (not NaN, not 0 if it was originally null/undefined)
    const currentValueNum =
      currentValue !== null &&
      !isNaN(currentValue) &&
      isFinite(currentValue) &&
      currentValue > 0
        ? currentValue
        : null

    const equity =
      currentValueNum !== null && currentValueNum > 0
        ? currentValueNum - totalLoanAmount
        : purchasePrice !== null && !isNaN(purchasePrice) && purchasePrice > 0
          ? purchasePrice - totalLoanAmount
          : null

    // Calculate cap rate using proper NOI calculation
    // Reuse grossIncome, totalFixedExpenses, capexReserve from above if available
    const grossIncomeForCapRate = calculateGrossIncome(rentalIncome, [])
    const fixedExpensesForCapRate = calculateTotalFixedExpenses(
      operatingExpenses,
      [],
      grossIncomeForCapRate,
    )
    const capexReserveForCapRate = calculateCapExReserve(
      grossIncomeForCapRate,
      operatingExpenses?.capexRate,
    )
    const noiForCapRate = calculateNOI(
      grossIncomeForCapRate,
      fixedExpensesForCapRate,
      capexReserveForCapRate,
    )
    const annualNOI = noiForCapRate * 12

    const capRate =
      currentValueNum !== null &&
      currentValueNum > 0 &&
      grossIncomeForCapRate > 0
        ? (annualNOI / currentValueNum) * 100
        : null

    // Calculate LTV
    const ltv =
      currentValueNum !== null && currentValueNum > 0
        ? (totalLoanAmount / currentValueNum) * 100
        : null

    // Check data completeness
    const hasRentalIncome =
      !!property.rentalIncome?.monthlyRent &&
      Number(property.rentalIncome.monthlyRent) > 0
    const hasCurrentValue = currentValueNum !== null && currentValueNum > 0

    const missingFields: Array<'rentalIncome' | 'currentValue'> = []
    if (!hasRentalIncome) {
      missingFields.push('rentalIncome')
    }
    if (!hasCurrentValue) {
      missingFields.push('currentValue')
    }

    return {
      score,
      cashFlow,
      cashFlowSource,
      currentValue: currentValueNum,
      equity,
      capRate,
      ltv,
      dataCompleteness: {
        hasRentalIncome,
        hasCurrentValue,
        missingFields,
      },
    }
  }, [property, completeness.score])
}
