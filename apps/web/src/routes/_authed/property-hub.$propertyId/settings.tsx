/**
 * Settings Page
 *
 * Property settings management. Drawers are handled by the DrawerProvider
 * at the root level - this page only needs to render the settings components.
 *
 * Drawer opening is handled by individual components using the useDrawer hook
 * or navigate to add ?drawer=<name>&propertyId=<id> to the URL.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 */

import { Loading, cn } from '@axori/ui'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { usePropertySettings } from '@/hooks/api'
import {
  AcquisitionMetadata,
  AssetConfiguration,
  AssetDnaCalibration,
  BillingSection,
  CalculationPresumptions,
  CloudConnect,
  NotificationEngine,
  StakeholderMatrix,
  SystemSovereignty,
} from '@/components/property-hub/property-details/settings'

/**
 * Search schema for settings page
 * Drawer params are handled by the global DrawerProvider
 */
const settingsSearchSchema = z.object({
  drawer: z.string().optional(),
  propertyId: z.string().optional(),
})

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/settings',
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = settingsSearchSchema.safeParse(search)
    if (!parsed.success) {
      return {}
    }
    return parsed.data
  },
})

function RouteComponent() {
  const { propertyId } = Route.useParams()

  const { isLoading, hasError, propertyError } = usePropertySettings(propertyId)

  // Track selected DNA strategy locally (separate from form data for now)
  const selectedDna = 'Yield Maximization' // This would come from portfolio settings

  // Collaborators (static for now - future: connect to API)
  const collaborators = [
    { name: 'Sarah Jenkins', role: 'Partner', status: 'Active' },
    { name: 'Michael Ross', role: 'CPA', status: 'View Only' },
  ]

  const cardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-sm',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 w-full flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    )
  }

  // Error state
  if (hasError && propertyError) {
    return (
      <div className="p-8 w-full">
        <div className={cn(cardClass, 'text-center py-20')}>
          <h3 className="text-xl font-bold text-red-500 mb-4">
            Failed to load property settings
          </h3>
          <p className="text-sm opacity-60">
            {propertyError instanceof Error
              ? propertyError.message
              : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Column: Configuration & Collaboration */}
        <div className="lg:col-span-8 space-y-8">
          <AssetConfiguration propertyId={propertyId} />
          <AcquisitionMetadata propertyId={propertyId} />
          <AssetDnaCalibration
            propertyId={propertyId}
            selectedDna={selectedDna}
          />
          <StakeholderMatrix
            propertyId={propertyId}
            collaborators={collaborators}
          />
        </div>

        {/* Sidebar: Engine Presumptions & Notifs */}
        <div className="lg:col-span-4 space-y-8">
          <NotificationEngine propertyId={propertyId} />
          <CalculationPresumptions propertyId={propertyId} />
          <CloudConnect propertyId={propertyId} />
        </div>
      </div>

      {/* Billing Section - Owner Only */}
      <BillingSection propertyId={propertyId} />

      {/* Danger Zone - Admin/Owner Only */}
      <SystemSovereignty propertyId={propertyId} />
    </div>
    /* Drawers are rendered by DrawerProvider at root level based on URL params */
  )
}
