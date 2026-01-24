import { Card, IconButton } from '@axori/ui'
import { Pencil } from 'lucide-react'
import { LearningHubButton } from '../financials/LearningHubButton'
import { getNotificationSettingsSnippets } from '@/data/learning-hub/settings-snippets'
import { usePropertyPermissions, usePropertySettings } from '@/hooks/api'
import { ReadOnlyBanner } from '@/components/property-hub/ReadOnlyBanner'
import { useDrawer, DRAWERS } from '@/lib/drawer'

interface NotificationEngineProps {
  propertyId: string
}

/**
 * NotificationEngine component - Displays notification preferences
 * Shows: email, SMS, push notification toggles
 *
 * @see AXO-93 - Uses drawer factory for opening edit drawer
 */
export const NotificationEngine = ({ propertyId }: NotificationEngineProps) => {
  const { openDrawer } = useDrawer()
  const { formData, isLoading } = usePropertySettings(propertyId)
  const { canEdit, isReadOnly } = usePropertyPermissions(propertyId)

  const handleOpenDrawer = () => {
    openDrawer(DRAWERS.NOTIFICATIONS, { propertyId })
  }

  if (isLoading) {
    return (
      <Card variant="rounded" padding="lg" radius="xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-8 w-32 bg-slate-200 dark:bg-white/5 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black uppercase tracking-tighter">
          Notification Engine
        </h3>
        <div className="flex items-center gap-3">
          <LearningHubButton
            snippets={getNotificationSettingsSnippets()}
            title="Notification Settings Learning Hub"
            subtitle="Alert preferences and strategies"
            componentKey="notification-engine"
          />
          {isReadOnly && <ReadOnlyBanner variant="badge" />}
          {canEdit && (
            <IconButton
              icon={Pencil}
              size="sm"
              variant="ghost"
              shape="rounded"
              onClick={handleOpenDrawer}
              aria-label="Edit notification settings"
            />
          )}
        </div>
      </div>
      <div className="space-y-6">
        {[
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
        ].map((n) => {
          const isEnabled = formData.notifications[n.id]
          return (
            <div key={n.id} className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-tight">
                  {n.label}
                </p>
                <p className="text-[9px] font-bold opacity-40 uppercase">
                  {n.sub}
                </p>
              </div>
              <div
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                  isEnabled
                    ? 'bg-violet-600 text-white dark:bg-[#E8FF4D] dark:text-black'
                    : 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                }`}
              >
                {isEnabled ? 'ON' : 'OFF'}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
