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
  userMarkets,
} from "../schema";
import { eq, and } from "drizzle-orm";

/**
 * Seeds mock data for a specific user by their Clerk ID
 * 
 * Creates:
 * 1. Completed onboarding data
 * 2. One property with only address (empty state)
 * 3. One fully implemented property with all data
 * 
 * @param clerkId - The Clerk user ID to seed data for
 */
export async function seedMockUserData(clerkId: string) {
  console.log(`🌱 Seeding mock data for user: ${clerkId}`);

  try {
    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      console.log(`❌ User with Clerk ID ${clerkId} not found. Please create the user first.`);
      throw new Error(`User not found: ${clerkId}`);
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
      .where(eq(portfolios.userId, user.id))
      .limit(1);

    if (!portfolio) {
      [portfolio] = await db
        .insert(portfolios)
        .values({
          name: "Demo Portfolio",
          description: "Demo portfolio for testing",
          userId: user.id,
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
    const marketIds = ["indianapolis", "memphis", "cleveland"];
    for (const marketName of marketIds) {
      // Check if relationship already exists
      const existing = await db
        .select()
        .from(userMarkets)
        .where(
          and(
            eq(userMarkets.userId, user.id),
            eq(userMarkets.marketId, marketName)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(userMarkets).values({
          userId: user.id,
          marketId: marketName,
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
      propertyType: "Single Family",
      bedrooms: 3,
      bathrooms: "2.5",
      squareFeet: 1850,
      lotSizeSqft: 7200,
      yearBuilt: 2015,
    });

    // Add valuation
    await db.insert(propertyValuation).values({
      propertyId: fullProperty.id,
      currentValue: "285000",
      purchaseValue: "265000",
      arv: "310000",
    });

    // Add acquisition data
    await db.insert(propertyAcquisition).values({
      propertyId: fullProperty.id,
      purchasePrice: "265000",
      purchaseDate: "2023-06-15",
      acquisitionMethod: "traditional_sale",
      closingCostsTotal: "8500",
      downPaymentAmount: "53000",
      downPaymentSource: "cash",
      earnestMoney: "5000",
      sellerCredits: "2000",
      buyerAgentCommission: "7950",
      isOwnerOccupied: false,
    });

    // Add rental income
    await db.insert(propertyRentalIncome).values({
      propertyId: fullProperty.id,
      monthlyRent: "1850",
      annualRent: "22200",
      marketRent: "1900",
      rentGrowthRate: "3.5",
    });

    // Add operating expenses
    await db.insert(propertyOperatingExpenses).values({
      propertyId: fullProperty.id,
      propertyTaxesAnnual: "4200",
      insuranceAnnual: "1800",
      hoaMonthly: "0",
      utilitiesMonthly: "0",
      maintenanceMonthly: "150",
      managementFeeFlat: "0",
      landscapingMonthly: "75",
      pestControlMonthly: "25",
      capitalExReserveMonthly: "200",
      otherExpensesMonthly: "50",
      vacancyRatePercentage: "5",
    });

    // Add management
    await db.insert(propertyManagement).values({
      propertyId: fullProperty.id,
      isSelfManaged: false,
      companyName: "ABC Property Management",
      contactName: "John Smith",
      contactEmail: "john@abcpm.com",
      contactPhone: "555-123-4567",
      contractStartDate: "2023-07-01",
      feePercentage: "0.10", // 10% as decimal
    });

    // Add loan
    const [loan] = await db
      .insert(loans)
      .values({
        propertyId: fullProperty.id,
        loanType: "conventional",
        lenderName: "First National Bank",
        servicerName: "First National Bank",
        loanNumber: "LN-2023-001",
        originalLoanAmount: "212000",
        interestRate: "0.065", // 6.5%
        termMonths: 360,
        currentBalance: "208500",
        startDate: "2023-06-15",
        maturityDate: "2053-06-15",
        status: "active",
        isPrimary: true,
        loanPosition: 1,
      })
      .returning();

    console.log(`✅ Added loan: ${loan.id}`);

    console.log(`\n✅ Successfully seeded mock data for user ${clerkId}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - User: ${user.email}`);
    console.log(`   - Portfolio: ${portfolio.name} (${portfolio.id})`);
    console.log(`   - Empty Property: ${emptyProperty.id} - ${emptyProperty.address}`);
    console.log(`   - Full Property: ${fullProperty.id} - ${fullProperty.address}`);
    console.log(`   - Loan: ${loan.id} - $${loan.originalLoanAmount} @ ${(parseFloat(loan.interestRate) * 100).toFixed(2)}%`);

    return {
      user,
      portfolio,
      emptyProperty,
      fullProperty,
      loan,
    };
  } catch (error) {
    console.error("❌ Error seeding mock user data:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const clerkId = process.argv[2];
  if (!clerkId) {
    console.error("❌ Please provide a Clerk user ID as an argument");
    console.error("Usage: tsx src/seed/mock-user-data.ts <clerk-id>");
    process.exit(1);
  }

  seedMockUserData(clerkId)
    .then(() => {
      console.log("\n✅ Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}

