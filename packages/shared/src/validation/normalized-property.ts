import { z } from "zod";

// ============================================================================
// PHASE 1: NORMALIZED PROPERTY SCHEMA (2026-01-10)
// ============================================================================
// These schemas represent the new normalized property data model per ADR-002.
// They replace the old property_details, property_finances, and 
// property_management tables with a more granular, normalized structure.
// ============================================================================

// ============================================================================
// Property Characteristics (Step 2: Physical Details)
// ============================================================================

export const propertyCharacteristicsInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  propertyType: z.string().max(100).optional().nullable(),
  propertySubtype: z.string().max(100).optional().nullable(),
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().min(0).max(50).optional().nullable(), // Allow 2.5 baths
  squareFeet: z.number().int().min(0).max(100000).optional().nullable(),
  lotSize: z.number().int().min(0).optional().nullable(), // Square feet
  yearBuilt: z.number().int().min(1700).max(new Date().getFullYear() + 10).optional().nullable(),
  stories: z.number().int().min(0).max(20).optional().nullable(),
  garageSpaces: z.number().int().min(0).max(20).optional().nullable(),
  poolType: z.enum(["none", "above_ground", "inground", "community"]).default("none"),
  hvacType: z.string().max(100).optional().nullable(),
  roofType: z.string().max(100).optional().nullable(),
  constructionMaterial: z.string().max(100).optional().nullable(),
  condition: z.enum(["excellent", "good", "fair", "poor"]).optional().nullable(),
  rentcastPropertyId: z.string().max(255).optional().nullable(),
});

export const propertyCharacteristicsSelectSchema = propertyCharacteristicsInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const propertyCharacteristicsUpdateSchema = z.object({
  id: z.string().uuid(),
  propertyType: z.string().max(100).optional().nullable(),
  propertySubtype: z.string().max(100).optional().nullable(),
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().min(0).max(50).optional().nullable(),
  squareFeet: z.number().int().min(0).max(100000).optional().nullable(),
  lotSize: z.number().int().min(0).optional().nullable(),
  yearBuilt: z.number().int().min(1700).max(new Date().getFullYear() + 10).optional().nullable(),
  stories: z.number().int().min(0).max(20).optional().nullable(),
  garageSpaces: z.number().int().min(0).max(20).optional().nullable(),
  poolType: z.enum(["none", "above_ground", "inground", "community"]).optional(),
  hvacType: z.string().max(100).optional().nullable(),
  roofType: z.string().max(100).optional().nullable(),
  constructionMaterial: z.string().max(100).optional().nullable(),
  condition: z.enum(["excellent", "good", "fair", "poor"]).optional().nullable(),
  rentcastPropertyId: z.string().max(255).optional().nullable(),
});

// ============================================================================
// Property Valuation (Step 2: Financial Snapshot)
// ============================================================================

export const propertyValuationInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  purchasePrice: z.number().min(0).optional().nullable(),
  currentMarketValue: z.number().min(0).optional().nullable(),
  arvAfterRepairValue: z.number().min(0).optional().nullable(),
  estimatedMonthlyRent: z.number().min(0).optional().nullable(),
  capRate: z.number().min(0).max(100).optional().nullable(), // Percentage
  cashOnCashReturn: z.number().min(-100).max(1000).optional().nullable(), // Percentage
  valuationDate: z.union([z.string(), z.date()]).optional().nullable(),
});

export const propertyValuationSelectSchema = propertyValuationInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const propertyValuationUpdateSchema = z.object({
  id: z.string().uuid(),
  purchasePrice: z.number().min(0).optional().nullable(),
  currentMarketValue: z.number().min(0).optional().nullable(),
  arvAfterRepairValue: z.number().min(0).optional().nullable(),
  estimatedMonthlyRent: z.number().min(0).optional().nullable(),
  capRate: z.number().min(0).max(100).optional().nullable(),
  cashOnCashReturn: z.number().min(-100).max(1000).optional().nullable(),
  valuationDate: z.union([z.string(), z.date()]).optional().nullable(),
});

// ============================================================================
// Property Acquisition (Step 3: Purchase Info)
// ============================================================================

export const propertyAcquisitionInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  purchaseDate: z.union([z.string(), z.date()]).optional().nullable(),
  closingDate: z.union([z.string(), z.date()]).optional().nullable(),
  closingCosts: z.number().min(0).optional().nullable(),
  downPayment: z.number().min(0).optional().nullable(),
  closingAgent: z.string().max(255).optional().nullable(),
  titleCompany: z.string().max(255).optional().nullable(),
  entityType: z.enum(["personal", "llc", "trust", "corporation", "partnership"]).optional().nullable(),
  entityName: z.string().max(255).optional().nullable(),
  seller: z.string().max(255).optional().nullable(),
  purchaseMethod: z.enum(["cash", "financed", "owner_financed", "1031_exchange", "partnership"]).optional().nullable(),
  isOwnerOccupied: z.boolean().default(false),
  taxParcelId: z.string().max(100).optional().nullable(),
});

