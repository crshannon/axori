import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'
import { useEffect } from 'react'
import { useOnboardingStatus } from '@/utils/onboarding'

export const Route = createFileRoute('/_authed/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useUser()
  const { completed: onboardingCompleted, isLoading: onboardingLoading } =
    useOnboardingStatus()

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

  // Don't render dashboard if onboarding not completed (will redirect)
  if (!onboardingCompleted) {
    return null
  }

  return <div>Hello "/_authed/dashboard"!</div>
}
