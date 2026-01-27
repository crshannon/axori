/**
 * Migration: Add property_bank_accounts table
 * Run with: npx tsx src/migrations/add-bank-accounts.ts
 */
import { db } from "../client";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Creating property_bank_accounts table...");

  try {
    // Create enum type if it doesn't exist
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE bank_account_type AS ENUM ('checking', 'savings', 'money_market', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ Enum bank_account_type created or already exists");

    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS property_bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

        -- Plaid connection (optional)
        plaid_account_id TEXT,
        plaid_access_token TEXT,
        plaid_item_id TEXT,

        -- Account details
        account_name TEXT NOT NULL,
        account_type bank_account_type,
        institution_name TEXT,
        mask TEXT,

        -- Balance
        current_balance NUMERIC(12, 2),
        available_balance NUMERIC(12, 2),
        last_synced TIMESTAMP,

        -- Allocation targets
        maintenance_target NUMERIC(10, 2) DEFAULT '0',
        capex_target NUMERIC(10, 2) DEFAULT '0',
        life_support_target NUMERIC(10, 2) DEFAULT '0',
        life_support_months INTEGER,

        -- Metadata
        is_primary BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ Table property_bank_accounts created");

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_property_bank_accounts_property_id
      ON property_bank_accounts(property_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_property_bank_accounts_plaid_account_id
      ON property_bank_accounts(plaid_account_id);
    `);
    console.log("✓ Indexes created");

    // Verify
    const result = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'property_bank_accounts'
      ORDER BY ordinal_position;
    `);
    console.log("✓ Table verified, columns:", (result as unknown as { rows?: unknown[] }).rows?.length || 0);

  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  }
}

migrate();
