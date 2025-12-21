import { Link, useRouterState } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'
import { ThemeToggle } from '../theme-toggle/ThemeToggle'
import { SignOutButton } from '@/components/sign-out-button/SignOutButton'
import { cn } from '@/utils/helpers'

export const SideNav = () => {
  const { user } = useUser()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const navItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      id: 'explore',
      path: '/explore',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m16.2 7.8-2 5.6-5.6 2 2-5.6 5.6-2z" />
        </svg>
      ),
    },
    {
      id: 'properties',
      path: '/properties',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 21h18" />
          <path d="M3 7v1a3 3 0 0 0 6 0V7" />
          <path d="M9 7v1a3 3 0 0 0 6 0V7" />
          <path d="M15 7v1a3 3 0 0 0 6 0V7" />
          <path d="M19 21V11" />
          <path d="m5 11 7-7 7 7" />
          <path d="M5 21v-10" />
        </svg>
      ),
    },
  ]

  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  const userInitial =
    user?.firstName?.charAt(0) ||
    user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() ||
    'A'

  return (
    <aside className=" p-2 flex flex-col items-center py-8 border-r transition-all duration-500 z-50 dark:bg-black dark:border-white/5 bg-white border-slate-200 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-12 shadow-lg transition-colors dark:bg-white bg-slate-900">
        <span className="font-black italic text-xl dark:text-black text-white">
          {userInitial}
        </span>
      </div>

      <nav className="flex flex-col gap-6 flex-grow">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'p-3 rounded-2xl transition-all group relative',
                active
                  ? 'dark:bg-[#E8FF4D] dark:text-black dark:shadow-lg dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'dark:text-white/40 dark:hover:text-white text-slate-400 hover:text-slate-900',
              )}
            >
              {item.icon}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-6">
        <ThemeToggle />
        <SignOutButton />
      </div>
    </aside>
  )
}
