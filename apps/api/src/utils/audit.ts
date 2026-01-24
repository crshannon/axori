/**
 * Audit Logging Utilities
 *
 * Centralized audit logging for all permission changes in the system.
 * All permission-changing endpoints should use these utilities to ensure
 * consistent, secure, and traceable audit logs.
 *
 * @see AXO-114: Implement audit logging for all permission changes
 */

import {
  db,
  permissionAuditLog,
} from "@axori/db";
import type { PropertyAccess } from "@axori/db";

// ============================================================================
// Types
// ============================================================================

/**
 * Permission audit action types - must match the permissionAuditActionEnum
 * defined in the database schema.
 */
export type PermissionAuditAction =
  | "role_change"
  | "invitation_sent"
  | "invitation_accepted"
  | "access_revoked";

/**
 * Structure for permission values that are logged in the audit trail.
 * This provides a consistent format for old/new values.
 */
export interface PermissionValue {
  role?: string;
  propertyAccess?: PropertyAccess;
  email?: string;
  tokenId?: string;
  [key: string]: unknown;
}

/**
 * Options for the logPermissionChange function.
 */
export interface LogPermissionChangeOptions {
  /**
   * The type of permission action being logged.
   */
  action: PermissionAuditAction;

  /**
   * The ID of the user whose permissions were changed.
   * Can be null for pending invitations where user doesn't exist yet.
   */
  userId: string | null;

  /**
   * The ID of the portfolio where the permission change occurred.
   */
  portfolioId: string;

  /**
   * The previous permission value (null for new grants).
   */
  oldValue: PermissionValue | null;

  /**
   * The new permission value (null for revocations).
   */
  newValue: PermissionValue | null;

  /**
   * The ID of the user who made the change (null for system-initiated changes).
   */
  changedBy: string | null;
}

/**
 * Result of a log permission change operation.
 */
