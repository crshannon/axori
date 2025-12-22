import { db } from "../client";
import { markets } from "../schema";

// Curated list of 50-75 investor-friendly metros with investment profiles and stats
const marketData = [
  // Cash Flow Markets
  { name: "Indianapolis", state: "IN", region: "Midwest", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.5, medianPrice: 185000, rentToPriceRatio: 0.0078 },
  { name: "Memphis", state: "TN", region: "South", investmentProfile: ["cash_flow"], avgCapRate: 9.2, medianPrice: 165000, rentToPriceRatio: 0.0085 },
  { name: "Cleveland", state: "OH", region: "Midwest", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.8, medianPrice: 145000, rentToPriceRatio: 0.0082 },
  { name: "Birmingham", state: "AL", region: "South", investmentProfile: ["cash_flow"], avgCapRate: 9.0, medianPrice: 175000, rentToPriceRatio: 0.0080 },
  { name: "Kansas City", state: "MO", region: "Midwest", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.3, medianPrice: 220000, rentToPriceRatio: 0.0075 },
  { name: "Columbus", state: "OH", region: "Midwest", investmentProfile: ["cash_flow", "appreciation", "hybrid"], avgCapRate: 7.8, medianPrice: 235000, rentToPriceRatio: 0.0070 },
  { name: "Tampa", state: "FL", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.5, medianPrice: 385000, rentToPriceRatio: 0.0062 },
  { name: "Phoenix", state: "AZ", region: "West", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.8, medianPrice: 425000, rentToPriceRatio: 0.0065 },
  { name: "Detroit", state: "MI", region: "Midwest", investmentProfile: ["cash_flow"], avgCapRate: 10.2, medianPrice: 85000, rentToPriceRatio: 0.0095 },
  { name: "Milwaukee", state: "WI", region: "Midwest", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.0, medianPrice: 245000, rentToPriceRatio: 0.0072 },
  { name: "Louisville", state: "KY", region: "South", investmentProfile: ["cash_flow"], avgCapRate: 8.7, medianPrice: 195000, rentToPriceRatio: 0.0078 },
  { name: "Oklahoma City", state: "OK", region: "South", investmentProfile: ["cash_flow"], avgCapRate: 8.9, medianPrice: 185000, rentToPriceRatio: 0.0080 },
  { name: "Tulsa", state: "OK", region: "South", investmentProfile: ["cash_flow"], avgCapRate: 8.6, medianPrice: 175000, rentToPriceRatio: 0.0078 },
  { name: "Wichita", state: "KS", region: "Midwest", investmentProfile: ["cash_flow"], avgCapRate: 9.1, medianPrice: 155000, rentToPriceRatio: 0.0082 },
  { name: "Buffalo", state: "NY", region: "Northeast", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.4, medianPrice: 195000, rentToPriceRatio: 0.0076 },
  { name: "Rochester", state: "NY", region: "Northeast", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.2, medianPrice: 185000, rentToPriceRatio: 0.0074 },
  { name: "Pittsburgh", state: "PA", region: "Northeast", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.9, medianPrice: 205000, rentToPriceRatio: 0.0072 },
  { name: "Cincinnati", state: "OH", region: "Midwest", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.1, medianPrice: 215000, rentToPriceRatio: 0.0073 },
  { name: "St. Louis", state: "MO", region: "Midwest", investmentProfile: ["cash_flow"], avgCapRate: 8.7, medianPrice: 185000, rentToPriceRatio: 0.0079 },
  { name: "Little Rock", state: "AR", region: "South", investmentProfile: ["cash_flow"], avgCapRate: 8.8, medianPrice: 175000, rentToPriceRatio: 0.0080 },
  { name: "Jackson", state: "MS", region: "South", investmentProfile: ["cash_flow"], avgCapRate: 9.3, medianPrice: 155000, rentToPriceRatio: 0.0085 },
  { name: "Shreveport", state: "LA", region: "South", investmentProfile: ["cash_flow"], avgCapRate: 9.1, medianPrice: 165000, rentToPriceRatio: 0.0083 },
  { name: "Baton Rouge", state: "LA", region: "South", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.5, medianPrice: 225000, rentToPriceRatio: 0.0076 },
  { name: "Mobile", state: "AL", region: "South", investmentProfile: ["cash_flow"], avgCapRate: 8.9, medianPrice: 165000, rentToPriceRatio: 0.0081 },
  { name: "Chattanooga", state: "TN", region: "South", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.4, medianPrice: 235000, rentToPriceRatio: 0.0075 },
  { name: "Knoxville", state: "TN", region: "South", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.2, medianPrice: 245000, rentToPriceRatio: 0.0073 },
  { name: "Greensboro", state: "NC", region: "South", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.8, medianPrice: 225000, rentToPriceRatio: 0.0070 },
  { name: "Winston-Salem", state: "NC", region: "South", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.0, medianPrice: 215000, rentToPriceRatio: 0.0072 },
  { name: "Richmond", state: "VA", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 7.2, medianPrice: 315000, rentToPriceRatio: 0.0065 },
  { name: "Norfolk", state: "VA", region: "South", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.5, medianPrice: 275000, rentToPriceRatio: 0.0068 },
  { name: "Virginia Beach", state: "VA", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.8, medianPrice: 325000, rentToPriceRatio: 0.0062 },
  { name: "Jacksonville", state: "FL", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 7.0, medianPrice: 295000, rentToPriceRatio: 0.0065 },
  { name: "Orlando", state: "FL", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.5, medianPrice: 365000, rentToPriceRatio: 0.0060 },
  { name: "Atlanta", state: "GA", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.8, medianPrice: 385000, rentToPriceRatio: 0.0062 },
  { name: "Charlotte", state: "NC", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 7.0, medianPrice: 345000, rentToPriceRatio: 0.0065 },
  { name: "Nashville", state: "TN", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.2, medianPrice: 425000, rentToPriceRatio: 0.0058 },
  { name: "Raleigh", state: "NC", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.5, medianPrice: 395000, rentToPriceRatio: 0.0060 },
  { name: "Austin", state: "TX", region: "South", investmentProfile: ["appreciation"], avgCapRate: 5.5, medianPrice: 525000, rentToPriceRatio: 0.0052 },
  { name: "Dallas", state: "TX", region: "South", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.0, medianPrice: 385000, rentToPriceRatio: 0.0058 },
  { name: "Houston", state: "TX", region: "South", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.2, medianPrice: 285000, rentToPriceRatio: 0.0065 },
  { name: "San Antonio", state: "TX", region: "South", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.5, medianPrice: 265000, rentToPriceRatio: 0.0068 },
  { name: "Fort Worth", state: "TX", region: "South", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.3, medianPrice: 275000, rentToPriceRatio: 0.0066 },
  { name: "El Paso", state: "TX", region: "West", investmentProfile: ["cash_flow"], avgCapRate: 8.2, medianPrice: 195000, rentToPriceRatio: 0.0075 },
  { name: "Albuquerque", state: "NM", region: "West", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.8, medianPrice: 275000, rentToPriceRatio: 0.0072 },
  { name: "Tucson", state: "AZ", region: "West", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.5, medianPrice: 315000, rentToPriceRatio: 0.0069 },
  { name: "Las Vegas", state: "NV", region: "West", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.8, medianPrice: 425000, rentToPriceRatio: 0.0062 },
  { name: "Reno", state: "NV", region: "West", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.5, medianPrice: 485000, rentToPriceRatio: 0.0060 },
  { name: "Boise", state: "ID", region: "West", investmentProfile: ["appreciation"], avgCapRate: 5.8, medianPrice: 475000, rentToPriceRatio: 0.0055 },
  { name: "Salt Lake City", state: "UT", region: "West", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.2, medianPrice: 525000, rentToPriceRatio: 0.0058 },
  { name: "Denver", state: "CO", region: "West", investmentProfile: ["appreciation"], avgCapRate: 5.5, medianPrice: 575000, rentToPriceRatio: 0.0052 },
  { name: "Colorado Springs", state: "CO", region: "West", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.0, medianPrice: 425000, rentToPriceRatio: 0.0058 },
  { name: "Omaha", state: "NE", region: "Midwest", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.0, medianPrice: 235000, rentToPriceRatio: 0.0073 },
  { name: "Des Moines", state: "IA", region: "Midwest", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.8, medianPrice: 225000, rentToPriceRatio: 0.0071 },
  { name: "Cedar Rapids", state: "IA", region: "Midwest", investmentProfile: ["cash_flow"], avgCapRate: 8.2, medianPrice: 195000, rentToPriceRatio: 0.0075 },
  { name: "Grand Rapids", state: "MI", region: "Midwest", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.9, medianPrice: 225000, rentToPriceRatio: 0.0072 },
  { name: "Madison", state: "WI", region: "Midwest", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.8, medianPrice: 365000, rentToPriceRatio: 0.0062 },
  { name: "Minneapolis", state: "MN", region: "Midwest", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.5, medianPrice: 345000, rentToPriceRatio: 0.0060 },
  { name: "Fargo", state: "ND", region: "Midwest", investmentProfile: ["cash_flow"], avgCapRate: 8.5, medianPrice: 245000, rentToPriceRatio: 0.0078 },
  { name: "Sioux Falls", state: "SD", region: "Midwest", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 8.2, medianPrice: 265000, rentToPriceRatio: 0.0075 },
  { name: "Portland", state: "OR", region: "West", investmentProfile: ["appreciation"], avgCapRate: 5.2, medianPrice: 525000, rentToPriceRatio: 0.0050 },
  { name: "Spokane", state: "WA", region: "West", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.0, medianPrice: 385000, rentToPriceRatio: 0.0058 },
  { name: "Tacoma", state: "WA", region: "West", investmentProfile: ["appreciation", "hybrid"], avgCapRate: 6.2, medianPrice: 475000, rentToPriceRatio: 0.0060 },
  { name: "Sacramento", state: "CA", region: "West", investmentProfile: ["appreciation"], avgCapRate: 5.0, medianPrice: 575000, rentToPriceRatio: 0.0048 },
  { name: "Fresno", state: "CA", region: "West", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.0, medianPrice: 365000, rentToPriceRatio: 0.0065 },
  { name: "Bakersfield", state: "CA", region: "West", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.2, medianPrice: 345000, rentToPriceRatio: 0.0067 },
  { name: "Stockton", state: "CA", region: "West", investmentProfile: ["cash_flow", "hybrid"], avgCapRate: 7.5, medianPrice: 425000, rentToPriceRatio: 0.0070 },
];

export async function seedMarkets() {
  console.log("🌱 Seeding markets...");

  try {
    // Clear existing markets (optional - comment out if you want to keep existing data)
    // await db.delete(markets);

    // Insert markets
    const insertedMarkets = await db
      .insert(markets)
      .values(
        marketData.map((market) => ({
          name: market.name,
          state: market.state,
          region: market.region,
          investmentProfile: JSON.stringify(market.investmentProfile),
          avgCapRate: market.avgCapRate.toString(),
          medianPrice: market.medianPrice.toString(),
          rentToPriceRatio: market.rentToPriceRatio.toString(),
          active: true,
        }))
      )
      .returning();

    console.log(`✅ Successfully seeded ${insertedMarkets.length} markets`);
    return insertedMarkets;
  } catch (error) {
    console.error("❌ Error seeding markets:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedMarkets()
    .then(() => {
      console.log("Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

