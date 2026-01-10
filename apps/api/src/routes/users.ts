import { Hono } from "hono";
import { db } from "@axori/db";
import { users, userMarkets, markets, portfolios, userPortfolios } from "@axori/db/src/schema";
import { eq } from "@axori/db";

const usersRouter = new Hono();

// POST /api/users - Create or get user
usersRouter.post("/", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { email, firstName, lastName } = body;

  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existingUser) {
    // User exists, return it
    return c.json({
      id: existingUser.id,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      clerkId: existingUser.clerkId,
    });
  }

  // Create new user
  try {
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
      })
      .returning();

    // Auto-create default portfolio for new user
    const portfolioName = firstName && lastName
      ? `${firstName} ${lastName}'s Portfolio`
      : `${email.split('@')[0]}'s Portfolio`;

    const [defaultPortfolio] = await db
      .insert(portfolios)
      .values({
        name: portfolioName,
        description: "Default portfolio",
        createdBy: newUser.id,
      })
      .returning();

    // Create user-portfolio relationship with owner role
    await db.insert(userPortfolios).values({
      userId: newUser.id,
      portfolioId: defaultPortfolio.id,
      role: "owner",
    });

    return c.json(
      {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        clerkId: newUser.clerkId,
        defaultPortfolioId: defaultPortfolio.id,
      },
      201
    );
  } catch (error: any) {
    // Handle unique constraint violation (email or clerkId already exists)
    if (error.code === "23505") {
      // Try to find the existing user
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

      if (existing) {
        return c.json({
          id: existing.id,
          email: existing.email,
          firstName: existing.firstName,
          lastName: existing.lastName,
          clerkId: existing.clerkId,
        });
      }
    }
    console.error("Error creating user:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// GET /api/users/me - Get current user
usersRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Ensure user has a default portfolio (create if missing)
  const userPortfoliosList = await db
    .select()
    .from(userPortfolios)
    .where(eq(userPortfolios.userId, user.id))
    .limit(1);

  if (userPortfoliosList.length === 0) {
    // User exists but has no portfolio - create default one
    const portfolioName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}'s Portfolio`
      : `${user.email.split('@')[0]}'s Portfolio`;

    const [defaultPortfolio] = await db
      .insert(portfolios)
      .values({
        name: portfolioName,
        description: "Default portfolio",
        createdBy: user.id,
      })
      .returning();

    await db.insert(userPortfolios).values({
      userId: user.id,
      portfolioId: defaultPortfolio.id,
      role: "owner",
    });
  }

  return c.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    clerkId: user.clerkId,
  });
});

// GET /api/users/me/portfolio - Get current user's default portfolio
usersRouter.get("/me/portfolio", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get user's portfolios (prefer owner role, or first one)
  const userPortfoliosList = await db
    .select({
      portfolioId: userPortfolios.portfolioId,
      role: userPortfolios.role,
      portfolio: {
        id: portfolios.id,
        name: portfolios.name,
        description: portfolios.description,
        createdBy: portfolios.createdBy,
        createdAt: portfolios.createdAt,
        updatedAt: portfolios.updatedAt,
      },
    })
    .from(userPortfolios)
    .innerJoin(portfolios, eq(userPortfolios.portfolioId, portfolios.id))
    .where(eq(userPortfolios.userId, user.id));

  if (userPortfoliosList.length === 0) {
    // No portfolio found - create default one (shouldn't happen but handle gracefully)
    const portfolioName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}'s Portfolio`
      : `${user.email.split('@')[0]}'s Portfolio`;

    const [defaultPortfolio] = await db
      .insert(portfolios)
      .values({
        name: portfolioName,
        description: "Default portfolio",
        createdBy: user.id,
      })
      .returning();

    await db.insert(userPortfolios).values({
      userId: user.id,
      portfolioId: defaultPortfolio.id,
      role: "owner",
    });

    return c.json({
      id: defaultPortfolio.id,
      name: defaultPortfolio.name,
      description: defaultPortfolio.description,
      role: "owner",
    });
  }

  // Prefer owner role, otherwise return first portfolio
  const ownerPortfolio = userPortfoliosList.find((up) => up.role === "owner");
  const defaultPortfolio = ownerPortfolio || userPortfoliosList[0];

  return c.json({
    id: defaultPortfolio.portfolio.id,
    name: defaultPortfolio.portfolio.name,
    description: defaultPortfolio.portfolio.description,
    role: defaultPortfolio.role,
  });
});

// GET /api/users/me/markets - Get current user's markets
usersRouter.get("/me/markets", async (c) => {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get user markets with market details
  const userMarketsList = await db
    .select({
      id: userMarkets.id,
      userId: userMarkets.userId,
      marketId: userMarkets.marketId,
      relationshipType: userMarkets.relationshipType,
      createdAt: userMarkets.createdAt,
      market: {
        id: markets.id,
        name: markets.name,
        state: markets.state,
        region: markets.region,
        investmentProfile: markets.investmentProfile,
        avgCapRate: markets.avgCapRate,
        medianPrice: markets.medianPrice,
        rentToPriceRatio: markets.rentToPriceRatio,
        active: markets.active,
        createdAt: markets.createdAt,
        updatedAt: markets.updatedAt,
      },
    })
    .from(userMarkets)
    .innerJoin(markets, eq(userMarkets.marketId, markets.id))
    .where(eq(userMarkets.userId, user.id));

  // Parse investment profiles from JSON strings
  const parsedMarkets = userMarketsList.map((um) => {
    let investmentProfile: string[] = [];
    if (um.market.investmentProfile) {
      try {
        investmentProfile = JSON.parse(um.market.investmentProfile);
      } catch {
        investmentProfile = [];
      }
    }

    return {
      id: um.id,
      userId: um.userId,
      marketId: um.marketId,
      relationshipType: um.relationshipType,
      createdAt: um.createdAt,
      market: {
        ...um.market,
        investmentProfile,
        avgCapRate: um.market.avgCapRate
          ? parseFloat(um.market.avgCapRate)
          : null,
        medianPrice: um.market.medianPrice
          ? parseFloat(um.market.medianPrice)
          : null,
        rentToPriceRatio: um.market.rentToPriceRatio
          ? parseFloat(um.market.rentToPriceRatio)
          : null,
      },
    };
  });

  return c.json(parsedMarkets);
});

export default usersRouter;

