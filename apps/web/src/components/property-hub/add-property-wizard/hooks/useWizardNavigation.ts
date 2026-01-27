import { useCallback, useEffect, useState } from 'react'
import type { PropertyFormData } from '../types'

interface UseWizardNavigationProps {
  initialStep?: number
  totalSteps: number
  onStepChange?: (step: number, propertyId?: string) => void
  isAddressSelected: boolean
  userId: string | null
  portfolioId: string | null
  saveProperty: (
    formData: PropertyFormData,
    isAddressSelected: boolean,
  ) => Promise<string | null>
  fetchRentcastData: (propertyId: string) => Promise<any>
  completePropertyWizard: (
    formData: PropertyFormData,
    isAddressSelected: boolean,
  ) => Promise<boolean>
  formData: PropertyFormData
}

export const useWizardNavigation = ({
  initialStep = 1,
  totalSteps,
  onStepChange,
  isAddressSelected,
  userId,
  portfolioId,
  saveProperty,
  fetchRentcastData,
  completePropertyWizard,
  formData,
}: UseWizardNavigationProps) => {
  const [step, setStep] = useState(initialStep)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Sync step with URL changes (browser back/forward)
  useEffect(() => {
    if (initialStep !== step) {
      setStep(initialStep)
    }
  }, [initialStep])

  const nextStep = useCallback(async () => {
    if (step < totalSteps) {
      // After step 1, fetch and populate data before moving forward
      if (step === 1 && isAddressSelected && userId && portfolioId) {
        const propertyId = await saveProperty(formData, isAddressSelected)

        if (propertyId) {
          setIsFetchingData(true)

          // Start timer to ensure minimum 3-second display for AsyncLoader
          const startTime = Date.now()
          const minDisplayTime = 3000 // 3 seconds

          try {
            // Fetch Rentcast data
            await fetchRentcastData(propertyId)
          } catch (error) {
            console.error('Error fetching Rentcast data:', error)
            // Don't block user from continuing if Rentcast fails
          } finally {
            // Ensure loader shows for at least 3 seconds
            const elapsedTime = Date.now() - startTime
            const remainingTime = minDisplayTime - elapsedTime

            if (remainingTime > 0) {
              await new Promise((resolve) => setTimeout(resolve, remainingTime))
            }

            setIsFetchingData(false)

            // Wait a bit longer to ensure state updates complete before transitioning
            await new Promise((resolve) => setTimeout(resolve, 200))

            // Move to next step - form data will be populated when Step 2 loads
            const newStep = step + 1
            setStep(newStep)
            if (onStepChange) {
              onStepChange(newStep, propertyId) // Pass propertyId to update URL
            }
          }
        }
      } else if (isAddressSelected && userId && portfolioId) {
        // For other steps, just save the property
        const propertyId = await saveProperty(formData, isAddressSelected)

        // Move to next step normally
        const newStep = step + 1
        console.log('Moving from step', step, 'to step', newStep)
        setStep(newStep)
        if (onStepChange) {
          onStepChange(newStep, propertyId || undefined)
        }
      }
    } else {
      // Final step - mark property as complete
      const success = await completePropertyWizard(formData, isAddressSelected)
      if (success) {
        setIsSuccess(true)
      }
    }
  }, [
    step,
    totalSteps,
    isAddressSelected,
    userId,
    portfolioId,
    saveProperty,
    fetchRentcastData,
    completePropertyWizard,
    onStepChange,
    formData,
  ])

  const prevStep = useCallback(() => {
    const newStep = Math.max(1, step - 1)
    setStep(newStep)
    if (onStepChange) {
      onStepChange(newStep)
    }
  }, [step, onStepChange])

  return {
    step,
    setStep,
    isFetchingData,
    isSuccess,
    setIsSuccess,
    nextStep,
    prevStep,
  }
}
