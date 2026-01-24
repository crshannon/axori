/**
 * Verify Migration 0008 - Check if invitation_tokens table exists
 */

import postgres from "postgres";
import { config } from "dotenv";

config({ path: [".env.local", ".env", "../.env.local", "../../.env.local"] });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

async function verify() {
  const sql = postgres(DATABASE_URL!, { max: 1 });

  try {
    // Check if invitation_tokens table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invitation_tokens'
      )
    `;

    const exists = tableCheck[0]?.exists;
    
    if (exists) {
      console.log("✅ Migration 0008 applied - invitation_tokens table exists");
      
      // Check if enum exists
      const enumCheck = await sql`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = 'invitation_token_status'
        )
      `;
      
      if (enumCheck[0]?.exists) {
        console.log("✅ invitation_token_status enum exists");
      } else {
        console.log("⚠️  invitation_token_status enum not found");
      }
    } else {
      console.log("❌ Migration 0008 not applied - invitation_tokens table missing");
    }
  } catch (error) {
    console.error("❌ Error verifying migration:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
