/**
 * Permission Helpers Tests
 *
 * Comprehensive tests for the permission checking helper functions.
 * These tests cover:
 * - Role hierarchy enforcement
 * - Property-level access restrictions
 * - Permission context building
 * - Validation helpers
 *
 * @see AXO-116: Add comprehensive permission tests
 */

import { describe, expect, it } from "vitest";
import type { PropertyAccess } from "@axori/db";
import {
  // Role hierarchy helpers
  getRoleRank,
  isRoleHigherThan,
  isRoleAtLeast,
  canManageRole,
  getAssignableRoles,
  // Portfolio permission helpers
  canPerformPortfolioAction,
  getAllowedPortfolioActions,
  canInviteMembers,
  canRemoveMembers,
  canDeletePortfolio,
  canEditPortfolio,
  canAddProperties,
  canViewAuditLog,
  canManageBilling,
  // High-level permission checks
  canView,
  canEdit,
  canAdmin,
  // Property permission helpers
  getPropertyPermissions,
  hasPropertyPermission,
  canViewProperty,
  canEditProperty,
  canManageProperty,
  canDeleteProperty,
  hasAnyPropertyAccess,
  getAccessiblePropertyIds,
  // Permission context builders
  buildPermissionCheckResult,
  buildPropertyPermissionCheckResult,
  // Validation helpers
  isValidRole,
  parseRole,
  isValidPropertyPermission,
  isValidPropertyAccess,
  // Types
  type PermissionContext,
  type PortfolioRole,
} from "../index";

// ============================================================================
// Role Hierarchy Tests
// ============================================================================

