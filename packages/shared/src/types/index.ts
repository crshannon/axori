// Re-export types from @axori/db to ensure single source of truth
// Types are inferred from Drizzle schemas using InferSelectModel/InferInsertModel
// Using types-only export to avoid pulling in Node.js modules (path, fs) from client.ts

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
} from "@axori/db/types";

// Export Zod-inferred types for runtime parsing and validation
// These types come from Zod schemas and can be used to parse API responses
export type { z } from "zod";

// Export Zod-inferred types from enhanced API schemas
// These types match what the API expects (numbers for amounts, percentages for rates, etc.)
import type { z as zod } from "zod";
import {
  loanInsertApiSchema,
  loanUpdateApiSchema,
  propertyExpenseInsertApiSchema,
  propertyExpenseUpdateApiSchema
} from "../validation";

// Loan API types (for frontend use)
export type LoanInsertApi = zod.infer<typeof loanInsertApiSchema>;
export type LoanUpdateApi = zod.infer<typeof loanUpdateApiSchema>;

// Property Expense API types (for frontend use)
export type PropertyExpenseInsertApi = zod.infer<typeof propertyExpenseInsertApiSchema>;
export type PropertyExpenseUpdateApi = zod.infer<typeof propertyExpenseUpdateApiSchema>;

// NOTE: loanInsertSchema and loanSelectSchema are now exported from validation/index.ts
// (from base/loans.ts via drizzle-zod). The legacy schemas from normalized-property
// are deprecated and will be removed in Phase 8.


