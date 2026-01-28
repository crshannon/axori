import { pgTable, text, timestamp, uuid, boolean, numeric, pgEnum, unique, serial, integer, date, index, jsonb } from "drizzle-orm/pg-core";
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

// =============================================================================
// PROPERTY STRATEGY ENUMS
// =============================================================================

// Primary investment strategy enum
export const primaryStrategyEnum = pgEnum("primary_strategy", [
  "primary_residence", // Living in it
  "house_hack", // Live in + rent out portions
  "buy_and_hold", // Traditional long-term rental
  "brrrr", // Buy, Rehab, Rent, Refinance, Repeat
  "short_term_rental", // Airbnb / VRBO
  "fix_and_flip", // Renovate and sell
  "value_add", // Renovate and hold
  "midterm_rental", // 30+ day furnished rentals
]);

// Exit method enum
export const exitMethodEnum = pgEnum("exit_method", [
  "hold_forever", // Never selling
  "sell", // Traditional sale
  "1031_exchange", // Tax-deferred exchange
  "refinance_hold", // Cash out and keep
  "seller_finance", // Sell with owner financing
  "convert_primary", // Move back in
  "gift_inherit", // Transfer to family
  "undecided", // No decision yet
]);

// Hold period enum
export const holdPeriodEnum = pgEnum("hold_period", [
  "indefinite", // No specific timeline
  "short", // < 2 years
  "medium", // 2-5 years
  "long", // 5-10 years
  "specific", // User sets specific year
]);

// BRRRR phase enum
export const brrrrPhaseEnum = pgEnum("brrrr_phase", [
  "acquisition", // Just purchased, planning rehab
  "rehab", // Active renovation
  "rent", // Tenant placement
  "refinance", // Preparing for or in refinance
  "stabilized", // Cycle complete, holding
]);

// Rehab item category enum
export const rehabCategoryEnum = pgEnum("rehab_category", [
  "kitchen",
  "bathroom",
  "flooring",
  "paint",
  "roof",
  "hvac",
  "electrical",
  "plumbing",
  "exterior",
  "landscaping",
  "windows",
  "appliances",
  "structural",
  "permits",
  "other",
]);

