#!/usr/bin/env tsx
/**
 * Unified Database Migration Runner
 *
 * Consolidates all migration-related functionality:
 * - Status checking
 * - Applying migrations
 * - Dynamic verification
 * - Recovery from failed migrations
 *
 * Usage:
 *   tsx src/migrations/runner.ts --status        # Check migration status
 *   tsx src/migrations/runner.ts --apply         # Apply pending migrations
 *   tsx src/migrations/runner.ts --verify        # Verify database state
 *   tsx src/migrations/runner.ts --force <file>  # Force apply a specific migration
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { config } from "dotenv";
import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load environment variables from multiple locations
config({ path: [".env.local", ".env", "../.env.local", "../../.env.local"] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PACKAGE_ROOT = join(__dirname, "../..");
const DRIZZLE_FOLDER = join(DB_PACKAGE_ROOT, "drizzle");

interface MigrationFile {
  name: string;
  path: string;
}

interface AppliedMigration {
  id: number;
  hash: string;
  created_at: Date;
}

interface RunnerOptions {
  mode: "status" | "apply" | "verify" | "force";
  forceFile?: string;
  skipVerify?: boolean;
  verbose?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): RunnerOptions {
  const args = process.argv.slice(2);
  const options: RunnerOptions = { mode: "apply" };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--status" || arg === "-s") {
      options.mode = "status";
    } else if (arg === "--apply" || arg === "-a") {
      options.mode = "apply";
    } else if (arg === "--verify" || arg === "-v") {
      options.mode = "verify";
    } else if (arg === "--force" || arg === "-f") {
      options.mode = "force";
      options.forceFile = args[++i];
    } else if (arg === "--skip-verify") {
      options.skipVerify = true;
    } else if (arg === "--verbose") {
      options.verbose = true;
    }
  }

  return options;
}

/**
 * Get list of migration files from the drizzle folder
 */
async function getMigrationFiles(): Promise<MigrationFile[]> {
  try {
    const files = await readdir(DRIZZLE_FOLDER);
    return files
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((name) => ({
        name,
        path: join(DRIZZLE_FOLDER, name),
      }));
  } catch {
    return [];
  }
}

/**
 * Get list of applied migrations from the database
 */
async function getAppliedMigrations(
  sql: postgres.Sql
): Promise<AppliedMigration[]> {
  try {
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
      SELECT id, hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at ASC
    `;

    return migrations as AppliedMigration[];
  } catch {
    return [];
  }
}

/**
 * Get all tables in the public schema
 */
async function getTables(sql: postgres.Sql): Promise<string[]> {
  const result = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  return result.map((row) => row.table_name as string);
}

/**
 * Get all columns for a table
 */
async function getTableColumns(
  sql: postgres.Sql,
  tableName: string
): Promise<string[]> {
  const result = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;
  return result.map((row) => row.column_name as string);
}

/**
 * Dynamic verification - checks that all schema tables and critical columns exist
 */
async function verifyDatabaseState(
  sql: postgres.Sql,
  verbose: boolean
): Promise<{ passed: boolean; issues: string[] }> {
  const issues: string[] = [];

  console.log("\n🔍 Verifying database state...\n");

  // Get current tables
  const tables = await getTables(sql);

  // Critical tables that must exist
  const criticalTables = [
    "users",
    "portfolios",
    "properties",
    "loans",
    "property_transactions",
    "user_portfolios",
  ];

  for (const table of criticalTables) {
    if (tables.includes(table)) {
      if (verbose) console.log(`  ✅ Table '${table}' exists`);
    } else {
      issues.push(`Missing table: ${table}`);
      console.log(`  ❌ Table '${table}' is MISSING`);
    }
  }

  // Check critical columns in specific tables
  const criticalColumns: Record<string, string[]> = {
    property_rental_income: ["lease_start_date", "lease_end_date"],
    portfolios: ["created_by"],
    user_portfolios: ["invited_by", "property_access"],
    loans: ["has_escrow"],
  };

  for (const [tableName, columns] of Object.entries(criticalColumns)) {
    if (!tables.includes(tableName)) {
      if (verbose) console.log(`  ⚠️  Skipping ${tableName} (table doesn't exist)`);
      continue;
    }

    const tableColumns = await getTableColumns(sql, tableName);
    for (const column of columns) {
      if (tableColumns.includes(column)) {
        if (verbose) console.log(`  ✅ Column '${tableName}.${column}' exists`);
      } else {
        issues.push(`Missing column: ${tableName}.${column}`);
        console.log(`  ❌ Column '${tableName}.${column}' is MISSING`);
      }
    }
  }

  // Check data integrity: portfolio creators should have user_portfolios entries
  if (tables.includes("portfolios") && tables.includes("user_portfolios")) {
    const missingEntries = await sql`
      SELECT COUNT(*) as count
      FROM portfolios p
      WHERE p.created_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM user_portfolios up
        WHERE up.user_id = p.created_by
        AND up.portfolio_id = p.id
      )
    `;
    const count = Number(missingEntries[0]?.count ?? 0);
    if (count > 0) {
      issues.push(
        `${count} portfolio(s) missing user_portfolios entries for creators`
      );
      console.log(
        `  ⚠️  ${count} portfolio(s) missing user_portfolios entries for creators`
      );
    } else if (verbose) {
      console.log("  ✅ All portfolio creators have user_portfolios entries");
    }
  }

  const passed = issues.length === 0;
  if (passed) {
    console.log("\n✅ All verification checks passed!");
  } else {
    console.log(`\n⚠️  Found ${issues.length} issue(s)`);
  }

  return { passed, issues };
}

