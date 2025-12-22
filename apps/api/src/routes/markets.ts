import { Hono } from "hono";
import { db } from "@axori/db";
import { markets } from "@axori/db/src/schema";
import { eq, ilike, and, or, sql, desc, inArray } from "drizzle-orm";

const marketsRouter = new Hono();

// GET /api/markets - Get list of markets with optional filters
marketsRouter.get("/", async (c) => {
  const search = c.req.query("search");
  const state = c.req.query("state");
  const investmentProfile = c.req.query("investment_profile");
  const active = c.req.query("active");
  const trending = c.req.query("trending");
  const ids = c.req.query("ids"); // Comma-separated market IDs

  // If trending is requested and no filters are applied, return top 4 markets by cap rate
  if (trending === "true" && !search && !state && !investmentProfile) {
    const results = await db
      .select()
      .from(markets)
      .where(eq(markets.active, true))
      .orderBy(desc(markets.avgCapRate))
      .limit(4);

    const marketsWithParsedProfiles = results.map((market) => {
      let investmentProfile: string[] = [];
      if (market.investmentProfile) {
        try {
          investmentProfile = JSON.parse(market.investmentProfile);
        } catch {
          investmentProfile = [];
        }
      }

      return {
        id: market.id,
        name: market.name,
        state: market.state,
        region: market.region,
        investmentProfile,
        avgCapRate: market.avgCapRate ? parseFloat(market.avgCapRate) : null,
        medianPrice: market.medianPrice ? parseFloat(market.medianPrice) : null,
        rentToPriceRatio: market.rentToPriceRatio
          ? parseFloat(market.rentToPriceRatio)
          : null,
        active: market.active,
        createdAt: market.createdAt,
        updatedAt: market.updatedAt,
      };
    });

    return c.json(marketsWithParsedProfiles);
  }

  // Build query conditions
  const conditions = [];

  // Filter by active status (default to true if not specified)
  if (active === "false") {
    conditions.push(eq(markets.active, false));
  } else {
    conditions.push(eq(markets.active, true));
  }

  // Filter by IDs if provided
  if (ids) {
    const idArray = ids.split(",").map((id) => id.trim()).filter(Boolean);
    if (idArray.length > 0) {
      conditions.push(inArray(markets.id, idArray));
    }
  }

  // Search by name or state
  if (search) {
    conditions.push(
      or(
        ilike(markets.name, `%${search}%`),
        ilike(markets.state, `%${search}%`)
      )!
    );
  }

  // Filter by state
  if (state) {
    conditions.push(eq(markets.state, state));
  }

  // Filter by investment profile (check if JSON array contains the profile)
  if (investmentProfile) {
    conditions.push(
      sql`${markets.investmentProfile}::text LIKE ${`%${investmentProfile}%`}`
    );
  }

  // Execute query
  const results = await db
    .select()
    .from(markets)
    .where(and(...conditions))
    .orderBy(markets.name);

  // Parse investment profiles from JSON strings
  const marketsWithParsedProfiles = results.map((market) => {
    let investmentProfile: string[] = [];
    if (market.investmentProfile) {
      try {
        investmentProfile = JSON.parse(market.investmentProfile);
      } catch {
        investmentProfile = [];
      }
    }

    return {
      id: market.id,
      name: market.name,
      state: market.state,
      region: market.region,
      investmentProfile,
      avgCapRate: market.avgCapRate ? parseFloat(market.avgCapRate) : null,
      medianPrice: market.medianPrice ? parseFloat(market.medianPrice) : null,
      rentToPriceRatio: market.rentToPriceRatio
        ? parseFloat(market.rentToPriceRatio)
        : null,
      active: market.active,
      createdAt: market.createdAt,
      updatedAt: market.updatedAt,
    };
  });

  return c.json(marketsWithParsedProfiles);
});

export default marketsRouter;

