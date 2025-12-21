import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'
import { useEffect } from 'react'
import { SideNav } from '@/components/side-nav/SideNav'

export const Route = createFileRoute('/_authed' as any)({
  component: AuthedLayout,
})

function AuthedLayout() {
  const { isSignedIn, isLoaded } = useUser()
  const navigate = useNavigate()

  // Client-side auth check: provides security layer and handles redirect
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({
        to: '/sign-in',
        search: {
          redirect: window.location.pathname || '/dashboard',
        },
      })
    }
  }, [isSignedIn, isLoaded, navigate])

  // Show nothing while checking auth or if not signed in
  if (!isLoaded || !isSignedIn) {
    return null
  }

  return (
    <div className="flex flex-grow min-h-screen">
      <SideNav />
      <main className="flex-1 ml-20 md:ml-24">
        <Outlet />
      </main>
    </div>
  )
}
