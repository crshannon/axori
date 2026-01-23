/**
 * Portfolio API Routes
 *
 * Provides endpoints for portfolio management and member management.
 * All routes are protected by permission middleware.
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  portfolios,
  userPortfolios,
  users,
  properties,
  permissionAuditLog,
  eq,
  and,
} from "@axori/db";
import {
  PortfolioRole,
  canManageRole,
  getAssignableRoles,
} from "@axori/permissions";
import {
  withPermission,
  requireAuth,
  getAuthenticatedUserId,
  getUserRole,
} from "../middleware/permissions";
import { withErrorHandling } from "../utils/errors";

const portfoliosRouter = new Hono();

// ============================================================================
// Validation Schemas
// ============================================================================

const createPortfolioSchema = z.object({
  name: z.string().min(1, "Portfolio name is required").max(100),
  description: z.string().max(500).optional(),
});

const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

const inviteMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "member", "viewer"] as const),
  propertyAccess: z
    .record(
      z.string().uuid(),
      z.array(z.enum(["view", "edit", "manage", "delete"]))
    )
    .nullable()
    .optional(),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"] as const),
  propertyAccess: z
    .record(
      z.string().uuid(),
      z.array(z.enum(["view", "edit", "manage", "delete"]))
    )
    .nullable()
    .optional(),
});

// ============================================================================
// Portfolio CRUD Routes
// ============================================================================

/**
 * GET /api/portfolios
 * List all portfolios the user has access to
 */
portfoliosRouter.get(
  "/",
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

    // Add property count for each portfolio
    const portfoliosWithCounts = await Promise.all(
      userPortfoliosList.map(async (up) => {
        const [countResult] = await db
          .select({ count: db.$count(properties, eq(properties.portfolioId, up.portfolioId)) })
          .from(properties)
          .where(eq(properties.portfolioId, up.portfolioId));

        return {
          ...up.portfolio,
          role: up.role,
          propertyAccess: up.propertyAccess,
          invitedAt: up.invitedAt,
          acceptedAt: up.acceptedAt,
          propertyCount: Number(countResult?.count || 0),
        };
      })
    );

    return c.json({ portfolios: portfoliosWithCounts });
  }, { operation: "listPortfolios" })
);

/**
 * GET /api/portfolios/:portfolioId
 * Get a single portfolio with details
 */
portfoliosRouter.get(
  "/:portfolioId",
  withPermission({ minimumRole: "viewer" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");

    // Get portfolio details
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .limit(1);

    if (!portfolio) {
      return c.json({ error: "Portfolio not found" }, 404);
    }

    // Get member count
    const [memberCountResult] = await db
      .select({ count: db.$count(userPortfolios, eq(userPortfolios.portfolioId, portfolioId)) })
      .from(userPortfolios)
      .where(eq(userPortfolios.portfolioId, portfolioId));

    // Get property count
    const [propertyCountResult] = await db
      .select({ count: db.$count(properties, eq(properties.portfolioId, portfolioId)) })
      .from(properties)
      .where(eq(properties.portfolioId, portfolioId));

    // Get user's role in this portfolio
    const role = getUserRole(c);

    return c.json({
      portfolio: {
        ...portfolio,
        memberCount: Number(memberCountResult?.count || 0),
        propertyCount: Number(propertyCountResult?.count || 0),
        userRole: role,
      },
    });
  }, { operation: "getPortfolio" })
);

/**
 * POST /api/portfolios
 * Create a new portfolio
 */
portfoliosRouter.post(
  "/",
  requireAuth(),
  withErrorHandling(async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();

    const validated = createPortfolioSchema.parse(body);

    // Create portfolio
    const [newPortfolio] = await db
      .insert(portfolios)
      .values({
        name: validated.name,
        description: validated.description || null,
        createdBy: userId,
      })
      .returning();

    // Add creator as owner
    await db.insert(userPortfolios).values({
      userId,
      portfolioId: newPortfolio.id,
      role: "owner",
    });

    return c.json({ portfolio: newPortfolio }, 201);
  }, { operation: "createPortfolio" })
);

/**
 * PUT /api/portfolios/:portfolioId
 * Update portfolio details
 */
portfoliosRouter.put(
  "/:portfolioId",
  withPermission({ portfolioAction: "edit_portfolio" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");
    const body = await c.req.json();

    const validated = updatePortfolioSchema.parse(body);

    const [updated] = await db
      .update(portfolios)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(portfolios.id, portfolioId))
      .returning();

    if (!updated) {
      return c.json({ error: "Portfolio not found" }, 404);
    }

    return c.json({ portfolio: updated });
  }, { operation: "updatePortfolio" })
);

