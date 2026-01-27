import { useMemo } from 'react'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'
import {
  calculateCapExReserve,
  calculateCashFlow,
  calculateFixedExpensesFromStructured,
  calculateGrossIncomeFromStructured,
  calculateManagementFee,
  calculateNOI,
  calculateTotalDebtService,
} from '@/utils/finances'

interface DailyProjected {
  income: number
  expenses: number
  noi: number
  cashFlow: number
}

interface DailyActual {
  income: number
  expenses: number
  cashFlow: number
}

interface DailyVariance {
  income: number
  expenses: number
  cashFlow: number
  cashFlowPercent: number
}

interface DailyMetric {
  date: string // Format: "YYYY-MM-DD"
  projected: DailyProjected | null
  actual: DailyActual | null
  variance: DailyVariance | null
}

interface DailyMetricsData {
  days: Array<DailyMetric>
  hasProjectedData: boolean
  hasActualData: boolean
}

/**
 * Hook to calculate daily projected vs actual financial metrics
 *
 * Calculates daily breakdown for trailing N days (typically 30 or 90):
 * - Projected: From structured data, distributed evenly across days in the period
 * - Actual: From transactions aggregated by day
 * - Variance: Actual - Projected
 *
 * Data Sources:
 * - Projected: Structured data (leases, mortgages) → monthly values distributed daily
 * - Actual: Transactions → aggregated by day
 */
export function useDailyMetrics(
  propertyId: string,
  daysCount: number = 30,
): DailyMetricsData {
  const { data: property } = useProperty(propertyId)
  const { data: transactionsData } = usePropertyTransactions(propertyId, {
    page: 1,
    pageSize: 10000, // Get all transactions for daily aggregation
  })

  const metrics = useMemo(() => {
    // Generate array of date strings (YYYY-MM-DD) for trailing period
    const now = new Date()
    const dates: Array<string> = []
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      dates.push(`${year}-${month}-${day}`)
    }

    const rentalIncome = property?.rentalIncome
    const operatingExpenses = property?.operatingExpenses
    const activeLoans =
      property?.loans?.filter((l) => l.status === 'active') || []

    // Calculate total loan payments using shared utility (constant across days)
    const totalDebtService = calculateTotalDebtService(activeLoans)

    // Calculate projected monthly values from structured data
    const calculateProjectedMonthly = (): DailyProjected | null => {
      // Only calculate projected if we have structured data
      if (!rentalIncome && !operatingExpenses) {
        return null
      }

      // Calculate projected income using shared utility
      const projectedIncome = calculateGrossIncomeFromStructured(rentalIncome)

      // Calculate projected expenses using shared utilities
      let projectedExpenses =
        calculateFixedExpensesFromStructured(operatingExpenses)

      // Add management fee (requires gross income)
      projectedExpenses += calculateManagementFee(
        operatingExpenses,
        projectedIncome,
      )

      // Calculate CapEx reserve using shared utility
      const capexReserve = calculateCapExReserve(
        projectedIncome,
        operatingExpenses?.capexRate,
      )

      // Calculate NOI and cash flow using shared utilities
      const noi = calculateNOI(projectedIncome, projectedExpenses, capexReserve)
      const cashFlow = calculateCashFlow(noi, totalDebtService)

      return {
        income: projectedIncome,
        expenses: projectedExpenses + capexReserve,
        noi,
        cashFlow,
      }
    }

    // Get projected monthly values
    const projectedMonthly = calculateProjectedMonthly()

    // Distribute monthly projected values across days
    // For daily view, we distribute the monthly amount evenly across the days in the period
    const daysInPeriod = daysCount
    const projectedDaily: DailyProjected | null = projectedMonthly
      ? {
          income: projectedMonthly.income / daysInPeriod,
          expenses: projectedMonthly.expenses / daysInPeriod,
          noi: projectedMonthly.noi / daysInPeriod,
          cashFlow: projectedMonthly.cashFlow / daysInPeriod,
        }
      : null

    // Aggregate actual values from transactions by day
    const calculateActualForDay = (dateStr: string): DailyActual | null => {
      if (!transactionsData?.transactions) {
        return null
      }

      const [year, month, day] = dateStr.split('-').map(Number)
      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0)
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999)

      const activeTransactions = transactionsData.transactions.filter(
        (t) => !t.isExcluded,
      )

      // Filter transactions for this day
      const dayTransactions = activeTransactions.filter((t) => {
        const [tYear, tMonth, tDay] = t.transactionDate.split('-').map(Number)
        const transactionDate = new Date(tYear, tMonth - 1, tDay)
        return transactionDate >= dayStart && transactionDate <= dayEnd
      })

      // Sum income and expenses
      const income = dayTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      const expenses = dayTransactions
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
      projected: DailyProjected | null,
      actual: DailyActual | null,
    ): DailyVariance | null => {
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

    // Build daily metrics array
    const dailyMetrics: Array<DailyMetric> = dates.map((dateStr) => {
      const projected = projectedDaily
      const actual = calculateActualForDay(dateStr)
      const variance = calculateVariance(projected, actual)

      return {
        date: dateStr,
        projected,
        actual,
        variance,
      }
    })

    const hasProjectedData = dailyMetrics.some((d) => d.projected !== null)
    const hasActualData = dailyMetrics.some((d) => d.actual !== null)

    return {
      days: dailyMetrics,
      hasProjectedData,
      hasActualData,
    }
  }, [property, transactionsData, daysCount])

  return metrics
}
