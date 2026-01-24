/**
 * Loan-related constants
 * 
 * Centralized constants for loan types, statuses, and other
 * loan-related select options used across the application.
 * 
 * These values match the database schema enum definitions.
 */

/**
 * Loan type option for select dropdowns
 */
export interface LoanTypeOption {
  value: string
  label: string
}

/**
 * Available loan types for selection
 * These values match the database schema loan_type enum
 */
export const LOAN_TYPE_OPTIONS: LoanTypeOption[] = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA' },
  { value: 'usda', label: 'USDA' },
  { value: 'dscr', label: 'DSCR' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'hard_money', label: 'Hard Money' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'heloc', label: 'HELOC' },
  { value: 'construction', label: 'Construction' },
  { value: 'owner_financed', label: 'Owner Financed' },
  { value: 'seller_finance', label: 'Seller Finance' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
]

/**
 * Loan type value to display label mapping
 * Maps enum values (used in forms/API) to display labels
 */
export const LOAN_TYPE_LABELS: Record<string, string> = {
  conventional: 'Conventional',
  fha: 'FHA',
  va: 'VA',
  usda: 'USDA',
  dscr: 'DSCR',
  portfolio: 'Portfolio',
  hard_money: 'Hard Money',
  bridge: 'Bridge',
  heloc: 'HELOC',
  construction: 'Construction',
  owner_financed: 'Owner Financed',
  seller_finance: 'Seller Finance',
  commercial: 'Commercial',
  other: 'Other',
}

/**
 * Format loan type value to display label
 * 
 * @param value - Loan type value (enum format)
 * @returns Display label for the loan type
 */
export function formatLoanType(value: string | null | undefined): string {
  if (!value) return '—'
  return LOAN_TYPE_LABELS[value] || value
}
