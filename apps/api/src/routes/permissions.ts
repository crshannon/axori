/**
 * Permissions API Routes
 *
 * Provides endpoints for retrieving user permissions for portfolios.
 * All routes require authentication and validate portfolio access.
 *
 * This is Phase 4: UI Hooks - providing computed permissions for frontend use.
 */

import { Hono } from "hono";
import {
  requireAuth,
  getAuthenticatedUserId,
} from "../middleware/permissions";
import { withErrorHandling } from "../utils/errors";
import {
  buildPermissionContextFromDb,
  buildPermissionCheckResult,
  getAllowedPortfolioActions,
  PortfolioRole,
  PORTFOLIO_ROLE_LABELS,
  PORTFOLIO_ROLE_DESCRIPTIONS,
} from "@axori/permissions";

const permissionsRouter = new Hono();

/**
 * GET /api/permissions/:portfolioId
 *
 * Returns the current user's role and computed permissions for a portfolio.
 *
 * Security: Validates that the user has access to the portfolio before
 * returning any data. Returns 403 if the user is not a member.
 *
 * Response includes:
 * - portfolioId: The portfolio being checked
 * - role: The user's role in the portfolio (owner, admin, member, viewer)
 * - roleLabel: Human-readable role label
 * - roleDescription: Description of what the role can do
 * - propertyAccess: Property-level access restrictions (null = full access)
 * - permissions: Computed boolean flags for all permission checks
 * - allowedActions: List of portfolio actions the user can perform
 */
permissionsRouter.get(
  "/:portfolioId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const portfolioId = c.req.param("portfolioId");

    // Validate portfolioId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(portfolioId)) {
      return c.json({ error: "Invalid portfolio ID format" }, 400);
    }

    // Build permission context from database
    // This checks if user has access to the portfolio
    const context = await buildPermissionContextFromDb(userId, portfolioId);

    if (!context) {
      // User is not a member of this portfolio
      return c.json(
        { error: "You don't have access to this portfolio" },
        403
      );
    }

    // Build complete permission check result
    const permissions = buildPermissionCheckResult(context);

    // Get allowed portfolio actions for this role
    const allowedActions = getAllowedPortfolioActions(context.role);

    // Return comprehensive permission data
    return c.json({
      portfolioId,
      role: context.role,
      roleLabel: PORTFOLIO_ROLE_LABELS[context.role as PortfolioRole],
      roleDescription: PORTFOLIO_ROLE_DESCRIPTIONS[context.role as PortfolioRole],
      propertyAccess: context.propertyAccess,
      permissions,
      allowedActions,
    });
  }, { operation: "getPortfolioPermissions" })
);

/**
 * GET /api/permissions/:portfolioId/property/:propertyId
 *
 * Returns the current user's permissions for a specific property within a portfolio.
 *
 * Security: Validates that the user has access to both the portfolio and the
 * specific property before returning any data.
 *
 * Response includes:
 * - portfolioId: The portfolio containing the property
 * - propertyId: The property being checked
 * - role: The user's role in the portfolio
 * - permissions: Property-specific permission flags (canView, canEdit, canManage, canDelete)
 */
permissionsRouter.get(
  "/:portfolioId/property/:propertyId",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const portfolioId = c.req.param("portfolioId");
    const propertyId = c.req.param("propertyId");

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(portfolioId)) {
      return c.json({ error: "Invalid portfolio ID format" }, 400);
    }
    if (!uuidRegex.test(propertyId)) {
      return c.json({ error: "Invalid property ID format" }, 400);
    }

    // Import the helper for property permission checking
    const { buildPropertyPermissionCheckResult } = await import("@axori/permissions");

    // Build permission context from database
    const context = await buildPermissionContextFromDb(userId, portfolioId);

    if (!context) {
      return c.json(
        { error: "You don't have access to this portfolio" },
        403
      );
    }

    // Build property-specific permission check
    const propertyPermissions = buildPropertyPermissionCheckResult(context, propertyId);

    // Check if user has any access to this property
    if (!propertyPermissions.canView) {
      return c.json(
        { error: "You don't have access to this property" },
        403
      );
    }

    return c.json({
      portfolioId,
      propertyId,
      role: context.role,
      roleLabel: PORTFOLIO_ROLE_LABELS[context.role as PortfolioRole],
      permissions: {
        canView: propertyPermissions.canView,
        canEdit: propertyPermissions.canEdit,
        canManage: propertyPermissions.canManage,
        canDelete: propertyPermissions.canDelete,
        all: propertyPermissions.permissions,
      },
    });
  }, { operation: "getPropertyPermissions" })
);

export default permissionsRouter;