// Rehab item status enum
export const rehabStatusEnum = pgEnum("rehab_status", [
  "planned",
  "in_progress",
  "complete",
  "cancelled",
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
  hasEscrow: boolean("has_escrow").default(false), // Whether tax/insurance are escrowed (included in monthlyEscrow)
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

// Depreciation type enum
export const depreciationTypeEnum = pgEnum("depreciation_type", [
  "residential", // 27.5 years
  "commercial", // 39 years
]);

// Component depreciation class enum (for cost segregation)
export const depreciationClassEnum = pgEnum("depreciation_class", [
  "5_year", // 5-year property (appliances, carpets, etc.)
  "7_year", // 7-year property (office furniture, fixtures)
  "15_year", // 15-year property (land improvements, sidewalks)
  "27_5_year", // 27.5-year residential
  "39_year", // 39-year commercial
]);

// Property Depreciation - Main depreciation tracking (1:1)
export const propertyDepreciation = pgTable("property_depreciation", {
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .primaryKey(),

  // Depreciation Type
  depreciationType: depreciationTypeEnum("depreciation_type").notNull().default("residential"),

  // Placed in Service Date (when depreciation starts - IRS requirement)
  placedInServiceDate: date("placed_in_service_date"),

  // Cost Basis Components
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
  closingCosts: numeric("closing_costs", { precision: 10, scale: 2 }).default("0"),
  initialImprovements: numeric("initial_improvements", { precision: 10, scale: 2 }).default("0"), // Pre-rental improvements

  // Land Value (not depreciable)
  landValue: numeric("land_value", { precision: 12, scale: 2 }),
  landValueSource: text("land_value_source"), // "tax_assessment", "appraisal", "manual", "ratio"
  landValueRatio: numeric("land_value_ratio", { precision: 5, scale: 4 }), // e.g., 0.20 = 20% of purchase price

  // User's Marginal Tax Rate (for tax shield calculation)
  marginalTaxRate: numeric("marginal_tax_rate", { precision: 5, scale: 4 }).default("0.24"), // e.g., 0.24 = 24%

  // Accumulated Depreciation (for tracking)
  accumulatedDepreciation: numeric("accumulated_depreciation", { precision: 12, scale: 2 }).default("0"),
  lastDepreciationYear: integer("last_depreciation_year"), // Last tax year depreciation was claimed

  // Notes for CPA
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Property Improvements - Track capital improvements that add to basis (1:many)
export const propertyImprovements = pgTable("property_improvements", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),

  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  completedDate: date("completed_date").notNull(),
  placedInServiceDate: date("placed_in_service_date"), // May differ from completed date

  // Depreciation class (determined by cost seg study or default to building class)
  depreciationClass: depreciationClassEnum("depreciation_class").default("27_5_year"),

  // Accumulated depreciation for this improvement
  accumulatedDepreciation: numeric("accumulated_depreciation", { precision: 10, scale: 2 }).default("0"),

  // Document reference
  documentId: uuid("document_id"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("idx_property_improvements_property_id").on(table.propertyId),
}));

// Cost Segregation Studies - Results from cost seg analysis (1:many, usually 1 per property)
export const costSegregationStudies = pgTable("cost_segregation_studies", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),

  // Study Details
  studyDate: date("study_date").notNull(),
  studyProvider: text("study_provider"), // Company that performed the study
  studyCost: numeric("study_cost", { precision: 10, scale: 2 }),

  // Original Depreciable Basis Before Study
  originalBasis: numeric("original_basis", { precision: 12, scale: 2 }).notNull(),

  // Reclassified Amounts (moved from 27.5/39 year to accelerated classes)
  amount5Year: numeric("amount_5_year", { precision: 10, scale: 2 }).default("0"),
  amount7Year: numeric("amount_7_year", { precision: 10, scale: 2 }).default("0"),
  amount15Year: numeric("amount_15_year", { precision: 10, scale: 2 }).default("0"),

  // Remaining in original class after reclassification
  amountRemaining: numeric("amount_remaining", { precision: 12, scale: 2 }).notNull(),

  // Bonus Depreciation (100% for assets placed in service 2017-2022, then phases out)
  bonusDepreciationPercent: numeric("bonus_depreciation_percent", { precision: 5, scale: 4 }).default("0"), // e.g., 0.80 = 80%
  bonusDepreciationAmount: numeric("bonus_depreciation_amount", { precision: 12, scale: 2 }).default("0"),

  // Tax Year Applied
  taxYearApplied: integer("tax_year_applied"),

  // Document reference
  documentId: uuid("document_id"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("idx_cost_seg_studies_property_id").on(table.propertyId),
}));

// Annual Depreciation Records - Track depreciation claimed per tax year (1:many)
export const annualDepreciationRecords = pgTable("annual_depreciation_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),

  taxYear: integer("tax_year").notNull(),

  // Regular Depreciation
  regularDepreciation: numeric("regular_depreciation", { precision: 10, scale: 2 }).notNull(),

  // Bonus Depreciation (from cost seg)
  bonusDepreciation: numeric("bonus_depreciation", { precision: 12, scale: 2 }).default("0"),

  // Improvement Depreciation
  improvementDepreciation: numeric("improvement_depreciation", { precision: 10, scale: 2 }).default("0"),

  // Total Depreciation for the Year
  totalDepreciation: numeric("total_depreciation", { precision: 12, scale: 2 }).notNull(),

  // Months depreciated (for mid-month convention in first/last year)
  monthsDepreciated: integer("months_depreciated").notNull().default(12),

  // Verified by CPA
  verifiedByCpa: boolean("verified_by_cpa").default(false),
  verifiedDate: date("verified_date"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  propertyYearIdx: index("idx_annual_depreciation_property_year").on(table.propertyId, table.taxYear),
}));

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

