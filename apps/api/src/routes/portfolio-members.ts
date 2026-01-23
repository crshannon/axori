/**
 * Portfolio Members API Routes
 *
 * Provides endpoints for managing portfolio member invitations and acceptance.
 * Integrates with email sending for invitation notifications.
 *
 * @see AXO-112: Create invitation email template and sending
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  db,
  portfolios,
  userPortfolios,
  users,
  permissionAuditLog,
  eq,
  and,
} from "@axori/db";
import {
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
import {
  generateInvitationToken,
  validateInvitationToken,
  expireInvitationToken,
  getExistingInvitation,
  getPendingInvitations,
  revokeInvitationToken,
} from "../utils/invitations";
import { sendInvitationEmail, isEmailConfigured } from "../utils/email";

const portfolioMembersRouter = new Hono();

// ============================================================================
// Validation Schemas
// ============================================================================

const sendInvitationSchema = z.object({
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

const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

// ============================================================================
// Invitation Routes
// ============================================================================

/**
 * POST /api/portfolio-members/:portfolioId/invitations
 * Send an invitation to join a portfolio
 *
 * This endpoint:
 * 1. Validates the inviter has permission to invite members
 * 2. Checks for existing pending invitations to the same email
 * 3. Generates a secure invitation token
 * 4. Sends an invitation email with a link to accept
 * 5. Logs the invitation in the audit log
 */
portfolioMembersRouter.post(
  "/:portfolioId/invitations",
  withPermission({ portfolioAction: "invite_members" }),
  withErrorHandling(
    async (c) => {
      const portfolioId = c.req.param("portfolioId");
      const userId = getAuthenticatedUserId(c);
      const currentRole = getUserRole(c);
      const body = await c.req.json();

      const validated = sendInvitationSchema.parse(body);

      // Check if user can assign the requested role
      if (currentRole && !canManageRole(currentRole, validated.role)) {
        return c.json(
          {
            error: `You cannot assign the ${validated.role} role. You can only assign: ${getAssignableRoles(currentRole).join(", ")}`,
          },
          403
        );
      }

      // Check if user already exists and is a member
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, validated.email.toLowerCase().trim()))
        .limit(1);

      if (existingUser) {
        // Check if they're already a member
        const [existingMembership] = await db
          .select()
          .from(userPortfolios)
          .where(
            and(
              eq(userPortfolios.userId, existingUser.id),
              eq(userPortfolios.portfolioId, portfolioId)
            )
          )
          .limit(1);

        if (existingMembership) {
          return c.json(
            { error: "This user is already a member of this portfolio" },
            409
          );
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await getExistingInvitation(
        portfolioId,
        validated.email
      );

      if (existingInvitation) {
        return c.json(
          {
            error: "An invitation has already been sent to this email address",
            existingInvitation: {
              id: existingInvitation.id,
              email: existingInvitation.email,
              role: existingInvitation.role,
              expiresAt: existingInvitation.expiresAt,
              createdAt: existingInvitation.createdAt,
            },
          },
          409
        );
      }

      // Get portfolio details for the email
      const [portfolio] = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, portfolioId))
        .limit(1);

      if (!portfolio) {
        return c.json({ error: "Portfolio not found" }, 404);
      }

      // Get inviter details
      const [inviter] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!inviter) {
        return c.json({ error: "Inviter user not found" }, 404);
      }

      // Generate invitation token
      const { token, invitation, expiresAt } = await generateInvitationToken({
        portfolioId,
        email: validated.email,
        role: validated.role,
        invitedBy: userId,
        propertyAccess: validated.propertyAccess ?? undefined,
      });

      // Prepare inviter name
      const inviterName =
        inviter.firstName && inviter.lastName
          ? `${inviter.firstName} ${inviter.lastName}`
          : inviter.name || inviter.email;

      // Send invitation email
      const emailResult = await sendInvitationEmail({
        to: validated.email,
        recipientName: existingUser
          ? existingUser.firstName && existingUser.lastName
            ? `${existingUser.firstName} ${existingUser.lastName}`
            : existingUser.name || undefined
          : undefined,
        inviterName,
        inviterEmail: inviter.email,
        portfolioName: portfolio.name,
        role: validated.role,
        token,
        expiresAt,
      });

      // Log the invitation in audit log
      await db.insert(permissionAuditLog).values({
        userId: existingUser?.id ?? null,
        portfolioId,
        action: "invitation_sent",
        oldValue: null,
        newValue: JSON.stringify({
          email: validated.email,
          role: validated.role,
          propertyAccess: validated.propertyAccess,
          tokenId: invitation.id,
        }),
        changedBy: userId,
      });

      return c.json(
        {
          message: "Invitation sent successfully",
          invitation: {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            status: invitation.status,
          },
          emailSent: emailResult.success,
          emailConfigured: isEmailConfigured(),
          ...(emailResult.error && { emailError: emailResult.error }),
        },
        201
      );
    },
    { operation: "sendInvitation" }
  )
);

