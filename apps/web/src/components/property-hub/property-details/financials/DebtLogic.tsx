import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyStateCard,
  Typography,
} from '@axori/ui'
import { useNavigate } from '@tanstack/react-router'
import { LearningHubButton } from './LearningHubButton'
import { generateDebtLogicLearning } from '@/data/learning-hub/loan-snippets'
import { useProperty } from '@/hooks/api/useProperties'

interface DebtLogicProps {
  propertyId: string
}

export const DebtLogic = ({ propertyId }: DebtLogicProps) => {
  const navigate = useNavigate()
  const { data: property, isLoading } = useProperty(propertyId)

  const handleAddLoan = () => {
    navigate({
      to: '/property-hub/$propertyId/financials',
      params: { propertyId },
      search: (prev) => ({
        ...prev,
        drawer: 'add-loan',
        loanId: undefined,
        bankAccountId: undefined,
      }),
    })
  }

  const handleEditLoan = (loanId: string) => {
    navigate({
      to: '/property-hub/$propertyId/financials',
      params: { propertyId },
      search: (prev) => ({
        ...prev,
        drawer: 'add-loan',
        loanId,
        bankAccountId: undefined,
      }),
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

  // Get all active loans (not just primary)
  const activeLoans =
    property.loans?.filter((loan) => loan.status === 'active') || []

  // Helper functions
  const formatLoanTerm = (termMonths: number | null | undefined) => {
    if (!termMonths) return null
    const years = termMonths / 12
    if (years === 15) return '15-year fixed'
    if (years === 30) return '30-year fixed'
    if (years === 20) return '20-year fixed'
    return `${termMonths}-month`
  }

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

  // Format a single loan's data for display
  const formatLoanData = (loan: any) => {
    const loanBalance = loan?.currentBalance
      ? Number(loan.currentBalance)
      : null

    const originalLoanAmount = loan?.originalLoanAmount
      ? Number(loan.originalLoanAmount)
      : null

    const principalPaid =
      originalLoanAmount && loanBalance
        ? originalLoanAmount - loanBalance
        : null

    // Format interest rate (convert from decimal to percentage for display)
    const interestRate = loan?.interestRate
      ? Number(loan.interestRate) * 100
      : null

    const loanTerm = formatLoanTerm(loan?.termMonths ?? null)

    const monthlyPAndI = loan?.monthlyPrincipalInterest
      ? Number(loan.monthlyPrincipalInterest)
      : null

    const monthlyEscrow = loan?.monthlyEscrow
      ? Number(loan.monthlyEscrow)
      : null

    const totalMonthlyPayment = loan?.totalMonthlyPayment
      ? Number(loan.totalMonthlyPayment)
      : monthlyPAndI && monthlyEscrow
        ? monthlyPAndI + monthlyEscrow
        : monthlyPAndI

    const startDate = formatDate(loan?.startDate ?? null)
    const maturityDate = formatDate(loan?.maturityDate ?? null)

    return {
      loan,
      loanBalance,
      originalLoanAmount,
      principalPaid,
      interestRate,
      loanTerm,
      monthlyPAndI,
      monthlyEscrow,
      totalMonthlyPayment,
      startDate,
      maturityDate,
    }
  }

  // Market average rate for comparison (6.5%)
  const marketAverageRate = 6.5

  // Get primary loan for learning content
  const primaryLoan = activeLoans.find((loan) => loan.isPrimary)
  const primaryLoanData = primaryLoan ? formatLoanData(primaryLoan) : null

  // Generate learning snippets based on loan data
  const learningSnippets =
    primaryLoanData !== null && primaryLoanData.interestRate !== null
      ? generateDebtLogicLearning(
          primaryLoanData.interestRate,
          marketAverageRate,
        )
      : []

  const hasLoan = activeLoans.length > 0

  // Empty state - no loan data
  if (!hasLoan) {
    return (
      <EmptyStateCard
        title="Debt Logic"
        statusMessage="No Active Loans"
        description="Add your first loan to track debt architecture and refinancing opportunities."
        buttonText="Add Loan"
        onButtonClick={handleAddLoan}
        variant="slate"
      />
    )
  }

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="flex flex-col justify-between group relative overflow-hidden"
    >
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Typography variant="h5">Debt Logic</Typography>
          <div className="flex items-center gap-3">
            <LearningHubButton
              snippets={learningSnippets}
              title="Debt Logic Learning Hub"
              subtitle="Strategic insights for loan management"
              componentKey="debt-logic"
            />
            {primaryLoanData !== null &&
              primaryLoanData.interestRate !== null &&
              primaryLoanData.interestRate < marketAverageRate && (
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
        </div>

        <div className="space-y-6">
          {activeLoans.map((loan) => {
            const loanData = formatLoanData(loan)
            const isPrimary = loan.isPrimary

            return (
              <Card
                key={loan.id}
                variant="rounded"
                padding="sm"
                radius="lg"
                className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 cursor-pointer hover:border-slate-300 dark:hover:border-white/10 transition-all"
                onClick={() => handleEditLoan(loan.id)}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Typography
                        variant="body-sm"
                        weight="bold"
                        className="text-slate-400 uppercase tracking-widest"
                      >
                        {loan.lenderName} •{' '}
                        {loanData.loanTerm ?? 'Term not set'}
                      </Typography>
                      {isPrimary && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-white/5">
                      <Typography
                        variant="caption"
                        className="text-slate-600 dark:text-slate-400 opacity-100"
                      >
                        {loan.loanType}
                      </Typography>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {/* Main Balance */}
                  <div className="mb-4">
                    <Typography
                      variant="h3"
                      className="tabular-nums text-slate-900 dark:text-white"
                    >
                      {loanData.loanBalance !== null
                        ? `$${loanData.loanBalance.toLocaleString()}`
                        : 'Not set'}
                    </Typography>
                    {loanData.originalLoanAmount && loanData.loanBalance && (
                      <Typography
                        variant="body-sm"
                        className="text-slate-500 dark:text-slate-400 mt-1"
                      >
                        Original: $
                        {loanData.originalLoanAmount.toLocaleString()} • Paid:{' '}
                        {loanData.principalPaid !== null
                          ? `$${loanData.principalPaid.toLocaleString()}`
                          : '$0'}
                      </Typography>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-white/5 pt-3">
                    {/* Monthly Payment */}
                    {loanData.totalMonthlyPayment !== null && (
                      <div>
                        <Typography
                          variant="caption"
                          className="text-slate-500 dark:text-slate-400 mb-0.5 opacity-100"
                        >
                          Monthly Payment
                        </Typography>
                        <Typography
                          variant="h5"
                          className="tabular-nums text-slate-900 dark:text-white"
                        >
                          $
                          {loanData.totalMonthlyPayment.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 0,
                            },
                          )}
                        </Typography>
                        {loanData.monthlyPAndI && loanData.monthlyEscrow && (
                          <Typography
                            variant="overline"
                            className="text-slate-400 mt-0.5 opacity-100"
                          >
                            P&I: $
                            {loanData.monthlyPAndI.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}{' '}
                            + Escrow: $
                            {loanData.monthlyEscrow.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </Typography>
                        )}
                      </div>
                    )}

                    {/* Start Date */}
                    {loanData.startDate && (
                      <div>
                        <Typography
                          variant="caption"
                          className="text-slate-500 dark:text-slate-400 mb-0.5 opacity-100"
                        >
                          Start Date
                        </Typography>
                        <Typography
                          variant="h5"
                          className="tabular-nums text-slate-900 dark:text-white"
                        >
                          {loanData.startDate}
                        </Typography>
                      </div>
                    )}

                    {/* Maturity Date */}
                    {loanData.maturityDate && (
                      <div>
                        <Typography
                          variant="caption"
                          className="text-slate-500 dark:text-slate-400 mb-0.5 opacity-100"
                        >
                          Maturity
                        </Typography>
                        <Typography
                          variant="h5"
                          className="tabular-nums text-slate-900 dark:text-white"
                        >
                          {loanData.maturityDate}
                        </Typography>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Manage Loan Button */}
      <Button
        variant="outline"
        size="lg"
        className="w-full py-4 mt-10 rounded-2xl bg-slate-900 text-white dark:bg-white/5 dark:border dark:border-white/10 dark:text-white dark:hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all"
        onClick={handleAddLoan}
      >
        Manage Loan Data
      </Button>
    </Card>
  )
}
