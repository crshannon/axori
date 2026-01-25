/**
 * Form Validation Schemas
 *
 * These schemas handle form input validation where all inputs are strings
 * (as they come from HTML inputs). Each module includes:
 *
 * 1. Form schema (validates string inputs)
 * 2. FormData type (inferred from schema)
 * 3. Default values
 * 4. Transform functions (form -> API, API -> form)
 */

// Transactions
export {
  transactionFormSchema,
  transactionTypeEnum,
  defaultTransactionFormValues,
  transformTransactionFormToApi,
  transformApiToTransactionForm,
  type TransactionFormData,
  type TransactionType,
  type TransactionCategory,
} from "./transactions"
