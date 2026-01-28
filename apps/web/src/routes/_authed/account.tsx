/**
 * Account Settings Layout
 *
 * Full-width layout for user account settings with tabbed navigation.
 * Handles profile, security, billing, and notifications.
 */

import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { ArrowLeft, Bell, CreditCard, Shield, User } from "lucide-react"
import { cn } from "@axori/ui"

export const Route = createFileRoute("/_authed/account")({
  component: AccountLayout,
})

interface AccountTab {
  id: string
  label: string
  path: string
  icon: typeof User
  description: string
}

const ACCOUNT_TABS: Array<AccountTab> = [
  {
    id: "profile",
    label: "Profile",
    path: "/account",
    icon: User,
    description: "Personal info & preferences",
  },
  {
    id: "security",
    label: "Security",
    path: "/account/security",
    icon: Shield,
    description: "MFA & active sessions",
  },
  {
    id: "billing",
    label: "Billing",
    path: "/account/billing",
    icon: CreditCard,
    description: "Plans, invoices & payments",
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/account/notifications",
    icon: Bell,
    description: "Email & alert preferences",
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0a0c]">
      {/* Header with back button */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b bg-white/80 border-slate-200 dark:bg-black/60 dark:border-white/5">
        <div className="px-6 lg:px-12 py-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className={cn(
                "p-3 rounded-2xl transition-all",
                "bg-slate-100 hover:bg-slate-200",
                "dark:bg-white/5 dark:hover:bg-white/10"
              )}
            >
              <ArrowLeft className="size-5" strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Account Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                Manage your profile, security, and billing preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Full-width Tab Navigation */}
      <nav className="border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0a0c]">
        <div className="px-6 lg:px-12">
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {ACCOUNT_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = isActiveTab(tab.path)

              return (
                <button
                  key={tab.id}
                  onClick={() => navigate({ to: tab.path })}
                  className={cn(
                    "group relative flex items-center gap-3 px-6 py-5 text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "text-violet-600 dark:text-[#E8FF4D]"
                      : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 transition-colors",
                      isActive
                        ? "text-violet-600 dark:text-[#E8FF4D]"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-white/40 dark:group-hover:text-white/70"
                    )}
                  />
                  <div className="text-left">
                    <span className="block font-semibold">{tab.label}</span>
                    <span
                      className={cn(
                        "block text-[10px] font-normal",
                        isActive
                          ? "text-violet-500 dark:text-[#E8FF4D]/70"
                          : "text-slate-400 dark:text-white/30"
                      )}
                    >
                      {tab.description}
                    </span>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-[#E8FF4D]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Page Content - Full Width */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 dark:border-white/5">
        <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em]">
          Axori • Account Management
        </p>
      </footer>
    </div>
  )
}
