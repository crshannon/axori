import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layouts/PageHeader'
import {
  CapitalLocker,
  DNAProfile,
  FreedomEngine,
  Milestones,
  StrategicExecutionTarget,
  Trajectory,
} from '@/components/wealth-journey'
import { cn } from '@/utils/helpers'
import { useOnboardingStatus } from '@/utils/onboarding'
import { useOnboarding } from '@/components/onboarding/hooks/useOnboardingData'
import { useTheme } from '@/utils/providers/theme-provider'

export const Route = createFileRoute('/_authed/wealth-journey')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded, user } = useUser()
  const { completed: onboardingCompleted, isLoading: onboardingLoading } =
    useOnboardingStatus()
  const { data: onboardingData } = useOnboarding()
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'
  const [projectionView, setProjectionView] = useState<
    'Conservative' | 'Aggressive'
  >('Conservative')

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

  // Mock data - in production, this would come from API
  const currentPassiveIncome = 8070 // From dashboard stats
  const freedomNumber = onboardingData?.data?.freedomNumber || 5000
  const freedomProgress = Math.min(
    (currentPassiveIncome / freedomNumber) * 100,
    100,
  )
  const projectedYears =
    freedomNumber > 0
      ? Math.ceil(
          (freedomNumber - currentPassiveIncome) / (currentPassiveIncome * 0.1),
        )
      : 0

  // Calculate projected date
  const projectedDate = new Date()
  projectedDate.setFullYear(projectedDate.getFullYear() + projectedYears)
  const projectedMonth = projectedDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  const deployableCash = 142400
  const reserves = 50000
  const reservesTarget = 50000
  const reservesHealth = (reserves / reservesTarget) * 100
  const nextBuyTarget = 200000
  const nextBuyProgress = Math.min((deployableCash / nextBuyTarget) * 100, 100)
  const readinessScore = Math.min(
    (deployableCash / nextBuyTarget) * 50 + (reservesHealth / 100) * 50,
    100,
  )

  const gapToFreedom = freedomNumber - currentPassiveIncome
  const passiveCoverage = (currentPassiveIncome / freedomNumber) * 100
  const freedomScore = Math.min(freedomProgress * 0.64, 100) // Mock score

  const cardClass = cn(
    'rounded-[2.5rem] shadow-sm border transition-all',
    isDark
      ? 'bg-[#1A1A1A] border-white/5'
      : 'bg-white border-slate-100 hover:shadow-xl',
  )

  const onNavigateExplore = () => {
    navigate({ to: '/explore' as any })
  }

  return (
    <main className="flex-grow flex flex-col overflow-y-auto max-h-screen">
      <PageHeader
        title="Wealth Journey"
        rightContent={
          <>
            <div
              className={cn(
                'px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest',
                isDark
                  ? 'border-[#E8FF4D]/20 text-[#E8FF4D]'
                  : 'border-violet-100 text-violet-600',
              )}
            >
              Mission Status: On Track
            </div>
            <div
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center font-black shadow-md transition-colors',
                isDark
                  ? 'bg-[#1A1A1A] border border-white/10 text-white'
                  : 'bg-slate-200 border border-white text-slate-900',
              )}
            >
              {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || 'IN'}
            </div>
          </>
        }
      />

      {/* Dashboard Grid */}
      <div className="p-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Row 1: Freedom Engine + Growth Projection */}
        <section className="xl:col-span-8">
          <FreedomEngine
            freedomNumber={freedomNumber}
            currentPassiveIncome={currentPassiveIncome}
            projectedMonth={projectedMonth}
            gapToFreedom={gapToFreedom}
            passiveCoverage={passiveCoverage}
            freedomScore={freedomScore}
            cardClass={cardClass}
          />
        </section>

        <section className="xl:col-span-4">
          <Trajectory
            projectionView={projectionView}
            onViewChange={setProjectionView}
            cardClass={cardClass}
          />
        </section>

        {/* Row 2: Strategic Execution Bar (Moved Up) */}
        <section className="xl:col-span-12">
          <StrategicExecutionTarget
            readinessScore={readinessScore}
            onExecute={onNavigateExplore}
            cardClass={cardClass}
          />
        </section>

        {/* Row 3: Milestones + Capital Locker + DNA */}
        <section className="xl:col-span-4">
          <Milestones
            milestones={[
              { label: 'First Property', date: 'Nov 23', done: true },
              { label: '$1k/mo Yield', date: 'Jan 24', done: true },
              { label: '5 Props Unit', date: 'Target 26', done: false },
              { label: 'BRRRR Mastery', date: 'Target 27', done: false },
            ]}
            cardClass={cardClass}
          />
        </section>

        <section className="xl:col-span-4">
          <CapitalLocker
            deployableCash={deployableCash}
            nextBuyProgress={nextBuyProgress}
            cardClass={cardClass}
          />
        </section>

        <section className="xl:col-span-4">
          <DNAProfile
            risk="Aggressive"
            strategy={onboardingData?.data?.strategy || 'Cash Flow'}
            structure={
              onboardingData?.data?.ownership === 'LLC'
                ? `Series LLC${onboardingData.data.llcName ? ` (${onboardingData.data.llcName})` : ''}`
                : onboardingData?.data?.ownership || 'Personal'
            }
            cardClass={cardClass}
          />
        </section>
      </div>
    </main>
  )
}