/**
 * GET /api/portfolio-members/:portfolioId/invitations
 * List all pending invitations for a portfolio
 */
portfolioMembersRouter.get(
  "/:portfolioId/invitations",
  withPermission({ minimumRole: "admin" }),
  withErrorHandling(
    async (c) => {
      const portfolioId = c.req.param("portfolioId");

      const pendingInvitations = await getPendingInvitations(portfolioId);

      // Get inviter info for each invitation
      const invitationsWithInviter = await Promise.all(
        pendingInvitations.map(async (invitation) => {
          const [inviter] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(eq(users.id, invitation.invitedBy))
            .limit(1);

          return {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            propertyAccess: invitation.propertyAccess,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
            inviter: inviter || null,
          };
        })
      );

      return c.json({ invitations: invitationsWithInviter });
    },
    { operation: "listInvitations" }
  )
);

/**
 * DELETE /api/portfolio-members/:portfolioId/invitations/:invitationId
 * Revoke a pending invitation
 */
portfolioMembersRouter.delete(
  "/:portfolioId/invitations/:invitationId",
  withPermission({ portfolioAction: "invite_members" }),
  withErrorHandling(
    async (c) => {
      const portfolioId = c.req.param("portfolioId");
      const invitationId = c.req.param("invitationId");
      const userId = getAuthenticatedUserId(c);

      // Get the invitation to find the token
      const pendingInvitations = await getPendingInvitations(portfolioId);
      const invitation = pendingInvitations.find(
        (inv) => inv.id === invitationId
      );

      if (!invitation) {
        return c.json(
          { error: "Invitation not found or already used/expired" },
          404
        );
      }

      // Revoke the invitation
      const revoked = await revokeInvitationToken(invitation.token);

      if (!revoked) {
        return c.json(
          { error: "Failed to revoke invitation" },
          500
        );
      }

      // Log the revocation in audit log
      await db.insert(permissionAuditLog).values({
        userId: null,
        portfolioId,
        action: "access_revoked",
        oldValue: JSON.stringify({
          email: invitation.email,
          role: invitation.role,
          tokenId: invitation.id,
        }),
        newValue: null,
        changedBy: userId,
      });

      return c.json({ message: "Invitation revoked successfully" });
    },
    { operation: "revokeInvitation" }
  )
);

/**
 * POST /api/portfolio-members/accept-invitation
 * Accept an invitation and join a portfolio
 *
 * This endpoint:
 * 1. Validates the invitation token
 * 2. Creates the user-portfolio membership
 * 3. Marks the token as used
 * 4. Logs the acceptance in the audit log
 */
portfolioMembersRouter.post(
  "/accept-invitation",
  requireAuth(),
  withErrorHandling(
    async (c) => {
      const userId = getAuthenticatedUserId(c);
      const body = await c.req.json();

      const { token } = acceptInvitationSchema.parse(body);

      // Validate the token
      const validationResult = await validateInvitationToken(token);

      if (!validationResult.valid || !validationResult.invitation) {
        return c.json(
          { error: validationResult.error || "Invalid invitation token" },
          400
        );
      }

      const invitation = validationResult.invitation;

      // Get the user's email to verify it matches (optional - for security)
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if user is already a member of this portfolio
      const [existingMembership] = await db
        .select()
        .from(userPortfolios)
        .where(
          and(
            eq(userPortfolios.userId, userId),
            eq(userPortfolios.portfolioId, invitation.portfolioId)
          )
        )
        .limit(1);

      if (existingMembership) {
        // Mark the token as used anyway
        await expireInvitationToken(token, userId);
        return c.json(
          { error: "You are already a member of this portfolio" },
          409
        );
      }

      // Create the membership
      const [newMembership] = await db
        .insert(userPortfolios)
        .values({
          userId,
          portfolioId: invitation.portfolioId,
          role: invitation.role,
          propertyAccess: invitation.propertyAccess,
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.createdAt,
          acceptedAt: new Date(),
        })
        .returning();

      // Mark the token as used
      await expireInvitationToken(token, userId);

      // Log the acceptance in audit log
      await db.insert(permissionAuditLog).values({
        userId,
        portfolioId: invitation.portfolioId,
        action: "invitation_accepted",
        oldValue: null,
        newValue: JSON.stringify({
          role: invitation.role,
          propertyAccess: invitation.propertyAccess,
          tokenId: invitation.id,
        }),
        changedBy: userId,
      });

      // Get portfolio details for the response
      const [portfolio] = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, invitation.portfolioId))
        .limit(1);

      return c.json({
        message: "Successfully joined the portfolio",
        membership: {
          id: newMembership.id,
          role: newMembership.role,
          propertyAccess: newMembership.propertyAccess,
          acceptedAt: newMembership.acceptedAt,
        },
        portfolio: portfolio
          ? {
              id: portfolio.id,
              name: portfolio.name,
              description: portfolio.description,
            }
          : null,
      });
    },
    { operation: "acceptInvitation" }
  )
);

