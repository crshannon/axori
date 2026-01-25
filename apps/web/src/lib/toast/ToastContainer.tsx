/**
 * ToastContainer Component
 *
 * Renders toast notifications at the bottom of the screen.
 * Uses a portal to render at the root level.
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { removeToast, subscribeToToasts } from './index'
import type { Toast } from './index'
import { cn } from '@/utils/helpers/cn'

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const TOAST_STYLES = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-sky-500 text-white',
}

interface ToastItemProps {
  toast: Toast
  onDismiss: () => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const Icon = TOAST_ICONS[toast.type]

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[300px] max-w-[400px]',
        'transform transition-all duration-300 ease-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        TOAST_STYLES[toast.type]
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<Toast>>([])

  // Subscribe to toast changes
  useEffect(() => {
    return subscribeToToasts(setToasts)
  }, [])

  // Don't render anything on the server
  if (typeof window === 'undefined') return null

  // Don't render if no toasts
  if (toasts.length === 0) return null

  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  )
}
