import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { config } from "dotenv";
import { readdir } from "fs/promises";
import { join } from "path";

// Load environment variables
config({ path: [".env.local", ".env", "../.env.local", "../../.env.local"] });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

/**
 * Get list of migration files from the drizzle folder
 */
async function getMigrationFiles(): Promise<string[]> {
  const drizzlePath = join(process.cwd(), "drizzle");
  const files = await readdir(drizzlePath);
  return files
    .filter((file) => file.endsWith(".sql"))
    .sort(); // Sort to ensure consistent order
}

/**
 * Get list of applied migrations from the database
 */
async function getAppliedMigrations(
  sql: postgres.Sql
): Promise<Array<{ hash: string; created_at: Date }>> {
  try {
    // Check if migrations table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle' 
        AND table_name = '__drizzle_migrations'
      )
    `;

    if (!tableExists[0]?.exists) {
      return [];
    }

    const migrations = await sql`
      SELECT hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at ASC
    `;

    return migrations as unknown as Array<{ hash: string; created_at: Date }>;
  } catch (error) {
    // Table doesn't exist yet, return empty array
    return [];
  }
}

/**
 * Verify that specific database changes were applied
 * This is a safety check for critical migrations
 * 
 * To add new verification checks for future migrations:
 * 1. Add a new check object to the checks array
 * 2. Use SQL queries to verify the expected database state
 * 3. Set expected: true if the check should pass, false if it should fail
 */
async function verifyDatabaseState(sql: postgres.Sql): Promise<boolean> {
  type CheckRow = { exists?: boolean; missing_entries?: number | string; count?: number | string };
  const checks: Array<{ name: string; query: () => Promise<CheckRow[]>; expected: boolean }> = [
    {
      name: "lease_start_date column exists",
      query: async () => [...(await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'property_rental_income' 
          AND column_name = 'lease_start_date'
        )
      `)],
      expected: true,
    },
    {
      name: "lease_end_date column exists",
      query: async () => [...(await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'property_rental_income' 
          AND column_name = 'lease_end_date'
        )
      `)],
      expected: true,
    },
    {
      name: "portfolio creators have user_portfolios entries",
      query: async () => [...(await sql`
        SELECT COUNT(*) as missing_entries
        FROM portfolios p
        WHERE p.created_by IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM user_portfolios up
          WHERE up.user_id = p.created_by
          AND up.portfolio_id = p.id
        )
      `)],
      expected: false, // Expected count should be 0 (no missing entries)
    },
    // Add more verification checks here for future migrations
  ];

  console.log("\n🔍 Verifying database state...");
  let allPassed = true;

  for (const check of checks) {
    try {
      const result = await check.query();
      const row = result[0] as Record<string, unknown>;

      // Route by result shape: count-like (missing_entries, count) vs exists
      const countLikeKey = row && ("missing_entries" in row || "count" in row)
        ? ("missing_entries" in row ? "missing_entries" : "count")
        : null;

      let passed: boolean;
      if (countLikeKey !== null) {
        // Count-style: pass when count is 0 and we expect no missing entries (expected: false)
        const rawValue = row[countLikeKey];
        const count = typeof rawValue === "string" ? parseInt(String(rawValue), 10) : Number(rawValue);
        passed = check.expected === false ? count === 0 : count > 0;
      } else {
        // EXISTS-style
        const exists = row?.exists === check.expected;
        passed = exists;
      }

      if (passed) {
        console.log(`  ✅ ${check.name}`);
      } else {
        console.log(
          `  ❌ ${check.name} - Expected: ${check.expected}, Got: ${JSON.stringify(result[0])}`
        );
        allPassed = false;
      }
    } catch (error) {
      console.log(`  ⚠️  ${check.name} - Error checking: ${error}`);
      // Don't fail on verification errors, just warn
    }
  }

  return allPassed;
}

async function runMigrations() {
  console.log("🔄 Running migrations...\n");

  const sql = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(sql);

  try {
    // Get migration files before running
    const migrationFiles = await getMigrationFiles();
    console.log(`📋 Found ${migrationFiles.length} migration file(s):`);
    migrationFiles.forEach((file) => console.log(`   - ${file}`));

    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(sql);
    console.log(`\n📊 Applied migrations in database: ${appliedMigrations.length}`);

    // Run migrations
    console.log("\n🚀 Applying migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });

    // Verify migrations were applied
    const newAppliedMigrations = await getAppliedMigrations(sql);
    const newlyApplied = newAppliedMigrations.length - appliedMigrations.length;

    if (newlyApplied > 0) {
      console.log(`\n✅ Applied ${newlyApplied} new migration(s)!`);
    } else if (migrationFiles.length > appliedMigrations.length) {
      console.log(
        `\n⚠️  Warning: Found ${migrationFiles.length} migration files but only ${appliedMigrations.length} are marked as applied.`
      );
      console.log("   This might indicate a migration tracking issue.");
    } else {
      console.log("\n✅ All migrations are up to date.");
    }

    // Verify database state
    const verificationPassed = await verifyDatabaseState(sql);

    if (!verificationPassed) {
      console.log(
        "\n⚠️  Warning: Some database state checks failed. The migrations may not have been fully applied."
      );
      console.log("   You may need to manually verify and apply missing changes.");
    }

    console.log("\n✅ Migration process complete!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigrations().catch((err) => {
  console.error("❌ Migration script failed:", err);
  process.exit(1);
});

