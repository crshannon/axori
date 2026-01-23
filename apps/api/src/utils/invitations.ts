/**
 * Invitation Token Utilities
 *
 * Provides secure, single-use token generation and validation for portfolio invitations.
 *
 * Security features:
 * - Cryptographically secure token generation using Node.js crypto
 * - Single-use tokens (marked as used after acceptance)
 * - Time-limited tokens (default: 7 days)
 * - Token status tracking for audit purposes
 *
 * @see AXO-111: Implement invitation token generation and validation
 */

import { randomBytes } from "crypto";
import { db, eq, and, desc, invitationTokens } from "@axori/db";
import type { InvitationToken, InvitationTokenInsert, PropertyAccess } from "@axori/db";

/**
 * Default token expiration time in days
 */
const DEFAULT_EXPIRATION_DAYS = 7;

/**
 * Token length in bytes (will be converted to URL-safe base64)
 * 32 bytes = 256 bits of entropy, resulting in ~43 character token
 */
const TOKEN_LENGTH_BYTES = 32;

/**
 * Invitation token status values
 */
export type InvitationTokenStatus = "pending" | "accepted" | "expired" | "revoked";

/**
 * Options for generating an invitation token
 */
export interface GenerateInvitationTokenOptions {
  /** The portfolio ID to invite the user to */
  portfolioId: string;
  /** The email address of the user being invited */
  email: string;
  /** The role to assign when the invitation is accepted (default: "member") */
  role?: "owner" | "admin" | "member" | "viewer";
  /** The user ID of the person sending the invitation */
  invitedBy: string;
  /** Optional property-level access restrictions */
  propertyAccess?: PropertyAccess;
  /** Token expiration time in days (default: 7) */
  expirationDays?: number;
}

/**
 * Result of generating an invitation token
 */
export interface GenerateInvitationTokenResult {
  /** The generated token (to be included in invitation URL) */
  token: string;
  /** The full invitation record */
  invitation: InvitationToken;
  /** When the token expires */
  expiresAt: Date;
}

/**
 * Result of validating an invitation token
 */
export interface ValidateInvitationTokenResult {
  /** Whether the token is valid */
  valid: boolean;
  /** Error message if token is invalid */
  error?: string;
  /** The invitation data if valid */
  invitation?: InvitationToken;
}

/**
 * Generates a cryptographically secure, URL-safe token
 *
 * Uses Node.js crypto.randomBytes for secure random generation,
 * then encodes as URL-safe base64.
 *
 * @returns A secure, URL-safe token string
 */
