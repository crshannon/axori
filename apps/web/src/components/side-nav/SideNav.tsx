import { Link, useRouterState } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'
import { ThemeToggle } from '../theme-toggle/ThemeToggle'
import { getEnabledNavItems } from '@/lib/navigation'
import { SignOutButton } from '@/components/sign-out-button/SignOutButton'
import { cn } from '@/utils/helpers'

export const SideNav = () => {
  const { user } = useUser()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  // Get enabled navigation items (can be extended with PostHog feature flags)
  const navItems = getEnabledNavItems()

  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  const userInitial =
    user?.firstName?.charAt(0) ||
    user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() ||
    'A'

  return (
    <aside className="fixed left-0 top-0 h-screen max-h-screen p-2 flex flex-col items-center py-8 border-r transition-all duration-500 z-50 dark:bg-black dark:border-white/5 bg-white border-slate-200 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-12 shadow-lg transition-colors dark:bg-white bg-slate-900 flex-shrink-0">
        <span className="font-black italic text-xl dark:text-black text-white">
          {userInitial}
        </span>
      </div>

      <nav className="flex flex-col gap-6 flex-grow min-h-0 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path)
          const IconComponent = item.icon
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'p-3 rounded-2xl transition-all group relative flex-shrink-0',
                active
                  ? 'dark:bg-[#E8FF4D] dark:text-black dark:shadow-lg dark:shadow-[#E8FF4D]/20 bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'dark:text-white/40 dark:hover:text-white text-slate-400 hover:text-slate-900',
              )}
            >
              <IconComponent size={20} />
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-6 flex-shrink-0">
        <ThemeToggle />
        <SignOutButton />
      </div>
    </aside>
  )
}