// Property access JSONB type for property-level restrictions
// Example: { "property-uuid-1": ["view", "edit"], "property-uuid-2": ["view"] }
// null means full access to all properties in the portfolio
export type PropertyAccessPermission = "view" | "edit" | "manage" | "delete";
export type PropertyAccess = Record<string, PropertyAccessPermission[]> | null;

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

  // Invitation tracking
  invitedBy: uuid("invited_by")
    .references(() => users.id, { onDelete: "set null" }), // User who sent the invitation (null for portfolio creator/owner)
  invitedAt: timestamp("invited_at"), // When the invitation was sent (null for portfolio creator/owner)
  acceptedAt: timestamp("accepted_at"), // When the invitation was accepted (null if pending or for owner)

  // Property-level access restrictions (JSONB)
  // null = full access to all properties based on role
  // { "property-id": ["view", "edit"] } = restricted access to specific properties
  propertyAccess: jsonb("property_access").$type<PropertyAccess>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure a user can only have one role per portfolio
  userPortfolioUnique: unique("user_portfolio_unique").on(
    table.userId,
    table.portfolioId,
  ),
  // Indexes for efficient permission lookups
  userIdIdx: index("idx_user_portfolios_user_id").on(table.userId),
  portfolioIdIdx: index("idx_user_portfolios_portfolio_id").on(table.portfolioId),
  roleIdx: index("idx_user_portfolios_role").on(table.role),
  invitedByIdx: index("idx_user_portfolios_invited_by").on(table.invitedBy),
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

// Permission audit action enum - tracks permission changes for security compliance
export const permissionAuditActionEnum = pgEnum("permission_audit_action", [
  "role_change", // User's role in portfolio was changed
  "invitation_sent", // User was invited to portfolio
  "invitation_accepted", // User accepted portfolio invitation
  "access_revoked", // User's access was removed from portfolio
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

// Permission Audit Log - Tracks all permission changes for security and compliance
export const permissionAuditLog = pgTable("permission_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // The user whose permissions were changed
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "set null" }), // Set null to preserve audit trail even if user is deleted
  
  // The portfolio where the permission change occurred
  portfolioId: uuid("portfolio_id")
    .references(() => portfolios.id, { onDelete: "set null" }) // Set null to preserve audit trail even if portfolio is deleted
    .notNull(),
  
  // The type of permission action
  action: permissionAuditActionEnum("action").notNull(),
  
  // Previous value (JSON string for flexibility - e.g., role name, property access config)
  oldValue: text("old_value"),
  
  // New value (JSON string for flexibility - e.g., role name, property access config)
  newValue: text("new_value"),
  
  // The user who made the change (null if system-initiated)
  changedBy: uuid("changed_by")
    .references(() => users.id, { onDelete: "set null" }),
  
  // When the change occurred
  changedAt: timestamp("changed_at").defaultNow().notNull(),
}, (table) => ({
  // Index for looking up audit logs by user
  userIdIdx: index("idx_permission_audit_log_user_id").on(table.userId),
  // Index for looking up audit logs by portfolio
  portfolioIdIdx: index("idx_permission_audit_log_portfolio_id").on(table.portfolioId),
  // Index for looking up audit logs by action type
  actionIdx: index("idx_permission_audit_log_action").on(table.action),
  // Index for looking up audit logs by who made the change
  changedByIdx: index("idx_permission_audit_log_changed_by").on(table.changedBy),
  // Index for time-based queries
  changedAtIdx: index("idx_permission_audit_log_changed_at").on(table.changedAt),
}));

// Invitation token status enum
export const invitationTokenStatusEnum = pgEnum("invitation_token_status", [
  "pending", // Token created, not yet used
  "accepted", // Token was used to join portfolio
  "expired", // Token expired without being used
  "revoked", // Token was manually revoked by admin/owner
]);

// Email capture status enum - for waitlist/coming soon signups
export const emailCaptureStatusEnum = pgEnum("email_capture_status", [
  "pending", // Just captured, no email sent yet
  "notified", // Welcome/confirmation email sent
  "converted", // Signed up as a full user
  "unsubscribed", // Opted out of communications
]);

