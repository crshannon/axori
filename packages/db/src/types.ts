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
  propertyManagement,
  loans,
  loanHistory,
  propertyHistory,
  propertyTransactions,
  apiCache,
  propertyDepreciation,
  propertyImprovements,
  costSegregationStudies,
  annualDepreciationRecords,
  permissionAuditLog,
  invitationTokens,
  propertyBankAccounts,
  propertyDocuments,
  // Strategy tables
  propertyStrategies,
  brrrrPhases,
  brrrrPhaseHistory,
  rehabScopeItems,
} from './schema'

// Re-export property access types for external use
export type { PropertyAccess, PropertyAccessPermission } from './schema'

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
// Property Management (Step 5: Management Company Details)
// ============================================================================

/**
 * Property Management type inferred from Drizzle schema (for read operations)
 */
export type PropertyManagement = InferSelectModel<typeof propertyManagement>

/**
 * Property Management insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyManagementInsert = InferInsertModel<typeof propertyManagement>

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
// Property Transactions (Unified: Income, Expenses, Capital)
// ============================================================================

/**
 * Property Transaction type inferred from Drizzle schema (for read operations)
 */
export type PropertyTransaction = InferSelectModel<typeof propertyTransactions>

/**
 * Property Transaction insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyTransactionInsert = InferInsertModel<typeof propertyTransactions>

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

// Note: PropertyManagement types are now defined above using the new property_management table

// ============================================================================
// Property Depreciation (Tax Shield Tracking)
// ============================================================================

/**
 * Property Depreciation type inferred from Drizzle schema (for read operations)
 */
export type PropertyDepreciation = InferSelectModel<typeof propertyDepreciation>

/**
 * Property Depreciation insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyDepreciationInsert = InferInsertModel<typeof propertyDepreciation>

// ============================================================================
// Property Improvements (Capital Improvements that add to basis)
// ============================================================================

/**
 * Property Improvements type inferred from Drizzle schema (for read operations)
 */
export type PropertyImprovement = InferSelectModel<typeof propertyImprovements>

/**
 * Property Improvements insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyImprovementInsert = InferInsertModel<typeof propertyImprovements>

// ============================================================================
// Cost Segregation Studies
// ============================================================================

/**
 * Cost Segregation Study type inferred from Drizzle schema (for read operations)
 */
export type CostSegregationStudy = InferSelectModel<typeof costSegregationStudies>

/**
 * Cost Segregation Study insert type inferred from Drizzle schema (for insert operations)
 */
export type CostSegregationStudyInsert = InferInsertModel<typeof costSegregationStudies>

// ============================================================================
// Annual Depreciation Records
// ============================================================================

/**
 * Annual Depreciation Record type inferred from Drizzle schema (for read operations)
 */
export type AnnualDepreciationRecord = InferSelectModel<typeof annualDepreciationRecords>

/**
 * Annual Depreciation Record insert type inferred from Drizzle schema (for insert operations)
 */
export type AnnualDepreciationRecordInsert = InferInsertModel<typeof annualDepreciationRecords>

// ============================================================================
// Permission Audit Log (Security & Compliance)
// ============================================================================

/**
 * Permission Audit Log type inferred from Drizzle schema (for read operations)
 * Used to track all permission changes for security and compliance auditing
 */
export type PermissionAuditLog = InferSelectModel<typeof permissionAuditLog>

/**
 * Permission Audit Log insert type inferred from Drizzle schema (for insert operations)
 * Used when recording new permission change events
 */
export type PermissionAuditLogInsert = InferInsertModel<typeof permissionAuditLog>

// ============================================================================
// Invitation Tokens (Secure, single-use tokens for portfolio invitations)
// ============================================================================

/**
 * Invitation Token type inferred from Drizzle schema (for read operations)
 * Represents a secure, single-use token for inviting users to portfolios
 */
export type InvitationToken = InferSelectModel<typeof invitationTokens>

/**
 * Invitation Token insert type inferred from Drizzle schema (for insert operations)
 * Used when creating new invitation tokens
 */
export type InvitationTokenInsert = InferInsertModel<typeof invitationTokens>

// ============================================================================
// Property Bank Accounts (Liquidity & Allocation Tracking)
// ============================================================================

/**
 * Property Bank Account type inferred from Drizzle schema (for read operations)
 * Represents a connected bank account for tracking liquidity and fund allocations
 */
export type PropertyBankAccount = InferSelectModel<typeof propertyBankAccounts>

/**
 * Property Bank Account insert type inferred from Drizzle schema (for insert operations)
 * Used when creating new bank account connections
 */
export type PropertyBankAccountInsert = InferInsertModel<typeof propertyBankAccounts>

// ============================================================================
// Property Documents (Document Management & AI Extraction)
// ============================================================================

/**
 * Property Document type inferred from Drizzle schema (for read operations)
 * Represents a document uploaded for a property with optional AI-extracted data
 */
export type PropertyDocument = InferSelectModel<typeof propertyDocuments>

/**
 * Property Document insert type inferred from Drizzle schema (for insert operations)
 * Used when creating new document records
 */
export type PropertyDocumentInsert = InferInsertModel<typeof propertyDocuments>

// ============================================================================
// Property Strategy (Investment Strategy Configuration)
// ============================================================================

/**
 * Property Strategy type inferred from Drizzle schema (for read operations)
 * Represents the investment strategy configuration for a property
 */
export type PropertyStrategy = InferSelectModel<typeof propertyStrategies>

/**
 * Property Strategy insert type inferred from Drizzle schema (for insert operations)
 * Used when creating or updating property strategy configurations
 */
export type PropertyStrategyInsert = InferInsertModel<typeof propertyStrategies>

// ============================================================================
// BRRRR Phase Tracking
// ============================================================================

/**
 * BRRRR Phase type inferred from Drizzle schema (for read operations)
 * Tracks the current phase and metrics for BRRRR strategy properties
 */
export type BRRRRPhaseRecord = InferSelectModel<typeof brrrrPhases>

/**
 * BRRRR Phase insert type inferred from Drizzle schema (for insert operations)
 * Used when initializing BRRRR tracking for a property
 */
export type BRRRRPhaseRecordInsert = InferInsertModel<typeof brrrrPhases>

// ============================================================================
// BRRRR Phase History
// ============================================================================

/**
 * BRRRR Phase History type inferred from Drizzle schema (for read operations)
 * Represents a single phase transition in the BRRRR lifecycle
 */
export type BRRRRPhaseHistory = InferSelectModel<typeof brrrrPhaseHistory>

/**
 * BRRRR Phase History insert type inferred from Drizzle schema (for insert operations)
 * Used when recording a phase transition
 */
export type BRRRRPhaseHistoryInsert = InferInsertModel<typeof brrrrPhaseHistory>

// ============================================================================
// Rehab Scope Items
// ============================================================================

/**
 * Rehab Scope Item type inferred from Drizzle schema (for read operations)
 * Represents a single item in the rehab scope for BRRRR or value-add properties
 */
export type RehabScopeItem = InferSelectModel<typeof rehabScopeItems>

/**
 * Rehab Scope Item insert type inferred from Drizzle schema (for insert operations)
 * Used when adding items to the rehab scope
 */
export type RehabScopeItemInsert = InferInsertModel<typeof rehabScopeItems>
