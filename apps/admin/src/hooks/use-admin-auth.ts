/**
 * Admin App Authentication Hook
 *
 * Provides role-based access control for the admin app.
 * Reads admin roles from Clerk publicMetadata.
 */

import { useUser } from "@clerk/tanstack-react-start";
import {
  canAccessAdmin,
  canAccessForge,
  getAccessibleFeatures,
  hasAdminRole,
  hasFeatureAccess,
  isReadOnlyUser,
  isSuperAdmin,
  parseAdminRoles,
} from "@axori/permissions";
import type { AdminFeature, AdminRole } from "@axori/permissions";

export interface AdminAuthState {
  /** User's admin roles from Clerk metadata */
  roles: Array<AdminRole>;
  /** Whether the user is currently loading */
  isLoading: boolean;
  /** Whether the user is signed in */
  isSignedIn: boolean;
  /** Check if user has a specific role */
  hasRole: (role: AdminRole) => boolean;
  /** Check if user can access a specific feature */
  canAccess: (feature: AdminFeature) => boolean;
  /** Whether user can access any Forge features */
  canAccessForge: boolean;
  /** Whether user can access any Admin features */
  canAccessAdmin: boolean;
  /** Whether user has read-only access (viewer only) */
  isReadOnly: boolean;
  /** Whether user is a super admin */
  isSuperAdmin: boolean;
  /** All features accessible by this user */
  accessibleFeatures: Array<AdminFeature>;
}

/**
 * Hook to access admin authentication and authorization state.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { roles, canAccess, canAccessForge } = useAdminAuth();
 *
 *   if (!canAccessForge) {
 *     return <Navigate to="/unauthorized" />;
 *   }
 *
 *   if (!canAccess("forge:agents")) {
 *     return <div>You don't have permission to manage agents</div>;
 *   }
 *
 *   return <AgentManager />;
 * }
 * ```
 */
export function useAdminAuth(): AdminAuthState {
  const { user, isLoaded, isSignedIn } = useUser();

  // Parse roles from Clerk publicMetadata
  const roles = parseAdminRoles(
    user?.publicMetadata as Record<string, unknown> | undefined
  );

  return {
    roles,
    isLoading: !isLoaded,
    isSignedIn: isSignedIn ?? false,
    hasRole: (role: AdminRole) => hasAdminRole(roles, role),
    canAccess: (feature: AdminFeature) => hasFeatureAccess(roles, feature),
    canAccessForge: canAccessForge(roles),
    canAccessAdmin: canAccessAdmin(roles),
    isReadOnly: isReadOnlyUser(roles),
    isSuperAdmin: isSuperAdmin(roles),
    accessibleFeatures: getAccessibleFeatures(roles),
  };
}
