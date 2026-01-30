CREATE SCHEMA IF NOT EXISTS "forge";
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."account_request_status" AS ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."account_request_type" AS ENUM('delete_account', 'purge_data'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."bank_account_type" AS ENUM('checking', 'savings', 'money_market', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."data_export_format" AS ENUM('json', 'csv'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."data_export_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."depreciation_class" AS ENUM('5_year', '7_year', '15_year', '27_5_year', '39_year'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."depreciation_type" AS ENUM('residential', 'commercial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."document_processing_status" AS ENUM('pending', 'processing', 'completed', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."document_type" AS ENUM('lease', 'tax_bill', 'insurance_policy', 'insurance_claim', 'closing_disclosure', 'deed', 'title_policy', 'appraisal', 'inspection', 'mortgage_statement', 'hoa_statement', 'utility_bill', 'receipt', 'contractor_invoice', 'permit', 'year_end_report', 'rent_roll', '1099', 'w9', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."email_capture_status" AS ENUM('pending', 'notified', 'converted', 'unsubscribed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."invitation_token_status" AS ENUM('pending', 'accepted', 'expired', 'revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."permission_audit_action" AS ENUM('role_change', 'invitation_sent', 'invitation_accepted', 'access_revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."plan_interval" AS ENUM('month', 'year'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."theme_preference" AS ENUM('light', 'dark', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."transaction_category" AS ENUM('rent', 'parking', 'laundry', 'pet_rent', 'storage', 'utility_reimbursement', 'late_fees', 'application_fees', 'acquisition', 'property_tax', 'insurance', 'hoa', 'management', 'repairs', 'maintenance', 'capex', 'utilities', 'legal', 'accounting', 'marketing', 'travel', 'office', 'bank_fees', 'licenses', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."transaction_review_status" AS ENUM('pending', 'approved', 'flagged', 'excluded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'capital'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."agent_protocol" AS ENUM('opus_full_feature', 'opus_architecture', 'opus_planning', 'sonnet_implementation', 'sonnet_bug_fix', 'sonnet_tests', 'haiku_quick_edit', 'haiku_docs'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."comment_author_type" AS ENUM('user', 'agent', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."decision_category" AS ENUM('code_standards', 'architecture', 'testing', 'design', 'process', 'tooling', 'product', 'performance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."deployment_environment" AS ENUM('preview', 'staging', 'production'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."deployment_status" AS ENUM('pending', 'building', 'deployed', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."execution_status" AS ENUM('pending', 'running', 'completed', 'failed', 'paused'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."lock_type" AS ENUM('exclusive', 'shared'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."milestone_status" AS ENUM('active', 'completed', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."persona_archetype" AS ENUM('explorer', 'starting', 'building', 'optimizing'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."reference_type" AS ENUM('design', 'inspiration', 'screenshot', 'figma', 'ai_studio', 'chrome_capture'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."registry_status" AS ENUM('active', 'deprecated', 'planned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."registry_type" AS ENUM('component', 'hook', 'utility', 'api', 'table', 'integration'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."release_classification" AS ENUM('feature', 'enhancement', 'breaking_change', 'bug_fix', 'chore', 'docs'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."ticket_phase" AS ENUM('ideation', 'design', 'planning', 'implementation', 'testing', 'deployment', 'documentation'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."ticket_priority" AS ENUM('critical', 'high', 'medium', 'low'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."ticket_status" AS ENUM('backlog', 'design', 'planned', 'in_progress', 'in_review', 'testing', 'done', 'blocked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."ticket_type" AS ENUM('feature', 'bug', 'chore', 'refactor', 'docs', 'spike', 'design'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "forge"."trend" AS ENUM('improving', 'declining', 'stable'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account_deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"request_type" "account_request_type" NOT NULL,
	"status" "account_request_status" DEFAULT 'pending' NOT NULL,
	"confirmation_token" text,
	"token_expires_at" timestamp,
	"confirmed_at" timestamp,
	"grace_period_ends_at" timestamp,
	"processed_at" timestamp,
	"processed_by" text,
	"reason" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_deletion_requests_confirmation_token_unique" UNIQUE("confirmation_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "annual_depreciation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"regular_depreciation" numeric(10, 2) NOT NULL,
	"bonus_depreciation" numeric(12, 2) DEFAULT '0',
	"improvement_depreciation" numeric(10, 2) DEFAULT '0',
	"total_depreciation" numeric(12, 2) NOT NULL,
	"months_depreciated" integer DEFAULT 12 NOT NULL,
	"verified_by_cpa" boolean DEFAULT false,
	"verified_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cost_segregation_studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"study_date" date NOT NULL,
	"study_provider" text,
	"study_cost" numeric(10, 2),
	"original_basis" numeric(12, 2) NOT NULL,
	"amount_5_year" numeric(10, 2) DEFAULT '0',
	"amount_7_year" numeric(10, 2) DEFAULT '0',
	"amount_15_year" numeric(10, 2) DEFAULT '0',
	"amount_remaining" numeric(12, 2) NOT NULL,
	"bonus_depreciation_percent" numeric(5, 4) DEFAULT '0',
	"bonus_depreciation_amount" numeric(12, 2) DEFAULT '0',
	"tax_year_applied" integer,
	"document_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_export_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"format" "data_export_format" DEFAULT 'json' NOT NULL,
	"status" "data_export_status" DEFAULT 'pending' NOT NULL,
	"download_url" text,
	"download_expires_at" timestamp,
	"file_size" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_captures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"source" text DEFAULT 'homepage',
	"campaign" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"status" "email_capture_status" DEFAULT 'pending' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"referrer" text,
	"converted_user_id" uuid,
	"converted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_captures_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitation_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "portfolio_role" DEFAULT 'member' NOT NULL,
	"property_access" jsonb,
	"status" "invitation_token_status" DEFAULT 'pending' NOT NULL,
	"invited_by" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permission_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"portfolio_id" uuid NOT NULL,
	"action" "permission_audit_action" NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_by" uuid,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_price_id" text NOT NULL,
	"stripe_product_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd',
	"interval" "plan_interval" DEFAULT 'month' NOT NULL,
	"features" jsonb,
	"property_limit" integer,
	"team_member_limit" integer,
	"is_active" boolean DEFAULT true,
	"is_popular" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_stripe_price_id_unique" UNIQUE("stripe_price_id"),
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"plaid_account_id" text,
	"plaid_access_token" text,
	"plaid_item_id" text,
	"account_name" text NOT NULL,
	"account_type" "bank_account_type",
	"institution_name" text,
	"mask" text,
	"current_balance" numeric(12, 2),
	"available_balance" numeric(12, 2),
	"last_synced" timestamp,
	"maintenance_target" numeric(10, 2) DEFAULT '0',
	"capex_target" numeric(10, 2) DEFAULT '0',
	"life_support_target" numeric(10, 2) DEFAULT '0',
	"life_support_months" integer,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_depreciation" (
	"property_id" uuid PRIMARY KEY NOT NULL,
	"depreciation_type" "depreciation_type" DEFAULT 'residential' NOT NULL,
	"placed_in_service_date" date,
	"purchase_price" numeric(12, 2),
	"closing_costs" numeric(10, 2) DEFAULT '0',
	"initial_improvements" numeric(10, 2) DEFAULT '0',
	"land_value" numeric(12, 2),
	"land_value_source" text,
	"land_value_ratio" numeric(5, 4),
	"marginal_tax_rate" numeric(5, 4) DEFAULT '0.24',
	"accumulated_depreciation" numeric(12, 2) DEFAULT '0',
	"last_depreciation_year" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"document_type" "document_type" NOT NULL,
	"document_year" integer,
	"processing_status" "document_processing_status" DEFAULT 'pending',
	"ai_processed_at" timestamp,
	"ai_extracted_data" jsonb,
	"ai_confidence" numeric(4, 3),
	"ai_error" text,
	"ai_applied_data" jsonb,
	"ai_applied_at" timestamp,
	"description" text,
	"tags" text[],
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_improvements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"completed_date" date NOT NULL,
	"placed_in_service_date" date,
	"depreciation_class" "depreciation_class" DEFAULT '27_5_year',
	"accumulated_depreciation" numeric(10, 2) DEFAULT '0',
	"document_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"transaction_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"category" "transaction_category" NOT NULL,
	"subcategory" text,
	"vendor" text,
	"payer" text,
	"description" text,
	"is_recurring" boolean DEFAULT false,
	"recurrence_frequency" "recurrence_frequency",
	"recurrence_end_date" date,
	"is_tax_deductible" boolean DEFAULT true,
	"tax_category" text,
	"document_id" uuid,
	"source" "expense_source" DEFAULT 'manual',
	"external_id" text,
	"notes" text,
	"review_status" "transaction_review_status" DEFAULT 'pending',
	"is_excluded" boolean DEFAULT false,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"plan_name" text,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp,
	"cancellation_reason" text,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" "theme_preference" DEFAULT 'system',
	"email_notifications" boolean DEFAULT true,
	"marketing_emails" boolean DEFAULT false,
	"security_alerts" boolean DEFAULT true,
	"product_updates" boolean DEFAULT true,
	"default_portfolio_id" uuid,
	"timezone" text DEFAULT 'America/New_York',
	"locale" text DEFAULT 'en-US',
	"currency" text DEFAULT 'USD',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."agent_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"protocol" "forge"."agent_protocol" NOT NULL,
	"status" "forge"."execution_status" DEFAULT 'pending' NOT NULL,
	"prompt" text NOT NULL,
	"plan_output" text,
	"execution_log" text,
	"checkpoint_data" jsonb,
	"checkpoint_step" integer,
	"branch_created" text,
	"files_changed" text[],
	"pr_url" text,
	"tokens_used" integer,
	"cost_cents" integer,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."decision_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"was_compliant" boolean NOT NULL,
	"override_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"decision" text NOT NULL,
	"context" text,
	"category" "forge"."decision_category" NOT NULL,
	"scope" text[],
	"active" boolean DEFAULT true,
	"supersedes" uuid,
	"created_from_ticket" text,
	"compliance_rate" numeric(5, 2),
	"times_applied" integer DEFAULT 0,
	"times_overridden" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "decisions_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environment" "forge"."deployment_environment" NOT NULL,
	"release_tag" text,
	"ticket_id" uuid,
	"preview_url" text,
	"status" "forge"."deployment_status" NOT NULL,
	"triggered_by" text,
	"duration_ms" integer,
	"rollback_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."file_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_path" text NOT NULL,
	"locked_by_ticket_id" uuid NOT NULL,
	"locked_at" timestamp DEFAULT now() NOT NULL,
	"expected_release" timestamp,
	"lock_type" "forge"."lock_type" DEFAULT 'exclusive',
	CONSTRAINT "unique_forge_file_lock" UNIQUE("file_path","lock_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"target_date" date,
	"status" "forge"."milestone_status" DEFAULT 'active',
	"progress_percent" integer DEFAULT 0,
	"color" text DEFAULT '#6366f1',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1',
	"icon" text DEFAULT 'folder',
	"milestone_id" uuid,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"type" "forge"."reference_type" NOT NULL,
	"url" text,
	"title" text,
	"description" text,
	"thumbnail_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "forge"."registry_type" NOT NULL,
	"name" text NOT NULL,
	"file_path" text NOT NULL,
	"description" text,
	"status" "forge"."registry_status" DEFAULT 'active',
	"exports" text[],
	"dependencies" text[],
	"used_by" text[],
	"tags" text[],
	"deprecated_by" uuid,
	"deprecation_notes" text,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"related_tickets" text[],
	CONSTRAINT "unique_forge_registry" UNIQUE("type","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."releases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag" text NOT NULL,
	"name" text,
	"body" text,
	"tickets_included" text[],
	"breaking_changes" text[],
	"is_rollback" boolean DEFAULT false,
	"rollback_of" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "releases_tag_unique" UNIQUE("tag")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"branch_name" text,
	"pr_number" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."success_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_name" text NOT NULL,
	"current_value" numeric(10, 2),
	"baseline_value" numeric(10, 2),
	"target_value" numeric(10, 2),
	"trend" "forge"."trend",
	"last_calculated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_forge_metric" UNIQUE("metric_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."test_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"archetype" "forge"."persona_archetype" NOT NULL,
	"description" text,
	"data_completeness" integer,
	"config" jsonb NOT NULL,
	"edge_cases" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_personas_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."ticket_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"content" text NOT NULL,
	"author_type" "forge"."comment_author_type" NOT NULL,
	"author_name" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "forge"."ticket_status" DEFAULT 'backlog',
	"priority" "forge"."ticket_priority" DEFAULT 'medium',
	"type" "forge"."ticket_type" DEFAULT 'feature',
	"phase" "forge"."ticket_phase" DEFAULT 'planning',
	"release_classification" "forge"."release_classification" DEFAULT 'feature',
	"parent_id" uuid,
	"project_id" uuid,
	"milestone_id" uuid,
	"status_order" integer DEFAULT 0,
	"estimate" integer,
	"current_phase" "forge"."ticket_phase" DEFAULT 'planning',
	"assigned_agent" "forge"."agent_protocol",
	"agent_session_id" uuid,
	"branch_name" text,
	"preview_url" text,
	"pr_number" integer,
	"pr_url" text,
	"is_breaking_change" boolean DEFAULT false,
	"migration_notes" text,
	"blocks_deploy" boolean DEFAULT false,
	"labels" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	CONSTRAINT "tickets_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."token_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"daily_limit_tokens" integer DEFAULT 500000,
	"daily_limit_cents" integer DEFAULT 500,
	"used_tokens" integer DEFAULT 0,
	"used_cents" integer DEFAULT 0,
	"autopilot_limit_tokens" integer DEFAULT 100000,
	"autopilot_used_tokens" integer DEFAULT 0,
	CONSTRAINT "token_budgets_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forge"."token_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" uuid,
	"model" text NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"cost_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_expenses') THEN
    ALTER TABLE "property_expenses" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "property_expenses" CASCADE;
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "has_escrow" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "property_rental_income" ADD COLUMN "lease_start_date" date;--> statement-breakpoint
ALTER TABLE "property_rental_income" ADD COLUMN "lease_end_date" date;--> statement-breakpoint
ALTER TABLE "user_portfolios" ADD COLUMN "invited_by" uuid;--> statement-breakpoint
ALTER TABLE "user_portfolios" ADD COLUMN "invited_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_portfolios" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_portfolios" ADD COLUMN "property_access" jsonb;--> statement-breakpoint
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annual_depreciation_records" ADD CONSTRAINT "annual_depreciation_records_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_segregation_studies" ADD CONSTRAINT "cost_segregation_studies_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_captures" ADD CONSTRAINT "email_captures_converted_user_id_users_id_fk" FOREIGN KEY ("converted_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_tokens" ADD CONSTRAINT "invitation_tokens_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_tokens" ADD CONSTRAINT "invitation_tokens_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_tokens" ADD CONSTRAINT "invitation_tokens_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_audit_log" ADD CONSTRAINT "permission_audit_log_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_bank_accounts" ADD CONSTRAINT "property_bank_accounts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_bank_accounts" ADD CONSTRAINT "property_bank_accounts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_depreciation" ADD CONSTRAINT "property_depreciation_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_improvements" ADD CONSTRAINT "property_improvements_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_transactions" ADD CONSTRAINT "property_transactions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_transactions" ADD CONSTRAINT "property_transactions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_transactions" ADD CONSTRAINT "property_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_default_portfolio_id_portfolios_id_fk" FOREIGN KEY ("default_portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."agent_executions" ADD CONSTRAINT "agent_executions_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "forge"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."decision_applications" ADD CONSTRAINT "decision_applications_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "forge"."decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."decision_applications" ADD CONSTRAINT "decision_applications_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "forge"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."deployments" ADD CONSTRAINT "deployments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "forge"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."file_locks" ADD CONSTRAINT "file_locks_locked_by_ticket_id_tickets_id_fk" FOREIGN KEY ("locked_by_ticket_id") REFERENCES "forge"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."projects" ADD CONSTRAINT "projects_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "forge"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."references" ADD CONSTRAINT "references_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "forge"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."subtasks" ADD CONSTRAINT "subtasks_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "forge"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "forge"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."tickets" ADD CONSTRAINT "tickets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "forge"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."tickets" ADD CONSTRAINT "tickets_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "forge"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forge"."token_usage" ADD CONSTRAINT "token_usage_execution_id_agent_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "forge"."agent_executions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_account_deletion_requests_user_id" ON "account_deletion_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_account_deletion_requests_status" ON "account_deletion_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_account_deletion_requests_token" ON "account_deletion_requests" USING btree ("confirmation_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_annual_depreciation_property_year" ON "annual_depreciation_records" USING btree ("property_id","tax_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cost_seg_studies_property_id" ON "cost_segregation_studies" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_export_requests_user_id" ON "data_export_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_export_requests_status" ON "data_export_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_captures_email" ON "email_captures" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_captures_status" ON "email_captures" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_captures_source" ON "email_captures" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_email_captures_created_at" ON "email_captures" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_token" ON "invitation_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_portfolio_id" ON "invitation_tokens" USING btree ("portfolio_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_email" ON "invitation_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_status" ON "invitation_tokens" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_expires_at" ON "invitation_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_permission_audit_log_user_id" ON "permission_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_permission_audit_log_portfolio_id" ON "permission_audit_log" USING btree ("portfolio_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_permission_audit_log_action" ON "permission_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_permission_audit_log_changed_by" ON "permission_audit_log" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_permission_audit_log_changed_at" ON "permission_audit_log" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_plans_slug" ON "plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_plans_active" ON "plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_bank_accounts_property_id" ON "property_bank_accounts" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_bank_accounts_plaid_account_id" ON "property_bank_accounts" USING btree ("plaid_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_documents_property_id" ON "property_documents" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_documents_type" ON "property_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_documents_year" ON "property_documents" USING btree ("document_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_documents_processing_status" ON "property_documents" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_improvements_property_id" ON "property_improvements" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_transactions_property_id" ON "property_transactions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_transactions_date" ON "property_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_transactions_type" ON "property_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_transactions_category" ON "property_transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_property_transactions_status" ON "property_transactions" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_customer_id" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_executions_ticket" ON "forge"."agent_executions" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_executions_status" ON "forge"."agent_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_decisions_category" ON "forge"."decisions" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_decisions_active" ON "forge"."decisions" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_file_locks_path" ON "forge"."file_locks" USING btree ("file_path");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_registry_type" ON "forge"."registry" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_tickets_status" ON "forge"."tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_tickets_parent" ON "forge"."tickets" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_tickets_milestone" ON "forge"."tickets" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_tickets_identifier" ON "forge"."tickets" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_forge_token_usage_date" ON "forge"."token_usage" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "user_portfolios" ADD CONSTRAINT "user_portfolios_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_user_id" ON "user_portfolios" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_portfolio_id" ON "user_portfolios" USING btree ("portfolio_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_role" ON "user_portfolios" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_invited_by" ON "user_portfolios" USING btree ("invited_by");
