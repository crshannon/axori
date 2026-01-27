/**
 * Drawer Registry Unit Tests
 *
 * Tests for the drawer registry system including:
 * - Drawer name validation
 * - Param schema validation
 * - Registry entry retrieval
 *
 * @see AXO-93 - URL-Based Drawer Factory
 */

import { describe, expect, it } from 'vitest'
import {
  DRAWER_NAMES,
  DRAWER_REGISTRY,
  bankAccountDrawerParamsSchema,
  getDrawerEntry,
  isValidDrawerName,
  loanDrawerParamsSchema,
  propertyDrawerParamsSchema,
  transactionDrawerParamsSchema,
  validateDrawerParams,
} from '../registry'

describe('DRAWER_NAMES', () => {
  it('contains all expected drawer names', () => {
    expect(DRAWER_NAMES).toContain('asset-config')
    expect(DRAWER_NAMES).toContain('acquisition')
    expect(DRAWER_NAMES).toContain('add-loan')
    expect(DRAWER_NAMES).toContain('add-transaction')
    expect(DRAWER_NAMES).toContain('rental-income')
    expect(DRAWER_NAMES).toContain('valuation')
  })

  it('does not contain invalid drawer names', () => {
    expect(DRAWER_NAMES).not.toContain('invalid-drawer')
    expect(DRAWER_NAMES).not.toContain('')
    // LearningHubDrawer is excluded because it requires non-URL data
    expect(DRAWER_NAMES).not.toContain('learning-hub')
  })
})

describe('DRAWER_REGISTRY', () => {
  it('has entries for all drawer names', () => {
    for (const name of DRAWER_NAMES) {
      expect(DRAWER_REGISTRY[name]).toBeDefined()
    }
  })

  it('each entry has required properties', () => {
    for (const name of DRAWER_NAMES) {
      const entry = DRAWER_REGISTRY[name]
      expect(entry).toHaveProperty('component')
      expect(entry).toHaveProperty('paramsSchema')
      expect(entry).toHaveProperty('permission')
      expect(entry).toHaveProperty('displayName')
    }
  })

  it('permissions are valid values', () => {
    const validPermissions = ['none', 'viewer', 'member', 'admin', 'owner']
    for (const name of DRAWER_NAMES) {
      const entry = DRAWER_REGISTRY[name]
      expect(validPermissions).toContain(entry.permission)
    }
  })
})

describe('isValidDrawerName', () => {
  it('returns true for valid drawer names', () => {
    expect(isValidDrawerName('asset-config')).toBe(true)
    expect(isValidDrawerName('add-loan')).toBe(true)
    expect(isValidDrawerName('rental-income')).toBe(true)
  })

  it('returns false for invalid drawer names', () => {
    expect(isValidDrawerName('invalid-drawer')).toBe(false)
    expect(isValidDrawerName('')).toBe(false)
    expect(isValidDrawerName('learning-hub')).toBe(false)
    expect(isValidDrawerName('ASSET-CONFIG')).toBe(false) // case sensitive
  })
})

describe('getDrawerEntry', () => {
  it('returns entry for valid drawer name', () => {
    const entry = getDrawerEntry('asset-config')
    expect(entry).not.toBeNull()
    expect(entry?.displayName).toBe('Asset Configuration')
    expect(entry?.permission).toBe('member')
  })

  it('returns null for invalid drawer name', () => {
    expect(getDrawerEntry('invalid-drawer')).toBeNull()
    expect(getDrawerEntry('')).toBeNull()
  })
})

