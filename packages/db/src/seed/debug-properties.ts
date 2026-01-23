/**
 * Debug Properties Access
 * 
 * Checks why properties aren't visible - verifies user, portfolio, and property relationships
 */

import { db } from "../client";
import { users, portfolios, userPortfolios, properties } from "../schema";
import { eq, and } from "drizzle-orm";
import { getAccessiblePropertyIdsForUser } from "@axori/permissions";

async function debugProperties() {
  console.log("🔍 Debugging properties access...\n");

  try {
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`📊 Found ${allUsers.length} user(s):`);
    allUsers.forEach((u) => {
      console.log(`   - ${u.email} (ID: ${u.id}, Clerk: ${u.clerkId})`);
    });

    // Get all portfolios
    const allPortfolios = await db.select().from(portfolios);
    console.log(`\n📊 Found ${allPortfolios.length} portfolio(s):`);
    allPortfolios.forEach((p) => {
      console.log(`   - ${p.name} (ID: ${p.id}, Created by: ${p.createdBy})`);
    });

    // Get all user_portfolios entries
    const allUserPortfolios = await db.select().from(userPortfolios);
    console.log(`\n📊 Found ${allUserPortfolios.length} user_portfolios entry/entries:`);
    allUserPortfolios.forEach((up) => {
      console.log(
        `   - User ${up.userId} → Portfolio ${up.portfolioId} (Role: ${up.role})`
      );
    });

    // Get all properties
    const allProperties = await db.select().from(properties);
    console.log(`\n📊 Found ${allProperties.length} property/properties:`);
    allProperties.forEach((p) => {
      console.log(
        `   - ${p.address} (ID: ${p.id}, Portfolio: ${p.portfolioId}, Status: ${p.status})`
      );
    });

    // For each user, check what they can access
    console.log(`\n🔍 Checking access for each user:\n`);
    for (const user of allUsers) {
      console.log(`👤 User: ${user.email} (${user.id})`);
      
      // Get their portfolios
      const userPorts = await db
        .select()
        .from(userPortfolios)
        .where(eq(userPortfolios.userId, user.id));
      
      console.log(`   Portfolios: ${userPorts.length}`);
      for (const up of userPorts) {
        const accessibleIds = await getAccessiblePropertyIdsForUser(
          user.id,
          up.portfolioId
        );
        console.log(
          `   - Portfolio ${up.portfolioId}: ${accessibleIds.length} accessible properties`
        );
        if (accessibleIds.length > 0) {
          console.log(`     Property IDs: ${accessibleIds.join(", ")}`);
        }
      }
      console.log();
    }
  } catch (error) {
    console.error("❌ Error debugging:", error);
    throw error;
  }
}

debugProperties()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