export const propertyAcquisitionSelectSchema = propertyAcquisitionInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const propertyAcquisitionUpdateSchema = z.object({
  id: z.string().uuid(),
  purchaseDate: z.union([z.string(), z.date()]).optional().nullable(),
  closingDate: z.union([z.string(), z.date()]).optional().nullable(),
  closingCosts: z.number().min(0).optional().nullable(),
  downPayment: z.number().min(0).optional().nullable(),
  closingAgent: z.string().max(255).optional().nullable(),
  titleCompany: z.string().max(255).optional().nullable(),
  entityType: z.enum(["personal", "llc", "trust", "corporation", "partnership"]).optional().nullable(),
  entityName: z.string().max(255).optional().nullable(),
  seller: z.string().max(255).optional().nullable(),
  purchaseMethod: z.enum(["cash", "financed", "owner_financed", "1031_exchange", "partnership"]).optional().nullable(),
  isOwnerOccupied: z.boolean().optional(),
  taxParcelId: z.string().max(100).optional().nullable(),
});

// ============================================================================
// Property Rental Income (Step 5: Revenue)
// ============================================================================

export const propertyRentalIncomeInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  monthlyBaseRent: z.number().min(0).optional().nullable(),
  additionalIncome: z.number().min(0).default(0),
  petRent: z.number().min(0).default(0),
  parkingRent: z.number().min(0).default(0),
  storageRent: z.number().min(0).default(0),
  laundryIncome: z.number().min(0).default(0),
  otherIncome: z.number().min(0).default(0),
  otherIncomeDescription: z.string().max(500).optional().nullable(),
  isRented: z.boolean().default(false),
  leaseStartDate: z.union([z.string(), z.date()]).optional().nullable(),
  leaseEndDate: z.union([z.string(), z.date()]).optional().nullable(),
});

export const propertyRentalIncomeSelectSchema = propertyRentalIncomeInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const propertyRentalIncomeUpdateSchema = z.object({
  id: z.string().uuid(),
  monthlyBaseRent: z.number().min(0).optional().nullable(),
  additionalIncome: z.number().min(0).optional(),
  petRent: z.number().min(0).optional(),
  parkingRent: z.number().min(0).optional(),
  storageRent: z.number().min(0).optional(),
  laundryIncome: z.number().min(0).optional(),
  otherIncome: z.number().min(0).optional(),
  otherIncomeDescription: z.string().max(500).optional().nullable(),
  isRented: z.boolean().optional(),
  leaseStartDate: z.union([z.string(), z.date()]).optional().nullable(),
  leaseEndDate: z.union([z.string(), z.date()]).optional().nullable(),
});

// ============================================================================
// Property Operating Expenses (Step 5: Operating Costs)
// ============================================================================

export const propertyOperatingExpensesInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  propertyTaxesAnnual: z.number().min(0).default(0),
  insuranceAnnual: z.number().min(0).default(0),
  hoaMonthly: z.number().min(0).default(0),
  utilitiesMonthly: z.number().min(0).default(0),
  maintenanceMonthly: z.number().min(0).default(0),
  managementFeePercentage: z.number().min(0).max(100).optional().nullable(), // Percentage
  managementFeeFlat: z.number().min(0).default(0),
  landscapingMonthly: z.number().min(0).default(0),
  pestControlMonthly: z.number().min(0).default(0),
  capitalExReserveMonthly: z.number().min(0).default(0),
  vacancyRatePercentage: z.number().min(0).max(100).default(5), // Default 5%
  otherExpensesMonthly: z.number().min(0).default(0),
  otherExpensesDescription: z.string().max(500).optional().nullable(),
});

export const propertyOperatingExpensesSelectSchema = propertyOperatingExpensesInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const propertyOperatingExpensesUpdateSchema = z.object({
  id: z.string().uuid(),
  propertyTaxesAnnual: z.number().min(0).optional(),
  insuranceAnnual: z.number().min(0).optional(),
  hoaMonthly: z.number().min(0).optional(),
  utilitiesMonthly: z.number().min(0).optional(),
  maintenanceMonthly: z.number().min(0).optional(),
  managementFeePercentage: z.number().min(0).max(100).optional().nullable(),
  managementFeeFlat: z.number().min(0).optional(),
  landscapingMonthly: z.number().min(0).optional(),
  pestControlMonthly: z.number().min(0).optional(),
  capitalExReserveMonthly: z.number().min(0).optional(),
  vacancyRatePercentage: z.number().min(0).max(100).optional(),
  otherExpensesMonthly: z.number().min(0).optional(),
  otherExpensesDescription: z.string().max(500).optional().nullable(),
});