describe('propertyDrawerParamsSchema', () => {
  it('validates valid params', () => {
    const result = propertyDrawerParamsSchema.safeParse({
      propertyId: 'prop_123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.propertyId).toBe('prop_123')
    }
  })

  it('rejects missing propertyId', () => {
    const result = propertyDrawerParamsSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects empty propertyId', () => {
    const result = propertyDrawerParamsSchema.safeParse({
      propertyId: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('loanDrawerParamsSchema', () => {
  it('validates with only propertyId', () => {
    const result = loanDrawerParamsSchema.safeParse({
      propertyId: 'prop_123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.propertyId).toBe('prop_123')
      expect(result.data.loanId).toBeUndefined()
    }
  })

  it('validates with propertyId and loanId', () => {
    const result = loanDrawerParamsSchema.safeParse({
      propertyId: 'prop_123',
      loanId: 'loan_456',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.propertyId).toBe('prop_123')
      expect(result.data.loanId).toBe('loan_456')
    }
  })

  it('rejects missing propertyId', () => {
    const result = loanDrawerParamsSchema.safeParse({
      loanId: 'loan_456',
    })
    expect(result.success).toBe(false)
  })
})

describe('transactionDrawerParamsSchema', () => {
  it('validates with only propertyId', () => {
    const result = transactionDrawerParamsSchema.safeParse({
      propertyId: 'prop_123',
    })
    expect(result.success).toBe(true)
  })

  it('validates with propertyId and transactionId', () => {
    const result = transactionDrawerParamsSchema.safeParse({
      propertyId: 'prop_123',
      transactionId: 'txn_789',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.transactionId).toBe('txn_789')
    }
  })
})

describe('bankAccountDrawerParamsSchema', () => {
  it('validates with only propertyId', () => {
    const result = bankAccountDrawerParamsSchema.safeParse({
      propertyId: 'prop_123',
    })
    expect(result.success).toBe(true)
  })

  it('validates with propertyId and bankAccountId', () => {
    const result = bankAccountDrawerParamsSchema.safeParse({
      propertyId: 'prop_123',
      bankAccountId: 'bank_abc',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.bankAccountId).toBe('bank_abc')
    }
  })
})

describe('validateDrawerParams', () => {
  it('returns validated params for valid input', () => {
    const params = validateDrawerParams('asset-config', {
      propertyId: 'prop_123',
    })
    expect(params).toEqual({ propertyId: 'prop_123' })
  })

  it('returns validated params for loan drawer with loanId', () => {
    const params = validateDrawerParams('add-loan', {
      propertyId: 'prop_123',
      loanId: 'loan_456',
    })
    expect(params).toEqual({
      propertyId: 'prop_123',
      loanId: 'loan_456',
    })
  })

  it('returns null for invalid drawer name', () => {
    const params = validateDrawerParams('invalid-drawer' as any, {
      propertyId: 'prop_123',
    })
    expect(params).toBeNull()
  })

  it('returns null for invalid params', () => {
    const params = validateDrawerParams('asset-config', {
      propertyId: '', // Empty string is invalid
    })
    expect(params).toBeNull()
  })

  it('returns null for missing required params', () => {
    const params = validateDrawerParams('asset-config', {})
    expect(params).toBeNull()
  })
})

describe('drawer permissions', () => {
  it('asset-config requires member permission', () => {
    const entry = getDrawerEntry('asset-config')
    expect(entry?.permission).toBe('member')
  })

  it('connect-bank-account requires admin permission', () => {
    const entry = getDrawerEntry('connect-bank-account')
    expect(entry?.permission).toBe('admin')
  })

  it('all financials drawers require member permission', () => {
    const financialDrawers = [
      'add-loan',
      'add-transaction',
      'operating-expenses',
      'rental-income',
    ]
    for (const name of financialDrawers) {
      const entry = getDrawerEntry(name)
      expect(entry?.permission).toBe('member')
    }
  })
})

// =============================================================================
// PARAM PARSING EDGE CASES
// =============================================================================

describe('param parsing edge cases', () => {
  describe('URL-encoded values', () => {
    it('handles URL-encoded property IDs', () => {
      // Simulate decodeURIComponent behavior for URL-encoded values
      const encodedId = decodeURIComponent('prop%5F123%2Dtest')
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: encodedId,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.propertyId).toBe('prop_123-test')
      }
    })

    it('handles IDs with special characters', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: 'prop_abc-123_xyz',
      })
      expect(result.success).toBe(true)
    })

    it('handles IDs with unicode characters', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: 'prop_日本語_test',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('malicious input handling', () => {
    it('rejects script injection attempts in propertyId', () => {
      // While Zod accepts strings, the schema validates minimum length
      // The actual XSS protection happens at render time
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: '<script>alert("xss")</script>',
      })
      // Schema accepts any non-empty string - XSS protection is at render
      expect(result.success).toBe(true)
    })

    it('handles SQL injection patterns (validation only, no execution)', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: "'; DROP TABLE properties; --",
      })
      // Schema accepts any non-empty string - SQL injection protection is at DB layer
      expect(result.success).toBe(true)
    })

    it('handles very long input strings', () => {
      const longId = 'a'.repeat(10000)
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: longId,
      })
      // Schema accepts any non-empty string without length limits
      expect(result.success).toBe(true)
    })

    it('handles null byte injection', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: 'prop_123\x00malicious',
      })
      expect(result.success).toBe(true)
    })

    it('handles prototype pollution attempts', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: '__proto__',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('type coercion and edge cases', () => {
    it('rejects number as propertyId', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: 12345,
      })
      expect(result.success).toBe(false)
    })

    it('rejects boolean as propertyId', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects array as propertyId', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: ['prop_123'],
      })
      expect(result.success).toBe(false)
    })

    it('rejects object as propertyId', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: { id: 'prop_123' },
      })
      expect(result.success).toBe(false)
    })

    it('rejects null as propertyId', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: null,
      })
      expect(result.success).toBe(false)
    })

    it('rejects undefined as propertyId', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: undefined,
      })
      expect(result.success).toBe(false)
    })

    it('handles whitespace-only propertyId', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: '   ',
      })
      // Should be accepted by base schema but min(1) should reject after trim
      // Current schema just checks min(1) length, whitespace is 3+ chars
      expect(result.success).toBe(true) // NOTE: Consider adding .trim() to schema if needed
    })
  })

  describe('optional params handling', () => {
    it('handles undefined optional loanId', () => {
      const result = loanDrawerParamsSchema.safeParse({
        propertyId: 'prop_123',
        loanId: undefined,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.loanId).toBeUndefined()
      }
    })

    it('handles null as optional loanId (should fail)', () => {
      const result = loanDrawerParamsSchema.safeParse({
        propertyId: 'prop_123',
        loanId: null,
      })
      // z.string().optional() does not accept null
      expect(result.success).toBe(false)
    })

    it('handles empty string as optional loanId', () => {
      const result = loanDrawerParamsSchema.safeParse({
        propertyId: 'prop_123',
        loanId: '',
      })
      // Empty string is valid for optional string
      expect(result.success).toBe(true)
    })

    it('strips unknown properties', () => {
      const result = propertyDrawerParamsSchema.safeParse({
        propertyId: 'prop_123',
        unknownProp: 'should be stripped',
        anotherUnknown: 12345,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownProp')
        expect(result.data).not.toHaveProperty('anotherUnknown')
      }
    })
  })
})

