import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Card } from '@axori/ui'
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
import { FreedomForcast } from '@/components/wealth-journey/FreedomForcast'

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

  // Generate className for child components that expect cardClass prop
  const cardClass = cn(
    'rounded-[2.5rem] shadow-sm border transition-all bg-white border-slate-100 hover:shadow-xl dark:bg-[#1A1A1A] dark:border-white/5',
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
        <section className="xl:col-span-12">
          <Milestones />
        </section>

        <section className="xl:col-span-12">
          {/* Phase Context Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            <Card
              variant="rounded"
              padding="md"
              radius="md"
              className="lg:col-span-2 flex flex-col md:flex-row items-center gap-12 group overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent"
            >
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#E8FF4D]' : 'bg-violet-600'}`}
                  ></span>
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    Phase Status: Growth Acceleration
                  </h3>
                </div>
                <p className="text-lg font-medium text-slate-500 italic leading-relaxed">
                  "Leveraging{' '}
                  <span className="text-current font-black">
                    institutional lending
                  </span>{' '}
                  to bridge the gap from 5 units to double-digit scale. Asset
                  yields are currently 12% above sub-market baseline."
                </p>
              </div>
              <button
                onClick={onNavigateExplore}
                className={`shrink-0 px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}
              >
                Explore Acquisitions →
              </button>
            </Card>

            <Card
              variant="rounded"
              padding="md"
              radius="md"
              className="flex flex-col justify-between border-dashed"
            >
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                  Stability Multiplier
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Risk-Adjusted Portfolio Score
                </p>
              </div>
              <div className="flex items-end justify-between mt-10">
                <p className="text-5xl font-black tabular-nums tracking-tighter">
                  0.82
                </p>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-6 rounded-full ${i < 6 ? (isDark ? 'bg-[#E8FF4D]' : 'bg-violet-600') : isDark ? 'bg-white/10' : 'bg-slate-200'}`}
                    ></div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="xl:col-span-12">
          <FreedomForcast />
        </section>

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

        <section className="xl:col-span-6">
          <CapitalLocker
            deployableCash={deployableCash}
            nextBuyProgress={nextBuyProgress}
            cardClass={cardClass}
          />
        </section>

        <section className="xl:col-span-6">
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
