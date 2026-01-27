import { useEffect } from 'react'
import { Badge, Button, Card, EmptyStateCard, Typography } from '@axori/ui'
import { LearningHubButton } from './LearningHubButton'
import type { Loan } from '@axori/shared'
import { usePropertyPermissions } from '@/hooks/api'
import { useProperty } from '@/hooks/api/useProperties'
import { useLoanSummary } from '@/hooks/useLoanSummary'
import { DRAWERS, useDrawer } from '@/lib/drawer'
import { generateDebtLogicLearning } from '@/data/learning-hub/loan-snippets'

interface DebtLogicProps {
  propertyId: string
}

/**
 * DebtLogic component - Debt Architecture display
 *
 * Shows total leverage, weighted rate, and loan breakdown.
 * @see AXO-93 - Uses drawer factory for opening add/edit loan drawer
 */
export const DebtLogic = ({ propertyId }: DebtLogicProps) => {
  const { openDrawer } = useDrawer()
  const { data: property, isLoading } = useProperty(propertyId)
  const { canEdit } = usePropertyPermissions(propertyId)

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

  const handleManageStack = () => {
    openDrawer(DRAWERS.ADD_LOAN, { propertyId })
  }

  const handleEditLoan = (loanId: string) => {
    openDrawer(DRAWERS.ADD_LOAN, { propertyId, loanId })
  }

  if (isLoading || !property) {
    return (
      <Card variant="rounded" padding="lg" radius="xl" className="h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-white/5 rounded" />
          <div className="h-20 bg-slate-200 dark:bg-white/5 rounded-xl" />
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

  // Get primary loan for display
  const primaryLoan = activeLoans.find((loan) => loan.isPrimary)
  const primaryLoanData = primaryLoan ? formatLoanData(primaryLoan) : null

  const hasLoan = activeLoans.length > 0

  // Check if refinance opportunity exists (rate above market)
  const hasRefinanceOpportunity =
    primaryLoanData?.interestRate &&
    primaryLoanData.interestRate > marketAverageRate

  // Empty state - no loan data
  if (!hasLoan) {
    return (
      <EmptyStateCard
        title="Debt Architecture"
        statusMessage="No Active Loans"
        description={
          canEdit
            ? 'Add your first loan to track debt architecture and refinancing opportunities.'
            : 'No loan data has been added to this property yet.'
        }
        buttonText={canEdit ? 'Add Loan' : undefined}
        onButtonClick={canEdit ? handleManageStack : undefined}
        variant="slate"
        className="h-full"
      />
    )
  }

  return (
    <Card
      variant="rounded"
      padding="lg"
      radius="xl"
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
          <Typography
            variant="h6"
            className="uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Debt Architecture
          </Typography>
          <LearningHubButton
            snippets={generateDebtLogicLearning(
              primaryLoanData?.interestRate ?? null,
              marketAverageRate,
            )}
            title="Debt Architecture"
            subtitle="Loan Management & Refinancing Strategy"
            componentKey="debt-logic"
          />
        </div>
        {hasRefinanceOpportunity ? (
          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            REFINANCE
          </span>
        ) : (
          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
            Secured
          </span>
        )}
      </div>

      {/* Total Leverage */}
      <div className="mb-6">
        <Typography
          variant="caption"
          className="text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2"
        >
          Total Leverage
        </Typography>
        <Typography
          variant="h2"
          className="tabular-nums text-slate-900 dark:text-white tracking-tighter"
        >
          $
          {summary.totalDebt.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
        </Typography>
        <Typography
          variant="caption"
          className="text-slate-400 dark:text-slate-500 mt-1 block"
        >
          {summary.weightedInterestRate.toFixed(2)}% weighted rate •{' '}
          {summary.loanCount} {summary.loanCount === 1 ? 'loan' : 'loans'}
        </Typography>
      </div>

      {/* Primary Loan Card */}
      {primaryLoanData && (
        <div
          className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all"
          onClick={() => handleEditLoan(primaryLoan.id)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Typography
                variant="body-sm"
                weight="bold"
                className="text-slate-900 dark:text-white"
              >
                {primaryLoan.lenderName}
              </Typography>
              <Badge
                variant="primary"
                className="text-[9px] font-black uppercase tracking-wider"
              >
                Primary
              </Badge>
            </div>
            {primaryLoanData.interestRate !== null && (
              <Typography
                variant="body-sm"
                weight="bold"
                className="tabular-nums text-slate-900 dark:text-white"
              >
                {primaryLoanData.interestRate.toFixed(2)}%
              </Typography>
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <Typography
              variant="h4"
              className="tabular-nums text-slate-900 dark:text-white"
            >
              ${primaryLoanData.loanBalance?.toLocaleString() ?? 'N/A'}
            </Typography>
            {primaryLoanData.totalMonthlyPayment !== null && (
              <Typography
                variant="caption"
                className="text-slate-400 dark:text-slate-500"
              >
                $
                {primaryLoanData.totalMonthlyPayment.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                /mo
              </Typography>
            )}
          </div>
        </div>
      )}

      {/* Secondary Loans */}
      {activeLoans.filter((l) => !l.isPrimary).length > 0 && (
        <div className="mt-4 space-y-2">
          {activeLoans
            .filter((l) => !l.isPrimary)
            .map((loan) => {
              const loanData = formatLoanData(loan)
              return (
                <div
                  key={loan.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer transition-all"
                  onClick={() => handleEditLoan(loan.id)}
                >
                  <div className="flex items-center gap-2">
                    <Typography
                      variant="body-sm"
                      className="text-slate-600 dark:text-slate-400"
                    >
                      {loan.lenderName}
                    </Typography>
                    <Badge
                      variant="outline"
                      className="text-[8px] font-black uppercase tracking-wider"
                    >
                      {loan.loanType === 'heloc' ? 'HELOC' : loan.loanType}
                    </Badge>
                  </div>
                  <Typography
                    variant="body-sm"
                    className="tabular-nums text-slate-600 dark:text-slate-400"
                  >
                    ${loanData.loanBalance?.toLocaleString() ?? 'N/A'}
                  </Typography>
                </div>
              )
            })}
        </div>
      )}

      {/* Manage Stack Button */}
      {canEdit && (
        <Button
          variant="outline"
          size="lg"
          className="w-full py-4 mt-auto pt-6 rounded-2xl bg-slate-900 text-white dark:bg-white/5 dark:border dark:border-white/10 dark:text-white dark:hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all"
          onClick={handleManageStack}
        >
          Manage Stack
        </Button>
      )}
    </Card>
  )
}
