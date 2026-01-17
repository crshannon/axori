import { useMemo } from 'react'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'

interface FinancialMetrics {
  netCashFlow: number
  totalFixedExpenses: number
  totalDebtService: number
  liquidReserves: number
  interestRate: number
}

/**
 * Hook to calculate financial metrics for a property
 * Fetches property data and transactions, then calculates:
 * - Net Cash Flow (income - expenses)
 * - Fixed Opex Burn (recurring monthly expenses)
 * - Debt Service (P&I payment estimate)
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
    if (!property || !transactionsData?.transactions) {
      return {
        netCashFlow: 0,
        totalFixedExpenses: 0,
        totalDebtService: 0,
        liquidReserves: 0,
        interestRate: 0,
      }
    }

    // Calculate net cash flow from transactions (income - expenses, excluding excluded transactions)
    const activeTransactions = transactionsData.transactions.filter(
      (t) => !t.isExcluded,
    )

    const monthlyIncome = activeTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const monthlyExpenses = activeTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const netCashFlow = monthlyIncome - monthlyExpenses

    // Calculate fixed expenses (recurring monthly expenses)
    const fixedExpenses = activeTransactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.isRecurring &&
          t.recurrenceFrequency === 'monthly',
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    // Calculate debt service from loans - use actual monthly payment if available
    const primaryLoan = property.loans?.find(
      (l) => l.isPrimary && l.status === 'active',
    )
    let totalDebtService = 0
    let interestRate = 0

    if (primaryLoan) {
      // Prefer actual monthly principal & interest payment if available
      if (primaryLoan.monthlyPrincipalInterest) {
        totalDebtService = parseFloat(primaryLoan.monthlyPrincipalInterest)
      } else {
        // Fallback: Estimate as ~1% of loan balance per month (rough approximation)
        const loanBalance = parseFloat(primaryLoan.currentBalance || '0')
        totalDebtService = loanBalance * 0.01
      }
      interestRate = parseFloat(primaryLoan.interestRate || '0') * 100
    }

    // Calculate liquid reserves (CapEx accrual)
    // From operating expenses: capexRate * 12 months
    // Or estimate as monthly expenses * 12 for reserves
    const liquidReserves = monthlyExpenses * 12 // Simplified: 12 months of expenses

    return {
      netCashFlow,
      totalFixedExpenses: fixedExpenses,
      totalDebtService,
      liquidReserves,
      interestRate,
    }
  }, [property, transactionsData])

  return metrics
}

