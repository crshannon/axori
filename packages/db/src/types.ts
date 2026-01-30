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
  subscriptions,
  plans,
  userPreferences,
  accountDeletionRequests,
  dataExportRequests,
  // Forge schema tables
  forgeMilestones,
  forgeProjects,
  forgeTickets,
  forgeSubtasks,
  forgeReferences,
  forgeAgentExecutions,
  forgeFileLocks,
  forgeTokenUsage,
  forgeTokenBudgets,
  forgeRegistry,
  forgeDecisions,
  forgeDecisionApplications,
  forgeTicketComments,
  forgeTestPersonas,
  forgeReleases,
  forgeDeployments,
  forgeSuccessMetrics,
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
// Subscriptions & Billing
// ============================================================================

/**
 * Subscription type inferred from Drizzle schema (for read operations)
 * Represents a user's subscription synced from Stripe
 */
export type Subscription = InferSelectModel<typeof subscriptions>

/**
 * Subscription insert type inferred from Drizzle schema (for insert operations)
 */
export type SubscriptionInsert = InferInsertModel<typeof subscriptions>

/**
 * Plan type inferred from Drizzle schema (for read operations)
 * Represents an available subscription plan synced from Stripe
 */
export type Plan = InferSelectModel<typeof plans>

/**
 * Plan insert type inferred from Drizzle schema (for insert operations)
 */
export type PlanInsert = InferInsertModel<typeof plans>

// ============================================================================
// User Preferences
// ============================================================================

/**
 * User Preferences type inferred from Drizzle schema (for read operations)
 * Represents user settings and preferences (theme, notifications, etc.)
 */
export type UserPreferences = InferSelectModel<typeof userPreferences>

/**
 * User Preferences insert type inferred from Drizzle schema (for insert operations)
 */
export type UserPreferencesInsert = InferInsertModel<typeof userPreferences>

// ============================================================================
// Account Management
// ============================================================================

/**
 * Account Deletion Request type inferred from Drizzle schema (for read operations)
 * Tracks account deletion and data purge requests
 */
export type AccountDeletionRequest = InferSelectModel<typeof accountDeletionRequests>

/**
 * Account Deletion Request insert type inferred from Drizzle schema (for insert operations)
 */
export type AccountDeletionRequestInsert = InferInsertModel<typeof accountDeletionRequests>

/**
 * Data Export Request type inferred from Drizzle schema (for read operations)
 * Tracks user data export requests for GDPR compliance
 */
export type DataExportRequest = InferSelectModel<typeof dataExportRequests>

/**
 * Data Export Request insert type inferred from Drizzle schema (for insert operations)
 */
export type DataExportRequestInsert = InferInsertModel<typeof dataExportRequests>

// ============================================================================
// FORGE SCHEMA TYPES (Internal Dev Workflow Engine)
// ============================================================================

/**
 * Forge Milestone type (for read operations)
 * Represents a feature set or release grouping
 */
export type ForgeMilestone = InferSelectModel<typeof forgeMilestones>
export type ForgeMilestoneInsert = InferInsertModel<typeof forgeMilestones>

/**
 * Forge Project type (for read operations)
 * Represents a project grouping for tickets
 */
export type ForgeProject = InferSelectModel<typeof forgeProjects>
export type ForgeProjectInsert = InferInsertModel<typeof forgeProjects>

/**
 * Forge Ticket type (for read operations)
 * The main ticket/issue entity in Forge
 */
export type ForgeTicket = InferSelectModel<typeof forgeTickets>
export type ForgeTicketInsert = InferInsertModel<typeof forgeTickets>

/**
 * Forge Subtask type (for read operations)
 * Lightweight sub-items within a ticket
 */
export type ForgeSubtask = InferSelectModel<typeof forgeSubtasks>
export type ForgeSubtaskInsert = InferInsertModel<typeof forgeSubtasks>

/**
 * Forge Reference type (for read operations)
 * Design links, screenshots, and inspiration attached to tickets
 */
export type ForgeReference = InferSelectModel<typeof forgeReferences>
export type ForgeReferenceInsert = InferInsertModel<typeof forgeReferences>

/**
 * Forge Agent Execution type (for read operations)
 * Tracks AI agent executions against tickets
 */
export type ForgeAgentExecution = InferSelectModel<typeof forgeAgentExecutions>
export type ForgeAgentExecutionInsert = InferInsertModel<typeof forgeAgentExecutions>

/**
 * Forge File Lock type (for read operations)
 * Prevents conflicts by tracking file locks during agent execution
 */
export type ForgeFileLock = InferSelectModel<typeof forgeFileLocks>
export type ForgeFileLockInsert = InferInsertModel<typeof forgeFileLocks>

/**
 * Forge Token Usage type (for read operations)
 * Tracks token consumption per API call
 */
export type ForgeTokenUsage = InferSelectModel<typeof forgeTokenUsage>
export type ForgeTokenUsageInsert = InferInsertModel<typeof forgeTokenUsage>

/**
 * Forge Token Budget type (for read operations)
 * Daily token budget configuration and tracking
 */
export type ForgeTokenBudget = InferSelectModel<typeof forgeTokenBudgets>
export type ForgeTokenBudgetInsert = InferInsertModel<typeof forgeTokenBudgets>

/**
 * Forge Registry type (for read operations)
 * Codebase knowledge graph (components, hooks, utilities, etc.)
 */
export type ForgeRegistry = InferSelectModel<typeof forgeRegistry>
export type ForgeRegistryInsert = InferInsertModel<typeof forgeRegistry>

/**
 * Forge Decision type (for read operations)
 * Institutional memory - architectural and process decisions
 */
export type ForgeDecision = InferSelectModel<typeof forgeDecisions>
export type ForgeDecisionInsert = InferInsertModel<typeof forgeDecisions>

/**
 * Forge Decision Application type (for read operations)
 * Tracks where decisions were applied and compliance
 */
export type ForgeDecisionApplication = InferSelectModel<typeof forgeDecisionApplications>
export type ForgeDecisionApplicationInsert = InferInsertModel<typeof forgeDecisionApplications>

/**
 * Forge Ticket Comment type (for read operations)
 * Comments on tickets from users, agents, or system
 */
export type ForgeTicketComment = InferSelectModel<typeof forgeTicketComments>
export type ForgeTicketCommentInsert = InferInsertModel<typeof forgeTicketComments>

/**
 * Forge Test Persona type (for read operations)
 * Test user personas for E2E testing scenarios
 */
export type ForgeTestPersona = InferSelectModel<typeof forgeTestPersonas>
export type ForgeTestPersonaInsert = InferInsertModel<typeof forgeTestPersonas>

/**
 * Forge Release type (for read operations)
 * GitHub releases synced to Forge
 */
export type ForgeRelease = InferSelectModel<typeof forgeReleases>
export type ForgeReleaseInsert = InferInsertModel<typeof forgeReleases>

/**
 * Forge Deployment type (for read operations)
 * Deployment tracking for preview, staging, and production
 */
export type ForgeDeployment = InferSelectModel<typeof forgeDeployments>
export type ForgeDeploymentInsert = InferInsertModel<typeof forgeDeployments>

/**
 * Forge Success Metric type (for read operations)
 * Key metrics tracking for codebase health and velocity
 */
export type ForgeSuccessMetric = InferSelectModel<typeof forgeSuccessMetrics>
export type ForgeSuccessMetricInsert = InferInsertModel<typeof forgeSuccessMetrics>
