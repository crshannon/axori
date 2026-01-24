/**
 * Security Validations Tests
 *
 * These tests validate the security validation functions that prevent
 * privilege escalation and enforce access control rules.
 *
 * @see AXO-115: Add security validations and prevent privilege escalation
 */

import { describe, expect, it } from "vitest";
import {
  validateNoSelfPromotion,
  validateOwnerProtection,
  validateOnlyOwnerCanChangeRoles,
  validateCanInviteMembers,
  validateRoleAssignment,
  validatePropertyAccessWithinRole,
  validateNoPrivilegeEscalation,
  validateRoleChange,
  validateMemberRemoval,
  validateInvitation,
  validatePropertyAccessUpdate,
} from "../security-validations";
import type { PropertyAccess } from "@axori/db";

describe("validateNoSelfPromotion", () => {
  it("denies self-promotion to higher role", () => {
    const result = validateNoSelfPromotion("user-1", "user-1", "member", "admin");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("SELF_PROMOTION_DENIED");
  });

  it("denies self-demotion (should use leave instead)", () => {
    const result = validateNoSelfPromotion("user-1", "user-1", "admin", "member");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("SELF_PROMOTION_DENIED");
  });

  it("allows modifying another user's role", () => {
    const result = validateNoSelfPromotion("user-1", "user-2", "owner", "admin");
    expect(result.allowed).toBe(true);
  });
});

describe("validateOwnerProtection", () => {
  it("prevents owner removal", () => {
    const result = validateOwnerProtection("owner", undefined, true);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("OWNER_PROTECTION");
    expect(result.error).toContain("Transfer ownership");
  });

  it("prevents owner role downgrade", () => {
    const result = validateOwnerProtection("owner", "admin", false);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("OWNER_PROTECTION");
    expect(result.error).toContain("transfer-ownership");
  });

  it("allows owner to stay owner", () => {
    const result = validateOwnerProtection("owner", "owner", false);
    expect(result.allowed).toBe(true);
  });

  it("allows modifying non-owner roles", () => {
    const result = validateOwnerProtection("admin", "member", false);
    expect(result.allowed).toBe(true);
  });

  it("allows removing non-owner members", () => {
    const result = validateOwnerProtection("member", undefined, true);
    expect(result.allowed).toBe(true);
  });
});

describe("validateOnlyOwnerCanChangeRoles", () => {
  it("allows owner to change roles", () => {
    const result = validateOnlyOwnerCanChangeRoles("owner");
    expect(result.allowed).toBe(true);
  });

  it("denies admin from changing roles", () => {
    const result = validateOnlyOwnerCanChangeRoles("admin");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ONLY_OWNER_CAN_CHANGE_ROLES");
  });

  it("denies member from changing roles", () => {
    const result = validateOnlyOwnerCanChangeRoles("member");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ONLY_OWNER_CAN_CHANGE_ROLES");
  });

  it("denies viewer from changing roles", () => {
    const result = validateOnlyOwnerCanChangeRoles("viewer");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ONLY_OWNER_CAN_CHANGE_ROLES");
  });
});

describe("validateCanInviteMembers", () => {
  it("allows owner to invite members", () => {
    const result = validateCanInviteMembers("owner");
    expect(result.allowed).toBe(true);
  });

  it("allows admin to invite members", () => {
    const result = validateCanInviteMembers("admin");
    expect(result.allowed).toBe(true);
  });

  it("denies member from inviting", () => {
    const result = validateCanInviteMembers("member");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("INSUFFICIENT_PRIVILEGES");
  });

  it("denies viewer from inviting", () => {
    const result = validateCanInviteMembers("viewer");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("INSUFFICIENT_PRIVILEGES");
  });
});

describe("validateRoleAssignment", () => {
  it("denies assigning owner role", () => {
    const result = validateRoleAssignment("owner", "owner");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ROLE_ESCALATION_DENIED");
    expect(result.error).toContain("transfer-ownership");
  });

  it("allows owner to assign admin", () => {
    const result = validateRoleAssignment("owner", "admin");
    expect(result.allowed).toBe(true);
  });

  it("allows owner to assign member", () => {
    const result = validateRoleAssignment("owner", "member");
    expect(result.allowed).toBe(true);
  });

  it("allows owner to assign viewer", () => {
    const result = validateRoleAssignment("owner", "viewer");
    expect(result.allowed).toBe(true);
  });

  it("allows admin to assign member", () => {
    const result = validateRoleAssignment("admin", "member");
    expect(result.allowed).toBe(true);
  });

  it("allows admin to assign viewer", () => {
    const result = validateRoleAssignment("admin", "viewer");
    expect(result.allowed).toBe(true);
  });

  it("denies admin from assigning admin", () => {
    const result = validateRoleAssignment("admin", "admin");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ROLE_ESCALATION_DENIED");
  });

  it("denies member from assigning any role", () => {
    const result = validateRoleAssignment("member", "viewer");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ROLE_ESCALATION_DENIED");
  });
});

