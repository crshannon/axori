/**
 * Security Validations for Role-Based Access Control
 *
 * This module provides security validation functions to prevent privilege escalation
 * and enforce access control rules for the Axori platform.
 *
 * Key Security Rules:
 * 1. Editor (member) cannot make themselves admin
 * 2. Owner cannot be removed or downgraded
 * 3. Only owner can change roles
 * 4. Only admin/owner can invite members
 * 5. Property-level access cannot exceed portfolio-level access
 *
 * @see AXO-115: Add security validations and prevent privilege escalation
 */

import type { PropertyAccess } from "@axori/db";
import {
  PortfolioRole,
  ROLE_DEFAULT_PERMISSIONS,
  PropertyPermission,
} from "./constants";
import { isRoleHigherThan, isRoleAtLeast, canManageRole, getRoleRank } from "./helpers";

// ============================================================================
// Security Validation Result Types
// ============================================================================

/**
 * Result of a security validation check
 */
export interface SecurityValidationResult {
  /** Whether the operation is allowed */
  allowed: boolean;
  /** Error message if not allowed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: SecurityErrorCode;
}

/**
 * Error codes for security validation failures
 */
export type SecurityErrorCode =
  | "SELF_PROMOTION_DENIED"
  | "OWNER_PROTECTION"
  | "INSUFFICIENT_PRIVILEGES"
  | "ROLE_ESCALATION_DENIED"
  | "PROPERTY_ACCESS_EXCEEDS_ROLE"
  | "INVALID_ROLE_CHANGE"
  | "ONLY_OWNER_CAN_CHANGE_ROLES";

// ============================================================================
// Security Validation Functions
// ============================================================================

/**
 * Validates that a user cannot promote themselves to a higher role.
 *
 * Security Rule: Users cannot modify their own role to escalate privileges.
 *
 * @param actorUserId - The user performing the action
 * @param targetUserId - The user whose role is being changed
 * @param actorRole - The actor's current role
 * @param newRole - The proposed new role
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateNoSelfPromotion(userId, userId, "member", "admin");
 * // result.allowed = false, result.errorCode = "SELF_PROMOTION_DENIED"
 * ```
 */
export function validateNoSelfPromotion(
  actorUserId: string,
  targetUserId: string,
  actorRole: PortfolioRole,
  newRole: PortfolioRole
): SecurityValidationResult {
  // If actor is modifying their own role
  if (actorUserId === targetUserId) {
    // Check if the new role is higher than current role
    if (isRoleHigherThan(newRole, actorRole)) {
      return {
        allowed: false,
        error: "You cannot promote yourself to a higher role",
        errorCode: "SELF_PROMOTION_DENIED",
      };
    }
    // Even demoting yourself is not allowed - you should use "leave" instead
    return {
      allowed: false,
      error: "You cannot modify your own role. Use the leave option instead.",
      errorCode: "SELF_PROMOTION_DENIED",
    };
  }

  return { allowed: true };
}

/**
 * Validates that the owner role cannot be removed or downgraded.
 *
 * Security Rule: The owner is protected from removal or role downgrade.
 * Ownership can only be transferred using the dedicated transfer-ownership endpoint.
 *
 * @param targetRole - The current role of the target user
 * @param newRole - The proposed new role (optional, for role changes)
 * @param isRemoval - Whether this is a removal operation
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateOwnerProtection("owner", "admin", false);
 * // result.allowed = false, result.errorCode = "OWNER_PROTECTION"
 * ```
 */
export function validateOwnerProtection(
  targetRole: PortfolioRole,
  newRole?: PortfolioRole,
  isRemoval: boolean = false
): SecurityValidationResult {
  if (targetRole === "owner") {
    if (isRemoval) {
      return {
        allowed: false,
        error: "Cannot remove the portfolio owner. Transfer ownership first.",
        errorCode: "OWNER_PROTECTION",
      };
    }

    if (newRole && newRole !== "owner") {
      return {
        allowed: false,
        error: "Cannot change owner's role. Use transfer-ownership to change ownership.",
        errorCode: "OWNER_PROTECTION",
      };
    }
  }

  return { allowed: true };
}

/**
 * Validates that only the owner can change member roles.
 *
 * Security Rule: Role changes (change_member_roles) should only be performed by owners.
 * Admins can invite and remove members, but cannot change existing member roles.
 *
 * @param actorRole - The role of the user performing the action
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateOnlyOwnerCanChangeRoles("admin");
 * // result.allowed = false, result.errorCode = "ONLY_OWNER_CAN_CHANGE_ROLES"
 * ```
 */
export function validateOnlyOwnerCanChangeRoles(
  actorRole: PortfolioRole
): SecurityValidationResult {
  if (actorRole !== "owner") {
    return {
      allowed: false,
      error: "Only the portfolio owner can change member roles",
      errorCode: "ONLY_OWNER_CAN_CHANGE_ROLES",
    };
  }

  return { allowed: true };
}

/**
 * Validates that the actor can invite members (admin or owner).
 *
 * Security Rule: Only admins and owners can invite new members.
 *
 * @param actorRole - The role of the user performing the invitation
 * @returns Validation result
 */
export function validateCanInviteMembers(
  actorRole: PortfolioRole
): SecurityValidationResult {
  if (!isRoleAtLeast(actorRole, "admin")) {
    return {
      allowed: false,
      error: "Only administrators and owners can invite members",
      errorCode: "INSUFFICIENT_PRIVILEGES",
    };
  }

  return { allowed: true };
}

/**
 * Validates that the actor can assign a specific role.
 *
 * Security Rule: Users can only assign roles that are strictly below their own.
 *
 * @param actorRole - The role of the user performing the action
 * @param targetRole - The role being assigned
 * @returns Validation result
 */
export function validateRoleAssignment(
  actorRole: PortfolioRole,
  targetRole: PortfolioRole
): SecurityValidationResult {
  // Owners cannot be assigned through normal means
  if (targetRole === "owner") {
    return {
      allowed: false,
      error: "Cannot assign owner role. Use transfer-ownership instead.",
      errorCode: "ROLE_ESCALATION_DENIED",
    };
  }

  if (!canManageRole(actorRole, targetRole)) {
    return {
      allowed: false,
      error: `You cannot assign the ${targetRole} role. Your role (${actorRole}) can only assign roles below it.`,
      errorCode: "ROLE_ESCALATION_DENIED",
    };
  }

  return { allowed: true };
}

/**
 * Validates that property-level access does not exceed portfolio-level access.
 *
 * Security Rule: Property-level permissions cannot grant more access than the
 * role's default permissions would allow.
 *
 * @param role - The portfolio role being assigned
 * @param propertyAccess - The property-level access restrictions
 * @returns Validation result
 *
 * @example
 * ```typescript
 * // Viewer role only has "view" permission
 * const result = validatePropertyAccessWithinRole("viewer", {
 *   "property-1": ["view", "edit"] // Invalid: "edit" exceeds viewer permissions
 * });
 * // result.allowed = false
 * ```
 */
export function validatePropertyAccessWithinRole(
  role: PortfolioRole,
  propertyAccess: PropertyAccess
): SecurityValidationResult {
  // If propertyAccess is null, it means full access based on role (which is valid)
  if (propertyAccess === null) {
    return { allowed: true };
  }

  const rolePermissions = ROLE_DEFAULT_PERMISSIONS[role];

  // Check each property's access
  for (const permissions of Object.values(propertyAccess)) {
    for (const permission of permissions) {
      if (!rolePermissions.includes(permission as PropertyPermission)) {
        return {
          allowed: false,
          error: `Property-level permission "${permission}" exceeds what the ${role} role allows. ` +
            `The ${role} role only permits: ${rolePermissions.join(", ")}`,
          errorCode: "PROPERTY_ACCESS_EXCEEDS_ROLE",
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Validates that a role change does not result in privilege escalation.
 *
 * Security Rule: The actor cannot grant roles higher than or equal to their own.
 *
 * @param actorRole - The role of the user performing the change
 * @param currentRole - The target user's current role
 * @param newRole - The proposed new role
 * @returns Validation result
 */
export function validateNoPrivilegeEscalation(
  actorRole: PortfolioRole,
  currentRole: PortfolioRole,
  newRole: PortfolioRole
): SecurityValidationResult {
  // Cannot promote someone to a role higher than or equal to actor's role
  if (getRoleRank(newRole) >= getRoleRank(actorRole)) {
    return {
      allowed: false,
      error: `Cannot promote user to ${newRole}. You can only assign roles below your own.`,
      errorCode: "ROLE_ESCALATION_DENIED",
    };
  }

  // Cannot modify users with roles equal to or higher than actor's role
  if (getRoleRank(currentRole) >= getRoleRank(actorRole)) {
    return {
      allowed: false,
      error: `Cannot modify users with ${currentRole} role or higher`,
      errorCode: "INSUFFICIENT_PRIVILEGES",
    };
  }

  return { allowed: true };
}

// ============================================================================
// Comprehensive Validation Functions
// ============================================================================

/**
 * Options for comprehensive role change validation
 */
export interface RoleChangeValidationOptions {
  actorUserId: string;
  targetUserId: string;
  actorRole: PortfolioRole;
  targetCurrentRole: PortfolioRole;
  newRole: PortfolioRole;
  propertyAccess?: PropertyAccess;
}

/**
 * Comprehensive validation for role changes.
 * Runs all security checks for a role change operation.
 *
 * @param options - The validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateRoleChange({
 *   actorUserId: "user-1",
 *   targetUserId: "user-2",
 *   actorRole: "owner",
 *   targetCurrentRole: "member",
 *   newRole: "admin",
 * });
 * ```
 */
export function validateRoleChange(
  options: RoleChangeValidationOptions
): SecurityValidationResult {
  const {
    actorUserId,
    targetUserId,
    actorRole,
    targetCurrentRole,
    newRole,
    propertyAccess,
  } = options;

  // 1. Check self-promotion
  const selfPromotionCheck = validateNoSelfPromotion(
    actorUserId,
    targetUserId,
    actorRole,
    newRole
  );
  if (!selfPromotionCheck.allowed) {
    return selfPromotionCheck;
  }

  // 2. Check owner protection
  const ownerProtectionCheck = validateOwnerProtection(targetCurrentRole, newRole);
  if (!ownerProtectionCheck.allowed) {
    return ownerProtectionCheck;
  }

  // 3. Check only owner can change roles
  const ownerOnlyCheck = validateOnlyOwnerCanChangeRoles(actorRole);
  if (!ownerOnlyCheck.allowed) {
    return ownerOnlyCheck;
  }

  // 4. Check privilege escalation
  const escalationCheck = validateNoPrivilegeEscalation(
    actorRole,
    targetCurrentRole,
    newRole
  );
  if (!escalationCheck.allowed) {
    return escalationCheck;
  }

  // 5. Check property access within role bounds
  if (propertyAccess !== undefined) {
    const propertyAccessCheck = validatePropertyAccessWithinRole(newRole, propertyAccess);
    if (!propertyAccessCheck.allowed) {
      return propertyAccessCheck;
    }
  }

  return { allowed: true };
}

/**
 * Options for member removal validation
 */
export interface MemberRemovalValidationOptions {
  actorUserId: string;
  targetUserId: string;
  actorRole: PortfolioRole;
  targetRole: PortfolioRole;
}

/**
 * Comprehensive validation for member removal.
 * Runs all security checks for removing a member from a portfolio.
 *
 * @param options - The validation options
 * @returns Validation result
 */
export function validateMemberRemoval(
  options: MemberRemovalValidationOptions
): SecurityValidationResult {
  const { actorUserId, targetUserId, actorRole, targetRole } = options;

  // 1. Check self-removal (should use leave endpoint instead)
  if (actorUserId === targetUserId) {
    return {
      allowed: false,
      error: "Cannot remove yourself. Use the leave endpoint instead.",
      errorCode: "SELF_PROMOTION_DENIED",
    };
  }

  // 2. Check owner protection
  const ownerProtectionCheck = validateOwnerProtection(targetRole, undefined, true);
  if (!ownerProtectionCheck.allowed) {
    return ownerProtectionCheck;
  }

  // 3. Check actor can manage target role
  if (!canManageRole(actorRole, targetRole)) {
    return {
      allowed: false,
      error: `Cannot remove users with the ${targetRole} role`,
      errorCode: "INSUFFICIENT_PRIVILEGES",
    };
  }

  return { allowed: true };
}

/**
 * Options for invitation validation
 */
export interface InvitationValidationOptions {
  actorRole: PortfolioRole;
  invitedRole: PortfolioRole;
  propertyAccess?: PropertyAccess;
}

/**
 * Comprehensive validation for sending invitations.
 * Runs all security checks for inviting a new member.
 *
 * @param options - The validation options
 * @returns Validation result
 */
export function validateInvitation(
  options: InvitationValidationOptions
): SecurityValidationResult {
  const { actorRole, invitedRole, propertyAccess } = options;

  // 1. Check actor can invite
  const canInviteCheck = validateCanInviteMembers(actorRole);
  if (!canInviteCheck.allowed) {
    return canInviteCheck;
  }

  // 2. Check role assignment is valid
  const roleAssignmentCheck = validateRoleAssignment(actorRole, invitedRole);
  if (!roleAssignmentCheck.allowed) {
    return roleAssignmentCheck;
  }

  // 3. Check property access within role bounds
  if (propertyAccess !== undefined) {
    const propertyAccessCheck = validatePropertyAccessWithinRole(invitedRole, propertyAccess);
    if (!propertyAccessCheck.allowed) {
      return propertyAccessCheck;
    }
  }

  return { allowed: true };
}

/**
 * Validates property access update independently of role change.
 * Used when only updating propertyAccess without changing the role.
 *
 * @param actorRole - The role of the user performing the action
 * @param targetRole - The role of the target user
 * @param propertyAccess - The new property access configuration
 * @returns Validation result
 */
export function validatePropertyAccessUpdate(
  actorRole: PortfolioRole,
  targetRole: PortfolioRole,
  propertyAccess: PropertyAccess
): SecurityValidationResult {
  // 1. Only owner can update property access (same as role changes)
  const ownerOnlyCheck = validateOnlyOwnerCanChangeRoles(actorRole);
  if (!ownerOnlyCheck.allowed) {
    return {
      allowed: false,
      error: "Only the portfolio owner can modify member property access",
      errorCode: "ONLY_OWNER_CAN_CHANGE_ROLES",
    };
  }

  // 2. Cannot modify owner's property access
  if (targetRole === "owner") {
    return {
      allowed: false,
      error: "Cannot modify owner's property access",
      errorCode: "OWNER_PROTECTION",
    };
  }

  // 3. Check property access within role bounds
  return validatePropertyAccessWithinRole(targetRole, propertyAccess);
}