/**
 * DELETE /api/portfolios/:portfolioId
 * Delete a portfolio (only owner can do this)
 */
portfoliosRouter.delete(
  "/:portfolioId",
  withPermission({ portfolioAction: "delete_portfolio" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");

    // Delete portfolio (cascade will remove userPortfolios and properties)
    const [deleted] = await db
      .delete(portfolios)
      .where(eq(portfolios.id, portfolioId))
      .returning();

    if (!deleted) {
      return c.json({ error: "Portfolio not found" }, 404);
    }

    return c.json({ message: "Portfolio deleted successfully" });
  }, { operation: "deletePortfolio" })
);

// ============================================================================
// Member Management Routes
// ============================================================================

/**
 * GET /api/portfolios/:portfolioId/members
 * List all members of a portfolio
 */
portfoliosRouter.get(
  "/:portfolioId/members",
  withPermission({ minimumRole: "viewer" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");

    const members = await db
      .select({
        id: userPortfolios.id,
        userId: userPortfolios.userId,
        role: userPortfolios.role,
        propertyAccess: userPortfolios.propertyAccess,
        invitedBy: userPortfolios.invitedBy,
        invitedAt: userPortfolios.invitedAt,
        acceptedAt: userPortfolios.acceptedAt,
        createdAt: userPortfolios.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(userPortfolios)
      .innerJoin(users, eq(userPortfolios.userId, users.id))
      .where(eq(userPortfolios.portfolioId, portfolioId));

    // Get inviter info for each member
    const membersWithInviter = await Promise.all(
      members.map(async (member) => {
        let inviter = null;
        if (member.invitedBy) {
          const [inviterUser] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(eq(users.id, member.invitedBy))
            .limit(1);
          inviter = inviterUser || null;
        }
        return {
          ...member,
          inviter,
        };
      })
    );

    return c.json({ members: membersWithInviter });
  }, { operation: "listMembers" })
);

/**
 * GET /api/portfolios/:portfolioId/members/:memberId
 * Get a single member's details
 */
portfoliosRouter.get(
  "/:portfolioId/members/:memberId",
  withPermission({ minimumRole: "viewer" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");
    const memberId = c.req.param("memberId");

    const [member] = await db
      .select({
        id: userPortfolios.id,
        userId: userPortfolios.userId,
        role: userPortfolios.role,
        propertyAccess: userPortfolios.propertyAccess,
        invitedBy: userPortfolios.invitedBy,
        invitedAt: userPortfolios.invitedAt,
        acceptedAt: userPortfolios.acceptedAt,
        createdAt: userPortfolios.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(userPortfolios)
      .innerJoin(users, eq(userPortfolios.userId, users.id))
      .where(
        and(
          eq(userPortfolios.portfolioId, portfolioId),
          eq(userPortfolios.id, memberId)
        )
      )
      .limit(1);

    if (!member) {
      return c.json({ error: "Member not found" }, 404);
    }

    return c.json({ member });
  }, { operation: "getMember" })
);

/**
 * POST /api/portfolios/:portfolioId/members
 * Invite a new member to the portfolio
 */
portfoliosRouter.post(
  "/:portfolioId/members",
  withPermission({ portfolioAction: "invite_members" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");
    const userId = getAuthenticatedUserId(c);
    const currentRole = getUserRole(c);
    const body = await c.req.json();

    const validated = inviteMemberSchema.parse(body);

    // Check if user can assign the requested role
    if (currentRole && !canManageRole(currentRole, validated.role)) {
      return c.json(
        {
          error: `You cannot assign the ${validated.role} role. You can only assign: ${getAssignableRoles(currentRole).join(", ")}`,
        },
        403
      );
    }

    // Find the user by email
    const [invitedUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (!invitedUser) {
      return c.json(
        {
          error: "User not found. They must have an account before being invited.",
        },
        404
      );
    }

    // Check if user is already a member
    const [existingMembership] = await db
      .select()
      .from(userPortfolios)
      .where(
        and(
          eq(userPortfolios.userId, invitedUser.id),
          eq(userPortfolios.portfolioId, portfolioId)
        )
      )
      .limit(1);

    if (existingMembership) {
      return c.json({ error: "User is already a member of this portfolio" }, 409);
    }

    // Create the membership
    const [newMembership] = await db
      .insert(userPortfolios)
      .values({
        userId: invitedUser.id,
        portfolioId,
        role: validated.role,
        propertyAccess: validated.propertyAccess || null,
        invitedBy: userId,
        invitedAt: new Date(),
        acceptedAt: new Date(), // Auto-accept for now (future: pending invitations)
      })
      .returning();

    // Log the invitation in audit log
    await db.insert(permissionAuditLog).values({
      userId: invitedUser.id,
      portfolioId,
      action: "invitation_sent",
      oldValue: null,
      newValue: JSON.stringify({
        role: validated.role,
        propertyAccess: validated.propertyAccess,
      }),
      changedBy: userId,
    });

    return c.json(
      {
        member: {
          ...newMembership,
          user: {
            id: invitedUser.id,
            email: invitedUser.email,
            firstName: invitedUser.firstName,
            lastName: invitedUser.lastName,
          },
        },
      },
      201
    );
  }, { operation: "inviteMember" })
);

/**
 * PUT /api/portfolios/:portfolioId/members/:memberId
 * Update a member's role or property access
 */
portfoliosRouter.put(
  "/:portfolioId/members/:memberId",
  withPermission({ portfolioAction: "change_member_roles" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");
    const memberId = c.req.param("memberId");
    const userId = getAuthenticatedUserId(c);
    const currentRole = getUserRole(c);
    const body = await c.req.json();

    const validated = updateMemberRoleSchema.parse(body);

    // Get the current membership
    const [membership] = await db
      .select()
      .from(userPortfolios)
      .where(
        and(
          eq(userPortfolios.id, memberId),
          eq(userPortfolios.portfolioId, portfolioId)
        )
      )
      .limit(1);

    if (!membership) {
      return c.json({ error: "Member not found" }, 404);
    }

    // Cannot modify owner's role
    if (membership.role === "owner") {
      return c.json({ error: "Cannot modify owner's role" }, 403);
    }

    // Cannot modify your own role
    if (membership.userId === userId) {
      return c.json({ error: "Cannot modify your own role" }, 403);
    }

    // Check if user can manage the current role
    if (currentRole && !canManageRole(currentRole, membership.role as PortfolioRole)) {
      return c.json(
        { error: `You cannot modify users with the ${membership.role} role` },
        403
      );
    }

    // Check if user can assign the new role
    if (currentRole && validated.role && !canManageRole(currentRole, validated.role)) {
      return c.json(
        {
          error: `You cannot assign the ${validated.role} role. You can only assign: ${getAssignableRoles(currentRole).join(", ")}`,
        },
        403
      );
    }

    // Update the membership
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.role) {
      updateData.role = validated.role;
    }
    if (validated.propertyAccess !== undefined) {
      updateData.propertyAccess = validated.propertyAccess;
    }

    const [updated] = await db
      .update(userPortfolios)
      .set(updateData)
      .where(eq(userPortfolios.id, memberId))
      .returning();

    // Log the role change in audit log
    await db.insert(permissionAuditLog).values({
      userId: membership.userId,
      portfolioId,
      action: "role_change",
      oldValue: JSON.stringify({
        role: membership.role,
        propertyAccess: membership.propertyAccess,
      }),
      newValue: JSON.stringify({
        role: validated.role || membership.role,
        propertyAccess: validated.propertyAccess !== undefined
          ? validated.propertyAccess
          : membership.propertyAccess,
      }),
      changedBy: userId,
    });

    return c.json({ member: updated });
  }, { operation: "updateMemberRole" })
);

/**
 * DELETE /api/portfolios/:portfolioId/members/:memberId
 * Remove a member from the portfolio
 */
portfoliosRouter.delete(
  "/:portfolioId/members/:memberId",
  withPermission({ portfolioAction: "remove_members" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");
    const memberId = c.req.param("memberId");
    const userId = getAuthenticatedUserId(c);
    const currentRole = getUserRole(c);

    // Get the membership to delete
    const [membership] = await db
      .select()
      .from(userPortfolios)
      .where(
        and(
          eq(userPortfolios.id, memberId),
          eq(userPortfolios.portfolioId, portfolioId)
        )
      )
      .limit(1);

    if (!membership) {
      return c.json({ error: "Member not found" }, 404);
    }

    // Cannot remove owner
    if (membership.role === "owner") {
      return c.json({ error: "Cannot remove the portfolio owner" }, 403);
    }

    // Cannot remove yourself (use leave endpoint instead)
    if (membership.userId === userId) {
      return c.json(
        { error: "Cannot remove yourself. Use the leave endpoint instead." },
        403
      );
    }

    // Check if user can manage this role
    if (currentRole && !canManageRole(currentRole, membership.role as PortfolioRole)) {
      return c.json(
        { error: `You cannot remove users with the ${membership.role} role` },
        403
      );
    }

    // Delete the membership
    await db.delete(userPortfolios).where(eq(userPortfolios.id, memberId));

    // Log the removal in audit log
    await db.insert(permissionAuditLog).values({
      userId: membership.userId,
      portfolioId,
      action: "access_revoked",
      oldValue: JSON.stringify({
        role: membership.role,
        propertyAccess: membership.propertyAccess,
      }),
      newValue: null,
      changedBy: userId,
    });

    return c.json({ message: "Member removed successfully" });
  }, { operation: "removeMember" })
);

/**
 * GET /api/portfolios/:portfolioId/permissions
 * Get current user's permissions for this portfolio
 * Used by the usePermissions hook on the frontend
 */
portfoliosRouter.get(
  "/:portfolioId/permissions",
  withPermission({ minimumRole: "viewer" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");
    const userId = getAuthenticatedUserId(c);

    // Get user's full membership record
    const [membership] = await db
      .select({
        role: userPortfolios.role,
        propertyAccess: userPortfolios.propertyAccess,
      })
      .from(userPortfolios)
      .where(
        and(
          eq(userPortfolios.userId, userId),
          eq(userPortfolios.portfolioId, portfolioId)
        )
      )
      .limit(1);

    if (!membership) {
      return c.json({ error: "Not a member of this portfolio" }, 403);
    }

    return c.json({
      role: membership.role,
      propertyAccess: membership.propertyAccess,
    });
  }, { operation: "getPermissions" })
);

/**
 * POST /api/portfolios/:portfolioId/leave
 * Leave a portfolio (non-owners only)
 */
portfoliosRouter.post(
  "/:portfolioId/leave",
  withPermission({ minimumRole: "viewer" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");
    const userId = getAuthenticatedUserId(c);
    const currentRole = getUserRole(c);

    // Owners cannot leave
    if (currentRole === "owner") {
      return c.json(
        {
          error: "Owners cannot leave. Transfer ownership first or delete the portfolio.",
        },
        403
      );
    }

    // Delete the user's membership
    await db
      .delete(userPortfolios)
      .where(
        and(
          eq(userPortfolios.userId, userId),
          eq(userPortfolios.portfolioId, portfolioId)
        )
      );

    // Log the leave in audit log
    await db.insert(permissionAuditLog).values({
      userId,
      portfolioId,
      action: "access_revoked",
      oldValue: JSON.stringify({ role: currentRole }),
      newValue: null,
      changedBy: userId, // Self-initiated
    });

    return c.json({ message: "Successfully left the portfolio" });
  }, { operation: "leavePortfolio" })
);

/**
 * POST /api/portfolios/:portfolioId/transfer-ownership
 * Transfer portfolio ownership to another member (owner only)
 */
portfoliosRouter.post(
  "/:portfolioId/transfer-ownership",
  withPermission({ minimumRole: "owner" }),
  withErrorHandling(async (c) => {
    const portfolioId = c.req.param("portfolioId");
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();

    const { newOwnerId } = z
      .object({ newOwnerId: z.string().uuid() })
      .parse(body);

    // Verify new owner is a member of the portfolio
    const [newOwnerMembership] = await db
      .select()
      .from(userPortfolios)
      .where(
        and(
          eq(userPortfolios.userId, newOwnerId),
          eq(userPortfolios.portfolioId, portfolioId)
        )
      )
      .limit(1);

    if (!newOwnerMembership) {
      return c.json({ error: "New owner must be a member of the portfolio" }, 400);
    }

    // Update current owner to admin
    await db
      .update(userPortfolios)
      .set({ role: "admin", updatedAt: new Date() })
      .where(
        and(
          eq(userPortfolios.userId, userId),
          eq(userPortfolios.portfolioId, portfolioId)
        )
      );

    // Update new owner to owner
    await db
      .update(userPortfolios)
      .set({ role: "owner", updatedAt: new Date() })
      .where(eq(userPortfolios.id, newOwnerMembership.id));

    // Update portfolio createdBy
    await db
      .update(portfolios)
      .set({ createdBy: newOwnerId, updatedAt: new Date() })
      .where(eq(portfolios.id, portfolioId));

    // Log both changes in audit log
    await db.insert(permissionAuditLog).values([
      {
        userId,
        portfolioId,
        action: "role_change",
        oldValue: JSON.stringify({ role: "owner" }),
        newValue: JSON.stringify({ role: "admin" }),
        changedBy: userId,
      },
      {
        userId: newOwnerId,
        portfolioId,
        action: "role_change",
        oldValue: JSON.stringify({ role: newOwnerMembership.role }),
        newValue: JSON.stringify({ role: "owner" }),
        changedBy: userId,
      },
    ]);

    return c.json({ message: "Ownership transferred successfully" });
  }, { operation: "transferOwnership" })
);

export default portfoliosRouter;
