/**
 * Route Guard Component for Role-Based Access
 *
 * Wraps content that requires specific roles or feature access.
 * Redirects to unauthorized page if access is denied.
 */

import { Navigate } from "@tanstack/react-router";
import type { AdminFeature, AdminRole } from "@axori/permissions";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export interface RequireRoleProps {
  /** Require a specific role */
  role?: AdminRole;
  /** Require access to a specific feature */
  feature?: AdminFeature;
  /** Require any of these roles */
  anyRole?: Array<AdminRole>;
  /** Require access to any of these features */
  anyFeature?: Array<AdminFeature>;
  /** Content to render if access is granted */
  children: React.ReactNode;
  /** Custom fallback component (defaults to redirect) */
  fallback?: React.ReactNode;
  /** Custom redirect path (defaults to /unauthorized) */
  redirectTo?: string;
}

/**
 * Protects content based on user roles or feature access.
 *
 * @example
 * ```tsx
 * // Require specific role
 * <RequireRole role="developer">
 *   <AgentManager />
 * </RequireRole>
 *
 * // Require feature access
 * <RequireRole feature="forge:agents">
 *   <AgentManager />
 * </RequireRole>
 *
 * // Require any of multiple roles
 * <RequireRole anyRole={["developer", "admin"]}>
 *   <Dashboard />
 * </RequireRole>
 *
 * // Custom fallback
 * <RequireRole role="admin" fallback={<AccessDeniedCard />}>
 *   <AdminPanel />
 * </RequireRole>
 * ```
 */
export function RequireRole({
  role,
  feature,
  anyRole,
  anyFeature,
  children,
  fallback,
  redirectTo = "/unauthorized",
}: RequireRoleProps) {
  const { hasRole, canAccess, isLoading } = useAdminAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-400">Checking permissions...</div>
      </div>
    );
  }

  // Check role requirement
  if (role && !hasRole(role)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to={redirectTo} />;
  }

  // Check feature requirement
  if (feature && !canAccess(feature)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to={redirectTo} />;
  }

  // Check any role requirement
  if (anyRole && anyRole.length > 0) {
    const hasAnyRole = anyRole.some((r) => hasRole(r));
    if (!hasAnyRole) {
      if (fallback) return <>{fallback}</>;
      return <Navigate to={redirectTo} />;
    }
  }

  // Check any feature requirement
  if (anyFeature && anyFeature.length > 0) {
    const hasAnyFeature = anyFeature.some((f) => canAccess(f));
    if (!hasAnyFeature) {
      if (fallback) return <>{fallback}</>;
      return <Navigate to={redirectTo} />;
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order component version for route components.
 *
 * @example
 * ```tsx
 * export const AgentPage = withRequireRole(AgentPageContent, {
 *   feature: "forge:agents",
 * });
 * ```
 */
export function withRequireRole<TProps extends object>(
  Component: React.ComponentType<TProps>,
  options: Omit<RequireRoleProps, "children">
) {
  return function WrappedComponent(props: TProps) {
    return (
      <RequireRole {...options}>
        <Component {...props} />
      </RequireRole>
    );
  };
}
