import { useMemo } from 'react'
import { useFinancialPulse } from './useFinancialPulse'
import { useProperty } from '@/hooks/api/useProperties'
import { usePropertyTransactions } from '@/hooks/api/useTransactions'

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

    // Calculate gross income - prefer structured data, fallback to transactions
    let grossIncome = 0

    // Start with structured rental income
    if (rentalIncome) {
      const monthlyRent = rentalIncome.monthlyRent
        ? parseFloat(rentalIncome.monthlyRent)
        : 0
      const otherIncome = rentalIncome.otherIncomeMonthly
        ? parseFloat(rentalIncome.otherIncomeMonthly)
        : 0
      const parkingIncome = rentalIncome.parkingIncomeMonthly
        ? parseFloat(rentalIncome.parkingIncomeMonthly)
        : 0
      const laundryIncome = rentalIncome.laundryIncomeMonthly
        ? parseFloat(rentalIncome.laundryIncomeMonthly)
        : 0
      const petRent = rentalIncome.petRentMonthly
        ? parseFloat(rentalIncome.petRentMonthly)
        : 0
      const storageIncome = rentalIncome.storageIncomeMonthly
        ? parseFloat(rentalIncome.storageIncomeMonthly)
        : 0
      const utilityReimbursement = rentalIncome.utilityReimbursementMonthly
        ? parseFloat(rentalIncome.utilityReimbursementMonthly)
        : 0

      grossIncome =
        monthlyRent +
        otherIncome +
        parkingIncome +
        laundryIncome +
        petRent +
        storageIncome +
        utilityReimbursement
    }

    // Add income from transactions if structured data is missing or to supplement
    if (!rentalIncome || grossIncome === 0) {
      const transactionIncome = activeTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      grossIncome = grossIncome > 0 ? grossIncome : transactionIncome
    }

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
    // Filter out duplicates - exclude transactions with category "Management" if we already have management from structured data
    const hasManagementExpense = fixedExpenses.some(
      (exp) => exp.id === 'management',
    )

    const transactionExpenses = activeTransactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.isRecurring &&
          t.recurrenceFrequency === 'monthly' &&
          // Exclude management transactions if we already have structured management
          !(hasManagementExpense && t.category?.toLowerCase() === 'management'),
      )
      .map((t) => ({
        id: t.id,
        label: t.category || 'Other',
        amount: parseFloat(t.amount),
      }))

    // Combine structured and transaction expenses
    fixedExpenses.push(...transactionExpenses)

    // Calculate CapEx reserve - use capexRate from operatingExpenses
    let capexReserve = 0
    if (operatingExpenses?.capexRate && grossIncome > 0) {
      const capexRate = parseFloat(operatingExpenses.capexRate)
      capexReserve = grossIncome * capexRate
    } else {
      // Fallback to estimated calculation if capexRate not set
      capexReserve = metrics.liquidReserves / 12 || 0
    }

    // Calculate total fixed expenses for NOI calculation
    const totalFixedExpenses = fixedExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    )

    // Calculate NOI (Net Operating Income = gross income - operating expenses)
    // NOI excludes debt service and capital expenses
    const noi = grossIncome - totalFixedExpenses - capexReserve

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

