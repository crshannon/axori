/**
 * @axori/permissions - Role definitions and permission constants
 *
 * This module defines the role-based access control (RBAC) system for Axori.
 * It provides constants for portfolio roles, property-level permissions,
 * and their relationships.
 */

// Re-export types from @axori/db for convenience
export type { PropertyAccess, PropertyAccessPermission } from "@axori/db";

// ============================================================================
// Portfolio Roles
// ============================================================================

/**
 * Portfolio role type - matches the portfolioRoleEnum in the database schema.
 * Roles are hierarchical: owner > admin > member > viewer
 */
export type PortfolioRole = "owner" | "admin" | "member" | "viewer";

/**
 * All available portfolio roles in order of decreasing privilege.
 */
export const PORTFOLIO_ROLES: readonly PortfolioRole[] = [
  "owner",
  "admin",
  "member",
  "viewer",
] as const;

/**
 * Human-readable labels for portfolio roles.
 */
export const PORTFOLIO_ROLE_LABELS: Record<PortfolioRole, string> = {
  owner: "Owner",
  admin: "Administrator",
  member: "Member",
  viewer: "Viewer",
} as const;

/**
 * Detailed descriptions for each portfolio role.
 */
export const PORTFOLIO_ROLE_DESCRIPTIONS: Record<PortfolioRole, string> = {
  owner: "Full access to all portfolio settings, properties, and members. Can delete the portfolio.",
  admin: "Can manage properties and invite/remove members. Cannot delete the portfolio.",
  member: "Can view and edit properties. Cannot manage members or portfolio settings.",
  viewer: "Read-only access to portfolio and properties. Cannot make any changes.",
} as const;

/**
 * Role hierarchy mapping - defines which roles each role can manage.
 * A role can only manage roles below it in the hierarchy.
 */
export const ROLE_HIERARCHY: Record<PortfolioRole, PortfolioRole[]> = {
  owner: ["admin", "member", "viewer"],
  admin: ["member", "viewer"],
  member: [],
  viewer: [],
} as const;

// ============================================================================
// Property-Level Permissions
// ============================================================================

/**
 * Property-level permission type - granular permissions for property access.
 * These are used when propertyAccess JSONB is set on userPortfolios.
 */
export type PropertyPermission = "view" | "edit" | "manage" | "delete";

/**
 * All available property-level permissions in order of increasing privilege.
 */
export const PROPERTY_PERMISSIONS: readonly PropertyPermission[] = [
  "view",
  "edit",
  "manage",
  "delete",
] as const;

/**
 * Human-readable labels for property permissions.
 */
export const PROPERTY_PERMISSION_LABELS: Record<PropertyPermission, string> = {
  view: "View",
  edit: "Edit",
  manage: "Manage",
  delete: "Delete",
} as const;

/**
 * Detailed descriptions for each property permission.
 */
export const PROPERTY_PERMISSION_DESCRIPTIONS: Record<PropertyPermission, string> = {
  view: "View property details, financials, and transactions",
  edit: "Modify property data, add transactions, update financials",
  manage: "Update property settings, manage loans, and configure notifications",
  delete: "Remove the property from the portfolio",
} as const;

// ============================================================================
// Role-to-Permission Mapping
// ============================================================================

/**
 * Default property permissions granted by each portfolio role.
 * Used when propertyAccess is null (full access based on role).
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<PortfolioRole, PropertyPermission[]> = {
  owner: ["view", "edit", "manage", "delete"],
  admin: ["view", "edit", "manage", "delete"],
  member: ["view", "edit"],
  viewer: ["view"],
} as const;

// ============================================================================
// Portfolio-Level Permissions
// ============================================================================

/**
 * Portfolio-level actions that can be performed.
 */
export type PortfolioAction =
  | "view_portfolio"
  | "edit_portfolio"
  | "delete_portfolio"
  | "invite_members"
  | "remove_members"
  | "change_member_roles"
  | "add_properties"
  | "view_audit_log"
  | "manage_billing";

/**
 * Portfolio actions allowed for each role.
 *
 * Security Notes:
 * - change_member_roles: Only owner can change member roles (AXO-115)
 * - invite_members/remove_members: Admin and owner can invite/remove members
 * - delete_portfolio: Only owner can delete the portfolio
 * - manage_billing: Only owner can manage billing
 */
export const PORTFOLIO_ROLE_ACTIONS: Record<PortfolioRole, PortfolioAction[]> = {
  owner: [
    "view_portfolio",
    "edit_portfolio",
    "delete_portfolio",
    "invite_members",
    "remove_members",
    "change_member_roles", // Only owner has this permission
    "add_properties",
    "view_audit_log",
    "manage_billing",
  ],
  admin: [
    "view_portfolio",
    "edit_portfolio",
    "invite_members",
    "remove_members",
    // Note: Admin can invite/remove but NOT change existing member roles
    "add_properties",
    "view_audit_log",
  ],
  member: [
    "view_portfolio",
    "add_properties",
  ],
  viewer: [
    "view_portfolio",
  ],
} as const;

/**
 * Human-readable labels for portfolio actions.
 */
export const PORTFOLIO_ACTION_LABELS: Record<PortfolioAction, string> = {
  view_portfolio: "View Portfolio",
  edit_portfolio: "Edit Portfolio Settings",
  delete_portfolio: "Delete Portfolio",
  invite_members: "Invite Members",
  remove_members: "Remove Members",
  change_member_roles: "Change Member Roles",
  add_properties: "Add Properties",
  view_audit_log: "View Audit Log",
  manage_billing: "Manage Billing",
} as const;

// ============================================================================
// Permission Options for UI
// ============================================================================

/**
 * Role option for select dropdowns and forms.
 */
export interface RoleOption {
  value: PortfolioRole;
  label: string;
  description: string;
}

/**
 * Available roles as options for UI components.
 */
export const PORTFOLIO_ROLE_OPTIONS: RoleOption[] = PORTFOLIO_ROLES.map((role) => ({
  value: role,
  label: PORTFOLIO_ROLE_LABELS[role],
  description: PORTFOLIO_ROLE_DESCRIPTIONS[role],
}));

/**
 * Permission option for select dropdowns and forms.
 */
export interface PermissionOption {
  value: PropertyPermission;
  label: string;
  description: string;
}

/**
 * Available property permissions as options for UI components.
 */
export const PROPERTY_PERMISSION_OPTIONS: PermissionOption[] = PROPERTY_PERMISSIONS.map((permission) => ({
  value: permission,
  label: PROPERTY_PERMISSION_LABELS[permission],
  description: PROPERTY_PERMISSION_DESCRIPTIONS[permission],
}));
