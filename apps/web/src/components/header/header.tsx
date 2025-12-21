import { Link } from '@tanstack/react-router'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { ArrowUpRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle/ThemeToggle'
import { SignOutButton } from '@/components/sign-out-button/SignOutButton'

export const Header = () => {
  const { isSignedIn = false } = useUser()
  return (
    <nav className="w-full flex justify-center py-6 px-4">
      <div className="w-full max-w-[1400px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 outline-none group">
          <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center transition-all group-hover:rotate-12">
            <span className="text-white dark:text-black font-black italic text-lg leading-none">
              A
            </span>
          </div>
          <span className="text-xl font-extrabold tracking-tight dark:text-white text-slate-900">
            AXORI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-12">
          <Link
            to="/about"
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            About
          </Link>
          <Link
            to="/analysis"
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Analysis
          </Link>
          <Link
            to="/pricing"
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/contact"
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <SignedOut>
            <Link
              to="/sign-in"
              className="flex items-center gap-2 bg-slate-900 dark:bg-[#1A1A1A] hover:bg-black dark:hover:bg-[#252525] text-white dark:text-slate-300 text-xs font-bold py-3 px-6 rounded-full transition-all border border-white/5 shadow-sm dark:shadow-black/20"
            >
              <span className="hidden sm:inline">LOG IN</span>
            </Link>
          </SignedOut>
          <Link
            to={isSignedIn ? '/dashboard' : '/sign-up'}
            className="flex items-center gap-2 bg-slate-900 dark:bg-[#1A1A1A] hover:bg-black dark:hover:bg-[#252525] text-white dark:text-slate-300 text-xs font-bold py-3 px-6 rounded-full transition-all border border-white/5 shadow-sm dark:shadow-black/20"
          >
            <span className="hidden sm:inline">
              {isSignedIn ? 'DASHBOARD' : 'JOIN THE PLATFORM'}
            </span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500 bg-violet-400 dark:bg-[#E8FF4D]">
              <ArrowUpRight className="w-[14px] h-[14px] stroke-[3] stroke-black" />
            </div>
          </Link>
          <SignedIn>
            <SignOutButton />
          </SignedIn>
        </div>
      </div>
    </nav>
  )
}