// Invitation Tokens - Secure, single-use tokens for portfolio invitations
export const invitationTokens = pgTable("invitation_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // The secure token (URL-safe, cryptographically random)
  token: text("token").notNull().unique(),
  
  // Portfolio being invited to
  portfolioId: uuid("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull(),
  
  // Invitee details
  email: text("email").notNull(), // Email of the person being invited
  role: portfolioRoleEnum("role").notNull().default("member"), // Role to assign upon acceptance
  
  // Optional: Property-level access restrictions (JSON)
  // null = full access based on role
  propertyAccess: jsonb("property_access").$type<PropertyAccess>(),
  
  // Token status
  status: invitationTokenStatusEnum("status").notNull().default("pending"),
  
  // Invitation metadata
  invitedBy: uuid("invited_by")
    .references(() => users.id, { onDelete: "set null" })
    .notNull(), // User who created the invitation
  
  // Timestamps
  expiresAt: timestamp("expires_at").notNull(), // When the token expires (default: 7 days from creation)
  usedAt: timestamp("used_at"), // When the token was used (null if pending/expired/revoked)
  usedBy: uuid("used_by")
    .references(() => users.id, { onDelete: "set null" }), // User who used the token (may differ from email if user registered with different email)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Index for quick token lookups
  tokenIdx: index("idx_invitation_tokens_token").on(table.token),
  // Index for looking up invitations by portfolio
  portfolioIdIdx: index("idx_invitation_tokens_portfolio_id").on(table.portfolioId),
  // Index for looking up invitations by email
  emailIdx: index("idx_invitation_tokens_email").on(table.email),
  // Index for looking up invitations by status
  statusIdx: index("idx_invitation_tokens_status").on(table.status),
  // Index for finding expired tokens (for cleanup jobs)
  expiresAtIdx: index("idx_invitation_tokens_expires_at").on(table.expiresAt),
}));

// Email Captures - Waitlist/coming soon email signups
export const emailCaptures = pgTable("email_captures", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Contact info
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),

  // Capture source and campaign tracking
  source: text("source").default("homepage"), // homepage, footer, popup, etc.
  campaign: text("campaign"), // For specific marketing campaigns

  // UTM tracking
  utmSource: text("utm_source"), // e.g., twitter, newsletter, google
  utmMedium: text("utm_medium"), // e.g., social, email, cpc
  utmCampaign: text("utm_campaign"), // e.g., launch2024, waitlist_promo
  utmContent: text("utm_content"), // e.g., hero_cta, footer_form
  utmTerm: text("utm_term"), // e.g., search keywords

  // Status
  status: emailCaptureStatusEnum("status").notNull().default("pending"),

  // Request metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),

  // Conversion tracking (when they become a real user)
  convertedUserId: uuid("converted_user_id")
    .references(() => users.id, { onDelete: "set null" }),
  convertedAt: timestamp("converted_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("idx_email_captures_email").on(table.email),
  statusIdx: index("idx_email_captures_status").on(table.status),
  sourceIdx: index("idx_email_captures_source").on(table.source),
  createdAtIdx: index("idx_email_captures_created_at").on(table.createdAt),
}));

