/**
 * Account Settings Layout
 *
 * Main layout for user account settings with tabbed navigation.
 * Handles profile, security, billing, and notifications.
 */

import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router"
import { CreditCard, Bell, Shield, User } from "lucide-react"
import { cn } from "@axori/ui"

export const Route = createFileRoute("/_authed/account")({
  component: AccountLayout,
})

interface AccountTab {
  id: string
  label: string
  path: string
  icon: typeof User
}

const ACCOUNT_TABS: AccountTab[] = [
  {
    id: "profile",
    label: "Profile",
    path: "/account",
    icon: User,
  },
  {
    id: "security",
    label: "Security",
    path: "/account/security",
    icon: Shield,
  },
  {
    id: "billing",
    label: "Billing",
    path: "/account/billing",
    icon: CreditCard,
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/account/notifications",
    icon: Bell,
  },
]

function AccountLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActiveTab = (path: string) => {
    if (path === "/account") {
      return location.pathname === "/account"
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 bg-slate-50 text-slate-900 dark:bg-[#0F1115] dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0F1115]/80 backdrop-blur-xl">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account, security, and billing preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <nav className="px-8 flex gap-1">
          {ACCOUNT_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = isActiveTab(tab.path)

            return (
              <button
                key={tab.id}
                onClick={() => navigate({ to: tab.path })}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all",
                  "hover:bg-slate-100 dark:hover:bg-white/5",
                  isActive
                    ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border-b-2 border-blue-500"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </header>

      {/* Page Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="py-10 text-center opacity-40 mt-12 border-t border-slate-500/10">
        <p className="text-[9px] font-black text-slate-500 dark:text-white uppercase tracking-[1em]">
          Axori Core Intelligence Matrix v2.5.01
        </p>
      </footer>
    </div>
  )
}