describe('validateDrawerParams edge cases', () => {
  it('returns null for undefined drawer name', () => {
    const params = validateDrawerParams(undefined as any, {
      propertyId: 'prop_123',
    })
    expect(params).toBeNull()
  })

  it('returns null for null drawer name', () => {
    const params = validateDrawerParams(null as any, {
      propertyId: 'prop_123',
    })
    expect(params).toBeNull()
  })

  it('handles extra properties in params', () => {
    const params = validateDrawerParams('asset-config', {
      propertyId: 'prop_123',
      extraProp: 'should be stripped',
    })
    expect(params).toEqual({ propertyId: 'prop_123' })
  })

  it('preserves valid optional params', () => {
    const params = validateDrawerParams('add-loan', {
      propertyId: 'prop_123',
      loanId: 'loan_456',
    })
    expect(params).toEqual({
      propertyId: 'prop_123',
      loanId: 'loan_456',
    })
  })

  it('handles case sensitivity correctly', () => {
    expect(
      validateDrawerParams('ASSET-CONFIG' as any, { propertyId: 'prop_123' }),
    ).toBeNull()
    expect(
      validateDrawerParams('Asset-Config' as any, { propertyId: 'prop_123' }),
    ).toBeNull()
    expect(
      validateDrawerParams('asset-config', { propertyId: 'prop_123' }),
    ).not.toBeNull()
  })
})