// ============================================================================
// Property Management (Step 5: Management Company Details)
// ============================================================================

export const propertyManagementInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  isSelfManaged: z.boolean().default(true),
  companyName: z.string().max(255).optional().nullable(),
  companyWebsite: z.string().url().optional().nullable().or(z.literal("")),
  contactName: z.string().max(255).optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  contactPhone: z.string().max(50).optional().nullable(),
  contractStartDate: z.union([z.string(), z.date()]).optional().nullable(),
  contractEndDate: z.union([z.string(), z.date()]).optional().nullable(),
  contractAutoRenews: z.boolean().optional().nullable(),
  cancellationNoticeDays: z.number().int().min(0).optional().nullable(),
  feeType: z.enum(["percentage", "flat", "hybrid"]).default("percentage"),
  feePercentage: z.number().min(0).max(1).optional().nullable(), // 0.10 = 10%
  feeFlatAmount: z.number().min(0).optional().nullable(),
  feeMinimum: z.number().min(0).optional().nullable(),
  leasingFeeType: z.enum(["percentage", "flat", "none"]).optional().nullable(),
  leasingFeePercentage: z.number().min(0).max(1).optional().nullable(),
  leasingFeeFlat: z.number().min(0).optional().nullable(),
  leaseRenewalFee: z.number().min(0).optional().nullable(),
  maintenanceMarkupPercentage: z.number().min(0).max(1).optional().nullable(),
  maintenanceCoordinationFee: z.number().min(0).optional().nullable(),
  evictionFee: z.number().min(0).optional().nullable(),
  earlyTerminationFee: z.number().min(0).optional().nullable(),
  servicesIncluded: z.array(z.string()).optional().nullable(),
  paymentMethod: z.enum(["ach", "check", "portal"]).optional().nullable(),
  paymentDay: z.number().int().min(1).max(31).optional().nullable(),
  holdsSecurityDeposit: z.boolean().optional().nullable(),
  reserveAmount: z.number().min(0).optional().nullable(),
  portalUrl: z.string().url().optional().nullable().or(z.literal("")),
  portalUsername: z.string().max(255).optional().nullable(),
  appfolioPropertyId: z.string().max(255).optional().nullable(),
  buildiumPropertyId: z.string().max(255).optional().nullable(),
  propertywarePropertyId: z.string().max(255).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const propertyManagementSelectSchema = propertyManagementInsertSchema.extend({
  updatedAt: z.date(),
});

export const propertyManagementUpdateSchema = propertyManagementInsertSchema.partial().extend({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
});

// ============================================================================
// Loans (Step 4: Financing) - Comprehensive tracking for all financing types
// ============================================================================

export const loanInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  userId: z.string().uuid("User ID must be a valid UUID"),
  loanType: z.enum([
    "conventional",
    "fha",
    "va",
    "usda",
    "portfolio",
    "hard_money",
    "bridge",
    "heloc",
    "construction",
    "owner_financed",
    "cash",
    "other",
  ]).default("conventional"),
  loanAmount: z.number().min(0).optional().nullable(),
  originalLoanAmount: z.number().min(0).optional().nullable(),
  downPaymentAmount: z.number().min(0).optional().nullable(),
  downPaymentPercentage: z.number().min(0).max(100).optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(), // Percentage
  loanTerm: z.number().int().min(1).max(50).optional().nullable(), // Years
  monthlyPayment: z.number().min(0).optional().nullable(),
  originationDate: z.union([z.string(), z.date()]).optional().nullable(),
  maturityDate: z.union([z.string(), z.date()]).optional().nullable(),
  lenderName: z.string().max(255).optional().nullable(),
  servicerName: z.string().max(255).optional().nullable(), // Tracks who services the loan
  loanNumber: z.string().max(100).optional().nullable(),
  status: z.enum(["active", "paid_off", "refinanced", "sold"]).default("active"),
  isPrimary: z.boolean().default(true), // Only one primary active loan per property
  refinanceOfLoanId: z.string().uuid().optional().nullable(), // Tracks refinance chain
  rateType: z.enum(["fixed", "adjustable", "interest_only", "balloon"]).default("fixed"),
  armAdjustmentPeriod: z.number().int().min(1).max(120).optional().nullable(), // Months
  armIndexRate: z.string().max(50).optional().nullable(), // e.g., "SOFR", "Prime"
  armMargin: z.number().min(0).max(20).optional().nullable(), // Percentage points
  armCapInitial: z.number().min(0).max(20).optional().nullable(), // %
  armCapPeriodic: z.number().min(0).max(20).optional().nullable(), // %
  armCapLifetime: z.number().min(0).max(20).optional().nullable(), // %
  armNextAdjustmentDate: z.union([z.string(), z.date()]).optional().nullable(),
  prepaymentPenalty: z.boolean().default(false),
  prepaymentPenaltyEndDate: z.union([z.string(), z.date()]).optional().nullable(),
  escrowAccount: z.boolean().default(false),
  pmiAmount: z.number().min(0).optional().nullable(),
  pmiRemovalDate: z.union([z.string(), z.date()]).optional().nullable(),
  ltvRatio: z.number().min(0).max(200).optional().nullable(), // Percentage
  dtiRatio: z.number().min(0).max(100).optional().nullable(), // Percentage
  notes: z.string().max(2000).optional().nullable(),
});

