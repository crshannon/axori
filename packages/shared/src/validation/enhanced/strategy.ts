/**
 * Enhanced Zod schemas for strategy with API-specific validation
 *
 * These schemas provide API-specific validation while maintaining alignment with
 * the Drizzle table definition as the single source of truth.
 *
 * Note: We use a standalone schema here instead of extending the drizzle-generated
 * schema due to Zod version compatibility issues with .extend() on drizzle-generated schemas.
 * The schema structure mirrors the Drizzle table definition exactly.
 */

import { z } from "zod";
import {
  propertyStrategySelectSchema,
  brrrrPhaseSelectSchema,
  rehabScopeItemSelectSchema,
} from "../base/strategy";

// ============================================================================
// Constants
// ============================================================================

export const PRIMARY_STRATEGIES = [
  "primary_residence",
  "house_hack",
  "buy_and_hold",
  "brrrr",
  "short_term_rental",
  "fix_and_flip",
  "value_add",
  "midterm_rental",
] as const;

export const EXIT_METHODS = [
  "hold_forever",
  "sell",
  "1031_exchange",
  "refinance_hold",
  "seller_finance",
  "convert_primary",
  "gift_inherit",
  "undecided",
] as const;

export const HOLD_PERIODS = [
  "indefinite",
  "short",
  "medium",
  "long",
  "specific",
] as const;

export const BRRRR_PHASES = [
  "acquisition",
  "rehab",
  "rent",
  "refinance",
  "stabilized",
] as const;

export const REHAB_CATEGORIES = [
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
] as const;

export const REHAB_STATUSES = [
  "planned",
  "in_progress",
  "complete",
  "cancelled",
] as const;

// ============================================================================
// Property Strategy API Schemas
// ============================================================================

/**
 * Property Strategy insert schema for API usage
 *
 * This schema accepts numbers for numeric fields (API format) instead of strings (DB format).
 * The API route handles converting numbers to strings for the database.
 */
export const propertyStrategyInsertApiSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),

  // Strategy selection
  primaryStrategy: z.enum(PRIMARY_STRATEGIES, {
    errorMap: () => ({ message: "Please select a valid investment strategy" }),
  }),
  strategyVariant: z.string().optional().nullable(),

  // Hold timeline
  holdPeriod: z.enum(HOLD_PERIODS).optional().nullable(),
  targetExitYear: z.number().int().min(2020).max(2100).optional().nullable(),
  holdYearsMin: z.number().int().min(0).max(100).optional().nullable(),
  holdYearsMax: z.number().int().min(0).max(100).optional().nullable(),

  // Exit strategy
  exitMethod: z.enum(EXIT_METHODS).optional().nullable(),
  exitPriceTarget: z.number().min(0, "Exit price target must be positive").optional().nullable(),
  exitEquityTarget: z.number().min(0, "Exit equity target must be positive").optional().nullable(),
  exitCapRateFloor: z.number().min(0).max(100, "Cap rate must be 0-100%").optional().nullable(),
  exitCashFlowFloor: z.number().min(0, "Cash flow floor must be positive").optional().nullable(),
  exitLifeEvent: z.string().max(500).optional().nullable(),

  // 1031 exchange tracking
  is1031Replacement: z.boolean().optional().nullable(),
  sourcePropertyId: z.string().uuid().optional().nullable(),
  exchangeDeadline: z.string().optional().nullable(),
  identificationDeadline: z.string().optional().nullable(),

  // Future rental intent (for primary residence)
  futureRentalIntent: z.boolean().optional().nullable(),
  plannedConversionDate: z.string().optional().nullable(),

  // Property-specific targets
  targetMonthlyCashFlow: z.number().min(0, "Target cash flow must be positive").optional().nullable(),
  targetEquity: z.number().min(0, "Target equity must be positive").optional().nullable(),
  targetCashOnCash: z.number().min(0).max(100, "Cash on cash must be 0-100%").optional().nullable(),
  targetPayoffDate: z.string().optional().nullable(),

  // Score weight overrides (NULL = use strategy defaults)
  weightFinancialPerformance: z.number().int().min(0).max(100).optional().nullable(),
  weightEquityVelocity: z.number().int().min(0).max(100).optional().nullable(),
  weightOperationalHealth: z.number().int().min(0).max(100).optional().nullable(),
  weightMarketPosition: z.number().int().min(0).max(100).optional().nullable(),
  weightRiskFactors: z.number().int().min(0).max(100).optional().nullable(),
}).refine(
  (data) => {
    // If any weight is set, they must all sum to 100
    const weights = [
      data.weightFinancialPerformance,
      data.weightEquityVelocity,
      data.weightOperationalHealth,
      data.weightMarketPosition,
      data.weightRiskFactors,
    ];
    const hasAnyWeight = weights.some((w) => w !== undefined && w !== null);
    if (!hasAnyWeight) return true;
    const hasAllWeights = weights.every((w) => w !== undefined && w !== null);
    if (!hasAllWeights) return false;
    const sum = weights.reduce((acc, w) => acc + (w ?? 0), 0);
    return sum === 100;
  },
  { message: "Score weights must all be set and sum to 100" }
);

