import { useMemo } from 'react'
import type { Loan } from '@axori/shared'

export interface LoanSummary {
  totalDebt: number
  weightedInterestRate: number
  totalMonthlyPayment: number
  loanCount: number
  primaryLoanBalance: number | null
}

/**
 * Calculate loan summary metrics from an array of loans
 * 
 * @param loans - Array of active loans
 * @returns Summary metrics including total debt, weighted interest rate, and total monthly payment
 */
export function useLoanSummary(loans: Array<Loan> | undefined): LoanSummary {
  return useMemo(() => {
    if (!loans || loans.length === 0) {
      return {
        totalDebt: 0,
        weightedInterestRate: 0,
        totalMonthlyPayment: 0,
        loanCount: 0,
        primaryLoanBalance: null,
      }
    }

    let totalDebt = 0
    let totalWeightedRate = 0
    let totalMonthlyPayment = 0
    let primaryLoanBalance: number | null = null

    loans.forEach((loan) => {
      // Convert numeric strings to numbers
      const balance = loan.currentBalance ? Number(loan.currentBalance) : 0
      const interestRate = loan.interestRate ? Number(loan.interestRate) : 0
      
      // Calculate monthly payment with fallback logic (matches formatLoanData)
      const monthlyPAndI = loan.monthlyPrincipalInterest
        ? Number(loan.monthlyPrincipalInterest)
        : null
      const monthlyEscrow = loan.monthlyEscrow ? Number(loan.monthlyEscrow) : null
      const monthlyPayment = loan.totalMonthlyPayment
        ? Number(loan.totalMonthlyPayment)
        : monthlyPAndI && monthlyEscrow
          ? monthlyPAndI + monthlyEscrow
          : monthlyPAndI ?? 0

      totalDebt += balance
      totalMonthlyPayment += monthlyPayment

      // Calculate weighted interest rate
      // Weight = loan balance / total debt
      if (balance > 0) {
        totalWeightedRate += interestRate * balance
      }

      // Track primary loan balance
      if (loan.isPrimary) {
        primaryLoanBalance = balance
      }
    })

    // Calculate weighted average interest rate
    const weightedInterestRate =
      totalDebt > 0 ? (totalWeightedRate / totalDebt) * 100 : 0

    return {
      totalDebt,
      weightedInterestRate,
      totalMonthlyPayment,
      loanCount: loans.length,
      primaryLoanBalance,
    }
  }, [loans])
}

