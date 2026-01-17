import { useMemo } from 'react'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'

interface FinancialMetrics {
  // Projected metrics (from structured data)
  projectedCashFlow: number | null // NOI - Loan Payments (null if structured data unavailable)
  projectedSource: 'structured' | null // Data source indicator

  // Actual metrics (from transactions)
  actualCashFlow: number | null // Income - Expenses (null if no transactions)
  actualSource: 'transactions' | null // Data source indicator

  // Legacy: netCashFlow (prefer actual, fallback to projected)
  netCashFlow: number

  // Variance (actual - projected)
  variance: number | null // null if either projected or actual unavailable
  variancePercent: number | null // null if either projected or actual unavailable

  // Other metrics
  totalFixedExpenses: number
  totalDebtService: number
  liquidReserves: number
  interestRate: number

  // Data availability flags
  hasProjectedData: boolean
  hasActualData: boolean
}

/**
 * Hook to calculate financial metrics for a property
 *
 * Data Sources:
 * - Projected: Structured data (leases, mortgages) → NOI - Loan Payments
 * - Actual: Transactions → Income - Expenses
 *
 * Calculates:
 * - Projected Cash Flow (from structured data: NOI - Loan Payments)
 * - Actual Cash Flow (from transactions: Income - Expenses)
 * - Variance (actual - projected)
 * - Fixed Opex Burn (recurring monthly expenses from transactions)
 * - Debt Service (P&I payment from loan data)
 * - Liquid Reserves (12 months of expenses)
 * - Interest Rate (from primary loan)
 */