describe("Role Hierarchy", () => {
  describe("getRoleRank", () => {
    it("returns correct rank for each role", () => {
      expect(getRoleRank("owner")).toBe(3);
      expect(getRoleRank("admin")).toBe(2);
      expect(getRoleRank("member")).toBe(1);
      expect(getRoleRank("viewer")).toBe(0);
    });

    it("owner has highest rank", () => {
      const ownerRank = getRoleRank("owner");
      expect(ownerRank).toBeGreaterThan(getRoleRank("admin"));
      expect(ownerRank).toBeGreaterThan(getRoleRank("member"));
      expect(ownerRank).toBeGreaterThan(getRoleRank("viewer"));
    });
  });

  describe("isRoleHigherThan", () => {
    it("correctly compares owner to other roles", () => {
      expect(isRoleHigherThan("owner", "admin")).toBe(true);
      expect(isRoleHigherThan("owner", "member")).toBe(true);
      expect(isRoleHigherThan("owner", "viewer")).toBe(true);
      expect(isRoleHigherThan("owner", "owner")).toBe(false);
    });

    it("correctly compares admin to other roles", () => {
      expect(isRoleHigherThan("admin", "owner")).toBe(false);
      expect(isRoleHigherThan("admin", "admin")).toBe(false);
      expect(isRoleHigherThan("admin", "member")).toBe(true);
      expect(isRoleHigherThan("admin", "viewer")).toBe(true);
    });

    it("correctly compares member to other roles", () => {
      expect(isRoleHigherThan("member", "owner")).toBe(false);
      expect(isRoleHigherThan("member", "admin")).toBe(false);
      expect(isRoleHigherThan("member", "member")).toBe(false);
      expect(isRoleHigherThan("member", "viewer")).toBe(true);
    });

    it("viewer is not higher than any role", () => {
      expect(isRoleHigherThan("viewer", "owner")).toBe(false);
      expect(isRoleHigherThan("viewer", "admin")).toBe(false);
      expect(isRoleHigherThan("viewer", "member")).toBe(false);
      expect(isRoleHigherThan("viewer", "viewer")).toBe(false);
    });
  });

  describe("isRoleAtLeast", () => {
    it("owner meets all role requirements", () => {
      expect(isRoleAtLeast("owner", "owner")).toBe(true);
      expect(isRoleAtLeast("owner", "admin")).toBe(true);
      expect(isRoleAtLeast("owner", "member")).toBe(true);
      expect(isRoleAtLeast("owner", "viewer")).toBe(true);
    });

    it("admin meets admin and below requirements", () => {
      expect(isRoleAtLeast("admin", "owner")).toBe(false);
      expect(isRoleAtLeast("admin", "admin")).toBe(true);
      expect(isRoleAtLeast("admin", "member")).toBe(true);
      expect(isRoleAtLeast("admin", "viewer")).toBe(true);
    });

    it("member meets member and viewer requirements", () => {
      expect(isRoleAtLeast("member", "owner")).toBe(false);
      expect(isRoleAtLeast("member", "admin")).toBe(false);
      expect(isRoleAtLeast("member", "member")).toBe(true);
      expect(isRoleAtLeast("member", "viewer")).toBe(true);
    });

    it("viewer only meets viewer requirement", () => {
      expect(isRoleAtLeast("viewer", "owner")).toBe(false);
      expect(isRoleAtLeast("viewer", "admin")).toBe(false);
      expect(isRoleAtLeast("viewer", "member")).toBe(false);
      expect(isRoleAtLeast("viewer", "viewer")).toBe(true);
    });
  });

  describe("canManageRole", () => {
    it("owner can manage admin, member, and viewer", () => {
      expect(canManageRole("owner", "admin")).toBe(true);
      expect(canManageRole("owner", "member")).toBe(true);
      expect(canManageRole("owner", "viewer")).toBe(true);
    });

    it("owner cannot manage other owners", () => {
      expect(canManageRole("owner", "owner")).toBe(false);
    });

    it("admin can manage member and viewer", () => {
      expect(canManageRole("admin", "member")).toBe(true);
      expect(canManageRole("admin", "viewer")).toBe(true);
    });

    it("admin cannot manage owner or other admins", () => {
      expect(canManageRole("admin", "owner")).toBe(false);
      expect(canManageRole("admin", "admin")).toBe(false);
    });

    it("member cannot manage any roles", () => {
      expect(canManageRole("member", "owner")).toBe(false);
      expect(canManageRole("member", "admin")).toBe(false);
      expect(canManageRole("member", "member")).toBe(false);
      expect(canManageRole("member", "viewer")).toBe(false);
    });

    it("viewer cannot manage any roles", () => {
      expect(canManageRole("viewer", "owner")).toBe(false);
      expect(canManageRole("viewer", "admin")).toBe(false);
      expect(canManageRole("viewer", "member")).toBe(false);
      expect(canManageRole("viewer", "viewer")).toBe(false);
    });
  });

  describe("getAssignableRoles", () => {
    it("returns correct assignable roles for owner", () => {
      const roles = getAssignableRoles("owner");
      expect(roles).toContain("admin");
      expect(roles).toContain("member");
      expect(roles).toContain("viewer");
      expect(roles).not.toContain("owner");
      expect(roles).toHaveLength(3);
    });

    it("returns correct assignable roles for admin", () => {
      const roles = getAssignableRoles("admin");
      expect(roles).toContain("member");
      expect(roles).toContain("viewer");
      expect(roles).not.toContain("owner");
      expect(roles).not.toContain("admin");
      expect(roles).toHaveLength(2);
    });

    it("member cannot assign any roles", () => {
      const roles = getAssignableRoles("member");
      expect(roles).toHaveLength(0);
    });

    it("viewer cannot assign any roles", () => {
      const roles = getAssignableRoles("viewer");
      expect(roles).toHaveLength(0);
    });
  });
});

// ============================================================================
// Portfolio Permission Tests
// ============================================================================

