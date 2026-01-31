-- Foundry System Migration
-- Adds foundries and features tables, extends milestones and projects

-- Create foundries table (business area groupings)
CREATE TABLE IF NOT EXISTS "forge"."foundries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "color" text DEFAULT '#f59e0b',
  "icon" text DEFAULT 'briefcase',
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create features table (long-lived capabilities within a Foundry)
CREATE TABLE IF NOT EXISTS "forge"."features" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "identifier" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "foundry_id" uuid REFERENCES "forge"."foundries"("id"),
  "color" text,
  "icon" text,
  "status" text DEFAULT 'active',
  "owner" text,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add indexes for features table
CREATE INDEX IF NOT EXISTS "idx_forge_features_foundry" ON "forge"."features" ("foundry_id");
CREATE INDEX IF NOT EXISTS "idx_forge_features_identifier" ON "forge"."features" ("identifier");

-- Extend milestones table with version and isActive
ALTER TABLE "forge"."milestones" ADD COLUMN IF NOT EXISTS "version" text;
ALTER TABLE "forge"."milestones" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT false;

-- Extend projects table with featureId
ALTER TABLE "forge"."projects" ADD COLUMN IF NOT EXISTS "feature_id" uuid REFERENCES "forge"."features"("id");
