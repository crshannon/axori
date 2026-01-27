/**
 * Permission Helpers Unit Tests
 *
 * Tests for the permission checking logic in the drawer factory system.
 * Covers:
 * - Role hierarchy and ranking
 * - Permission level checks (viewer, member, admin, owner)
 * - Edge cases (null roles, invalid permissions, etc.)
 * - Multiple permission checks (AND/OR logic)
 *
 * @see AXO-93 - URL-Based Drawer Factory
 * @see AXO-121 - Drawer Factory Unit Tests
 */

import { describe, expect, it } from 'vitest'
import {
  PORTFOLIO_ROLES,
  canAdmin,
  canEdit,
  canView,
  getRoleRank,
  hasAllRequiredPermissions,
  hasAnyRequiredPermission,
  hasRequiredPermission,
  isOwner,
  isRoleAtLeast,
} from '../permission-helpers'
import type { PortfolioRole } from '../permission-helpers'
import type { DrawerPermission } from '../registry'

// =============================================================================
// ROLE RANKING TESTS
// =============================================================================

describe('PORTFOLIO_ROLES', () => {
  it('contains all expected roles in order of privilege', () => {
    expect(PORTFOLIO_ROLES).toEqual(['owner', 'admin', 'member', 'viewer'])
  })

  it('has exactly 4 roles', () => {
    expect(PORTFOLIO_ROLES.length).toBe(4)
  })
})

describe('getRoleRank', () => {
  it('returns correct rank for each role', () => {
    // Higher rank = more privileged
    expect(getRoleRank('owner')).toBe(3)
    expect(getRoleRank('admin')).toBe(2)
    expect(getRoleRank('member')).toBe(1)
    expect(getRoleRank('viewer')).toBe(0)
  })

  it('owner has highest rank', () => {
    expect(getRoleRank('owner')).toBeGreaterThan(getRoleRank('admin'))
    expect(getRoleRank('owner')).toBeGreaterThan(getRoleRank('member'))
    expect(getRoleRank('owner')).toBeGreaterThan(getRoleRank('viewer'))
  })

  it('viewer has lowest rank', () => {
    expect(getRoleRank('viewer')).toBeLessThan(getRoleRank('owner'))
    expect(getRoleRank('viewer')).toBeLessThan(getRoleRank('admin'))
    expect(getRoleRank('viewer')).toBeLessThan(getRoleRank('member'))
  })
})

describe('isRoleAtLeast', () => {
  it('owner is at least every role level', () => {
    expect(isRoleAtLeast('owner', 'owner')).toBe(true)
    expect(isRoleAtLeast('owner', 'admin')).toBe(true)
    expect(isRoleAtLeast('owner', 'member')).toBe(true)
    expect(isRoleAtLeast('owner', 'viewer')).toBe(true)
  })

  it('admin is at least admin/member/viewer but not owner', () => {
    expect(isRoleAtLeast('admin', 'owner')).toBe(false)
    expect(isRoleAtLeast('admin', 'admin')).toBe(true)
    expect(isRoleAtLeast('admin', 'member')).toBe(true)
    expect(isRoleAtLeast('admin', 'viewer')).toBe(true)
  })

  it('member is at least member/viewer but not admin/owner', () => {
    expect(isRoleAtLeast('member', 'owner')).toBe(false)
    expect(isRoleAtLeast('member', 'admin')).toBe(false)
    expect(isRoleAtLeast('member', 'member')).toBe(true)
    expect(isRoleAtLeast('member', 'viewer')).toBe(true)
  })

  it('viewer is only at least viewer', () => {
    expect(isRoleAtLeast('viewer', 'owner')).toBe(false)
    expect(isRoleAtLeast('viewer', 'admin')).toBe(false)
    expect(isRoleAtLeast('viewer', 'member')).toBe(false)
    expect(isRoleAtLeast('viewer', 'viewer')).toBe(true)
  })
})

// =============================================================================
// CONVENIENCE FUNCTION TESTS
// =============================================================================

describe('canView', () => {
  it('returns true for all roles', () => {
    expect(canView('viewer')).toBe(true)
    expect(canView('member')).toBe(true)
    expect(canView('admin')).toBe(true)
    expect(canView('owner')).toBe(true)
  })
})

describe('canEdit', () => {
  it('returns true for member and above', () => {
    expect(canEdit('member')).toBe(true)
    expect(canEdit('admin')).toBe(true)
    expect(canEdit('owner')).toBe(true)
  })

  it('returns false for viewer', () => {
    expect(canEdit('viewer')).toBe(false)
  })
})

describe('canAdmin', () => {
  it('returns true for admin and owner', () => {
    expect(canAdmin('admin')).toBe(true)
    expect(canAdmin('owner')).toBe(true)
  })

  it('returns false for member and viewer', () => {
    expect(canAdmin('member')).toBe(false)
    expect(canAdmin('viewer')).toBe(false)
  })
})

