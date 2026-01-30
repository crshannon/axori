-- Migration: Create email_captures table for waitlist/coming soon signups
--
-- This table stores email signups from the waitlist/coming soon page.
-- Features:
--   - Tracks email, name, and UTM parameters
--   - Status tracking (pending, notified, converted, unsubscribed)
--   - Conversion tracking when signup becomes a full user
--   - Request metadata (IP, user agent, referrer)

-- Create email capture status enum
DO $$ BEGIN
  CREATE TYPE "email_capture_status" AS ENUM ('pending', 'notified', 'converted', 'unsubscribed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create email_captures table
CREATE TABLE IF NOT EXISTS "email_captures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact info
  "email" text NOT NULL UNIQUE,
  "first_name" text NOT NULL,
  "last_name" text,

  -- Capture source and campaign tracking
  "source" text DEFAULT 'homepage',
  "campaign" text,

  -- UTM tracking
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "utm_content" text,
  "utm_term" text,

  -- Status
  "status" "email_capture_status" NOT NULL DEFAULT 'pending',

  -- Request metadata
  "ip_address" text,
  "user_agent" text,
  "referrer" text,

  -- Conversion tracking (when they become a real user)
  "converted_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "converted_at" timestamp,

  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS "idx_email_captures_email" ON "email_captures" ("email");
CREATE INDEX IF NOT EXISTS "idx_email_captures_status" ON "email_captures" ("status");
CREATE INDEX IF NOT EXISTS "idx_email_captures_source" ON "email_captures" ("source");
CREATE INDEX IF NOT EXISTS "idx_email_captures_created_at" ON "email_captures" ("created_at");

-- Add comments for documentation
COMMENT ON TABLE "email_captures" IS 'Stores email signups from waitlist/coming soon page. Tracks UTM parameters and conversion status.';
COMMENT ON COLUMN "email_captures"."status" IS 'pending=just captured, notified=email sent, converted=signed up as user, unsubscribed=opted out';
COMMENT ON COLUMN "email_captures"."converted_user_id" IS 'Links to users table when email capture converts to a full user account';
