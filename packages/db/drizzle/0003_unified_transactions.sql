-- Migration: Create unified property_transactions table and enums
-- This replaces the separate property_expenses table with a unified transaction system

-- Create transaction type enum
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'capital');--> statement-breakpoint

-- Create transaction review status enum
CREATE TYPE "public"."transaction_review_status" AS ENUM('pending', 'approved', 'flagged', 'excluded');--> statement-breakpoint

-- Create unified transaction category enum (combines income and expense categories)
CREATE TYPE "public"."transaction_category" AS ENUM(
  -- Income categories
  'rent',
  'parking',
  'laundry',
  'pet_rent',
  'storage',
  'utility_reimbursement',
  'late_fees',
  'application_fees',
  -- Expense categories
  'acquisition',
  'property_tax',
  'insurance',
  'hoa',
  'management',
  'repairs',
  'maintenance',
  'capex',
  'utilities',
  'legal',
  'accounting',
  'marketing',
  'travel',
  'office',
  'bank_fees',
  'licenses',
  -- Common
  'other'
);--> statement-breakpoint

-- Create property_transactions table
CREATE TABLE "property_transactions" (
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
);--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "property_transactions" ADD CONSTRAINT "property_transactions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_transactions" ADD CONSTRAINT "property_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_transactions" ADD CONSTRAINT "property_transactions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Create indexes
CREATE INDEX "idx_property_transactions_property_id" ON "property_transactions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_property_transactions_date" ON "property_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_property_transactions_type" ON "property_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_property_transactions_category" ON "property_transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_property_transactions_status" ON "property_transactions" USING btree ("review_status");--> statement-breakpoint

-- Drop old property_expenses table if it exists (replaced by property_transactions)
DROP TABLE IF EXISTS "property_expenses";--> statement-breakpoint