describe("Portfolio Permissions", () => {
  describe("canPerformPortfolioAction", () => {
    it("owner can perform all actions", () => {
      expect(canPerformPortfolioAction("owner", "view_portfolio")).toBe(true);
      expect(canPerformPortfolioAction("owner", "edit_portfolio")).toBe(true);
      expect(canPerformPortfolioAction("owner", "delete_portfolio")).toBe(true);
      expect(canPerformPortfolioAction("owner", "invite_members")).toBe(true);
      expect(canPerformPortfolioAction("owner", "remove_members")).toBe(true);
      expect(canPerformPortfolioAction("owner", "change_member_roles")).toBe(true);
      expect(canPerformPortfolioAction("owner", "add_properties")).toBe(true);
      expect(canPerformPortfolioAction("owner", "view_audit_log")).toBe(true);
      expect(canPerformPortfolioAction("owner", "manage_billing")).toBe(true);
    });

    it("admin can perform most actions except owner-only ones", () => {
      expect(canPerformPortfolioAction("admin", "view_portfolio")).toBe(true);
      expect(canPerformPortfolioAction("admin", "edit_portfolio")).toBe(true);
      expect(canPerformPortfolioAction("admin", "invite_members")).toBe(true);
      expect(canPerformPortfolioAction("admin", "remove_members")).toBe(true);
      expect(canPerformPortfolioAction("admin", "add_properties")).toBe(true);
      expect(canPerformPortfolioAction("admin", "view_audit_log")).toBe(true);
      // Admin cannot do owner-only actions
      expect(canPerformPortfolioAction("admin", "delete_portfolio")).toBe(false);
      expect(canPerformPortfolioAction("admin", "change_member_roles")).toBe(false);
      expect(canPerformPortfolioAction("admin", "manage_billing")).toBe(false);
    });

    it("member has limited actions", () => {
      expect(canPerformPortfolioAction("member", "view_portfolio")).toBe(true);
      expect(canPerformPortfolioAction("member", "add_properties")).toBe(true);
      // Member cannot do admin actions
      expect(canPerformPortfolioAction("member", "edit_portfolio")).toBe(false);
      expect(canPerformPortfolioAction("member", "invite_members")).toBe(false);
      expect(canPerformPortfolioAction("member", "remove_members")).toBe(false);
      expect(canPerformPortfolioAction("member", "view_audit_log")).toBe(false);
    });

    it("viewer can only view", () => {
      expect(canPerformPortfolioAction("viewer", "view_portfolio")).toBe(true);
      // Viewer cannot do anything else
      expect(canPerformPortfolioAction("viewer", "edit_portfolio")).toBe(false);
      expect(canPerformPortfolioAction("viewer", "add_properties")).toBe(false);
      expect(canPerformPortfolioAction("viewer", "invite_members")).toBe(false);
    });
  });

  describe("getAllowedPortfolioActions", () => {
    it("returns all actions for owner", () => {
      const actions = getAllowedPortfolioActions("owner");
      expect(actions).toHaveLength(9); // All 9 portfolio actions
      expect(actions).toContain("delete_portfolio");
      expect(actions).toContain("change_member_roles");
      expect(actions).toContain("manage_billing");
    });

    it("returns correct actions for admin", () => {
      const actions = getAllowedPortfolioActions("admin");
      expect(actions).toHaveLength(6);
      expect(actions).not.toContain("delete_portfolio");
      expect(actions).not.toContain("change_member_roles");
      expect(actions).not.toContain("manage_billing");
    });

    it("returns correct actions for member", () => {
      const actions = getAllowedPortfolioActions("member");
      expect(actions).toHaveLength(2);
      expect(actions).toContain("view_portfolio");
      expect(actions).toContain("add_properties");
    });

    it("returns only view for viewer", () => {
      const actions = getAllowedPortfolioActions("viewer");
      expect(actions).toHaveLength(1);
      expect(actions).toContain("view_portfolio");
    });
  });

  describe("Convenience permission functions", () => {
    it("canInviteMembers returns correct values", () => {
      expect(canInviteMembers("owner")).toBe(true);
      expect(canInviteMembers("admin")).toBe(true);
      expect(canInviteMembers("member")).toBe(false);
      expect(canInviteMembers("viewer")).toBe(false);
    });

    it("canRemoveMembers returns correct values", () => {
      expect(canRemoveMembers("owner")).toBe(true);
      expect(canRemoveMembers("admin")).toBe(true);
      expect(canRemoveMembers("member")).toBe(false);
      expect(canRemoveMembers("viewer")).toBe(false);
    });

    it("canDeletePortfolio returns correct values", () => {
      expect(canDeletePortfolio("owner")).toBe(true);
      expect(canDeletePortfolio("admin")).toBe(false);
      expect(canDeletePortfolio("member")).toBe(false);
      expect(canDeletePortfolio("viewer")).toBe(false);
    });

    it("canEditPortfolio returns correct values", () => {
      expect(canEditPortfolio("owner")).toBe(true);
      expect(canEditPortfolio("admin")).toBe(true);
      expect(canEditPortfolio("member")).toBe(false);
      expect(canEditPortfolio("viewer")).toBe(false);
    });

    it("canAddProperties returns correct values", () => {
      expect(canAddProperties("owner")).toBe(true);
      expect(canAddProperties("admin")).toBe(true);
      expect(canAddProperties("member")).toBe(true);
      expect(canAddProperties("viewer")).toBe(false);
    });

    it("canViewAuditLog returns correct values", () => {
      expect(canViewAuditLog("owner")).toBe(true);
      expect(canViewAuditLog("admin")).toBe(true);
      expect(canViewAuditLog("member")).toBe(false);
      expect(canViewAuditLog("viewer")).toBe(false);
    });

    it("canManageBilling returns correct values", () => {
      expect(canManageBilling("owner")).toBe(true);
      expect(canManageBilling("admin")).toBe(false);
      expect(canManageBilling("member")).toBe(false);
      expect(canManageBilling("viewer")).toBe(false);
    });
  });

  describe("High-level permission checks", () => {
    it("canView returns true for all roles", () => {
      expect(canView("owner")).toBe(true);
      expect(canView("admin")).toBe(true);
      expect(canView("member")).toBe(true);
      expect(canView("viewer")).toBe(true);
    });

    it("canEdit returns correct values", () => {
      expect(canEdit("owner")).toBe(true);
      expect(canEdit("admin")).toBe(true);
      expect(canEdit("member")).toBe(true);
      expect(canEdit("viewer")).toBe(false);
    });

    it("canAdmin returns correct values", () => {
      expect(canAdmin("owner")).toBe(true);
      expect(canAdmin("admin")).toBe(true);
      expect(canAdmin("member")).toBe(false);
      expect(canAdmin("viewer")).toBe(false);
    });
  });
});

