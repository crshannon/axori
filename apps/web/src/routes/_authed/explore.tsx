import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Overline, PropertyCard } from '@axori/ui'
import { PageHeader } from '@/components/layouts/PageHeader'
import { PropertyDetailPanel, PropertyMap } from '@/components/explore'
import { cn } from '@/utils/helpers'
import { useOnboardingStatus } from '@/utils/onboarding'
import { useTheme } from '@/utils/providers/theme-provider'

export const Route = createFileRoute('/_authed/explore')({
  component: RouteComponent,
})

interface Property {
  id: string
  addr: string
  price: string
  yield: string
  iq: number
  match: number
  strategy: string
  image: string
  lat: number
  lng: number
  reason: string
  cashFlow: string
  currentValue: string
}

const mockProperties: Array<Property> = [
  {
    id: '1',
    addr: '1247 Tech Ridge Blvd',
    price: '$485k',
    yield: '6.8%',
    iq: 92,
    match: 94,
    strategy: 'BRRRR',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    lat: 30.4015,
    lng: -97.6897,
    reason:
      'High-growth corridor with strong rental demand and appreciation potential',
    cashFlow: '+$450/mo',
    currentValue: '$485k',
  },
  {
    id: '2',
    addr: '8921 Research Blvd',
    price: '$420k',
    yield: '7.2%',
    iq: 88,
    match: 91,
    strategy: 'Cash Flow',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    lat: 30.3847,
    lng: -97.7284,
    reason:
      'Prime location with excellent cash flow metrics and low vacancy risk',
    cashFlow: '+$520/mo',
    currentValue: '$420k',
  },
  {
    id: '3',
    addr: '3401 Lamar Blvd',
    price: '$550k',
    yield: '6.1%',
    iq: 85,
    match: 87,
    strategy: 'Appreciation',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    lat: 30.2642,
    lng: -97.7617,
    reason:
      'Emerging neighborhood with strong long-term appreciation trajectory',
    cashFlow: '+$380/mo',
    currentValue: '$550k',
  },
  {
    id: '4',
    addr: '5621 Airport Blvd',
    price: '$395k',
    yield: '7.5%',
    iq: 90,
    match: 89,
    strategy: 'BRRRR',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    lat: 30.3174,
    lng: -97.7001,
    reason:
      'High yield opportunity with renovation potential for value-add strategy',
    cashFlow: '+$495/mo',
    currentValue: '$395k',
  },
  {
    id: '5',
    addr: '2100 E Riverside Dr',
    price: '$445k',
    yield: '6.9%',
    iq: 87,
    match: 92,
    strategy: 'Cash Flow',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    lat: 30.2406,
    lng: -97.7289,
    reason:
      'Stable cash flow with consistent tenant demand in established area',
    cashFlow: '+$410/mo',
    currentValue: '$445k',
  },
]

