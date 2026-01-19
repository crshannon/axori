/**
 * Transaction Category Utilities
 *
 * Provides UI-friendly category labels and helpers organized by transaction type.
 * Categories are sourced from the database schema enum (single source of truth).
 */

// Income categories (from transactionCategoryEnum)
export const INCOME_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'rent', label: 'Rent' },
  { value: 'parking', label: 'Parking' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'pet_rent', label: 'Pet Rent' },
  { value: 'storage', label: 'Storage' },
  { value: 'utility_reimbursement', label: 'Utility Reimbursement' },
  { value: 'late_fees', label: 'Late Fees' },
  { value: 'application_fees', label: 'Application Fees' },
  { value: 'other', label: 'Other' },
]

// Expense categories (from transactionCategoryEnum)
export const EXPENSE_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'acquisition', label: 'Acquisition' },
  { value: 'property_tax', label: 'Property Tax' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'hoa', label: 'HOA' },
  { value: 'management', label: 'Management' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'capex', label: 'CapEx' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'legal', label: 'Legal' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'travel', label: 'Travel' },
  { value: 'office', label: 'Office' },
  { value: 'bank_fees', label: 'Bank Fees' },
  { value: 'licenses', label: 'Licenses' },
  { value: 'other', label: 'Other' },
]

// Capital categories (from transactionCategoryEnum)
export const CAPITAL_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'other', label: 'Other' },
]

export type TransactionCategoryOption =
  | (typeof INCOME_CATEGORIES)[number]
  | (typeof EXPENSE_CATEGORIES)[number]
  | (typeof CAPITAL_CATEGORIES)[number]

/**
 * Get categories for a specific transaction type
 */
export function getTransactionCategories(
  type: 'income' | 'expense' | 'capital',
): Array<{ value: string; label: string }> {
  switch (type) {
    case 'income':
      return INCOME_CATEGORIES
    case 'expense':
      return EXPENSE_CATEGORIES
    case 'capital':
      return CAPITAL_CATEGORIES
    default:
      return []
  }
}

