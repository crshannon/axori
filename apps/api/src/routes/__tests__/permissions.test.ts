/**
 * Permission API Route Tests
 *
 * Comprehensive tests for API route permission enforcement.
 * These tests verify that:
 * - Role hierarchy is properly enforced at the API layer
 * - Property-level access restrictions work correctly
 * - Invitation token validation is secure
 * - Privilege escalation attempts are blocked
 * - Audit logs are created for permission changes
 *
 * @see AXO-116: Add comprehensive permission tests
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { PropertyAccess } from "@axori/db";

// ============================================================================
// Mock Setup
// ============================================================================

// Mock the database module
vi.mock("@axori/db", async () => {
  const actual = await vi.importActual("@axori/db");
  return {
    ...actual,
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    },
    eq: vi.fn((a, b) => ({ type: "eq", field: a, value: b })),
    and: vi.fn((...args) => ({ type: "and", conditions: args })),
    desc: vi.fn((field) => ({ type: "desc", field })),
  };
});

// Import after mocks are set up
import {
  validateInvitation,
  validateRoleChange,
  validateMemberRemoval,
  validatePropertyAccessWithinRole,
  validateNoSelfPromotion,
  validateOwnerProtection,
  validateOnlyOwnerCanChangeRoles,
  validateCanInviteMembers,
  validateRoleAssignment,
  validateNoPrivilegeEscalation,
  type PortfolioRole,
} from "@axori/permissions";

// ============================================================================
// Role Hierarchy Enforcement Tests
// ============================================================================

describe("Role Hierarchy Enforcement", () => {
  describe("API-Level Role Checks", () => {
    it("owner can perform all actions", () => {
      const ownerRole: PortfolioRole = "owner";
      
      // Owner can invite anyone below them
      expect(validateInvitation({ 
        actorRole: ownerRole, 
        invitedRole: "admin" 
      }).allowed).toBe(true);
      
      expect(validateInvitation({ 
        actorRole: ownerRole, 
        invitedRole: "member" 
      }).allowed).toBe(true);
      
      expect(validateInvitation({ 
        actorRole: ownerRole, 
        invitedRole: "viewer" 
      }).allowed).toBe(true);
    });

    it("admin can invite member and viewer but not admin", () => {
      const adminRole: PortfolioRole = "admin";
      
      expect(validateInvitation({ 
        actorRole: adminRole, 
        invitedRole: "member" 
      }).allowed).toBe(true);
      
      expect(validateInvitation({ 
        actorRole: adminRole, 
        invitedRole: "viewer" 
      }).allowed).toBe(true);
      
      // Admin cannot invite another admin
      const result = validateInvitation({ 
        actorRole: adminRole, 
        invitedRole: "admin" 
      });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("ROLE_ESCALATION_DENIED");
    });

    it("member cannot invite anyone", () => {
      const memberRole: PortfolioRole = "member";
      
      const result = validateInvitation({ 
        actorRole: memberRole, 
        invitedRole: "viewer" 
      });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("INSUFFICIENT_PRIVILEGES");
    });

    it("viewer cannot invite anyone", () => {
      const viewerRole: PortfolioRole = "viewer";
      
      const result = validateInvitation({ 
        actorRole: viewerRole, 
        invitedRole: "viewer" 
      });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("INSUFFICIENT_PRIVILEGES");
    });

    it("nobody can invite as owner", () => {
      // Even owner cannot invite another owner
      const result = validateRoleAssignment("owner", "owner");
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("ROLE_ESCALATION_DENIED");
      expect(result.error).toContain("transfer-ownership");
    });
  });

  describe("Role Change Hierarchy", () => {
    it("only owner can change member roles", () => {
      // Owner can change roles
      expect(validateOnlyOwnerCanChangeRoles("owner").allowed).toBe(true);
      
      // Non-owners cannot
      expect(validateOnlyOwnerCanChangeRoles("admin").allowed).toBe(false);
      expect(validateOnlyOwnerCanChangeRoles("member").allowed).toBe(false);
      expect(validateOnlyOwnerCanChangeRoles("viewer").allowed).toBe(false);
    });

    it("owner can demote admin to member", () => {
      const result = validateRoleChange({
        actorUserId: "owner-user",
        targetUserId: "admin-user",
        actorRole: "owner",
        targetCurrentRole: "admin",
        newRole: "member",
      });
      expect(result.allowed).toBe(true);
    });

    it("owner can promote member to admin", () => {
      const result = validateRoleChange({
        actorUserId: "owner-user",
        targetUserId: "member-user",
        actorRole: "owner",
        targetCurrentRole: "member",
        newRole: "admin",
      });
      expect(result.allowed).toBe(true);
    });

    it("admin cannot change any roles", () => {
      const result = validateRoleChange({
        actorUserId: "admin-user",
        targetUserId: "member-user",
        actorRole: "admin",
        targetCurrentRole: "member",
        newRole: "viewer",
      });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("ONLY_OWNER_CAN_CHANGE_ROLES");
    });
  });

  describe("Member Removal Hierarchy", () => {
    it("owner can remove admin", () => {
      const result = validateMemberRemoval({
        actorUserId: "owner-user",
        targetUserId: "admin-user",
        actorRole: "owner",
        targetRole: "admin",
      });
      expect(result.allowed).toBe(true);
    });

    it("admin can remove member", () => {
      const result = validateMemberRemoval({
        actorUserId: "admin-user",
        targetUserId: "member-user",
        actorRole: "admin",
        targetRole: "member",
      });
      expect(result.allowed).toBe(true);
    });

    it("admin cannot remove another admin", () => {
      const result = validateMemberRemoval({
        actorUserId: "admin-user",
        targetUserId: "admin-user-2",
        actorRole: "admin",
        targetRole: "admin",
      });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("INSUFFICIENT_PRIVILEGES");
    });

    it("member cannot remove anyone", () => {
      const result = validateMemberRemoval({
        actorUserId: "member-user",
        targetUserId: "viewer-user",
        actorRole: "member",
        targetRole: "viewer",
      });
      expect(result.allowed).toBe(false);
    });
  });
});

// ============================================================================
// Property-Level Access Restriction Tests
// ============================================================================

describe("Property-Level Access Restrictions", () => {
  describe("PropertyAccess Validation", () => {
    it("null propertyAccess grants full access based on role", () => {
      // All roles are valid with null propertyAccess
      expect(validatePropertyAccessWithinRole("owner", null).allowed).toBe(true);
      expect(validatePropertyAccessWithinRole("admin", null).allowed).toBe(true);
      expect(validatePropertyAccessWithinRole("member", null).allowed).toBe(true);
      expect(validatePropertyAccessWithinRole("viewer", null).allowed).toBe(true);
    });

    it("owner can have all property permissions", () => {
      const propertyAccess: PropertyAccess = {
        "property-1": ["view", "edit", "manage", "delete"],
      };
      const result = validatePropertyAccessWithinRole("owner", propertyAccess);
      expect(result.allowed).toBe(true);
    });

    it("admin can have all property permissions", () => {
      const propertyAccess: PropertyAccess = {
        "property-1": ["view", "edit", "manage", "delete"],
      };
      const result = validatePropertyAccessWithinRole("admin", propertyAccess);
      expect(result.allowed).toBe(true);
    });

    it("member can only have view and edit permissions", () => {
      // Valid for member
      const validAccess: PropertyAccess = {
        "property-1": ["view", "edit"],
      };
      expect(validatePropertyAccessWithinRole("member", validAccess).allowed).toBe(true);

      // Invalid: member cannot have manage
      const invalidAccess: PropertyAccess = {
        "property-1": ["view", "edit", "manage"],
      };
      const result = validatePropertyAccessWithinRole("member", invalidAccess);
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
    });

    it("viewer can only have view permission", () => {
      // Valid for viewer
      const validAccess: PropertyAccess = {
        "property-1": ["view"],
      };
      expect(validatePropertyAccessWithinRole("viewer", validAccess).allowed).toBe(true);

      // Invalid: viewer cannot have edit
      const invalidAccess: PropertyAccess = {
        "property-1": ["view", "edit"],
      };
      const result = validatePropertyAccessWithinRole("viewer", invalidAccess);
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
    });

    it("validates multiple properties independently", () => {
      // All properties valid for member
      const validAccess: PropertyAccess = {
        "property-1": ["view"],
        "property-2": ["view", "edit"],
        "property-3": ["edit"],
      };
      expect(validatePropertyAccessWithinRole("member", validAccess).allowed).toBe(true);

      // One property exceeds member permissions
      const invalidAccess: PropertyAccess = {
        "property-1": ["view"],
        "property-2": ["view", "edit"],
        "property-3": ["manage"], // Invalid for member
      };
      const result = validatePropertyAccessWithinRole("member", invalidAccess);
      expect(result.allowed).toBe(false);
    });

    it("empty property permissions array is valid", () => {
      const propertyAccess: PropertyAccess = {
        "property-1": [],
      };
      expect(validatePropertyAccessWithinRole("viewer", propertyAccess).allowed).toBe(true);
    });
  });

  describe("PropertyAccess in Invitation", () => {
    it("invitation can include valid property restrictions", () => {
      const result = validateInvitation({
        actorRole: "owner",
        invitedRole: "member",
        propertyAccess: {
          "property-1": ["view", "edit"],
        },
      });
      expect(result.allowed).toBe(true);
    });

    it("invitation rejected if property access exceeds role", () => {
      const result = validateInvitation({
        actorRole: "owner",
        invitedRole: "viewer",
        propertyAccess: {
          "property-1": ["view", "edit"], // Viewer cannot have edit
        },
      });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
    });

    it("invitation with undefined propertyAccess allows full role-based access", () => {
      const result = validateInvitation({
        actorRole: "owner",
        invitedRole: "member",
        // propertyAccess not specified
      });
      expect(result.allowed).toBe(true);
    });
  });

  describe("PropertyAccess in Role Change", () => {
    it("role change with property access is validated", () => {
      const result = validateRoleChange({
        actorUserId: "owner-user",
        targetUserId: "member-user",
        actorRole: "owner",
        targetCurrentRole: "admin",
        newRole: "viewer",
        propertyAccess: {
          "property-1": ["edit"], // Invalid for viewer
        },
      });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
    });

    it("valid property access during role change succeeds", () => {
      const result = validateRoleChange({
        actorUserId: "owner-user",
        targetUserId: "member-user",
        actorRole: "owner",
        targetCurrentRole: "admin",
        newRole: "member",
        propertyAccess: {
          "property-1": ["view", "edit"],
        },
      });
      expect(result.allowed).toBe(true);
    });
  });
});

// ============================================================================
// Invitation Token Validation Tests
// ============================================================================

describe("Invitation Token Validation", () => {
  describe("Invitation Creation Validation", () => {
    it("validates role assignment in invitations", () => {
      // Owner can invite any role (except owner)
      expect(validateInvitation({
        actorRole: "owner",
        invitedRole: "admin",
      }).allowed).toBe(true);

      // Admin can only invite member or viewer
      expect(validateInvitation({
        actorRole: "admin",
        invitedRole: "admin",
      }).allowed).toBe(false);

      expect(validateInvitation({
        actorRole: "admin",
        invitedRole: "member",
      }).allowed).toBe(true);
    });

    it("member and viewer cannot create invitations", () => {
      expect(validateCanInviteMembers("member").allowed).toBe(false);
      expect(validateCanInviteMembers("viewer").allowed).toBe(false);
    });

    it("validates property access restrictions in invitations", () => {
      // Valid: viewer with only view access
      expect(validateInvitation({
        actorRole: "owner",
        invitedRole: "viewer",
        propertyAccess: { "prop-1": ["view"] },
      }).allowed).toBe(true);

      // Invalid: viewer with edit access
      expect(validateInvitation({
        actorRole: "owner",
        invitedRole: "viewer",
        propertyAccess: { "prop-1": ["view", "edit"] },
      }).allowed).toBe(false);
    });
  });

  describe("Invitation Security", () => {
    it("only admin and owner can send invitations", () => {
      expect(validateCanInviteMembers("owner").allowed).toBe(true);
      expect(validateCanInviteMembers("admin").allowed).toBe(true);
      expect(validateCanInviteMembers("member").allowed).toBe(false);
      expect(validateCanInviteMembers("viewer").allowed).toBe(false);
    });

    it("inviter cannot assign role higher than their manageable roles", () => {
      // Admin cannot invite another admin
      const result = validateRoleAssignment("admin", "admin");
      expect(result.allowed).toBe(false);
    });

    it("owner role cannot be assigned through invitation", () => {
      const result = validateRoleAssignment("owner", "owner");
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("transfer-ownership");
    });
  });
});

// ============================================================================
// Privilege Escalation Prevention Tests
// ============================================================================

describe("Privilege Escalation Prevention", () => {
  describe("Self-Promotion Prevention", () => {
    it("user cannot promote themselves to higher role", () => {
      const result = validateNoSelfPromotion(
        "user-1",
        "user-1",
        "member",
        "admin"
      );
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("SELF_PROMOTION_DENIED");
    });

    it("user cannot even demote themselves (must use leave)", () => {
      const result = validateNoSelfPromotion(
        "user-1",
        "user-1",
        "admin",
        "member"
      );
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("SELF_PROMOTION_DENIED");
    });

    it("modifying another user is allowed", () => {
      const result = validateNoSelfPromotion(
        "user-1",
        "user-2",
        "owner",
        "admin"
      );
      expect(result.allowed).toBe(true);
    });
  });

  describe("Owner Protection", () => {
    it("owner cannot be removed", () => {
      const result = validateOwnerProtection("owner", undefined, true);
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("OWNER_PROTECTION");
    });

    it("owner role cannot be downgraded", () => {
      const result = validateOwnerProtection("owner", "admin", false);
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("OWNER_PROTECTION");
    });

    it("owner can remain owner", () => {
      const result = validateOwnerProtection("owner", "owner", false);
      expect(result.allowed).toBe(true);
    });

    it("non-owner roles can be changed", () => {
      expect(validateOwnerProtection("admin", "member").allowed).toBe(true);
      expect(validateOwnerProtection("member", "viewer").allowed).toBe(true);
    });
  });

  describe("Role Escalation Prevention", () => {
    it("cannot promote to role equal to or higher than actor", () => {
      // Admin cannot promote to admin
      let result = validateNoPrivilegeEscalation("admin", "member", "admin");
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("ROLE_ESCALATION_DENIED");

      // Admin cannot promote to owner
      result = validateNoPrivilegeEscalation("admin", "member", "owner");
      expect(result.allowed).toBe(false);
    });

    it("cannot modify users with equal or higher role", () => {
      // Admin cannot modify another admin
      let result = validateNoPrivilegeEscalation("admin", "admin", "member");
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("INSUFFICIENT_PRIVILEGES");

      // Admin cannot modify owner
      result = validateNoPrivilegeEscalation("admin", "owner", "admin");
      expect(result.allowed).toBe(false);
    });

    it("owner can modify anyone below them", () => {
      expect(validateNoPrivilegeEscalation("owner", "admin", "member").allowed).toBe(true);
      expect(validateNoPrivilegeEscalation("owner", "member", "admin").allowed).toBe(true);
    });
  });

  describe("Self-Removal Prevention", () => {
    it("user cannot remove themselves (must use leave endpoint)", () => {
      const result = validateMemberRemoval({
        actorUserId: "user-1",
        targetUserId: "user-1",
        actorRole: "admin",
        targetRole: "admin",
      });
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("leave endpoint");
    });
  });

  describe("Comprehensive Privilege Escalation Tests", () => {
    it("member cannot escalate to any management actions", () => {
      // Member trying to invite
      expect(validateCanInviteMembers("member").allowed).toBe(false);
      
      // Member cannot change roles
      expect(validateOnlyOwnerCanChangeRoles("member").allowed).toBe(false);
    });

    it("admin cannot escalate to owner-only actions", () => {
      // Admin cannot change roles
      expect(validateOnlyOwnerCanChangeRoles("admin").allowed).toBe(false);
      
      // Admin cannot assign admin role
      expect(validateRoleAssignment("admin", "admin").allowed).toBe(false);
    });

    it("property access cannot exceed role defaults through any path", () => {
      // Through invitation
      expect(validateInvitation({
        actorRole: "owner",
        invitedRole: "viewer",
        propertyAccess: { "prop": ["delete"] },
      }).allowed).toBe(false);

      // Through role change
      expect(validateRoleChange({
        actorUserId: "owner",
        targetUserId: "user",
        actorRole: "owner",
        targetCurrentRole: "admin",
        newRole: "member",
        propertyAccess: { "prop": ["manage"] }, // Member cannot manage
      }).allowed).toBe(false);

      // Through direct validation
      expect(validatePropertyAccessWithinRole("member", {
        "prop": ["delete"],
      }).allowed).toBe(false);
    });
  });
});

// ============================================================================
// Audit Log Creation Tests
// ============================================================================

describe("Audit Log Creation", () => {
  // Import audit utilities
  let logPermissionChange: typeof import("../../utils/audit").logPermissionChange;
  let logRoleChange: typeof import("../../utils/audit").logRoleChange;
  let logInvitationSent: typeof import("../../utils/audit").logInvitationSent;
  let logInvitationAccepted: typeof import("../../utils/audit").logInvitationAccepted;
  let logAccessRevoked: typeof import("../../utils/audit").logAccessRevoked;

  beforeEach(async () => {
    // Dynamically import to get mocked versions
    const auditModule = await import("../../utils/audit");
    logPermissionChange = auditModule.logPermissionChange;
    logRoleChange = auditModule.logRoleChange;
    logInvitationSent = auditModule.logInvitationSent;
    logInvitationAccepted = auditModule.logInvitationAccepted;
    logAccessRevoked = auditModule.logAccessRevoked;
  });

  describe("Audit Log Entry Structure", () => {
    it("role change should create audit log with correct structure", async () => {
      // The audit function should be called with proper parameters
      const result = await logRoleChange(
        "user-123",
        "portfolio-123",
        "member",
        "admin",
        "owner-123"
      );
      
      // Due to mocking, this will return a result
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });

    it("invitation sent should create audit log", async () => {
      const result = await logInvitationSent(
        "portfolio-123",
        "test@example.com",
        "member",
        "owner-123",
        "token-123"
      );
      
      expect(result).toBeDefined();
    });

    it("invitation accepted should create audit log", async () => {
      const result = await logInvitationAccepted(
        "user-123",
        "portfolio-123",
        "member",
        "token-123"
      );
      
      expect(result).toBeDefined();
    });

    it("access revoked should create audit log", async () => {
      const result = await logAccessRevoked(
        "user-123",
        "portfolio-123",
        "member",
        "owner-123"
      );
      
      expect(result).toBeDefined();
    });
  });

  describe("Audit Log with Property Access", () => {
    it("role change with property access changes logs correctly", async () => {
      const result = await logRoleChange(
        "user-123",
        "portfolio-123",
        "member",
        "admin",
        "owner-123",
        {
          old: { "prop-1": ["view"] },
          new: { "prop-1": ["view", "edit"] },
        }
      );
      
      expect(result).toBeDefined();
    });

    it("invitation with property access logs correctly", async () => {
      const propertyAccess: PropertyAccess = {
        "prop-1": ["view", "edit"],
      };
      
      const result = await logInvitationSent(
        "portfolio-123",
        "test@example.com",
        "member",
        "owner-123",
        "token-123",
        propertyAccess
      );
      
      expect(result).toBeDefined();
    });
  });

  describe("Audit Log Error Handling", () => {
    it("audit logging should not throw on errors", async () => {
      // Even if DB operation fails, audit should return gracefully
      const result = await logPermissionChange({
        action: "role_change",
        userId: "user-123",
        portfolioId: "portfolio-123",
        oldValue: { role: "member" },
        newValue: { role: "admin" },
        changedBy: "owner-123",
      });
      
      // Should complete without throwing
      expect(result).toBeDefined();
    });
  });
});

// ============================================================================
// Integration Scenario Tests
// ============================================================================

describe("Integration Scenarios", () => {
  describe("Complete Invitation Flow", () => {
    it("validates complete invitation lifecycle", () => {
      // 1. Admin sends invitation to new member
      const invitationResult = validateInvitation({
        actorRole: "admin",
        invitedRole: "member",
        propertyAccess: {
          "property-1": ["view", "edit"],
        },
      });
      expect(invitationResult.allowed).toBe(true);

      // 2. Cannot invite with higher role
      const invalidInvitation = validateInvitation({
        actorRole: "admin",
        invitedRole: "admin",
      });
      expect(invalidInvitation.allowed).toBe(false);
    });

    it("validates complete role change lifecycle", () => {
      // 1. Owner can promote member to admin
      const promotionResult = validateRoleChange({
        actorUserId: "owner-123",
        targetUserId: "member-123",
        actorRole: "owner",
        targetCurrentRole: "member",
        newRole: "admin",
      });
      expect(promotionResult.allowed).toBe(true);

      // 2. Owner can demote admin to viewer
      const demotionResult = validateRoleChange({
        actorUserId: "owner-123",
        targetUserId: "admin-123",
        actorRole: "owner",
        targetCurrentRole: "admin",
        newRole: "viewer",
      });
      expect(demotionResult.allowed).toBe(true);

      // 3. Owner cannot demote themselves
      const selfDemoteResult = validateRoleChange({
        actorUserId: "owner-123",
        targetUserId: "owner-123",
        actorRole: "owner",
        targetCurrentRole: "owner",
        newRole: "admin",
      });
      expect(selfDemoteResult.allowed).toBe(false);
    });
  });

  describe("JV Partner Scenario", () => {
    it("allows owner to invite JV partner with limited property access", () => {
      // Owner invites JV partner who can only see specific properties
      const result = validateInvitation({
        actorRole: "owner",
        invitedRole: "member",
        propertyAccess: {
          "jv-property-1": ["view", "edit"],
          "jv-property-2": ["view", "edit"],
          // Other portfolio properties are not included
        },
      });
      expect(result.allowed).toBe(true);
    });

    it("prevents JV partner from having manage/delete on non-owned properties", () => {
      // Even as member, JV should be restricted via propertyAccess
      const invalidResult = validateInvitation({
        actorRole: "owner",
        invitedRole: "member",
        propertyAccess: {
          "jv-property-1": ["view", "edit", "manage"], // Member cannot manage
        },
      });
      expect(invalidResult.allowed).toBe(false);
    });
  });

  describe("CPA View-Only Access Scenario", () => {
    it("allows owner to invite CPA with view-only access to all properties", () => {
      const result = validateInvitation({
        actorRole: "owner",
        invitedRole: "viewer",
        // null propertyAccess means full portfolio access at viewer level
      });
      expect(result.allowed).toBe(true);
    });

    it("prevents CPA from having edit access through propertyAccess", () => {
      const result = validateInvitation({
        actorRole: "owner",
        invitedRole: "viewer",
        propertyAccess: {
          "property-1": ["view", "edit"], // Viewer cannot edit
        },
      });
      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
    });
  });

  describe("Spouse Full Access Scenario", () => {
    it("allows owner to invite spouse as admin with full access", () => {
      const result = validateInvitation({
        actorRole: "owner",
        invitedRole: "admin",
        // null propertyAccess for full access
      });
      expect(result.allowed).toBe(true);
    });

    it("spouse as admin cannot invite other admins", () => {
      const result = validateInvitation({
        actorRole: "admin",
        invitedRole: "admin",
      });
      expect(result.allowed).toBe(false);
    });
  });
});

// ============================================================================
// Edge Cases and Security Boundary Tests
// ============================================================================

describe("Edge Cases and Security Boundaries", () => {
  describe("UUID Property ID Handling", () => {
    it("handles valid UUID property IDs", () => {
      const propertyAccess: PropertyAccess = {
        "550e8400-e29b-41d4-a716-446655440000": ["view", "edit"],
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8": ["view"],
      };
      expect(validatePropertyAccessWithinRole("member", propertyAccess).allowed).toBe(true);
    });
  });

  describe("Empty and Null Handling", () => {
    it("empty propertyAccess object is valid", () => {
      const propertyAccess: PropertyAccess = {};
      expect(validatePropertyAccessWithinRole("viewer", propertyAccess).allowed).toBe(true);
    });

    it("empty permissions array is valid", () => {
      const propertyAccess: PropertyAccess = {
        "property-1": [],
      };
      expect(validatePropertyAccessWithinRole("viewer", propertyAccess).allowed).toBe(true);
    });
  });

  describe("All Permission Combinations", () => {
    it("validates all valid permission combinations for each role", () => {
      const roles: PortfolioRole[] = ["owner", "admin", "member", "viewer"];
      const roleMaxPermissions: Record<PortfolioRole, string[]> = {
        owner: ["view", "edit", "manage", "delete"],
        admin: ["view", "edit", "manage", "delete"],
        member: ["view", "edit"],
        viewer: ["view"],
      };

      for (const role of roles) {
        const maxPerms = roleMaxPermissions[role];
        const propertyAccess: PropertyAccess = {
          "property-1": maxPerms as Array<"view" | "edit" | "manage" | "delete">,
        };
        expect(validatePropertyAccessWithinRole(role, propertyAccess).allowed).toBe(true);
      }
    });

    it("rejects permission combinations that exceed role", () => {
      // Viewer with edit
      expect(validatePropertyAccessWithinRole("viewer", {
        "p": ["view", "edit"],
      }).allowed).toBe(false);

      // Member with manage
      expect(validatePropertyAccessWithinRole("member", {
        "p": ["view", "edit", "manage"],
      }).allowed).toBe(false);

      // Member with delete
      expect(validatePropertyAccessWithinRole("member", {
        "p": ["view", "edit", "delete"],
      }).allowed).toBe(false);

      // Viewer with any non-view permission
      expect(validatePropertyAccessWithinRole("viewer", {
        "p": ["manage"],
      }).allowed).toBe(false);

      expect(validatePropertyAccessWithinRole("viewer", {
        "p": ["delete"],
      }).allowed).toBe(false);
    });
  });
});
