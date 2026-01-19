/**
 * NOI (Net Operating Income) Calculation Utilities
 *
 * Shared utilities for calculating NOI and related metrics.
 */

/**
 * Calculates CapEx reserve based on gross income and Capex rate
 *
 * @param grossIncome - Gross monthly income
 * @param capexRate - CapEx rate as decimal (e.g., 0.05 for 5%)
 * @returns CapEx reserve amount
 */
export function calculateCapExReserve(
  grossIncome: number,
  capexRate: string | null | undefined,
): number {
  if (!capexRate || grossIncome <= 0) {
    return 0
  }

  return grossIncome * parseFloat(capexRate)
}

/**
 * Calculates NOI (Net Operating Income)
 *
 * NOI = Gross Income - Operating Expenses - CapEx Reserve
 *
 * @param grossIncome - Gross monthly income
 * @param operatingExpenses - Total operating expenses (excluding debt service and CapEx)
 * @param capexReserve - CapEx reserve amount
 * @returns Net Operating Income
 */
export function calculateNOI(
  grossIncome: number,
  operatingExpenses: number,
  capexReserve: number,
): number {
  return grossIncome - operatingExpenses - capexReserve
}

/**
 * Calculates cash flow from NOI and debt service
 *
 * Cash Flow = NOI - Debt Service
 *
 * @param noi - Net Operating Income
 * @param debtService - Total monthly debt service (loan payments)
 * @returns Cash flow amount
 */
export function calculateCashFlow(noi: number, debtService: number): number {
  return noi - debtService
}

