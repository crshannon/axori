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
import { generateSampleTransactions, generateSparseTransactions } from "./data/transactions";
import {
  sampleCharacteristics,
  sampleValuation,
  sampleAcquisition,
  sampleRentalIncome,
  sampleOperatingExpenses,
  sampleManagement,
  sampleLoan,
  sparseDataCharacteristics,
  sparseDataValuation,
  sparseDataAcquisition,
  sparseDataRentalIncome,
  sparseDataOperatingExpenses,
  sparseDataManagement,
  sparseDataLoan,
  freshOnboardedCharacteristics,
  freshOnboardedValuation,
  freshOnboardedAcquisition,
  freshOnboardedRentalIncome,
  freshOnboardedOperatingExpenses,
  freshOnboardedManagement,
  freshOnboardedLoan,
} from "./data/properties";

/**
 * Seeds mock data for a specific user by their Clerk ID or user ID (UUID)
 *
 * Creates:
 * 1. Completed onboarding data
 * 2. One property with only address (empty state)
 * 3. One fully implemented property with all data (12 months transactions)
 * 4. One sparse data property (1 month transactions)
 * 5. One fresh onboarded property (all data, no transactions yet)
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

    // Seed user markets first to get market IDs
    // Look up market IDs by name and collect UUIDs for onboardingData
    const marketNames = ["Indianapolis", "Memphis", "Cleveland"];
    const marketIds: string[] = [];

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

      // Collect market ID for onboardingData
      marketIds.push(market.id);

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

    // 1. Complete onboarding data
    // Using correct enum values that match the validation schema
    const onboardingData = {
      phase: "Building" as const, // Valid: "Explorer" | "Starting" | "Building" | "Optimizing"
      persona: "Aggressive Grower" as const, // Valid: "House Hacker" | "Accidental Landlord" | "Aggressive Grower" | "Passive Income Seeker" | "Value-Add Investor"
      ownership: "Personal" as const, // Valid: "Personal" | "LLC" (not an object)
      freedomNumber: 10000,
      strategy: "Hybrid" as const, // Valid: "Cash Flow" | "Appreciation" | "BRRRR" | "Hybrid" (not an object)
      markets: marketIds, // Array of market UUIDs (max 3)
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
    // Low balance for cash flow positive scenario
    const [helocLoan] = await db
      .insert(loans)
      .values({
        propertyId: fullProperty.id,
        loanType: "heloc" as const,
        lenderName: "Community Credit Union",
        servicerName: "Community Credit Union",
        loanNumber: "HELOC-2024-456",
        originalLoanAmount: "25000", // $25k HELOC
        interestRate: "0.085", // 8.5% (typically higher than primary mortgage)
        termMonths: 120, // 10 years draw period
        currentBalance: "6000", // $6k current balance (paid down for positive cash flow)
        monthlyPrincipalInterest: "42", // Interest-only payment: $6k @ 8.5% / 12 = ~$42/month
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

    // 4. Create sparse data property (for testing limited data scenarios)
    const [sparseProperty] = await db
      .insert(properties)
      .values({
        portfolioId: portfolio.id,
        userId: user.id,
        addedBy: user.id,
        address: "789 Riverfront Drive, Unit 4B",
        city: "Memphis",
        state: "TN",
        zipCode: "38103",
        status: "active",
      })
      .returning();

    console.log(`✅ Created sparse data property: ${sparseProperty.id} (${sparseProperty.address})`);

    // Add characteristics for sparse property
    await db.insert(propertyCharacteristics).values({
      propertyId: sparseProperty.id,
      ...sparseDataCharacteristics,
    });

    // Add valuation for sparse property
    await db.insert(propertyValuation).values({
      propertyId: sparseProperty.id,
      ...sparseDataValuation,
    });

    // Add acquisition for sparse property
    await db.insert(propertyAcquisition).values({
      propertyId: sparseProperty.id,
      ...sparseDataAcquisition,
    });

    // Add rental income for sparse property
    await db.insert(propertyRentalIncome).values({
      propertyId: sparseProperty.id,
      ...sparseDataRentalIncome,
    });

    // Add operating expenses for sparse property
    await db.insert(propertyOperatingExpenses).values({
      propertyId: sparseProperty.id,
      ...sparseDataOperatingExpenses,
    });

    // Add management for sparse property
    await db.insert(propertyManagement).values({
      propertyId: sparseProperty.id,
      ...sparseDataManagement,
    });

    // Add loan for sparse property
    const [sparseLoan] = await db
      .insert(loans)
      .values({
        propertyId: sparseProperty.id,
        ...sparseDataLoan,
      })
      .returning();

    console.log(`✅ Added sparse property loan: ${sparseLoan.id}`);

    // Add sparse transactions (only 1 month of data)
    const sparseTransactions = generateSparseTransactions(
      sparseProperty.id,
      user.id
    );

    const insertedSparseTransactions = await db
      .insert(propertyTransactions)
      .values(sparseTransactions)
      .returning();

    const sparseIncomeCount = sparseTransactions.filter((t) => t.type === "income").length;
    const sparseExpenseCount = sparseTransactions.filter((t) => t.type === "expense").length;

    console.log(
      `✅ Added ${insertedSparseTransactions.length} sparse transactions (${sparseIncomeCount} income, ${sparseExpenseCount} expenses)`
    );

    // 5. Create fresh onboarded property (all data but no transactions)
    // Simulates a property that just completed the onboarding wizard
    const [freshProperty] = await db
      .insert(properties)
      .values({
        portfolioId: portfolio.id,
        userId: user.id,
        addedBy: user.id,
        address: "321 Maple Court",
        city: "Indianapolis",
        state: "IN",
        zipCode: "46220",
        status: "active",
      })
      .returning();

    console.log(`✅ Created fresh onboarded property: ${freshProperty.id} (${freshProperty.address})`);

    // Add characteristics for fresh property
    await db.insert(propertyCharacteristics).values({
      propertyId: freshProperty.id,
      ...freshOnboardedCharacteristics,
    });

    // Add valuation for fresh property
    await db.insert(propertyValuation).values({
      propertyId: freshProperty.id,
      ...freshOnboardedValuation,
    });

    // Add acquisition for fresh property
    await db.insert(propertyAcquisition).values({
      propertyId: freshProperty.id,
      ...freshOnboardedAcquisition,
    });

    // Add rental income for fresh property
    await db.insert(propertyRentalIncome).values({
      propertyId: freshProperty.id,
      ...freshOnboardedRentalIncome,
    });

    // Add operating expenses for fresh property
    await db.insert(propertyOperatingExpenses).values({
      propertyId: freshProperty.id,
      ...freshOnboardedOperatingExpenses,
    });

    // Add management for fresh property
    await db.insert(propertyManagement).values({
      propertyId: freshProperty.id,
      ...freshOnboardedManagement,
    });

    // Add loan for fresh property
    const [freshLoan] = await db
      .insert(loans)
      .values({
        propertyId: freshProperty.id,
        ...freshOnboardedLoan,
      })
      .returning();

    console.log(`✅ Added fresh property loan: ${freshLoan.id}`);

    // NOTE: No transactions for fresh property - simulates just completed onboarding

    console.log(`\n✅ Successfully seeded mock data for user ${identifier}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - User: ${user.email} (ID: ${user.id})`);
    console.log(`   - Portfolio: ${portfolio.name} (${portfolio.id})`);
    console.log(`   - Empty Property: ${emptyProperty.id} - ${emptyProperty.address}`);
    console.log(`   - Full Property: ${fullProperty.id} - ${fullProperty.address}`);
    console.log(`   - Sparse Data Property: ${sparseProperty.id} - ${sparseProperty.address} (1 month data)`);
    console.log(`   - Fresh Onboarded Property: ${freshProperty.id} - ${freshProperty.address} (no transactions)`);
    console.log(`   - Primary Loan: ${loan.id} - $${loan.originalLoanAmount} @ ${(parseFloat(loan.interestRate) * 100).toFixed(2)}% (${loan.loanType})`);
    console.log(`   - HELOC: ${helocLoan.id} - $${helocLoan.originalLoanAmount} @ ${(parseFloat(helocLoan.interestRate) * 100).toFixed(2)}% (Current Balance: $${helocLoan.currentBalance})`);
    console.log(`   - Sparse Loan: ${sparseLoan.id} - $${sparseLoan.originalLoanAmount} @ ${(parseFloat(sparseLoan.interestRate) * 100).toFixed(2)}%`);
    console.log(`   - Fresh Loan: ${freshLoan.id} - $${freshLoan.originalLoanAmount} @ ${(parseFloat(freshLoan.interestRate) * 100).toFixed(2)}%`);
    console.log(`   - Full Property Transactions: ${insertedTransactions.length} (12 months)`);
    console.log(`   - Sparse Property Transactions: ${insertedSparseTransactions.length} (1 month only)`);
    console.log(`   - Fresh Property Transactions: 0 (just onboarded)`);

    return {
      user,
      portfolio,
      emptyProperty,
      fullProperty,
      sparseProperty,
      freshProperty,
      loan,
      helocLoan,
      sparseLoan,
      freshLoan,
    };
  } catch (error) {
    console.error("❌ Error seeding mock user data:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  // Load environment variables from root .env.local
  require("dotenv").config({ path: "../../.env.local" });

  // Use CLI argument first, then fall back to SEED_USER_ID env var
  const identifier = process.argv[2] || process.env.SEED_USER_ID;
  if (!identifier) {
    console.error("❌ Please provide a Clerk user ID or user ID (UUID)");
    console.error("");
    console.error("Option 1: Pass as argument");
    console.error("  Usage: pnpm db:seed:user <clerk-id-or-user-id>");
    console.error("  Example: pnpm db:seed:user user_abc123");
    console.error("");
    console.error("Option 2: Set SEED_USER_ID in .env.local");
    console.error("  Add: SEED_USER_ID=your-clerk-id-or-user-uuid");
    console.error("  Then run: pnpm db:seed:user");
    process.exit(1);
  }

  console.log(`📍 Using identifier: ${identifier}`);
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

