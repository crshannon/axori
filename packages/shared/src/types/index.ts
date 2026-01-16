// Re-export types from @axori/db to ensure single source of truth
// Types are inferred from Drizzle schemas using InferSelectModel/InferInsertModel

export type {
  UserProfile,
  UserProfileInsert,
  Portfolio,
  PortfolioInsert,
  UserPortfolio,
  UserPortfolioInsert,
  Property,
  PropertyInsert,
  PropertyExpense,
  PropertyExpenseInsert,
  Loan,
  LoanInsert,
} from "@axori/db";

// Export Zod-inferred types for runtime parsing and validation
// These types come from Zod schemas and can be used to parse API responses
export type { z } from "zod";
export type {
  loanInsertSchema,
  loanSelectSchema,
  loanUpdateSchema,
} from "../validation/normalized-property";