export const loanSelectSchema = loanInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const loanUpdateSchema = z.object({
  id: z.string().uuid(),
  loanType: z.enum([
    "conventional",
    "fha",
    "va",
    "usda",
    "portfolio",
    "hard_money",
    "bridge",
    "heloc",
    "construction",
    "owner_financed",
    "cash",
    "other",
  ]).optional(),
  loanAmount: z.number().min(0).optional().nullable(),
  originalLoanAmount: z.number().min(0).optional().nullable(),
  downPaymentAmount: z.number().min(0).optional().nullable(),
  downPaymentPercentage: z.number().min(0).max(100).optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(),
  loanTerm: z.number().int().min(1).max(50).optional().nullable(),
  monthlyPayment: z.number().min(0).optional().nullable(),
  originationDate: z.union([z.string(), z.date()]).optional().nullable(),
  maturityDate: z.union([z.string(), z.date()]).optional().nullable(),
  lenderName: z.string().max(255).optional().nullable(),
  servicerName: z.string().max(255).optional().nullable(),
  loanNumber: z.string().max(100).optional().nullable(),
  status: z.enum(["active", "paid_off", "refinanced", "sold"]).optional(),
  isPrimary: z.boolean().optional(),
  refinanceOfLoanId: z.string().uuid().optional().nullable(),
  rateType: z.enum(["fixed", "adjustable", "interest_only", "balloon"]).optional(),
  armAdjustmentPeriod: z.number().int().min(1).max(120).optional().nullable(),
  armIndexRate: z.string().max(50).optional().nullable(),
  armMargin: z.number().min(0).max(20).optional().nullable(),
  armCapInitial: z.number().min(0).max(20).optional().nullable(),
  armCapPeriodic: z.number().min(0).max(20).optional().nullable(),
  armCapLifetime: z.number().min(0).max(20).optional().nullable(),
  armNextAdjustmentDate: z.union([z.string(), z.date()]).optional().nullable(),
  prepaymentPenalty: z.boolean().optional(),
  prepaymentPenaltyEndDate: z.union([z.string(), z.date()]).optional().nullable(),
  escrowAccount: z.boolean().optional(),
  pmiAmount: z.number().min(0).optional().nullable(),
  pmiRemovalDate: z.union([z.string(), z.date()]).optional().nullable(),
  ltvRatio: z.number().min(0).max(200).optional().nullable(),
  dtiRatio: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

// ============================================================================
// Loan History - Automatic tracking of all loan changes
// ============================================================================

export const loanHistoryInsertSchema = z.object({
  loanId: z.string().uuid("Loan ID must be a valid UUID"),
  changeType: z.enum([
    "created",
    "rate_change",
    "payment_change",
    "servicer_transfer",
    "refinanced",
    "paid_off",
    "modified",
  ]),
  oldValue: z.record(z.any()).optional().nullable(), // JSON of old values
  newValue: z.record(z.any()).optional().nullable(), // JSON of new values
  changeReason: z.string().max(500).optional().nullable(),
  effectiveDate: z.union([z.string(), z.date()]).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const loanHistorySelectSchema = loanHistoryInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// Property History - Automatic tracking of all property changes
// ============================================================================

export const propertyHistoryInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  userId: z.string().uuid("User ID must be a valid UUID"),
  tableName: z.string().max(100), // e.g., "property_characteristics"
  changeType: z.enum(["created", "updated", "deleted"]),
  oldValue: z.record(z.any()).optional().nullable(), // JSON of old values
  newValue: z.record(z.any()).optional().nullable(), // JSON of new values
  changedFields: z.array(z.string()).optional().nullable(), // Array of field names
});

export const propertyHistorySelectSchema = propertyHistoryInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ============================================================================
// API Cache - Caching for external API responses (Rentcast, etc.)
// ============================================================================

export const apiCacheInsertSchema = z.object({
  cacheKey: z.string().max(255),
  provider: z.enum(["rentcast", "attom", "mapbox", "plaid", "appfolio"]),
  endpoint: z.string().max(500),
  requestParams: z.record(z.any()).optional().nullable(), // JSON
  responseData: z.record(z.any()), // JSON
  expiresAt: z.union([z.string(), z.date()]),
});

export const apiCacheSelectSchema = apiCacheInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

