/**
 * Apply Missing Migrations
 * 
 * Manually applies migrations 0006 and 0007 to ensure the database is up to date.
 * This is a workaround when drizzle-kit migrate isn't tracking migrations correctly.
 */

import postgres from "postgres";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
config({ path: [".env.local", ".env", "../.env.local", "../../.env.local"] });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

async function applyMigrations() {
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log("🔄 Applying missing migrations...\n");

    // Read migration files
    const migration6 = readFileSync(
      join(process.cwd(), "drizzle", "0006_portfolio_invitation_access.sql"),
      "utf-8"
    );
    const migration7 = readFileSync(
      join(process.cwd(), "drizzle", "0007_backfill_portfolio_owners.sql"),
      "utf-8"
    );
    const migration8 = readFileSync(
      join(process.cwd(), "drizzle", "0008_invitation_tokens.sql"),
      "utf-8"
    );

    console.log("📋 Applying migration 0006_portfolio_invitation_access.sql...");
    await sql.unsafe(migration6);
    console.log("✅ Migration 0006 applied\n");

    console.log("📋 Applying migration 0007_backfill_portfolio_owners.sql...");
    await sql.unsafe(migration7);
    console.log("✅ Migration 0007 applied\n");

    console.log("📋 Applying migration 0008_invitation_tokens.sql...");
    await sql.unsafe(migration8);
    console.log("✅ Migration 0008 applied\n");

    console.log("✅ All migrations applied successfully!");
  } catch (error) {
    console.error("❌ Error applying migrations:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMigrations()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