export function useFinancialPulse(propertyId: string): FinancialMetrics {
  const { data: property } = useProperty(propertyId)

  // Fetch transactions for calculations
  const { data: transactionsData } = usePropertyTransactions(propertyId, {
    page: 1,
    pageSize: 1000, // Get all transactions for calculations
  })

  // Calculate financial metrics from property data and transactions
  const metrics = useMemo(() => {
    // Calculate projected cash flow from structured data (NOI - Loan Payments)
    let projectedCashFlow: number | null = null
    let projectedSource: 'structured' | null = null
    let totalDebtService = 0
    let interestRate = 0

    // Get loan payments from loan data
    const activeLoans = property?.loans?.filter(
      (l) => l.status === 'active',
    ) || []

    // Sum all active loan payments (not just primary)
    activeLoans.forEach((loan) => {
      if (loan.monthlyPrincipalInterest) {
        totalDebtService += parseFloat(loan.monthlyPrincipalInterest)
      }
    })

    // Get primary loan for interest rate display
    const primaryLoan = activeLoans.find((l) => l.isPrimary)
    if (primaryLoan) {
      interestRate = parseFloat(primaryLoan.interestRate || '0') * 100
    }

    // Calculate NOI directly from structured data (to avoid circular dependency with useOperatingCore)
    // Only set projected if we have structured data (rentalIncome or operatingExpenses)
    if (property?.rentalIncome || property?.operatingExpenses) {
      const rentalIncome = property.rentalIncome
      const operatingExpenses = property.operatingExpenses
      const activeTransactions =
        (transactionsData?.transactions || []).filter((t) => !t.isExcluded)

      // Calculate gross income
      let grossIncome = 0
      if (rentalIncome) {
        grossIncome =
          (rentalIncome.monthlyRent ? parseFloat(rentalIncome.monthlyRent) : 0) +
          (rentalIncome.otherIncomeMonthly ? parseFloat(rentalIncome.otherIncomeMonthly) : 0) +
          (rentalIncome.parkingIncomeMonthly ? parseFloat(rentalIncome.parkingIncomeMonthly) : 0) +
          (rentalIncome.laundryIncomeMonthly ? parseFloat(rentalIncome.laundryIncomeMonthly) : 0) +
          (rentalIncome.petRentMonthly ? parseFloat(rentalIncome.petRentMonthly) : 0) +
          (rentalIncome.storageIncomeMonthly ? parseFloat(rentalIncome.storageIncomeMonthly) : 0) +
          (rentalIncome.utilityReimbursementMonthly ? parseFloat(rentalIncome.utilityReimbursementMonthly) : 0)
      }

      // Fallback to transactions if no structured income
      if (!rentalIncome || grossIncome === 0) {
        const transactionIncome = activeTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        grossIncome = grossIncome > 0 ? grossIncome : transactionIncome
      }

      // Calculate total fixed expenses from structured data
      let totalFixedExpenses = 0
      if (operatingExpenses) {
        // Annual expenses converted to monthly
        if (operatingExpenses.propertyTaxAnnual) {
          totalFixedExpenses += parseFloat(operatingExpenses.propertyTaxAnnual) / 12
        }
        if (operatingExpenses.insuranceAnnual) {
          totalFixedExpenses += parseFloat(operatingExpenses.insuranceAnnual) / 12
        }
        // Monthly expenses
        if (operatingExpenses.hoaMonthly) totalFixedExpenses += parseFloat(operatingExpenses.hoaMonthly)
        if (operatingExpenses.waterSewerMonthly) totalFixedExpenses += parseFloat(operatingExpenses.waterSewerMonthly)
        if (operatingExpenses.trashMonthly) totalFixedExpenses += parseFloat(operatingExpenses.trashMonthly)
        if (operatingExpenses.electricMonthly) totalFixedExpenses += parseFloat(operatingExpenses.electricMonthly)
        if (operatingExpenses.gasMonthly) totalFixedExpenses += parseFloat(operatingExpenses.gasMonthly)
        if (operatingExpenses.internetMonthly) totalFixedExpenses += parseFloat(operatingExpenses.internetMonthly)
        if (operatingExpenses.lawnCareMonthly) totalFixedExpenses += parseFloat(operatingExpenses.lawnCareMonthly)
        if (operatingExpenses.snowRemovalMonthly) totalFixedExpenses += parseFloat(operatingExpenses.snowRemovalMonthly)
        if (operatingExpenses.pestControlMonthly) totalFixedExpenses += parseFloat(operatingExpenses.pestControlMonthly)
        if (operatingExpenses.poolMaintenanceMonthly) totalFixedExpenses += parseFloat(operatingExpenses.poolMaintenanceMonthly)
        if (operatingExpenses.alarmMonitoringMonthly) totalFixedExpenses += parseFloat(operatingExpenses.alarmMonitoringMonthly)
        if (operatingExpenses.otherExpensesMonthly) totalFixedExpenses += parseFloat(operatingExpenses.otherExpensesMonthly)
        // Management fee
        if (operatingExpenses.managementFlatFee) {
          totalFixedExpenses += parseFloat(operatingExpenses.managementFlatFee)
        } else if (operatingExpenses.managementRate && grossIncome > 0) {
          totalFixedExpenses += grossIncome * parseFloat(operatingExpenses.managementRate)
        }
      }

      // Add recurring monthly expenses from transactions (excluding management if already in structured)
      const hasManagementExpense = operatingExpenses?.managementFlatFee || operatingExpenses?.managementRate
      const transactionExpenses = activeTransactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.isRecurring &&
            t.recurrenceFrequency === 'monthly' &&
            !(hasManagementExpense && t.category?.toLowerCase() === 'management'),
        )
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      totalFixedExpenses += transactionExpenses

      // Calculate CapEx reserve
      let capexReserve = 0
      if (operatingExpenses?.capexRate && grossIncome > 0) {
        capexReserve = grossIncome * parseFloat(operatingExpenses.capexRate)
      }

      // Calculate NOI (Net Operating Income = gross income - operating expenses - capex)
      const noi = grossIncome - totalFixedExpenses - capexReserve

      // Calculate projected cash flow: NOI - Loan Payments
      projectedCashFlow = noi - totalDebtService
      projectedSource = 'structured'
    }

    // Calculate actual cash flow from transactions
    let actualCashFlow: number | null = null
    let actualSource: 'transactions' | null = null
    let totalFixedExpenses = 0
    let liquidReserves = 0

    if (transactionsData?.transactions) {
      const activeTransactions = transactionsData.transactions.filter(
        (t) => !t.isExcluded,
      )

      const monthlyIncome = activeTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      const monthlyExpenses = activeTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      actualCashFlow = monthlyIncome - monthlyExpenses
      actualSource = 'transactions'

      // Calculate fixed expenses (recurring monthly expenses)
      totalFixedExpenses = activeTransactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.isRecurring &&
            t.recurrenceFrequency === 'monthly',
        )
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      // Calculate liquid reserves (CapEx accrual)
      liquidReserves = monthlyExpenses * 12 // Simplified: 12 months of expenses
    }

    // Calculate variance (actual - projected)
    let variance: number | null = null
    let variancePercent: number | null = null
    if (actualCashFlow !== null && projectedCashFlow !== null) {
      variance = actualCashFlow - projectedCashFlow
      variancePercent =
        projectedCashFlow !== 0
          ? (variance / Math.abs(projectedCashFlow)) * 100
          : null
    }

    // Legacy: netCashFlow (prefer actual, fallback to projected)
    const netCashFlow =
      actualCashFlow !== null ? actualCashFlow : projectedCashFlow ?? 0

    return {
      projectedCashFlow,
      projectedSource,
      actualCashFlow,
      actualSource,
      netCashFlow,
      variance,
      variancePercent,
      totalFixedExpenses,
      totalDebtService,
      liquidReserves,
      interestRate,
      hasProjectedData: projectedCashFlow !== null,
      hasActualData: actualCashFlow !== null,
    }
  }, [property, transactionsData])

  return metrics
}