// ============================================================================
// Property Permission Tests
// ============================================================================

describe("Property Permissions", () => {
  const propertyId = "property-123";

  describe("getPropertyPermissions", () => {
    it("returns default permissions when propertyAccess is null", () => {
      expect(getPropertyPermissions("owner", propertyId, null)).toEqual([
        "view",
        "edit",
        "manage",
        "delete",
      ]);
      expect(getPropertyPermissions("admin", propertyId, null)).toEqual([
        "view",
        "edit",
        "manage",
        "delete",
      ]);
      expect(getPropertyPermissions("member", propertyId, null)).toEqual([
        "view",
        "edit",
      ]);
      expect(getPropertyPermissions("viewer", propertyId, null)).toEqual([
        "view",
      ]);
    });

    it("returns empty array when property not in propertyAccess", () => {
      const propertyAccess: PropertyAccess = {
        "other-property": ["view"],
      };
      expect(getPropertyPermissions("owner", propertyId, propertyAccess)).toEqual([]);
      expect(getPropertyPermissions("viewer", propertyId, propertyAccess)).toEqual([]);
    });

    it("returns intersection of role and property permissions", () => {
      const propertyAccess: PropertyAccess = {
        [propertyId]: ["view", "edit"],
      };
      // Member has ["view", "edit"] default, so all are allowed
      expect(getPropertyPermissions("member", propertyId, propertyAccess)).toEqual([
        "view",
        "edit",
      ]);
      // Viewer only has ["view"] default, so "edit" should not be included
      expect(getPropertyPermissions("viewer", propertyId, propertyAccess)).toEqual([
        "view",
      ]);
    });

    it("filters out permissions that exceed role defaults", () => {
      const propertyAccess: PropertyAccess = {
        [propertyId]: ["view", "edit", "manage", "delete"],
      };
      // Viewer can only view even if propertyAccess says otherwise
      expect(getPropertyPermissions("viewer", propertyId, propertyAccess)).toEqual([
        "view",
      ]);
      // Member can only view and edit
      expect(getPropertyPermissions("member", propertyId, propertyAccess)).toEqual([
        "view",
        "edit",
      ]);
    });

    it("handles empty permissions array in propertyAccess", () => {
      const propertyAccess: PropertyAccess = {
        [propertyId]: [],
      };
      expect(getPropertyPermissions("owner", propertyId, propertyAccess)).toEqual([]);
    });
  });

  describe("hasPropertyPermission", () => {
    it("returns true when permission is granted via null access", () => {
      expect(hasPropertyPermission("owner", propertyId, "delete", null)).toBe(true);
      expect(hasPropertyPermission("member", propertyId, "edit", null)).toBe(true);
      expect(hasPropertyPermission("viewer", propertyId, "view", null)).toBe(true);
    });

    it("returns false when permission exceeds role default", () => {
      expect(hasPropertyPermission("viewer", propertyId, "edit", null)).toBe(false);
      expect(hasPropertyPermission("member", propertyId, "manage", null)).toBe(false);
    });

    it("returns false when property not in propertyAccess", () => {
      const propertyAccess: PropertyAccess = {
        "other-property": ["view"],
      };
      expect(hasPropertyPermission("owner", propertyId, "view", propertyAccess)).toBe(false);
    });

    it("returns correct value based on propertyAccess", () => {
      const propertyAccess: PropertyAccess = {
        [propertyId]: ["view", "edit"],
      };
      expect(hasPropertyPermission("owner", propertyId, "view", propertyAccess)).toBe(true);
      expect(hasPropertyPermission("owner", propertyId, "edit", propertyAccess)).toBe(true);
      expect(hasPropertyPermission("owner", propertyId, "delete", propertyAccess)).toBe(false);
    });
  });

  describe("Property permission convenience functions", () => {
    it("canViewProperty works correctly", () => {
      expect(canViewProperty("viewer", propertyId, null)).toBe(true);
      expect(canViewProperty("owner", propertyId, { "other": ["view"] })).toBe(false);
      expect(canViewProperty("member", propertyId, { [propertyId]: ["view"] })).toBe(true);
    });

    it("canEditProperty works correctly", () => {
      expect(canEditProperty("member", propertyId, null)).toBe(true);
      expect(canEditProperty("viewer", propertyId, null)).toBe(false);
      expect(canEditProperty("owner", propertyId, { [propertyId]: ["view"] })).toBe(false);
    });

    it("canManageProperty works correctly", () => {
      expect(canManageProperty("admin", propertyId, null)).toBe(true);
      expect(canManageProperty("member", propertyId, null)).toBe(false);
      expect(canManageProperty("owner", propertyId, { [propertyId]: ["manage"] })).toBe(true);
    });

    it("canDeleteProperty works correctly", () => {
      expect(canDeleteProperty("owner", propertyId, null)).toBe(true);
      expect(canDeleteProperty("member", propertyId, null)).toBe(false);
      expect(canDeleteProperty("admin", propertyId, { [propertyId]: ["delete"] })).toBe(true);
    });
  });

  describe("hasAnyPropertyAccess", () => {
    it("returns true for null propertyAccess (full access)", () => {
      expect(hasAnyPropertyAccess(null)).toBe(true);
    });

    it("returns true when propertyAccess has at least one property", () => {
      expect(hasAnyPropertyAccess({ [propertyId]: ["view"] })).toBe(true);
    });

    it("returns false for empty propertyAccess object", () => {
      expect(hasAnyPropertyAccess({})).toBe(false);
    });
  });

  describe("getAccessiblePropertyIds", () => {
    it("returns null for full access (null propertyAccess)", () => {
      expect(getAccessiblePropertyIds(null)).toBeNull();
    });

    it("returns array of property IDs from propertyAccess", () => {
      const propertyAccess: PropertyAccess = {
        "property-1": ["view"],
        "property-2": ["view", "edit"],
      };
      const ids = getAccessiblePropertyIds(propertyAccess);
      expect(ids).toContain("property-1");
      expect(ids).toContain("property-2");
      expect(ids).toHaveLength(2);
    });

    it("returns empty array for empty propertyAccess", () => {
      expect(getAccessiblePropertyIds({})).toEqual([]);
    });
  });
});

