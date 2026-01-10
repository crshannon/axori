import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import {
  users,
  properties,
  portfolios,
  userPortfolios,
  propertyCharacteristics,
  propertyValuation,
  propertyAcquisition,
  propertyRentalIncome,
  propertyOperatingExpenses,
  loans,
  loanHistory,
  propertyHistory,
  apiCache,
} from './schema'

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

// ============================================================================
// Property Characteristics (Step 2: Physical Details)
// ============================================================================

/**
 * Property Characteristics type inferred from Drizzle schema (for read operations)
 */
export type PropertyCharacteristics = InferSelectModel<typeof propertyCharacteristics>

/**
 * Property Characteristics insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyCharacteristicsInsert = InferInsertModel<typeof propertyCharacteristics>

// ============================================================================
// Property Valuation (Step 2: Financial Snapshot)
// ============================================================================

/**
 * Property Valuation type inferred from Drizzle schema (for read operations)
 */
export type PropertyValuation = InferSelectModel<typeof propertyValuation>

/**
 * Property Valuation insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyValuationInsert = InferInsertModel<typeof propertyValuation>

// ============================================================================
// Property Acquisition (Step 3: Purchase Info)
// ============================================================================

/**
 * Property Acquisition type inferred from Drizzle schema (for read operations)
 */
export type PropertyAcquisition = InferSelectModel<typeof propertyAcquisition>

/**
 * Property Acquisition insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyAcquisitionInsert = InferInsertModel<typeof propertyAcquisition>

// ============================================================================
// Property Rental Income (Step 5: Revenue)
// ============================================================================

/**
 * Property Rental Income type inferred from Drizzle schema (for read operations)
 */
export type PropertyRentalIncome = InferSelectModel<typeof propertyRentalIncome>

/**
 * Property Rental Income insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyRentalIncomeInsert = InferInsertModel<typeof propertyRentalIncome>

// ============================================================================
// Property Operating Expenses (Step 5: Operating Costs)
// ============================================================================

/**
 * Property Operating Expenses type inferred from Drizzle schema (for read operations)
 */
export type PropertyOperatingExpenses = InferSelectModel<typeof propertyOperatingExpenses>

/**
 * Property Operating Expenses insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyOperatingExpensesInsert = InferInsertModel<typeof propertyOperatingExpenses>

// ============================================================================
// Loans (Step 4: Financing)
// ============================================================================

/**
 * Loan type inferred from Drizzle schema (for read operations)
 */
export type Loan = InferSelectModel<typeof loans>

/**
 * Loan insert type inferred from Drizzle schema (for insert operations)
 */
export type LoanInsert = InferInsertModel<typeof loans>

// ============================================================================
// Loan History
// ============================================================================

/**
 * Loan History type inferred from Drizzle schema (for read operations)
 */
export type LoanHistory = InferSelectModel<typeof loanHistory>

/**
 * Loan History insert type inferred from Drizzle schema (for insert operations)
 */
export type LoanHistoryInsert = InferInsertModel<typeof loanHistory>

// ============================================================================
// Property History (Audit Trail)
// ============================================================================

/**
 * Property History type inferred from Drizzle schema (for read operations)
 */
export type PropertyHistory = InferSelectModel<typeof propertyHistory>

/**
 * Property History insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyHistoryInsert = InferInsertModel<typeof propertyHistory>

// ============================================================================
// API Cache
// ============================================================================

/**
 * API Cache type inferred from Drizzle schema (for read operations)
 */
export type ApiCache = InferSelectModel<typeof apiCache>

/**
 * API Cache insert type inferred from Drizzle schema (for insert operations)
 */
export type ApiCacheInsert = InferInsertModel<typeof apiCache>

// ============================================================================
// DEPRECATED: Old table types (will be removed after migration complete)
// ============================================================================

/**
 * @deprecated Use PropertyCharacteristics + PropertyValuation instead
 * Property Details type inferred from Drizzle schema (for read operations)
 */
export type PropertyDetails = any

/**
 * @deprecated Use PropertyCharacteristics + PropertyValuation instead
 * Property Details insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyDetailsInsert = any

/**
 * @deprecated Use Loan instead
 * Property Finances type inferred from Drizzle schema (for read operations)
 */
export type PropertyFinances = any

/**
 * @deprecated Use Loan instead
 * Property Finances insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyFinancesInsert = any

/**
 * @deprecated Use PropertyRentalIncome + PropertyOperatingExpenses instead
 * Property Management type inferred from Drizzle schema (for read operations)
 */
export type PropertyManagement = any

/**
 * @deprecated Use PropertyRentalIncome + PropertyOperatingExpenses instead
 * Property Management insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyManagementInsert = any

