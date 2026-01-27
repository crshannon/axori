import { useMemo } from 'react'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'
import { calculateGrossIncome } from '@/utils/finances'

interface MonthlyReserve {
  month: string // YYYY-MM format
  accrued: number // Amount set aside this month
  spent: number // Actual spend from transactions
  balance: number // Running balance at end of month
}

interface ReserveCategory {
  monthlyAccrual: number // Current monthly amount being set aside
  totalAccrued: number // Total accumulated since tracking began
  totalSpent: number // Total actual spend
  balance: number // Current balance (accrued - spent)
  monthlyBreakdown: Array<MonthlyReserve> // Month-by-month history
  status: 'healthy' | 'warning' | 'depleted' // Health status
}

interface ReserveTrackingData {
  maintenance: ReserveCategory
  capex: ReserveCategory
  combined: {
    totalAccrued: number
    totalSpent: number
    balance: number
  }
  hasData: boolean
  monthsTracked: number
}

/**
 * Hook to track reserve fund accumulation vs actual spending
 *
 * Reserve funds are calculated by applying the maintenance rate and capex rate
 * to gross income each month. This creates a theoretical "fund" that grows monthly.
 * When actual maintenance or capex transactions occur, they "draw down" from this fund.
 *
 * The balance shows whether actual spending is within projected reserves:
 * - Positive balance: Reserves are accumulating (spending under projection)
 * - Negative balance: Overspending (actual costs exceed projected reserves)
 *
 * @param propertyId - The property ID to track reserves for
 */
