import { Card } from '@axori/ui'
import { CreditCard, Receipt, Settings, Shield } from 'lucide-react'
import { usePropertyPermissions } from '@/hooks/api'

interface BillingSectionProps {
  propertyId: string
}

/**
 * BillingSection component - Displays billing and subscription information
 * Shows: current plan, payment methods, billing history
 *
 * Permission: Only visible to owner roles (canManageBilling)
 * Non-owner users will not see this section at all
 */
export const BillingSection = ({ propertyId }: BillingSectionProps) => {
  const { canManageBilling, isLoading } = usePropertyPermissions(propertyId)

  // Hide the entire section for non-owner users
  // Only owners can view and manage billing
  if (isLoading) {
    return null // Don't show loading state, just hide until we know permissions
  }

  if (!canManageBilling) {
    return null
  }

  return (
    <Card variant="rounded" padding="lg" radius="xl">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl font-black uppercase tracking-tighter">
          Billing & Subscription
        </h3>
        <div className="flex items-center gap-3">
          <button
            className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5`}
          >
            Manage Plan
          </button>
        </div>
      </div>

      {/* Current Plan */}
      <div className="p-6 rounded-[2rem] border bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/20 dark:border-violet-500/10 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">
                Pro Plan
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Billed Monthly
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">$49</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Per Month
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button className="p-4 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-center">
          <CreditCard className="w-5 h-5 mx-auto mb-2 text-slate-400" />
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Payment Methods
          </p>
        </button>
        <button className="p-4 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-center">
          <Receipt className="w-5 h-5 mx-auto mb-2 text-slate-400" />
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Billing History
          </p>
        </button>
        <button className="p-4 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-center">
          <Settings className="w-5 h-5 mx-auto mb-2 text-slate-400" />
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Billing Settings
          </p>
        </button>
      </div>

      {/* Next Invoice */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">
              Next Invoice
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              February 1, 2025
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-slate-900 dark:text-white">
              $49.00
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
