import { useMemo } from 'react'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'
import {
  calculateCapExReserve,
  calculateCashFlow,
  calculateGrossIncome,
  calculateNOI,
  calculateTotalDebtService,
  calculateTotalFixedExpenses,
  getPrimaryLoanInterestRate,
} from '@/utils/finances'

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
    const rentalIncome = property?.rentalIncome
    const operatingExpenses = property?.operatingExpenses
    const activeTransactions = (transactionsData?.transactions || []).filter(
      (t) => !t.isExcluded,
    )

    // Calculate projected cash flow from structured data (NOI - Loan Payments)
    let projectedCashFlow: number | null = null
    let projectedSource: 'structured' | null = null
    let totalDebtService = 0
    let interestRate = 0

    // Calculate gross income using shared utility
    const grossIncome = calculateGrossIncome(rentalIncome, activeTransactions)

    // Calculate debt service using shared utility
    totalDebtService = calculateTotalDebtService(property?.loans || [])
    interestRate = getPrimaryLoanInterestRate(property?.loans || [])

    // Check if primary loan has escrow (tax/insurance included in loan payment)
    const primaryLoan = (property?.loans || []).find(
      (l) => l.isPrimary && l.status === 'active',
    )
    const hasEscrow = primaryLoan?.hasEscrow ?? false

    // Calculate total fixed expenses using shared utility
    // This combines structured expenses + recurring transactions, excluding duplicates and loan payments
    // Pass hasEscrow to skip tax/insurance if they're paid through loan escrow
    const totalFixedExpenses = calculateTotalFixedExpenses(
      operatingExpenses,
      activeTransactions,
      grossIncome,
      hasEscrow,
    )

    // Calculate NOI directly from structured data (to avoid circular dependency with useOperatingCore)
    // Only set projected if we have structured data (rentalIncome or operatingExpenses)
    if (property?.rentalIncome || property?.operatingExpenses) {
      // Calculate CapEx reserve using shared utility
      const capexReserve = calculateCapExReserve(
        grossIncome,
        operatingExpenses?.capexRate,
      )

      // Calculate NOI using shared utility
      const noi = calculateNOI(grossIncome, totalFixedExpenses, capexReserve)

      // Calculate projected cash flow using shared utility: NOI - Loan Payments
      projectedCashFlow = calculateCashFlow(noi, totalDebtService)
      projectedSource = 'structured'
    }

    // Calculate actual cash flow from transactions (current month only)
    let actualCashFlow: number | null = null
    let actualSource: 'transactions' | null = null
    let liquidReserves = 0

    if (
      transactionsData?.transactions &&
      transactionsData.transactions.length > 0
    ) {
      // Filter to current month transactions only
      const today = new Date()
      const currentMonthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      )
      const currentMonthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      )

      const currentMonthTransactions = activeTransactions.filter((t) => {
        // Parse transaction date (stored as "YYYY-MM-DD" string)
        const [tYear, tMonth, tDay] = t.transactionDate.split('-').map(Number)
        const transactionDate = new Date(tYear, tMonth - 1, tDay)
        return (
          transactionDate >= currentMonthStart &&
          transactionDate <= currentMonthEnd
        )
      })

      // If no current month transactions, try most recent month with transactions
      let transactionsToUse = currentMonthTransactions
      if (transactionsToUse.length === 0) {
        // Find the most recent month that has transactions
        const transactionsByMonth = new Map<string, typeof activeTransactions>()
        activeTransactions.forEach((t) => {
          const [tYear, tMonth] = t.transactionDate.split('-').map(Number)
          const monthKey = `${tYear}-${String(tMonth).padStart(2, '0')}`
          if (!transactionsByMonth.has(monthKey)) {
            transactionsByMonth.set(monthKey, [])
          }
          transactionsByMonth.get(monthKey)!.push(t)
        })

        // Get the most recent month
        const sortedMonths = Array.from(transactionsByMonth.keys())
          .sort()
          .reverse()
        if (sortedMonths.length > 0) {
          transactionsToUse = transactionsByMonth.get(sortedMonths[0]) || []
        }
      }

      if (transactionsToUse.length > 0) {
        const monthlyIncome = transactionsToUse
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        const monthlyExpenses = transactionsToUse
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        actualCashFlow = monthlyIncome - monthlyExpenses
        actualSource = 'transactions'

        // Calculate liquid reserves (12 months of average monthly expenses)
        // Use all transactions to get average monthly expenses
        const allMonthlyExpenses = activeTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
        const monthsOfData = Math.max(
          1,
          new Set(
            activeTransactions.map((t) => {
              const [year, month] = t.transactionDate.split('-').map(Number)
              return `${year}-${month}`
            }),
          ).size,
        )
        const avgMonthlyExpenses = allMonthlyExpenses / monthsOfData
        liquidReserves = avgMonthlyExpenses * 12
      }
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
      actualCashFlow !== null ? actualCashFlow : (projectedCashFlow ?? 0)

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
