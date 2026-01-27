import { Card, EmptyStateCard, Typography } from '@axori/ui'
import { RefreshCw, Settings2 } from 'lucide-react'
import { LearningHubButton } from './LearningHubButton'
import {
  useBankAccountAllocations,
  usePrimaryBankAccount,
} from '@/hooks/api/useBankAccounts'
import { usePropertyPermissions } from '@/hooks/api'
import { useProperty } from '@/hooks/api/useProperties'
import { DRAWERS, useDrawer } from '@/lib/drawer'
import { cn } from '@/utils/helpers/cn'
import { getLiquiditySnippets } from '@/data/learning-hub/financials-snippets'

interface LiquidityProps {
  propertyId: string
}

/**
 * Liquidity component - Liquidity Reservoir display
 *
 * Shows: Portfolio Cash, allocation breakdown, True Cash Flow
 * With animated water wave effect and segment bar.
 *
 * @see AXO-93 - Uses drawer factory for opening connect drawer
 */
export const Liquidity = ({ propertyId }: LiquidityProps) => {
  const { openDrawer } = useDrawer()
  const { isLoading: propertyLoading } = useProperty(propertyId)
  const { canEdit } = usePropertyPermissions(propertyId)

  const { data: bankAccount, isLoading: accountLoading } =
    usePrimaryBankAccount(propertyId)
  const allocations = useBankAccountAllocations(propertyId)

  const isLoading = propertyLoading || accountLoading

  const handleConnectBankAccount = () => {
    openDrawer(DRAWERS.CONNECT_BANK_ACCOUNT, { propertyId })
  }

  const handleConfigureAllocations = () => {
    openDrawer(DRAWERS.BANK_ALLOCATION, {
      propertyId,
      bankAccountId: bankAccount?.id,
    })
  }

  if (isLoading) {
    return (
      <Card variant="rounded" padding="lg" radius="xl" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-white/5 rounded" />
        </div>
      </Card>
    )
  }

  // Empty state - no bank account connected
  if (!allocations.hasBankAccount) {
    return (
      <EmptyStateCard
        title="Liquidity Reservoir"
        description={
          canEdit
            ? 'Connect a bank account to track liquidity and fund allocations for reserves and emergencies.'
            : 'No bank account has been connected to this property yet.'
        }
        buttonText={canEdit ? 'Connect Bank Account' : undefined}
        onButtonClick={canEdit ? handleConnectBankAccount : undefined}
        variant="violet"
        size="condensed"
        className="h-full"
      />
    )
  }

  // Connected state - show balance and allocations
  const hasAllocations = allocations.totalAllocated > 0

  // Calculate liquidity level for visual (0-100%)
  const liquidityLevel = hasAllocations
    ? Math.min((allocations.trueCashFlow / allocations.balance) * 100, 100)
    : 50

  // Segment count for the bar visualization
  const totalSegments = 12
  const filledSegments = Math.ceil((liquidityLevel / 100) * totalSegments)

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="h-full flex flex-col relative overflow-hidden group border-violet-500/20"
    >
      {/* Animated Water Level Effect */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-violet-500/10 group-hover:bg-violet-500/15 transition-all duration-1000 border-t border-violet-500/20"
        style={{ height: `${Math.max(liquidityLevel * 0.6, 20)}%` }}
      >
        {/* Wave animation at top of water */}
        <div className="absolute top-0 left-0 w-full h-4 -translate-y-full opacity-30 overflow-hidden">
          <svg
            width="200%"
            height="16"
            viewBox="0 0 100 8"
            preserveAspectRatio="none"
            className="animate-[wave_3s_linear_infinite]"
          >
            <path
              d="M0 4 Q 25 0 50 4 T 100 4 T 150 4 T 200 4"
              fill="none"
              stroke="currentColor"
              className="text-violet-500"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-violet-500 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
          <Typography
            variant="h6"
            className="uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Liquidity Reservoir
          </Typography>
          <LearningHubButton
            snippets={getLiquiditySnippets()}
            title="Liquidity Reservoir"
            subtitle="Cash Position & Deployment Capacity"
            componentKey="liquidity"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-violet-500/10 text-violet-500 border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
            Vault_Locked
          </span>
          {canEdit && (
            <>
              <button
                onClick={handleConnectBankAccount}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title="Sync Balance"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={handleConfigureAllocations}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title="Configure Allocations"
              >
                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block mb-3 opacity-60"
          >
            Portfolio Cash
          </Typography>
          <Typography
            variant="h1"
            className="tabular-nums text-slate-900 dark:text-white tracking-tighter animate-in slide-in-from-bottom-2 duration-1000"
          >
            ${Math.round(allocations.balance).toLocaleString()}
          </Typography>
          {bankAccount && (
            <Typography
              variant="caption"
              className="text-slate-400 dark:text-slate-500 mt-2 block"
            >
              {bankAccount.accountName}
            </Typography>
          )}
        </div>
        <div className="text-right">
          <Typography
            variant="caption"
            className="text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block mb-3 opacity-60"
          >
            Liquid Available
          </Typography>
          <Typography
            variant="h3"
            className="tabular-nums text-emerald-500 tracking-tighter"
          >
            ${Math.round(allocations.trueCashFlow).toLocaleString()}
          </Typography>
        </div>
      </div>

      {/* Segment Bar Visualization */}
      <div className="flex gap-1.5 relative z-10 mt-auto">
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-grow rounded-full transition-all duration-700',
              i < filledSegments
                ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                : 'bg-slate-200 dark:bg-white/5',
            )}
          />
        ))}
      </div>

      {/* CSS for wave animation */}
      <style>{`
        @keyframes wave {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </Card>
  )
}
