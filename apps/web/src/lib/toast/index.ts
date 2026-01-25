/**
 * Simple Toast Notification System
 *
 * Lightweight toast notifications for user feedback.
 * Uses a pub/sub pattern to allow toasts from anywhere in the app.
 *
 * @see AXO-93 - URL-Based Drawer Factory (for permission denial feedback)
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

type ToastListener = (toasts: Array<Toast>) => void

let toasts: Array<Toast> = []
const listeners: Set<ToastListener> = new Set()

/**
 * Subscribe to toast changes
 */
export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Notify all listeners of toast changes
 */
function notifyListeners(): void {
  listeners.forEach((listener) => listener([...toasts]))
}

/**
 * Add a new toast notification
 */
export function addToast(
  type: ToastType,
  message: string,
  duration: number = 5000
): string {
  const id = `toast_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const toast: Toast = { id, type, message, duration }

  toasts = [...toasts, toast]
  notifyListeners()

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  return id
}

/**
 * Remove a toast by ID
 */
export function removeToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id)
  notifyListeners()
}

/**
 * Clear all toasts
 */
export function clearToasts(): void {
  toasts = []
  notifyListeners()
}

/**
 * Convenience functions for different toast types
 */
export const toast = {
  success: (message: string, duration?: number) => addToast('success', message, duration),
  error: (message: string, duration?: number) => addToast('error', message, duration),
  warning: (message: string, duration?: number) => addToast('warning', message, duration),
  info: (message: string, duration?: number) => addToast('info', message, duration),
}
