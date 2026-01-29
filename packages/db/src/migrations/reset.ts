import postgres from "postgres";
import { config } from "dotenv";

// Load environment variables
config({ path: [".env.local", ".env", "../.env.local", "../../.env.local"] });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

async function dropDatabase() {
  console.log("🗑️  Dropping all tables...");

  const sql = postgres(DATABASE_URL!);

  // Drop schema
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`GRANT ALL ON SCHEMA public TO postgres`;
  await sql`GRANT ALL ON SCHEMA public TO public`;

  console.log("✅ Database reset complete!");

  await sql.end();
}

dropDatabase().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});

