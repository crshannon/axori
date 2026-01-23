-- Migration: Backfill user_portfolios entries for existing portfolio creators
-- This ensures that users who created portfolios before the permission system
-- have proper access to their portfolios.
--
-- For each portfolio with a created_by user:
--   - If the user doesn't have a user_portfolios entry, create one with role "owner"
--   - This grants full access to all properties in the portfolio (propertyAccess = null)

-- Insert user_portfolios entries for portfolio creators who don't have them
INSERT INTO "user_portfolios" (
  "id",
  "user_id",
  "portfolio_id",
  "role",
  "property_access",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid() as "id",
  p."created_by" as "user_id",
  p."id" as "portfolio_id",
  'owner'::portfolio_role as "role",
  NULL as "property_access", -- NULL means full access to all properties
  COALESCE(p."created_at", NOW()) as "created_at",
  COALESCE(p."updated_at", NOW()) as "updated_at"
FROM "portfolios" p
WHERE
  p."created_by" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "user_portfolios" up
    WHERE
      up."user_id" = p."created_by"
      AND up."portfolio_id" = p."id"
  )
ON CONFLICT ON CONSTRAINT "user_portfolio_unique" DO NOTHING;

-- Log the number of entries created (for verification)
-- This will be visible in migration logs
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % user_portfolios entries for portfolio creators', inserted_count;
END $$;
