import { useNavigate } from '@tanstack/react-router'
import { Card, EmptyStateCard } from '@axori/ui'
import { useProperty } from '@/hooks/api/useProperties'

interface LiquidityProps {
  propertyId: string
}

/**
 * Liquidity component - Displays property bank account balance
 * Shows: Current balance when connected, EmptyStateCard when not connected
 */
export const Liquidity = ({ propertyId }: LiquidityProps) => {
  const navigate = useNavigate({ from: '/property-hub/$propertyId/financials' })
  const { isLoading } = useProperty(propertyId)

  // TODO: Replace with actual bank account hook when schema is ready
  // const { data: bankAccount } = usePropertyBankAccount(propertyId)
  // const hasBankAccount = !!bankAccount

  const handleConnectBankAccount = () => {
    navigate({
      to: '/property-hub/$propertyId/financials',
      params: { propertyId },
      search: (prev) => ({ ...prev, drawer: 'connect-bank-account' }),
    })
  }

  if (isLoading) {
    return (
      <Card variant="rounded" padding="lg" radius="xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-white/5 rounded" />
        </div>
      </Card>
    )
  }

  // Empty state - no bank account connected
  // TODO: Once bank account schema is implemented, check: if (!hasBankAccount)
  return (
    <EmptyStateCard
      title="Liquidity"
      description="Connect a bank account to track liquidity and enable automatic transaction syncing."
      buttonText="Connect Bank Account"
      onButtonClick={handleConnectBankAccount}
      variant="violet"
      size="condensed"
      className="h-full"
    />
  )

  // TODO: Uncomment once bank account schema is implemented
  // Connected state - show balance:
  //
  // return (
  //   <Card
  //     variant="rounded"
  //     padding="lg"
  //     radius="xl"
  //     className="h-full flex flex-col justify-between group relative overflow-hidden border-sky-500/20 dark:border-sky-500/10 bg-gradient-to-br from-sky-500/5 to-transparent"
  //   >
  //     <div className="absolute inset-0 bg-gradient-to-r from-sky-500/[0.03] to-transparent pointer-events-none" />
  //     <div className="relative z-10">
  //       <Typography variant="caption" weight="black" className="text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
  //         LIQUIDITY
  //       </Typography>
  //       <Typography variant="h1" className="tabular-nums text-sky-500 dark:text-sky-400 mb-2">
  //         ${Math.round(bankAccount.currentBalance).toLocaleString()}
  //       </Typography>
  //       <Typography variant="overline" className="text-slate-500 dark:text-slate-400">
  //         Current Balance
  //       </Typography>
  //     </div>
  //   </Card>
  // )
}
