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
import {
  useDefaultPortfolio,
  useDeleteProperty,
  usePermissions,
  useProperties,
} from '@/hooks/api'
import { PageHeader } from '@/components/layouts/PageHeader'
import { DeletePropertyModal } from '@/components/property-hub/DeletePropertyModal'
import { cn } from '@/utils/helpers'
import { useOnboardingStatus } from '@/utils/onboarding'
import { useTheme } from '@/utils/providers/theme-provider'
import {
  ActivePropertiesGrid,
  ActivePropertiesList,
  DraftProperties,
  ManagementTopology,
  PortfolioStats,
  PropertyViewControls,
  StrategicAlerts,
} from '@/components/property-hub/property-hub'

export const Route = createFileRoute('/_authed/property-hub')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isSignedIn, isLoaded } = useUser()
  const { completed: onboardingCompleted, isLoading: onboardingLoading } =
    useOnboardingStatus()
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null)
  const [deletePropertyAddress, setDeletePropertyAddress] = useState<string>('')

  // Fetch real properties from API
  const { data: portfolio } = useDefaultPortfolio()
  const { data: properties = [] } = useProperties(portfolio?.id || null)
  const deleteProperty = useDeleteProperty()
  
  // Get permissions for property-level access filtering
  const { hasPropertyAccess, isLoading: permissionsLoading } = usePermissions(portfolio?.id || null)

  // Filter properties to only show those the user has access to (defense in depth)
  // The API already filters, but we add client-side filtering for added security
  const accessibleProperties = properties.filter((p) => hasPropertyAccess(p.id))
  
  // Separate active and draft properties from accessible properties
  const activeProperties = accessibleProperties.filter((p) => p.status === 'active')
  const draftProperties = accessibleProperties.filter((p) => p.status === 'draft')

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
            <button
              className={cn(
                'px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest border',
                isDark
                  ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                  : 'bg-white border-slate-200 hover:shadow-md text-slate-900',
              )}
            >
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
            <button
              className={cn(
                'px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest border',
                isDark
                  ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                  : 'bg-white border-slate-200 hover:shadow-md text-slate-900',
              )}
            >
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
              className={cn(
                'px-8 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest hover:scale-105',
                isDark
                  ? 'bg-[#E8FF4D] text-black'
                  : 'bg-violet-600 text-white shadow-xl shadow-violet-200',
              )}
            >
              <Plus size={16} strokeWidth={3} />
              Add Property
            </Link>
          </div>
        }
      />

      <div className="p-8 flex flex-col gap-10">
        <PortfolioStats activeProperties={activeProperties} />
        <StrategicAlerts />
        <div className={cn('h-px', isDark ? 'bg-white/10' : 'bg-slate-200')} />
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
          />
        )}
        {viewMode === 'list' && (
          <ActivePropertiesList
            properties={filteredActiveProps}
            onPropertyClick={onNavigatePropertyAnalysis}
          />
        )}
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
    </main>
  )
}
