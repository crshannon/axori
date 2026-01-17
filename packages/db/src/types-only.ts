// Types-only export - safe for client-side imports
// This file only exports types, no runtime code that uses Node.js modules

export type {
  UserProfile,
  UserProfileInsert,
  Portfolio,
  PortfolioInsert,
  UserPortfolio,
  UserPortfolioInsert,
  Property,
  PropertyInsert,
  PropertyCharacteristics,
  PropertyCharacteristicsInsert,
  PropertyValuation,
  PropertyValuationInsert,
  PropertyAcquisition,
  PropertyAcquisitionInsert,
  PropertyRentalIncome,
  PropertyRentalIncomeInsert,
  PropertyOperatingExpenses,
  PropertyOperatingExpensesInsert,
  PropertyManagement,
  PropertyManagementInsert,
  Loan,
  LoanInsert,
  LoanHistory,
  LoanHistoryInsert,
  PropertyHistory,
  PropertyHistoryInsert,
  PropertyTransaction,
  PropertyTransactionInsert,
  ApiCache,
  ApiCacheInsert,
} from "./types";

// Re-export schema types (these are just type definitions, no runtime code)
export type * from "./schema";

