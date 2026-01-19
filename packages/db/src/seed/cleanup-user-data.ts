import { db } from "../client";
import {
  users,
  portfolios,
  userPortfolios,
  properties,
  propertyCharacteristics,
  propertyValuation,
  propertyAcquisition,
  propertyRentalIncome,
  propertyOperatingExpenses,
  propertyManagement,
  loans,
  propertyTransactions,
  userMarkets,
} from "../schema";
import { eq, and, inArray } from "drizzle-orm";
import { seedMockUserData } from "./mock-user-data";

/**
 * Cleans up all data for a specific user, then re-seeds mock data
 *
 * Deletes (in order to respect foreign key constraints):
 * 1. Transactions (references properties)
 * 2. Loans (references properties)
 * 3. Property-related tables (all reference properties)
 * 4. Properties (references portfolios)
 * 5. User-portfolio relationships
 * 6. Portfolios (if empty)
 * 7. User-market relationships
 *
 * Then re-seeds mock data using seedMockUserData
 *
 * @param identifier - The Clerk user ID or database user ID (UUID) to clean and reseed
 */
export async function cleanupAndReseedUserData(identifier: string) {
  console.log(`🧹 Cleaning up and re-seeding data for user: ${identifier}`);

  try {
    // Check if identifier is a UUID (user ID) or Clerk ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

    // Find user by either Clerk ID or user ID
    const [user] = isUUID
      ? await db
          .select()
          .from(users)
          .where(eq(users.id, identifier))
          .limit(1)
      : await db
          .select()
          .from(users)
          .where(eq(users.clerkId, identifier))
          .limit(1);

    if (!user) {
      const idType = isUUID ? "user ID" : "Clerk ID";
      console.log(
        `❌ User with ${idType} ${identifier} not found. Please create the user first.`
      );
      throw new Error(`User not found: ${identifier}`);
    }

    console.log(`✅ Found user: ${user.id} (${user.email})`);

    // Step 1: Get all properties for this user
    const userProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.userId, user.id));

    if (userProperties.length === 0) {
      console.log(`ℹ️  No properties found for user. Proceeding with seed...`);
    } else {
      console.log(
        `📋 Found ${userProperties.length} property(ies) to delete`
      );

      const propertyIds = userProperties.map((p) => p.id);

      // Step 2: Delete transactions (references properties)
      // Handle gracefully if table doesn't exist yet
      try {
        const deletedTransactions = await db
          .delete(propertyTransactions)
          .where(inArray(propertyTransactions.propertyId, propertyIds))
          .returning();

        console.log(`🗑️  Deleted ${deletedTransactions.length} transaction(s)`);
      } catch (error: any) {
        if (error?.cause?.code === "42P01") {
          // Table doesn't exist (relation does not exist error)
          console.log(`ℹ️  property_transactions table doesn't exist yet, skipping...`);
        } else {
          throw error;
        }
      }

      // Step 3: Delete loans (references properties)
      try {
        const deletedLoans = await db
          .delete(loans)
          .where(inArray(loans.propertyId, propertyIds))
          .returning();

        console.log(`🗑️  Deleted ${deletedLoans.length} loan(s)`);
      } catch (error: any) {
        if (error?.cause?.code === "42P01") {
          console.log(`ℹ️  loans table doesn't exist yet, skipping...`);
        } else {
          throw error;
        }
      }

      // Step 4: Delete property-related tables (all reference properties)
      // These can be deleted in any order since they all just reference properties
      let deletedCharacteristics: Array<unknown> = [];
      let deletedValuations: Array<unknown> = [];
      let deletedAcquisitions: Array<unknown> = [];
      let deletedRentalIncomes: Array<unknown> = [];
      let deletedOperatingExpenses: Array<unknown> = [];
      let deletedManagement: Array<unknown> = [];

      try {
        deletedCharacteristics = await db
          .delete(propertyCharacteristics)
          .where(inArray(propertyCharacteristics.propertyId, propertyIds))
          .returning();
      } catch (error: any) {
        if (error?.cause?.code !== "42P01") {
          throw error;
        }
      }

      try {
        deletedValuations = await db
          .delete(propertyValuation)
          .where(inArray(propertyValuation.propertyId, propertyIds))
          .returning();
      } catch (error: any) {
        if (error?.cause?.code !== "42P01") {
          throw error;
        }
      }

      try {
        deletedAcquisitions = await db
          .delete(propertyAcquisition)
          .where(inArray(propertyAcquisition.propertyId, propertyIds))
          .returning();
      } catch (error: any) {
        if (error?.cause?.code !== "42P01") {
          throw error;
        }
      }

      try {
        deletedRentalIncomes = await db
          .delete(propertyRentalIncome)
          .where(inArray(propertyRentalIncome.propertyId, propertyIds))
          .returning();
      } catch (error: any) {
        if (error?.cause?.code !== "42P01") {
          throw error;
        }
      }

      try {
        deletedOperatingExpenses = await db
          .delete(propertyOperatingExpenses)
          .where(
            inArray(propertyOperatingExpenses.propertyId, propertyIds)
          )
          .returning();
      } catch (error: any) {
        if (error?.cause?.code !== "42P01") {
          throw error;
        }
      }

      try {
        deletedManagement = await db
          .delete(propertyManagement)
          .where(inArray(propertyManagement.propertyId, propertyIds))
          .returning();
      } catch (error: any) {
        if (error?.cause?.code !== "42P01") {
          throw error;
        }
      }

      console.log(
        `🗑️  Deleted property data: ${deletedCharacteristics.length} characteristics, ${deletedValuations.length} valuations, ${deletedAcquisitions.length} acquisitions, ${deletedRentalIncomes.length} rental incomes, ${deletedOperatingExpenses.length} operating expenses, ${deletedManagement.length} management records`
      );

      // Step 5: Delete properties themselves
      const deletedProperties = await db
        .delete(properties)
        .where(inArray(properties.id, propertyIds))
        .returning();

      console.log(`🗑️  Deleted ${deletedProperties.length} property(ies)`);
    }

    // Step 6: Clean up portfolios (delete user-portfolio relationships and empty portfolios)
    const userPortfolioRels = await db
      .select()
      .from(userPortfolios)
      .where(eq(userPortfolios.userId, user.id));

    if (userPortfolioRels.length > 0) {
      const portfolioIds = userPortfolioRels.map((rel) => rel.portfolioId);

      // Check if portfolios have any remaining properties
      const portfoliosWithProperties = await db
        .select()
        .from(properties)
        .where(inArray(properties.portfolioId, portfolioIds));

      const portfoliosWithPropertiesIds = new Set(
        portfoliosWithProperties.map((p) => p.portfolioId)
      );

      // Delete user-portfolio relationships
      await db
        .delete(userPortfolios)
        .where(eq(userPortfolios.userId, user.id));

      console.log(
        `🗑️  Deleted ${userPortfolioRels.length} user-portfolio relationship(s)`
      );

      // Delete empty portfolios (portfolios with no properties and no other users)
      for (const portfolioId of portfolioIds) {
        if (!portfoliosWithPropertiesIds.has(portfolioId)) {
          // Check if this portfolio has any other user relationships
          const otherRels = await db
            .select()
            .from(userPortfolios)
            .where(eq(userPortfolios.portfolioId, portfolioId))
            .limit(1);

          if (otherRels.length === 0) {
            await db
              .delete(portfolios)
              .where(eq(portfolios.id, portfolioId));
            console.log(`🗑️  Deleted empty portfolio: ${portfolioId}`);
          }
        }
      }
    }

    // Step 7: Clean up user-market relationships (optional - comment out if you want to keep these)
    const deletedUserMarkets = await db
      .delete(userMarkets)
      .where(eq(userMarkets.userId, user.id))
      .returning();

    console.log(`🗑️  Deleted ${deletedUserMarkets.length} user-market relationship(s)`);

    console.log(`\n✅ Cleanup complete! Re-seeding data...\n`);

    // Step 8: Re-seed mock data
    await seedMockUserData(identifier);

    console.log(`\n🎉 Cleanup and re-seed completed successfully!`);
  } catch (error) {
    console.error("❌ Error during cleanup and re-seed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error(
      "❌ Please provide a Clerk user ID or user ID (UUID) as an argument"
    );
    console.error(
      "Usage: tsx src/seed/cleanup-user-data.ts <clerk-id-or-user-id>"
    );
    console.error("Example: tsx src/seed/cleanup-user-data.ts user_abc123");
    console.error(
      "Example: tsx src/seed/cleanup-user-data.ts 3b1b1672-2dad-4108-ae41-40e285e7cc17"
    );
    process.exit(1);
  }

  cleanupAndReseedUserData(identifier)
    .then(() => {
      console.log("\n✅ Script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

