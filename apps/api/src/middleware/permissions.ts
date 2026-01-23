/**
 * Permission Middleware for API Routes
 *
 * Provides withPermission middleware for route protection using
 * the @axori/permissions package.
 *
 * @example
 * // Check minimum role requirement
 * router.get("/properties", withPermission({ minimumRole: "viewer" }), handler);
 *
 * // Check specific portfolio action
 * router.post("/members", withPermission({ portfolioAction: "invite_members" }), handler);
 *
 * // Check property-level permission
 * router.put("/:id", withPermission({ propertyPermission: "edit" }), handler);
 */

import { Context, Next } from "hono";
import { db, users, eq } from "@axori/db";
import {
  PortfolioRole,
  PortfolioAction,
  PropertyPermission,
  checkPermission,
  getUserPortfolioMembership,
  checkPropertyPermission,
  canPerformPortfolioAction,
  buildPermissionCheckResult,
} from "@axori/permissions";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for permission checking middleware
 */
export interface PermissionOptions {
  /**
   * Minimum role required to access the route.
   * Uses role hierarchy: owner > admin > member > viewer
   */
  minimumRole?: PortfolioRole;

  /**
   * Specific portfolio-level action required.
   * Examples: "invite_members", "add_properties", "delete_portfolio"
   */
  portfolioAction?: PortfolioAction;

  /**
   * Specific property-level permission required.
   * Requires propertyIdParam to be set.
   * Examples: "view", "edit", "manage", "delete"
   */
  propertyPermission?: PropertyPermission;

  /**
   * Name of the route parameter containing the portfolio ID.
   * Defaults to "portfolioId".
   */
  portfolioIdParam?: string;

  /**
   * Name of the route parameter containing the property ID.
   * Used when checking property-level permissions.
   * Defaults to "propertyId" or "id".
   */
  propertyIdParam?: string;

  /**
   * Whether to skip permission check if no portfolio context is found.
   * Useful for routes that may or may not have portfolio context.
   * Defaults to false.
   */
  allowNoPortfolio?: boolean;

  /**
   * Custom error message for permission denied.
   */
  errorMessage?: string;
}

/**
 * Extended context with authentication information.
 * Note: Different from @axori/permissions PermissionContext which is for permission checking.
 */
export interface AuthContext {
  userId: string;
  userDbId: string; // Internal UUID
  portfolioId?: string;
  role?: PortfolioRole;
  permissions?: ReturnType<typeof buildPermissionCheckResult>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract user ID from authorization header and resolve to database user.
 * Returns null if no valid user found.
 */
export async function getUserFromRequest(c: Context): Promise<{
  clerkId: string;
  dbUser: { id: string; email: string; firstName: string | null; lastName: string | null };
} | null> {
  const authHeader = c.req.header("Authorization");
  const clerkId = authHeader?.replace("Bearer ", "");

  if (!clerkId) {
    return null;
  }

  const [dbUser] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!dbUser) {
    return null;
  }

  return { clerkId, dbUser };
}

/**
 * Extract portfolio ID from the request.
 * Tries route params, query params, and request body.
 */
export async function getPortfolioIdFromRequest(
  c: Context,
  paramName: string = "portfolioId"
): Promise<string | undefined> {
  // 1. Try route params
  const routeParam = c.req.param(paramName);
  if (routeParam) {
    return routeParam;
  }

  // 2. Try query params
  const queryParam = c.req.query(paramName);
  if (queryParam) {
    return queryParam;
  }

  // 3. Try request body for POST/PUT/PATCH
  if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
    try {
      const contentType = c.req.header("Content-Type");
      if (contentType?.includes("application/json")) {
        const body = await c.req.json();
        if (body && typeof body === "object" && paramName in body) {
          return body[paramName];
        }
      }
    } catch {
      // Ignore body parsing errors
    }
  }

  return undefined;
}

/**
 * Extract property ID from the request.
 */
