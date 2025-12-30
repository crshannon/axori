import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { users, properties, portfolios, userPortfolios } from './schema'

/**
 * User profile type inferred from Drizzle schema (for read operations)
 */
export type UserProfile = InferSelectModel<typeof users>

/**
 * User profile insert type inferred from Drizzle schema (for insert operations)
 */
export type UserProfileInsert = InferInsertModel<typeof users>

/**
 * Portfolio type inferred from Drizzle schema (for read operations)
 */
export type Portfolio = InferSelectModel<typeof portfolios>

/**
 * Portfolio insert type inferred from Drizzle schema (for insert operations)
 */
export type PortfolioInsert = InferInsertModel<typeof portfolios>

/**
 * User-Portfolio relationship type inferred from Drizzle schema (for read operations)
 */
export type UserPortfolio = InferSelectModel<typeof userPortfolios>

/**
 * User-Portfolio relationship insert type inferred from Drizzle schema (for insert operations)
 */
export type UserPortfolioInsert = InferInsertModel<typeof userPortfolios>

/**
 * Property type inferred from Drizzle schema (for read operations)
 */
export type Property = InferSelectModel<typeof properties>

/**
 * Property insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyInsert = InferInsertModel<typeof properties>

