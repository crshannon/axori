import { pgTable, text, timestamp, uuid, boolean, numeric, pgEnum, unique, serial, integer, date, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Portfolio role enum for user-portfolio relationships
export const portfolioRoleEnum = pgEnum("portfolio_role", [
  "owner", // Portfolio creator/owner - full access
  "admin", // Administrative access - can manage properties and members
  "member", // Standard member - can view and edit properties
  "viewer", // Read-only access
]);

// Property status enum
export const propertyStatusEnum = pgEnum("property_status", [
  "draft", // Incomplete - still in wizard or user exited
  "active", // Complete - ready for use
  "archived", // Archived/hidden (future use)
]);

// Ownership status enum
export const ownershipStatusEnum = pgEnum("ownership_status", [
  "own_rented", // Own property, currently rented
  "own_vacant", // Own property, currently vacant
  "under_contract", // In the process of purchasing
  "exploring", // Researching/analyzing potential purchase
]);

// Loan type enum
export const loanTypeEnum = pgEnum("loan_type", [
  "conventional",
  "fha",
  "va",
  "usda",
  "dscr",
  "portfolio",
  "hard_money",
  "bridge",
  "heloc",
  "construction",
  "owner_financed",
  "seller_finance",
  "commercial",
  "other",
]);

// Loan status enum
export const loanStatusEnum = pgEnum("loan_status", [
  "active",
  "paid_off",
  "refinanced",
  "defaulted",
  "sold",
]);

// Expense category enum - DEPRECATED: Use transactionCategoryEnum instead
// Keeping for backward compatibility during migration
export const expenseCategoryEnum = pgEnum("expense_category", [
  "acquisition",
  "property_tax",
  "insurance",
  "hoa",
  "management",
  "repairs",
  "maintenance",
  "capex",
  "utilities",
  "legal",
  "accounting",
  "marketing",
  "travel",
  "office",
  "bank_fees",
  "licenses",
  "other",
]);

// Recurrence frequency enum
export const recurrenceFrequencyEnum = pgEnum("recurrence_frequency", [
  "monthly",
  "quarterly",
  "annual",
]);

// Expense source enum
export const expenseSourceEnum = pgEnum("expense_source", [
  "manual",
  "appfolio",
  "plaid",
  "document_ai",
]);

// Transaction type enum
export const transactionTypeEnum = pgEnum("transaction_type", [
  "income", // Income transactions (rent, fees, etc.)
  "expense", // Expense transactions (repairs, taxes, etc.)
  "capital", // Capital transactions (deposits, withdrawals, etc.)
]);

// Transaction review status enum
export const transactionReviewStatusEnum = pgEnum("transaction_review_status", [
  "pending", // Awaiting review
  "approved", // Reviewed and approved
  "flagged", // Flagged for review/issue
  "excluded", // Excluded from calculations (but still shown)
]);

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(), // CRITICAL: User ownership for data isolation
  portfolioId: uuid("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull(), // Property belongs to a portfolio
  addedBy: uuid("added_by")
    .references(() => users.id, { onDelete: "set null" })
    .notNull(), // User who added this property to the portfolio

  // Status
  status: propertyStatusEnum("status").notNull().default("draft"),
  ownershipStatus: ownershipStatusEnum("ownership_status"), // Nullable for drafts

  // Address (CORE - minimal data in this table)
  address: text("address").notNull(), // Street address (e.g., "123 Main St")
  unit: text("unit"), // Unit/apartment number
  city: text("city").notNull(),
  state: text("state").notNull(), // 2-letter state code (e.g., "TX")
  zipCode: text("zip_code").notNull(), // ZIP code (e.g., "78704")
  county: text("county"), // County name

  // Mapbox geocoding data (cache)
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  mapboxPlaceId: text("mapbox_place_id"),
  fullAddress: text("full_address"),
  mapboxData: text("mapbox_data"), // JSON cache

  // Rentcast data cache
  rentcastData: text("rentcast_data"), // JSON cache
  rentcastFetchedAt: timestamp("rentcast_fetched_at"),

  // Metadata
  nickname: text("nickname"), // User-friendly name
  notes: text("notes"), // User notes
  colorTag: text("color_tag"), // UI color coding

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Property Characteristics - Physical property details (1:1)
export const propertyCharacteristics = pgTable("property_characteristics", {
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .primaryKey(), // 1:1 relationship - propertyId is the primary key

  // Type
  propertyType: text("property_type").notNull(), // "SFR", "Duplex", "Triplex", "Fourplex", "Condo", "Townhouse", "Multifamily"
  unitCount: integer("unit_count").default(1), // Number of units (for multifamily)

  // Size
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }), // Allow 2.5 baths
  squareFeet: integer("square_feet"),
  lotSizeSqft: integer("lot_size_sqft"),
  stories: integer("stories"),
  yearBuilt: integer("year_built"),

  // Parking
  parkingType: text("parking_type"), // "garage", "carport", "street", "none"
  parkingSpaces: integer("parking_spaces"),

  // Features
  hasPool: boolean("has_pool").default(false),
  hasHoa: boolean("has_hoa").default(false),

  // Construction
  constructionType: text("construction_type"), // "frame", "brick", "concrete", "stucco"
  roofType: text("roof_type"), // "shingle", "tile", "metal", "flat"
  heatingType: text("heating_type"), // "forced_air", "radiant", "baseboard", "none"
  coolingType: text("cooling_type"), // "central", "window", "mini_split", "none"

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Property Valuation - Current and historical valuation data (1:1)
export const propertyValuation = pgTable("property_valuation", {
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .primaryKey(),

  // Current Value
  currentValue: numeric("current_value", { precision: 12, scale: 2 }),
  currentValueSource: text("current_value_source"), // "estimate", "manual", "appraisal", "tax", "purchase"
  currentValueDate: date("current_value_date"),

  // Tax Assessment
  taxAssessedValue: numeric("tax_assessed_value", { precision: 12, scale: 2 }),
  taxAssessedYear: integer("tax_assessed_year"),

  // Appraisals
  lastAppraisalValue: numeric("last_appraisal_value", { precision: 12, scale: 2 }),
  lastAppraisalDate: date("last_appraisal_date"),

  // Insurance
  insuranceReplacementValue: numeric("insurance_replacement_value", { precision: 12, scale: 2 }),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Property Acquisition - Purchase and investment basis details (1:1)
export const propertyAcquisition = pgTable("property_acquisition", {
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .primaryKey(),

  // Purchase
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
  purchaseDate: date("purchase_date"),
  acquisitionMethod: text("acquisition_method"), // "traditional", "brrrr", "wholesale", "auction", "seller_finance", "subject_to", "inherited", "gift"

  // Closing
  closingCostsTotal: numeric("closing_costs_total", { precision: 10, scale: 2 }),
  closingCostsBreakdown: text("closing_costs_breakdown"), // JSON: {title: x, escrow: y, lender_fees: z, ...}

  // Down Payment
  downPaymentAmount: numeric("down_payment_amount", { precision: 12, scale: 2 }),
  downPaymentSource: text("down_payment_source"), // "savings", "heloc", "gift", "401k", "seller_second"

  // Other
  earnestMoney: numeric("earnest_money", { precision: 10, scale: 2 }),
  sellerCredits: numeric("seller_credits", { precision: 10, scale: 2 }),
  buyerAgentCommission: numeric("buyer_agent_commission", { precision: 10, scale: 2 }),

  // BRRRR (Phase 3 - add these fields later)
  isBrrrr: boolean("is_brrrr").default(false),
  arvAtPurchase: numeric("arv_at_purchase", { precision: 12, scale: 2 }),
  rehabBudget: numeric("rehab_budget", { precision: 10, scale: 2 }),

  // Tax Basis (Phase 3)
  depreciationBasis: numeric("depreciation_basis", { precision: 12, scale: 2 }),
  landValue: numeric("land_value", { precision: 12, scale: 2 }),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Property Rental Income - Expected/budgeted income (1:1)
export const propertyRentalIncome = pgTable("property_rental_income", {
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .primaryKey(),

  // Base Rent
  monthlyRent: numeric("monthly_rent", { precision: 10, scale: 2 }),
  rentSource: text("rent_source"), // "lease", "estimate", "manual"
  marketRentEstimate: numeric("market_rent_estimate", { precision: 10, scale: 2 }),

  // Lease Dates
  leaseStartDate: date("lease_start_date"), // Lease start date
  leaseEndDate: date("lease_end_date"), // Lease expiration date

  // Rent History
  rentLastIncreasedDate: date("rent_last_increased_date"),
  rentLastIncreasedAmount: numeric("rent_last_increased_amount", { precision: 10, scale: 2 }),

  // Other Income Sources (monthly)
  otherIncomeMonthly: numeric("other_income_monthly", { precision: 10, scale: 2 }).default("0"),
  parkingIncomeMonthly: numeric("parking_income_monthly", { precision: 10, scale: 2 }).default("0"),
  laundryIncomeMonthly: numeric("laundry_income_monthly", { precision: 10, scale: 2 }).default("0"),
  petRentMonthly: numeric("pet_rent_monthly", { precision: 10, scale: 2 }).default("0"),
  storageIncomeMonthly: numeric("storage_income_monthly", { precision: 10, scale: 2 }).default("0"),
  utilityReimbursementMonthly: numeric("utility_reimbursement_monthly", { precision: 10, scale: 2 }).default("0"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Property Operating Expenses - Expected/budgeted expenses (1:1)
export const propertyOperatingExpenses = pgTable("property_operating_expenses", {
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .primaryKey(),

  // Operating Rates (for projections)
  vacancyRate: numeric("vacancy_rate", { precision: 5, scale: 4 }).default("0.05"), // 5%
  managementRate: numeric("management_rate", { precision: 5, scale: 4 }).default("0.10"), // 10%
  maintenanceRate: numeric("maintenance_rate", { precision: 5, scale: 4 }).default("0.05"), // 5%
  capexRate: numeric("capex_rate", { precision: 5, scale: 4 }).default("0.05"), // 5%

  // Fixed Expenses
  propertyTaxAnnual: numeric("property_tax_annual", { precision: 10, scale: 2 }),
  insuranceAnnual: numeric("insurance_annual", { precision: 10, scale: 2 }),

  // HOA
  hoaMonthly: numeric("hoa_monthly", { precision: 10, scale: 2 }).default("0"),
  hoaSpecialAssessment: numeric("hoa_special_assessment", { precision: 10, scale: 2 }),
  hoaSpecialAssessmentDate: date("hoa_special_assessment_date"),

  // Utilities (if landlord-paid)
  waterSewerMonthly: numeric("water_sewer_monthly", { precision: 10, scale: 2 }).default("0"),
  trashMonthly: numeric("trash_monthly", { precision: 10, scale: 2 }).default("0"),
  electricMonthly: numeric("electric_monthly", { precision: 10, scale: 2 }).default("0"),
  gasMonthly: numeric("gas_monthly", { precision: 10, scale: 2 }).default("0"),
  internetMonthly: numeric("internet_monthly", { precision: 10, scale: 2 }).default("0"),

  // Services
  managementFlatFee: numeric("management_flat_fee", { precision: 10, scale: 2 }),
  lawnCareMonthly: numeric("lawn_care_monthly", { precision: 10, scale: 2 }).default("0"),
  snowRemovalMonthly: numeric("snow_removal_monthly", { precision: 10, scale: 2 }).default("0"),
  pestControlMonthly: numeric("pest_control_monthly", { precision: 10, scale: 2 }).default("0"),
  poolMaintenanceMonthly: numeric("pool_maintenance_monthly", { precision: 10, scale: 2 }).default("0"),
  alarmMonitoringMonthly: numeric("alarm_monitoring_monthly", { precision: 10, scale: 2 }).default("0"),

  // Other
  otherExpensesMonthly: numeric("other_expenses_monthly", { precision: 10, scale: 2 }).default("0"),
  otherExpensesDescription: text("other_expenses_description"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Property Management - Management company details and self-management info (1:1)
export const propertyManagement = pgTable("property_management", {
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .primaryKey(),

  // Management Type
  isSelfManaged: boolean("is_self_managed").default(true).notNull(),

  // Company Details
  companyName: text("company_name"),
  companyWebsite: text("company_website"),

  // Primary Contact
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),

  // Contract Details
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  contractAutoRenews: boolean("contract_auto_renews"),
  cancellationNoticeDays: integer("cancellation_notice_days"),

  // Fee Structure
  feeType: text("fee_type").default("percentage"), // percentage, flat, hybrid
  feePercentage: numeric("fee_percentage", { precision: 5, scale: 4 }), // e.g., 0.10 = 10%
  feeFlatAmount: numeric("fee_flat_amount", { precision: 10, scale: 2 }),
  feeMinimum: numeric("fee_minimum", { precision: 10, scale: 2 }),

  // Additional Fees
  leasingFeeType: text("leasing_fee_type"), // percentage, flat, none
  leasingFeePercentage: numeric("leasing_fee_percentage", { precision: 5, scale: 4 }),
  leasingFeeFlat: numeric("leasing_fee_flat", { precision: 10, scale: 2 }),
  leaseRenewalFee: numeric("lease_renewal_fee", { precision: 10, scale: 2 }),

  maintenanceMarkupPercentage: numeric("maintenance_markup_percentage", { precision: 5, scale: 4 }),
  maintenanceCoordinationFee: numeric("maintenance_coordination_fee", { precision: 10, scale: 2 }),

  evictionFee: numeric("eviction_fee", { precision: 10, scale: 2 }),
  earlyTerminationFee: numeric("early_termination_fee", { precision: 10, scale: 2 }),

  // Services Included
  servicesIncluded: text("services_included").array(), // ['rent_collection', 'maintenance_coordination', etc.]

  // Payment Details
  paymentMethod: text("payment_method"), // ach, check, portal
  paymentDay: integer("payment_day"), // Day of month owner gets paid
  holdsSecurityDeposit: boolean("holds_security_deposit"),
  reserveAmount: numeric("reserve_amount", { precision: 10, scale: 2 }),

  // Portal Access
  portalUrl: text("portal_url"),
  portalUsername: text("portal_username"),

  // Integration
  appfolioPropertyId: text("appfolio_property_id"), // For AppFolio sync
  buildiumPropertyId: text("buildium_property_id"), // For Buildium sync
  propertywarePropertyId: text("propertyware_property_id"), // For Propertyware sync

  notes: text("notes"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loans - ALL financing types (mortgages, hard money, HELOC, etc.) (1:many)
// Note: Named "loans" (not "property_loans") for flexibility to support both:
//   - Property-specific loans (mortgages, hard money, construction)
//   - Portfolio-level financing (HELOCs, business credit lines) - future enhancement
// Foreign keys: property_id (required), user_id (required for data isolation)
export const loans = pgTable("loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),

  // Status
  status: loanStatusEnum("status").notNull().default("active"),
  isPrimary: boolean("is_primary").default(true), // Only one primary active loan per property
  loanPosition: integer("loan_position").default(1), // 1st lien, 2nd lien, etc.

  // Lender
  lenderName: text("lender_name").notNull(),
  servicerName: text("servicer_name"), // Current servicer (may differ from lender)
  loanNumber: text("loan_number"),

  // Type
  loanType: loanTypeEnum("loan_type").notNull().default("conventional"),
  loanPurpose: text("loan_purpose"), // "purchase", "refinance", "cash_out_refi"

  // Terms
  originalLoanAmount: numeric("original_loan_amount", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 6, scale: 5 }).notNull(), // e.g., 0.06500 (6.5%)
  termMonths: integer("term_months").notNull(), // 360 for 30-year, 180 for 15-year, etc.
  startDate: date("start_date"),
  maturityDate: date("maturity_date"), // Calculated: startDate + termMonths

  // Current
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).notNull(),
  balanceAsOfDate: date("balance_as_of_date"),

  // Payment
  monthlyPrincipalInterest: numeric("monthly_principal_interest", { precision: 10, scale: 2 }), // Calculated P&I
  monthlyEscrow: numeric("monthly_escrow", { precision: 10, scale: 2 }).default("0"), // Tax/insurance escrow
  monthlyPmi: numeric("monthly_pmi", { precision: 10, scale: 2 }).default("0"), // Private mortgage insurance
  monthlyMip: numeric("monthly_mip", { precision: 10, scale: 2 }).default("0"), // FHA mortgage insurance
  monthlyHoaCollected: numeric("monthly_hoa_collected", { precision: 10, scale: 2 }).default("0"), // HOA collected by lender
  totalMonthlyPayment: numeric("total_monthly_payment", { precision: 10, scale: 2 }), // Total payment
  extraPrincipalMonthly: numeric("extra_principal_monthly", { precision: 10, scale: 2 }).default("0"),
  paymentDueDay: integer("payment_due_day").default(1), // Day of month (1-31)
  lateFeeAmount: numeric("late_fee_amount", { precision: 8, scale: 2 }),
  lateFeeGraceDays: integer("late_fee_grace_days").default(15),

  // ARM (Adjustable Rate Mortgage)
  isArm: boolean("is_arm").default(false),
  armIndex: text("arm_index"), // "SOFR", "Prime", "LIBOR", "Treasury"
  armMargin: numeric("arm_margin", { precision: 5, scale: 4 }), // e.g., 0.0250 (2.5%)
  armFirstAdjustmentDate: date("arm_first_adjustment_date"),
  armAdjustmentPeriodMonths: integer("arm_adjustment_period_months"),
  armRateCapInitial: numeric("arm_rate_cap_initial", { precision: 5, scale: 4 }),
  armRateCapPeriodic: numeric("arm_rate_cap_periodic", { precision: 5, scale: 4 }),
  armRateCapLifetime: numeric("arm_rate_cap_lifetime", { precision: 5, scale: 4 }),
  armRateFloor: numeric("arm_rate_floor", { precision: 5, scale: 4 }),

  // Interest-Only & Balloon
  isInterestOnly: boolean("is_interest_only").default(false),
  interestOnlyEndDate: date("interest_only_end_date"),
  hasBalloon: boolean("has_balloon").default(false),
  balloonDate: date("balloon_date"),
  balloonAmount: numeric("balloon_amount", { precision: 12, scale: 2 }),

  // Prepayment Penalty
  hasPrepaymentPenalty: boolean("has_prepayment_penalty").default(false),
  prepaymentPenaltyType: text("prepayment_penalty_type"), // "percentage", "months_interest", "declining"
  prepaymentPenaltyPercent: numeric("prepayment_penalty_percent", { precision: 5, scale: 4 }),
  prepaymentPenaltyMonths: integer("prepayment_penalty_months"),
  prepaymentPenaltyEndDate: date("prepayment_penalty_end_date"),

  // Recast
  allowsRecast: boolean("allows_recast"),
  recastFee: numeric("recast_fee", { precision: 8, scale: 2 }),
  recastMinimum: numeric("recast_minimum", { precision: 10, scale: 2 }),

  // Refinance Tracking
  refinancedFromId: uuid("refinanced_from_id"), // Links to old loan (self-reference handled in relations)
  refinanceDate: date("refinance_date"),
  refinanceClosingCosts: numeric("refinance_closing_costs", { precision: 10, scale: 2 }),
  refinanceCashOut: numeric("refinance_cash_out", { precision: 12, scale: 2 }),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loan History - Payment and servicing transfer tracking
export const loanHistory = pgTable("loan_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id")
    .references(() => loans.id, { onDelete: "cascade" })
    .notNull(),

  changeType: text("change_type").notNull(), // "balance_update", "rate_change", "recast", "refinance", "payment", "escrow_change", "servicer_transfer"
  fieldName: text("field_name"),
  oldValue: text("old_value"),
  newValue: text("new_value"),

  // Payment details
  balanceBefore: numeric("balance_before", { precision: 12, scale: 2 }),
  balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }),
  principalPaid: numeric("principal_paid", { precision: 10, scale: 2 }),
  interestPaid: numeric("interest_paid", { precision: 10, scale: 2 }),
  escrowPaid: numeric("escrow_paid", { precision: 10, scale: 2 }),
  extraPrincipal: numeric("extra_principal", { precision: 10, scale: 2 }),

  changeSource: text("change_source").notNull(), // "user", "import", "statement", "plaid", "system"
  effectiveDate: date("effective_date"),
  notes: text("notes"),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

// Property History - Audit trail for all property changes
export const propertyHistory = pgTable("property_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),

  tableName: text("table_name").notNull().default("properties"), // Which table changed
  fieldName: text("field_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),

  changeSource: text("change_source").notNull(), // "user", "rentcast", "appfolio", "plaid", "document_ai", "system"
  changeReason: text("change_reason"),
  changedBy: uuid("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

// Unified transaction category enum (combines expense and income categories)
export const transactionCategoryEnum = pgEnum("transaction_category", [
  // Income categories
  "rent",
  "parking",
  "laundry",
  "pet_rent",
  "storage",
  "utility_reimbursement",
  "late_fees",
  "application_fees",
  // Expense categories
  "acquisition",
  "property_tax",
  "insurance",
  "hoa",
  "management",
  "repairs",
  "maintenance",
  "capex",
  "utilities",
  "legal",
  "accounting",
  "marketing",
  "travel",
  "office",
  "bank_fees",
  "licenses",
  // Common
  "other",
]);

// Property Transactions - Unified table for all financial transactions (income, expenses, capital)
export const propertyTransactions = pgTable(
  "property_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),

    // Transaction Type & Details
    type: transactionTypeEnum("type").notNull(), // income, expense, capital
    transactionDate: date("transaction_date").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    category: transactionCategoryEnum("category").notNull(),
    subcategory: text("subcategory"),

    // Party Information (vendor for expenses, payer for income)
    vendor: text("vendor"), // For expenses: who was paid
    payer: text("payer"), // For income: who paid (tenant, etc.)

    description: text("description"),

    // Recurring
    isRecurring: boolean("is_recurring").default(false),
    recurrenceFrequency: recurrenceFrequencyEnum("recurrence_frequency"),
    recurrenceEndDate: date("recurrence_end_date"),

    // Tax (primarily for expenses, but flexible)
    isTaxDeductible: boolean("is_tax_deductible").default(true), // Only relevant for expenses
    taxCategory: text("tax_category"), // Sch E category, etc.

    // Document Link
    documentId: uuid("document_id"), // .references(() => propertyDocuments.id) - if table exists

    // Source Tracking
    source: expenseSourceEnum("source").default("manual"), // manual, appfolio, plaid, document_ai
    externalId: text("external_id"), // External system ID (Plaid transaction ID, etc.)

    // Review Workflow
    notes: text("notes"), // Generic notes field
    reviewStatus: transactionReviewStatusEnum("review_status").default("pending"),
    isExcluded: boolean("is_excluded").default(false), // Exclude from calculations (but still shown)
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at"),

    // Metadata
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdIdx: index("idx_property_transactions_property_id").on(table.propertyId),
    dateIdx: index("idx_property_transactions_date").on(table.transactionDate),
    typeIdx: index("idx_property_transactions_type").on(table.type),
    categoryIdx: index("idx_property_transactions_category").on(table.category),
    statusIdx: index("idx_property_transactions_status").on(table.reviewStatus),
  })
);

// API Cache - Centralized caching for external API responses
export const apiCache = pgTable("api_cache", {
  cacheKey: text("cache_key").primaryKey(), // Unique key for the cached response
  provider: text("provider").notNull(), // "mapbox", "rentcast"
  endpoint: text("endpoint").notNull(),
  lookupValue: text("lookup_value").notNull(), // The value used in the lookup (address, ID, etc.)
  responseData: text("response_data").notNull(), // JSON string of the API response
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  hitCount: integer("hit_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

// Demo todos table (for demo routes only)
export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  name: text("name"), // Keep for backward compatibility
  clerkId: text("clerk_id").unique().notNull(),
  // Onboarding tracking
  onboardingStep: text("onboarding_step"), // Current step (1-7) or null if completed/not started
  onboardingCompleted: timestamp("onboarding_completed"), // Timestamp when onboarding was completed, null if not completed
  onboardingData: text("onboarding_data"), // JSON string storing onboarding responses (phase, persona, ownership, freedomNumber, strategy, markets)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Portfolios table - groups users and properties together
export const portfolios = pgTable("portfolios", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // Portfolio name (e.g., "Family Real Estate LLC")
  description: text("description"), // Optional description
  createdBy: uuid("created_by")
    .references(() => users.id, { onDelete: "set null" })
    .notNull(), // User who created the portfolio (initial owner)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User-Portfolio junction table (many-to-many)
// Allows multiple users to access the same portfolio with different roles
export const userPortfolios = pgTable("user_portfolios", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  portfolioId: uuid("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull(),
  role: portfolioRoleEnum("role").notNull().default("member"), // User's role in this portfolio
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure a user can only have one role per portfolio
  userPortfolioUnique: unique("user_portfolio_unique").on(
    table.userId,
    table.portfolioId,
  ),
}));

export const markets = pgTable("markets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g., "Indianapolis"
  state: text("state").notNull(), // e.g., "IN"
  region: text("region"), // e.g., "Midwest"
  investmentProfile: text("investment_profile"), // JSON array string: ["cash_flow", "appreciation", "hybrid"]
  avgCapRate: numeric("avg_cap_rate", { precision: 5, scale: 2 }), // e.g., 8.50
  medianPrice: numeric("median_price", { precision: 12, scale: 2 }), // e.g., 250000.00
  rentToPriceRatio: numeric("rent_to_price_ratio", { precision: 5, scale: 4 }), // e.g., 0.0067
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const relationshipTypeEnum = pgEnum("relationship_type", [
  "owns_property",
  "watching",
  "target_market",
]);

export const userMarkets = pgTable("user_markets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  marketId: uuid("market_id")
    .notNull()
    .references(() => markets.id, { onDelete: "cascade" }),
  relationshipType: relationshipTypeEnum("relationship_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const marketsRelations = relations(markets, ({ many }) => ({
  userMarkets: many(userMarkets),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userMarkets: many(userMarkets),
  userPortfolios: many(userPortfolios),
  createdPortfolios: many(portfolios, {
    relationName: "portfolioCreator",
  }),
  addedProperties: many(properties, {
    relationName: "propertyAdder",
  }),
  reviewedTransactions: many(propertyTransactions, {
    relationName: "transactionReviewer",
  }),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  creator: one(users, {
    fields: [portfolios.createdBy],
    references: [users.id],
    relationName: "portfolioCreator",
  }),
  userPortfolios: many(userPortfolios),
  properties: many(properties),
}));

export const userPortfoliosRelations = relations(userPortfolios, ({ one }) => ({
  user: one(users, {
    fields: [userPortfolios.userId],
    references: [users.id],
  }),
  portfolio: one(portfolios, {
    fields: [userPortfolios.portfolioId],
    references: [portfolios.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  portfolio: one(portfolios, {
    fields: [properties.portfolioId],
    references: [portfolios.id],
  }),
  owner: one(users, {
    fields: [properties.userId],
    references: [users.id],
    relationName: "propertyOwner",
  }),
  addedByUser: one(users, {
    fields: [properties.addedBy],
    references: [users.id],
    relationName: "propertyAdder",
  }),
  characteristics: one(propertyCharacteristics, {
    fields: [properties.id],
    references: [propertyCharacteristics.propertyId],
  }),
  valuation: one(propertyValuation, {
    fields: [properties.id],
    references: [propertyValuation.propertyId],
  }),
  acquisition: one(propertyAcquisition, {
    fields: [properties.id],
    references: [propertyAcquisition.propertyId],
  }),
  rentalIncome: one(propertyRentalIncome, {
    fields: [properties.id],
    references: [propertyRentalIncome.propertyId],
  }),
  operatingExpenses: one(propertyOperatingExpenses, {
    fields: [properties.id],
    references: [propertyOperatingExpenses.propertyId],
  }),
  management: one(propertyManagement, {
    fields: [properties.id],
    references: [propertyManagement.propertyId],
  }),
  loans: many(loans),
  history: many(propertyHistory),
  transactions: many(propertyTransactions),
}));

export const propertyCharacteristicsRelations = relations(propertyCharacteristics, ({ one }) => ({
  property: one(properties, {
    fields: [propertyCharacteristics.propertyId],
    references: [properties.id],
  }),
}));

export const propertyValuationRelations = relations(propertyValuation, ({ one }) => ({
  property: one(properties, {
    fields: [propertyValuation.propertyId],
    references: [properties.id],
  }),
}));

export const propertyAcquisitionRelations = relations(propertyAcquisition, ({ one }) => ({
  property: one(properties, {
    fields: [propertyAcquisition.propertyId],
    references: [properties.id],
  }),
}));

export const propertyRentalIncomeRelations = relations(propertyRentalIncome, ({ one }) => ({
  property: one(properties, {
    fields: [propertyRentalIncome.propertyId],
    references: [properties.id],
  }),
}));

export const propertyOperatingExpensesRelations = relations(propertyOperatingExpenses, ({ one }) => ({
  property: one(properties, {
    fields: [propertyOperatingExpenses.propertyId],
    references: [properties.id],
  }),
}));

export const propertyManagementRelations = relations(propertyManagement, ({ one }) => ({
  property: one(properties, {
    fields: [propertyManagement.propertyId],
    references: [properties.id],
  }),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  property: one(properties, {
    fields: [loans.propertyId],
    references: [properties.id],
  }),
  refinancedFrom: one(loans, {
    fields: [loans.refinancedFromId],
    references: [loans.id],
    relationName: "loanRefinance",
  }),
  refinancedTo: many(loans, {
    relationName: "loanRefinance",
  }),
  history: many(loanHistory),
}));

export const loanHistoryRelations = relations(loanHistory, ({ one }) => ({
  loan: one(loans, {
    fields: [loanHistory.loanId],
    references: [loans.id],
  }),
}));

export const propertyHistoryRelations = relations(propertyHistory, ({ one }) => ({
  property: one(properties, {
    fields: [propertyHistory.propertyId],
    references: [properties.id],
  }),
  changedByUser: one(users, {
    fields: [propertyHistory.changedBy],
    references: [users.id],
  }),
}));

export const propertyTransactionsRelations = relations(propertyTransactions, ({ one }) => ({
  property: one(properties, {
    fields: [propertyTransactions.propertyId],
    references: [properties.id],
  }),
  creator: one(users, {
    fields: [propertyTransactions.createdBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [propertyTransactions.reviewedBy],
    references: [users.id],
    relationName: "transactionReviewer",
  }),
  // TODO: Add document relation when property_documents table exists
  //   document: one(propertyDocuments, {
  //   fields: [propertyTransactions.documentId],
  //   references: [propertyDocuments.id],
  // }),
}));

export const userMarketsRelations = relations(userMarkets, ({ one }) => ({
  user: one(users, {
    fields: [userMarkets.userId],
    references: [users.id],
  }),
  market: one(markets, {
    fields: [userMarkets.marketId],
    references: [markets.id],
  }),
}));



