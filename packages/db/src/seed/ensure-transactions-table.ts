import { db } from "../client";
import { sql } from "drizzle-orm";

/**
 * Ensures the property_transactions table exists
 * This script manually creates the table if it doesn't exist
 * Useful when db:push fails due to drizzle-kit bugs
 */
export async function ensureTransactionsTable() {
  console.log("🔍 Checking if property_transactions table exists...");

  try {
    // Check if table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'property_transactions'
      ) as exists;
    `);

    const tableExists = (tableCheck as unknown as Array<{ exists: boolean }>)[0]?.exists ?? false;

    if (tableExists) {
      console.log("✅ property_transactions table already exists!");
      return;
    }

    console.log("❌ property_transactions table does not exist. Creating it...");

    // Check if enums exist, create them if they don't
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "transaction_type" AS ENUM('income', 'expense', 'capital');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "transaction_review_status" AS ENUM('pending', 'approved', 'flagged', 'excluded');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "transaction_category" AS ENUM(
          'rent', 'parking', 'laundry', 'pet_rent', 'storage', 'utility_reimbursement',
          'late_fees', 'application_fees', 'acquisition', 'property_tax', 'insurance',
          'hoa', 'management', 'repairs', 'maintenance', 'capex', 'utilities', 'legal',
          'accounting', 'marketing', 'travel', 'office', 'bank_fees', 'licenses', 'other'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "property_transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "property_id" uuid NOT NULL,
        "type" "transaction_type" NOT NULL,
        "transaction_date" date NOT NULL,
        "amount" numeric(10, 2) NOT NULL,
        "category" "transaction_category" NOT NULL,
        "subcategory" text,
        "vendor" text,
        "payer" text,
        "description" text,
        "is_recurring" boolean DEFAULT false,
        "recurrence_frequency" "recurrence_frequency",
        "recurrence_end_date" date,
        "is_tax_deductible" boolean DEFAULT true,
        "tax_category" text,
        "document_id" uuid,
        "source" "expense_source" DEFAULT 'manual',
        "external_id" text,
        "notes" text,
        "review_status" "transaction_review_status" DEFAULT 'pending',
        "is_excluded" boolean DEFAULT false,
        "reviewed_by" uuid,
        "reviewed_at" timestamp,
        "created_by" uuid,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Add foreign key constraints (if they don't exist)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "property_transactions"
        ADD CONSTRAINT "property_transactions_property_id_properties_id_fk"
        FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id")
        ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "property_transactions"
        ADD CONSTRAINT "property_transactions_created_by_users_id_fk"
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "property_transactions"
        ADD CONSTRAINT "property_transactions_reviewed_by_users_id_fk"
        FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create indexes (if they don't exist)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_property_transactions_property_id"
      ON "property_transactions" USING btree ("property_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_property_transactions_date"
      ON "property_transactions" USING btree ("transaction_date");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_property_transactions_type"
      ON "property_transactions" USING btree ("type");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_property_transactions_category"
      ON "property_transactions" USING btree ("category");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_property_transactions_status"
      ON "property_transactions" USING btree ("review_status");
    `);

    console.log("✅ property_transactions table created successfully!");

    // Verify table was created
    const verifyCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'property_transactions'
      ) as exists;
    `);

    const verified = (verifyCheck as unknown as Array<{ exists: boolean }>)[0]?.exists ?? false;

    if (verified) {
      console.log("✅ Verification: property_transactions table exists!");
    } else {
      throw new Error("Failed to create property_transactions table");
    }
  } catch (error) {
    console.error("❌ Error ensuring property_transactions table:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  ensureTransactionsTable()
    .then(() => {
      console.log("\n✅ Script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