// Relations
export const marketsRelations = relations(markets, ({ many }) => ({
  userMarkets: many(userMarkets),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userMarkets: many(userMarkets),
  userPortfolios: many(userPortfolios),
  // Portfolios where this user has invited others
  invitedUserPortfolios: many(userPortfolios, {
    relationName: "portfolioInviter",
  }),
  createdPortfolios: many(portfolios, {
    relationName: "portfolioCreator",
  }),
  addedProperties: many(properties, {
    relationName: "propertyAdder",
  }),
  reviewedTransactions: many(propertyTransactions, {
    relationName: "transactionReviewer",
  }),
  // Permission audit logs where this user's permissions were changed
  permissionAuditLogs: many(permissionAuditLog, {
    relationName: "permissionAuditLogUser",
  }),
  // Permission audit logs where this user made the change
  permissionAuditLogsChangedBy: many(permissionAuditLog, {
    relationName: "permissionAuditLogChangedBy",
  }),
  // Invitation tokens created by this user
  createdInvitationTokens: many(invitationTokens, {
    relationName: "invitationTokenCreator",
  }),
  // Invitation tokens used by this user
  usedInvitationTokens: many(invitationTokens, {
    relationName: "invitationTokenUser",
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
  // Permission audit logs for this portfolio
  permissionAuditLogs: many(permissionAuditLog),
  // Invitation tokens for this portfolio
  invitationTokens: many(invitationTokens),
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
  // User who sent the invitation
  inviter: one(users, {
    fields: [userPortfolios.invitedBy],
    references: [users.id],
    relationName: "portfolioInviter",
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
  depreciation: one(propertyDepreciation, {
    fields: [properties.id],
    references: [propertyDepreciation.propertyId],
  }),
  // Strategy (1:1)
  strategy: one(propertyStrategies, {
    fields: [properties.id],
    references: [propertyStrategies.propertyId],
  }),
  // BRRRR Phase (1:1 for BRRRR properties)
  brrrrPhase: one(brrrrPhases, {
    fields: [properties.id],
    references: [brrrrPhases.propertyId],
  }),
  loans: many(loans),
  history: many(propertyHistory),
  transactions: many(propertyTransactions),
  improvements: many(propertyImprovements),
  costSegStudies: many(costSegregationStudies),
  depreciationRecords: many(annualDepreciationRecords),
  bankAccounts: many(propertyBankAccounts),
  documents: many(propertyDocuments),
  // Rehab items (1:many for BRRRR/value-add)
  rehabItems: many(rehabScopeItems),
  // BRRRR phase history (1:many)
  brrrrPhaseHistory: many(brrrrPhaseHistory),
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
  document: one(propertyDocuments, {
    fields: [propertyTransactions.documentId],
    references: [propertyDocuments.id],
  }),
}));

// Property Depreciation Relations
export const propertyDepreciationRelations = relations(propertyDepreciation, ({ one }) => ({
  property: one(properties, {
    fields: [propertyDepreciation.propertyId],
    references: [properties.id],
  }),
}));

export const propertyImprovementsRelations = relations(propertyImprovements, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImprovements.propertyId],
    references: [properties.id],
  }),
}));

export const costSegregationStudiesRelations = relations(costSegregationStudies, ({ one }) => ({
  property: one(properties, {
    fields: [costSegregationStudies.propertyId],
    references: [properties.id],
  }),
}));

