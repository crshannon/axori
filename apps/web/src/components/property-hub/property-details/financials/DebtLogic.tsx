import { useEffect } from 'react'
import { Badge, Button, Card, EmptyStateCard, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import type { Loan } from '@axori/shared'
import { generateDebtLogicLearning } from '@/data/learning-hub/loan-snippets'
import { useProperty } from '@/hooks/api/useProperties'
import { useLoanSummary } from '@/hooks/useLoanSummary'
import { usePropertyPermissions } from '@/hooks/api'
import { ReadOnlyBanner } from '@/components/property-hub/ReadOnlyBanner'
import { DRAWERS, useDrawer } from '@/lib/drawer'

interface DebtLogicProps {
  propertyId: string
}

/**
 * DebtLogic component - Displays loan summary and debt architecture
 *
 * @see AXO-93 - Uses drawer factory for opening add/edit loan drawer
 */
export const DebtLogic = ({ propertyId }: DebtLogicProps) => {
  const { openDrawer } = useDrawer()
  const { data: property, isLoading } = useProperty(propertyId)
  const { canEdit, isReadOnly } = usePropertyPermissions(propertyId)

  // Debug: Log loan data when it changes
  useEffect(() => {
    if (property?.loans) {
      const activeLoans = property.loans.filter(
        (loan) => loan.status === 'active',
      )
      console.log(
        '[DebtLogic] Active loans data:',
        activeLoans.map((loan) => ({
          id: loan.id,
          lenderName: loan.lenderName,
          monthlyPrincipalInterest: loan.monthlyPrincipalInterest,
          monthlyEscrow: loan.monthlyEscrow,
          totalMonthlyPayment: loan.totalMonthlyPayment,
        })),
      )
    }
  }, [property?.loans])

  const handleAddLoan = () => {
    openDrawer(DRAWERS.ADD_LOAN, { propertyId })
  }

  const handleEditLoan = (loanId: string) => {
    openDrawer(DRAWERS.ADD_LOAN, { propertyId, loanId })
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

  // Get all active loans (not just primary) and sort with primary first
  const activeLoans =
    property.loans
      ?.filter((loan) => loan.status === 'active')
      .sort((a, b) => {
        // Primary loans first
        if (a.isPrimary && !b.isPrimary) return -1
        if (!a.isPrimary && b.isPrimary) return 1
        // Then by loan position
        return (a.loanPosition || 0) - (b.loanPosition || 0)
      }) || []

  // Loan summary calculations
  const summary = useLoanSummary(activeLoans)

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
  const formatLoanData = (loan: Loan) => {
    const loanBalance = loan.currentBalance ? Number(loan.currentBalance) : null

    const originalLoanAmount = loan.originalLoanAmount
      ? Number(loan.originalLoanAmount)
      : null

    const principalPaid =
      originalLoanAmount && loanBalance
        ? originalLoanAmount - loanBalance
        : null

    // Format interest rate (convert from decimal to percentage for display)
    const interestRate = loan.interestRate
      ? Number(loan.interestRate) * 100
      : null

    const loanTerm = formatLoanTerm(loan.termMonths)

    const monthlyPAndI = loan.monthlyPrincipalInterest
      ? Number(loan.monthlyPrincipalInterest)
      : null

    const monthlyEscrow = loan.monthlyEscrow ? Number(loan.monthlyEscrow) : null

    const totalMonthlyPayment = loan.totalMonthlyPayment
      ? Number(loan.totalMonthlyPayment)
      : monthlyPAndI && monthlyEscrow
        ? monthlyPAndI + monthlyEscrow
        : monthlyPAndI

    const startDate = formatDate(loan.startDate ?? null)
    const maturityDate = formatDate(loan.maturityDate ?? null)

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
        description={
          canEdit
            ? 'Add your first loan to track debt architecture and refinancing opportunities.'
            : 'No loan data has been added to this property yet.'
        }
        buttonText={canEdit ? 'Add Loan' : undefined}
        onButtonClick={canEdit ? handleAddLoan : undefined}
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
            {isReadOnly && <ReadOnlyBanner variant="badge" />}
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

        {/* Loan Summary Totals */}
        {summary.loanCount > 0 && (
          <Card
            variant="rounded"
            padding="sm"
            radius="sm"
            className="mb-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
          >
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="min-w-0">
                <Typography
                  variant="caption"
                  weight="black"
                  className="text-violet-600 dark:text-violet-400 mb-2 block uppercase tracking-widest"
                >
                  Monthly Payment
                </Typography>
                <Typography
                  variant="h3"
                  weight="black"
                  className="tabular-nums text-violet-600 dark:text-violet-400 tracking-tighter break-words font-black"
                >
                  $
                  {summary.totalMonthlyPayment.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </Typography>
              </div>
              <div className="min-w-0">
                <Typography
                  variant="caption"
                  className="text-slate-500 dark:text-slate-400 mb-2 block"
                >
                  Total Debt
                </Typography>
                <Typography
                  variant="h4"
                  className="tabular-nums text-slate-900 dark:text-white tracking-tighter break-words"
                >
                  $
                  {summary.totalDebt.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </Typography>
              </div>
              <div className="min-w-0">
                <Typography
                  variant="caption"
                  className="text-slate-500 dark:text-slate-400 mb-2 block"
                >
                  Weighted Rate
                </Typography>
                <Typography
                  variant="h4"
                  className="tabular-nums text-slate-900 dark:text-white tracking-tighter"
                >
                  {summary.weightedInterestRate.toFixed(2)}%
                </Typography>
              </div>

              <div className="min-w-0">
                <Typography
                  variant="caption"
                  className="text-slate-500 dark:text-slate-400 mb-2 block"
                >
                  Loan Count
                </Typography>
                <Typography
                  variant="h4"
                  className="tabular-nums text-slate-900 dark:text-white tracking-tighter"
                >
                  {summary.loanCount}
                </Typography>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-0">
          {activeLoans.map((loan, index) => {
            const loanData = formatLoanData(loan)
            const isPrimary = loan.isPrimary
            const isLast = index === activeLoans.length - 1
            const isHeloc = loan.loanType === 'heloc'

            return (
              <div key={loan.id}>
                <div
                  className="group relative py-4 px-4 rounded-lg border border-transparent hover:rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/10 hover:shadow-sm cursor-pointer transition-all"
                  onClick={() => handleEditLoan(loan.id)}
                >
                  <div className="space-y-3">
                    {/* Header: Lender Name & Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Typography
                        variant="body-sm"
                        weight="bold"
                        className="text-slate-900 dark:text-white"
                      >
                        {loan.lenderName}
                      </Typography>
                      {isPrimary && (
                        <Badge
                          variant="primary"
                          className="text-[9px] font-black uppercase tracking-wider"
                        >
                          Primary
                        </Badge>
                      )}
                      {isHeloc && (
                        <Badge
                          variant="warning"
                          className="text-[9px] font-black uppercase tracking-wider"
                        >
                          HELOC
                        </Badge>
                      )}
                      {!isPrimary && !isHeloc && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black uppercase tracking-wider"
                        >
                          {loan.loanType}
                        </Badge>
                      )}
                    </div>

                    {/* Main Balance & Interest Rate */}
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <Typography
                          variant="h3"
                          className="tabular-nums text-slate-900 dark:text-white tracking-tighter"
                        >
                          {loanData.loanBalance !== null
                            ? `$${loanData.loanBalance.toLocaleString()}`
                            : 'Not set'}
                        </Typography>
                        {loanData.loanTerm && (
                          <Typography
                            variant="caption"
                            className="text-slate-500 dark:text-slate-400 mt-1"
                          >
                            {loanData.loanTerm}
                          </Typography>
                        )}
                      </div>
                      {loanData.interestRate !== null && (
                        <div className="text-right">
                          <Typography
                            variant="caption"
                            className="text-slate-500 dark:text-slate-400 mb-0.5 block"
                          >
                            Interest Rate
                          </Typography>
                          <Typography
                            variant="body-sm"
                            weight="bold"
                            className="tabular-nums text-slate-900 dark:text-white"
                          >
                            {loanData.interestRate.toFixed(2)}%
                          </Typography>
                        </div>
                      )}
                    </div>

                    {/* Payment Breakdown & Rate Row */}
                    <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 space-y-2">
                      {/* Payment Breakdown - Show for primary loan or if escrow exists */}
                      {(isPrimary || loanData.monthlyEscrow !== null) && (
                        <div className="grid grid-cols-3 gap-3">
                          {loanData.monthlyPAndI !== null && (
                            <div>
                              <Typography
                                variant="caption"
                                className="text-slate-500 dark:text-slate-400 mb-0.5"
                              >
                                P&I
                              </Typography>
                              <Typography
                                variant="body-sm"
                                weight="bold"
                                className="tabular-nums text-slate-900 dark:text-white"
                              >
                                $
                                {loanData.monthlyPAndI.toLocaleString(
                                  undefined,
                                  {
                                    maximumFractionDigits: 0,
                                  },
                                )}
                              </Typography>
                            </div>
                          )}
                          {loanData.monthlyEscrow !== null &&
                            loanData.monthlyEscrow > 0 && (
                              <div>
                                <Typography
                                  variant="caption"
                                  className="text-slate-500 dark:text-slate-400 mb-0.5"
                                >
                                  Escrow
                                </Typography>
                                <Typography
                                  variant="body-sm"
                                  weight="bold"
                                  className="tabular-nums text-slate-900 dark:text-white"
                                >
                                  $
                                  {loanData.monthlyEscrow.toLocaleString(
                                    undefined,
                                    {
                                      maximumFractionDigits: 0,
                                    },
                                  )}
                                </Typography>
                              </div>
                            )}
                          {loanData.totalMonthlyPayment !== null && (
                            <div>
                              <Typography
                                variant="caption"
                                className="text-slate-500 dark:text-slate-400 mb-0.5"
                              >
                                Total
                              </Typography>
                              <Typography
                                variant="body-sm"
                                weight="bold"
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
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fallback: Show simple monthly payment if no breakdown available */}
                      {!isPrimary &&
                        loanData.monthlyEscrow === null &&
                        loanData.totalMonthlyPayment !== null && (
                          <div>
                            <Typography
                              variant="caption"
                              className="text-slate-500 dark:text-slate-400 mb-0.5"
                            >
                              Monthly Payment
                            </Typography>
                            <Typography
                              variant="body-sm"
                              weight="bold"
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
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                {!isLast && activeLoans.length > 1 && (
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-[rgb(var(--color-primary))]/20 dark:via-[rgb(var(--color-primary))]/30 to-transparent my-4" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Manage Loan Button - only show for users with edit permission */}
      {canEdit && (
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