// ============================================================================
// Permission Context Tests
// ============================================================================

describe("Permission Context", () => {
  const createContext = (
    role: PortfolioRole,
    propertyAccess: PropertyAccess = null
  ): PermissionContext => ({
    userId: "user-123",
    portfolioId: "portfolio-123",
    role,
    propertyAccess,
  });

  describe("buildPermissionCheckResult", () => {
    it("returns correct permissions for owner", () => {
      const context = createContext("owner");
      const result = buildPermissionCheckResult(context);

      expect(result.canViewPortfolio).toBe(true);
      expect(result.canEditPortfolio).toBe(true);
      expect(result.canDeletePortfolio).toBe(true);
      expect(result.canInviteMembers).toBe(true);
      expect(result.canRemoveMembers).toBe(true);
      expect(result.canChangeRoles).toBe(true);
      expect(result.canAddProperties).toBe(true);
      expect(result.canViewAuditLog).toBe(true);
      expect(result.canManageBilling).toBe(true);
      expect(result.canView).toBe(true);
      expect(result.canEdit).toBe(true);
      expect(result.canAdmin).toBe(true);
      expect(result.hasFullPropertyAccess).toBe(true);
      expect(result.accessiblePropertyIds).toBeNull();
      expect(result.assignableRoles).toContain("admin");
      expect(result.assignableRoles).toContain("member");
      expect(result.assignableRoles).toContain("viewer");
    });

    it("returns correct permissions for admin", () => {
      const context = createContext("admin");
      const result = buildPermissionCheckResult(context);

      expect(result.canViewPortfolio).toBe(true);
      expect(result.canEditPortfolio).toBe(true);
      expect(result.canDeletePortfolio).toBe(false);
      expect(result.canInviteMembers).toBe(true);
      expect(result.canRemoveMembers).toBe(true);
      expect(result.canChangeRoles).toBe(false);
      expect(result.canManageBilling).toBe(false);
      expect(result.canAdmin).toBe(true);
    });

    it("returns correct permissions for member", () => {
      const context = createContext("member");
      const result = buildPermissionCheckResult(context);

      expect(result.canViewPortfolio).toBe(true);
      expect(result.canEditPortfolio).toBe(false);
      expect(result.canInviteMembers).toBe(false);
      expect(result.canAddProperties).toBe(true);
      expect(result.canView).toBe(true);
      expect(result.canEdit).toBe(true);
      expect(result.canAdmin).toBe(false);
    });

    it("returns correct permissions for viewer", () => {
      const context = createContext("viewer");
      const result = buildPermissionCheckResult(context);

      expect(result.canViewPortfolio).toBe(true);
      expect(result.canEditPortfolio).toBe(false);
      expect(result.canAddProperties).toBe(false);
      expect(result.canView).toBe(true);
      expect(result.canEdit).toBe(false);
      expect(result.canAdmin).toBe(false);
      expect(result.assignableRoles).toEqual([]);
    });

    it("handles property access restrictions", () => {
      const propertyAccess: PropertyAccess = {
        "property-1": ["view"],
        "property-2": ["view", "edit"],
      };
      const context = createContext("member", propertyAccess);
      const result = buildPermissionCheckResult(context);

      expect(result.hasFullPropertyAccess).toBe(false);
      expect(result.accessiblePropertyIds).toContain("property-1");
      expect(result.accessiblePropertyIds).toContain("property-2");
    });
  });

  describe("buildPropertyPermissionCheckResult", () => {
    it("returns correct permissions for owner on owned property", () => {
      const context = createContext("owner");
      const result = buildPropertyPermissionCheckResult(context, "property-123");

      expect(result.propertyId).toBe("property-123");
      expect(result.canView).toBe(true);
      expect(result.canEdit).toBe(true);
      expect(result.canManage).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.permissions).toContain("view");
      expect(result.permissions).toContain("edit");
      expect(result.permissions).toContain("manage");
      expect(result.permissions).toContain("delete");
    });

    it("returns correct permissions for viewer", () => {
      const context = createContext("viewer");
      const result = buildPropertyPermissionCheckResult(context, "property-123");

      expect(result.canView).toBe(true);
      expect(result.canEdit).toBe(false);
      expect(result.canManage).toBe(false);
      expect(result.canDelete).toBe(false);
      expect(result.permissions).toEqual(["view"]);
    });

    it("returns no permissions for inaccessible property", () => {
      const context = createContext("owner", { "other-property": ["view"] });
      const result = buildPropertyPermissionCheckResult(context, "property-123");

      expect(result.canView).toBe(false);
      expect(result.canEdit).toBe(false);
      expect(result.permissions).toEqual([]);
    });

    it("respects property-level restrictions even for owner role", () => {
      const context = createContext("owner", {
        "property-123": ["view", "edit"],
      });
      const result = buildPropertyPermissionCheckResult(context, "property-123");

      expect(result.canView).toBe(true);
      expect(result.canEdit).toBe(true);
      expect(result.canManage).toBe(false);
      expect(result.canDelete).toBe(false);
    });
  });
});

