-- Migration: Property Strategy Tables
-- This migration adds strategy tracking for properties including BRRRR phase tracking and rehab scope items

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Primary investment strategy enum
DO $$ BEGIN
    CREATE TYPE "public"."primary_strategy" AS ENUM(
        'primary_residence',
        'house_hack',
        'buy_and_hold',
        'brrrr',
        'short_term_rental',
        'fix_and_flip',
        'value_add',
        'midterm_rental'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Exit method enum
DO $$ BEGIN
    CREATE TYPE "public"."exit_method" AS ENUM(
        'hold_forever',
        'sell',
        '1031_exchange',
        'refinance_hold',
        'seller_finance',
        'convert_primary',
        'gift_inherit',
        'undecided'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Hold period enum
DO $$ BEGIN
    CREATE TYPE "public"."hold_period" AS ENUM(
        'indefinite',
        'short',
        'medium',
        'long',
        'specific'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- BRRRR phase enum
DO $$ BEGIN
    CREATE TYPE "public"."brrrr_phase" AS ENUM(
        'acquisition',
        'rehab',
        'rent',
        'refinance',
        'stabilized'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Rehab category enum
DO $$ BEGIN
    CREATE TYPE "public"."rehab_category" AS ENUM(
        'kitchen',
        'bathroom',
        'flooring',
        'paint',
        'roof',
        'hvac',
        'electrical',
        'plumbing',
        'exterior',
        'landscaping',
        'windows',
        'appliances',
        'structural',
        'permits',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Rehab status enum
DO $$ BEGIN
    CREATE TYPE "public"."rehab_status" AS ENUM(
        'planned',
        'in_progress',
        'complete',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Property Strategies (1:1 with properties)
CREATE TABLE IF NOT EXISTS "property_strategies" (
    "property_id" uuid PRIMARY KEY NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,

    -- Strategy selection
    "primary_strategy" "primary_strategy" NOT NULL,
    "strategy_variant" text,

    -- Hold timeline
    "hold_period" "hold_period" DEFAULT 'indefinite',
    "target_exit_year" integer,
    "hold_years_min" integer,
    "hold_years_max" integer,

    -- Exit strategy
    "exit_method" "exit_method" DEFAULT 'undecided',
    "exit_price_target" numeric(12, 2),
    "exit_equity_target" numeric(12, 2),
    "exit_cap_rate_floor" numeric(5, 3),
    "exit_cash_flow_floor" numeric(10, 2),
    "exit_life_event" text,

    -- 1031 exchange tracking
    "is_1031_replacement" boolean DEFAULT false,
    "source_property_id" uuid REFERENCES "properties"("id"),
    "exchange_deadline" date,
    "identification_deadline" date,

    -- Future rental intent (for primary residence)
    "future_rental_intent" boolean DEFAULT false,
    "planned_conversion_date" date,

    -- Property-specific targets
    "target_monthly_cash_flow" numeric(10, 2),
    "target_equity" numeric(12, 2),
    "target_cash_on_cash" numeric(5, 3),
    "target_payoff_date" date,

    -- Score weight overrides (NULL = use strategy defaults)
    "weight_financial_performance" integer,
    "weight_equity_velocity" integer,
    "weight_operational_health" integer,
    "weight_market_position" integer,
    "weight_risk_factors" integer,

    -- Timestamps
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- BRRRR Phase Tracking (1:1 for BRRRR properties)
CREATE TABLE IF NOT EXISTS "brrrr_phases" (
    "property_id" uuid PRIMARY KEY NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,

    -- Current phase
    "current_phase" "brrrr_phase" NOT NULL DEFAULT 'acquisition',
    "phase_start_date" date NOT NULL DEFAULT CURRENT_DATE,

    -- Acquisition data
    "arv_estimate" numeric(12, 2),
    "rehab_budget" numeric(10, 2),
    "all_in_cost" numeric(12, 2),
    "target_equity_capture" numeric(12, 2),

    -- Rehab data
    "rehab_start_date" date,
    "rehab_target_end_date" date,
    "rehab_actual_end_date" date,
    "rehab_budget_spent" numeric(10, 2) DEFAULT '0',
    "holding_costs" numeric(10, 2) DEFAULT '0',

    -- Rent data
    "listed_date" date,
    "leased_date" date,
    "achieved_rent" numeric(8, 2),
    "market_rent_at_lease" numeric(8, 2),

    -- Refinance data
    "appraisal_date" date,
    "appraisal_value" numeric(12, 2),
    "new_loan_amount" numeric(12, 2),
    "cash_out_amount" numeric(12, 2),
    "new_interest_rate" numeric(5, 3),
    "new_monthly_payment" numeric(8, 2),
    "capital_left_in_deal" numeric(12, 2),
    "refinance_close_date" date,

    -- Stabilized (calculated on phase transition)
    "cycle_complete_date" date,
    "total_invested" numeric(12, 2),
    "total_returned" numeric(12, 2),
    "final_cash_on_cash" numeric(5, 3),
    "cycle_duration_days" integer,

    -- Timestamps
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- BRRRR Phase Transition History (1:many)
CREATE TABLE IF NOT EXISTS "brrrr_phase_history" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,

    "from_phase" "brrrr_phase",
    "to_phase" "brrrr_phase" NOT NULL,
    "transitioned_at" timestamp DEFAULT now() NOT NULL,
    "notes" text
);

-- Rehab Scope Items (1:many for BRRRR and value-add)
CREATE TABLE IF NOT EXISTS "rehab_scope_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,

    "category" "rehab_category" NOT NULL,
    "description" text NOT NULL,
    "estimated_cost" numeric(10, 2) NOT NULL,
    "actual_cost" numeric(10, 2),
    "status" "rehab_status" NOT NULL DEFAULT 'planned',
    "completed_date" date,
    "contractor_name" text,
    "notes" text,

    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS "idx_brrrr_phase_history_property_id" ON "brrrr_phase_history" USING btree ("property_id");
CREATE INDEX IF NOT EXISTS "idx_rehab_scope_items_property_id" ON "rehab_scope_items" USING btree ("property_id");
