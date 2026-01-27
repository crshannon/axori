import { useState } from 'react'
import { Button, Drawer, Input, Select, Typography } from '@axori/ui'
import { Building2, Plus, Wallet } from 'lucide-react'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import {
  useCreateBankAccount,
  usePropertyBankAccounts,
} from '@/hooks/api/useBankAccounts'

interface BankAccountConnectionDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  onSuccess?: () => void
}

type EntryMode = 'select' | 'manual' | 'plaid'

/**
 * BankAccountConnectionDrawer - Allows users to connect bank accounts
 * Supports manual entry (now) and Plaid integration (future)
 */
export const BankAccountConnectionDrawer = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: BankAccountConnectionDrawerProps) => {
  const [entryMode, setEntryMode] = useState<EntryMode>('select')
  const [_isConnecting, setIsConnecting] = useState(false)

  // Manual entry form state
  const [accountName, setAccountName] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [accountType, setAccountType] = useState<
    'checking' | 'savings' | 'money_market' | 'other'
  >('checking')
  const [mask, setMask] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')

  const { data: existingAccounts } = usePropertyBankAccounts(propertyId)
  const createBankAccount = useCreateBankAccount()

  const handleConnectPlaid = () => {
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName.trim()) return

    try {
      await createBankAccount.mutateAsync({
        propertyId,
        accountName: accountName.trim(),
        institutionName: institutionName.trim() || null,
        accountType,
        mask: mask.trim() || null,
        currentBalance: currentBalance ? parseFloat(currentBalance) : null,
        isPrimary: !existingAccounts || existingAccounts.length === 0,
      })

      // Reset form
      setAccountName('')
      setInstitutionName('')
      setAccountType('checking')
      setMask('')
      setCurrentBalance('')
      setEntryMode('select')

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating bank account:', error)
    }
  }

  const resetAndClose = () => {
    setEntryMode('select')
    setAccountName('')
    setInstitutionName('')
    setAccountType('checking')
    setMask('')
    setCurrentBalance('')
    onClose()
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Connect Bank Account"
      subtitle="Track liquidity and allocations"
      width="lg"
    >
      <div className="space-y-8">
        {entryMode === 'select' && (
          <>
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
                    Track Liquidity
                  </strong>{' '}
                  - See your actual cash position for this property
                </Typography>
                <Typography
                  variant="body-sm"
                  className="text-slate-600 dark:text-slate-400"
                >
                  •{' '}
                  <strong className="text-slate-900 dark:text-white">
                    Fund Allocations
                  </strong>{' '}
                  - Earmark funds for maintenance, CapEx, and emergencies
                </Typography>
                <Typography
                  variant="body-sm"
                  className="text-slate-600 dark:text-slate-400"
                >
                  •{' '}
                  <strong className="text-slate-900 dark:text-white">
                    True Cash Flow
                  </strong>{' '}
                  - Know what you can actually withdraw
                </Typography>
              </div>
            </div>

            {/* Connection Options */}
            <div>
              <DrawerSectionTitle title="Add Account" color="emerald" />
              <div className="mt-4 space-y-3">
                {/* Manual Entry Option */}
                <button
                  onClick={() => setEntryMode('manual')}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-500/30 transition-all text-left group bg-white dark:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Wallet className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <Typography
                        variant="body"
                        weight="bold"
                        className="text-slate-900 dark:text-white mb-1"
                      >
                        Manual Entry
                      </Typography>
                      <Typography
                        variant="caption"
                        className="text-slate-500 dark:text-slate-400"
                      >
                        Enter your account details and balance manually
                      </Typography>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                </button>

                {/* Plaid Option (Coming Soon) */}
                <button
                  onClick={handleConnectPlaid}
                  disabled
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 opacity-50 cursor-not-allowed text-left bg-white dark:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-sky-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Typography
                          variant="body"
                          weight="bold"
                          className="text-slate-900 dark:text-white"
                        >
                          Connect with Plaid
                        </Typography>
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                          Coming Soon
                        </span>
                      </div>
                      <Typography
                        variant="caption"
                        className="text-slate-500 dark:text-slate-400"
                      >
                        Automatically sync balance and transactions
                      </Typography>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Existing Accounts */}
            {existingAccounts && existingAccounts.length > 0 && (
              <div>
                <DrawerSectionTitle title="Connected Accounts" color="slate" />
                <div className="mt-4 space-y-2">
                  {existingAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Typography
                            variant="body"
                            weight="bold"
                            className="text-slate-900 dark:text-white mb-1"
                          >
                            {account.accountName}
                          </Typography>
                          <Typography
                            variant="body-sm"
                            className="text-slate-500 dark:text-slate-400"
                          >
                            {account.institutionName || 'Manual Entry'}
                            {account.accountType && ` • ${account.accountType}`}
                            {account.mask && ` • ••••${account.mask}`}
                          </Typography>
                        </div>
                        <div className="text-right">
                          <Typography
                            variant="body"
                            weight="bold"
                            className="text-emerald-600 dark:text-emerald-400"
                          >
                            $
                            {account.currentBalance
                              ? parseFloat(
                                  account.currentBalance,
                                ).toLocaleString()
                              : '0'}
                          </Typography>
                          {account.isPrimary && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {entryMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div>
              <DrawerSectionTitle title="Account Details" color="emerald" />
              <div className="mt-4 space-y-4">
                <Input
                  label="Account Name"
                  placeholder="e.g., Property Operations Account"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                />

                <Input
                  label="Institution Name (Optional)"
                  placeholder="e.g., Chase Bank"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Account Type"
                    value={accountType}
                    onChange={(e) =>
                      setAccountType(e.target.value as typeof accountType)
                    }
                    options={[
                      { value: 'checking', label: 'Checking' },
                      { value: 'savings', label: 'Savings' },
                      { value: 'money_market', label: 'Money Market' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />

                  <Input
                    label="Last 4 Digits (Optional)"
                    placeholder="1234"
                    value={mask}
                    onChange={(e) =>
                      setMask(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            <div>
              <DrawerSectionTitle title="Current Balance" color="indigo" />
              <div className="mt-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                    $
                  </span>
                  <Input
                    label="Balance"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <Typography
                  variant="caption"
                  className="text-slate-400 dark:text-slate-500 mt-2"
                >
                  You can update this anytime from the Liquidity section.
                </Typography>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setEntryMode('select')}
                className="py-3 rounded-xl"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={!accountName.trim() || createBankAccount.isPending}
                className="py-3 rounded-xl font-black uppercase tracking-widest"
              >
                {createBankAccount.isPending ? 'Adding...' : 'Add Account'}
              </Button>
            </div>
          </form>
        )}

        {/* Security Note */}
        <div className="pt-6 border-t border-slate-200 dark:border-white/10">
          <Typography
            variant="caption"
            className="text-slate-400 dark:text-slate-500 italic"
          >
            Your financial data is kept private and secure. Manual entries are
            only visible to you.
          </Typography>
        </div>
      </div>
    </Drawer>
  )
}
