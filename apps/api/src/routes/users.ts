/**
 * User API Routes
 *
 * Provides endpoints for user management and user-specific data.
 * All routes require authentication.
 */

import { Hono } from "hono";
import { db, eq } from "@axori/db";
import { users, userMarkets, markets, portfolios, userPortfolios } from "@axori/db/src/schema";
import { requireAuth, getAuthenticatedUserId } from "../middleware/permissions";
import { withErrorHandling } from "../utils/errors";

const usersRouter = new Hono();

// POST /api/users - Create or get user
// This is called during login/signup flow before the user exists
// Cannot use requireAuth() because the user may not exist yet
usersRouter.post(
  "/",
  withErrorHandling(async (c) => {
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
  }, { operation: "createUser" })
);

// GET /api/users/me - Get current user
usersRouter.get(
  "/me",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const user = c.get("user");

    // Ensure user has a default portfolio (create if missing)
    const userPortfoliosList = await db
      .select()
      .from(userPortfolios)
      .where(eq(userPortfolios.userId, userId))
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
          createdBy: userId,
        })
        .returning();

      await db.insert(userPortfolios).values({
        userId: userId,
        portfolioId: defaultPortfolio.id,
        role: "owner",
      });
    }

    return c.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }, { operation: "getCurrentUser" })
);

// GET /api/users/me/portfolio - Get current user's default portfolio
usersRouter.get(
  "/me/portfolio",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const user = c.get("user");

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
      .where(eq(userPortfolios.userId, userId));

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
          createdBy: userId,
        })
        .returning();

      await db.insert(userPortfolios).values({
        userId: userId,
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
  }, { operation: "getUserPortfolio" })
);

// GET /api/users/me/portfolios - Get all portfolios the user has access to
usersRouter.get(
  "/me/portfolios",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

    const userPortfoliosList = await db
      .select({
        portfolioId: userPortfolios.portfolioId,
        role: userPortfolios.role,
        propertyAccess: userPortfolios.propertyAccess,
        invitedAt: userPortfolios.invitedAt,
        acceptedAt: userPortfolios.acceptedAt,
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
      .where(eq(userPortfolios.userId, userId));

    const portfoliosWithRole = userPortfoliosList.map((up) => ({
      ...up.portfolio,
      role: up.role,
      propertyAccess: up.propertyAccess,
      invitedAt: up.invitedAt,
      acceptedAt: up.acceptedAt,
    }));

    return c.json({ portfolios: portfoliosWithRole });
  }, { operation: "getUserPortfolios" })
);

// GET /api/users/me/markets - Get current user's markets
usersRouter.get(
  "/me/markets",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);

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
      .where(eq(userMarkets.userId, userId));

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
  }, { operation: "getUserMarkets" })
);

// GET /api/users/me/permissions/:portfolioId - Get user's permissions for a specific portfolio
usersRouter.get(
  "/me/permissions/:portfolioId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const portfolioId = c.req.param("portfolioId");

    // Import permission helpers
    const { buildPermissionCheckResult, buildPermissionContextFromDb } = await import("@axori/permissions");

    const context = await buildPermissionContextFromDb(userId, portfolioId);

    if (!context) {
      return c.json({ error: "You don't have access to this portfolio" }, 403);
    }

    const permissions = buildPermissionCheckResult(context);

    return c.json({
      portfolioId,
      role: context.role,
      propertyAccess: context.propertyAccess,
      permissions,
    });
  }, { operation: "getUserPermissions" })
);

export default usersRouter;
