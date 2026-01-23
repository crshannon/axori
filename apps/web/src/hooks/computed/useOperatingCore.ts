import { useMemo } from 'react'
import { useFinancialPulse } from './useFinancialPulse'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'
import {
  calculateCapExReserve,
  calculateGrossIncome,
  calculateNOI,
} from '@/utils/finances'

interface FixedExpense {
  id: string
  label: string
  amount: number
}

interface OperatingCoreMetrics {
  grossIncome: number
  fixedExpenses: Array<FixedExpense>
  capexReserve: number
  noi: number
  margin: number
}

/**
 * Hook to calculate operating core metrics for a property
 * Uses structured data from property.rentalIncome and property.operatingExpenses
 * when available, with fallback to transactions.
 * Calculates:
 * - Gross Income (from rentalIncome table + transactions)
 * - Fixed Expenses (from operatingExpenses table + transactions)
 * - CapEx Reserve (from capexRate * gross income)
 * - NOI (Net Operating Income = gross income - operating expenses)
 * - Margin (net cash flow as percentage of gross income)
 */
export function useOperatingCore(propertyId: string): OperatingCoreMetrics {
  const { data: property } = useProperty(propertyId)
  const { data: transactionsData } = usePropertyTransactions(propertyId, {
    page: 1,
    pageSize: 1000, // Get all transactions for calculations
  })
  const metrics = useFinancialPulse(propertyId)

  // Calculate all operating metrics
  const operatingMetrics = useMemo(() => {
    const rentalIncome = property?.rentalIncome
    const operatingExpenses = property?.operatingExpenses
    const activeTransactions =
      (transactionsData?.transactions || []).filter((t) => !t.isExcluded)

    // Calculate gross income using shared utility
    const grossIncome = calculateGrossIncome(rentalIncome, activeTransactions)

    // Calculate fixed expenses - combine structured data and transactions
    const fixedExpenses: Array<FixedExpense> = []

    // Add structured expenses from operatingExpenses table
    if (operatingExpenses) {
      // Annual expenses converted to monthly
      if (operatingExpenses.propertyTaxAnnual) {
        fixedExpenses.push({
          id: 'property-tax',
          label: 'Property Tax',
          amount: parseFloat(operatingExpenses.propertyTaxAnnual) / 12,
        })
      }
      if (operatingExpenses.insuranceAnnual) {
        fixedExpenses.push({
          id: 'insurance',
          label: 'Insurance',
          amount: parseFloat(operatingExpenses.insuranceAnnual) / 12,
        })
      }

      // Monthly expenses
      if (operatingExpenses.hoaMonthly) {
        fixedExpenses.push({
          id: 'hoa',
          label: 'HOA',
          amount: parseFloat(operatingExpenses.hoaMonthly),
        })
      }
      if (operatingExpenses.waterSewerMonthly) {
        fixedExpenses.push({
          id: 'water-sewer',
          label: 'Water/Sewer',
          amount: parseFloat(operatingExpenses.waterSewerMonthly),
        })
      }
      if (operatingExpenses.trashMonthly) {
        fixedExpenses.push({
          id: 'trash',
          label: 'Trash',
          amount: parseFloat(operatingExpenses.trashMonthly),
        })
      }
      if (operatingExpenses.electricMonthly) {
        fixedExpenses.push({
          id: 'electric',
          label: 'Electric',
          amount: parseFloat(operatingExpenses.electricMonthly),
        })
      }
      if (operatingExpenses.gasMonthly) {
        fixedExpenses.push({
          id: 'gas',
          label: 'Gas',
          amount: parseFloat(operatingExpenses.gasMonthly),
        })
      }
      if (operatingExpenses.internetMonthly) {
        fixedExpenses.push({
          id: 'internet',
          label: 'Internet',
          amount: parseFloat(operatingExpenses.internetMonthly),
        })
      }
      if (operatingExpenses.lawnCareMonthly) {
        fixedExpenses.push({
          id: 'lawn-care',
          label: 'Lawn Care',
          amount: parseFloat(operatingExpenses.lawnCareMonthly),
        })
      }
      if (operatingExpenses.snowRemovalMonthly) {
        fixedExpenses.push({
          id: 'snow-removal',
          label: 'Snow Removal',
          amount: parseFloat(operatingExpenses.snowRemovalMonthly),
        })
      }
      if (operatingExpenses.pestControlMonthly) {
        fixedExpenses.push({
          id: 'pest-control',
          label: 'Pest Control',
          amount: parseFloat(operatingExpenses.pestControlMonthly),
        })
      }
      if (operatingExpenses.poolMaintenanceMonthly) {
        fixedExpenses.push({
          id: 'pool-maintenance',
          label: 'Pool Maintenance',
          amount: parseFloat(operatingExpenses.poolMaintenanceMonthly),
        })
      }
      if (operatingExpenses.alarmMonitoringMonthly) {
        fixedExpenses.push({
          id: 'alarm-monitoring',
          label: 'Alarm Monitoring',
          amount: parseFloat(operatingExpenses.alarmMonitoringMonthly),
        })
      }
      if (operatingExpenses.otherExpensesMonthly) {
        fixedExpenses.push({
          id: 'other-expenses',
          label: operatingExpenses.otherExpensesDescription || 'Other',
          amount: parseFloat(operatingExpenses.otherExpensesMonthly),
        })
      }

      // Management fee - use flat fee if set, otherwise use percentage rate
      if (operatingExpenses.managementFlatFee) {
        fixedExpenses.push({
          id: 'management',
          label: 'Management',
          amount: parseFloat(operatingExpenses.managementFlatFee),
        })
      } else if (operatingExpenses.managementRate && grossIncome > 0) {
        const managementRate = parseFloat(operatingExpenses.managementRate)
        fixedExpenses.push({
          id: 'management',
          label: 'Management',
          amount: grossIncome * managementRate,
        })
      }
    }

    // Add recurring monthly expenses from transactions
    // Filter out duplicates and financing costs
    const hasManagementExpense = fixedExpenses.some(
      (exp) => exp.id === 'management',
    )

    // Group transaction expenses by category to avoid duplicates
    const transactionExpensesMap = new Map<string, number>()

    activeTransactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.isRecurring &&
          t.recurrenceFrequency === 'monthly' &&
          // Exclude management transactions if we already have structured management
          !(hasManagementExpense && t.category.toLowerCase() === 'management') &&
          // Exclude loan payments (financing costs, not operating expenses)
          !(
            t.category.toLowerCase() === 'other' &&
            (t.subcategory?.toLowerCase() === 'loan_payment' ||
              t.description?.toLowerCase().includes('loan') ||
              t.description?.toLowerCase().includes('mortgage') ||
              t.description?.toLowerCase().includes('heloc'))
          ) &&
          // Exclude property tax and insurance if already in structured data
          !(
            (t.category === 'property_tax' || t.category === 'insurance') &&
            operatingExpenses
          ),
      )
      .forEach((t) => {
        const category = t.category
        const currentAmount = transactionExpensesMap.get(category) || 0
        // Sum amounts for the same category (in case there are multiple transactions)
        transactionExpensesMap.set(
          category,
          currentAmount + parseFloat(t.amount),
        )
      })

    // Convert grouped expenses to array
    const transactionExpenses = Array.from(transactionExpensesMap.entries()).map(
      ([category, amount]) => ({
        id: `transaction-${category}`,
        label: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
        amount,
      }),
    )

    // Combine structured and transaction expenses
    fixedExpenses.push(...transactionExpenses)

    // Calculate CapEx reserve using shared utility
    let capexReserve = calculateCapExReserve(
      grossIncome,
      operatingExpenses?.capexRate,
    )
    // Fallback to estimated calculation if capexRate not set
    if (capexReserve === 0) {
      capexReserve = metrics.liquidReserves / 12 || 0
    }

    // Calculate total fixed expenses for NOI calculation
    const totalFixedExpenses = fixedExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    )

    // Calculate NOI using shared utility
    // NOI excludes debt service and capital expenses
    const noi = calculateNOI(grossIncome, totalFixedExpenses, capexReserve)

    // Calculate margin (net cash flow as percentage of gross income)
    const margin = grossIncome === 0 ? 0 : (metrics.netCashFlow / grossIncome) * 100

    return {
      grossIncome,
      fixedExpenses,
      capexReserve,
      noi,
      margin,
    }
  }, [property, transactionsData, metrics])

  return operatingMetrics
}