export interface LogPermissionChangeResult {
  success: boolean;
  logId?: string;
  error?: string;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Logs a permission change to the audit trail.
 *
 * This function should be called from all permission-changing endpoints
 * to maintain a complete audit trail of permission changes for security
 * and compliance purposes.
 *
 * @param options - The options for the permission change log
 * @returns A promise that resolves to the result of the logging operation
 *
 * @example
 * ```ts
 * // Log a role change
 * await logPermissionChange({
 *   action: "role_change",
 *   userId: targetUserId,
 *   portfolioId: portfolioId,
 *   oldValue: { role: "member" },
 *   newValue: { role: "admin" },
 *   changedBy: currentUserId,
 * });
 *
 * // Log an invitation being sent
 * await logPermissionChange({
 *   action: "invitation_sent",
 *   userId: null, // User may not exist yet
 *   portfolioId: portfolioId,
 *   oldValue: null,
 *   newValue: { email: "user@example.com", role: "member", tokenId: invitation.id },
 *   changedBy: inviterId,
 * });
 *
 * // Log access being revoked
 * await logPermissionChange({
 *   action: "access_revoked",
 *   userId: targetUserId,
 *   portfolioId: portfolioId,
 *   oldValue: { role: "member" },
 *   newValue: null,
 *   changedBy: currentUserId,
 * });
 * ```
 */
export async function logPermissionChange(
  options: LogPermissionChangeOptions
): Promise<LogPermissionChangeResult> {
  const { action, userId, portfolioId, oldValue, newValue, changedBy } = options;

  try {
    // Serialize values to JSON strings for storage
    const serializedOldValue = oldValue ? JSON.stringify(oldValue) : null;
    const serializedNewValue = newValue ? JSON.stringify(newValue) : null;

    // Insert the audit log entry
    const [inserted] = await db
      .insert(permissionAuditLog)
      .values({
        action,
        userId,
        portfolioId,
        oldValue: serializedOldValue,
        newValue: serializedNewValue,
        changedBy,
      })
      .returning({ id: permissionAuditLog.id });

    return {
      success: true,
      logId: inserted.id,
    };
  } catch (error) {
    // Log the error but don't throw - audit logging should not block the main operation
    console.error("[AUDIT LOG ERROR]", {
      action,
      userId,
      portfolioId,
      changedBy,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============================================================================
// Helper Functions for Common Actions
// ============================================================================

/**
 * Logs a role change for a user in a portfolio.
 *
 * @param userId - The ID of the user whose role changed
 * @param portfolioId - The ID of the portfolio
 * @param oldRole - The previous role
 * @param newRole - The new role
 * @param changedBy - The ID of the user who made the change
 * @param propertyAccess - Optional property access changes
 */
export async function logRoleChange(
  userId: string,
  portfolioId: string,
  oldRole: string,
  newRole: string,
  changedBy: string,
  propertyAccess?: {
    old?: PropertyAccess;
    new?: PropertyAccess;
  }
): Promise<LogPermissionChangeResult> {
  return logPermissionChange({
    action: "role_change",
    userId,
    portfolioId,
    oldValue: {
      role: oldRole,
      ...(propertyAccess?.old !== undefined && { propertyAccess: propertyAccess.old }),
    },
    newValue: {
      role: newRole,
      ...(propertyAccess?.new !== undefined && { propertyAccess: propertyAccess.new }),
    },
    changedBy,
  });
}

/**
 * Logs an invitation being sent.
 *
 * @param portfolioId - The ID of the portfolio
 * @param email - The email address of the invitee
 * @param role - The role being assigned
 * @param invitedBy - The ID of the user sending the invitation
 * @param tokenId - The ID of the invitation token
 * @param propertyAccess - Optional property access restrictions
 * @param existingUserId - The ID of the existing user if they already have an account
 */
export async function logInvitationSent(
  portfolioId: string,
  email: string,
  role: string,
  invitedBy: string,
  tokenId: string,
  propertyAccess?: PropertyAccess,
  existingUserId?: string | null
): Promise<LogPermissionChangeResult> {
  return logPermissionChange({
    action: "invitation_sent",
    userId: existingUserId ?? null,
    portfolioId,
    oldValue: null,
    newValue: {
      email,
      role,
      tokenId,
      ...(propertyAccess !== undefined && { propertyAccess }),
    },
    changedBy: invitedBy,
  });
}

/**
 * Logs an invitation being accepted.
 *
 * @param userId - The ID of the user accepting the invitation
 * @param portfolioId - The ID of the portfolio
 * @param role - The role assigned
 * @param tokenId - The ID of the invitation token
 * @param propertyAccess - Optional property access restrictions
 */
export async function logInvitationAccepted(
  userId: string,
  portfolioId: string,
  role: string,
  tokenId: string,
  propertyAccess?: PropertyAccess
): Promise<LogPermissionChangeResult> {
  return logPermissionChange({
    action: "invitation_accepted",
    userId,
    portfolioId,
    oldValue: null,
    newValue: {
      role,
      tokenId,
      ...(propertyAccess !== undefined && { propertyAccess }),
    },
    changedBy: userId, // User accepts their own invitation
  });
}

/**
 * Logs access being revoked from a user.
 *
 * @param userId - The ID of the user whose access was revoked (null for pending invitations)
 * @param portfolioId - The ID of the portfolio
 * @param previousRole - The role the user had
 * @param changedBy - The ID of the user who revoked access
 * @param email - Optional email for pending invitation revocations
 * @param tokenId - Optional token ID for invitation revocations
 * @param propertyAccess - Optional property access that was revoked
 */
export async function logAccessRevoked(
  userId: string | null,
  portfolioId: string,
  previousRole: string,
  changedBy: string,
  options?: {
    email?: string;
    tokenId?: string;
    propertyAccess?: PropertyAccess;
  }
): Promise<LogPermissionChangeResult> {
  return logPermissionChange({
    action: "access_revoked",
    userId,
    portfolioId,
    oldValue: {
      role: previousRole,
      ...(options?.email && { email: options.email }),
      ...(options?.tokenId && { tokenId: options.tokenId }),
      ...(options?.propertyAccess !== undefined && { propertyAccess: options.propertyAccess }),
    },
    newValue: null,
    changedBy,
  });
}

// ============================================================================
// Batch Logging
// ============================================================================

/**
 * Logs multiple permission changes in a batch operation.
 * This is useful for operations like ownership transfer that involve multiple changes.
 *
 * @param changes - Array of permission change options
 * @returns A promise that resolves to an array of results
 */
export async function logPermissionChangeBatch(
  changes: LogPermissionChangeOptions[]
): Promise<LogPermissionChangeResult[]> {
  // For now, we process sequentially to maintain order and simplify error handling
  // In the future, this could be optimized with a batch insert
  const results: LogPermissionChangeResult[] = [];

  for (const change of changes) {
    const result = await logPermissionChange(change);
    results.push(result);
  }

  return results;
}
