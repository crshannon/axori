/**
 * Admin App Role-Based Access Control
 *
 * Defines roles and permissions for the admin application,
 * including Forge (engineering) and Admin (operations) features.
 */

// =============================================================================
// Role Definitions
// =============================================================================

export const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "developer",
  "viewer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  developer: "Developer",
  viewer: "Viewer",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: "Full access to all features and settings",
  admin: "Manage users, settings, and billing",
  developer: "Access to Forge engineering tools",
  viewer: "Read-only access to Forge dashboards",
};

// =============================================================================
// Feature Definitions
// =============================================================================

export const ADMIN_FEATURES = {
  // Forge features
  "forge:board": "View and manage kanban board",
  "forge:board:read": "View kanban board (read-only)",
  "forge:tickets": "Create and manage tickets",
  "forge:tickets:read": "View tickets (read-only)",
  "forge:agents": "Run and manage AI agents",
  "forge:budget": "Manage token budgets",
  "forge:budget:read": "View token usage (read-only)",
  "forge:registry": "Manage code registry",
  "forge:deployments": "View deployment status",

  // Admin features
  "admin:users": "Manage users and roles",
  "admin:settings": "Manage system settings",
  "admin:billing": "Manage billing and subscriptions",
  "admin:analytics": "View system analytics",
  "admin:audit": "View audit logs",
} as const;

export type AdminFeature = keyof typeof ADMIN_FEATURES;

// =============================================================================
// Role-to-Feature Mapping
// =============================================================================

export const ROLE_FEATURES: Record<AdminRole, Array<AdminFeature | "*">> = {
  super_admin: ["*"],
  admin: [
    "admin:users",
    "admin:settings",
    "admin:billing",
    "admin:analytics",
    "admin:audit",
  ],
  developer: [
    "forge:board",
    "forge:tickets",
    "forge:agents",
    "forge:budget",
    "forge:registry",
    "forge:deployments",
  ],
  viewer: [
    "forge:board:read",
    "forge:tickets:read",
    "forge:budget:read",
    "forge:deployments",
  ],
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if user has a specific admin role
 */
export function hasAdminRole(
  userRoles: Array<AdminRole> | undefined | null,
  requiredRole: AdminRole
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.includes(requiredRole) || userRoles.includes("super_admin");
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  userRoles: Array<AdminRole> | undefined | null,
  feature: AdminFeature
): boolean {
  if (!userRoles || userRoles.length === 0) return false;

  for (const role of userRoles) {
    const features = ROLE_FEATURES[role];
    if (features.includes("*") || features.includes(feature)) {
      return true;
    }

    // Check for read access when user has write access
    // e.g., developer has forge:board, which implies forge:board:read
    const baseFeature = feature.replace(/:read$/, "") as AdminFeature;
    if (baseFeature !== feature && features.includes(baseFeature)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can access any Forge features
 */
export function canAccessForge(
  userRoles: Array<AdminRole> | undefined | null
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some((r) =>
    ["super_admin", "developer", "viewer"].includes(r)
  );
}

/**
 * Check if user can access any Admin features
 */
export function canAccessAdmin(
  userRoles: Array<AdminRole> | undefined | null
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some((r) => ["super_admin", "admin"].includes(r));
}

/**
 * Check if user has read-only access (viewer role only)
 */
export function isReadOnlyUser(
  userRoles: Array<AdminRole> | undefined | null
): boolean {
  if (!userRoles || userRoles.length === 0) return true;
  return userRoles.length === 1 && userRoles[0] === "viewer";
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(
  userRoles: Array<AdminRole> | undefined | null
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.includes("super_admin");
}

/**
 * Get all features accessible by user
 */
export function getAccessibleFeatures(
  userRoles: Array<AdminRole> | undefined | null
): Array<AdminFeature> {
  if (!userRoles || userRoles.length === 0) return [];

  const features = new Set<AdminFeature>();

  for (const role of userRoles) {
    const roleFeatures = ROLE_FEATURES[role];
    if (roleFeatures.includes("*")) {
      // Super admin gets all features
      return Object.keys(ADMIN_FEATURES) as Array<AdminFeature>;
    }
    for (const feature of roleFeatures) {
      if (feature !== "*") {
        features.add(feature);
      }
    }
  }

  return Array.from(features);
}

/**
 * Validate that a value is a valid admin role
 */
export function isValidAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole)
  );
}

/**
 * Parse and validate admin roles from Clerk metadata
 */
export function parseAdminRoles(
  metadata: Record<string, unknown> | undefined | null
): Array<AdminRole> {
  if (!metadata) return [];

  const roles = metadata.adminRoles;
  if (!Array.isArray(roles)) return [];

  return roles.filter(isValidAdminRole);
}
