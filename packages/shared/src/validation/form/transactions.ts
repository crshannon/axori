/**
 * Form Validation Schemas for Transactions
 *
 * These schemas handle form input validation where all inputs are strings
 * (as they come from HTML inputs). Transform functions convert to API format.
 *
 * Pattern:
 * 1. Form schema validates string inputs with user-friendly error messages
 * 2. TransactionFormData type is inferred from schema
 * 3. transformTransactionFormToApi() converts to API-expected types
 */

import { z } from "zod"

// ============================================================================
// Transaction Type Enum
// ============================================================================

export const transactionTypeEnum = z.enum(["income", "expense", "capital"])
export type TransactionType = z.infer<typeof transactionTypeEnum>

// ============================================================================
// Category Enums (matching API schema)
// ============================================================================

// All categories from the database enum
export const allCategoriesEnum = z.enum([
  // Income categories
  "rent",
  "parking",
  "laundry",
  "pet_rent",
  "storage",
  "utility_reimbursement",
  "late_fees",
  "application_fees",
  // Expense categories
  "acquisition",
  "property_tax",
  "insurance",
  "hoa",
  "management",
  "repairs",
  "maintenance",
  "capex",
  "utilities",
  "legal",
  "accounting",
  "marketing",
  "travel",
  "office",
  "bank_fees",
  "licenses",
  // Shared
  "other",
])

export type TransactionCategory = z.infer<typeof allCategoriesEnum>

// ============================================================================
// Transaction Form Schema
// ============================================================================

/**
 * Form schema for transaction input.
 * All inputs are strings (as they come from HTML inputs).
 * Validates user input with friendly error messages.
 */
export const transactionFormSchema = z
  .object({
    // Transaction Type
    type: transactionTypeEnum,

    // Date - required, must be valid date format
    transactionDate: z
      .string()
      .min(1, "Transaction date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),

    // Amount - required, must be positive number
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        "Amount must be greater than 0"
      ),

    // Category - required
    category: z.string().min(1, "Category is required"),

    // Optional string fields
    subcategory: z.string().optional().default(""),
    vendor: z.string().optional().default(""),
    payer: z.string().optional().default(""),
    description: z.string().optional().default(""),
    notes: z.string().optional().default(""),
    taxCategory: z.string().optional().default(""),

    // Boolean fields
    isTaxDeductible: z.boolean().default(true),
    isRecurring: z.boolean().default(false),
    isExcluded: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Vendor is required for expenses
      if (data.type === "expense") {
        return data.vendor && data.vendor.trim().length > 0
      }
      return true
    },
    {
      message: "Vendor is required for expenses",
      path: ["vendor"],
    }
  )
  .refine(
    (data) => {
      // Payer is required for income
      if (data.type === "income") {
        return data.payer && data.payer.trim().length > 0
      }
      return true
    },
    {
      message: "Payer is required for income",
      path: ["payer"],
    }
  )

/**
 * Form data type inferred from schema
 */
export type TransactionFormData = z.infer<typeof transactionFormSchema>

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default values for new transaction form
 */
export const defaultTransactionFormValues: TransactionFormData = {
  type: "expense",
  transactionDate: new Date().toISOString().split("T")[0],
  amount: "",
  category: "",
  subcategory: "",
  vendor: "",
  payer: "",
  description: "",
  notes: "",
  taxCategory: "",
  isTaxDeductible: true,
  isRecurring: false,
  isExcluded: false,
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform form data to API format.
 * Converts string amount to number and trims string fields.
 */
export function transformTransactionFormToApi(formData: TransactionFormData) {
  return {
    type: formData.type,
    transactionDate: formData.transactionDate,
    amount: parseFloat(formData.amount),
    category: formData.category,
    subcategory: formData.subcategory?.trim() || undefined,
    vendor: formData.vendor?.trim() || undefined,
    payer: formData.payer?.trim() || undefined,
    description: formData.description?.trim() || undefined,
    notes: formData.notes?.trim() || undefined,
    taxCategory: formData.taxCategory?.trim() || undefined,
    isTaxDeductible: formData.isTaxDeductible,
    isRecurring: formData.isRecurring,
    isExcluded: formData.isExcluded,
  }
}

/**
 * Transform API/database data to form format.
 * Converts numeric amount to string for form input.
 */
export function transformApiToTransactionForm(
  data: Record<string, unknown>
): TransactionFormData {
  return {
    type: (data.type as TransactionType) || "expense",
    transactionDate:
      (data.transactionDate as string) ||
      new Date().toISOString().split("T")[0],
    amount:
      data.amount !== undefined && data.amount !== null
        ? parseFloat(String(data.amount)).toString()
        : "",
    category: (data.category as string) || "",
    subcategory: (data.subcategory as string) || "",
    vendor: (data.vendor as string) || "",
    payer: (data.payer as string) || "",
    description: (data.description as string) || "",
    notes: (data.notes as string) || "",
    taxCategory: (data.taxCategory as string) || "",
    isTaxDeductible: (data.isTaxDeductible as boolean) ?? true,
    isRecurring: (data.isRecurring as boolean) ?? false,
    isExcluded: (data.isExcluded as boolean) ?? false,
  }
}
