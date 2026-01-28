# Axori Strategy Tab - Implementation Plan

> **Updated based on codebase analysis - January 2026**
> **Audited against `.claude/patterns/` - January 2026**
>
> This document provides the implementation plan for the Strategy Tab feature, aligned with actual Axori codebase patterns and structure.

---

## Table of Contents

1. [Context & Overview](#context--overview)
2. [Feature Overview](#feature-overview)
3. [Strategy Taxonomy](#strategy-taxonomy)
4. [Database Schema](#database-schema)
5. [Type Exports](#type-exports)
6. [Validation Schemas](#validation-schemas)
7. [API Routes](#api-routes)
8. [API Hooks](#api-hooks)
9. [Drawer Registration](#drawer-registration)
10. [UI Components](#ui-components)
11. [Implementation Phases](#implementation-phases)
12. [Files to Create/Modify](#files-to-createmodify)
13. [Open Questions](#open-questions)

---

## Context & Overview

### Tech Stack (Actual)

| Layer | Technology |
|-------|------------|
| Web Framework | TanStack Start + React 19 + Vite |
| Styling | Tailwind CSS 4 + `@axori/ui` components |
| API | Hono |
| Database | PostgreSQL (Supabase) + Drizzle ORM |
| Auth | Clerk |
| State | TanStack Query |
| Validation | Zod + drizzle-zod |

### Current State

- **Strategy Tab Route**: Already exists at `apps/web/src/routes/_authed/property-hub.$propertyId/strategy.tsx`
- **Current Content**: Hardcoded UI mockups (~190 lines), no data binding or API integration
- **Property Hook**: `useProperty(propertyId)` exists but has a stub `strategy` field
- **Database**: No strategy tables exist yet

---

## Feature Overview

The Strategy Tab allows users to:

1. **Define Investment Strategy** - Select and configure the strategy for this property
2. **Track Strategy-Specific Phases** - Especially for BRRRR and value-add strategies
3. **Set Goals & Targets** - Hold timeline, exit strategy, financial targets
4. **View Goal Alignment** - How this property contributes to their overall FIRE number
5. **Adjust Property Score Weights** - Strategy determines which scoring dimensions matter most

### Why This Matters

Most real estate tools treat all properties the same. But a BRRRR property sitting vacant during rehab isn't a problem—it's expected. A buy-and-hold with the same vacancy is bleeding money. The Strategy Tab makes Axori **context-aware**.

Key insight: *"Is this property doing what I bought it to do?"*

---

## Strategy Taxonomy

### Primary Strategies

```typescript
// Location: packages/shared/src/types/strategy.ts

export const PRIMARY_STRATEGIES = [
  'primary_residence',    // Living in it
  'house_hack',           // Live in + rent out portions
  'buy_and_hold',         // Traditional long-term rental
  'brrrr',                // Buy, Rehab, Rent, Refinance, Repeat
  'short_term_rental',    // Airbnb / VRBO
  'fix_and_flip',         // Renovate and sell
  'value_add',            // Renovate and hold
  'midterm_rental',       // 30+ day furnished rentals
] as const;

export type PrimaryStrategy = typeof PRIMARY_STRATEGIES[number];
```

### Strategy Variants

Each primary strategy has variants that affect tracking and scoring:

```typescript
export const STRATEGY_VARIANTS: Record<PrimaryStrategy, readonly string[]> = {
  primary_residence: ['standard', 'future_rental', 'live_in_flip'],
  house_hack: ['duplex', 'triplex_quad', 'room_rental', 'adu', 'basement'],
  buy_and_hold: ['cash_flow_focused', 'appreciation_focused', 'balanced', 'debt_freedom', 'legacy'],
  brrrr: ['classic', 'brrrr_light', 'delayed_refi'],
  short_term_rental: ['full_time_str', 'seasonal_str', 'arbitrage'],
  fix_and_flip: ['standard', 'wholesale', 'creative_finance'],
  value_add: ['renovate_hold', 'rent_optimization', 'conversion'],
  midterm_rental: ['travel_nurse', 'corporate', 'furnished_finder'],
} as const;
```

### BRRRR Phases

```typescript
export const BRRRR_PHASES = [
  'acquisition',    // Just purchased, planning rehab
  'rehab',          // Active renovation
  'rent',           // Tenant placement
  'refinance',      // Preparing for or in refinance
  'stabilized',     // Cycle complete, holding
] as const;

export type BRRRRPhase = typeof BRRRR_PHASES[number];
```

### Exit Methods

```typescript
export const EXIT_METHODS = [
  'hold_forever',            // Never selling
  'sell',                    // Traditional sale
  '1031_exchange',           // Tax-deferred exchange
  'refinance_hold',          // Cash out and keep
  'seller_finance',          // Sell with owner financing
  'convert_primary',         // Move back in
  'gift_inherit',            // Transfer to family
  'undecided',
] as const;

export type ExitMethod = typeof EXIT_METHODS[number];
```

---

## Database Schema

> **Pattern**: Follow existing Drizzle patterns in `packages/db/src/schema/index.ts`

### New Enums

```typescript
// Add to packages/db/src/schema/index.ts

// Primary strategy enum
export const primaryStrategyEnum = pgEnum("primary_strategy", [
  "primary_residence",
  "house_hack",
  "buy_and_hold",
  "brrrr",
  "short_term_rental",
  "fix_and_flip",
  "value_add",
  "midterm_rental",
]);

// Exit method enum
export const exitMethodEnum = pgEnum("exit_method", [
  "hold_forever",
  "sell",
  "1031_exchange",
  "refinance_hold",
  "seller_finance",
  "convert_primary",
  "gift_inherit",
  "undecided",
]);

// Hold period enum
export const holdPeriodEnum = pgEnum("hold_period", [
  "indefinite",
  "short",      // < 2 years
  "medium",     // 2-5 years
  "long",       // 5-10 years
  "specific",   // User sets specific year
]);

// BRRRR phase enum
export const brrrrPhaseEnum = pgEnum("brrrr_phase", [
  "acquisition",
  "rehab",
  "rent",
  "refinance",
  "stabilized",
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
```

### Property Strategies Table (1:1 with properties)

```typescript
// Property strategy configuration (1:1 relationship)
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
```

### BRRRR Phases Table (1:1 for BRRRR properties)

```typescript
// BRRRR phase tracking (1:1 for BRRRR strategy properties)
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
```

### BRRRR Phase History Table (1:many)

```typescript
// BRRRR phase transition history
export const brrrrPhaseHistory = pgTable("brrrr_phase_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  brrrrPhaseId: uuid("brrrr_phase_id")
    .references(() => brrrrPhases.propertyId, { onDelete: "cascade" })
    .notNull(),

  fromPhase: brrrrPhaseEnum("from_phase"),
  toPhase: brrrrPhaseEnum("to_phase").notNull(),
  transitionedAt: timestamp("transitioned_at").defaultNow().notNull(),
  notes: text("notes"),
}, (table) => ({
  brrrrPhaseIdIdx: index("idx_brrrr_phase_history_brrrr_phase_id").on(table.brrrrPhaseId),
}));
```

### Rehab Scope Items Table (1:many)

```typescript
// Rehab scope items (for BRRRR and value-add strategies)
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
```

### Relations

```typescript
// Add to existing propertiesRelations
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  // ... existing relations ...
  strategy: one(propertyStrategies, {
    fields: [properties.id],
    references: [propertyStrategies.propertyId],
  }),
  brrrrPhase: one(brrrrPhases, {
    fields: [properties.id],
    references: [brrrrPhases.propertyId],
  }),
  rehabItems: many(rehabScopeItems),
}));

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
  brrrrPhase: one(brrrrPhases, {
    fields: [brrrrPhaseHistory.brrrrPhaseId],
    references: [brrrrPhases.propertyId],
  }),
}));

export const rehabScopeItemsRelations = relations(rehabScopeItems, ({ one }) => ({
  property: one(properties, {
    fields: [rehabScopeItems.propertyId],
    references: [properties.id],
  }),
}));
```

---

## Type Exports

> **Pattern**: Follow existing pattern in `packages/db/src/types.ts`
> **Reference**: `.claude/patterns/feature-checklist.md` Step 2

All types must be inferred from Drizzle schema using `InferSelectModel`/`InferInsertModel`.

### Add to `packages/db/src/types.ts`

```typescript
import {
  propertyStrategies,
  brrrrPhases,
  brrrrPhaseHistory,
  rehabScopeItems,
} from './schema';

// ============================================================================
// Property Strategy (Investment Strategy Configuration)
// ============================================================================

/**
 * Property Strategy type inferred from Drizzle schema (for read operations)
 * Represents the investment strategy configuration for a property
 */
export type PropertyStrategy = InferSelectModel<typeof propertyStrategies>;

/**
 * Property Strategy insert type inferred from Drizzle schema (for insert operations)
 */
export type PropertyStrategyInsert = InferInsertModel<typeof propertyStrategies>;

// ============================================================================
// BRRRR Phase Tracking
// ============================================================================

/**
 * BRRRR Phase type inferred from Drizzle schema (for read operations)
 * Tracks the current phase and metrics for BRRRR strategy properties
 */
export type BRRRRPhaseRecord = InferSelectModel<typeof brrrrPhases>;

/**
 * BRRRR Phase insert type inferred from Drizzle schema (for insert operations)
 */
export type BRRRRPhaseRecordInsert = InferInsertModel<typeof brrrrPhases>;

// ============================================================================
// BRRRR Phase History
// ============================================================================

/**
 * BRRRR Phase History type inferred from Drizzle schema (for read operations)
 */
export type BRRRRPhaseHistory = InferSelectModel<typeof brrrrPhaseHistory>;

/**
 * BRRRR Phase History insert type inferred from Drizzle schema (for insert operations)
 */
export type BRRRRPhaseHistoryInsert = InferInsertModel<typeof brrrrPhaseHistory>;

// ============================================================================
// Rehab Scope Items
// ============================================================================

/**
 * Rehab Scope Item type inferred from Drizzle schema (for read operations)
 */
export type RehabScopeItem = InferSelectModel<typeof rehabScopeItems>;

/**
 * Rehab Scope Item insert type inferred from Drizzle schema (for insert operations)
 */
export type RehabScopeItemInsert = InferInsertModel<typeof rehabScopeItems>;
```

### Update `packages/db/src/types-only.ts`

Add re-exports for client-safe type imports:

```typescript
export type {
  PropertyStrategy,
  PropertyStrategyInsert,
  BRRRRPhaseRecord,
  BRRRRPhaseRecordInsert,
  BRRRRPhaseHistory,
  BRRRRPhaseHistoryInsert,
  RehabScopeItem,
  RehabScopeItemInsert,
} from './types';
```

---

## Validation Schemas

> **Pattern**: Three-tier validation architecture
> **Reference**: `.claude/patterns/validation-schemas.md`

### Tier 1: Base Schemas (drizzle-zod)

Create `packages/shared/src/validation/base/strategy.ts`:

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  propertyStrategies,
  brrrrPhases,
  brrrrPhaseHistory,
  rehabScopeItems,
} from "@axori/db";

// Property Strategy schemas
export const propertyStrategyInsertSchema = createInsertSchema(propertyStrategies);
export const propertyStrategySelectSchema = createSelectSchema(propertyStrategies);

// BRRRR Phase schemas
export const brrrrPhaseInsertSchema = createInsertSchema(brrrrPhases);
export const brrrrPhaseSelectSchema = createSelectSchema(brrrrPhases);

// BRRRR Phase History schemas
export const brrrrPhaseHistoryInsertSchema = createInsertSchema(brrrrPhaseHistory);
export const brrrrPhaseHistorySelectSchema = createSelectSchema(brrrrPhaseHistory);

// Rehab Scope Item schemas
export const rehabScopeItemInsertSchema = createInsertSchema(rehabScopeItems);
export const rehabScopeItemSelectSchema = createSelectSchema(rehabScopeItems);
```

### Tier 2: Enhanced API Schemas

Create `packages/shared/src/validation/enhanced/strategy.ts`:

```typescript
import { z } from "zod";
import {
  propertyStrategyInsertSchema,
  brrrrPhaseInsertSchema,
  rehabScopeItemInsertSchema,
} from "../base/strategy";

// =============================================================================
// Property Strategy API Schemas
// =============================================================================

export const propertyStrategyInsertApiSchema = propertyStrategyInsertSchema.extend({
  // Override numeric strings → numbers for API
  exitPriceTarget: z.number().min(0, "Exit price target must be positive").optional(),
  exitEquityTarget: z.number().min(0, "Exit equity target must be positive").optional(),
  exitCapRateFloor: z.number().min(0).max(100, "Cap rate must be 0-100%").optional(),
  exitCashFlowFloor: z.number().min(0, "Cash flow floor must be positive").optional(),
  targetMonthlyCashFlow: z.number().min(0, "Target cash flow must be positive").optional(),
  targetEquity: z.number().min(0, "Target equity must be positive").optional(),
  targetCashOnCash: z.number().min(0).max(100, "Cash on cash must be 0-100%").optional(),
  // Weight validation
  weightFinancialPerformance: z.number().int().min(0).max(100).optional(),
  weightEquityVelocity: z.number().int().min(0).max(100).optional(),
  weightOperationalHealth: z.number().int().min(0).max(100).optional(),
  weightMarketPosition: z.number().int().min(0).max(100).optional(),
  weightRiskFactors: z.number().int().min(0).max(100).optional(),
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
    const sum = weights.reduce((acc, w) => acc + (w ?? 0), 0);
    return sum === 100;
  },
  { message: "Score weights must sum to 100" }
);

export const propertyStrategyUpdateApiSchema = propertyStrategyInsertApiSchema.partial();

// =============================================================================
// BRRRR Phase API Schemas
// =============================================================================

export const brrrrPhaseInsertApiSchema = brrrrPhaseInsertSchema.extend({
  // Override numeric strings → numbers for API
  arvEstimate: z.number().min(0, "ARV must be positive").optional(),
  rehabBudget: z.number().min(0, "Rehab budget must be positive").optional(),
  allInCost: z.number().min(0, "All-in cost must be positive").optional(),
  targetEquityCapture: z.number().min(0, "Target equity capture must be positive").optional(),
  rehabBudgetSpent: z.number().min(0).optional(),
  holdingCosts: z.number().min(0).optional(),
  achievedRent: z.number().min(0).optional(),
  marketRentAtLease: z.number().min(0).optional(),
  appraisalValue: z.number().min(0).optional(),
  newLoanAmount: z.number().min(0).optional(),
  cashOutAmount: z.number().min(0).optional(),
  newInterestRate: z.number().min(0).max(100).optional(),
  newMonthlyPayment: z.number().min(0).optional(),
  capitalLeftInDeal: z.number().min(0).optional(),
  totalInvested: z.number().min(0).optional(),
  totalReturned: z.number().min(0).optional(),
  finalCashOnCash: z.number().min(0).max(100).optional(),
});

export const brrrrPhaseUpdateApiSchema = brrrrPhaseInsertApiSchema.partial();

// BRRRR Phase Transition schema
export const brrrrPhaseTransitionSchema = z.object({
  toPhase: z.enum(["acquisition", "rehab", "rent", "refinance", "stabilized"]),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
});

// =============================================================================
// Rehab Scope Item API Schemas
// =============================================================================

export const rehabScopeItemInsertApiSchema = rehabScopeItemInsertSchema.extend({
  estimatedCost: z.number().min(0, "Estimated cost must be positive"),
  actualCost: z.number().min(0, "Actual cost must be positive").optional(),
});

export const rehabScopeItemUpdateApiSchema = rehabScopeItemInsertApiSchema
  .partial()
  .extend({
    id: z.string().uuid("Invalid ID"),
  });

// =============================================================================
// Type Exports
// =============================================================================

export type PropertyStrategyInsertApi = z.infer<typeof propertyStrategyInsertApiSchema>;
export type PropertyStrategyUpdateApi = z.infer<typeof propertyStrategyUpdateApiSchema>;
export type BRRRRPhaseInsertApi = z.infer<typeof brrrrPhaseInsertApiSchema>;
export type BRRRRPhaseUpdateApi = z.infer<typeof brrrrPhaseUpdateApiSchema>;
export type BRRRRPhaseTransition = z.infer<typeof brrrrPhaseTransitionSchema>;
export type RehabScopeItemInsertApi = z.infer<typeof rehabScopeItemInsertApiSchema>;
export type RehabScopeItemUpdateApi = z.infer<typeof rehabScopeItemUpdateApiSchema>;
```

### Tier 3: Form Schemas (if needed)

Create `packages/shared/src/validation/form/strategy.ts` for complex form validation:

```typescript
import { z } from "zod";

// Form schema for strategy selection (string inputs that transform to typed values)
export const strategyFormSchema = z.object({
  primaryStrategy: z.string().min(1, "Strategy is required"),
  strategyVariant: z.string().optional(),
  holdPeriod: z.string().optional(),
  targetExitYear: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 2024 && val <= 2100), "Enter a valid year"),
  exitMethod: z.string().optional(),
});

// Form schema for rehab items (currency inputs)
export const rehabItemFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  estimatedCost: z
    .string()
    .min(1, "Estimated cost is required")
    .transform((val) => parseFloat(val.replace(/[,$]/g, "")))
    .refine((val) => !isNaN(val) && val >= 0, "Enter a valid amount"),
  actualCost: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val.replace(/[,$]/g, "")) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), "Enter a valid amount"),
});
```

### Export from Index

Add to `packages/shared/src/validation/index.ts`:

```typescript
// Strategy schemas (base)
export * from "./base/strategy";

// Strategy schemas (enhanced API)
export * from "./enhanced/strategy";

// Strategy schemas (form)
export * from "./form/strategy";
```

---

## API Routes

> **Pattern**: Follow existing Hono patterns in `apps/api/src/routes/properties.ts`
> **Reference**: `.claude/patterns/feature-checklist.md` Step 4

### Strategy Endpoints

Add to `apps/api/src/routes/properties.ts` or create new `apps/api/src/routes/strategy.ts`:

```typescript
// GET /api/properties/:propertyId/strategy
// Returns strategy configuration including BRRRR phase if applicable
router.get('/:propertyId/strategy',
  requireAuth(),
  withErrorHandling(async (c) => {
    const propertyId = c.req.param('propertyId');
    // Fetch property strategy with optional BRRRR phase
    // Return: { strategy, brrrrPhase?, scoreWeights }
  })
);

// PUT /api/properties/:propertyId/strategy
// Create or update strategy configuration
router.put('/:propertyId/strategy',
  requireAuth(),
  withErrorHandling(async (c) => {
    const propertyId = c.req.param('propertyId');
    const body = await c.req.json();
    // Validate with strategyUpdateSchema
    // Upsert property_strategies record
    // If BRRRR, initialize brrrr_phases if not exists
  })
);

// POST /api/properties/:propertyId/strategy/brrrr/transition
// Transition BRRRR phase
router.post('/:propertyId/strategy/brrrr/transition',
  requireAuth(),
  withErrorHandling(async (c) => {
    const propertyId = c.req.param('propertyId');
    const { toPhase, notes } = await c.req.json();
    // Validate phase transition is valid
    // Update brrrr_phases
    // Insert brrrr_phase_history record
  })
);
```

### Rehab Scope Endpoints

```typescript
// GET /api/properties/:propertyId/rehab-scope
router.get('/:propertyId/rehab-scope', /* ... */);

// POST /api/properties/:propertyId/rehab-scope
router.post('/:propertyId/rehab-scope', /* ... */);

// PUT /api/properties/:propertyId/rehab-scope/:itemId
router.put('/:propertyId/rehab-scope/:itemId', /* ... */);

// DELETE /api/properties/:propertyId/rehab-scope/:itemId
router.delete('/:propertyId/rehab-scope/:itemId', /* ... */);
```

### Goal Alignment Endpoint (Computed)

```typescript
// GET /api/properties/:propertyId/goal-alignment
// Returns calculated goal alignment metrics
// Pulls from user's FIRE settings + property financials
router.get('/:propertyId/goal-alignment', /* ... */);
```

---

## UI Components

> **Pattern**: Follow existing component structure in `apps/web/src/components/property-hub/property-details/`
> **Reference**: `.claude/patterns/design-system.md`, `.claude/patterns/feature-checklist.md` Step 8

### Dark Mode Checklist

All UI components MUST include dark mode variants. Check each component for:

- [ ] Background colors have dark variants (`bg-white` → `dark:bg-slate-900` or `dark:bg-white/5`)
- [ ] Text colors have dark variants (`text-slate-900` → `dark:text-white`)
- [ ] Secondary text (`text-slate-500` → `dark:text-white/60`)
- [ ] Borders have dark variants (`border-slate-200` → `dark:border-white/10`)
- [ ] Hover states work in both modes
- [ ] Accent colors use `#E8FF4D` in dark mode (`dark:bg-[#E8FF4D] dark:text-black`)
- [ ] Use opacity-based colors for subtle variations (`white/5`, `white/10`, etc.)

### @axori/ui Components to Use

Always prefer `@axori/ui` components over custom implementations:

```typescript
import {
  Button,
  Input,          // Use variant="rounded"
  Select,         // Use variant="rounded"
  Textarea,
  Drawer,
  Card,
  ErrorCard,
  DeleteConfirmationCard,
  EmptyState,
  LoadingSpinner,
} from "@axori/ui";
```

### Directory Structure

```
apps/web/src/components/property-hub/property-details/strategy/
├── index.ts                       # Barrel exports
├── StrategyOverview.tsx           # Main strategy card with current state
├── StrategySelector.tsx           # Card-based strategy selection
├── StrategyVariantSelector.tsx    # Secondary variant selection
├── ExitStrategyEditor.tsx         # Exit strategy configuration
├── GoalAlignmentCard.tsx          # FIRE goal contribution display
├── ScoreWeightsEditor.tsx         # Property Score weight sliders
├── brrrr/
│   ├── BRRRRPhaseTracker.tsx      # Visual phase timeline
│   ├── BRRRRPhaseDetail.tsx       # Expandable phase cards
│   └── BRRRRPhaseTransition.tsx   # Phase transition dialog
└── rehab/
    ├── RehabScopeManager.tsx      # Rehab items list/table
    ├── RehabScopeItem.tsx         # Single rehab item row
    └── RehabBudgetSummary.tsx     # Budget tracking header
```

### Component Specifications

#### StrategyOverview.tsx

The main strategy display card - shows at-a-glance status:

```typescript
interface StrategyOverviewProps {
  propertyId: string;
}

// Features:
// - Current strategy + variant badge
// - BRRRR phase progress bar (if applicable)
// - Exit strategy summary
// - Goal alignment percentage
// - "Edit Strategy" action
```

#### StrategySelector.tsx

Large card-based selection for primary strategy:

```typescript
interface StrategySelectorProps {
  selectedStrategy: PrimaryStrategy | null;
  onSelect: (strategy: PrimaryStrategy) => void;
}

// Features:
// - 8 strategy cards in 2x4 or 3x3 grid
// - Icon + name + description for each
// - Highlight selected card
// - Mobile-responsive layout
```

#### BRRRRPhaseTracker.tsx

Visual timeline showing BRRRR phases:

```typescript
interface BRRRRPhaseTrackerProps {
  propertyId: string;
  currentPhase: BRRRRPhase;
  phaseData: BRRRRPhaseData;
  onAdvancePhase?: () => void;
}

// Features:
// - 5-step horizontal timeline
// - Checkmarks for completed phases
// - Current phase highlight with details
// - Phase-specific metrics below each step
// - "Advance to Next Phase" button
```

#### ScoreWeightsEditor.tsx

Slider-based weight customization:

```typescript
interface ScoreWeightsEditorProps {
  strategy: PrimaryStrategy;
  brrrrPhase?: BRRRRPhase;
  customWeights: StrategyScoreWeights | null;
  onChange: (weights: StrategyScoreWeights | null) => void;
}

// Features:
// - 5 sliders (one per dimension)
// - Real-time total validation (must sum to 100)
// - "Reset to Strategy Defaults" button
// - Show default weights for comparison
```

---

## API Hooks

> **Pattern**: TanStack Query with key factory pattern
> **Reference**: `CLAUDE.md` TanStack Query Hook Patterns, `.claude/settings.md`

### Query Key Factory

Create `apps/web/src/hooks/api/usePropertyStrategy.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/tanstack-start";
import { apiFetch } from "@/lib/api";
import type { PropertyStrategy, BRRRRPhaseRecord } from "@axori/db/types";

// =============================================================================
// Query Key Factory (Standard Pattern)
// =============================================================================

export const strategyKeys = {
  all: ["strategies"] as const,
  lists: () => [...strategyKeys.all, "list"] as const,
  list: (propertyId: string) => [...strategyKeys.lists(), propertyId] as const,
  details: () => [...strategyKeys.all, "detail"] as const,
  detail: (propertyId: string) => [...strategyKeys.details(), propertyId] as const,
};

export const rehabScopeKeys = {
  all: ["rehab-scope"] as const,
  lists: () => [...rehabScopeKeys.all, "list"] as const,
  list: (propertyId: string) => [...rehabScopeKeys.lists(), propertyId] as const,
  details: () => [...rehabScopeKeys.all, "detail"] as const,
  detail: (itemId: string) => [...rehabScopeKeys.details(), itemId] as const,
};

// =============================================================================
// Strategy Hooks
// =============================================================================

interface StrategyResponse {
  strategy: PropertyStrategy | null;
  brrrrPhase: BRRRRPhaseRecord | null;
  scoreWeights: {
    financialPerformance: number;
    equityVelocity: number;
    operationalHealth: number;
    marketPosition: number;
    riskFactors: number;
  };
}

/**
 * Get property strategy configuration
 */
export function usePropertyStrategy(propertyId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: strategyKeys.detail(propertyId ?? ""),
    queryFn: async () => {
      const result = await apiFetch<StrategyResponse>(
        `/api/properties/${propertyId}/strategy`,
        { clerkId: user!.id }
      );
      return result;
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 5 * 1000,
  });
}

/**
 * Update property strategy
 */
export function useUpdatePropertyStrategy() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...data
    }: { propertyId: string } & Partial<PropertyStrategy>) => {
      return await apiFetch(`/api/properties/${propertyId}/strategy`, {
        method: "PUT",
        clerkId: user!.id,
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate strategy detail
      queryClient.invalidateQueries({
        queryKey: strategyKeys.detail(variables.propertyId),
      });
      // Invalidate property detail (strategy is included in property response)
      queryClient.invalidateQueries({
        queryKey: ["properties", variables.propertyId],
      });
    },
  });
}

/**
 * Transition BRRRR phase
 */
export function useTransitionBRRRRPhase() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      propertyId,
      toPhase,
      notes,
    }: {
      propertyId: string;
      toPhase: string;
      notes?: string;
    }) => {
      return await apiFetch(
        `/api/properties/${propertyId}/strategy/brrrr/transition`,
        {
          method: "POST",
          clerkId: user!.id,
          body: JSON.stringify({ toPhase, notes }),
        }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: strategyKeys.detail(variables.propertyId),
      });
    },
  });
}

// =============================================================================
// Rehab Scope Hooks
// =============================================================================

/**
 * Get rehab scope items for a property
 */
export function useRehabScope(propertyId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: rehabScopeKeys.list(propertyId ?? ""),
    queryFn: async () => {
      const result = await apiFetch<{ items: RehabScopeItem[] }>(
        `/api/properties/${propertyId}/rehab-scope`,
        { clerkId: user!.id }
      );
      return result.items;
    },
    enabled: !!user?.id && !!propertyId,
  });
}

/**
 * Add rehab scope item
 */
export function useCreateRehabItem() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      propertyId,
      ...data
    }: { propertyId: string } & RehabScopeItemInsertApi) => {
      return await apiFetch(`/api/properties/${propertyId}/rehab-scope`, {
        method: "POST",
        clerkId: user!.id,
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: rehabScopeKeys.list(variables.propertyId),
      });
    },
  });
}

/**
 * Update rehab scope item
 */
export function useUpdateRehabItem() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      propertyId,
      itemId,
      ...data
    }: { propertyId: string; itemId: string } & Partial<RehabScopeItemInsertApi>) => {
      return await apiFetch(
        `/api/properties/${propertyId}/rehab-scope/${itemId}`,
        {
          method: "PUT",
          clerkId: user!.id,
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: rehabScopeKeys.list(variables.propertyId),
      });
    },
  });
}

/**
 * Delete rehab scope item
 */
export function useDeleteRehabItem() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({
      propertyId,
      itemId,
    }: {
      propertyId: string;
      itemId: string;
    }) => {
      return await apiFetch(
        `/api/properties/${propertyId}/rehab-scope/${itemId}`,
        {
          method: "DELETE",
          clerkId: user!.id,
        }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: rehabScopeKeys.list(variables.propertyId),
      });
    },
  });
}
```

### Computed Hooks

Create `apps/web/src/hooks/computed/useGoalAlignment.ts`:

```typescript
import { useMemo } from "react";
import { useProperty } from "../api/useProperties";
import { usePropertyStrategy } from "../api/usePropertyStrategy";
import { useCurrentUser } from "../api/useCurrentUser";

export function useGoalAlignment(propertyId: string) {
  const { data: property } = useProperty(propertyId);
  const { data: strategyData } = usePropertyStrategy(propertyId);
  const { data: user } = useCurrentUser();

  return useMemo(() => {
    if (!property || !strategyData || !user) return null;

    const strategy = strategyData.strategy;
    if (!strategy) return null;

    // Calculate goal alignment metrics
    const currentMonthlyContribution = calculateMonthlyCashFlow(property);
    const projectedMonthlyAtPayoff = calculatePayoffCashFlow(property);
    const fireGoal = user.onboardingData?.fireNumber ?? 0;
    const percentOfFireGoal = fireGoal > 0
      ? (currentMonthlyContribution / fireGoal) * 100
      : 0;

    return {
      currentMonthlyContribution,
      projectedMonthlyAtPayoff,
      percentOfFireGoal,
      fireGoal,
      isOnTrack: currentMonthlyContribution >= (strategy.targetMonthlyCashFlow ?? 0),
    };
  }, [property, strategyData, user]);
}

// Helper functions (simplified)
function calculateMonthlyCashFlow(property: any): number {
  // Implementation based on existing financial calculations
  return 0;
}

function calculatePayoffCashFlow(property: any): number {
  // Implementation: cash flow when mortgages are paid off
  return 0;
}
```

---

## Drawer Registration

> **Pattern**: URL-based drawer factory with lazy loading
> **Reference**: `apps/web/src/lib/drawer/registry.ts`, `.claude/patterns/feature-checklist.md` Steps 6-7

### Add Drawer Names

Add to `DRAWERS` constant in `apps/web/src/lib/drawer/registry.ts`:

```typescript
export const DRAWERS = {
  // ... existing drawers ...

  // Strategy Drawers
  STRATEGY_EDIT: 'strategy-edit',
  EXIT_STRATEGY: 'exit-strategy',
  BRRRR_PHASE_TRANSITION: 'brrrr-phase-transition',
  REHAB_ITEM_ADD: 'rehab-item-add',
  REHAB_ITEM_EDIT: 'rehab-item-edit',
  SCORE_WEIGHTS: 'score-weights',
} as const;
```

### Add Param Schemas

```typescript
/**
 * Schema for strategy drawer (property-based)
 */
export const strategyDrawerParamsSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
});

/**
 * Schema for rehab item drawer (property + optional itemId for edit mode)
 */
export const rehabItemDrawerParamsSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  itemId: z.string().optional(),
});

/**
 * Schema for BRRRR phase transition drawer
 */
export const brrrrTransitionDrawerParamsSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  currentPhase: z.string().min(1, 'Current phase is required'),
});
```

### Add to DRAWER_NAMES Array

```typescript
export const DRAWER_NAMES = [
  // ... existing names ...

  // Strategy drawers
  'strategy-edit',
  'exit-strategy',
  'brrrr-phase-transition',
  'rehab-item-add',
  'rehab-item-edit',
  'score-weights',
] as const;
```

### Register Drawer Components

```typescript
// Add to DRAWER_REGISTRY

// ==========================================================================
// Strategy Drawers
// ==========================================================================
'strategy-edit': {
  component: lazy(() =>
    import('@/components/drawers/StrategyEditDrawer').then((m) => ({
      default: m.StrategyEditDrawer,
    })),
  ),
  paramsSchema: strategyDrawerParamsSchema,
  permission: 'member',
  displayName: 'Edit Strategy',
},

'exit-strategy': {
  component: lazy(() =>
    import('@/components/drawers/ExitStrategyDrawer').then((m) => ({
      default: m.ExitStrategyDrawer,
    })),
  ),
  paramsSchema: strategyDrawerParamsSchema,
  permission: 'member',
  displayName: 'Exit Strategy',
},

'brrrr-phase-transition': {
  component: lazy(() =>
    import('@/components/drawers/BRRRRPhaseTransitionDrawer').then((m) => ({
      default: m.BRRRRPhaseTransitionDrawer,
    })),
  ),
  paramsSchema: brrrrTransitionDrawerParamsSchema,
  permission: 'member',
  displayName: 'Advance BRRRR Phase',
},

'rehab-item-add': {
  component: lazy(() =>
    import('@/components/drawers/RehabItemDrawer').then((m) => ({
      default: m.RehabItemDrawer,
    })),
  ),
  paramsSchema: rehabItemDrawerParamsSchema,
  permission: 'member',
  displayName: 'Add Rehab Item',
},

'rehab-item-edit': {
  component: lazy(() =>
    import('@/components/drawers/RehabItemDrawer').then((m) => ({
      default: m.RehabItemDrawer,
    })),
  ),
  paramsSchema: rehabItemDrawerParamsSchema,
  permission: 'member',
  displayName: 'Edit Rehab Item',
},

'score-weights': {
  component: lazy(() =>
    import('@/components/drawers/ScoreWeightsDrawer').then((m) => ({
      default: m.ScoreWeightsDrawer,
    })),
  ),
  paramsSchema: strategyDrawerParamsSchema,
  permission: 'member',
  displayName: 'Score Weights',
},
```

---

## Implementation Phases

### Phase 1: Foundation (Database + Basic API)

**Goal**: Create database tables and basic CRUD

1. Add enums to `packages/db/src/schema/index.ts`
2. Add tables: `propertyStrategies`, `brrrrPhases`, `brrrrPhaseHistory`, `rehabScopeItems`
3. Add relations
4. Generate migration: `pnpm db:generate`
5. Push migration: `pnpm db:push`
6. Create Zod schemas in `packages/shared/src/validation/base/strategy.ts`
7. Create API routes for strategy CRUD
8. Create `usePropertyStrategy` hook

**Deliverables**:
- Database tables created
- Basic strategy can be saved/loaded
- Strategy shows in property details API response

### Phase 2: Strategy Selection UI

**Goal**: Users can select and save a strategy

1. Create `StrategyOverview.tsx` - read-only display
2. Create `StrategySelector.tsx` - card-based selection
3. Create `StrategyVariantSelector.tsx` - secondary selection
4. Update `strategy.tsx` route to use real data
5. Add strategy to property creation wizard (optional)

**Deliverables**:
- Strategy tab shows real data
- Users can select primary strategy
- Users can select variant
- Changes persist to database

### Phase 3: Exit Strategy & Goals

**Goal**: Configure exit strategy and targets

1. Create `ExitStrategyEditor.tsx` - drawer/dialog for configuration
2. Create `GoalAlignmentCard.tsx` - FIRE contribution display
3. Add goal alignment calculation hook
4. Integrate with user onboarding data (FIRE number)

**Deliverables**:
- Exit strategy can be configured
- Goal alignment shows real metrics
- Property targets can be set

### Phase 4: BRRRR Phase Tracking

**Goal**: Full BRRRR workflow

1. Create `BRRRRPhaseTracker.tsx` - visual timeline
2. Create `BRRRRPhaseDetail.tsx` - phase-specific forms
3. Create `BRRRRPhaseTransition.tsx` - transition dialog
4. Create phase transition API
5. Create phase history display

**Deliverables**:
- BRRRR properties show phase tracker
- Users can advance phases
- Phase-specific data can be entered
- Phase history is tracked

### Phase 5: Rehab Scope Management

**Goal**: Track rehab budget and items

1. Create `RehabScopeManager.tsx` - list/table view
2. Create `RehabScopeItem.tsx` - row component
3. Create `RehabBudgetSummary.tsx` - budget tracking
4. Create rehab scope CRUD API
5. Connect budget to BRRRR phase

**Deliverables**:
- Rehab items can be added/edited/deleted
- Budget tracking shows estimated vs actual
- Status can be updated
- Integrates with BRRRR rehab phase

### Phase 6: Score Weight Customization

**Goal**: Connect strategy to Property Score

1. Create `ScoreWeightsEditor.tsx` - slider interface
2. Define default weights per strategy
3. Define BRRRR phase-specific overrides
4. Update Property Score calculation to use weights
5. Add "Reset to Defaults" functionality

**Deliverables**:
- Score weights display based on strategy
- Custom weights can be set
- Property Score uses actual weights
- Phase-specific weights work for BRRRR

---

## Files to Create/Modify

### New Files

```
# Database & Types
packages/db/src/schema/index.ts               # Add enums, tables, relations
packages/db/src/types.ts                      # Add type exports (InferSelectModel/Insert)
packages/db/src/types-only.ts                 # Add re-exports for client-safe imports

# Validation (Three-Tier Pattern)
packages/shared/src/validation/base/strategy.ts      # Tier 1: drizzle-zod base schemas
packages/shared/src/validation/enhanced/strategy.ts  # Tier 2: API schemas with business logic
packages/shared/src/validation/form/strategy.ts      # Tier 3: Form schemas with transforms

# Constants & Types
packages/shared/src/types/strategy.ts                # Shared type definitions
packages/shared/src/constants/strategy-weights.ts    # Default weight matrices

# API Routes
apps/api/src/routes/strategy.ts               # Strategy API routes (or add to properties.ts)

# Hooks
apps/web/src/hooks/api/usePropertyStrategy.ts # Strategy & rehab scope hooks with key factory
apps/web/src/hooks/computed/useGoalAlignment.ts # Goal alignment calculation

# Drawer Components (registered in drawer factory)
apps/web/src/components/drawers/
├── StrategyEditDrawer.tsx
├── ExitStrategyDrawer.tsx
├── BRRRRPhaseTransitionDrawer.tsx
├── RehabItemDrawer.tsx
└── ScoreWeightsDrawer.tsx

# Feature Components
apps/web/src/components/property-hub/property-details/strategy/
├── index.ts
├── StrategyOverview.tsx
├── StrategySelector.tsx
├── StrategyVariantSelector.tsx
├── ExitStrategyCard.tsx
├── GoalAlignmentCard.tsx
├── ScoreWeightsCard.tsx
├── brrrr/
│   ├── BRRRRPhaseTracker.tsx
│   ├── BRRRRPhaseDetail.tsx
│   └── BRRRRPhaseTransitionCard.tsx
└── rehab/
    ├── RehabScopeManager.tsx
    ├── RehabScopeItem.tsx
    └── RehabBudgetSummary.tsx
```

### Files to Modify

```
# Drawer Registry (CRITICAL - register all new drawers)
apps/web/src/lib/drawer/registry.ts
  → Add drawer names to DRAWERS constant
  → Add param schemas (strategyDrawerParamsSchema, etc.)
  → Add to DRAWER_NAMES array
  → Register drawer components in DRAWER_REGISTRY

# Validation Index (export new schemas)
packages/shared/src/validation/index.ts
  → Export base/strategy.ts
  → Export enhanced/strategy.ts
  → Export form/strategy.ts

# Strategy Tab Route
apps/web/src/routes/_authed/property-hub.$propertyId/strategy.tsx
  → Replace mock UI with real components
  → Import from strategy components directory

# API Routes (optional - can add to properties.ts instead)
apps/api/src/routes/properties.ts
  → Include strategy in property GET response
  → OR create separate strategy.ts route file

apps/api/src/index.ts
  → Register strategy routes if separate file
```

---

## Open Questions

1. **Strategy change history?**
   - Should we track when/why strategy changed?
   - Could use `propertyHistory` table with `tableName: 'property_strategies'`
   - **Recommendation**: Yes, use existing history pattern

2. **Multiple strategies per property?**
   - Can a property be both house hack AND BRRRR?
   - **Recommendation**: No - use variants instead (e.g., house_hack with future conversion intent)

3. **Strategy templates?**
   - Pre-configured strategies users can pick from?
   - **Recommendation**: Phase 7+ feature - focus on core functionality first

4. **Comparison view?**
   - Compare strategy performance across portfolio?
   - **Recommendation**: Phase 7+ feature - analytics tab enhancement

5. **Strategy suggestions?**
   - AI suggests optimal strategy based on property characteristics?
   - **Recommendation**: Phase 7+ feature - add to AI recommendations system

6. **Where to put strategy in wizard?**
   - Should strategy be part of property creation wizard?
   - **Recommendation**: Optional step in wizard, required before property can be "active"

---

## Appendix: Score Weight Matrices

### Default Weights by Strategy

```typescript
// Location: packages/shared/src/constants/strategy-weights.ts

export const STRATEGY_WEIGHTS: Record<PrimaryStrategy, StrategyScoreWeights> = {
  primary_residence: {
    financialPerformance: 10,
    equityVelocity: 30,
    operationalHealth: 20,
    marketPosition: 30,
    riskFactors: 10,
  },
  house_hack: {
    financialPerformance: 25,
    equityVelocity: 25,
    operationalHealth: 25,
    marketPosition: 15,
    riskFactors: 10,
  },
  buy_and_hold: {
    financialPerformance: 30,
    equityVelocity: 20,
    operationalHealth: 25,
    marketPosition: 15,
    riskFactors: 10,
  },
  brrrr: {
    financialPerformance: 25,
    equityVelocity: 30,
    operationalHealth: 20,
    marketPosition: 15,
    riskFactors: 10,
  },
  short_term_rental: {
    financialPerformance: 35,
    equityVelocity: 15,
    operationalHealth: 30,
    marketPosition: 10,
    riskFactors: 10,
  },
  fix_and_flip: {
    financialPerformance: 10,
    equityVelocity: 40,
    operationalHealth: 10,
    marketPosition: 30,
    riskFactors: 10,
  },
  value_add: {
    financialPerformance: 20,
    equityVelocity: 35,
    operationalHealth: 20,
    marketPosition: 15,
    riskFactors: 10,
  },
  midterm_rental: {
    financialPerformance: 30,
    equityVelocity: 15,
    operationalHealth: 30,
    marketPosition: 15,
    riskFactors: 10,
  },
};
```

### BRRRR Phase Weight Overrides

```typescript
export const BRRRR_PHASE_WEIGHT_OVERRIDES: Record<BRRRRPhase, Partial<StrategyScoreWeights>> = {
  acquisition: {
    equityVelocity: 40,
    riskFactors: 20,
    operationalHealth: 10,
  },
  rehab: {
    operationalHealth: 40,
    equityVelocity: 30,
    financialPerformance: 10,
  },
  rent: {
    operationalHealth: 35,
    financialPerformance: 30,
    equityVelocity: 15,
  },
  refinance: {
    equityVelocity: 45,
    financialPerformance: 25,
    operationalHealth: 10,
  },
  stabilized: {
    // Use standard buy_and_hold weights
  },
};
```

---

## Appendix: UI Mockups Reference

### Strategy Tab Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Strategy                                           [Edit] ▾     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎯 BRRRR (Classic)                                          │ │
│ │ Phase: Refinance ████████████░░░░ 75%                       │ │
│ │ Started: Mar 2024 · Target stabilization: Aug 2024          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ BRRRR Progress                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✓ Acquisition    ✓ Rehab    ✓ Rent    → Refinance   ○ Done │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ Exit Strategy                    │  Goal Alignment              │
│ ├─ Method: Hold Forever          │  ├─ Monthly: $487 (4.9%)     │
│ ├─ Hold period: Indefinite       │  ├─ At payoff: $1,847 (18.5%)│
│ └─ [Edit Exit Strategy]          │  └─ On track: ✓ Yes          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### BRRRR Phase Tracker

```
   Acquisition    Rehab        Rent       Refinance   Stabilized
   ┌─────┐       ┌─────┐      ┌─────┐     ┌─────┐     ┌─────┐
   │ ✓   │──────▶│ ✓   │─────▶│ ✓   │────▶│ ●   │────▶│     │
   └─────┘       └─────┘      └─────┘     └─────┘     └─────┘
   Mar 1         Mar 15-      Jun 1       Jul 15
   $142k         May 30       $1,650/mo   Pending
                 $38k rehab
```

### Rehab Scope Manager

```
┌─────────────────────────────────────────────────────────────────┐
│ Rehab Scope                              Budget: $38,000        │
│                                          Spent:  $32,500 (86%) │
├─────────────────────────────────────────────────────────────────┤
│ Category      Description         Est.      Actual    Status   │
│ ─────────────────────────────────────────────────────────────── │
│ Kitchen       Full remodel        $12,000   $13,200   ✓ Done   │
│ Bathroom      Master bath         $6,000    $5,800    ✓ Done   │
│ Flooring      LVP throughout      $8,000    $7,500    ✓ Done   │
│ HVAC          New unit            $6,000    $2,000    ● In Prog│
│ Landscaping   Front yard          $2,000    --        ○ Planned│
│                                                                 │
│ [+ Add Item]                                                    │
└─────────────────────────────────────────────────────────────────┘
```
