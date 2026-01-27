import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useOnboardingForm } from './hooks/useOnboardingForm'
import { useOnboarding, useUpdateOnboarding } from './hooks/useOnboardingData'
import { OnboardingSidebar } from './OnboardingSidebar'
import { Step1NameCollection } from './steps/Step1NameCollection'
import { Step2JourneyPhase } from './steps/Step2JourneyPhase'
import { Step3Persona } from './steps/Step3Persona'
import { Step4Ownership } from './steps/Step4Ownership'
import { Step5FreedomNumber } from './steps/Step5FreedomNumber'
import { Step6Strategy } from './steps/Step6Strategy'
import { Step7MarketSelection } from './steps/Step7MarketSelection'
import type { OnboardingFormData } from './types'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { data: onboardingData, isLoading } = useOnboarding()
  const updateOnboarding = useUpdateOnboarding()

  // Determine theme from document
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  // Initialize step from saved data or default to 1 (1-indexed for user-friendly display)
  const [step, setStep] = useState(1)
  const totalSteps = 7

  // Track if names have been submitted (to prevent premature step switching)
  const [namesSubmitted, setNamesSubmitted] = useState(false)

  // Initialize form with saved data
  const form = useOnboardingForm({
    firstName: onboardingData?.firstName || undefined,
    lastName: onboardingData?.lastName || undefined,
    phase: onboardingData?.data?.phase,
    persona: onboardingData?.data?.persona,
    ownership: onboardingData?.data?.ownership || 'Personal',
    llcName: onboardingData?.data?.llcName || undefined,
    freedomNumber: onboardingData?.data?.freedomNumber || 5000,
    strategy: onboardingData?.data?.strategy,
    markets: onboardingData?.data?.markets || [],
  })

  // Redirect to dashboard if onboarding is already completed
  useEffect(() => {
    if (!isLoading && onboardingData && onboardingData.completed) {
      navigate({ to: '/dashboard' as any })
    }
  }, [isLoading, onboardingData, navigate])

  // Load saved step when onboarding data is fetched
  useEffect(() => {
    if (onboardingData && !onboardingData.completed) {
      if (onboardingData.step) {
        const savedStep = parseInt(onboardingData.step)
        // Ensure step is at least 1 (1-indexed, user-friendly)
        const validStep = Math.max(1, Math.min(savedStep, totalSteps))
        setStep(validStep)
        // If we have names saved, they've been submitted
        // If step is 1 and we have names, show journey phase (namesSubmitted = true)
        // If step > 1, names have definitely been submitted
        if (onboardingData.firstName && onboardingData.lastName) {
          if (validStep === 1) {
            // On step 1 with names = show journey phase
            setNamesSubmitted(true)
          } else if (validStep > 1) {
            // Past step 1 = names definitely submitted
            setNamesSubmitted(true)
          }
        }
      }
    }
  }, [onboardingData, totalSteps])

  const isDark = theme === 'dark'

  const saveProgress = async (
    newStep: number | null,
    additionalData?: Partial<OnboardingFormData>,
  ) => {
    try {
      const formValues = form.state.values
      const updatePayload: any = {
        step: newStep ? newStep.toString() : null,
        data: {
          ...(onboardingData?.data || {}),
          ...additionalData,
        },
        ...(formValues.firstName && { firstName: formValues.firstName }),
        ...(formValues.lastName && { lastName: formValues.lastName }),
      }
      // Include markets separately for step 7
      if (formValues.markets && formValues.markets.length > 0) {
        updatePayload.markets = formValues.markets
      }
      await updateOnboarding.mutateAsync(updatePayload)
    } catch (error) {
      console.error('Failed to save onboarding progress:', error)
    }
  }

  const nextStep = async (newStepData?: Partial<OnboardingFormData>) => {
    // Ensure step stays between 1 and totalSteps (1-indexed)
    const next = Math.min(Math.max(step + 1, 1), totalSteps)
    setStep(next)
    await saveProgress(next, newStepData)
  }

  const prevStep = () => {
    // Ensure step never goes below 1 (1-indexed, user-friendly)
    const prev = Math.max(step - 1, 1)
    setStep(prev)
    saveProgress(prev)
  }

  const handleComplete = async () => {
    const formValues = form.state.values
    await saveProgress(null, {
      strategy: formValues.strategy,
      markets: formValues.markets,
    })
    // Redirect to dashboard after completion
    navigate({ to: '/dashboard' as any })
  }

  const handleCancel = () => {
    navigate({ to: '/' })
  }

  if (isLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-[#0F1115] text-white' : 'bg-slate-50 text-slate-900'
        }`}
      >
        <div className="text-xl font-black uppercase">Loading...</div>
      </div>
    )
  }

  // Don't render onboarding if already completed (will redirect)
  if (onboardingData?.completed) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? 'bg-[#0F1115] text-white' : 'bg-slate-50 text-slate-900'
        }`}
      >
        <div className="text-xl font-black uppercase">
          Redirecting to dashboard...
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        // Step 1 has two parts: name collection and journey phase
        // Show name collection first, then journey phase after names are submitted
        if (!namesSubmitted) {
          return (
            <Step1NameCollection
              form={form}
              onNext={async () => {
                // Save names first
                await saveProgress(1, {})
                setNamesSubmitted(true)
                // Don't call nextStep() here - stay on step 1 to show journey phase
              }}
              isDark={isDark}
            />
          )
        }
        // After names are submitted, show journey phase (still step 1)
        return (
          <Step2JourneyPhase
            form={form}
            onNext={() => nextStep({ phase: form.state.values.phase })}
            onBack={() => setNamesSubmitted(false)}
            isDark={isDark}
          />
        )
      case 2:
        return (
          <Step3Persona
            form={form}
            onNext={() => nextStep({ persona: form.state.values.persona })}
            isDark={isDark}
          />
        )
      case 3:
        return (
          <Step4Ownership
            form={form}
            onNext={() =>
              nextStep({
                ownership: form.state.values.ownership,
                llcName: form.state.values.llcName,
              })
            }
            isDark={isDark}
          />
        )
      case 4:
        return (
          <Step5FreedomNumber
            form={form}
            onNext={() =>
              nextStep({ freedomNumber: form.state.values.freedomNumber })
            }
            isDark={isDark}
          />
        )
      case 5:
        return (
          <Step6Strategy
            form={form}
            onComplete={(strategy) => nextStep({ strategy })}
            isDark={isDark}
          />
        )
      case 6:
        return (
          <Step7MarketSelection
            form={form}
            onComplete={handleComplete}
            isDark={isDark}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row transition-colors duration-500 ${
        isDark ? 'bg-[#0F1115] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <OnboardingSidebar
        step={step}
        totalSteps={totalSteps}
        formData={form.state.values}
        isDark={isDark}
        onCancel={handleCancel}
      />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col p-8 md:p-24 lg:p-32 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">
          {renderStep()}

          {/* General Navigation (Back button) */}
          {step > 1 && step <= 7 && (
            <button
              onClick={prevStep}
              className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity"
            >
              ← Go back to previous step
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
