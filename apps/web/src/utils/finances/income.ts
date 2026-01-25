/**
 * Income Calculation Utilities
 *
 * Shared utilities for calculating gross income from rental income data
 * and property transactions.
 */

interface RentalIncomeData {
  monthlyRent?: string | null
  otherIncomeMonthly?: string | null
  parkingIncomeMonthly?: string | null
  laundryIncomeMonthly?: string | null
  petRentMonthly?: string | null
  storageIncomeMonthly?: string | null
  utilityReimbursementMonthly?: string | null
}

interface Transaction {
  type: string
  amount: string
  isExcluded?: boolean | null
}

/**
 * Calculates gross income from structured rental income data
 *
 * @param rentalIncome - Rental income data object from property
 * @returns Gross monthly income amount
 */
export function calculateGrossIncomeFromStructured(
  rentalIncome: RentalIncomeData | null | undefined,
): number {
  if (!rentalIncome) {
    return 0
  }

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

  return (
    monthlyRent +
    otherIncome +
    parkingIncome +
    laundryIncome +
    petRent +
    storageIncome +
    utilityReimbursement
  )
}

/**
 * Calculates gross income from transactions
 *
 * @param transactions - Array of property transactions
 * @returns Gross monthly income amount from income transactions
 */
export function calculateGrossIncomeFromTransactions(
  transactions: Array<Transaction>,
): number {
  const activeTransactions = transactions.filter((t) => !t.isExcluded)

  return activeTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
}

/**
 * Calculates gross income with fallback logic
 * Prefers structured data, falls back to transactions if structured data is missing or zero
 *
 * @param rentalIncome - Rental income data object from property
 * @param transactions - Array of property transactions
 * @returns Gross monthly income amount
 */
export function calculateGrossIncome(
  rentalIncome: RentalIncomeData | null | undefined,
  transactions: Array<Transaction>,
): number {
  // Start with structured rental income
  let grossIncome = calculateGrossIncomeFromStructured(rentalIncome)

  // Fallback to transactions if structured data is missing or zero
  if (!rentalIncome || grossIncome === 0) {
    const transactionIncome = calculateGrossIncomeFromTransactions(transactions)
    grossIncome = grossIncome > 0 ? grossIncome : transactionIncome
  }

  return grossIncome
}
