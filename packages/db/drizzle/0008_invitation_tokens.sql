-- Migration: Create invitation_tokens table for secure portfolio invitations
-- AXO-111: Implement invitation token generation and validation
--
-- This table stores secure, single-use tokens for inviting users to portfolios.
-- Features:
--   - Cryptographically secure tokens
--   - Time-limited (7 days default)
--   - Single-use (marked as used once accepted)
--   - Tracks invitation metadata (who invited, when, role, etc.)
--
-- Security considerations:
--   - Tokens are unique and indexed for fast lookups
--   - Expired/used tokens cannot be reused
--   - Status tracking for audit purposes

-- Create invitation token status enum
DO $$ BEGIN
  CREATE TYPE "invitation_token_status" AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create invitation_tokens table
CREATE TABLE IF NOT EXISTS "invitation_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- The secure token (URL-safe, cryptographically random)
  "token" text NOT NULL UNIQUE,
  
  -- Portfolio being invited to
  "portfolio_id" uuid NOT NULL REFERENCES "portfolios"("id") ON DELETE CASCADE,
  
  -- Invitee details
  "email" text NOT NULL,
  "role" "portfolio_role" NOT NULL DEFAULT 'member',
  
  -- Optional property-level access restrictions (JSONB)
  "property_access" jsonb,
  
  -- Token status
  "status" "invitation_token_status" NOT NULL DEFAULT 'pending',
  
  -- Invitation metadata
  "invited_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE SET NULL,
  
  -- Timestamps
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "used_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_token" ON "invitation_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_portfolio_id" ON "invitation_tokens" ("portfolio_id");
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_email" ON "invitation_tokens" ("email");
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_status" ON "invitation_tokens" ("status");
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_expires_at" ON "invitation_tokens" ("expires_at");

-- Add comment for documentation
COMMENT ON TABLE "invitation_tokens" IS 'Stores secure, single-use tokens for portfolio invitations. Tokens expire after 7 days and can only be used once.';
COMMENT ON COLUMN "invitation_tokens"."token" IS 'URL-safe, cryptographically random token for secure invitation links';
COMMENT ON COLUMN "invitation_tokens"."status" IS 'pending=not used, accepted=used to join, expired=time limit exceeded, revoked=manually cancelled';
COMMENT ON COLUMN "invitation_tokens"."property_access" IS 'Optional JSON object mapping property IDs to permission arrays. NULL means full access based on role.';