describe("validatePropertyAccessWithinRole", () => {
  it("allows null property access (full access based on role)", () => {
    const result = validatePropertyAccessWithinRole("viewer", null);
    expect(result.allowed).toBe(true);
  });

  it("allows valid property access for owner", () => {
    const propertyAccess: PropertyAccess = {
      "property-1": ["view", "edit", "manage", "delete"],
    };
    const result = validatePropertyAccessWithinRole("owner", propertyAccess);
    expect(result.allowed).toBe(true);
  });

  it("allows valid property access for member", () => {
    const propertyAccess: PropertyAccess = {
      "property-1": ["view", "edit"],
    };
    const result = validatePropertyAccessWithinRole("member", propertyAccess);
    expect(result.allowed).toBe(true);
  });

  it("allows valid property access for viewer", () => {
    const propertyAccess: PropertyAccess = {
      "property-1": ["view"],
    };
    const result = validatePropertyAccessWithinRole("viewer", propertyAccess);
    expect(result.allowed).toBe(true);
  });

  it("denies property access that exceeds viewer role", () => {
    const propertyAccess: PropertyAccess = {
      "property-1": ["view", "edit"], // viewer cannot have "edit"
    };
    const result = validatePropertyAccessWithinRole("viewer", propertyAccess);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
  });

  it("denies property access that exceeds member role", () => {
    const propertyAccess: PropertyAccess = {
      "property-1": ["view", "edit", "manage"], // member cannot have "manage"
    };
    const result = validatePropertyAccessWithinRole("member", propertyAccess);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
  });

  it("denies delete permission for viewer", () => {
    const propertyAccess: PropertyAccess = {
      "property-1": ["delete"],
    };
    const result = validatePropertyAccessWithinRole("viewer", propertyAccess);
    expect(result.allowed).toBe(false);
  });
});

describe("validateNoPrivilegeEscalation", () => {
  it("allows owner to demote admin to member", () => {
    const result = validateNoPrivilegeEscalation("owner", "admin", "member");
    expect(result.allowed).toBe(true);
  });

  it("allows owner to promote member to admin", () => {
    const result = validateNoPrivilegeEscalation("owner", "member", "admin");
    expect(result.allowed).toBe(true);
  });

  it("denies admin from promoting member to admin", () => {
    const result = validateNoPrivilegeEscalation("admin", "member", "admin");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ROLE_ESCALATION_DENIED");
  });

  it("denies admin from modifying another admin", () => {
    const result = validateNoPrivilegeEscalation("admin", "admin", "member");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("INSUFFICIENT_PRIVILEGES");
  });

  it("denies member from modifying anyone", () => {
    const result = validateNoPrivilegeEscalation("member", "viewer", "member");
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ROLE_ESCALATION_DENIED");
  });
});

