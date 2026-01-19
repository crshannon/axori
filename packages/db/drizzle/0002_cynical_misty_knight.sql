CREATE TYPE "public"."expense_category" AS ENUM('acquisition', 'property_tax', 'insurance', 'hoa', 'management', 'repairs', 'maintenance', 'capex', 'utilities', 'legal', 'accounting', 'marketing', 'travel', 'office', 'bank_fees', 'licenses', 'other');--> statement-breakpoint
CREATE TYPE "public"."expense_source" AS ENUM('manual', 'appfolio', 'plaid', 'document_ai');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('active', 'paid_off', 'refinanced', 'defaulted', 'sold');--> statement-breakpoint
CREATE TYPE "public"."loan_type" AS ENUM('conventional', 'fha', 'va', 'usda', 'dscr', 'portfolio', 'hard_money', 'bridge', 'heloc', 'construction', 'owner_financed', 'seller_finance', 'commercial', 'other');--> statement-breakpoint
CREATE TYPE "public"."recurrence_frequency" AS ENUM('monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TABLE "property_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"expense_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"category" "expense_category" NOT NULL,
	"subcategory" text,
	"vendor" text,
	"description" text,
	"is_recurring" boolean DEFAULT false,
	"recurrence_frequency" "recurrence_frequency",
	"recurrence_end_date" date,
	"is_tax_deductible" boolean DEFAULT true,
	"tax_category" text,
	"document_id" uuid,
	"source" "expense_source" DEFAULT 'manual',
	"external_id" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loans" DROP CONSTRAINT "loans_refinanced_from_id_loans_id_fk";
--> statement-breakpoint
-- Drop defaults before altering column types
ALTER TABLE "loans" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "loan_type" DROP DEFAULT;
--> statement-breakpoint
-- Alter column types with USING clause
ALTER TABLE "loans" ALTER COLUMN "status" SET DATA TYPE loan_status USING status::loan_status;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "loan_type" SET DATA TYPE loan_type USING loan_type::loan_type;--> statement-breakpoint
-- Restore defaults
ALTER TABLE "loans" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "loan_type" SET DEFAULT 'conventional';--> statement-breakpoint
ALTER TABLE "property_expenses" ADD CONSTRAINT "property_expenses_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_expenses" ADD CONSTRAINT "property_expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_property_expenses_property_id" ON "property_expenses" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_property_expenses_date" ON "property_expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "idx_property_expenses_category" ON "property_expenses" USING btree ("category");