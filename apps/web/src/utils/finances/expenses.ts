/**
 * Expense Calculation Utilities
 *
 * Shared utilities for calculating fixed expenses from operating expenses data
 * and property transactions.
 */

interface OperatingExpensesData {
  // Annual expenses
  propertyTaxAnnual?: string | null
  insuranceAnnual?: string | null

  // Monthly expenses
  hoaMonthly?: string | null
  waterSewerMonthly?: string | null
  trashMonthly?: string | null
  electricMonthly?: string | null
  gasMonthly?: string | null
  internetMonthly?: string | null
  lawnCareMonthly?: string | null
  snowRemovalMonthly?: string | null
  pestControlMonthly?: string | null
  poolMaintenanceMonthly?: string | null
  alarmMonitoringMonthly?: string | null
  otherExpensesMonthly?: string | null
  otherExpensesDescription?: string | null

  // Management
  managementFlatFee?: string | null
  managementRate?: string | null
}

interface Transaction {
  type: string
  amount: string
  category?: string | null
  subcategory?: string | null
  description?: string | null
  isRecurring?: boolean | null
  recurrenceFrequency?: string | null
  isExcluded?: boolean | null
}

/**
 * Calculates total fixed expenses from structured operating expenses data
 *
 * @param operatingExpenses - Operating expenses data object from property
 * @returns Total monthly fixed expenses
 */
export function calculateFixedExpensesFromStructured(
  operatingExpenses: OperatingExpensesData | null | undefined,
): number {
  if (!operatingExpenses) {
    return 0
  }

  let total = 0

  // Annual expenses converted to monthly
  if (operatingExpenses.propertyTaxAnnual) {
    total += parseFloat(operatingExpenses.propertyTaxAnnual) / 12
  }
  if (operatingExpenses.insuranceAnnual) {
    total += parseFloat(operatingExpenses.insuranceAnnual) / 12
  }

  // Monthly expenses
  if (operatingExpenses.hoaMonthly)
    total += parseFloat(operatingExpenses.hoaMonthly)
  if (operatingExpenses.waterSewerMonthly)
    total += parseFloat(operatingExpenses.waterSewerMonthly)
  if (operatingExpenses.trashMonthly)
    total += parseFloat(operatingExpenses.trashMonthly)
  if (operatingExpenses.electricMonthly)
    total += parseFloat(operatingExpenses.electricMonthly)
  if (operatingExpenses.gasMonthly) total += parseFloat(operatingExpenses.gasMonthly)
  if (operatingExpenses.internetMonthly)
    total += parseFloat(operatingExpenses.internetMonthly)
  if (operatingExpenses.lawnCareMonthly)
    total += parseFloat(operatingExpenses.lawnCareMonthly)
  if (operatingExpenses.snowRemovalMonthly)
    total += parseFloat(operatingExpenses.snowRemovalMonthly)
  if (operatingExpenses.pestControlMonthly)
    total += parseFloat(operatingExpenses.pestControlMonthly)
  if (operatingExpenses.poolMaintenanceMonthly)
    total += parseFloat(operatingExpenses.poolMaintenanceMonthly)
  if (operatingExpenses.alarmMonitoringMonthly)
    total += parseFloat(operatingExpenses.alarmMonitoringMonthly)
  if (operatingExpenses.otherExpensesMonthly)
    total += parseFloat(operatingExpenses.otherExpensesMonthly)

  return total
}

/**
 * Calculates management fee based on flat fee or percentage rate
 *
 * @param operatingExpenses - Operating expenses data object from property
 * @param grossIncome - Gross monthly income (for percentage-based management)
 * @returns Management fee amount
 */
export function calculateManagementFee(
  operatingExpenses: OperatingExpensesData | null | undefined,
  grossIncome: number,
): number {
  if (!operatingExpenses) {
    return 0
  }

  // Use flat fee if available, otherwise use percentage rate
  if (operatingExpenses.managementFlatFee) {
    return parseFloat(operatingExpenses.managementFlatFee)
  }

  if (operatingExpenses.managementRate && grossIncome > 0) {
    return grossIncome * parseFloat(operatingExpenses.managementRate)
  }

  return 0
}

/**
 * Calculates recurring expense transactions, excluding duplicates and loan payments
 *
 * @param transactions - Array of property transactions
 * @param operatingExpenses - Operating expenses data to check for duplicates
 * @param hasManagementExpense - Whether management is already included in structured expenses
 * @returns Map of category to total amount for recurring monthly expense transactions
 */
export function calculateRecurringExpensesFromTransactions(
  transactions: Array<Transaction>,
  operatingExpenses: OperatingExpensesData | null | undefined,
  hasManagementExpense: boolean,
): Map<string, number> {
  const expenseMap = new Map<string, number>()

  const activeTransactions = transactions.filter((t) => !t.isExcluded)

  activeTransactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.isRecurring &&
        t.recurrenceFrequency === 'monthly' &&
        // Exclude management transactions if we already have structured management
        !(hasManagementExpense && t.category?.toLowerCase() === 'management') &&
        // Exclude loan payments (financing costs, not operating expenses)
        !(
          t.category?.toLowerCase() === 'other' &&
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
      const category = t.category || 'Other'
      const currentAmount = expenseMap.get(category) || 0
      // Sum amounts for the same category (in case there are multiple transactions)
      expenseMap.set(category, currentAmount + parseFloat(t.amount))
    })

  return expenseMap
}

/**
 * Calculates total fixed expenses from structured data and transactions
 * Excludes duplicates and loan payments
 *
 * @param operatingExpenses - Operating expenses data object from property
 * @param transactions - Array of property transactions
 * @param grossIncome - Gross monthly income (for management fee calculation)
 * @returns Total monthly fixed expenses
 */
export function calculateTotalFixedExpenses(
  operatingExpenses: OperatingExpensesData | null | undefined,
  transactions: Array<Transaction>,
  grossIncome: number,
): number {
  // Start with structured expenses (excluding management, added separately)
  let total = calculateFixedExpensesFromStructured(operatingExpenses)

  // Add management fee (can be flat fee or percentage-based)
  const hasManagementExpense =
    !!(operatingExpenses?.managementFlatFee || operatingExpenses?.managementRate)
  const managementFee = calculateManagementFee(operatingExpenses, grossIncome)
  total += managementFee

  // Add recurring monthly expenses from transactions
  const recurringExpensesMap = calculateRecurringExpensesFromTransactions(
    transactions,
    operatingExpenses,
    hasManagementExpense,
  )

  const transactionExpensesTotal = Array.from(recurringExpensesMap.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  )

  total += transactionExpensesTotal

  return total
}

