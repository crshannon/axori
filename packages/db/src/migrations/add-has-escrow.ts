/**
 * Migration: Add has_escrow column to loans table
 * Run with: npx tsx src/migrations/add-has-escrow.ts
 */
import { db } from "../client";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Adding has_escrow column to loans table...");

  try {
    // Add has_escrow column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE loans
      ADD COLUMN IF NOT EXISTS has_escrow BOOLEAN DEFAULT false
    `);
    console.log("✓ Column has_escrow added successfully");

    // Verify the column exists
    const result = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'loans' AND column_name = 'has_escrow'
    `);
    console.log("✓ Verification:", (result as unknown as { rows?: unknown[] }).rows);
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  }
}

migrate();
