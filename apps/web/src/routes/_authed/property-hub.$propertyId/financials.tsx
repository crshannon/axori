/**
 * Financials Page - AI Studio Inspired Design
 *
 * 12-column grid layout with financial intelligence components.
 * Drawer opening is handled by individual components using the useDrawer hook.
 *
 * @see AXO-93 - URL-Based Drawer Factory
 */

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { FinancialPulse } from '@/components/property-hub/property-details/financials/FinancialPulse'
import { Liquidity } from '@/components/property-hub/property-details/financials/Liquidity'
import { OperatingCore } from '@/components/property-hub/property-details/financials/OperatingCore'
import { DebtLogic } from '@/components/property-hub/property-details/financials/DebtLogic'
import { TaxShieldIntel } from '@/components/property-hub/property-details/financials/TaxShieldIntel'
import { PropertyTransactions } from '@/components/property-hub/property-details/financials/PropertyTransactions'
import { ReserveTracker } from '@/components/property-hub/property-details/financials/ReserveTracker'
import { EquityVelocity } from '@/components/property-hub/property-details/financials/EquityVelocity'
import { IntelFeed } from '@/components/property-hub/property-details/financials/IntelFeed'
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
    <div className="p-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 12-Column Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Row 1: Financial Pulse (8 cols) | Intel Feed (4 cols) */}
        <div className="col-span-12 lg:col-span-8">
          <FinancialPulse propertyId={propertyId} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <IntelFeed propertyId={propertyId} />
        </div>

        {/* Row 2: Historical P&L Registry (6 cols) | Operating Core (6 cols) */}
        <div className="col-span-12 lg:col-span-8">
          <PropertyTransactions propertyId={propertyId} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <OperatingCore propertyId={propertyId} />
        </div>

        {/* Row 3: Debt Architecture (4 cols) | Equity Velocity (4 cols) | Tax Shield (4 cols) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <DebtLogic propertyId={propertyId} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <EquityVelocity propertyId={propertyId} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <TaxShieldIntel propertyId={propertyId} />
        </div>

        {/* Row 4: Reserve Nodes (6 cols) | Liquidity Reservoir (6 cols) */}
        <div className="col-span-12 lg:col-span-6">
          <ReserveTracker propertyId={propertyId} />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Liquidity propertyId={propertyId} />
        </div>
      </div>
    </div>
  )
}
