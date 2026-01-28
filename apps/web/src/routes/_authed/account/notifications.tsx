/**
 * Notifications Settings Page
 *
 * Email and notification preferences management.
 * Full-width bento-style layout.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useUser } from "@clerk/tanstack-react-start"
import { Loading, cn } from "@axori/ui"
import {
  AlertTriangle,
  Bell,
  Check,
  DollarSign,
  FileText,
  Mail,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/_authed/account/notifications")({
  component: NotificationsPage,
})

interface NotificationSetting {
  id: string
  label: string
  description: string
  icon: typeof Bell
  email: boolean
  push: boolean
  category: "property" | "financial" | "account" | "marketing"
}

const DEFAULT_SETTINGS: Array<NotificationSetting> = [
  // Property Notifications
  {
    id: "property_alerts",
    label: "Property Alerts",
    description: "Important updates about your properties",
    icon: AlertTriangle,
    email: true,
    push: true,
    category: "property",
  },
  {
    id: "maintenance_reminders",
    label: "Maintenance Reminders",
    description: "Scheduled maintenance and inspection reminders",
    icon: FileText,
    email: true,
    push: false,
    category: "property",
  },
  {
    id: "lease_updates",
    label: "Lease Updates",
    description: "Lease renewals, expirations, and tenant changes",
    icon: Users,
    email: true,
    push: true,
    category: "property",
  },
  // Financial Notifications
  {
    id: "payment_received",
    label: "Payment Received",
    description: "Notifications when rent or other payments are received",
    icon: DollarSign,
    email: true,
    push: true,
    category: "financial",
  },
  {
    id: "expense_alerts",
    label: "Expense Alerts",
    description: "Unusual expenses or budget threshold alerts",
    icon: AlertTriangle,
    email: true,
    push: false,
    category: "financial",
  },
  {
    id: "market_insights",
    label: "Market Insights",
    description: "Weekly market trends and property valuations",
    icon: TrendingUp,
    email: true,
    push: false,
    category: "financial",
  },
  // Account Notifications
  {
    id: "security_alerts",
    label: "Security Alerts",
    description: "Login attempts and security-related activity",
    icon: AlertTriangle,
    email: true,
    push: true,
    category: "account",
  },
  {
    id: "billing_updates",
    label: "Billing Updates",
    description: "Invoice reminders and subscription changes",
    icon: FileText,
    email: true,
    push: false,
    category: "account",
  },
  // Marketing
  {
    id: "product_updates",
    label: "Product Updates",
    description: "New features, improvements, and tips",
    icon: MessageSquare,
    email: false,
    push: false,
    category: "marketing",
  },
  {
    id: "newsletter",
    label: "Newsletter",
    description: "Monthly insights and real estate investing tips",
    icon: Mail,
    email: false,
    push: false,
    category: "marketing",
  },
]

function NotificationsPage() {
  const { isLoaded } = useUser()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    )
  }

  const toggleSetting = (id: string, type: "email" | "push") => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, [type]: !setting[type] } : setting
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Save to API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  const categories = [
    {
      id: "property",
      label: "Property",
      description: "Alerts and updates about your properties",
      icon: AlertTriangle,
      color: "violet",
    },
    {
      id: "financial",
      label: "Financial",
      description: "Payments, expenses, and market data",
      icon: DollarSign,
      color: "emerald",
    },
    {
      id: "account",
      label: "Account",
      description: "Security and billing notifications",
      icon: Bell,
      color: "blue",
    },
    {
      id: "marketing",
      label: "Marketing",
      description: "Product news and tips",
      icon: Mail,
      color: "amber",
    },
  ] as const

  const emailCount = settings.filter((s) => s.email).length
  const pushCount = settings.filter((s) => s.push).length

  return (
    <div className="px-6 lg:px-12 py-10">
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Notifications
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          Choose how and when you want to be notified
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Summary Card - Span 4 */}
        <div className="lg:col-span-4">
          <div
            className={cn(
              "h-full p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
              Notification Summary
            </span>

            <div className="mt-6 space-y-6">
              {/* Email Stats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-violet-600 dark:text-[#E8FF4D]" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Email
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {emailCount}/{settings.length}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 dark:bg-[#E8FF4D] transition-all"
                    style={{
                      width: `${(emailCount / settings.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Push Stats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Push
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {pushCount}/{settings.length}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all"
                    style={{
                      width: `${(pushCount / settings.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
                <button
                  onClick={() =>
                    setSettings((prev) => prev.map((s) => ({ ...s, email: true })))
                  }
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl text-sm font-medium transition-colors text-left flex items-center justify-between",
                    "bg-slate-50 hover:bg-slate-100 text-slate-700",
                    "dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/70"
                  )}
                >
                  Enable all email
                  <Check className="size-4" />
                </button>
                <button
                  onClick={() =>
                    setSettings((prev) => prev.map((s) => ({ ...s, push: true })))
                  }
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl text-sm font-medium transition-colors text-left flex items-center justify-between",
                    "bg-slate-50 hover:bg-slate-100 text-slate-700",
                    "dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/70"
                  )}
                >
                  Enable all push
                  <Check className="size-4" />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "w-full mt-8 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all",
                "bg-violet-600 text-white hover:bg-violet-700",
                "dark:bg-[#E8FF4D] dark:text-black dark:hover:bg-[#d4eb45]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Right Column - Span 8 */}
        <div className="lg:col-span-8 space-y-6">
          {categories.map((category) => {
            const categorySettings = settings.filter(
              (s) => s.category === category.id
            )
            const CategoryIcon = category.icon

            return (
              <div
                key={category.id}
                className={cn(
                  "p-8 rounded-3xl border",
                  "bg-white border-slate-200",
                  "dark:bg-[#1A1A1A] dark:border-white/5"
                )}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl",
                      category.color === "violet" &&
                        "bg-violet-100 text-violet-600 dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]",
                      category.color === "emerald" &&
                        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
                      category.color === "blue" &&
                        "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
                      category.color === "amber" &&
                        "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    )}
                  >
                    <CategoryIcon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {category.label} Notifications
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {categorySettings.map((setting) => {
                    const Icon = setting.icon

                    return (
                      <div
                        key={setting.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl",
                          "bg-slate-50 dark:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
                            <Icon className="size-5 text-slate-500 dark:text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">
                              {setting.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-white/50">
                              {setting.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Email Toggle */}
                          <button
                            onClick={() => toggleSetting(setting.id, "email")}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors",
                              setting.email
                                ? "bg-violet-100 text-violet-700 dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]"
                                : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/30"
                            )}
                          >
                            <Mail className="size-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Email
                            </span>
                          </button>

                          {/* Push Toggle */}
                          <button
                            onClick={() => toggleSetting(setting.id, "push")}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors",
                              setting.push
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                                : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/30"
                            )}
                          >
                            <Bell className="size-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Push
                            </span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Footer Note */}
          <p className="text-xs text-slate-400 dark:text-white/30 text-center py-4">
            Security alerts cannot be disabled. You can unsubscribe from
            marketing emails at any time.
          </p>
        </div>
      </div>
    </div>
  )
}