/**
 * Show migration status
 */
async function showStatus(sql: postgres.Sql): Promise<void> {
  console.log("📊 Migration Status\n");

  const migrationFiles = await getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations(sql);

  console.log(`Migration files: ${migrationFiles.length}`);
  console.log(`Applied migrations: ${appliedMigrations.length}`);

  if (migrationFiles.length === 0) {
    console.log("\n⚠️  No migration files found in drizzle/ folder");
    return;
  }

  console.log("\n📋 Migration Files:");
  for (const file of migrationFiles) {
    const isApplied = appliedMigrations.length >= migrationFiles.indexOf(file) + 1;
    const status = isApplied ? "✅" : "⏳";
    console.log(`  ${status} ${file.name}`);
  }

  const pending = migrationFiles.length - appliedMigrations.length;
  if (pending > 0) {
    console.log(`\n📌 ${pending} migration(s) pending`);
  } else {
    console.log("\n✅ All migrations are up to date");
  }
}

/**
 * Apply pending migrations
 */
async function applyMigrations(
  sql: postgres.Sql,
  db: ReturnType<typeof drizzle>,
  skipVerify: boolean,
  verbose: boolean
): Promise<boolean> {
  console.log("🚀 Applying Migrations\n");

  const migrationFiles = await getMigrationFiles();
  const appliedBefore = await getAppliedMigrations(sql);

  console.log(`📋 Found ${migrationFiles.length} migration file(s)`);
  console.log(`📊 Currently applied: ${appliedBefore.length}\n`);

  try {
    await migrate(db, { migrationsFolder: DRIZZLE_FOLDER });

    const appliedAfter = await getAppliedMigrations(sql);
    const newlyApplied = appliedAfter.length - appliedBefore.length;

    if (newlyApplied > 0) {
      console.log(`\n✅ Applied ${newlyApplied} new migration(s)`);
    } else {
      console.log("\n✅ All migrations are up to date");
    }

    // Run verification unless skipped
    if (!skipVerify) {
      const { passed } = await verifyDatabaseState(sql, verbose);
      if (!passed) {
        console.log(
          "\n⚠️  Some verification checks failed. Review the issues above."
        );
      }
    }

    return true;
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    return false;
  }
}

/**
 * Force apply a specific migration file
 */
async function forceApplyMigration(
  sql: postgres.Sql,
  fileName: string
): Promise<boolean> {
  console.log(`🔧 Force Applying Migration: ${fileName}\n`);

  const migrationFiles = await getMigrationFiles();
  const file = migrationFiles.find(
    (f) => f.name === fileName || f.name.includes(fileName)
  );

  if (!file) {
    console.error(`❌ Migration file not found: ${fileName}`);
    console.log("\nAvailable migrations:");
    migrationFiles.forEach((f) => console.log(`  - ${f.name}`));
    return false;
  }

  try {
    console.log(`📄 Reading: ${file.name}`);
    const content = await readFile(file.path, "utf-8");

    console.log("⚡ Executing migration...");
    await sql.unsafe(content);

    console.log(`\n✅ Successfully applied: ${file.name}`);
    return true;
  } catch (error) {
    console.error(`\n❌ Failed to apply ${file.name}:`, error);
    return false;
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const options = parseArgs();

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment");
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  try {
    switch (options.mode) {
      case "status":
        await showStatus(sql);
        break;

      case "verify":
        await verifyDatabaseState(sql, options.verbose ?? false);
        break;

      case "force":
        if (!options.forceFile) {
          console.error("❌ --force requires a migration file name");
          process.exit(1);
        }
        const forceSuccess = await forceApplyMigration(sql, options.forceFile);
        if (!forceSuccess) process.exit(1);
        break;

      case "apply":
      default:
        const applySuccess = await applyMigrations(
          sql,
          db,
          options.skipVerify ?? false,
          options.verbose ?? false
        );
        if (!applySuccess) process.exit(1);
        break;
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error("❌ Migration runner failed:", error);
  process.exit(1);
});