export function useReserveTracking(propertyId: string): ReserveTrackingData {
  const { data: property } = useProperty(propertyId)
  const { data: transactionsData } = usePropertyTransactions(propertyId, {
    page: 1,
    pageSize: 1000, // Get all transactions
  })

  const reserveData = useMemo(() => {
    const operatingExpenses = property?.operatingExpenses
    const rentalIncome = property?.rentalIncome
    const acquisitionDate = property?.acquisition?.purchaseDate
    const activeTransactions = (transactionsData?.transactions || []).filter(
      (t) => !t.isExcluded,
    )

    // Get rates (stored as decimals, e.g., 0.03 for 3%)
    const maintenanceRate = operatingExpenses?.maintenanceRate
      ? parseFloat(operatingExpenses.maintenanceRate)
      : 0.03 // Default 3%

    const capexRate = operatingExpenses?.capexRate
      ? parseFloat(operatingExpenses.capexRate)
      : 0.05 // Default 5%

    // Calculate current gross income
    const grossIncome = calculateGrossIncome(rentalIncome, activeTransactions)

    // Current monthly accruals
    const maintenanceMonthlyAccrual = grossIncome * maintenanceRate
    const capexMonthlyAccrual = grossIncome * capexRate

    // Determine tracking period
    // Use acquisition date or earliest transaction date
    let startDate: Date
    if (acquisitionDate) {
      startDate = new Date(acquisitionDate)
    } else if (activeTransactions.length > 0) {
      const dates = activeTransactions.map((t) => new Date(t.transactionDate))
      startDate = new Date(Math.min(...dates.map((d) => d.getTime())))
    } else {
      // No data - return empty
      return {
        maintenance: createEmptyCategory(maintenanceMonthlyAccrual),
        capex: createEmptyCategory(capexMonthlyAccrual),
        combined: { totalAccrued: 0, totalSpent: 0, balance: 0 },
        hasData: false,
        monthsTracked: 0,
      }
    }

    const today = new Date()
    const months: Array<string> = []

    // Generate all months from start to current
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    while (current <= today) {
      months.push(
        `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
      )
      current.setMonth(current.getMonth() + 1)
    }

    // Group transactions by month and category
    const transactionsByMonth = new Map<
      string,
      { maintenance: number; capex: number }
    >()

    activeTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const [year, month] = t.transactionDate.split('-')
        const monthKey = `${year}-${month}`

        if (!transactionsByMonth.has(monthKey)) {
          transactionsByMonth.set(monthKey, { maintenance: 0, capex: 0 })
        }

        const monthData = transactionsByMonth.get(monthKey)!

        // Categorize transactions
        const category = t.category.toLowerCase()
        const subcategory = t.subcategory?.toLowerCase() || ''
        const amount = parseFloat(t.amount)

        // Maintenance/repairs category
        if (
          category === 'maintenance' ||
          category === 'repairs' ||
          subcategory === 'landscaping' ||
          subcategory === 'pest_control' ||
          subcategory === 'hvac' ||
          subcategory === 'plumbing' ||
          subcategory === 'electrical'
        ) {
          monthData.maintenance += amount
        }

        // CapEx category
        if (
          category === 'capex' ||
          category === 'capital_improvements' ||
          category === 'capital_expenditure'
        ) {
          monthData.capex += amount
        }
      })

    // Build monthly breakdown
    let maintenanceRunningBalance = 0
    let capexRunningBalance = 0

    const maintenanceBreakdown: Array<MonthlyReserve> = []
    const capexBreakdown: Array<MonthlyReserve> = []

    months.forEach((month) => {
      const txData = transactionsByMonth.get(month) || {
        maintenance: 0,
        capex: 0,
      }

      // Maintenance
      maintenanceRunningBalance +=
        maintenanceMonthlyAccrual - txData.maintenance
      maintenanceBreakdown.push({
        month,
        accrued: maintenanceMonthlyAccrual,
        spent: txData.maintenance,
        balance: maintenanceRunningBalance,
      })

      // CapEx
      capexRunningBalance += capexMonthlyAccrual - txData.capex
      capexBreakdown.push({
        month,
        accrued: capexMonthlyAccrual,
        spent: txData.capex,
        balance: capexRunningBalance,
      })
    })

    // Calculate totals
    const maintenanceTotalAccrued = maintenanceMonthlyAccrual * months.length
    const capexTotalAccrued = capexMonthlyAccrual * months.length

    const maintenanceTotalSpent = maintenanceBreakdown.reduce(
      (sum, m) => sum + m.spent,
      0,
    )
    const capexTotalSpent = capexBreakdown.reduce((sum, m) => sum + m.spent, 0)

    // Determine status
    const getStatus = (
      balance: number,
      monthlyAccrual: number,
    ): ReserveCategory['status'] => {
      if (balance < 0) return 'depleted'
      if (balance < monthlyAccrual * 2) return 'warning' // Less than 2 months of reserves
      return 'healthy'
    }

    return {
      maintenance: {
        monthlyAccrual: maintenanceMonthlyAccrual,
        totalAccrued: maintenanceTotalAccrued,
        totalSpent: maintenanceTotalSpent,
        balance: maintenanceRunningBalance,
        monthlyBreakdown: maintenanceBreakdown,
        status: getStatus(maintenanceRunningBalance, maintenanceMonthlyAccrual),
      },
      capex: {
        monthlyAccrual: capexMonthlyAccrual,
        totalAccrued: capexTotalAccrued,
        totalSpent: capexTotalSpent,
        balance: capexRunningBalance,
        monthlyBreakdown: capexBreakdown,
        status: getStatus(capexRunningBalance, capexMonthlyAccrual),
      },
      combined: {
        totalAccrued: maintenanceTotalAccrued + capexTotalAccrued,
        totalSpent: maintenanceTotalSpent + capexTotalSpent,
        balance: maintenanceRunningBalance + capexRunningBalance,
      },
      hasData: months.length > 0,
      monthsTracked: months.length,
    }
  }, [property, transactionsData])

  return reserveData
}

/**
 * Helper to create an empty reserve category
 */
function createEmptyCategory(monthlyAccrual: number): ReserveCategory {
  return {
    monthlyAccrual,
    totalAccrued: 0,
    totalSpent: 0,
    balance: 0,
    monthlyBreakdown: [],
    status: 'healthy',
  }
}
