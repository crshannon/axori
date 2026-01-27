# Axori Strategy Tab - Implementation Plan

> **Updated based on codebase analysis - January 2026**
>
> This document provides the implementation plan for the Strategy Tab feature, aligned with actual Axori codebase patterns and structure.

---

## Table of Contents

1. [Context & Overview](#context--overview)
2. [Feature Overview](#feature-overview)
3. [Strategy Taxonomy](#strategy-taxonomy)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [UI Components](#ui-components)
7. [Hooks & State Management](#hooks--state-management)
8. [Implementation Phases](#implementation-phases)
9. [Files to Create/Modify](#files-to-createmodify)
10. [Open Questions](#open-questions)

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

## API Routes

> **Pattern**: Follow existing Hono patterns in `apps/api/src/routes/properties.ts`

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

## Hooks & State Management

> **Pattern**: Follow existing hook patterns in `apps/web/src/hooks/api/`

### API Hooks

Create `apps/web/src/hooks/api/usePropertyStrategy.ts`:

```typescript
// Query: Get property strategy
export function usePropertyStrategy(propertyId: string | null | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['properties', propertyId, 'strategy'],
    queryFn: async () => {
      const result = await apiFetch<{
        strategy: PropertyStrategy | null;
        brrrrPhase: BRRRRPhase | null;
        scoreWeights: StrategyScoreWeights;
      }>(`/api/properties/${propertyId}/strategy`, {
        clerkId: user.id,
      });
      return result;
    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 5 * 1000,
  });
}

// Mutation: Update strategy
export function useUpdatePropertyStrategy() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ propertyId, ...data }: UpdateStrategyInput) => {
      return await apiFetch(`/api/properties/${propertyId}/strategy`, {
        method: 'PUT',
        clerkId: user.id,
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'strategy']
      });
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId]
      });
    },
  });
}

// Mutation: Transition BRRRR phase
export function useTransitionBRRRRPhase() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ propertyId, toPhase, notes }: TransitionPhaseInput) => {
      return await apiFetch(`/api/properties/${propertyId}/strategy/brrrr/transition`, {
        method: 'POST',
        clerkId: user.id,
        body: JSON.stringify({ toPhase, notes }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['properties', variables.propertyId, 'strategy']
      });
    },
  });
}
```

### Rehab Scope Hooks

Create `apps/web/src/hooks/api/useRehabScope.ts`:

```typescript
export function useRehabScope(propertyId: string | null | undefined) { /* ... */ }
export function useAddRehabItem() { /* ... */ }
export function useUpdateRehabItem() { /* ... */ }
export function useDeleteRehabItem() { /* ... */ }
```

### Computed Hooks

Create `apps/web/src/hooks/computed/useGoalAlignment.ts`:

```typescript
export function useGoalAlignment(propertyId: string) {
  const { data: property } = useProperty(propertyId);
  const { data: strategy } = usePropertyStrategy(propertyId);
  const { data: user } = useCurrentUser(); // Get FIRE number from onboarding data

  return useMemo(() => {
    if (!property || !strategy || !user) return null;

    // Calculate goal alignment metrics
    return {
      currentMonthlyContribution: calculateMonthlyCashFlow(property),
      projectedMonthlyAtPayoff: calculatePayoffCashFlow(property),
      percentOfFireGoal: calculateFirePercentage(property, user),
      // ... other metrics
    };
  }, [property, strategy, user]);
}
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
packages/db/src/schema/
└── index.ts                                  # Add enums, tables, relations

packages/shared/src/
├── types/strategy.ts                         # Type definitions
├── constants/strategy-weights.ts             # Default weight matrices
└── validation/base/strategy.ts               # Zod schemas

apps/api/src/routes/
└── strategy.ts                               # Strategy API routes (or add to properties.ts)

apps/web/src/
├── hooks/api/
│   ├── usePropertyStrategy.ts                # Strategy hooks
│   └── useRehabScope.ts                      # Rehab scope hooks
├── hooks/computed/
│   └── useGoalAlignment.ts                   # Goal alignment calculation
└── components/property-hub/property-details/strategy/
    ├── index.ts
    ├── StrategyOverview.tsx
    ├── StrategySelector.tsx
    ├── StrategyVariantSelector.tsx
    ├── ExitStrategyEditor.tsx
    ├── GoalAlignmentCard.tsx
    ├── ScoreWeightsEditor.tsx
    ├── brrrr/
    │   ├── BRRRRPhaseTracker.tsx
    │   ├── BRRRRPhaseDetail.tsx
    │   └── BRRRRPhaseTransition.tsx
    └── rehab/
        ├── RehabScopeManager.tsx
        ├── RehabScopeItem.tsx
        └── RehabBudgetSummary.tsx
```

### Files to Modify

```
apps/web/src/routes/_authed/property-hub.$propertyId/strategy.tsx
  → Replace mock UI with real components

apps/web/src/hooks/api/useProperties.ts
  → Update Property type to include strategy relation
  → Or keep separate with usePropertyStrategy

packages/shared/src/validation/index.ts
  → Export strategy schemas

apps/api/src/routes/properties.ts
  → Include strategy in property GET response
  → Or add strategy-specific endpoints
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
