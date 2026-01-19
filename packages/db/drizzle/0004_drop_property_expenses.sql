-- Migration: Drop old property_expenses table (replaced by property_transactions)
-- This migration safely drops the deprecated property_expenses table

-- Drop the old property_expenses table if it exists
DROP TABLE IF EXISTS "property_expenses" CASCADE;