/**
 * Property Strategy update schema for API usage
 * All fields optional for partial updates
 */
export const propertyStrategyUpdateApiSchema = z.object({
  // Strategy selection
  primaryStrategy: z.enum(PRIMARY_STRATEGIES, {
    errorMap: () => ({ message: "Please select a valid investment strategy" }),
  }).optional(),
  strategyVariant: z.string().optional().nullable(),

  // Hold timeline
  holdPeriod: z.enum(HOLD_PERIODS).optional().nullable(),
  targetExitYear: z.number().int().min(2020).max(2100).optional().nullable(),
  holdYearsMin: z.number().int().min(0).max(100).optional().nullable(),
  holdYearsMax: z.number().int().min(0).max(100).optional().nullable(),

  // Exit strategy
  exitMethod: z.enum(EXIT_METHODS).optional().nullable(),
  exitPriceTarget: z.number().min(0).optional().nullable(),
  exitEquityTarget: z.number().min(0).optional().nullable(),
  exitCapRateFloor: z.number().min(0).max(100).optional().nullable(),
  exitCashFlowFloor: z.number().min(0).optional().nullable(),
  exitLifeEvent: z.string().max(500).optional().nullable(),

  // 1031 exchange tracking
  is1031Replacement: z.boolean().optional().nullable(),
  sourcePropertyId: z.string().uuid().optional().nullable(),
  exchangeDeadline: z.string().optional().nullable(),
  identificationDeadline: z.string().optional().nullable(),

  // Future rental intent (for primary residence)
  futureRentalIntent: z.boolean().optional().nullable(),
  plannedConversionDate: z.string().optional().nullable(),

  // Property-specific targets
  targetMonthlyCashFlow: z.number().min(0).optional().nullable(),
  targetEquity: z.number().min(0).optional().nullable(),
  targetCashOnCash: z.number().min(0).max(100).optional().nullable(),
  targetPayoffDate: z.string().optional().nullable(),

  // Score weight overrides
  weightFinancialPerformance: z.number().int().min(0).max(100).optional().nullable(),
  weightEquityVelocity: z.number().int().min(0).max(100).optional().nullable(),
  weightOperationalHealth: z.number().int().min(0).max(100).optional().nullable(),
  weightMarketPosition: z.number().int().min(0).max(100).optional().nullable(),
  weightRiskFactors: z.number().int().min(0).max(100).optional().nullable(),
});

/**
 * Property Strategy select schema (no changes needed, just re-export)
 */
export const propertyStrategySelectApiSchema = propertyStrategySelectSchema;

// ============================================================================
// BRRRR Phase API Schemas
// ============================================================================

/**
 * BRRRR Phase insert schema for API usage
 */
export const brrrrPhaseInsertApiSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),

  // Current phase
  currentPhase: z.enum(BRRRR_PHASES).optional(),
  phaseStartDate: z.string().optional(),

  // Acquisition data
  arvEstimate: z.number().min(0, "ARV must be positive").optional().nullable(),
  rehabBudget: z.number().min(0, "Rehab budget must be positive").optional().nullable(),
  allInCost: z.number().min(0, "All-in cost must be positive").optional().nullable(),
  targetEquityCapture: z.number().min(0, "Target equity capture must be positive").optional().nullable(),

  // Rehab data
  rehabStartDate: z.string().optional().nullable(),
  rehabTargetEndDate: z.string().optional().nullable(),
  rehabActualEndDate: z.string().optional().nullable(),
  rehabBudgetSpent: z.number().min(0).optional().nullable(),
  holdingCosts: z.number().min(0).optional().nullable(),

  // Rent data
  listedDate: z.string().optional().nullable(),
  leasedDate: z.string().optional().nullable(),
  achievedRent: z.number().min(0).optional().nullable(),
  marketRentAtLease: z.number().min(0).optional().nullable(),

  // Refinance data
  appraisalDate: z.string().optional().nullable(),
  appraisalValue: z.number().min(0).optional().nullable(),
  newLoanAmount: z.number().min(0).optional().nullable(),
  cashOutAmount: z.number().min(0).optional().nullable(),
  newInterestRate: z.number().min(0).max(100).optional().nullable(),
  newMonthlyPayment: z.number().min(0).optional().nullable(),
  capitalLeftInDeal: z.number().min(0).optional().nullable(),
  refinanceCloseDate: z.string().optional().nullable(),

  // Stabilized (calculated on phase transition)
  cycleCompleteDate: z.string().optional().nullable(),
  totalInvested: z.number().min(0).optional().nullable(),
  totalReturned: z.number().min(0).optional().nullable(),
  finalCashOnCash: z.number().min(0).max(100).optional().nullable(),
  cycleDurationDays: z.number().int().min(0).optional().nullable(),
});

/**
 * BRRRR Phase update schema for API usage
 */
export const brrrrPhaseUpdateApiSchema = brrrrPhaseInsertApiSchema
  .partial()
  .extend({
    propertyId: z.string().uuid("Property ID must be a valid UUID"),
  });

/**
 * BRRRR Phase transition schema
 */
export const brrrrPhaseTransitionSchema = z.object({
  toPhase: z.enum(BRRRR_PHASES, {
    errorMap: () => ({ message: "Please select a valid BRRRR phase" }),
  }),
  transitionDate: z.string().optional(),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
  actualCost: z.number().min(0).optional().nullable(),
  actualArv: z.number().min(0).optional().nullable(),
});

/**
 * BRRRR Phase select schema (no changes needed, just re-export)
 */
export const brrrrPhaseSelectApiSchema = brrrrPhaseSelectSchema;

// ============================================================================
// Rehab Scope Item API Schemas
// ============================================================================

/**
 * Rehab Scope Item insert schema for API usage
 */
export const rehabScopeItemInsertApiSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  category: z.enum(REHAB_CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  description: z.string().min(1, "Description is required").max(500),
  estimatedCost: z.number().min(0, "Estimated cost must be positive").optional().nullable(),
  actualCost: z.number().min(0, "Actual cost must be positive").optional().nullable(),
  status: z.enum(REHAB_STATUSES).optional(),
  completedAt: z.string().optional().nullable(),
  vendorName: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

/**
 * Rehab Scope Item update schema for API usage
 * All fields are optional for partial updates
 */
export const rehabScopeItemUpdateApiSchema = rehabScopeItemInsertApiSchema
  .omit({ propertyId: true })
  .partial();

/**
 * Rehab Scope Item select schema (no changes needed, just re-export)
 */
export const rehabScopeItemSelectApiSchema = rehabScopeItemSelectSchema;

// ============================================================================
// Type Exports
// ============================================================================

export type PrimaryStrategy = typeof PRIMARY_STRATEGIES[number];
export type ExitMethod = typeof EXIT_METHODS[number];
export type HoldPeriod = typeof HOLD_PERIODS[number];
export type BRRRRPhase = typeof BRRRR_PHASES[number];
export type RehabCategory = typeof REHAB_CATEGORIES[number];
export type RehabStatus = typeof REHAB_STATUSES[number];

export type PropertyStrategyInsertApi = z.infer<typeof propertyStrategyInsertApiSchema>;
export type PropertyStrategyUpdateApi = z.infer<typeof propertyStrategyUpdateApiSchema>;
export type BRRRRPhaseInsertApi = z.infer<typeof brrrrPhaseInsertApiSchema>;
export type BRRRRPhaseUpdateApi = z.infer<typeof brrrrPhaseUpdateApiSchema>;
export type BRRRRPhaseTransition = z.infer<typeof brrrrPhaseTransitionSchema>;
export type RehabScopeItemInsertApi = z.infer<typeof rehabScopeItemInsertApiSchema>;
export type RehabScopeItemUpdateApi = z.infer<typeof rehabScopeItemUpdateApiSchema>;
