import { useState } from 'react'
import { Button, Drawer, Typography } from '@axori/ui'
import { DrawerSectionTitle } from './DrawerSectionTitle'

interface BankAccountConnectionDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  onSuccess?: () => void
}

/**
 * BankAccountConnectionDrawer - Allows users to connect Plaid or select existing accounts
 * For associating a bank account with a specific property
 */
export const BankAccountConnectionDrawer = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: BankAccountConnectionDrawerProps) => {
  const [isConnecting, setIsConnecting] = useState(false)

  // TODO: Implement Plaid Link integration
  const handleConnectPlaid = async () => {
    setIsConnecting(true)
    try {
      // TODO: Initialize Plaid Link
      // 1. Get link token from API
      // 2. Open Plaid Link modal
      // 3. Exchange public token for access token
      // 4. Associate account with property
      console.log('Connecting via Plaid for property:', propertyId)
      // Placeholder for now
      setTimeout(() => {
        setIsConnecting(false)
        onSuccess?.()
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Error connecting Plaid:', error)
      setIsConnecting(false)
    }
  }

  // TODO: Fetch user's existing connected accounts
  const existingAccounts: Array<{
    id: string
    name: string
    bank: string
    accountType: string
    last4: string
  }> = [] // Will come from API hook

  const handleSelectExistingAccount = (accountId: string) => {
    // TODO: Associate existing account with property
    console.log('Associating account:', accountId, 'with property:', propertyId)
    onSuccess?.()
    onClose()
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Bank Account"
      subtitle="Liquidity and transaction tracking"
      width="lg"
    >
      <div className="space-y-8">
        {/* Info Section */}
        <div>
          <DrawerSectionTitle title="Why Connect?" color="emerald" />
          <div className="mt-4 space-y-3">
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-400"
            >
              •{' '}
              <strong className="text-slate-900 dark:text-white">
                Automatic Transaction Sync
              </strong>{' '}
              - Transactions from this account will automatically import
            </Typography>
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-400"
            >
              •{' '}
              <strong className="text-slate-900 dark:text-white">
                Real-Time Balance
              </strong>{' '}
              - Always see current liquidity for this property
            </Typography>
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-400"
            >
              •{' '}
              <strong className="text-slate-900 dark:text-white">
                Easier Reconciliation
              </strong>{' '}
              - Match imported transactions with property expenses
            </Typography>
          </div>
        </div>

        {/* Connect New Account via Plaid */}
        <div>
          <DrawerSectionTitle title="Connect New Account" color="emerald" />
          <div className="mt-4">
            <Typography
              variant="body-sm"
              className="text-slate-600 dark:text-slate-400 mb-4"
            >
              Securely connect your bank account using Plaid. We use bank-level
              encryption and never store your banking credentials.
            </Typography>
            <Button
              variant="primary"
              fullWidth
              onClick={handleConnectPlaid}
              disabled={isConnecting}
              className="py-4 rounded-2xl font-black text-sm uppercase tracking-widest"
            >
              {isConnecting ? 'Connecting...' : 'Connect with Plaid'}
            </Button>
          </div>
        </div>

        {/* Select Existing Account */}
        {existingAccounts.length > 0 && (
          <div>
            <DrawerSectionTitle title="Use Existing Account" color="slate" />
            <div className="mt-4 space-y-2">
              {existingAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleSelectExistingAccount(account.id)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-500/30 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography
                        variant="body"
                        weight="bold"
                        className="text-slate-900 dark:text-white mb-1"
                      >
                        {account.name}
                      </Typography>
                      <Typography
                        variant="body-sm"
                        className="text-slate-500 dark:text-slate-400"
                      >
                        {account.bank} • {account.accountType} • ••••{' '}
                        {account.last4}
                      </Typography>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Typography
                        variant="caption"
                        className="text-emerald-500 font-bold"
                      >
                        Select →
                      </Typography>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Security Note */}
        <div className="pt-6 border-t border-slate-200 dark:border-white/10">
          <Typography
            variant="caption"
            className="text-slate-400 dark:text-slate-500 italic"
          >
            🔒 Your financial data is encrypted and secure. We use Plaid, a
            trusted service used by millions of applications.
          </Typography>
        </div>
      </div>
    </Drawer>
  )
}
