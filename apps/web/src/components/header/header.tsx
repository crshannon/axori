import { Link } from '@tanstack/react-router'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle/ThemeToggle'
import { SignOutButton } from '@/components/sign-out-button/SignOutButton'
import { useShowAuth, useComingSoonMode } from '@/hooks/useFeatureFlags'

export const Header = () => {
  const { isSignedIn = false } = useUser()
  const showAuth = useShowAuth()
  const comingSoonMode = useComingSoonMode()

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-[#0a0a0c]/80 border-b border-slate-200/50 dark:border-white/5">
      <div className="w-full flex justify-center py-4 px-4">
        <div className="w-full max-w-[1400px] flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 outline-none group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 rounded-xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-105 shadow-sm">
              <span className="text-white dark:text-black font-black italic text-lg leading-none">
                A
              </span>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase dark:text-white text-slate-900">
              AXORI
            </span>
          </Link>

          {/* Navigation links - hide some in coming soon mode */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/about"
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5 transition-all"
            >
              About
            </Link>
            {!comingSoonMode && (
              <>
                <Link
                  to="/analysis"
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5 transition-all"
                >
                  Analysis
                </Link>
                <Link
                  to="/pricing"
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5 transition-all"
                >
                  Pricing
                </Link>
              </>
            )}
            <Link
              to="/contact"
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5 transition-all"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Coming Soon Mode: Show "Join Waitlist" CTA */}
            {comingSoonMode && !isSignedIn ? (
              <a
                href="#waitlist"
                className="group relative flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 dark:from-[#E8FF4D] dark:to-lime-400 dark:hover:from-[#d4eb45] dark:hover:to-lime-500 text-white dark:text-black text-xs font-black py-3 px-5 rounded-full transition-all shadow-lg shadow-violet-500/20 dark:shadow-[#E8FF4D]/20 hover:shadow-xl hover:scale-[1.02]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline uppercase tracking-wider">
                  Join Waitlist
                </span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white/20 dark:bg-black/20 group-hover:bg-white/30 dark:group-hover:bg-black/30 transition-colors">
                  <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                </div>
              </a>
            ) : showAuth ? (
              /* Normal Mode: Show auth buttons */
              <>
                <SignedOut>
                  <Link
                    to="/sign-in"
                    className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5 transition-all"
                  >
                    Log In
                  </Link>
                </SignedOut>
                <Link
                  to={isSignedIn ? '/dashboard' : '/sign-up'}
                  className="group flex items-center gap-2 bg-slate-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white text-xs font-bold py-3 px-5 rounded-full transition-all border border-slate-800 dark:border-white/10 shadow-sm"
                >
                  <span className="hidden sm:inline uppercase tracking-wider">
                    {isSignedIn ? 'Dashboard' : 'Get Started'}
                  </span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-violet-500 dark:bg-[#E8FF4D] group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="w-3 h-3 stroke-[3] stroke-white dark:stroke-black" />
                  </div>
                </Link>
                <SignedIn>
                  <SignOutButton />
                </SignedIn>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}
