import { useEffect, useState } from 'react'
import { Button, Drawer, Input, Typography } from '@axori/ui'
import {
  Building,
  Calculator,
  PiggyBank,
  ShieldAlert,
  Wrench,
} from 'lucide-react'
import { DrawerSectionTitle } from './DrawerSectionTitle'
import {
  usePrimaryBankAccount,
  useUpdateBankAccountAllocations,
  useUpdateBankAccountBalance,
} from '@/hooks/api/useBankAccounts'

interface BankAllocationDrawerProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  bankAccountId?: string
  onSuccess?: () => void
}

/**
 * BankAllocationDrawer - Configure fund allocation targets
 * Allows setting maintenance, capex, and life support reserve targets
 */
export const BankAllocationDrawer = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: BankAllocationDrawerProps) => {
  const { data: bankAccount, isLoading } = usePrimaryBankAccount(propertyId)
  const updateAllocations = useUpdateBankAccountAllocations()
  const updateBalance = useUpdateBankAccountBalance()

  // Form state
  const [currentBalance, setCurrentBalance] = useState('')
  const [maintenanceTarget, setMaintenanceTarget] = useState('')
  const [capexTarget, setCapexTarget] = useState('')
  const [lifeSupportTarget, setLifeSupportTarget] = useState('')
  const [lifeSupportMonths, setLifeSupportMonths] = useState('')

  // Initialize form when bank account loads
  useEffect(() => {
    if (bankAccount) {
      setCurrentBalance(bankAccount.currentBalance || '')
      setMaintenanceTarget(bankAccount.maintenanceTarget || '0')
      setCapexTarget(bankAccount.capexTarget || '0')
      setLifeSupportTarget(bankAccount.lifeSupportTarget || '0')
      setLifeSupportMonths(bankAccount.lifeSupportMonths?.toString() || '')
    }
  }, [bankAccount])

  // Calculate totals
  const balance = parseFloat(currentBalance) || 0
  const maintenance = parseFloat(maintenanceTarget) || 0
  const capex = parseFloat(capexTarget) || 0
  const lifeSupport = parseFloat(lifeSupportTarget) || 0
  const totalAllocated = maintenance + capex + lifeSupport
  const trueCashFlow = Math.max(0, balance - totalAllocated)
  const overAllocated = totalAllocated > balance

  const handleSave = async () => {
    if (!bankAccount) return

    try {
      // Update balance if changed
      if (currentBalance !== (bankAccount.currentBalance || '')) {
        await updateBalance.mutateAsync({
          id: bankAccount.id,
          propertyId,
          currentBalance: currentBalance ? parseFloat(currentBalance) : null,
        })
      }

      // Update allocations
      await updateAllocations.mutateAsync({
        id: bankAccount.id,
        propertyId,
        maintenanceTarget: maintenance,
        capexTarget: capex,
        lifeSupportTarget: lifeSupport,
        lifeSupportMonths: lifeSupportMonths
          ? parseInt(lifeSupportMonths)
          : null,
      })

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating allocations:', error)
    }
  }

  const handleQuickSet = (preset: 'conservative' | 'moderate' | 'minimal') => {
    const monthlyExpense = balance * 0.05 // Rough estimate: 5% of balance as monthly expense
    switch (preset) {
      case 'conservative':
        setMaintenanceTarget(String(Math.round(balance * 0.15)))
        setCapexTarget(String(Math.round(balance * 0.2)))
        setLifeSupportTarget(String(Math.round(monthlyExpense * 6)))
        setLifeSupportMonths('6')
        break
      case 'moderate':
        setMaintenanceTarget(String(Math.round(balance * 0.1)))
        setCapexTarget(String(Math.round(balance * 0.15)))
        setLifeSupportTarget(String(Math.round(monthlyExpense * 3)))
        setLifeSupportMonths('3')
        break
      case 'minimal':
        setMaintenanceTarget(String(Math.round(balance * 0.05)))
        setCapexTarget(String(Math.round(balance * 0.1)))
        setLifeSupportTarget(String(Math.round(monthlyExpense * 1)))
        setLifeSupportMonths('1')
        break
    }
  }

  if (isLoading) {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Configure Allocations"
        subtitle="Set your reserve targets"
        width="lg"
      >
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-slate-200 dark:bg-white/5 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-white/5 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-white/5 rounded-xl" />
        </div>
      </Drawer>
    )
  }

  if (!bankAccount) {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Configure Allocations"
        subtitle="Set your reserve targets"
        width="lg"
      >
        <div className="text-center py-12">
          <Typography
            variant="body"
            className="text-slate-500 dark:text-slate-400"
          >
            No bank account connected. Please connect a bank account first.
          </Typography>
        </div>
      </Drawer>
    )
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Allocations"
      subtitle={bankAccount.accountName}
      width="lg"
    >
      <div className="space-y-8">
        {/* Current Balance */}
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
              Update your current bank balance to calculate allocations.
            </Typography>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <DrawerSectionTitle title="Quick Setup" color="violet" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleQuickSet('conservative')}
              className="p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-violet-500/50 dark:hover:border-violet-500/30 transition-all text-center group"
            >
              <Typography
                variant="body-sm"
                weight="bold"
                className="text-slate-900 dark:text-white"
              >
                Conservative
              </Typography>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400"
              >
                6 months reserves
              </Typography>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSet('moderate')}
              className="p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-violet-500/50 dark:hover:border-violet-500/30 transition-all text-center group"
            >
              <Typography
                variant="body-sm"
                weight="bold"
                className="text-slate-900 dark:text-white"
              >
                Moderate
              </Typography>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400"
              >
                3 months reserves
              </Typography>
            </button>
            <button
              type="button"
              onClick={() => handleQuickSet('minimal')}
              className="p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-violet-500/50 dark:hover:border-violet-500/30 transition-all text-center group"
            >
              <Typography
                variant="body-sm"
                weight="bold"
                className="text-slate-900 dark:text-white"
              >
                Minimal
              </Typography>
              <Typography
                variant="caption"
                className="text-slate-500 dark:text-slate-400"
              >
                1 month reserves
              </Typography>
            </button>
          </div>
        </div>

        {/* Allocation Targets */}
        <div>
          <DrawerSectionTitle title="Allocation Targets" color="emerald" />
          <div className="mt-4 space-y-4">
            {/* Maintenance */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <Typography
                    variant="body"
                    weight="bold"
                    className="text-slate-900 dark:text-white"
                  >
                    Maintenance Reserve
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    For routine repairs and upkeep
                  </Typography>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                  $
                </span>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  value={maintenanceTarget}
                  onChange={(e) => setMaintenanceTarget(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* CapEx */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Building className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <Typography
                    variant="body"
                    weight="bold"
                    className="text-slate-900 dark:text-white"
                  >
                    CapEx Reserve
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    For major capital improvements (roof, HVAC, etc.)
                  </Typography>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                  $
                </span>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  value={capexTarget}
                  onChange={(e) => setCapexTarget(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Life Support */}
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <Typography
                    variant="body"
                    weight="bold"
                    className="text-slate-900 dark:text-white"
                  >
                    Life Support / Emergency Fund
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-slate-500 dark:text-slate-400"
                  >
                    For vacancy, unexpected costs, or emergencies
                  </Typography>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                      $
                    </span>
                    <Input
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      value={lifeSupportTarget}
                      onChange={(e) => setLifeSupportTarget(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Months Coverage
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="3"
                      type="number"
                      min="1"
                      max="24"
                      value={lifeSupportMonths}
                      onChange={(e) => setLifeSupportMonths(e.target.value)}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                      mo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-sky-500" />
            </div>
            <Typography
              variant="body"
              weight="bold"
              className="text-slate-900 dark:text-white"
            >
              Summary
            </Typography>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Typography
                variant="body-sm"
                className="text-slate-600 dark:text-slate-400"
              >
                Current Balance
              </Typography>
              <Typography
                variant="body-sm"
                weight="bold"
                className="text-slate-900 dark:text-white"
              >
                ${balance.toLocaleString()}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography
                variant="body-sm"
                className="text-slate-600 dark:text-slate-400"
              >
                Total Allocated
              </Typography>
              <Typography
                variant="body-sm"
                weight="bold"
                className={
                  overAllocated
                    ? 'text-rose-500'
                    : 'text-slate-900 dark:text-white'
                }
              >
                -${totalAllocated.toLocaleString()}
              </Typography>
            </div>
            <div className="border-t border-slate-200 dark:border-white/10 my-2" />
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-sky-500" />
                <Typography
                  variant="body"
                  weight="bold"
                  className="text-slate-900 dark:text-white"
                >
                  True Cash Flow
                </Typography>
              </div>
              <Typography
                variant="h5"
                className={trueCashFlow > 0 ? 'text-sky-500' : 'text-rose-500'}
              >
                ${trueCashFlow.toLocaleString()}
              </Typography>
            </div>

            {overAllocated && (
              <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <Typography variant="caption" className="text-rose-500">
                  Warning: Your allocations exceed your current balance by $
                  {(totalAllocated - balance).toLocaleString()}. Consider
                  reducing targets or adding funds.
                </Typography>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            className="py-3 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleSave}
            disabled={updateAllocations.isPending || updateBalance.isPending}
            className="py-3 rounded-xl font-black uppercase tracking-widest"
          >
            {updateAllocations.isPending || updateBalance.isPending
              ? 'Saving...'
              : 'Save Allocations'}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