// ============================================================================
// Validation Helpers Tests
// ============================================================================

describe("Validation Helpers", () => {
  describe("isValidRole", () => {
    it("returns true for valid roles", () => {
      expect(isValidRole("owner")).toBe(true);
      expect(isValidRole("admin")).toBe(true);
      expect(isValidRole("member")).toBe(true);
      expect(isValidRole("viewer")).toBe(true);
    });

    it("returns false for invalid roles", () => {
      expect(isValidRole("superadmin")).toBe(false);
      expect(isValidRole("")).toBe(false);
      expect(isValidRole("OWNER")).toBe(false);
      expect(isValidRole("Owner")).toBe(false);
    });
  });

  describe("parseRole", () => {
    it("returns role for valid role strings", () => {
      expect(parseRole("owner")).toBe("owner");
      expect(parseRole("admin")).toBe("admin");
      expect(parseRole("member")).toBe("member");
      expect(parseRole("viewer")).toBe("viewer");
    });

    it("returns undefined for invalid roles", () => {
      expect(parseRole("invalid")).toBeUndefined();
      expect(parseRole("")).toBeUndefined();
      expect(parseRole(null)).toBeUndefined();
      expect(parseRole(undefined)).toBeUndefined();
    });
  });

  describe("isValidPropertyPermission", () => {
    it("returns true for valid permissions", () => {
      expect(isValidPropertyPermission("view")).toBe(true);
      expect(isValidPropertyPermission("edit")).toBe(true);
      expect(isValidPropertyPermission("manage")).toBe(true);
      expect(isValidPropertyPermission("delete")).toBe(true);
    });

    it("returns false for invalid permissions", () => {
      expect(isValidPropertyPermission("admin")).toBe(false);
      expect(isValidPropertyPermission("")).toBe(false);
      expect(isValidPropertyPermission("VIEW")).toBe(false);
    });
  });

  describe("isValidPropertyAccess", () => {
    it("returns true for null (full access)", () => {
      expect(isValidPropertyAccess(null)).toBe(true);
    });

    it("returns true for valid propertyAccess objects", () => {
      expect(isValidPropertyAccess({
        "property-1": ["view"],
      })).toBe(true);

      expect(isValidPropertyAccess({
        "property-1": ["view", "edit"],
        "property-2": ["view", "edit", "manage", "delete"],
      })).toBe(true);

      expect(isValidPropertyAccess({})).toBe(true);
    });

    it("returns false for invalid structures", () => {
      expect(isValidPropertyAccess([])).toBe(false);
      expect(isValidPropertyAccess("string")).toBe(false);
      expect(isValidPropertyAccess(123)).toBe(false);
    });

    it("returns false for invalid permissions in propertyAccess", () => {
      expect(isValidPropertyAccess({
        "property-1": ["view", "invalid"],
      })).toBe(false);

      expect(isValidPropertyAccess({
        "property-1": ["VIEW"],
      })).toBe(false);
    });

    it("returns false for non-array permission values", () => {
      expect(isValidPropertyAccess({
        "property-1": "view" as unknown as string[],
      })).toBe(false);
    });
  });
});