function generateSecureToken(): string {
  // Generate cryptographically secure random bytes
  const buffer = randomBytes(TOKEN_LENGTH_BYTES);

  // Convert to URL-safe base64
  // Replace '+' with '-', '/' with '_', and remove '=' padding
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generates a secure, single-use invitation token
 *
 * Creates a cryptographically secure token for inviting a user to a portfolio.
 * The token is stored in the database with the invitation details and
 * will expire after the specified time (default: 7 days).
 *
 * @param options - The invitation options
 * @returns The generated token and invitation details
 *
 * @example
 * ```ts
 * const result = await generateInvitationToken({
 *   portfolioId: "portfolio-uuid",
 *   email: "user@example.com",
 *   role: "member",
 *   invitedBy: "inviter-user-uuid",
 * });
 *
 * // Use result.token in the invitation URL
 * const inviteUrl = `https://app.example.com/invitation/accept?token=${result.token}`;
 * ```
 */
export async function generateInvitationToken(
  options: GenerateInvitationTokenOptions
): Promise<GenerateInvitationTokenResult> {
  const {
    portfolioId,
    email,
    role = "member",
    invitedBy,
    propertyAccess,
    expirationDays = DEFAULT_EXPIRATION_DAYS,
  } = options;

  // Generate secure token
  const token = generateSecureToken();

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  // Normalize email to lowercase for consistent matching
  const normalizedEmail = email.toLowerCase().trim();

  // Create invitation record
  const invitationData: InvitationTokenInsert = {
    token,
    portfolioId,
    email: normalizedEmail,
    role,
    invitedBy,
    propertyAccess: propertyAccess ?? null,
    status: "pending",
    expiresAt,
  };

  // Insert into database
  const [invitation] = await db
    .insert(invitationTokens)
    .values(invitationData)
    .returning();

  return {
    token,
    invitation,
    expiresAt,
  };
}

/**
 * Validates an invitation token
 *
 * Checks if the token exists, is not expired, and has not been used.
 * Returns the invitation data if valid.
 *
 * Validation checks:
 * 1. Token exists in database
 * 2. Token status is "pending"
 * 3. Token has not expired
 *
 * @param token - The invitation token to validate
 * @returns Validation result with invitation data if valid
 *
 * @example
 * ```ts
 * const result = await validateInvitationToken(token);
 *
 * if (result.valid) {
 *   // Token is valid, proceed with accepting invitation
 *   console.log(`Inviting to portfolio: ${result.invitation.portfolioId}`);
 * } else {
 *   // Token is invalid
 *   console.error(result.error);
 * }
 * ```
 */
export async function validateInvitationToken(
  token: string
): Promise<ValidateInvitationTokenResult> {
  // Look up token in database
  const [invitation] = await db
    .select()
    .from(invitationTokens)
    .where(eq(invitationTokens.token, token))
    .limit(1);

  // Check if token exists
  if (!invitation) {
    return {
      valid: false,
      error: "Invalid invitation token",
    };
  }

  // Check if token is still pending
  if (invitation.status !== "pending") {
    const statusMessages: Record<string, string> = {
      accepted: "This invitation has already been used",
      expired: "This invitation has expired",
      revoked: "This invitation has been revoked",
    };

    return {
      valid: false,
      error: statusMessages[invitation.status] || "Invalid invitation token",
    };
  }

  // Check if token has expired
  const now = new Date();
  if (invitation.expiresAt < now) {
    // Update status to expired (for future reference)
    await db
      .update(invitationTokens)
      .set({
        status: "expired",
        updatedAt: now,
      })
      .where(eq(invitationTokens.id, invitation.id));

    return {
      valid: false,
      error: "This invitation has expired",
    };
  }

  // Token is valid
  return {
    valid: true,
    invitation,
  };
}

/**
 * Marks an invitation token as used (accepted)
 *
 * This should be called after a user successfully accepts an invitation
 * and is added to the portfolio. The token will be marked as "accepted"
 * and cannot be used again.
 *
 * @param token - The invitation token to expire
 * @param usedBy - The user ID of the user who accepted the invitation
 * @returns The updated invitation record, or null if token not found
 *
 * @example
 * ```ts
 * // After successfully adding user to portfolio
 * const updatedInvitation = await expireInvitationToken(token, userId);
 *
 * if (updatedInvitation) {
 *   console.log("Invitation marked as used");
 * }
 * ```
 */
export async function expireInvitationToken(
  token: string,
  usedBy: string
): Promise<InvitationToken | null> {
  const now = new Date();

  // Update token status to accepted
  const [updatedInvitation] = await db
    .update(invitationTokens)
    .set({
      status: "accepted",
      usedAt: now,
      usedBy,
      updatedAt: now,
    })
    .where(
      and(
        eq(invitationTokens.token, token),
        eq(invitationTokens.status, "pending")
      )
    )
    .returning();

  return updatedInvitation || null;
}

/**
 * Revokes an invitation token
 *
 * Marks a pending invitation token as revoked, preventing it from being used.
 * This is useful when an admin wants to cancel a pending invitation.
 *
 * @param token - The invitation token to revoke
 * @returns The updated invitation record, or null if token not found or not pending
 *
 * @example
 * ```ts
 * const result = await revokeInvitationToken(token);
 *
 * if (result) {
 *   console.log("Invitation revoked successfully");
 * } else {
 *   console.log("Invitation not found or already used");
 * }
 * ```
 */
export async function revokeInvitationToken(
  token: string
): Promise<InvitationToken | null> {
  const now = new Date();

  // Update token status to revoked (only if pending)
  const [updatedInvitation] = await db
    .update(invitationTokens)
    .set({
      status: "revoked",
      updatedAt: now,
    })
    .where(
      and(
        eq(invitationTokens.token, token),
        eq(invitationTokens.status, "pending")
      )
    )
    .returning();

  return updatedInvitation || null;
}

/**
 * Gets all pending invitations for a portfolio
 *
 * Returns all invitation tokens for a portfolio that are still pending
 * and have not expired. Useful for displaying pending invitations
 * in the portfolio settings UI.
 *
 * @param portfolioId - The portfolio ID to get invitations for
 * @returns Array of pending invitation tokens
 *
 * @example
 * ```ts
 * const pendingInvitations = await getPendingInvitations(portfolioId);
 *
 * pendingInvitations.forEach(invite => {
 *   console.log(`Pending invite for: ${invite.email} as ${invite.role}`);
 * });
 * ```
 */
export async function getPendingInvitations(
  portfolioId: string
): Promise<InvitationToken[]> {
  const now = new Date();

  const invitations = await db
    .select()
    .from(invitationTokens)
    .where(
      and(
        eq(invitationTokens.portfolioId, portfolioId),
        eq(invitationTokens.status, "pending")
      )
    )
    .orderBy(desc(invitationTokens.createdAt));

  // Filter out expired invitations (and update their status)
  const validInvitations: InvitationToken[] = [];
  const expiredIds: string[] = [];

  for (const invitation of invitations) {
    if (invitation.expiresAt < now) {
      expiredIds.push(invitation.id);
    } else {
      validInvitations.push(invitation);
    }
  }

  // Batch update expired invitations
  if (expiredIds.length > 0) {
    // Use a simple approach - update each expired invitation
    // In production, you might want to use a batch update with inArray
    for (const id of expiredIds) {
      await db
        .update(invitationTokens)
        .set({
          status: "expired",
          updatedAt: now,
        })
        .where(eq(invitationTokens.id, id));
    }
  }

  return validInvitations;
}

/**
 * Checks if an email has a pending invitation for a portfolio
 *
 * Useful for preventing duplicate invitations to the same email address.
 *
 * @param portfolioId - The portfolio ID to check
 * @param email - The email address to check
 * @returns The pending invitation if exists, null otherwise
 *
 * @example
 * ```ts
 * const existingInvite = await getExistingInvitation(portfolioId, email);
 *
 * if (existingInvite) {
 *   console.log("User already has a pending invitation");
 * }
 * ```
 */
export async function getExistingInvitation(
  portfolioId: string,
  email: string
): Promise<InvitationToken | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  const [invitation] = await db
    .select()
    .from(invitationTokens)
    .where(
      and(
        eq(invitationTokens.portfolioId, portfolioId),
        eq(invitationTokens.email, normalizedEmail),
        eq(invitationTokens.status, "pending")
      )
    )
    .limit(1);

  if (!invitation) {
    return null;
  }

  // Check if expired
  if (invitation.expiresAt < now) {
    // Update status to expired
    await db
      .update(invitationTokens)
      .set({
        status: "expired",
        updatedAt: now,
      })
      .where(eq(invitationTokens.id, invitation.id));

    return null;
  }

  return invitation;
}
