/**
 * Account Settings Layout
 *
 * Main layout for user account settings with tabbed navigation.
 * Handles profile, security, billing, and notifications.
 */

import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router"
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
}

const ACCOUNT_TABS: Array<AccountTab> = [
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
      <header
        className={cn(
          "sticky top-0 z-50 backdrop-blur-xl border-b transition-colors",
          "bg-white/80 border-slate-200 shadow-sm",
          "dark:bg-black/60 dark:border-white/5"
        )}
      >
        {/* Top row: Back button, title */}
        <div className="px-8 py-4 flex items-center gap-6">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className={cn(
              "p-4 rounded-2xl transition-all",
              "bg-slate-100 hover:bg-slate-200",
              "dark:bg-white/5 dark:hover:bg-white/10"
            )}
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none">
              Account Settings
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/70 mt-1">
              Manage your account, security, and billing
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="px-8 pb-4">
          <div className="flex gap-2">
            {ACCOUNT_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = isActiveTab(tab.path)

              return (
                <button
                  key={tab.id}
                  onClick={() => navigate({ to: tab.path })}
                  className={cn(
                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer",
                    isActive
                      ? "bg-violet-600 text-white shadow-lg dark:bg-[#E8FF4D] dark:text-black"
                      : "text-slate-600 hover:bg-slate-100 dark:text-white/60 dark:hover:bg-white/5"
                  )}
                >
                  <Icon size={16} strokeWidth={2.5} />
                  {tab.label}
                </button>
              )
            })}
          </div>
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