function RouteComponent() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useUser()
  const { completed: onboardingCompleted, isLoading: onboardingLoading } =
    useOnboardingStatus()
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null)

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (isLoaded && isSignedIn && !onboardingLoading && !onboardingCompleted) {
      navigate({ to: '/onboarding' as any })
    }
  }, [isLoaded, isSignedIn, onboardingLoading, onboardingCompleted, navigate])

  // Show loading while checking onboarding status
  if (!isLoaded || onboardingLoading) {
    return <div className="p-8">Loading...</div>
  }

  // Don't render if onboarding not completed (will redirect)
  if (!onboardingCompleted) {
    return null
  }

  const selectedProp = mockProperties.find((p) => p.id === selectedPropId)

  const onActivateIntel = (propertyId: string) => {
    // TODO: Implement activate intel functionality
    console.log('Activate intel for property:', propertyId)
  }

  return (
    <main className="flex-grow flex flex-col h-screen overflow-hidden">
      <PageHeader
        title="Alpha Explorer"
        variant="default"
        rightContent={
          <>
            <div className="flex gap-2">
              {['Under $500k', 'Yield > 5%', 'High Match'].map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border',
                    isDark
                      ? 'bg-white/5 border-white/5 text-slate-400'
                      : 'bg-slate-100 border-slate-200 text-slate-500',
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Overline
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest opacity-40 italic',
                  isDark ? 'text-white/60' : 'text-slate-500',
                )}
              >
                Sorted by DNA Match
              </Overline>
              <button
                className={cn(
                  'w-10 h-10 rounded-xl border flex items-center justify-center transition-all',
                  isDark
                    ? 'border-white/10 hover:bg-white/5'
                    : 'border-slate-200 hover:bg-slate-50',
                )}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m21 16-4 4-4-4" />
                  <path d="M17 20V4" />
                  <path d="m3 8 4-4 4 4" />
                  <path d="M7 4v16" />
                </svg>
              </button>
            </div>
          </>
        }
      />

      <div className="flex-1 relative overflow-hidden">
        {/* Full Width Map */}
        <section className="absolute inset-0 w-full h-full">
          <PropertyMap
            properties={mockProperties.map((p) => ({
              id: p.id,
              lat: p.lat,
              lng: p.lng,
              iq: p.iq,
              match: p.match,
            }))}
            selectedPropertyId={selectedPropId}
            onPropertySelect={setSelectedPropId}
            className="w-full h-full"
          />
        </section>

        {/* Right: Property List Pane - Fixed Overlay */}
        <section
          className={cn(
            'fixed top-[73px] right-0 bottom-0 w-full lg:w-[480px] flex flex-col overflow-y-auto z-20',
            'bg-black/40 backdrop-blur-md border-l border-white/10',
          )}
        >
          <div className="p-8 space-y-6">
            {mockProperties.map((p) => (
              <div
                key={p.id}
                className={cn(
                  'rounded-[3rem] border transition-all duration-500 relative overflow-hidden',
                  selectedPropId === p.id
                    ? isDark
                      ? 'border-white shadow-2xl'
                      : 'border-slate-900 shadow-2xl'
                    : isDark
                      ? 'border-white/5'
                      : 'border-slate-100',
                )}
              >
                <PropertyCard
                  id={p.id}
                  image={p.image}
                  address={p.addr}
                  status={p.strategy}
                  score={p.iq}
                  cashFlow={p.cashFlow}
                  currentValue={p.currentValue}
                  theme={isDark ? 'dark' : 'light'}
                  onClick={(propertyId) => setSelectedPropId(propertyId)}
                  cardClassName={cn(
                    'rounded-[3rem]',
                    selectedPropId === p.id
                      ? isDark
                        ? 'bg-white text-black'
                        : 'bg-slate-900 text-white'
                      : isDark
                        ? 'bg-white/5'
                        : 'bg-slate-50',
                  )}
                  className={cn(
                    selectedPropId === p.id
                      ? 'hover:shadow-2xl'
                      : isDark
                        ? 'hover:bg-white/10'
                        : 'hover:bg-white hover:shadow-xl hover:shadow-slate-200/50',
                  )}
                />
                {/* Match Percentage Badge - Explore specific overlay on image */}
                <div className="absolute bottom-[calc(192px+1rem)] right-6 z-10">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-2xl border backdrop-blur-md',
                      selectedPropId === p.id
                        ? isDark
                          ? 'bg-[#E8FF4D] text-black border-white/20'
                          : 'bg-violet-600 text-white border-white/20'
                        : isDark
                          ? 'bg-[#E8FF4D]/20 text-[#E8FF4D] border-[#E8FF4D]/30'
                          : 'bg-violet-600/10 text-violet-600 border-violet-200',
                    )}
                  >
                    {p.match}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Detail Slide-over */}
      <PropertyDetailPanel
        property={selectedProp || null}
        isOpen={!!selectedPropId}
        isDark={isDark}
        onClose={() => setSelectedPropId(null)}
        onActivateIntel={onActivateIntel}
      />

      {selectedPropId && (
        <div
          onClick={() => setSelectedPropId(null)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
        />
      )}
    </main>
  )
}