/**
 * GET /api/portfolio-members/validate-invitation
 * Validate an invitation token without accepting it
 *
 * This is useful for showing the invitation details page
 * before the user accepts or declines.
 */
portfolioMembersRouter.get(
  "/validate-invitation",
  withErrorHandling(
    async (c) => {
      const token = c.req.query("token");

      if (!token) {
        return c.json({ error: "Token is required" }, 400);
      }

      // Validate the token
      const validationResult = await validateInvitationToken(token);

      if (!validationResult.valid || !validationResult.invitation) {
        return c.json(
          {
            valid: false,
            error: validationResult.error || "Invalid invitation token",
          },
          200
        );
      }

      const invitation = validationResult.invitation;

      // Get portfolio details
      const [portfolio] = await db
        .select({
          id: portfolios.id,
          name: portfolios.name,
          description: portfolios.description,
        })
        .from(portfolios)
        .where(eq(portfolios.id, invitation.portfolioId))
        .limit(1);

      // Get inviter details
      const [inviter] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, invitation.invitedBy))
        .limit(1);

      return c.json({
        valid: true,
        invitation: {
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        },
        portfolio: portfolio || null,
        inviter: inviter || null,
      });
    },
    { operation: "validateInvitation" }
  )
);

/**
 * POST /api/portfolio-members/:portfolioId/resend-invitation/:invitationId
 * Resend an invitation email
 *
 * This doesn't generate a new token, just resends the email with the existing token.
 */
portfolioMembersRouter.post(
  "/:portfolioId/resend-invitation/:invitationId",
  withPermission({ portfolioAction: "invite_members" }),
  withErrorHandling(
    async (c) => {
      const portfolioId = c.req.param("portfolioId");
      const invitationId = c.req.param("invitationId");
      const userId = getAuthenticatedUserId(c);

      // Get the invitation
      const pendingInvitations = await getPendingInvitations(portfolioId);
      const invitation = pendingInvitations.find(
        (inv) => inv.id === invitationId
      );

      if (!invitation) {
        return c.json(
          { error: "Invitation not found or already used/expired" },
          404
        );
      }

      // Get portfolio details
      const [portfolio] = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, portfolioId))
        .limit(1);

      if (!portfolio) {
        return c.json({ error: "Portfolio not found" }, 404);
      }

      // Get inviter details
      const [inviter] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!inviter) {
        return c.json({ error: "User not found" }, 404);
      }

      // Prepare inviter name
      const inviterName =
        inviter.firstName && inviter.lastName
          ? `${inviter.firstName} ${inviter.lastName}`
          : inviter.name || inviter.email;

      // Check if invitee exists to get their name
      const [invitee] = await db
        .select()
        .from(users)
        .where(eq(users.email, invitation.email.toLowerCase().trim()))
        .limit(1);

      // Resend the email
      const emailResult = await sendInvitationEmail({
        to: invitation.email,
        recipientName: invitee
          ? invitee.firstName && invitee.lastName
            ? `${invitee.firstName} ${invitee.lastName}`
            : invitee.name || undefined
          : undefined,
        inviterName,
        inviterEmail: inviter.email,
        portfolioName: portfolio.name,
        role: invitation.role as "admin" | "member" | "viewer",
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      });

      if (!emailResult.success) {
        return c.json(
          {
            error: "Failed to send invitation email",
            details: emailResult.error,
          },
          500
        );
      }

      return c.json({
        message: "Invitation email resent successfully",
        emailConfigured: isEmailConfigured(),
      });
    },
    { operation: "resendInvitation" }
  )
);

export default portfolioMembersRouter;
