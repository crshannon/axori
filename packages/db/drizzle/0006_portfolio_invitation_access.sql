-- Migration: Add invitation and property access fields to user_portfolios table
-- AXO-97: Extend userPortfolios table for role-based access control
--
-- New columns:
--   - invited_by: UUID reference to the user who sent the invitation
--   - invited_at: Timestamp when the invitation was sent
--   - accepted_at: Timestamp when the invitation was accepted
--   - property_access: JSONB for property-level access restrictions
--
-- Backward compatibility:
--   - All new columns are nullable to support existing data
--   - Existing records will have NULL for invitation fields (assumed to be owners or original members)
--   - NULL property_access means full access based on role

-- Add invitation tracking columns
ALTER TABLE "user_portfolios"
  ADD COLUMN IF NOT EXISTS "invited_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "invited_at" timestamp,
  ADD COLUMN IF NOT EXISTS "accepted_at" timestamp;

-- Add property-level access restrictions (JSONB)
-- Example structure: { "property-uuid": ["view", "edit", "manage", "delete"] }
-- NULL means full access to all properties based on role
ALTER TABLE "user_portfolios"
  ADD COLUMN IF NOT EXISTS "property_access" jsonb;

-- Add indexes for efficient permission lookups
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_user_id" ON "user_portfolios" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_portfolio_id" ON "user_portfolios" ("portfolio_id");
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_role" ON "user_portfolios" ("role");
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_invited_by" ON "user_portfolios" ("invited_by");

-- Note: The constraint "portfolio owner cannot be removed/downgraded" is enforced
-- at the application level via API validation, as PostgreSQL CHECK constraints
-- cannot reference other tables for this type of complex business logic.
-- See apps/api/src/routes/portfolios.ts for the enforcement implementation.