describe('isOwner', () => {
  it('returns true only for owner', () => {
    expect(isOwner('owner')).toBe(true)
  })

  it('returns false for all other roles', () => {
    expect(isOwner('admin')).toBe(false)
    expect(isOwner('member')).toBe(false)
    expect(isOwner('viewer')).toBe(false)
  })
})

// =============================================================================
// hasRequiredPermission TESTS
// =============================================================================

describe('hasRequiredPermission', () => {
  describe('with permission level "none"', () => {
    it('allows access for any authenticated user', () => {
      expect(hasRequiredPermission('viewer', 'none')).toBe(true)
      expect(hasRequiredPermission('member', 'none')).toBe(true)
      expect(hasRequiredPermission('admin', 'none')).toBe(true)
      expect(hasRequiredPermission('owner', 'none')).toBe(true)
    })

    it('allows access even with null role', () => {
      // 'none' permission means no role check is performed
      expect(hasRequiredPermission(null, 'none')).toBe(true)
    })
  })

  describe('with permission level "viewer"', () => {
    it('allows access for viewer and above', () => {
      expect(hasRequiredPermission('viewer', 'viewer')).toBe(true)
      expect(hasRequiredPermission('member', 'viewer')).toBe(true)
      expect(hasRequiredPermission('admin', 'viewer')).toBe(true)
      expect(hasRequiredPermission('owner', 'viewer')).toBe(true)
    })

    it('denies access when user has no role', () => {
      expect(hasRequiredPermission(null, 'viewer')).toBe(false)
    })
  })

  describe('with permission level "member"', () => {
    it('allows access for member and above', () => {
      expect(hasRequiredPermission('member', 'member')).toBe(true)
      expect(hasRequiredPermission('admin', 'member')).toBe(true)
      expect(hasRequiredPermission('owner', 'member')).toBe(true)
    })

    it('denies access for viewer', () => {
      expect(hasRequiredPermission('viewer', 'member')).toBe(false)
    })

    it('denies access when user has no role', () => {
      expect(hasRequiredPermission(null, 'member')).toBe(false)
    })
  })

  describe('with permission level "admin"', () => {
    it('allows access for admin and owner', () => {
      expect(hasRequiredPermission('admin', 'admin')).toBe(true)
      expect(hasRequiredPermission('owner', 'admin')).toBe(true)
    })

    it('denies access for member and viewer', () => {
      expect(hasRequiredPermission('member', 'admin')).toBe(false)
      expect(hasRequiredPermission('viewer', 'admin')).toBe(false)
    })

    it('denies access when user has no role', () => {
      expect(hasRequiredPermission(null, 'admin')).toBe(false)
    })
  })

  describe('with permission level "owner"', () => {
    it('allows access only for owner', () => {
      expect(hasRequiredPermission('owner', 'owner')).toBe(true)
    })

    it('denies access for all other roles', () => {
      expect(hasRequiredPermission('admin', 'owner')).toBe(false)
      expect(hasRequiredPermission('member', 'owner')).toBe(false)
      expect(hasRequiredPermission('viewer', 'owner')).toBe(false)
    })

    it('denies access when user has no role', () => {
      expect(hasRequiredPermission(null, 'owner')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles unknown permission type by denying access', () => {
      expect(
        hasRequiredPermission('owner', 'unknown' as DrawerPermission),
      ).toBe(false)
      expect(
        hasRequiredPermission(
          'admin',
          'invalid-permission' as DrawerPermission,
        ),
      ).toBe(false)
    })

    it('handles empty string permission type by denying access', () => {
      expect(hasRequiredPermission('owner', '' as DrawerPermission)).toBe(false)
    })
  })
})

// =============================================================================
// MULTIPLE PERMISSION CHECKS (AND/OR LOGIC)
// =============================================================================

describe('hasAllRequiredPermissions (AND logic)', () => {
  it('returns true when all permissions are met', () => {
    expect(
      hasAllRequiredPermissions('owner', ['viewer', 'member', 'admin']),
    ).toBe(true)
    expect(
      hasAllRequiredPermissions('admin', ['viewer', 'member', 'admin']),
    ).toBe(true)
  })

  it('returns false when any permission is not met', () => {
    expect(
      hasAllRequiredPermissions('member', ['viewer', 'member', 'admin']),
    ).toBe(false)
    expect(hasAllRequiredPermissions('viewer', ['viewer', 'member'])).toBe(
      false,
    )
  })

  it('returns true for empty permissions array', () => {
    expect(hasAllRequiredPermissions('viewer', [])).toBe(true)
    expect(hasAllRequiredPermissions(null, [])).toBe(true)
  })

  it('handles single permission', () => {
    expect(hasAllRequiredPermissions('member', ['member'])).toBe(true)
    expect(hasAllRequiredPermissions('viewer', ['member'])).toBe(false)
  })

  it('works correctly with null role', () => {
    expect(hasAllRequiredPermissions(null, ['viewer'])).toBe(false)
    expect(hasAllRequiredPermissions(null, ['none'])).toBe(true)
  })

  it('handles mixed permission levels', () => {
    // 'none' is always true, but others depend on role
    expect(hasAllRequiredPermissions('viewer', ['none', 'viewer'])).toBe(true)
    expect(hasAllRequiredPermissions('viewer', ['none', 'member'])).toBe(false)
    expect(
      hasAllRequiredPermissions('admin', ['none', 'admin', 'member']),
    ).toBe(true)
  })
})

describe('hasAnyRequiredPermission (OR logic)', () => {
  it('returns true when at least one permission is met', () => {
    expect(hasAnyRequiredPermission('member', ['viewer', 'admin'])).toBe(true) // has viewer+
    expect(
      hasAnyRequiredPermission('admin', ['viewer', 'member', 'admin']),
    ).toBe(true)
  })

  it('returns false when no permissions are met', () => {
    expect(
      hasAnyRequiredPermission('viewer', ['member', 'admin', 'owner']),
    ).toBe(false)
    expect(hasAnyRequiredPermission('member', ['admin', 'owner'])).toBe(false)
  })

  it('returns true for empty permissions array', () => {
    expect(hasAnyRequiredPermission('viewer', [])).toBe(true)
    expect(hasAnyRequiredPermission(null, [])).toBe(true)
  })

  it('handles single permission', () => {
    expect(hasAnyRequiredPermission('member', ['member'])).toBe(true)
    expect(hasAnyRequiredPermission('viewer', ['member'])).toBe(false)
  })

  it('works correctly with null role', () => {
    expect(hasAnyRequiredPermission(null, ['viewer', 'member'])).toBe(false)
    expect(hasAnyRequiredPermission(null, ['none', 'member'])).toBe(true) // 'none' is always true
  })

  it('handles mixed permission levels', () => {
    // If any permission passes, return true
    expect(hasAnyRequiredPermission('viewer', ['admin', 'owner', 'none'])).toBe(
      true,
    )
    expect(hasAnyRequiredPermission('member', ['admin', 'viewer'])).toBe(true) // has viewer
  })
})

// =============================================================================
// COMPREHENSIVE PERMISSION MATRIX
// =============================================================================

describe('permission matrix', () => {
  const roles: Array<PortfolioRole | null> = [
    null,
    'viewer',
    'member',
    'admin',
    'owner',
  ]
  const permissions: Array<DrawerPermission> = [
    'none',
    'viewer',
    'member',
    'admin',
    'owner',
  ]

  // Expected access matrix: [role][permission] = true/false
  const expectedAccess: Record<string, Record<DrawerPermission, boolean>> = {
    null: {
      none: true,
      viewer: false,
      member: false,
      admin: false,
      owner: false,
    },
    viewer: {
      none: true,
      viewer: true,
      member: false,
      admin: false,
      owner: false,
    },
    member: {
      none: true,
      viewer: true,
      member: true,
      admin: false,
      owner: false,
    },
    admin: {
      none: true,
      viewer: true,
      member: true,
      admin: true,
      owner: false,
    },
    owner: { none: true, viewer: true, member: true, admin: true, owner: true },
  }

  for (const role of roles) {
    for (const permission of permissions) {
      const roleStr = role ?? 'null'
      it(`role="${roleStr}" with permission="${permission}" should be ${expectedAccess[roleStr][permission] ? 'allowed' : 'denied'}`, () => {
        expect(hasRequiredPermission(role, permission)).toBe(
          expectedAccess[roleStr][permission],
        )
      })
    }
  }
})

// =============================================================================
// UNAUTHENTICATED USER TESTS
// =============================================================================

describe('unauthenticated users', () => {
  it('can only access drawers with "none" permission', () => {
    expect(hasRequiredPermission(null, 'none')).toBe(true)
    expect(hasRequiredPermission(null, 'viewer')).toBe(false)
    expect(hasRequiredPermission(null, 'member')).toBe(false)
    expect(hasRequiredPermission(null, 'admin')).toBe(false)
    expect(hasRequiredPermission(null, 'owner')).toBe(false)
  })

  it('fails all required permissions checks except "none"', () => {
    expect(hasAllRequiredPermissions(null, ['viewer', 'member'])).toBe(false)
    expect(hasAllRequiredPermissions(null, ['none', 'none'])).toBe(true)
  })

  it('can pass OR check if "none" is included', () => {
    expect(hasAnyRequiredPermission(null, ['none', 'admin'])).toBe(true)
    expect(hasAnyRequiredPermission(null, ['viewer', 'member'])).toBe(false)
  })
})

// =============================================================================
// PERMISSION CHECK FAILURE HANDLING
// =============================================================================

describe('graceful failure handling', () => {
  it('handles undefined role gracefully', () => {
    expect(hasRequiredPermission(undefined as any, 'member')).toBe(false)
    expect(hasRequiredPermission(undefined as any, 'none')).toBe(true)
  })

  it('handles undefined permission gracefully', () => {
    expect(hasRequiredPermission('admin', undefined as any)).toBe(false)
  })

  it('handles both undefined role and permission', () => {
    expect(hasRequiredPermission(undefined as any, undefined as any)).toBe(
      false,
    )
  })
})
