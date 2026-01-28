/**
 * Billing Settings Page
 *
 * Subscription management, invoices, and payment methods.
 * Integrates with Stripe for billing operations.
 */

import { createFileRoute } from "@tanstack/react-router"
import { useUser } from "@clerk/tanstack-react-start"
import { Loading, cn } from "@axori/ui"
import {
  Building,
  Calendar,
  Check,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  FileText,
  Sparkles,
  Zap,
} from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/_authed/account/billing")({
  component: BillingPage,
})

// Plan definitions (will come from API/Stripe in production)
const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    icon: Zap,
    features: ["1 Property", "Basic Analytics", "Email Support"],
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 24,
    interval: "month",
    icon: Sparkles,
    features: ["5 Properties", "Advanced Analytics", "Priority Support", "Data Export"],
    popular: true,
  },
  {
    id: "portfolio",
    name: "Portfolio",
    price: 49,
    interval: "month",
    icon: Building,
    features: ["25 Properties", "Team Collaboration", "API Access", "Custom Reports"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    interval: "month",
    icon: Crown,
    features: ["Unlimited Properties", "Dedicated Support", "Custom Integrations", "SLA"],
  },
]

// Mock invoice data (will come from Stripe API)
const MOCK_INVOICES = [
  {
    id: "inv_1",
    date: "2024-01-15",
    amount: 24.0,
    status: "paid",
    description: "Pro Plan - January 2024",
  },
  {
    id: "inv_2",
    date: "2023-12-15",
    amount: 24.0,
    status: "paid",
    description: "Pro Plan - December 2023",
  },
  {
    id: "inv_3",
    date: "2023-11-15",
    amount: 24.0,
    status: "paid",
    description: "Pro Plan - November 2023",
  },
]

function BillingPage() {
  const { user, isLoaded } = useUser()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

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

  // TODO: Fetch actual subscription from API
  const currentPlan = PLANS[0] // Default to free for now
  const nextInvoiceDate = new Date()
  nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 1)

  return (
    <div className="p-8 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Current Subscription */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          Current Subscription
        </h2>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <currentPlan.icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{currentPlan.name} Plan</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {currentPlan.price === 0
                  ? "Free forever"
                  : `$${currentPlan.price}/${currentPlan.interval}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              Upgrade Plan
            </button>
            {currentPlan.price > 0 && (
              <button className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                Manage Subscription
              </button>
            )}
          </div>
        </div>

        {/* Next Invoice */}
        {currentPlan.price > 0 && (
          <div className={cn(
            "mt-6 p-4 rounded-xl flex items-center justify-between",
            "bg-slate-50 dark:bg-white/5"
          )}>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium">Next Invoice</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {nextInvoiceDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <p className="text-lg font-bold">${currentPlan.price}.00</p>
          </div>
        )}
      </section>

      {/* Available Plans */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold mb-6">Available Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isCurrent = plan.id === currentPlan.id

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative p-6 rounded-2xl border-2 transition-all",
                  isCurrent
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10"
                    : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
                  plan.popular && !isCurrent && "border-purple-300 dark:border-purple-500/30"
                )}
              >
                {plan.popular && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full bg-purple-500 text-white">
                    Popular
                  </span>
                )}

                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full bg-blue-500 text-white">
                    Current
                  </span>
                )}

                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                  </div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-2xl font-bold mt-1">
                    ${plan.price}
                    <span className="text-sm font-normal text-slate-500">/mo</span>
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent}
                  className={cn(
                    "w-full py-2 text-sm font-medium rounded-xl transition-colors",
                    isCurrent
                      ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                  )}
                >
                  {isCurrent ? "Current Plan" : "Select Plan"}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Payment Methods */}
      <section className={cardClass}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Payment Methods
          </h2>
          <button className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors">
            + Add Payment Method
          </button>
        </div>

        <div className={cn(
          "flex items-center justify-between p-4 rounded-xl",
          "bg-slate-50 dark:bg-white/5"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div>
              <p className="font-medium text-sm">•••• •••• •••• 4242</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expires 12/25</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
              Default
            </span>
            <button className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Edit
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Payment methods are securely stored by Stripe. We never store your full card details.
        </p>
      </section>

      {/* Invoice History */}
      <section className={cardClass}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Invoice History
          </h2>
          <button className="flex items-center gap-1 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors">
            View All
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {MOCK_INVOICES.map((invoice) => (
            <div
              key={invoice.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl",
                "bg-slate-50 dark:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-sm">{invoice.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(invoice.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  invoice.status === "paid"
                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                )}>
                  {invoice.status === "paid" ? "Paid" : "Pending"}
                </span>
                <span className="font-medium">${invoice.amount.toFixed(2)}</span>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {MOCK_INVOICES.length === 0 && (
          <p className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
            No invoices yet. Invoices will appear here once you subscribe to a paid plan.
          </p>
        )}
      </section>
    </div>
  )
}
