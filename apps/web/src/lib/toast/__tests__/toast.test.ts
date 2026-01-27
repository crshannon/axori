/**
 * Toast Notification System Unit Tests
 *
 * Tests for the toast notification pub/sub system.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addToast,
  clearToasts,
  removeToast,
  subscribeToToasts,
  toast,
} from '../index'

// Helper to collect toasts from subscription
function collectToasts(callback?: (toasts: Array<any>) => void) {
  const toasts: Array<Array<any>> = []
  const unsubscribe = subscribeToToasts((t) => {
    toasts.push([...t])
    callback?.(t)
  })
  return { toasts, unsubscribe }
}

describe('addToast', () => {
  beforeEach(() => {
    // Clear toasts before each test
    clearToasts()
  })

  it('adds a toast and returns an ID', () => {
    const id = addToast('success', 'Test message')
    expect(id).toBeDefined()
    expect(id).toMatch(/^toast_/)
  })

  it('notifies subscribers when toast is added', () => {
    const { toasts, unsubscribe } = collectToasts()

    addToast('info', 'Hello world')

    // Should have one notification with one toast
    expect(toasts.length).toBeGreaterThan(0)
    const latestToasts = toasts[toasts.length - 1]
    expect(latestToasts.length).toBe(1)
    expect(latestToasts[0].message).toBe('Hello world')
    expect(latestToasts[0].type).toBe('info')

    unsubscribe()
  })

  it('creates toast with correct properties', () => {
    const { toasts, unsubscribe } = collectToasts()

    addToast('error', 'Error message', 10000)

    const latestToasts = toasts[toasts.length - 1]
    const toastItem = latestToasts[0]

    expect(toastItem).toHaveProperty('id')
    expect(toastItem).toHaveProperty('type', 'error')
    expect(toastItem).toHaveProperty('message', 'Error message')
    expect(toastItem).toHaveProperty('duration', 10000)

    unsubscribe()
  })

  it('auto-removes toast after duration', () => {
    vi.useFakeTimers()

    const { toasts, unsubscribe } = collectToasts()

    addToast('success', 'Quick toast', 100)

    // Toast should be present
    expect(toasts[toasts.length - 1].length).toBe(1)

    // Fast forward past the duration
    vi.advanceTimersByTime(150)

    // Toast should be removed
    expect(toasts[toasts.length - 1].length).toBe(0)

    unsubscribe()
    vi.useRealTimers()
  })
})

describe('removeToast', () => {
  beforeEach(() => {
    clearToasts()
  })

  it('removes a specific toast by ID', () => {
    const { toasts, unsubscribe } = collectToasts()

    const id1 = addToast('info', 'Toast 1', 0) // 0 = no auto-remove
    const id2 = addToast('info', 'Toast 2', 0)

    // Should have 2 toasts
    expect(toasts[toasts.length - 1].length).toBe(2)

    removeToast(id1)

    // Should have 1 toast remaining
    const remaining = toasts[toasts.length - 1]
    expect(remaining.length).toBe(1)
    expect(remaining[0].id).toBe(id2)

    unsubscribe()
  })

  it('does nothing if ID does not exist', () => {
    const { toasts, unsubscribe } = collectToasts()

    addToast('info', 'Toast 1', 0)
    const initialLength = toasts[toasts.length - 1].length

    removeToast('non_existent_id')

    expect(toasts[toasts.length - 1].length).toBe(initialLength)

    unsubscribe()
  })
})

describe('clearToasts', () => {
  beforeEach(() => {
    clearToasts()
  })

  it('removes all toasts', () => {
    const { toasts, unsubscribe } = collectToasts()

    addToast('info', 'Toast 1', 0)
    addToast('error', 'Toast 2', 0)
    addToast('warning', 'Toast 3', 0)

    expect(toasts[toasts.length - 1].length).toBe(3)

    clearToasts()

    expect(toasts[toasts.length - 1].length).toBe(0)

    unsubscribe()
  })
})

describe('subscribeToToasts', () => {
  beforeEach(() => {
    clearToasts()
  })

  it('returns an unsubscribe function', () => {
    const callback = vi.fn()
    const unsubscribe = subscribeToToasts(callback)

    expect(typeof unsubscribe).toBe('function')

    unsubscribe()
  })

  it('stops receiving notifications after unsubscribe', () => {
    const callback = vi.fn()
    const unsubscribe = subscribeToToasts(callback)

    addToast('info', 'Before unsub', 0)
    expect(callback).toHaveBeenCalled()

    const callCount = callback.mock.calls.length
    unsubscribe()

    addToast('info', 'After unsub', 0)
    // Should not have been called again
    expect(callback.mock.calls.length).toBe(callCount)

    // Cleanup
    clearToasts()
  })
})

describe('toast convenience functions', () => {
  beforeEach(() => {
    clearToasts()
  })

  it('toast.success creates a success toast', () => {
    const { toasts, unsubscribe } = collectToasts()

    toast.success('Success!')

    expect(toasts[toasts.length - 1][0].type).toBe('success')
    expect(toasts[toasts.length - 1][0].message).toBe('Success!')

    unsubscribe()
  })

  it('toast.error creates an error toast', () => {
    const { toasts, unsubscribe } = collectToasts()

    toast.error('Error!')

    expect(toasts[toasts.length - 1][0].type).toBe('error')

    unsubscribe()
  })

  it('toast.warning creates a warning toast', () => {
    const { toasts, unsubscribe } = collectToasts()

    toast.warning('Warning!')

    expect(toasts[toasts.length - 1][0].type).toBe('warning')

    unsubscribe()
  })

  it('toast.info creates an info toast', () => {
    const { toasts, unsubscribe } = collectToasts()

    toast.info('Info!')

    expect(toasts[toasts.length - 1][0].type).toBe('info')

    unsubscribe()
  })
})
