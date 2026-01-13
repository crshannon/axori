import { Button, Card, Typography } from '@axori/ui'
import { CirclePlusIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useProperty } from '@/hooks/api/useProperties'

interface DebtArchitectureProps {
  propertyId: string
}

export const DebtArchitecture = ({ propertyId }: DebtArchitectureProps) => {
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(propertyId)

  const handleAddLoan = () => {
    navigate({
      to: '/property-hub/$propertyId/financials',
      params: { propertyId },
      search: { drawer: 'add-loan' },
    })
  }

  if (isLoading || !property) {
    return (
      <Card variant="rounded" padding="lg" radius="xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-white/5 rounded" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex justify-between items-end border-b border-slate-200 dark:border-white/5 pb-4"
            >
              <div className="h-4 w-32 bg-slate-200 dark:bg-white/5 rounded" />
              <div className="h-6 w-24 bg-slate-200 dark:bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // Get active primary loan
  const activeLoan = property.loans?.find(
    (loan) => loan.status === 'active' && loan.isPrimary,
  )

  // Format loan balance
  const loanBalance = activeLoan?.currentBalance
    ? Number(activeLoan.currentBalance)
    : null

  // Format original loan amount
  const originalLoanAmount = activeLoan?.originalLoanAmount
    ? Number(activeLoan.originalLoanAmount)
    : null

  // Calculate principal paid
  const principalPaid =
    originalLoanAmount && loanBalance ? originalLoanAmount - loanBalance : null

  // Format interest rate (convert from decimal to percentage for display)
  // Database stores as decimal (0.0375), we display as percentage (3.75%)
  const interestRate = activeLoan?.interestRate
    ? Number(activeLoan.interestRate) * 100
    : null

  // Format loan term (e.g., "30-year fixed" from termMonths)
  const formatLoanTerm = (termMonths: number | null | undefined) => {
    if (!termMonths) return null
    const years = termMonths / 12
    if (years === 15) return '15-year fixed'
    if (years === 30) return '30-year fixed'
    if (years === 20) return '20-year fixed'
    return `${termMonths}-month`
  }

  const loanTerm = formatLoanTerm(activeLoan?.termMonths ?? null)

  // Format monthly payments
  const monthlyPAndI = activeLoan?.monthlyPrincipalInterest
    ? Number(activeLoan.monthlyPrincipalInterest)
    : null
  // Access fields that may exist but aren't in the type definition
  const loanData = activeLoan as any
  const monthlyEscrow = loanData?.monthlyEscrow
    ? Number(loanData.monthlyEscrow)
    : null
  const totalMonthlyPayment = loanData?.totalMonthlyPayment
    ? Number(loanData.totalMonthlyPayment)
    : monthlyPAndI && monthlyEscrow
      ? monthlyPAndI + monthlyEscrow
      : monthlyPAndI

  // Format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return null
    }
  }

  const startDate = formatDate(loanData?.startDate ?? null)
  const maturityDate = formatDate(loanData?.maturityDate ?? null)

  // Market average rate for comparison (6.5%)
  const marketAverageRate = 6.5

  // Determine if rate is low (below market average)
  const isLowRate = interestRate !== null && interestRate < marketAverageRate

  const hasLoan = !!activeLoan

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="lg:col-span-4 flex flex-col justify-between group relative overflow-hidden"
    >
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Typography variant="h5">Debt Logic</Typography>
          {hasLoan && isLowRate && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              <Typography
                variant="caption"
                className="text-emerald-500 opacity-100"
              >
                Low Interest Held
              </Typography>
            </div>
          )}
        </div>

        {!hasLoan ? (
          <div
            onClick={handleAddLoan}
            className="py-8 text-center cursor-pointer border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:border-slate-50 dark:hover:border-white/20 hover:shadow-md transition-all duration-300"
          >
            <Typography
              variant="body-sm"
              weight="bold"
              className="opacity-60 mb-4 font-black"
            >
              No active loans found
            </Typography>

            <CirclePlusIcon className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-400" />
            <Typography
              variant="body-lg"
              weight="bold"
              className="opacity-60 mt-2"
            >
              Add Loan
            </Typography>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Loan Balance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Typography
                  variant="body-sm"
                  weight="bold"
                  className="text-slate-400 uppercase tracking-widest"
                >
                  {activeLoan.lenderName} • {loanTerm || 'Term not set'}
                </Typography>
                {activeLoan.loanType && (
                  <div className="px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/5">
                    <Typography
                      variant="caption"
                      className="text-slate-600 dark:text-slate-400 opacity-100"
                    >
                      {activeLoan.loanType}
                    </Typography>
                  </div>
                )}
              </div>
              <Typography
                variant="h3"
                className="tabular-nums mt-1 text-slate-900 dark:text-white"
              >
                {loanBalance !== null
                  ? `$${loanBalance.toLocaleString()}`
                  : 'Not set'}
              </Typography>
              {originalLoanAmount && loanBalance && (
                <Typography
                  variant="body-sm"
                  className="text-slate-500 dark:text-slate-400 mt-1"
                >
                  Original: ${originalLoanAmount.toLocaleString()} • Paid:{' '}
                  {principalPaid !== null
                    ? `$${principalPaid.toLocaleString()}`
                    : '$0'}
                </Typography>
              )}
            </div>

            {/* Loan Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Monthly Payment */}
              {totalMonthlyPayment !== null && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <Typography
                    variant="caption"
                    className="text-slate-500 dark:text-slate-400 mb-1 opacity-100"
                  >
                    Monthly Payment
                  </Typography>
                  <Typography
                    variant="h4"
                    className="tabular-nums text-slate-900 dark:text-white"
                  >
                    $
                    {totalMonthlyPayment.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </Typography>
                  {monthlyPAndI && monthlyEscrow && (
                    <Typography
                      variant="overline"
                      className="text-slate-400 mt-1 opacity-100"
                    >
                      P&I: $
                      {monthlyPAndI.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}{' '}
                      + Escrow: $
                      {monthlyEscrow.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                  )}
                </div>
              )}

              {/* Loan Dates */}
              {(startDate || maturityDate) && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <Typography
                    variant="caption"
                    className="text-slate-500 dark:text-slate-400 mb-1 opacity-100"
                  >
                    Loan Timeline
                  </Typography>
                  {startDate && (
                    <Typography
                      variant="body-sm"
                      weight="bold"
                      className="text-slate-900 dark:text-white"
                    >
                      Started: {startDate}
                    </Typography>
                  )}
                  {maturityDate && (
                    <Typography
                      variant="body-sm"
                      weight="bold"
                      className="text-slate-900 dark:text-white mt-1"
                    >
                      Matures: {maturityDate}
                    </Typography>
                  )}
                </div>
              )}
            </div>

            {/* Refi Benchmark Section */}
            {interestRate !== null && (
              <section className="p-6 rounded-[2rem] border-2 border-dashed border-indigo-500/20 bg-indigo-500/5">
                <Typography
                  variant="caption"
                  weight="black"
                  className="text-indigo-400 mb-4 opacity-100"
                >
                  Refi Benchmark
                </Typography>
                <div className="flex justify-between items-center">
                  <div>
                    <Typography
                      variant="h4"
                      className="tabular-nums text-slate-500 line-through"
                    >
                      {marketAverageRate}% Avg
                    </Typography>
                    <Typography
                      variant="caption"
                      weight="bold"
                      className="opacity-40"
                    >
                      Market Today
                    </Typography>
                  </div>
                  <div className="text-right">
                    <Typography
                      variant="body-sm"
                      weight="black"
                      className="text-emerald-500"
                    >
                      {isLowRate ? 'OPTIMAL DEBT' : 'ABOVE MARKET'}
                    </Typography>
                    <Typography
                      variant="caption"
                      weight="bold"
                      className="opacity-40 mt-1"
                    >
                      Current Rate: {interestRate.toFixed(2)}%
                    </Typography>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-indigo-500/10">
                  <Typography
                    variant="overline"
                    weight="bold"
                    className="text-slate-400 italic opacity-100"
                  >
                    {isLowRate
                      ? `"Strategy: Your ${interestRate.toFixed(2)}% rate is high-value leverage. Do not refinance unless pull-out equity is required for next acquisition."`
                      : `"Strategy: Your ${interestRate.toFixed(2)}% rate is above market average. Consider refinancing when rates drop or if you need to pull equity for your next acquisition."`}
                  </Typography>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Manage Loan Button */}
      {hasLoan && (
        <Button
          variant="outline"
          size="lg"
          className="w-full py-4 mt-10 rounded-2xl bg-slate-900 text-white dark:bg-white/5 dark:border dark:border-white/10 dark:text-white dark:hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all"
          onClick={handleAddLoan}
        >
          Manage Loan Data
        </Button>
      )}
    </Card>
  )
}
