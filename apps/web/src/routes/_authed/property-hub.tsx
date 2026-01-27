/**
 * Property Hub Layout
 *
 * Main property hub page with portfolio overview. Drawers are handled by
 * the DrawerProvider at the root level.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 */

import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import {
  useDefaultPortfolio,
  useDeleteProperty,
  usePermissions,
  useProperties,
} from '@/hooks/api'
import { PageHeader } from '@/components/layouts/PageHeader'
import { DeletePropertyModal } from '@/components/property-hub/DeletePropertyModal'
import { useOnboardingStatus } from '@/utils/onboarding'
import {
  ActivePropertiesGrid,
  ActivePropertiesList,
  DraftProperties,
  ManagementTopology,
  PortfolioStats,
  PropertyViewControls,
  StrategicAlerts,
} from '@/components/property-hub/property-hub'
import { DRAWERS, useDrawer } from '@/lib/drawer'

/**
 * Search schema for property hub
 * Drawer params are handled by the global DrawerProvider
 */
const propertyHubSearchSchema = z.object({
  drawer: z.string().optional(),
  propertyId: z.string().optional(),
  loanId: z.string().optional(),
  transactionId: z.string().optional(),
  bankAccountId: z.string().optional(),
})

export const Route = createFileRoute('/_authed/property-hub')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = propertyHubSearchSchema.safeParse(search)
    if (!parsed.success) {
      return {}
    }
    return parsed.data
  },
})

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath })
  const location = useLocation()
  const { openDrawer } = useDrawer()
  const { isSignedIn, isLoaded } = useUser()
  const { completed: onboardingCompleted, isLoading: onboardingLoading } =
    useOnboardingStatus()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null)
  const [deletePropertyAddress, setDeletePropertyAddress] = useState<string>('')

  // Drawer handlers using the drawer factory
  const handleOpenRentalIncomeDrawer = (propertyId: string) => {
    openDrawer(DRAWERS.RENTAL_INCOME, { propertyId })
  }

  const handleOpenValuationDrawer = (propertyId: string) => {
    openDrawer(DRAWERS.VALUATION, { propertyId })
  }

  // Fetch real properties from API
  const { data: portfolio } = useDefaultPortfolio()
  const { data: properties = [] } = useProperties(portfolio?.id || null)
  const deleteProperty = useDeleteProperty()

  // Get permissions for property-level access filtering
  const { hasPropertyAccess, isLoading: permissionsLoading } = usePermissions(
    portfolio?.id || null,
  )

  // Filter properties to only show those the user has access to (defense in depth)
  // The API already filters, but we add client-side filtering for added security
  const accessibleProperties = properties.filter((p) => hasPropertyAccess(p.id))

  // Separate active and draft properties from accessible properties
  const activeProperties = accessibleProperties.filter(
    (p) => p.status === 'active',
  )
  const draftProperties = accessibleProperties.filter(
    (p) => p.status === 'draft',
  )

  // Check if we're on a property detail route by checking if pathname matches pattern
  const isPropertyDetailRoute =
    location.pathname !== '/property-hub' &&
    location.pathname.startsWith('/property-hub/')

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (isLoaded && isSignedIn && !onboardingLoading && !onboardingCompleted) {
      navigate({ to: '/onboarding' as any })
    }
  }, [isLoaded, isSignedIn, onboardingLoading, onboardingCompleted, navigate])

  // Show loading while checking onboarding status or permissions
  if (!isLoaded || onboardingLoading || permissionsLoading) {
    return <div className="p-8">Loading...</div>
  }

  // Don't render if onboarding not completed (will redirect)
  if (!onboardingCompleted) {
    return null
  }

  const onNavigatePropertyAnalysis = (id: string) => {
    navigate({
      to: '/property-hub/$propertyId' as any,
      params: { propertyId: id } as any,
    })
  }

  // Filter properties
  const filteredActiveProps = activeProperties.filter((p) => {
    const fullAddress = `${p.address}, ${p.city}, ${p.state} ${p.zipCode}`
    const matchesSearch =
      fullAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const filteredDraftProps = draftProperties.filter((p) => {
    const fullAddress = `${p.address}, ${p.city}, ${p.state} ${p.zipCode}`
    const matchesSearch =
      fullAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleDeleteProperty = (propertyId: string, address: string) => {
    setDeletePropertyId(propertyId)
    setDeletePropertyAddress(address)
  }

  // If we're on a property detail route, render the outlet (child route)
  if (isPropertyDetailRoute) {
    return <Outlet />
  }

  return (
    <main className="flex-grow flex flex-col overflow-y-auto max-h-screen">
      <PageHeader
        title="Property Hub"
        rightContent={
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest border bg-white border-slate-200 hover:shadow-md text-slate-900 dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:text-white">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Bulk Upload
            </button>
            <button className="px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest border bg-white border-slate-200 hover:shadow-md text-slate-900 dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:text-white">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Data
            </button>
            <Link
              to="/property-hub/add"
              search={{ propertyId: undefined, step: undefined }}
              className="px-8 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest hover:scale-105 bg-violet-600 text-white shadow-xl shadow-violet-200 dark:bg-[#E8FF4D] dark:text-black dark:shadow-none"
            >
              <Plus size={16} strokeWidth={3} />
              Add Property
            </Link>
          </div>
        }
      />

      <div className="p-8 flex flex-col gap-10">
        <PortfolioStats activeProperties={activeProperties} />

        {/* Two-column layout: Properties (2/3) | Strategic Alerts (1/3) */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: Property controls and listings */}
          <div className="flex-1 lg:w-2/3 flex flex-col gap-8">
            <PropertyViewControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <DraftProperties
              draftProperties={filteredDraftProps}
              onDelete={handleDeleteProperty}
            />
            {viewMode === 'grid' && (
              <ActivePropertiesGrid
                properties={filteredActiveProps}
                onPropertyClick={onNavigatePropertyAnalysis}
                onAddRentalIncome={handleOpenRentalIncomeDrawer}
                onAddCurrentValue={handleOpenValuationDrawer}
              />
            )}
            {viewMode === 'list' && (
              <ActivePropertiesList
                properties={filteredActiveProps}
                onPropertyClick={onNavigatePropertyAnalysis}
                onAddRentalIncome={handleOpenRentalIncomeDrawer}
                onAddCurrentValue={handleOpenValuationDrawer}
              />
            )}
          </div>

          {/* Right column: Strategic Alerts */}
          <div className="lg:w-1/3">
            <StrategicAlerts />
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-white/10" />
        <ManagementTopology activeProperties={activeProperties} />
      </div>

      {/* Delete Property Confirmation Modal */}
      {deletePropertyId && (
        <DeletePropertyModal
          propertyAddress={deletePropertyAddress}
          onConfirm={async () => {
            if (deletePropertyId) {
              try {
                await deleteProperty.mutateAsync(deletePropertyId)
                setDeletePropertyId(null)
                setDeletePropertyAddress('')
              } catch (error) {
                console.error('Failed to delete property:', error)
                // Keep modal open on error so user can try again
              }
            }
          }}
          onCancel={() => {
            setDeletePropertyId(null)
            setDeletePropertyAddress('')
          }}
          isDeleting={deleteProperty.isPending}
        />
      )}
      {/* Drawers are rendered by DrawerProvider at root level based on URL params */}
    </main>
  )
}
