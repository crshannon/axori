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
} from "@axori/db";


