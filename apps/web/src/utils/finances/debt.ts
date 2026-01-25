/**
 * Debt Service Calculation Utilities
 *
 * Shared utilities for calculating debt service from loan data.
 */

interface Loan {
  status: string
  monthlyPrincipalInterest?: string | null
  monthlyEscrow?: string | null
  totalMonthlyPayment?: string | null
  isPrimary?: boolean | null
  interestRate?: string | null
}

/**
 * Calculate monthly principal and interest payment (P&I)
 * Uses standard amortization formula
 *
 * @param principal - Loan principal amount
 * @param annualInterestRate - Annual interest rate as percentage (e.g., 6.5 for 6.5%)
 * @param termMonths - Loan term in months (e.g., 360 for 30 years)
 * @returns Monthly P&I payment as number
 */
export function calculateMonthlyPrincipalInterest(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualInterestRate === 0) return principal / termMonths

  const monthlyRate = annualInterestRate / 100 / 12
  const numerator =
    principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)
  const denominator = Math.pow(1 + monthlyRate, termMonths) - 1

  return numerator / denominator
}

/**
 * Calculates total debt service from active loans
 *
 * Uses totalMonthlyPayment if available, otherwise sums P&I + Escrow
 * This matches what's shown in DebtLogic component
 *
 * @param loans - Array of loan objects
 * @returns Total monthly debt service
 */
export function calculateTotalDebtService(loans: Array<Loan>): number {
  const activeLoans = loans.filter((l) => l.status === 'active')

  return activeLoans.reduce((sum, loan) => {
    // Use totalMonthlyPayment if available, otherwise calculate from P&I + Escrow
    if (loan.totalMonthlyPayment) {
      return sum + parseFloat(loan.totalMonthlyPayment)
    }

    const pAndI = loan.monthlyPrincipalInterest
      ? parseFloat(loan.monthlyPrincipalInterest)
      : 0
    const escrow = loan.monthlyEscrow ? parseFloat(loan.monthlyEscrow) : 0

    return sum + pAndI + escrow
  }, 0)
}

/**
 * Gets interest rate from primary loan
 *
 * @param loans - Array of loan objects
 * @returns Interest rate as percentage (e.g., 4.5 for 4.5%)
 */
export function getPrimaryLoanInterestRate(loans: Array<Loan>): number {
  const activeLoans = loans.filter((l) => l.status === 'active')
  const primaryLoan = activeLoans.find((l) => l.isPrimary)

  if (primaryLoan?.interestRate) {
    return parseFloat(primaryLoan.interestRate) * 100
  }

  return 0
}
