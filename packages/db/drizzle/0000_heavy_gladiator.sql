CREATE TYPE "public"."ownership_status" AS ENUM('own_rented', 'own_vacant', 'under_contract', 'exploring');--> statement-breakpoint
CREATE TYPE "public"."portfolio_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('owns_property', 'watching', 'target_market');--> statement-breakpoint
CREATE TABLE "api_cache" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"endpoint" text NOT NULL,
	"lookup_value" text NOT NULL,
	"response_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"hit_count" integer DEFAULT 0,
	"last_accessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loan_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"change_type" text NOT NULL,
	"field_name" text,
	"old_value" text,
	"new_value" text,
	"balance_before" numeric(12, 2),
	"balance_after" numeric(12, 2),
	"principal_paid" numeric(10, 2),
	"interest_paid" numeric(10, 2),
	"escrow_paid" numeric(10, 2),
	"extra_principal" numeric(10, 2),
	"change_source" text NOT NULL,
	"effective_date" date,
	"notes" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_primary" boolean DEFAULT true,
	"loan_position" integer DEFAULT 1,
	"lender_name" text NOT NULL,
	"servicer_name" text,
	"loan_number" text,
	"loan_type" text NOT NULL,
	"loan_purpose" text,
	"original_loan_amount" numeric(12, 2) NOT NULL,
	"interest_rate" numeric(6, 5) NOT NULL,
	"term_months" integer NOT NULL,
	"start_date" date,
	"maturity_date" date,
	"current_balance" numeric(12, 2) NOT NULL,
	"balance_as_of_date" date,
	"monthly_principal_interest" numeric(10, 2),
	"monthly_escrow" numeric(10, 2) DEFAULT '0',
	"monthly_pmi" numeric(10, 2) DEFAULT '0',
	"monthly_mip" numeric(10, 2) DEFAULT '0',
	"monthly_hoa_collected" numeric(10, 2) DEFAULT '0',
	"total_monthly_payment" numeric(10, 2),
	"extra_principal_monthly" numeric(10, 2) DEFAULT '0',
	"payment_due_day" integer DEFAULT 1,
	"late_fee_amount" numeric(8, 2),
	"late_fee_grace_days" integer DEFAULT 15,
	"is_arm" boolean DEFAULT false,
	"arm_index" text,
	"arm_margin" numeric(5, 4),
	"arm_first_adjustment_date" date,
	"arm_adjustment_period_months" integer,
	"arm_rate_cap_initial" numeric(5, 4),
	"arm_rate_cap_periodic" numeric(5, 4),
	"arm_rate_cap_lifetime" numeric(5, 4),
	"arm_rate_floor" numeric(5, 4),
	"is_interest_only" boolean DEFAULT false,
	"interest_only_end_date" date,
	"has_balloon" boolean DEFAULT false,
	"balloon_date" date,
	"balloon_amount" numeric(12, 2),
	"has_prepayment_penalty" boolean DEFAULT false,
	"prepayment_penalty_type" text,
	"prepayment_penalty_percent" numeric(5, 4),
	"prepayment_penalty_months" integer,
	"prepayment_penalty_end_date" date,
	"allows_recast" boolean,
	"recast_fee" numeric(8, 2),
	"recast_minimum" numeric(10, 2),
	"refinanced_from_id" uuid,
	"refinance_date" date,
	"refinance_closing_costs" numeric(10, 2),
	"refinance_cash_out" numeric(12, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"region" text,
	"investment_profile" text,
	"avg_cap_rate" numeric(5, 2),
	"median_price" numeric(12, 2),
	"rent_to_price_ratio" numeric(5, 4),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"added_by" uuid NOT NULL,
	"status" "property_status" DEFAULT 'draft' NOT NULL,
	"ownership_status" "ownership_status",
	"address" text NOT NULL,
	"unit" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"county" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"mapbox_place_id" text,
	"full_address" text,
	"mapbox_data" text,
	"rentcast_data" text,
	"rentcast_fetched_at" timestamp,
	"nickname" text,
	"notes" text,
	"color_tag" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_acquisition" (
	"property_id" uuid PRIMARY KEY NOT NULL,
	"purchase_price" numeric(12, 2),
	"purchase_date" date,
	"acquisition_method" text,
	"closing_costs_total" numeric(10, 2),
	"closing_costs_breakdown" text,
	"down_payment_amount" numeric(12, 2),
	"down_payment_source" text,
	"earnest_money" numeric(10, 2),
	"seller_credits" numeric(10, 2),
	"buyer_agent_commission" numeric(10, 2),
	"is_brrrr" boolean DEFAULT false,
	"arv_at_purchase" numeric(12, 2),
	"rehab_budget" numeric(10, 2),
	"depreciation_basis" numeric(12, 2),
	"land_value" numeric(12, 2),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_characteristics" (
	"property_id" uuid PRIMARY KEY NOT NULL,
	"property_type" text NOT NULL,
	"unit_count" integer DEFAULT 1,
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"square_feet" integer,
	"lot_size_sqft" integer,
	"stories" integer,
	"year_built" integer,
	"parking_type" text,
	"parking_spaces" integer,
	"has_pool" boolean DEFAULT false,
	"has_hoa" boolean DEFAULT false,
	"construction_type" text,
	"roof_type" text,
	"heating_type" text,
	"cooling_type" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"table_name" text DEFAULT 'properties' NOT NULL,
	"field_name" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"change_source" text NOT NULL,
	"change_reason" text,
	"changed_by" uuid,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_operating_expenses" (
	"property_id" uuid PRIMARY KEY NOT NULL,
	"vacancy_rate" numeric(5, 4) DEFAULT '0.05',
	"management_rate" numeric(5, 4) DEFAULT '0.10',
	"maintenance_rate" numeric(5, 4) DEFAULT '0.05',
	"capex_rate" numeric(5, 4) DEFAULT '0.05',
	"property_tax_annual" numeric(10, 2),
	"insurance_annual" numeric(10, 2),
	"hoa_monthly" numeric(10, 2) DEFAULT '0',
	"hoa_special_assessment" numeric(10, 2),
	"hoa_special_assessment_date" date,
	"water_sewer_monthly" numeric(10, 2) DEFAULT '0',
	"trash_monthly" numeric(10, 2) DEFAULT '0',
	"electric_monthly" numeric(10, 2) DEFAULT '0',
	"gas_monthly" numeric(10, 2) DEFAULT '0',
	"internet_monthly" numeric(10, 2) DEFAULT '0',
	"management_flat_fee" numeric(10, 2),
	"lawn_care_monthly" numeric(10, 2) DEFAULT '0',
	"snow_removal_monthly" numeric(10, 2) DEFAULT '0',
	"pest_control_monthly" numeric(10, 2) DEFAULT '0',
	"pool_maintenance_monthly" numeric(10, 2) DEFAULT '0',
	"alarm_monitoring_monthly" numeric(10, 2) DEFAULT '0',
	"other_expenses_monthly" numeric(10, 2) DEFAULT '0',
	"other_expenses_description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_rental_income" (
	"property_id" uuid PRIMARY KEY NOT NULL,
	"monthly_rent" numeric(10, 2),
	"rent_source" text,
	"market_rent_estimate" numeric(10, 2),
	"rent_last_increased_date" date,
	"rent_last_increased_amount" numeric(10, 2),
	"other_income_monthly" numeric(10, 2) DEFAULT '0',
	"parking_income_monthly" numeric(10, 2) DEFAULT '0',
	"laundry_income_monthly" numeric(10, 2) DEFAULT '0',
	"pet_rent_monthly" numeric(10, 2) DEFAULT '0',
	"storage_income_monthly" numeric(10, 2) DEFAULT '0',
	"utility_reimbursement_monthly" numeric(10, 2) DEFAULT '0',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_valuation" (
	"property_id" uuid PRIMARY KEY NOT NULL,
	"current_value" numeric(12, 2),
	"current_value_source" text,
	"current_value_date" date,
	"tax_assessed_value" numeric(12, 2),
	"tax_assessed_year" integer,
	"last_appraisal_value" numeric(12, 2),
	"last_appraisal_date" date,
	"insurance_replacement_value" numeric(12, 2),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"role" "portfolio_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_portfolio_unique" UNIQUE("user_id","portfolio_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"name" text,
	"clerk_id" text NOT NULL,
	"onboarding_step" text,
	"onboarding_completed" timestamp,
	"onboarding_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "loan_history" ADD CONSTRAINT "loan_history_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_refinanced_from_id_loans_id_fk" FOREIGN KEY ("refinanced_from_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_acquisition" ADD CONSTRAINT "property_acquisition_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_characteristics" ADD CONSTRAINT "property_characteristics_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_history" ADD CONSTRAINT "property_history_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_history" ADD CONSTRAINT "property_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_operating_expenses" ADD CONSTRAINT "property_operating_expenses_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_rental_income" ADD CONSTRAINT "property_rental_income_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_valuation" ADD CONSTRAINT "property_valuation_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_markets" ADD CONSTRAINT "user_markets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_markets" ADD CONSTRAINT "user_markets_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_portfolios" ADD CONSTRAINT "user_portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_portfolios" ADD CONSTRAINT "user_portfolios_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;