// ============================================================================
// Privilege Escalation Prevention Tests
// ============================================================================

describe("Privilege Escalation Prevention", () => {
  describe("Role hierarchy prevents escalation", () => {
    it("lower roles cannot manage higher roles via canManageRole", () => {
      // Admin cannot manage owner
      expect(canManageRole("admin", "owner")).toBe(false);
      // Member cannot manage admin or owner
      expect(canManageRole("member", "admin")).toBe(false);
      expect(canManageRole("member", "owner")).toBe(false);
      // Viewer cannot manage anyone
      expect(canManageRole("viewer", "owner")).toBe(false);
      expect(canManageRole("viewer", "admin")).toBe(false);
      expect(canManageRole("viewer", "member")).toBe(false);
    });

    it("roles cannot assign themselves or higher via getAssignableRoles", () => {
      // Admin cannot assign admin or owner
      expect(getAssignableRoles("admin")).not.toContain("admin");
      expect(getAssignableRoles("admin")).not.toContain("owner");
      // Owner cannot assign owner
      expect(getAssignableRoles("owner")).not.toContain("owner");
    });
  });

  describe("Property permissions cannot exceed role defaults", () => {
    const propertyId = "property-123";

    it("viewer cannot have edit permission even with explicit propertyAccess", () => {
      const propertyAccess: PropertyAccess = {
        [propertyId]: ["view", "edit", "manage", "delete"],
      };
      const permissions = getPropertyPermissions("viewer", propertyId, propertyAccess);
      expect(permissions).not.toContain("edit");
      expect(permissions).not.toContain("manage");
      expect(permissions).not.toContain("delete");
      expect(permissions).toEqual(["view"]);
    });

    it("member cannot have manage/delete permissions even with explicit propertyAccess", () => {
      const propertyAccess: PropertyAccess = {
        [propertyId]: ["view", "edit", "manage", "delete"],
      };
      const permissions = getPropertyPermissions("member", propertyId, propertyAccess);
      expect(permissions).not.toContain("manage");
      expect(permissions).not.toContain("delete");
      expect(permissions).toEqual(["view", "edit"]);
    });
  });

  describe("Only owner has certain exclusive permissions", () => {
    it("only owner can change member roles", () => {
      expect(canPerformPortfolioAction("owner", "change_member_roles")).toBe(true);
      expect(canPerformPortfolioAction("admin", "change_member_roles")).toBe(false);
      expect(canPerformPortfolioAction("member", "change_member_roles")).toBe(false);
      expect(canPerformPortfolioAction("viewer", "change_member_roles")).toBe(false);
    });

    it("only owner can delete portfolio", () => {
      expect(canPerformPortfolioAction("owner", "delete_portfolio")).toBe(true);
      expect(canPerformPortfolioAction("admin", "delete_portfolio")).toBe(false);
      expect(canPerformPortfolioAction("member", "delete_portfolio")).toBe(false);
      expect(canPerformPortfolioAction("viewer", "delete_portfolio")).toBe(false);
    });

    it("only owner can manage billing", () => {
      expect(canPerformPortfolioAction("owner", "manage_billing")).toBe(true);
      expect(canPerformPortfolioAction("admin", "manage_billing")).toBe(false);
      expect(canPerformPortfolioAction("member", "manage_billing")).toBe(false);
      expect(canPerformPortfolioAction("viewer", "manage_billing")).toBe(false);
    });
  });
});