export function getPropertyIdFromRequest(
  c: Context,
  paramName: string = "id"
): string | undefined {
  // Try the specified param first
  const param = c.req.param(paramName);
  if (param) {
    return param;
  }

  // Also try "propertyId" as fallback
  if (paramName !== "propertyId") {
    const propertyIdParam = c.req.param("propertyId");
    if (propertyIdParam) {
      return propertyIdParam;
    }
  }

  return undefined;
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Permission checking middleware factory.
 *
 * Creates a Hono middleware that enforces permissions based on the provided options.
 *
 * @param options Permission requirements for the route
 * @returns Hono middleware function
 *
 * @example
 * // Require at least member role
 * router.get("/data", withPermission({ minimumRole: "member" }), handler);
 *
 * // Require invite_members action permission
 * router.post("/invite", withPermission({ portfolioAction: "invite_members" }), handler);
 *
 * // Require edit permission on specific property
 * router.put("/properties/:id", withPermission({ propertyPermission: "edit" }), handler);
 */
export function withPermission(options: PermissionOptions = {}) {
  const {
    minimumRole,
    portfolioAction,
    propertyPermission,
    portfolioIdParam = "portfolioId",
    propertyIdParam = "id",
    allowNoPortfolio = false,
    errorMessage,
  } = options;

  return async (c: Context, next: Next) => {
    // 1. Authenticate user
    const userResult = await getUserFromRequest(c);
    if (!userResult) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { dbUser } = userResult;

    // Store user info in context for handlers
    c.set("userId", dbUser.id);
    c.set("user", dbUser);

    // 2. Get portfolio ID
    const portfolioId = await getPortfolioIdFromRequest(c, portfolioIdParam);

    // If no portfolio ID and we're not allowing that, error
    if (!portfolioId && !allowNoPortfolio) {
      // For property routes, we might need to look up the portfolio from the property
      const propertyId = getPropertyIdFromRequest(c, propertyIdParam);
      if (propertyId && propertyPermission) {
        // We'll handle this in the property permission check below
      } else if (minimumRole || portfolioAction) {
        return c.json(
          { error: errorMessage || "Portfolio ID is required" },
          400
        );
      }
    }

    // Store portfolio ID in context
    if (portfolioId) {
      c.set("portfolioId", portfolioId);
    }

    // 3. If we have a portfolio ID, check portfolio-level permissions
    if (portfolioId) {
      // Get user's membership for this portfolio
      const membership = await getUserPortfolioMembership(dbUser.id, portfolioId);

      if (!membership) {
        return c.json(
          { error: errorMessage || "You don't have access to this portfolio" },
          403
        );
      }

      // Store membership info in context
      c.set("role", membership.role);
      c.set("membership", membership);

      // Check minimum role requirement
      if (minimumRole) {
        const hasPermission = await checkPermission(
          dbUser.id,
          portfolioId,
          minimumRole
        );
        if (!hasPermission) {
          return c.json(
            {
              error:
                errorMessage ||
                `This action requires at least ${minimumRole} role`,
            },
            403
          );
        }
      }

      // Check portfolio action requirement
      if (portfolioAction) {
        const canPerform = canPerformPortfolioAction(
          membership.role as PortfolioRole,
          portfolioAction
        );
        if (!canPerform) {
          return c.json(
            {
              error:
                errorMessage ||
                `You don't have permission to perform this action`,
            },
            403
          );
        }
      }
    }

    // 4. If property permission is required, check property-level access
    if (propertyPermission) {
      const propertyId = getPropertyIdFromRequest(c, propertyIdParam);

      if (!propertyId) {
        return c.json(
          { error: errorMessage || "Property ID is required" },
          400
        );
      }

      // For property permission checks, we need to look up the property's portfolio
      // if we don't already have a portfolioId
      let effectivePortfolioId = portfolioId;

      if (!effectivePortfolioId) {
        // Look up the property to get its portfolio
        const { properties } = await import("@axori/db/src/schema");
        const [property] = await db
          .select({ portfolioId: properties.portfolioId })
          .from(properties)
          .where(eq(properties.id, propertyId))
          .limit(1);

        if (!property) {
          return c.json({ error: "Property not found" }, 404);
        }

        effectivePortfolioId = property.portfolioId;
        c.set("portfolioId", effectivePortfolioId);
      }

      // Check property-level permission
      const hasPropertyPermission = await checkPropertyPermission(
        dbUser.id,
        effectivePortfolioId,
        propertyId,
        propertyPermission
      );

      if (!hasPropertyPermission) {
        return c.json(
          {
            error:
              errorMessage ||
              `You don't have ${propertyPermission} permission for this property`,
          },
          403
        );
      }

      c.set("propertyId", propertyId);
    }

    // 5. Continue to the route handler
    await next();
  };
}

/**
 * Simple authentication middleware that only checks if user is logged in.
 * Does not check any permissions.
 */
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const userResult = await getUserFromRequest(c);
    if (!userResult) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("userId", userResult.dbUser.id);
    c.set("user", userResult.dbUser);

    await next();
  };
}

/**
 * Get the authenticated user's DB ID from context.
 * Throws if not authenticated (should be used after auth middleware).
 */
export function getAuthenticatedUserId(c: Context): string {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error("User not authenticated - missing userId in context");
  }
  return userId;
}

/**
 * Get the portfolio ID from context.
 * Returns undefined if not set.
 */
export function getPortfolioId(c: Context): string | undefined {
  return c.get("portfolioId");
}

/**
 * Get the user's role in the current portfolio context.
 * Returns undefined if not set.
 */
export function getUserRole(c: Context): PortfolioRole | undefined {
  return c.get("role");
}
