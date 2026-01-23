/**
 * Fix Portfolio Access - Ensures all portfolio creators have user_portfolios entries
 * 
 * This script backfills user_portfolios entries for any portfolios where
 * the creator doesn't have an entry. This is a one-time fix for portfolios
 * that were created before the permission system was fully implemented.
 * 
 * Usage: tsx src/seed/fix-portfolio-access.ts
 */

import { db } from "../client";
import { portfolios, userPortfolios, users } from "../schema";
import { eq, and } from "drizzle-orm";

async function fixPortfolioAccess() {
  console.log("🔧 Fixing portfolio access...\n");

  try {
    // Get all portfolios (we'll filter for those with creators below)
    const portfoliosWithCreators = await db
      .select({
        id: portfolios.id,
        createdBy: portfolios.createdBy,
        name: portfolios.name,
      })
      .from(portfolios);

    console.log(`📊 Found ${portfoliosWithCreators.length} portfolio(s)\n`);

    let fixed = 0;
    let alreadyExists = 0;
    let skipped = 0;

    for (const portfolio of portfoliosWithCreators) {
      if (!portfolio.createdBy) {
        console.log(`⚠️  Skipping portfolio ${portfolio.name} (${portfolio.id}) - no creator`);
        skipped++;
        continue;
      }

      // Check if user_portfolios entry already exists
      const [existing] = await db
        .select()
        .from(userPortfolios)
        .where(
          and(
            eq(userPortfolios.userId, portfolio.createdBy),
            eq(userPortfolios.portfolioId, portfolio.id)
          )
        )
        .limit(1);

      if (existing) {
        console.log(`✅ Portfolio "${portfolio.name}" - user_portfolios entry already exists`);
        alreadyExists++;
        continue;
      }

      // Verify the user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, portfolio.createdBy))
        .limit(1);

      if (!user) {
        console.log(`⚠️  Skipping portfolio "${portfolio.name}" - creator user not found (${portfolio.createdBy})`);
        skipped++;
        continue;
      }

      // Create user_portfolios entry
      await db.insert(userPortfolios).values({
        userId: portfolio.createdBy,
        portfolioId: portfolio.id,
        role: "owner",
        propertyAccess: null, // Full access
      });

      console.log(`✅ Fixed portfolio "${portfolio.name}" - created owner entry for user ${user.email}`);
      fixed++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Fixed: ${fixed}`);
    console.log(`   - Already exists: ${alreadyExists}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`\n✅ Done!`);
  } catch (error) {
    console.error("❌ Error fixing portfolio access:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixPortfolioAccess()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { fixPortfolioAccess };
