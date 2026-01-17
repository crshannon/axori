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
  markets,
} from "../schema";
import { eq, and } from "drizzle-orm";
import { generateSampleTransactions } from "./data/transactions";
import {
  sampleCharacteristics,
  sampleValuation,
  sampleAcquisition,
  sampleRentalIncome,
  sampleOperatingExpenses,
  sampleManagement,
  sampleLoan,
} from "./data/properties";

/**
 * Seeds mock data for a specific user by their Clerk ID or user ID (UUID)
 *
 * Creates:
 * 1. Completed onboarding data
 * 2. One property with only address (empty state)
 * 3. One fully implemented property with all data
 *
 * @param identifier - The Clerk user ID or database user ID (UUID) to seed data for
 */
export async function seedMockUserData(identifier: string) {
  console.log(`🌱 Seeding mock data for user: ${identifier}`);

  try {
    // Check if identifier is a UUID (user ID) or Clerk ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    // Find user by either Clerk ID or user ID
    let [user] = isUUID
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
      console.log(`❌ User with ${idType} ${identifier} not found. Please create the user first.`);
      throw new Error(`User not found: ${identifier}`);
    }

    console.log(`✅ Found user: ${user.id} (${user.email})`);

    // 1. Complete onboarding data
    const onboardingData = {
      phase: "active_investor",
      persona: "portfolio_builder",
      ownership: {
        currentProperties: 3,
        yearsExperience: 5,
      },
      freedomNumber: 10000,
      strategy: {
        primary: "cash_flow",
        secondary: "appreciation",
      },
      markets: ["indianapolis", "memphis", "cleveland"],
    };

    await db
      .update(users)
      .set({
        onboardingStep: null, // Completed
        onboardingCompleted: new Date(),
        onboardingData: JSON.stringify(onboardingData),
        firstName: "Demo",
        lastName: "User",
      })
      .where(eq(users.id, user.id));

    console.log(`✅ Updated onboarding data`);

    // Get or create portfolio
    let [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.createdBy, user.id))
      .limit(1);

    if (!portfolio) {
      [portfolio] = await db
        .insert(portfolios)
        .values({
          name: "Demo Portfolio",
          description: "Demo portfolio for testing",
          createdBy: user.id,
        })
        .returning();

      // Create user-portfolio relationship
      await db.insert(userPortfolios).values({
        userId: user.id,
        portfolioId: portfolio.id,
        role: "owner",
      });

      console.log(`✅ Created portfolio: ${portfolio.id}`);
    }

    // Seed user markets (onboarding markets)
    // Look up market IDs by name
    const marketNames = ["Indianapolis", "Memphis", "Cleveland"];

    for (const marketName of marketNames) {
      // Find market by name
      const [market] = await db
        .select()
        .from(markets)
        .where(eq(markets.name, marketName))
        .limit(1);

      if (!market) {
        console.log(`⚠️  Market "${marketName}" not found, skipping...`);
        continue;
      }

      // Check if relationship already exists
      const existing = await db
        .select()
        .from(userMarkets)
        .where(
          and(
            eq(userMarkets.userId, user.id),
            eq(userMarkets.marketId, market.id)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(userMarkets).values({
          userId: user.id,
          marketId: market.id,
          relationshipType: "target_market" as const,
        });
      }
    }

    console.log(`✅ Seeded user markets`);

    // 2. Create empty state property (address only)
    const [emptyProperty] = await db
      .insert(properties)
      .values({
        portfolioId: portfolio.id,
        userId: user.id,
        addedBy: user.id,
        address: "123 Main Street",
        city: "Indianapolis",
        state: "IN",
        zipCode: "46202",
        status: "draft", // Empty state - not completed
      })
      .returning();

    console.log(`✅ Created empty property: ${emptyProperty.id} (${emptyProperty.address})`);

    // 3. Create fully implemented property
    const [fullProperty] = await db
      .insert(properties)
      .values({
        portfolioId: portfolio.id,
        userId: user.id,
        addedBy: user.id,
        address: "456 Oak Avenue",
        city: "Memphis",
        state: "TN",
        zipCode: "38103",
        status: "active",
      })
      .returning();

    console.log(`✅ Created full property: ${fullProperty.id} (${fullProperty.address})`);

    // Add characteristics
    await db.insert(propertyCharacteristics).values({
      propertyId: fullProperty.id,
      ...sampleCharacteristics,
    });

    // Add valuation
    await db.insert(propertyValuation).values({
      propertyId: fullProperty.id,
      ...sampleValuation,
    });

    // Add acquisition data
    await db.insert(propertyAcquisition).values({
      propertyId: fullProperty.id,
      ...sampleAcquisition,
    });

    // Add rental income
    await db.insert(propertyRentalIncome).values({
      propertyId: fullProperty.id,
      ...sampleRentalIncome,
    });

    // Add operating expenses
    await db.insert(propertyOperatingExpenses).values({
      propertyId: fullProperty.id,
      ...sampleOperatingExpenses,
    });

    // Add management
    await db.insert(propertyManagement).values({
      propertyId: fullProperty.id,
      ...sampleManagement,
    });

    // Add primary loan (conventional)
    const [loan] = await db
      .insert(loans)
      .values({
        propertyId: fullProperty.id,
        ...sampleLoan,
      })
      .returning();

    console.log(`✅ Added primary loan: ${loan.id}`);

    // Add HELOC (second lien) to "456 Oak Avenue"
    const [helocLoan] = await db
      .insert(loans)
      .values({
        propertyId: fullProperty.id,
        loanType: "heloc" as const,
        lenderName: "Community Credit Union",
        servicerName: "Community Credit Union",
        loanNumber: "HELOC-2024-456",
        originalLoanAmount: "50000", // $50k HELOC
        interestRate: "0.085", // 8.5% (typically higher than primary mortgage)
        termMonths: 120, // 10 years draw period
        currentBalance: "32000", // Current balance drawn
        startDate: "2024-01-15",
        maturityDate: "2034-01-15",
        status: "active" as const,
        isPrimary: false, // Second lien
        loanPosition: 2, // Second position lien
      })
      .returning();

    console.log(`✅ Added HELOC: ${helocLoan.id}`);

    // Add sample transactions (income and expenses) for the full property
    const transactions = generateSampleTransactions(
      fullProperty.id,
      user.id
    );

    const insertedTransactions = await db
      .insert(propertyTransactions)
      .values(transactions)
      .returning();

    const incomeCount = transactions.filter((t) => t.type === "income").length;
    const expenseCount = transactions.filter((t) => t.type === "expense").length;

    console.log(
      `✅ Added ${insertedTransactions.length} transactions (${incomeCount} income, ${expenseCount} expenses)`
    );

    console.log(`\n✅ Successfully seeded mock data for user ${identifier}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - User: ${user.email} (ID: ${user.id})`);
    console.log(`   - Portfolio: ${portfolio.name} (${portfolio.id})`);
    console.log(`   - Empty Property: ${emptyProperty.id} - ${emptyProperty.address}`);
    console.log(`   - Full Property: ${fullProperty.id} - ${fullProperty.address}`);
    console.log(`   - Primary Loan: ${loan.id} - $${loan.originalLoanAmount} @ ${(parseFloat(loan.interestRate) * 100).toFixed(2)}% (${loan.loanType})`);
    console.log(`   - HELOC: ${helocLoan.id} - $${helocLoan.originalLoanAmount} @ ${(parseFloat(helocLoan.interestRate) * 100).toFixed(2)}% (Current Balance: $${helocLoan.currentBalance})`);
    console.log(`   - Transactions: ${insertedTransactions.length} (Income: ${incomeCount}, Expenses: ${expenseCount})`);

    return {
      user,
      portfolio,
      emptyProperty,
      fullProperty,
      loan,
      helocLoan,
    };
  } catch (error) {
    console.error("❌ Error seeding mock user data:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error("❌ Please provide a Clerk user ID or user ID (UUID) as an argument");
    console.error("Usage: tsx src/seed/mock-user-data.ts <clerk-id-or-user-id>");
    console.error("Example: tsx src/seed/mock-user-data.ts user_abc123");
    console.error("Example: tsx src/seed/mock-user-data.ts 3b1b1672-2dad-4108-ae41-40e285e7cc17");
    process.exit(1);
  }

  seedMockUserData(identifier)
    .then(() => {
      console.log("\n✅ Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}

