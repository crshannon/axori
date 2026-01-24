/**
 * Financials Page
 *
 * Property financial metrics and transaction management. Drawers are handled
 * by the DrawerProvider at the root level - this page only needs to render
 * the financial components.
 *
 * Drawer opening is handled by individual components using the useDrawer hook
 * or navigate to add ?drawer=<name>&propertyId=<id> to the URL.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 */

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { FinancialPulse } from '@/components/property-hub/property-details/financials/FinancialPulse'
import { Liquidity } from '@/components/property-hub/property-details/financials/Liquidity'
import { OperatingCore } from '@/components/property-hub/property-details/financials/OperatingCore'
import { DebtLogic } from '@/components/property-hub/property-details/financials/DebtLogic'
import { AcquisitionIntel } from '@/components/property-hub/property-details/financials/AcquisitionIntel'
import { TaxShieldIntel } from '@/components/property-hub/property-details/financials/TaxShieldIntel'
import { MonthlyComparisonChart } from '@/components/property-hub/property-details/financials/MonthlyComparisonChart'
import { PropertyTransactions } from '@/components/property-hub/property-details/financials/PropertyTransactions'
import { useProperty } from '@/hooks/api/useProperties'
import { AsyncLoader } from '@/components/loader/async-loader'

/**
 * Search schema for financials page
 * Drawer params are handled by the global DrawerProvider
 */
const financialsSearchSchema = z.object({
  drawer: z.string().optional(),
  propertyId: z.string().optional(),
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
      return {}
    }
    return parsed.data
  },
})

function FinancialsPage() {
  const { propertyId } = Route.useParams()
  const { data: property, isLoading, error } = useProperty(propertyId)

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
    /* Drawers are rendered by DrawerProvider at root level based on URL params */
  )
}
