/**
 * Billing Settings Page
 *
 * Subscription management, invoices, and payment methods.
 * Full-width bento-style layout with Stripe integration.
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
    color: "slate",
  },
  {
    id: "pro",
    name: "Pro",
    price: 24,
    interval: "month",
    icon: Sparkles,
    features: [
      "5 Properties",
      "Advanced Analytics",
      "Priority Support",
      "Data Export",
    ],
    popular: true,
    color: "violet",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    price: 49,
    interval: "month",
    icon: Building,
    features: [
      "25 Properties",
      "Team Collaboration",
      "API Access",
      "Custom Reports",
    ],
    color: "blue",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    interval: "month",
    icon: Crown,
    features: [
      "Unlimited Properties",
      "Dedicated Support",
      "Custom Integrations",
      "SLA",
    ],
    color: "amber",
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
  const { isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    )
  }

  // TODO: Fetch actual subscription from API
  const currentPlan = PLANS[0]
  const nextInvoiceDate = new Date()
  nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 1)

  return (
    <div className="px-6 lg:px-12 py-10">
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Billing
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          Manage your subscription, payment methods, and invoices
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Plan - Span 5 */}
        <div className="lg:col-span-5">
          <div
            className={cn(
              "h-full p-8 rounded-3xl border",
              "bg-gradient-to-br from-violet-600 to-purple-700",
              "dark:from-[#E8FF4D] dark:to-lime-500",
              "border-transparent"
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 dark:text-black/50">
              Current Plan
            </span>

            <div className="mt-6 flex flex-col items-center text-center">
              <div className="size-20 rounded-2xl bg-white/20 dark:bg-black/10 flex items-center justify-center mb-6">
                <currentPlan.icon className="size-10 text-white dark:text-black" />
              </div>

              <h3 className="text-3xl font-black text-white dark:text-black">
                {currentPlan.name}
              </h3>
              <p className="text-4xl font-black mt-2 text-white dark:text-black">
                ${currentPlan.price}
                <span className="text-lg font-medium text-white/60 dark:text-black/50">
                  /mo
                </span>
              </p>

              <div className="w-full mt-8 pt-8 border-t border-white/20 dark:border-black/10">
                <button
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all",
                    "bg-white text-violet-700 hover:bg-white/90",
                    "dark:bg-black dark:text-[#E8FF4D] dark:hover:bg-black/80"
                  )}
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Span 7 */}
        <div className="lg:col-span-7 space-y-6">
          {/* Next Invoice */}
          <div
            className={cn(
              "p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    "bg-violet-100 text-violet-600",
                    "dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]"
                  )}
                >
                  <Calendar className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Next Invoice
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    {nextInvoiceDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                ${currentPlan.price}
                <span className="text-sm font-medium text-slate-400 dark:text-white/40">
                  .00
                </span>
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div
            className={cn(
              "p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    "bg-blue-100 text-blue-600",
                    "dark:bg-blue-500/10 dark:text-blue-400"
                  )}
                >
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Payment Method
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Securely stored via Stripe
                  </p>
                </div>
              </div>
              <button className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-[#E8FF4D] dark:hover:text-[#d4eb45] transition-colors">
                + Add New
              </button>
            </div>

            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl",
                "bg-slate-50 dark:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-9 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
                  <span className="text-white text-[10px] font-black">
                    VISA
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900 dark:text-white">
                    •••• •••• •••• 4242
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Expires 12/25
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
                  "bg-violet-100 text-violet-700",
                  "dark:bg-[#E8FF4D]/10 dark:text-[#E8FF4D]"
                )}
              >
                Default
              </span>
            </div>
          </div>
        </div>

        {/* Available Plans - Full Width */}
        <div className="lg:col-span-12">
          <div
            className={cn(
              "p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <h3 className="font-bold text-slate-900 dark:text-white mb-6">
              Available Plans
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon
                const isCurrent = plan.id === currentPlan.id

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative p-6 rounded-2xl border-2 transition-all",
                      isCurrent
                        ? "border-violet-500 bg-violet-50 dark:border-[#E8FF4D] dark:bg-[#E8FF4D]/5"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
                      plan.popular &&
                        !isCurrent &&
                        "border-purple-300 dark:border-purple-500/30"
                    )}
                  >
                    {plan.popular && !isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-purple-500 text-white">
                        Popular
                      </span>
                    )}

                    {isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full bg-violet-600 text-white dark:bg-[#E8FF4D] dark:text-black">
                        Current
                      </span>
                    )}

                    <div className="text-center mb-4">
                      <div
                        className={cn(
                          "size-12 rounded-xl flex items-center justify-center mx-auto mb-3",
                          "bg-slate-100 dark:bg-white/10"
                        )}
                      >
                        <Icon className="size-6 text-slate-600 dark:text-slate-300" />
                      </div>
                      <h4 className="font-black text-lg text-slate-900 dark:text-white">
                        {plan.name}
                      </h4>
                      <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
                        ${plan.price}
                        <span className="text-sm font-normal text-slate-400 dark:text-white/40">
                          /mo
                        </span>
                      </p>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Check className="size-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="text-slate-600 dark:text-slate-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={isCurrent}
                      className={cn(
                        "w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors",
                        isCurrent
                          ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed"
                          : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                      )}
                    >
                      {isCurrent ? "Current" : "Select"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Invoice History - Full Width */}
        <div className="lg:col-span-12">
          <div
            className={cn(
              "p-8 rounded-3xl border",
              "bg-white border-slate-200",
              "dark:bg-[#1A1A1A] dark:border-white/5"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    "bg-slate-100 text-slate-600",
                    "dark:bg-white/5 dark:text-white/60"
                  )}
                >
                  <FileText className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Invoice History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Download past invoices
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-[#E8FF4D] dark:hover:text-[#d4eb45] transition-colors">
                View All
                <ExternalLink className="size-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5">
                    <th className="pb-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Invoice
                    </th>
                    <th className="pb-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Date
                    </th>
                    <th className="pb-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Status
                    </th>
                    <th className="pb-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Amount
                    </th>
                    <th className="pb-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Download
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {MOCK_INVOICES.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="py-4">
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {invoice.description}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-slate-500 dark:text-white/50">
                          {new Date(invoice.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
                            invoice.status === "paid"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          )}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          ${invoice.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            "hover:bg-slate-100 dark:hover:bg-white/5"
                          )}
                        >
                          <Download className="size-4 text-slate-400 dark:text-white/40" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
