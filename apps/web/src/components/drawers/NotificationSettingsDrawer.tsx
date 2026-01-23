import { useEffect, useState } from 'react'
import { Drawer, ErrorCard } from '@axori/ui'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import { usePropertySettings } from '@/hooks/api'

interface NotificationSettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
}

export const NotificationSettingsDrawer = ({
  isOpen,
  onClose,
  propertyId,
}: NotificationSettingsDrawerProps) => {
  const {
    formData,
    updateNotification,
    saveSettings,
    isSaving,
    saveError,
  } = usePropertySettings(propertyId)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localNotifications, setLocalNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  })

  // Sync local form data when drawer opens or formData changes
  useEffect(() => {
    if (isOpen) {
      setLocalNotifications({
        email: formData.notifications.email,
        sms: formData.notifications.sms,
        push: formData.notifications.push,
      })
      setErrors({})
    }
  }, [isOpen, formData])

  const handleToggle = (notifType: keyof typeof localNotifications) => {
    setLocalNotifications((prev) => ({
      ...prev,
      [notifType]: !prev[notifType],
    }))
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    setErrors({})

    try {
      // Update notification settings via hook (for UI state consistency)
      Object.entries(localNotifications).forEach(([key, value]) => {
        updateNotification(
          key as keyof typeof localNotifications,
          value,
        )
      })

      // Save settings with local notifications to avoid stale closure data
      // Pass notifications directly to ensure we save the latest values
      await saveSettings({ notifications: localNotifications })

      onClose()
    } catch (error) {
      console.error('Error saving notification settings:', error)
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to save notification settings. Please try again.',
      })
    }
  }

  const notificationOptions = [
    {
      id: 'email' as const,
      label: 'Fiscal Ledger Digest',
      sub: 'Weekly P&L Summaries',
    },
    {
      id: 'sms' as const,
      label: 'Operational Emergency',
      sub: 'Immediate Repairs/Calls',
    },
    {
      id: 'push' as const,
      label: 'Legal Climate Shift',
      sub: 'Zoning & Regulatory Updates',
    },
  ]

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Engine"
      subtitle="ALERT PREFERENCES"
      width="lg"
      footer={
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] border transition-all hover:bg-slate-500/5 disabled:opacity-50 disabled:cursor-not-allowed dark:border-white/10 dark:text-white border-slate-200 text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-[2] py-4 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-[#E8FF4D] dark:text-black dark:shadow-xl dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-xl shadow-violet-200"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Notification Preferences Section */}
        <section className="space-y-6">
          <DrawerSectionTitle title="Notification Preferences" color="violet" />
          <div className="space-y-6">
            {notificationOptions.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]"
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    {n.label}
                  </p>
                  <p className="text-[9px] font-bold opacity-40 uppercase text-slate-600 dark:text-slate-400">
                    {n.sub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(n.id)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    localNotifications[n.id]
                      ? 'bg-violet-600 dark:bg-[#E8FF4D]'
                      : 'bg-slate-500/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                      localNotifications[n.id]
                        ? 'right-1 bg-white dark:bg-black'
                        : 'left-1 bg-slate-400'
                    }`}
                  ></div>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Error Message */}
        {(errors.submit || saveError) && (
          <ErrorCard
            message={
              errors.submit ||
              (saveError instanceof Error ? saveError.message : 'Failed to save')
            }
          />
        )}
      </form>
    </Drawer>
  )
}