export const annualDepreciationRecordsRelations = relations(annualDepreciationRecords, ({ one }) => ({
  property: one(properties, {
    fields: [annualDepreciationRecords.propertyId],
    references: [properties.id],
  }),
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

// Permission Audit Log Relations
export const permissionAuditLogRelations = relations(permissionAuditLog, ({ one }) => ({
  // The user whose permissions were changed
  user: one(users, {
    fields: [permissionAuditLog.userId],
    references: [users.id],
    relationName: "permissionAuditLogUser",
  }),
  // The portfolio where the permission change occurred
  portfolio: one(portfolios, {
    fields: [permissionAuditLog.portfolioId],
    references: [portfolios.id],
  }),
  // The user who made the change
  changedByUser: one(users, {
    fields: [permissionAuditLog.changedBy],
    references: [users.id],
    relationName: "permissionAuditLogChangedBy",
  }),
}));

// Invitation Token Relations
export const invitationTokensRelations = relations(invitationTokens, ({ one }) => ({
  // The portfolio this invitation is for
  portfolio: one(portfolios, {
    fields: [invitationTokens.portfolioId],
    references: [portfolios.id],
  }),
  // The user who created this invitation
  inviter: one(users, {
    fields: [invitationTokens.invitedBy],
    references: [users.id],
    relationName: "invitationTokenCreator",
  }),
  // The user who used this invitation (if accepted)
  acceptedByUser: one(users, {
    fields: [invitationTokens.usedBy],
    references: [users.id],
    relationName: "invitationTokenUser",
  }),
}));

// =============================================================================
// BANK ACCOUNTS
// =============================================================================

// Bank account type enum
export const bankAccountTypeEnum = pgEnum("bank_account_type", [
  "checking",
  "savings",
  "money_market",
  "other",
]);

// Property Bank Accounts - Connected bank accounts for liquidity tracking
export const propertyBankAccounts = pgTable("property_bank_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),

  // Plaid connection (optional - can be manual entry)
  plaidAccountId: text("plaid_account_id"),
  plaidAccessToken: text("plaid_access_token"), // Should be encrypted in production
  plaidItemId: text("plaid_item_id"),

  // Account details
  accountName: text("account_name").notNull(),
  accountType: bankAccountTypeEnum("account_type"),
  institutionName: text("institution_name"),
  mask: text("mask"), // Last 4 digits for display

  // Balance (synced from Plaid or manual entry)
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }),
  availableBalance: numeric("available_balance", { precision: 12, scale: 2 }),
  lastSynced: timestamp("last_synced"),

  // Allocation targets (user-set manual amounts)
  maintenanceTarget: numeric("maintenance_target", { precision: 10, scale: 2 }).default("0"),
  capexTarget: numeric("capex_target", { precision: 10, scale: 2 }).default("0"),
  lifeSupportTarget: numeric("life_support_target", { precision: 10, scale: 2 }).default("0"),
  lifeSupportMonths: integer("life_support_months"), // Alternative: auto-calculate from X months of expenses

  // Metadata
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("idx_property_bank_accounts_property_id").on(table.propertyId),
  plaidAccountIdIdx: index("idx_property_bank_accounts_plaid_account_id").on(table.plaidAccountId),
}));

// Property Bank Account Relations
export const propertyBankAccountsRelations = relations(propertyBankAccounts, ({ one }) => ({
  property: one(properties, {
    fields: [propertyBankAccounts.propertyId],
    references: [properties.id],
  }),
  createdByUser: one(users, {
    fields: [propertyBankAccounts.createdBy],
    references: [users.id],
  }),
}));

// =============================================================================
// PROPERTY DOCUMENTS
// =============================================================================

// Document type enum
export const documentTypeEnum = pgEnum("document_type", [
  "lease",
  "tax_bill",
  "insurance_policy",
  "insurance_claim",
  "closing_disclosure",
  "deed",
  "title_policy",
  "appraisal",
  "inspection",
  "mortgage_statement",
  "hoa_statement",
  "utility_bill",
  "receipt",
  "contractor_invoice",
  "permit",
  "year_end_report",
  "rent_roll",
  "1099",
  "w9",
  "other",
]);

// Document processing status enum
export const documentProcessingStatusEnum = pgEnum("document_processing_status", [
  "pending", // Uploaded, not yet processed
  "processing", // AI extraction in progress
  "completed", // AI extraction completed successfully
  "failed", // AI extraction failed
]);

// Property Documents - Document management for properties (1:many)
export const propertyDocuments = pgTable("property_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),

  // File Info
  storagePath: text("storage_path").notNull(), // Path in Supabase Storage
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),

  // Classification
  documentType: documentTypeEnum("document_type").notNull(),
  documentYear: integer("document_year"), // For annual docs (tax bills, etc.)

  // AI Processing
  processingStatus: documentProcessingStatusEnum("processing_status").default("pending"),
  aiProcessedAt: timestamp("ai_processed_at"),
  aiExtractedData: jsonb("ai_extracted_data"), // Structured data from document
  aiConfidence: numeric("ai_confidence", { precision: 4, scale: 3 }), // Confidence score 0-1
  aiError: text("ai_error"), // Error message if processing failed
  aiAppliedData: jsonb("ai_applied_data"), // Data that was applied to property
  aiAppliedAt: timestamp("ai_applied_at"), // When data was applied

  // Metadata
  description: text("description"),
  tags: text("tags").array(), // User-defined tags

  // Audit
  uploadedBy: uuid("uploaded_by")
    .references(() => users.id, { onDelete: "set null" }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("idx_property_documents_property_id").on(table.propertyId),
  documentTypeIdx: index("idx_property_documents_type").on(table.documentType),
  documentYearIdx: index("idx_property_documents_year").on(table.documentYear),
  processingStatusIdx: index("idx_property_documents_processing_status").on(table.processingStatus),
}));

