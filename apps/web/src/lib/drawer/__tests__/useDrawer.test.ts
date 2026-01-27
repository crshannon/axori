/**
 * useDrawer Hook Unit Tests
 *
 * Tests for the useDrawer hook functionality including:
 * - Opening drawers with params
 * - Closing drawers
 * - URL param management
 * - Permission checking
 * - State management
 *
 * @see AXO-93 - URL-Based Drawer Factory
 * @see AXO-121 - Drawer Factory Unit Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

// Import the mocked toast for assertions
import { useDrawer } from '../useDrawer'
import { toast as mockToast } from '@/lib/toast'

// Import hook after mocking

// =============================================================================
// MOCKS - Define mock state that will be used by the mock factories
// =============================================================================

// These need to be defined at module level for the mock factories
let routerStateSearch: Record<string, unknown> = {}

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useRouterState: () => ({
    location: {
      get search() {
        return routerStateSearch
      },
    },
  }),
}))

// Mock TanStack Query
const mockGetQueryData = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    getQueryData: mockGetQueryData,
  }),
}))

// Mock toast
vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

// =============================================================================
// SETUP & TEARDOWN
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks()
  routerStateSearch = {}
})

afterEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// BASIC STATE TESTS
// =============================================================================

describe('useDrawer - initial state', () => {
  it('returns isOpen as false when no drawer in URL', () => {
    const { result } = renderHook(() => useDrawer())
    expect(result.current.isOpen).toBe(false)
  })

  it('returns null currentDrawer when no drawer in URL', () => {
    const { result } = renderHook(() => useDrawer())
    expect(result.current.currentDrawer).toBeNull()
  })

  it('returns empty currentParams when no params in URL', () => {
    const { result } = renderHook(() => useDrawer())
    expect(result.current.currentParams).toEqual({})
  })

  it('isDrawerOpen returns false for any drawer when none is open', () => {
    const { result } = renderHook(() => useDrawer())
    expect(result.current.isDrawerOpen('add-loan')).toBe(false)
    expect(result.current.isDrawerOpen('asset-config')).toBe(false)
  })
})

describe('useDrawer - URL state reading', () => {
  it('returns isOpen as true when drawer param is in URL', () => {
    routerStateSearch = { drawer: 'add-loan' }
    const { result } = renderHook(() => useDrawer())
    expect(result.current.isOpen).toBe(true)
  })

  it('returns correct currentDrawer from URL', () => {
    routerStateSearch = { drawer: 'add-loan' }
    const { result } = renderHook(() => useDrawer())
    expect(result.current.currentDrawer).toBe('add-loan')
  })

  it('returns null for invalid drawer name in URL', () => {
    routerStateSearch = { drawer: 'invalid-drawer' }
    const { result } = renderHook(() => useDrawer())
    expect(result.current.currentDrawer).toBeNull()
    expect(result.current.isOpen).toBe(false)
  })

  it('returns null for non-string drawer param', () => {
    routerStateSearch = { drawer: 123 }
    const { result } = renderHook(() => useDrawer())
    expect(result.current.currentDrawer).toBeNull()
  })

  it('extracts currentParams from URL (excluding drawer)', () => {
    routerStateSearch = {
      drawer: 'add-loan',
      propertyId: 'prop_123',
      loanId: 'loan_456',
    }
    const { result } = renderHook(() => useDrawer())
    expect(result.current.currentParams).toEqual({
      propertyId: 'prop_123',
      loanId: 'loan_456',
    })
  })

  it('isDrawerOpen returns true for the open drawer', () => {
    routerStateSearch = { drawer: 'add-loan' }
    const { result } = renderHook(() => useDrawer())
    expect(result.current.isDrawerOpen('add-loan')).toBe(true)
    expect(result.current.isDrawerOpen('asset-config')).toBe(false)
  })
})

// =============================================================================
// openDrawer TESTS
// =============================================================================

describe('useDrawer - openDrawer', () => {
  it('updates URL params correctly when opening drawer', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_123' })
    })

    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.any(Function),
      replace: true,
    })
  })

  it('merges new params with existing search params', () => {
    routerStateSearch = { existingParam: 'value' }
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_123' })
    })

    // Get the search function passed to navigate
    const navigateCall = mockNavigate.mock.calls[0][0]
    const searchFn = navigateCall.search
    const newSearch = searchFn({ existingParam: 'value' })

    expect(newSearch).toEqual({
      existingParam: 'value',
      drawer: 'add-loan',
      propertyId: 'prop_123',
    })
  })

  it('passes optional loanId param when provided', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', {
        propertyId: 'prop_123',
        loanId: 'loan_456',
      })
    })

    const navigateCall = mockNavigate.mock.calls[0][0]
    const searchFn = navigateCall.search
    const newSearch = searchFn({})

    expect(newSearch).toEqual({
      drawer: 'add-loan',
      propertyId: 'prop_123',
      loanId: 'loan_456',
    })
  })

  it('uses replace: true by default', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_123' })
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ replace: true }),
    )
  })

  it('uses replace: false when specified', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer(
        'add-loan',
        { propertyId: 'prop_123' },
        { replace: false },
      )
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ replace: false }),
    )
  })

  it('does not navigate with invalid params', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: '' }) // Empty propertyId is invalid
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('does not navigate with missing required params', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', {} as any)
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// =============================================================================
// closeDrawer TESTS
// =============================================================================

describe('useDrawer - closeDrawer', () => {
  it('clears drawer-related params when closing', () => {
    routerStateSearch = {
      drawer: 'add-loan',
      propertyId: 'prop_123',
      loanId: 'loan_456',
    }
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.closeDrawer()
    })

    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.objectContaining({
        drawer: undefined,
        propertyId: undefined,
        loanId: undefined,
        transactionId: undefined,
        bankAccountId: undefined,
      }),
      replace: true,
    })
  })

  it('uses replace: true by default', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.closeDrawer()
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ replace: true }),
    )
  })

  it('uses replace: false when specified', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.closeDrawer({ replace: false })
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ replace: false }),
    )
  })
})

// =============================================================================
// PERMISSION CHECKING TESTS
// =============================================================================

describe('useDrawer - permission checking', () => {
  it('allows opening drawer when user has permission (cached)', () => {
    // Setup cached permission data
    mockGetQueryData.mockImplementation((key: Array<string>) => {
      if (key[0] === 'properties') {
        return { portfolioId: 'portfolio_123' }
      }
      if (key[0] === 'permissions') {
        return { role: 'member' }
      }
      return null
    })

    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_123' })
    })

    expect(mockNavigate).toHaveBeenCalled()
    expect(mockToast.warning).not.toHaveBeenCalled()
  })

  it('denies opening drawer when user lacks permission (cached)', () => {
    // Setup cached permission data - viewer can't access member-level drawer
    mockGetQueryData.mockImplementation((key: Array<string>) => {
      if (key[0] === 'properties') {
        return { portfolioId: 'portfolio_123' }
      }
      if (key[0] === 'permissions') {
        return { role: 'viewer' } // Viewer trying to access member-level drawer
      }
      return null
    })

    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_123' })
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockToast.warning).toHaveBeenCalled()
  })

  it('skips permission check when skipPermissionCheck is true', () => {
    // Setup cached permission data - viewer can't access member-level drawer
    mockGetQueryData.mockImplementation((key: Array<string>) => {
      if (key[0] === 'properties') {
        return { portfolioId: 'portfolio_123' }
      }
      if (key[0] === 'permissions') {
        return { role: 'viewer' }
      }
      return null
    })

    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer(
        'add-loan',
        { propertyId: 'prop_123' },
        { skipPermissionCheck: true },
      )
    })

    expect(mockNavigate).toHaveBeenCalled()
    expect(mockToast.warning).not.toHaveBeenCalled()
  })

  it('allows opening when no cached data exists (defers to DrawerProvider)', () => {
    mockGetQueryData.mockReturnValue(null)

    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_123' })
    })

    // Should allow opening - DrawerProvider will check permissions
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('allows admin to access admin-level drawer', () => {
    mockGetQueryData.mockImplementation((key: Array<string>) => {
      if (key[0] === 'properties') {
        return { portfolioId: 'portfolio_123' }
      }
      if (key[0] === 'permissions') {
        return { role: 'admin' }
      }
      return null
    })

    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('connect-bank-account', {
        propertyId: 'prop_123',
      })
    })

    expect(mockNavigate).toHaveBeenCalled()
    expect(mockToast.warning).not.toHaveBeenCalled()
  })

  it('denies member access to admin-level drawer', () => {
    mockGetQueryData.mockImplementation((key: Array<string>) => {
      if (key[0] === 'properties') {
        return { portfolioId: 'portfolio_123' }
      }
      if (key[0] === 'permissions') {
        return { role: 'member' }
      }
      return null
    })

    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('connect-bank-account', {
        propertyId: 'prop_123',
      })
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockToast.warning).toHaveBeenCalled()
  })
})

// =============================================================================
// PRESERVING OTHER URL PARAMS TESTS
// =============================================================================

describe('useDrawer - preserving other URL params', () => {
  it('preserves non-drawer params when opening', () => {
    routerStateSearch = {
      tab: 'overview',
      filter: 'active',
    }
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_123' })
    })

    const navigateCall = mockNavigate.mock.calls[0][0]
    const searchFn = navigateCall.search
    const newSearch = searchFn({ tab: 'overview', filter: 'active' })

    expect(newSearch).toEqual({
      tab: 'overview',
      filter: 'active',
      drawer: 'add-loan',
      propertyId: 'prop_123',
    })
  })

  it('closeDrawer only removes drawer-related params', () => {
    // Note: Current implementation clears specific drawer params
    // Other params are preserved by navigate's merge behavior
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.closeDrawer()
    })

    // Check that only drawer-related params are set to undefined
    const navigateCall = mockNavigate.mock.calls[0][0]
    expect(navigateCall.search).toHaveProperty('drawer', undefined)
    expect(navigateCall.search).toHaveProperty('propertyId', undefined)
    expect(navigateCall.search).toHaveProperty('loanId', undefined)
    expect(navigateCall.search).toHaveProperty('transactionId', undefined)
    expect(navigateCall.search).toHaveProperty('bankAccountId', undefined)
  })
})

// =============================================================================
// EDGE CASES
// =============================================================================

describe('useDrawer - edge cases', () => {
  it('handles URL-encoded property IDs', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_123-test' })
    })

    expect(mockNavigate).toHaveBeenCalled()
  })

  it('handles special characters in property ID', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_abc-123_xyz' })
    })

    expect(mockNavigate).toHaveBeenCalled()
  })

  it('handles multiple rapid open/close calls', () => {
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('add-loan', { propertyId: 'prop_1' })
      result.current.closeDrawer()
      result.current.openDrawer('asset-config', { propertyId: 'prop_2' })
    })

    expect(mockNavigate).toHaveBeenCalledTimes(3)
  })

  it('handles switching between drawers', () => {
    routerStateSearch = { drawer: 'add-loan', propertyId: 'prop_1' }
    const { result } = renderHook(() => useDrawer())

    act(() => {
      result.current.openDrawer('asset-config', { propertyId: 'prop_2' })
    })

    const navigateCall = mockNavigate.mock.calls[0][0]
    const searchFn = navigateCall.search
    const newSearch = searchFn({ drawer: 'add-loan', propertyId: 'prop_1' })

    expect(newSearch.drawer).toBe('asset-config')
    expect(newSearch.propertyId).toBe('prop_2')
  })
})

// =============================================================================
// RETURN VALUE COMPLETENESS
// =============================================================================

describe('useDrawer - return value', () => {
  it('returns all expected properties', () => {
    const { result } = renderHook(() => useDrawer())

    expect(result.current).toHaveProperty('openDrawer')
    expect(result.current).toHaveProperty('closeDrawer')
    expect(result.current).toHaveProperty('currentDrawer')
    expect(result.current).toHaveProperty('currentParams')
    expect(result.current).toHaveProperty('isOpen')
    expect(result.current).toHaveProperty('isDrawerOpen')
  })

  it('openDrawer is a function', () => {
    const { result } = renderHook(() => useDrawer())
    expect(typeof result.current.openDrawer).toBe('function')
  })

  it('closeDrawer is a function', () => {
    const { result } = renderHook(() => useDrawer())
    expect(typeof result.current.closeDrawer).toBe('function')
  })

  it('isDrawerOpen is a function', () => {
    const { result } = renderHook(() => useDrawer())
    expect(typeof result.current.isDrawerOpen).toBe('function')
  })
})
