import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { FinancialPulse } from '@/components/property-hub/property-details/financials/FinancialPulse'
import { Liquidity } from '@/components/property-hub/property-details/financials/Liquidity'
import { OperatingCore } from '@/components/property-hub/property-details/financials/OperatingCore'
import { DebtLogic } from '@/components/property-hub/property-details/financials/DebtLogic'
import { AcquisitionIntel } from '@/components/property-hub/property-details/financials/AcquisitionIntel'
import { TaxShieldIntel } from '@/components/property-hub/property-details/financials/TaxShieldIntel'
import { MonthlyComparisonChart } from '@/components/property-hub/property-details/financials/MonthlyComparisonChart'
import { PropertyTransactions } from '@/components/property-hub/property-details/financials/PropertyTransactions'
import {
  AddLoanDrawer,
  AddTransactionDrawer,
  BankAccountConnectionDrawer,
  OperatingExpensesDrawer,
  PropertyAcquisitionDrawer,
  RentalIncomeDrawer,
} from '@/components/drawers'
import { useProperty } from '@/hooks/api/useProperties'
import { AsyncLoader } from '@/components/loader/async-loader'

const financialsSearchSchema = z.object({
  drawer: z.string().optional(),
  loanId: z.string().optional(),
  bankAccountId: z.string().optional(),
  transactionId: z.string().optional(),
})

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/financials',
)({
  component: FinancialsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = financialsSearchSchema.safeParse(search)
    if (!parsed.success) {
      return {
        drawer: undefined,
        loanId: undefined,
        bankAccountId: undefined,
        transactionId: undefined,
      }
    }
    return parsed.data
  },
})

function FinancialsPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { propertyId } = Route.useParams()
  const search = Route.useSearch()
  const { data: property, isLoading, error } = useProperty(propertyId)

  const isAddLoanDrawerOpen = search.drawer === 'add-loan'
  const isAcquisitionDrawerOpen = search.drawer === 'acquisition'
  const isBankAccountDrawerOpen = search.drawer === 'connect-bank-account'
  const isOperatingExpensesDrawerOpen = search.drawer === 'operating-expenses'
  const isAddTransactionDrawerOpen = search.drawer === 'add-transaction'
  const isRentalIncomeDrawerOpen = search.drawer === 'rental-income'

  const handleCloseDrawer = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        drawer: undefined,
        loanId: undefined,
        transactionId: undefined,
      }),
      replace: true,
    })
  }

  const handleLoanSuccess = () => {
    // The mutation's onSuccess already handles query invalidation and refetch
    // This callback is called after the mutation completes successfully
    // No additional action needed - React Query will automatically refetch
  }

  if (isLoading) {
    return (
      <AsyncLoader
        isVisible={isLoading}
        duration={4000}
        statuses={[
          'Loading Property Intelligence...',
          'Analyzing Financial Metrics...',
          'Crawling Transaction History...',
          'Computing Yield Projections...',
          'Finalizing Asset Profile...',
        ]}
      />
    )
  }

  if (error || !property) {
    return (
      <div className="p-8 w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">
            Error loading property
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {error instanceof Error ? error.message : 'Property not found'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-8 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Financial Pulse & Liquidity - Top Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FinancialPulse propertyId={propertyId} />
          </div>
          <div className="lg:col-span-1">
            <Liquidity propertyId={propertyId} />
          </div>
        </div>

        {/* Second Row: Operating Core, Acquisition Intel (with Tax Shield below), Debt Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <OperatingCore propertyId={propertyId} />
          <div className="space-y-8">
            <AcquisitionIntel propertyId={propertyId} />
            <TaxShieldIntel propertyId={propertyId} />
          </div>
          <DebtLogic propertyId={propertyId} />
        </div>

        {/* Monthly Comparison Chart */}
        <div className="w-full">
          <MonthlyComparisonChart propertyId={propertyId} />
        </div>

        {/* Historical P&L Registry */}
        <div className="w-full">
          <PropertyTransactions propertyId={propertyId} />
        </div>
      </div>

      <AddLoanDrawer
        isOpen={isAddLoanDrawerOpen}
        onClose={handleCloseDrawer}
        propertyId={propertyId}
        loanId={search.loanId}
        onSuccess={handleLoanSuccess}
      />

      <PropertyAcquisitionDrawer
        isOpen={isAcquisitionDrawerOpen}
        onClose={handleCloseDrawer}
        propertyId={propertyId}
        onSuccess={handleLoanSuccess}
      />

      <BankAccountConnectionDrawer
        isOpen={isBankAccountDrawerOpen}
        onClose={handleCloseDrawer}
        propertyId={propertyId}
        onSuccess={handleLoanSuccess}
      />

      <OperatingExpensesDrawer
        isOpen={isOperatingExpensesDrawerOpen}
        onClose={handleCloseDrawer}
        propertyId={propertyId}
        onSuccess={handleLoanSuccess}
      />

      <AddTransactionDrawer
        isOpen={isAddTransactionDrawerOpen}
        onClose={handleCloseDrawer}
        propertyId={propertyId}
        transactionId={search.transactionId}
        onSuccess={handleLoanSuccess}
      />

      <RentalIncomeDrawer
        isOpen={isRentalIncomeDrawerOpen}
        onClose={handleCloseDrawer}
        propertyId={propertyId}
        onSuccess={handleLoanSuccess}
      />
    </>
  )
}
