/**
 * Notifications Settings Page
 *
 * Email and notification preferences management.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useUser } from "@clerk/tanstack-react-start"
import { Loading, cn } from "@axori/ui"
import {
  Bell,
  Mail,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  FileText,
  DollarSign,
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

const DEFAULT_SETTINGS: NotificationSetting[] = [
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

  const cardClass = cn(
    "p-8 rounded-3xl border transition-all duration-500",
    "bg-white border-slate-200 shadow-sm",
    "dark:bg-[#1A1A1A] dark:border-white/5"
  )

  if (!isLoaded) {
    return (
      <div className="p-8 w-full flex items-center justify-center min-h-[400px]">
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
    { id: "property", label: "Property Notifications", icon: AlertTriangle },
    { id: "financial", label: "Financial Notifications", icon: DollarSign },
    { id: "account", label: "Account Notifications", icon: Bell },
    { id: "marketing", label: "Marketing & Updates", icon: Mail },
  ] as const

  return (
    <div className="p-8 w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className={cardClass}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Notification Preferences
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose how and when you want to be notified
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl transition-colors",
              "bg-blue-500 text-white hover:bg-blue-600",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Quick toggles */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className={cn(
            "p-4 rounded-xl flex items-center justify-between",
            "bg-slate-50 dark:bg-white/5"
          )}>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium">Email Notifications</span>
            </div>
            <button
              onClick={() => {
                const allEmailOn = settings.every((s) => s.email)
                setSettings((prev) =>
                  prev.map((s) => ({ ...s, email: !allEmailOn }))
                )
              }}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                settings.every((s) => s.email)
                  ? "bg-blue-500"
                  : "bg-slate-300 dark:bg-slate-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  settings.every((s) => s.email) ? "left-7" : "left-1"
                )}
              />
            </button>
          </div>

          <div className={cn(
            "p-4 rounded-xl flex items-center justify-between",
            "bg-slate-50 dark:bg-white/5"
          )}>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="text-sm font-medium">Push Notifications</span>
            </div>
            <button
              onClick={() => {
                const allPushOn = settings.every((s) => s.push)
                setSettings((prev) =>
                  prev.map((s) => ({ ...s, push: !allPushOn }))
                )
              }}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                settings.every((s) => s.push)
                  ? "bg-blue-500"
                  : "bg-slate-300 dark:bg-slate-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                  settings.every((s) => s.push) ? "left-7" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Category Sections */}
      {categories.map((category) => {
        const categorySettings = settings.filter((s) => s.category === category.id)
        const CategoryIcon = category.icon

        return (
          <section key={category.id} className={cardClass}>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <CategoryIcon className="w-5 h-5 text-blue-500" />
              {category.label}
            </h3>

            <div className="space-y-4">
              {categorySettings.map((setting) => {
                const Icon = setting.icon

                return (
                  <div
                    key={setting.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl",
                      "bg-slate-50 dark:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{setting.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {setting.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Email Toggle */}
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <button
                          onClick={() => toggleSetting(setting.id, "email")}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            setting.email
                              ? "bg-blue-500"
                              : "bg-slate-300 dark:bg-slate-600"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                              setting.email ? "left-5" : "left-0.5"
                            )}
                          />
                        </button>
                      </div>

                      {/* Push Toggle */}
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-400" />
                        <button
                          onClick={() => toggleSetting(setting.id, "push")}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            setting.push
                              ? "bg-blue-500"
                              : "bg-slate-300 dark:bg-slate-600"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                              setting.push ? "left-5" : "left-0.5"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Unsubscribe Note */}
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        You can unsubscribe from all marketing emails at any time. Security alerts cannot be disabled.
      </p>
    </div>
  )
}