// Property Documents Relations
export const propertyDocumentsRelations = relations(propertyDocuments, ({ one }) => ({
  property: one(properties, {
    fields: [propertyDocuments.propertyId],
    references: [properties.id],
  }),
  uploadedByUser: one(users, {
    fields: [propertyDocuments.uploadedBy],
    references: [users.id],
  }),
}));

// =============================================================================
// PROPERTY STRATEGY
// =============================================================================

// Property Strategy - Investment strategy configuration (1:1 with properties)
export const propertyStrategies = pgTable("property_strategies", {
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .primaryKey(), // 1:1 relationship - propertyId is the primary key

  // Strategy selection
  primaryStrategy: primaryStrategyEnum("primary_strategy").notNull(),
  strategyVariant: text("strategy_variant"),

  // Hold timeline
  holdPeriod: holdPeriodEnum("hold_period").default("indefinite"),
  targetExitYear: integer("target_exit_year"),
  holdYearsMin: integer("hold_years_min"),
  holdYearsMax: integer("hold_years_max"),

  // Exit strategy
  exitMethod: exitMethodEnum("exit_method").default("undecided"),
  exitPriceTarget: numeric("exit_price_target", { precision: 12, scale: 2 }),
  exitEquityTarget: numeric("exit_equity_target", { precision: 12, scale: 2 }),
  exitCapRateFloor: numeric("exit_cap_rate_floor", { precision: 5, scale: 3 }),
  exitCashFlowFloor: numeric("exit_cash_flow_floor", { precision: 10, scale: 2 }),
  exitLifeEvent: text("exit_life_event"),

  // 1031 exchange tracking
  is1031Replacement: boolean("is_1031_replacement").default(false),
  sourcePropertyId: uuid("source_property_id").references(() => properties.id),
  exchangeDeadline: date("exchange_deadline"),
  identificationDeadline: date("identification_deadline"),

  // Future rental intent (for primary residence)
  futureRentalIntent: boolean("future_rental_intent").default(false),
  plannedConversionDate: date("planned_conversion_date"),

  // Property-specific targets
  targetMonthlyCashFlow: numeric("target_monthly_cash_flow", { precision: 10, scale: 2 }),
  targetEquity: numeric("target_equity", { precision: 12, scale: 2 }),
  targetCashOnCash: numeric("target_cash_on_cash", { precision: 5, scale: 3 }),
  targetPayoffDate: date("target_payoff_date"),

  // Score weight overrides (NULL = use strategy defaults)
  weightFinancialPerformance: integer("weight_financial_performance"),
  weightEquityVelocity: integer("weight_equity_velocity"),
  weightOperationalHealth: integer("weight_operational_health"),
  weightMarketPosition: integer("weight_market_position"),
  weightRiskFactors: integer("weight_risk_factors"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// BRRRR Phase Tracking (1:1 for BRRRR strategy properties)
export const brrrrPhases = pgTable("brrrr_phases", {
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .primaryKey(),

  // Current phase
  currentPhase: brrrrPhaseEnum("current_phase").notNull().default("acquisition"),
  phaseStartDate: date("phase_start_date").notNull().default(sql`CURRENT_DATE`),

  // Acquisition data
  arvEstimate: numeric("arv_estimate", { precision: 12, scale: 2 }),
  rehabBudget: numeric("rehab_budget", { precision: 10, scale: 2 }),
  allInCost: numeric("all_in_cost", { precision: 12, scale: 2 }),
  targetEquityCapture: numeric("target_equity_capture", { precision: 12, scale: 2 }),

  // Rehab data
  rehabStartDate: date("rehab_start_date"),
  rehabTargetEndDate: date("rehab_target_end_date"),
  rehabActualEndDate: date("rehab_actual_end_date"),
  rehabBudgetSpent: numeric("rehab_budget_spent", { precision: 10, scale: 2 }).default("0"),
  holdingCosts: numeric("holding_costs", { precision: 10, scale: 2 }).default("0"),

  // Rent data
  listedDate: date("listed_date"),
  leasedDate: date("leased_date"),
  achievedRent: numeric("achieved_rent", { precision: 8, scale: 2 }),
  marketRentAtLease: numeric("market_rent_at_lease", { precision: 8, scale: 2 }),

  // Refinance data
  appraisalDate: date("appraisal_date"),
  appraisalValue: numeric("appraisal_value", { precision: 12, scale: 2 }),
  newLoanAmount: numeric("new_loan_amount", { precision: 12, scale: 2 }),
  cashOutAmount: numeric("cash_out_amount", { precision: 12, scale: 2 }),
  newInterestRate: numeric("new_interest_rate", { precision: 5, scale: 3 }),
  newMonthlyPayment: numeric("new_monthly_payment", { precision: 8, scale: 2 }),
  capitalLeftInDeal: numeric("capital_left_in_deal", { precision: 12, scale: 2 }),
  refinanceCloseDate: date("refinance_close_date"),

  // Stabilized (calculated on phase transition)
  cycleCompleteDate: date("cycle_complete_date"),
  totalInvested: numeric("total_invested", { precision: 12, scale: 2 }),
  totalReturned: numeric("total_returned", { precision: 12, scale: 2 }),
  finalCashOnCash: numeric("final_cash_on_cash", { precision: 5, scale: 3 }),
  cycleDurationDays: integer("cycle_duration_days"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// BRRRR Phase Transition History (1:many)
export const brrrrPhaseHistory = pgTable("brrrr_phase_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),

  fromPhase: brrrrPhaseEnum("from_phase"),
  toPhase: brrrrPhaseEnum("to_phase").notNull(),
  transitionedAt: timestamp("transitioned_at").defaultNow().notNull(),
  notes: text("notes"),
}, (table) => ({
  propertyIdIdx: index("idx_brrrr_phase_history_property_id").on(table.propertyId),
}));

// Rehab Scope Items (1:many - for BRRRR and value-add strategies)
export const rehabScopeItems = pgTable("rehab_scope_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),

  category: rehabCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }).notNull(),
  actualCost: numeric("actual_cost", { precision: 10, scale: 2 }),
  status: rehabStatusEnum("status").notNull().default("planned"),
  completedDate: date("completed_date"),
  contractorName: text("contractor_name"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("idx_rehab_scope_items_property_id").on(table.propertyId),
}));

// =============================================================================
// PROPERTY STRATEGY RELATIONS
// =============================================================================

export const propertyStrategiesRelations = relations(propertyStrategies, ({ one }) => ({
  property: one(properties, {
    fields: [propertyStrategies.propertyId],
    references: [properties.id],
  }),
  sourceProperty: one(properties, {
    fields: [propertyStrategies.sourcePropertyId],
    references: [properties.id],
    relationName: "exchange1031Source",
  }),
}));

export const brrrrPhasesRelations = relations(brrrrPhases, ({ one, many }) => ({
  property: one(properties, {
    fields: [brrrrPhases.propertyId],
    references: [properties.id],
  }),
  history: many(brrrrPhaseHistory),
}));

export const brrrrPhaseHistoryRelations = relations(brrrrPhaseHistory, ({ one }) => ({
  property: one(properties, {
    fields: [brrrrPhaseHistory.propertyId],
    references: [properties.id],
  }),
}));

export const rehabScopeItemsRelations = relations(rehabScopeItems, ({ one }) => ({
  property: one(properties, {
    fields: [rehabScopeItems.propertyId],
    references: [properties.id],
  }),
}));

// Email Captures Relations
export const emailCapturesRelations = relations(emailCaptures, ({ one }) => ({
  // The user this email capture converted to (if any)
  convertedUser: one(users, {
    fields: [emailCaptures.convertedUserId],
    references: [users.id],
  }),
}));