describe("validateRoleChange (comprehensive)", () => {
  it("allows owner to change member to admin", () => {
    const result = validateRoleChange({
      actorUserId: "owner-1",
      targetUserId: "member-1",
      actorRole: "owner",
      targetCurrentRole: "member",
      newRole: "admin",
    });
    expect(result.allowed).toBe(true);
  });

  it("denies admin from changing member role", () => {
    const result = validateRoleChange({
      actorUserId: "admin-1",
      targetUserId: "member-1",
      actorRole: "admin",
      targetCurrentRole: "member",
      newRole: "viewer",
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ONLY_OWNER_CAN_CHANGE_ROLES");
  });

  it("denies self-modification", () => {
    const result = validateRoleChange({
      actorUserId: "user-1",
      targetUserId: "user-1",
      actorRole: "owner",
      targetCurrentRole: "owner",
      newRole: "admin",
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("SELF_PROMOTION_DENIED");
  });

  it("denies modifying owner role", () => {
    const result = validateRoleChange({
      actorUserId: "user-1",
      targetUserId: "owner-1",
      actorRole: "owner",
      targetCurrentRole: "owner",
      newRole: "admin",
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("OWNER_PROTECTION");
  });

  it("validates property access with role change", () => {
    const result = validateRoleChange({
      actorUserId: "owner-1",
      targetUserId: "member-1",
      actorRole: "owner",
      targetCurrentRole: "admin",
      newRole: "viewer",
      propertyAccess: {
        "property-1": ["edit"], // viewer cannot have edit
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
  });
});

describe("validateMemberRemoval (comprehensive)", () => {
  it("allows owner to remove member", () => {
    const result = validateMemberRemoval({
      actorUserId: "owner-1",
      targetUserId: "member-1",
      actorRole: "owner",
      targetRole: "member",
    });
    expect(result.allowed).toBe(true);
  });

  it("allows admin to remove member", () => {
    const result = validateMemberRemoval({
      actorUserId: "admin-1",
      targetUserId: "member-1",
      actorRole: "admin",
      targetRole: "member",
    });
    expect(result.allowed).toBe(true);
  });

  it("allows admin to remove viewer", () => {
    const result = validateMemberRemoval({
      actorUserId: "admin-1",
      targetUserId: "viewer-1",
      actorRole: "admin",
      targetRole: "viewer",
    });
    expect(result.allowed).toBe(true);
  });

  it("denies removing owner", () => {
    const result = validateMemberRemoval({
      actorUserId: "admin-1",
      targetUserId: "owner-1",
      actorRole: "admin",
      targetRole: "owner",
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("OWNER_PROTECTION");
  });

  it("denies self-removal", () => {
    const result = validateMemberRemoval({
      actorUserId: "user-1",
      targetUserId: "user-1",
      actorRole: "admin",
      targetRole: "admin",
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("SELF_PROMOTION_DENIED");
  });

  it("denies admin removing another admin", () => {
    const result = validateMemberRemoval({
      actorUserId: "admin-1",
      targetUserId: "admin-2",
      actorRole: "admin",
      targetRole: "admin",
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("INSUFFICIENT_PRIVILEGES");
  });
});

describe("validateInvitation (comprehensive)", () => {
  it("allows owner to invite admin", () => {
    const result = validateInvitation({
      actorRole: "owner",
      invitedRole: "admin",
    });
    expect(result.allowed).toBe(true);
  });

  it("allows owner to invite with property access", () => {
    const result = validateInvitation({
      actorRole: "owner",
      invitedRole: "member",
      propertyAccess: {
        "property-1": ["view", "edit"],
      },
    });
    expect(result.allowed).toBe(true);
  });

  it("allows admin to invite member", () => {
    const result = validateInvitation({
      actorRole: "admin",
      invitedRole: "member",
    });
    expect(result.allowed).toBe(true);
  });

  it("allows admin to invite viewer", () => {
    const result = validateInvitation({
      actorRole: "admin",
      invitedRole: "viewer",
    });
    expect(result.allowed).toBe(true);
  });

  it("denies admin inviting admin", () => {
    const result = validateInvitation({
      actorRole: "admin",
      invitedRole: "admin",
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ROLE_ESCALATION_DENIED");
  });

  it("denies member from inviting", () => {
    const result = validateInvitation({
      actorRole: "member",
      invitedRole: "viewer",
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("INSUFFICIENT_PRIVILEGES");
  });

  it("denies property access exceeding role", () => {
    const result = validateInvitation({
      actorRole: "owner",
      invitedRole: "viewer",
      propertyAccess: {
        "property-1": ["edit"], // viewer cannot have edit
      },
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
  });
});

describe("validatePropertyAccessUpdate", () => {
  it("allows owner to update member property access", () => {
    const result = validatePropertyAccessUpdate("owner", "member", {
      "property-1": ["view", "edit"],
    });
    expect(result.allowed).toBe(true);
  });

  it("denies admin from updating property access", () => {
    const result = validatePropertyAccessUpdate("admin", "member", {
      "property-1": ["view"],
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("ONLY_OWNER_CAN_CHANGE_ROLES");
  });

  it("denies modifying owner property access", () => {
    const result = validatePropertyAccessUpdate("owner", "owner", {
      "property-1": ["view"],
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("OWNER_PROTECTION");
  });

  it("denies property access exceeding role", () => {
    const result = validatePropertyAccessUpdate("owner", "viewer", {
      "property-1": ["edit"],
    });
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe("PROPERTY_ACCESS_EXCEEDS_ROLE");
  });
});