// ============================================================================
// Edge Cases and Boundary Tests
// ============================================================================

describe("Edge Cases", () => {
  it("handles property access with multiple properties", () => {
    const propertyAccess: PropertyAccess = {
      "property-1": ["view"],
      "property-2": ["view", "edit"],
      "property-3": ["view", "edit", "manage"],
      "property-4": ["view", "edit", "manage", "delete"],
    };

    // Admin can access all permissions as they're within admin's default
    expect(getPropertyPermissions("admin", "property-1", propertyAccess)).toEqual(["view"]);
    expect(getPropertyPermissions("admin", "property-4", propertyAccess)).toEqual([
      "view", "edit", "manage", "delete"
    ]);

    // Member has restrictions
    expect(getPropertyPermissions("member", "property-3", propertyAccess)).toEqual(["view", "edit"]);
    expect(getPropertyPermissions("member", "property-4", propertyAccess)).toEqual(["view", "edit"]);
  });

  it("handles UUID-like property IDs", () => {
    const propertyId = "550e8400-e29b-41d4-a716-446655440000";
    const propertyAccess: PropertyAccess = {
      [propertyId]: ["view", "edit"],
    };

    expect(hasPropertyPermission("member", propertyId, "view", propertyAccess)).toBe(true);
    expect(hasPropertyPermission("member", propertyId, "edit", propertyAccess)).toBe(true);
    expect(hasPropertyPermission("member", propertyId, "manage", propertyAccess)).toBe(false);
  });

  it("context builder handles all edge cases", () => {
    // Empty property access object (different from null)
    const emptyContext: PermissionContext = {
      userId: "user-1",
      portfolioId: "portfolio-1",
      role: "member",
      propertyAccess: {},
    };
    const result = buildPermissionCheckResult(emptyContext);
    expect(result.hasFullPropertyAccess).toBe(false);
    expect(result.accessiblePropertyIds).toEqual([]);
  });
});
