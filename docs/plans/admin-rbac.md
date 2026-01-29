# Admin App RBAC Plan

## Overview

Add role-based access control to the admin app so Forge features and admin features are accessible based on user roles.

## Roles

| Role | Description | Access |
|------|-------------|--------|
| `super_admin` | Full system access | Everything |
| `admin` | Operations/management | Users, settings, billing, analytics |
| `developer` | Engineering workflow | Forge: tickets, agents, deployments, registry |
| `viewer` | Read-only Forge access | View Forge dashboards, no mutations |

Users can have multiple roles (e.g., `admin` + `developer`).

## Role Storage

**Recommended: Clerk User Metadata**

Store roles in Clerk's `publicMetadata`:
```json
{
  "adminRoles": ["developer", "admin"]
}
```

**Why Clerk metadata:**
- Already using Clerk for auth
- No database migration needed
- Syncs automatically across sessions
- Can be set via Clerk Dashboard or API

## Implementation Steps

### Step 1: Add Admin Role Types to @axori/permissions

```typescript
// packages/permissions/src/admin-roles.ts

export const ADMIN_ROLES = ["super_admin", "admin", "developer", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  developer: "Developer",
  viewer: "Viewer",
};

// Feature access mapping
export const ROLE_FEATURES: Record<AdminRole, string[]> = {
  super_admin: ["*"],
  admin: ["users", "settings", "billing", "analytics"],
  developer: ["forge:board", "forge:tickets", "forge:agents", "forge:budget", "forge:registry"],
  viewer: ["forge:board:read", "forge:tickets:read", "forge:budget:read"],
};

// Helper functions
export function hasAdminRole(userRoles: AdminRole[], requiredRole: AdminRole): boolean;
export function hasFeatureAccess(userRoles: AdminRole[], feature: string): boolean;
export function canAccessForge(userRoles: AdminRole[]): boolean;
export function canAccessAdmin(userRoles: AdminRole[]): boolean;
```

### Step 2: Create Admin Auth Hook

```typescript
// apps/admin/src/hooks/use-admin-auth.ts

import { useUser } from "@clerk/tanstack-start";
import { AdminRole, hasFeatureAccess } from "@axori/permissions";

export function useAdminAuth() {
  const { user } = useUser();

  const roles = (user?.publicMetadata?.adminRoles as AdminRole[]) ?? [];

  return {
    roles,
    hasRole: (role: AdminRole) => roles.includes(role) || roles.includes("super_admin"),
    canAccess: (feature: string) => hasFeatureAccess(roles, feature),
    canAccessForge: roles.some(r => ["super_admin", "developer", "viewer"].includes(r)),
    canAccessAdmin: roles.some(r => ["super_admin", "admin"].includes(r)),
    isReadOnly: roles.length === 1 && roles[0] === "viewer",
  };
}
```

### Step 3: Add Route Guards

```typescript
// apps/admin/src/components/auth/require-role.tsx

import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Navigate } from "@tanstack/react-router";

export function RequireRole({
  role,
  feature,
  children
}: {
  role?: AdminRole;
  feature?: string;
  children: React.ReactNode
}) {
  const { hasRole, canAccess } = useAdminAuth();

  if (role && !hasRole(role)) {
    return <Navigate to="/unauthorized" />;
  }

  if (feature && !canAccess(feature)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}
```

### Step 4: Update Navigation

```typescript
// apps/admin/src/components/side-nav/SideNav.tsx

const { canAccessForge, canAccessAdmin, isReadOnly } = useAdminAuth();

const navItems = [
  // Forge section - developers
  canAccessForge && {
    label: "Forge",
    items: [
      { href: "/forge/board", label: "Board", icon: Kanban },
      { href: "/forge/tickets", label: "Tickets", icon: Ticket },
      !isReadOnly && { href: "/forge/agents", label: "Agents", icon: Bot },
      { href: "/forge/budget", label: "Budget", icon: DollarSign },
    ].filter(Boolean),
  },

  // Admin section - admins
  canAccessAdmin && {
    label: "Admin",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
].filter(Boolean);
```

### Step 5: Protect API Routes

```typescript
// apps/api/src/middleware/admin-roles.ts

import { AdminRole, hasFeatureAccess } from "@axori/permissions";

export function requireAdminRole(requiredRole: AdminRole) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    const roles = user?.publicMetadata?.adminRoles as AdminRole[] ?? [];

    if (!roles.includes(requiredRole) && !roles.includes("super_admin")) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
}

export function requireFeature(feature: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    const roles = user?.publicMetadata?.adminRoles as AdminRole[] ?? [];

    if (!hasFeatureAccess(roles, feature)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
}
```

## Route Structure

```
/admin
├── /                    # Dashboard (all roles)
├── /forge               # Forge section
│   ├── /board           # Kanban board (developer, viewer)
│   ├── /tickets         # Ticket management (developer)
│   ├── /tickets/:id     # Ticket detail (developer, viewer)
│   ├── /agents          # Agent executions (developer)
│   ├── /budget          # Token budget (developer, viewer)
│   └── /registry        # Code registry (developer)
├── /users               # User management (admin)
├── /settings            # System settings (admin)
├── /billing             # Billing management (admin)
└── /unauthorized        # Access denied page
```

## Setting Up Initial Roles

### Via Clerk Dashboard

1. Go to Clerk Dashboard → Users
2. Select user → Metadata
3. Add to Public Metadata:
   ```json
   {
     "adminRoles": ["developer"]
   }
   ```

### Via API (for automation)

```typescript
import { clerkClient } from "@clerk/clerk-sdk-node";

await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    adminRoles: ["developer", "admin"],
  },
});
```

## Migration Checklist

- [ ] Add admin role types to `@axori/permissions`
- [ ] Create `useAdminAuth` hook
- [ ] Create `RequireRole` component
- [ ] Update `SideNav` with role-based navigation
- [ ] Add route guards to protected routes
- [ ] Add API middleware for role checks
- [ ] Create unauthorized page
- [ ] Set up initial user roles in Clerk
- [ ] Update DEPLOYMENT.md with role setup instructions

## Future Enhancements

1. **Role Management UI** - Allow super_admins to manage user roles
2. **Audit Logging** - Track role changes and access
3. **Team Roles** - Scope roles to teams/organizations
4. **Fine-grained Permissions** - Per-project or per-milestone access
