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
  isValidDrawerName,
  getDrawerEntry,
  validateDrawerParams,
  propertyDrawerParamsSchema,
  loanDrawerParamsSchema,
  transactionDrawerParamsSchema,
  bankAccountDrawerParamsSchema,
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
    const financialDrawers = ['add-loan', 'add-transaction', 'operating-expenses', 'rental-income']
    for (const name of financialDrawers) {
      const entry = getDrawerEntry(name)
      expect(entry?.permission).toBe('member')
    }
  })
})
