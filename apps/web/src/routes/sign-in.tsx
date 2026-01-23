import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSignIn, useUser } from '@clerk/tanstack-react-start'
import { useEffect, useState } from 'react'
import { Button } from '@axori/ui'
import { useOnboardingStatus } from '@/utils/onboarding'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded: isUserLoaded } = useUser()
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [justSignedIn, setJustSignedIn] = useState(false)

  // Wait for Clerk to load before checking onboarding status
  const { completed: onboardingCompleted, isLoading: onboardingLoading } =
    useOnboardingStatus()

  // Combined loaded state - wait for both Clerk and onboarding check
  const isLoaded = isUserLoaded && isSignInLoaded

  // Redirect if already signed in - check onboarding status first
  useEffect(() => {
    // Only redirect if Clerk is loaded to prevent SSR/client mismatch
    if (isLoaded && isSignedIn && !onboardingLoading && !justSignedIn) {
      // If onboarding not completed, redirect to onboarding
      if (!onboardingCompleted) {
        navigate({ to: '/onboarding' as any })
      } else {
        navigate({ to: '/dashboard' as any })
      }
    }
  }, [
    isLoaded,
    isSignedIn,
    onboardingCompleted,
    onboardingLoading,
    justSignedIn,
    navigate,
  ])

  // Check onboarding after successful sign-in
  useEffect(() => {
    if (justSignedIn && isLoaded && !onboardingLoading) {
      setJustSignedIn(false)
      if (!onboardingCompleted) {
        navigate({ to: '/onboarding' as any })
      } else {
        navigate({ to: '/dashboard' as any })
      }
    }
  }, [justSignedIn, isLoaded, onboardingCompleted, onboardingLoading, navigate])

  const handleBack = () => {
    navigate({ to: '/' })
  }

  const handleOAuth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!isSignInLoaded) return

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/onboarding', // Will check onboarding status on redirect
        redirectUrlComplete: '/onboarding',
      })
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'An error occurred during sign in')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!isSignInLoaded) {
      return
    }

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        setJustSignedIn(true)
      } else {
        // Handle two-factor authentication or other incomplete statuses
        if (result.status === 'needs_second_factor') {
          setPendingVerification(true)
        } else {
          setError('Sign in incomplete. Please try again.')
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!isSignInLoaded) {
      return
    }

    try {
      const completeSignIn = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code,
      })

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId })
        setJustSignedIn(true)
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render until Clerk is loaded to prevent hydration mismatch
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#0F1115] bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-xl dark:bg-white dark:text-black bg-slate-900 text-white mx-auto mb-4">
            A
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-500 dark:bg-[#0F1115] dark:text-white bg-slate-50 text-slate-900">
      {/* Left Pane - Value Reinforcement */}
      <div className="hidden lg:flex lg:w-1/2 p-20 flex-col justify-between relative overflow-hidden transition-all duration-700 dark:bg-white dark:text-black bg-slate-900 text-white">
        {/* Background Visual Noise */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="signin-grid"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#signin-grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 group mb-20 outline-none"
          >
            <div className="w-8 h-8 rounded flex items-center justify-center transition-all group-hover:rotate-12 dark:bg-black bg-white">
              <span className="font-black italic dark:text-white text-black">
                A
              </span>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">
              AXORI
            </span>
          </button>

          <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em] font-extrabold uppercase leading-none mb-8">
            WELCOME
            <br />
            BACK,
            <br />
            <span className="opacity-30">INVESTOR</span>.
          </h1>
          <p className="max-w-md text-xl font-medium opacity-60 italic leading-relaxed">
            Access your portfolio intelligence and continue building your
            multi-generational wealth.
          </p>
        </div>

        <div className="relative z-10 flex gap-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
              Active Investors
            </p>
            <p className="text-3xl font-black tabular-nums tracking-tighter">
              12.4k+
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
              Alpha Generated
            </p>
            <p className="text-3xl font-black tabular-nums tracking-tighter dark:text-[#059669] text-[#E8FF4D]">
              +18.4%
            </p>
          </div>
        </div>
      </div>

      {/* Right Pane - Stylized Clerk Form */}
      <div className="flex-grow flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-xl dark:bg-white dark:text-black bg-slate-900 text-white">
            A
          </div>
        </div>

        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="p-10 md:p-14 rounded-[3.5rem] border transition-all duration-500 shadow-2xl dark:bg-[#1A1A1A] dark:border-white/5 bg-white border-slate-200">
            <header className="mb-10 text-center">
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 transition-colors text-slate-900 dark:text-white">
                {pendingVerification ? 'Verify Code' : 'Sign In'}
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {pendingVerification
                  ? 'Enter your verification code'
                  : 'Access your investment DNA.'}
              </p>
            </header>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {pendingVerification ? (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-4 text-slate-700 dark:text-slate-300">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter verification code"
                    required
                    className="w-full px-6 py-4 rounded-2xl text-sm font-bold border transition-all outline-none dark:bg-white/5 dark:border-white/5 dark:focus:bg-white/10 dark:focus:border-[#E8FF4D]/30 dark:text-white bg-slate-100 border-slate-200 focus:bg-white focus:border-violet-300 text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !isLoaded}
                  className="w-full mt-6 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#E8FF4D] dark:text-black dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-violet-200"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            ) : (
              <>
                {/* Social Providers */}
                <div className="space-y-3 mb-10">
                  <button
                    type="button"
                    onClick={() => handleOAuth('oauth_google')}
                    disabled={isLoading || !isLoaded}
                    className="w-full py-4 px-6 rounded-2xl border flex items-center justify-center gap-4 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:text-white bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md text-slate-900"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="text-xs font-black uppercase tracking-widest">
                      Sign in with Google
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth('oauth_apple')}
                    disabled={isLoading || !isLoaded}
                    className="w-full py-4 px-6 rounded-2xl border flex items-center justify-center gap-4 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black dark:border-white/10 dark:hover:bg-white/5 dark:text-white bg-black text-white border-black"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C4.52 17.14 3.19 12.06 6.1 9.4c1.1-.98 2.45-1.16 3.42-1.16 1.06.03 1.95.42 2.58.42.59 0 1.76-.5 3.03-.37 1.34.14 2.34.63 2.89 1.45-2.73 1.65-2.29 5.37.45 6.47-.5 1.48-1.16 2.94-2.42 4.07zm-4.71-12.72c-.08-2.67 2.21-4.88 4.88-4.96.26 2.84-2.22 5.02-4.88 4.96z" />
                    </svg>
                    <span className="text-xs font-black uppercase tracking-widest">
                      Sign in with Apple
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-10 opacity-20">
                  <div className="flex-grow h-px bg-current"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    OR
                  </span>
                  <div className="flex-grow h-px bg-current"></div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="sign-in-email"
                      className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-4 text-slate-700 dark:text-slate-300"
                    >
                      Email Address
                    </label>
                    <input
                      id="sign-in-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@firm.com"
                      autoComplete="email"
                      required
                      className="w-full px-6 py-4 rounded-2xl text-sm font-bold border transition-all outline-none dark:bg-white/5 dark:border-white/5 dark:focus:bg-white/10 dark:focus:border-[#E8FF4D]/30 dark:text-white bg-slate-100 border-slate-200 focus:bg-white focus:border-violet-300 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="sign-in-password"
                      className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-4 text-slate-700 dark:text-slate-300"
                    >
                      Password
                    </label>
                    <input
                      id="sign-in-password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full px-6 py-4 rounded-2xl text-sm font-bold border transition-all outline-none dark:bg-white/5 dark:border-white/5 dark:focus:bg-white/10 dark:focus:border-[#E8FF4D]/30 dark:text-white bg-slate-100 border-slate-200 focus:bg-white focus:border-violet-300 text-slate-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-6 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#E8FF4D] dark:text-black dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-violet-200"
                    disabled={isLoading || !isLoaded}
                  >
                    {isLoading ? 'Signing In...' : 'Access Portfolio'}
                  </Button>
                </form>
              </>
            )}
          </div>

          <p className="text-center mt-12 text-[10px] uppercase font-black uppercase tracking-widest opacity-40">
            New investor?{' '}
            <Link
              to="/sign-up"
              className="hover:opacity-100 transition-opacity dark:text-white text-slate-900"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
