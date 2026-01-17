import { useMemo } from 'react'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'

interface MonthlyProjected {
  income: number
  expenses: number
  noi: number
  cashFlow: number
}

interface MonthlyActual {
  income: number
  expenses: number
  cashFlow: number
}

interface MonthlyVariance {
  income: number
  expenses: number
  cashFlow: number
  cashFlowPercent: number
}

interface MonthlyMetric {
  month: string // Format: "YYYY-MM"
  projected: MonthlyProjected | null
  actual: MonthlyActual | null
  variance: MonthlyVariance | null
}

interface MonthlyMetricsData {
  months: Array<MonthlyMetric>
  hasProjectedData: boolean
  hasActualData: boolean
}

/**
 * Hook to calculate monthly projected vs actual financial metrics
 * 
 * Calculates monthly breakdown for trailing 12 months:
 * - Projected: From structured data (rental income, operating expenses, loans)
 * - Actual: From transactions aggregated by month
 * - Variance: Actual - Projected
 * 
 * Data Sources:
 * - Projected: Structured data (leases, mortgages) → monthly projected values
 * - Actual: Transactions → aggregated by month
 */
export function useMonthlyMetrics(
  propertyId: string,
  monthsCount: number = 12,
): MonthlyMetricsData {
  const { data: property } = useProperty(propertyId)
  const { data: transactionsData } = usePropertyTransactions(propertyId, {
    page: 1,
    pageSize: 10000, // Get all transactions for monthly aggregation
  })

  const metrics = useMemo(() => {
    // Generate array of month strings (YYYY-MM) for trailing period
    const now = new Date()
    const months: Array<string> = []
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.push(monthStr)
    }

    const rentalIncome = property?.rentalIncome
    const operatingExpenses = property?.operatingExpenses
    const activeLoans = property?.loans?.filter((l) => l.status === 'active') || []

    // Calculate total loan payments (constant across months)
    const totalDebtService = activeLoans.reduce((sum, loan) => {
      if (loan.monthlyPrincipalInterest) {
        return sum + parseFloat(loan.monthlyPrincipalInterest)
      }
      return sum
    }, 0)

    // Calculate projected monthly values from structured data
    const calculateProjectedForMonth = (): MonthlyProjected | null => {
      // Only calculate projected if we have structured data
      if (!rentalIncome && !operatingExpenses) {
        return null
      }

      // Calculate projected income
      let projectedIncome = 0
      if (rentalIncome) {
        projectedIncome =
          (rentalIncome.monthlyRent ? parseFloat(rentalIncome.monthlyRent) : 0) +
          (rentalIncome.otherIncomeMonthly ? parseFloat(rentalIncome.otherIncomeMonthly) : 0) +
          (rentalIncome.parkingIncomeMonthly ? parseFloat(rentalIncome.parkingIncomeMonthly) : 0) +
          (rentalIncome.laundryIncomeMonthly ? parseFloat(rentalIncome.laundryIncomeMonthly) : 0) +
          (rentalIncome.petRentMonthly ? parseFloat(rentalIncome.petRentMonthly) : 0) +
          (rentalIncome.storageIncomeMonthly ? parseFloat(rentalIncome.storageIncomeMonthly) : 0) +
          (rentalIncome.utilityReimbursementMonthly ? parseFloat(rentalIncome.utilityReimbursementMonthly) : 0)
      }

      // Calculate projected expenses
      let projectedExpenses = 0
      if (operatingExpenses) {
        // Annual expenses converted to monthly
        if (operatingExpenses.propertyTaxAnnual) {
          projectedExpenses += parseFloat(operatingExpenses.propertyTaxAnnual) / 12
        }
        if (operatingExpenses.insuranceAnnual) {
          projectedExpenses += parseFloat(operatingExpenses.insuranceAnnual) / 12
        }

        // Monthly expenses
        if (operatingExpenses.hoaMonthly)
          projectedExpenses += parseFloat(operatingExpenses.hoaMonthly)
        if (operatingExpenses.waterSewerMonthly)
          projectedExpenses += parseFloat(operatingExpenses.waterSewerMonthly)
        if (operatingExpenses.trashMonthly)
          projectedExpenses += parseFloat(operatingExpenses.trashMonthly)
        if (operatingExpenses.electricMonthly)
          projectedExpenses += parseFloat(operatingExpenses.electricMonthly)
        if (operatingExpenses.gasMonthly)
          projectedExpenses += parseFloat(operatingExpenses.gasMonthly)
        if (operatingExpenses.internetMonthly)
          projectedExpenses += parseFloat(operatingExpenses.internetMonthly)
        if (operatingExpenses.lawnCareMonthly)
          projectedExpenses += parseFloat(operatingExpenses.lawnCareMonthly)
        if (operatingExpenses.snowRemovalMonthly)
          projectedExpenses += parseFloat(operatingExpenses.snowRemovalMonthly)
        if (operatingExpenses.pestControlMonthly)
          projectedExpenses += parseFloat(operatingExpenses.pestControlMonthly)
        if (operatingExpenses.poolMaintenanceMonthly)
          projectedExpenses += parseFloat(operatingExpenses.poolMaintenanceMonthly)
        if (operatingExpenses.alarmMonitoringMonthly)
          projectedExpenses += parseFloat(operatingExpenses.alarmMonitoringMonthly)
        if (operatingExpenses.otherExpensesMonthly)
          projectedExpenses += parseFloat(operatingExpenses.otherExpensesMonthly)

        // Management fee
        if (operatingExpenses.managementFlatFee) {
          projectedExpenses += parseFloat(operatingExpenses.managementFlatFee)
        } else if (operatingExpenses.managementRate && projectedIncome > 0) {
          projectedExpenses +=
            projectedIncome * parseFloat(operatingExpenses.managementRate)
        }
      }

      // Calculate CapEx reserve
      let capexReserve = 0
      if (operatingExpenses?.capexRate && projectedIncome > 0) {
        capexReserve = projectedIncome * parseFloat(operatingExpenses.capexRate)
      }

      // Calculate NOI and cash flow
      const noi = projectedIncome - projectedExpenses - capexReserve
      const cashFlow = noi - totalDebtService

      return {
        income: projectedIncome,
        expenses: projectedExpenses + capexReserve,
        noi,
        cashFlow,
      }
    }

    // Get projected values (same for all months for now)
    const projectedValue = calculateProjectedForMonth()

    // Aggregate actual values from transactions by month
    const calculateActualForMonth = (
      monthStr: string,
    ): MonthlyActual | null => {
      if (!transactionsData?.transactions) {
        return null
      }

      const [year, month] = monthStr.split('-').map(Number)
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

      const activeTransactions = transactionsData.transactions.filter(
        (t) => !t.isExcluded,
      )

      // Filter transactions for this month (using transactionDate field)
      // Note: transactionDate is stored as "YYYY-MM-DD" string, so we parse it consistently
      const monthTransactions = activeTransactions.filter((t) => {
        // Parse date string (YYYY-MM-DD) as local date to avoid timezone issues
        const [tYear, tMonth, tDay] = t.transactionDate.split('-').map(Number)
        const transactionDate = new Date(tYear, tMonth - 1, tDay)
        return transactionDate >= monthStart && transactionDate <= monthEnd
      })

      // Sum income and expenses
      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      const cashFlow = income - expenses

      return {
        income,
        expenses,
        cashFlow,
      }
    }

    // Calculate variance
    const calculateVariance = (
      projected: MonthlyProjected | null,
      actual: MonthlyActual | null,
    ): MonthlyVariance | null => {
      if (!projected || !actual) {
        return null
      }

      const incomeVariance = actual.income - projected.income
      const expensesVariance = actual.expenses - projected.expenses
      const cashFlowVariance = actual.cashFlow - projected.cashFlow
      const cashFlowPercent =
        projected.cashFlow !== 0
          ? (cashFlowVariance / Math.abs(projected.cashFlow)) * 100
          : 0

      return {
        income: incomeVariance,
        expenses: expensesVariance,
        cashFlow: cashFlowVariance,
        cashFlowPercent,
      }
    }

    // Build monthly metrics array
    const monthlyMetrics: Array<MonthlyMetric> = months.map((monthStr) => {
      const projected = projectedValue
      const actual = calculateActualForMonth(monthStr)
      const variance = calculateVariance(projected, actual)

      return {
        month: monthStr,
        projected,
        actual,
        variance,
      }
    })

    const hasProjectedData = monthlyMetrics.some((m) => m.projected !== null)
    const hasActualData = monthlyMetrics.some((m) => m.actual !== null)

    return {
      months: monthlyMetrics,
      hasProjectedData,
      hasActualData,
    }
  }, [property, transactionsData, monthsCount])

  return metrics
}

