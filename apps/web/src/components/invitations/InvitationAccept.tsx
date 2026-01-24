import { Link, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'
import { useState } from 'react'
import { Button } from '@axori/ui'
import {
  PORTFOLIO_ROLE_DESCRIPTIONS,
  PORTFOLIO_ROLE_LABELS

} from '@axori/permissions'
import type {PortfolioRole} from '@axori/permissions';
import type { InvitationValidationResult } from '@/hooks/api/useInvitations'
import {
  useAcceptInvitation,
  useValidateInvitation,
} from '@/hooks/api/useInvitations'

interface InvitationAcceptProps {
  token: string | null
}

export function InvitationAccept({ token }: InvitationAcceptProps) {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded: isUserLoaded, user } = useUser()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validate the invitation token
  const {
    data: validationResult,
    isLoading: isValidating,
    error: validationError,
  } = useValidateInvitation(token)

  // Accept invitation mutation
  const acceptInvitation = useAcceptInvitation()

  // Format the inviter's name
  const getInviterName = (inviter: InvitationValidationResult['inviter']) => {
    if (!inviter) return 'Someone'
    if (inviter.firstName && inviter.lastName) {
      return `${inviter.firstName} ${inviter.lastName}`
    }
    return inviter.email
  }

  // Handle accepting the invitation
  const handleAccept = async () => {
    if (!token) return

    setError(null)

    try {
      await acceptInvitation.mutateAsync(token)
      setSuccess(true)
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate({ to: '/dashboard' })
      }, 2000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to accept invitation'
      setError(message)
    }
  }

  // Handle declining the invitation
  const handleDecline = () => {
    // Simply navigate away - the token remains pending
    navigate({ to: '/' })
  }

  // Show loading state while checking auth or validating token
  if (!isUserLoaded || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#0F1115] bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-xl dark:bg-white dark:text-black bg-slate-900 text-white mx-auto mb-4">
            A
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Loading invitation...
          </p>
        </div>
      </div>
    )
  }

  // Handle validation error
  if (validationError) {
    return (
      <InvitationErrorState
        title="Error Validating Invitation"
        message="An error occurred while validating your invitation. Please try again later."
      />
    )
  }

  // Handle invalid or missing token
  if (!token) {
    return (
      <InvitationErrorState
        title="Invalid Link"
        message="This invitation link is missing or invalid. Please check the link and try again."
      />
    )
  }

  // Handle invalid invitation
  if (validationResult && !validationResult.valid) {
    return (
      <InvitationErrorState
        title="Invalid Invitation"
        message={validationResult.error || 'This invitation is no longer valid.'}
      />
    )
  }

  // Show success state
  if (success) {
    return (
      <InvitationSuccessState
        portfolioName={validationResult?.portfolio?.name || 'the portfolio'}
      />
    )
  }

  // Get invitation details
  const invitation = validationResult?.invitation
  const portfolio = validationResult?.portfolio
  const inviter = validationResult?.inviter

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-500 dark:bg-[#0F1115] dark:text-white bg-slate-50 text-slate-900">
      {/* Left Pane - Value Reinforcement */}
      <div className="hidden lg:flex lg:w-1/2 p-20 flex-col justify-between relative overflow-hidden transition-all duration-700 dark:bg-white dark:text-black bg-slate-900 text-white">
        {/* Background Visual Noise */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="invitation-grid"
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
            <rect width="100%" height="100%" fill="url(#invitation-grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 group mb-20 outline-none">
            <div className="w-8 h-8 rounded flex items-center justify-center transition-all group-hover:rotate-12 dark:bg-black bg-white">
              <span className="font-black italic dark:text-white text-black">A</span>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">AXORI</span>
          </Link>

          <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em] font-extrabold uppercase leading-none mb-8">
            YOU'VE
            <br />
            BEEN
            <br />
            <span className="opacity-30">INVITED</span>.
          </h1>
          <p className="max-w-md text-xl font-medium opacity-60 italic leading-relaxed">
            Join forces with fellow investors and gain access to shared portfolio intelligence.
          </p>
        </div>

        <div className="relative z-10 flex gap-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
              Portfolio
            </p>
            <p className="text-3xl font-black tabular-nums tracking-tighter">
              {portfolio?.name || 'Loading...'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
              Your Role
            </p>
            <p className="text-3xl font-black tabular-nums tracking-tighter dark:text-[#059669] text-[#E8FF4D]">
              {invitation?.role
                ? PORTFOLIO_ROLE_LABELS[invitation.role]
                : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Pane - Invitation Details */}
      <div className="flex-grow flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link to="/">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-xl dark:bg-white dark:text-black bg-slate-900 text-white">
              A
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="p-10 md:p-14 rounded-[3.5rem] border transition-all duration-500 shadow-2xl dark:bg-[#1A1A1A] dark:border-white/5 bg-white border-slate-200">
            <header className="mb-10 text-center">
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 transition-colors text-slate-900 dark:text-white">
                Portfolio Invitation
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {getInviterName(inviter)} invited you
              </p>
            </header>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Invitation Details */}
            <div className="space-y-6 mb-10">
              {/* Portfolio Info */}
              <div className="p-4 rounded-2xl dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">
                  Portfolio
                </p>
                <p className="text-lg font-bold dark:text-white text-slate-900">
                  {portfolio?.name || 'Unknown Portfolio'}
                </p>
                {portfolio?.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {portfolio.description}
                  </p>
                )}
              </div>

              {/* Role Info */}
              <div className="p-4 rounded-2xl dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">
                  Your Role
                </p>
                <p className="text-lg font-bold dark:text-white text-slate-900">
                  {invitation?.role
                    ? PORTFOLIO_ROLE_LABELS[invitation.role]
                    : 'Unknown'}
                </p>
                {invitation?.role &&
                  PORTFOLIO_ROLE_DESCRIPTIONS[invitation.role] && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {PORTFOLIO_ROLE_DESCRIPTIONS[invitation.role]}
                  </p>
                )}
              </div>

              {/* Inviter Info */}
              {inviter && (
                <div className="p-4 rounded-2xl dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">
                    Invited By
                  </p>
                  <p className="text-lg font-bold dark:text-white text-slate-900">
                    {getInviterName(inviter)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{inviter.email}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isSignedIn ? (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#E8FF4D] dark:text-black dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-violet-200"
                  onClick={handleAccept}
                  disabled={acceptInvitation.isPending}
                >
                  {acceptInvitation.isPending ? 'Joining...' : 'Accept & Join Portfolio'}
                </Button>
                <button
                  type="button"
                  onClick={handleDecline}
                  className="w-full py-4 px-6 rounded-2xl border flex items-center justify-center gap-4 transition-all hover:scale-[1.02] dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:text-white bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md text-slate-900 text-xs font-black uppercase tracking-widest"
                >
                  Decline Invitation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Sign in or create an account to accept this invitation
                </p>
                <Link
                  to="/sign-in"
                  search={{ redirect: `/invitation/accept?token=${token}` }}
                >
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 dark:bg-[#E8FF4D] dark:text-black dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-violet-200"
                  >
                    Sign In to Accept
                  </Button>
                </Link>
                <Link
                  to="/sign-up"
                  search={{ redirect: `/invitation/accept?token=${token}` }}
                >
                  <button
                    type="button"
                    className="w-full py-4 px-6 rounded-2xl border flex items-center justify-center gap-4 transition-all hover:scale-[1.02] dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10 dark:text-white bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md text-slate-900 text-xs font-black uppercase tracking-widest"
                  >
                    Create Account
                  </button>
                </Link>
              </div>
            )}
          </div>

          <p className="text-center mt-12 text-[10px] uppercase font-black uppercase tracking-widest opacity-40">
            Invitation expires{' '}
            {invitation?.expiresAt
              ? new Date(invitation.expiresAt).toLocaleDateString()
              : 'soon'}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Error state component
 */
function InvitationErrorState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#0F1115] bg-slate-50 p-8">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black italic text-2xl dark:bg-red-500/20 dark:text-red-400 bg-red-100 text-red-600 mx-auto mb-6">
            !
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-3 dark:text-white text-slate-900">
            {title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{message}</p>
        </div>
        <Link to="/">
          <Button variant="outline" className="rounded-2xl">
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

/**
 * Success state component
 */
function InvitationSuccessState({ portfolioName }: { portfolioName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#0F1115] bg-slate-50 p-8">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black italic text-2xl dark:bg-[#059669]/20 dark:text-[#059669] bg-emerald-100 text-emerald-600 mx-auto mb-6">
            ✓
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-3 dark:text-white text-slate-900">
            Welcome to the Team!
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            You've successfully joined <strong>{portfolioName}</strong>. Redirecting you to
            your dashboard...
          </p>
        </div>
        <div className="animate-pulse">
          <div className="h-2 w-32 mx-auto rounded-full dark:bg-white/20 bg-slate-200"></div>
        </div>
      </div>
    </div>
  )
}
