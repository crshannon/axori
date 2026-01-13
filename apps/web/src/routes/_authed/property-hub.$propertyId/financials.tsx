import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, Loading } from '@axori/ui'
import { DebtArchitecture } from '@/components/property-hub/property-details/financials/DebtArchitecture'
import { AddLoanDrawer } from '@/components/drawers'
import { useProperty } from '@/hooks/api/useProperties'

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/financials',
)({
  component: FinancialsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      drawer: (search.drawer as string) || undefined,
    }
  },
})

function FinancialsPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { propertyId } = Route.useParams()
  const search = Route.useSearch()
  const { data: property, isLoading, error } = useProperty(propertyId)

  const isAddLoanDrawerOpen = search.drawer === 'add-loan'

  const handleCloseDrawer = () => {
    navigate({
      search: (prev) => ({ ...prev, drawer: undefined }),
      replace: true,
    })
  }

  const handleLoanSuccess = () => {
    // Invalidate property query to refetch loan data
    // TODO: Use react-query invalidation
    // For now, just close the drawer - data will refresh on next navigation
  }

  if (isLoading) {
    return (
      <div className="p-8 w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 dark:border-[#E8FF4D] mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading property...
          </p>
        </div>
      </div>
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
      <div className="p-8 w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card
            variant="rounded"
            padding="lg"
            radius="xl"
            className="lg:col-span-2"
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                P&L Historical Ledger
              </h3>
              <div className="flex gap-2">
                {['6M', '1Y', 'All'].map((t) => (
                  <button
                    key={t}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${t === '6M' ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'opacity-40'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  mo: 'Mar 24',
                  income: 4800,
                  exp: 1100,
                  cash: 3700,
                  status: 'Audited',
                },
                {
                  mo: 'Feb 24',
                  income: 4500,
                  exp: 1240,
                  cash: 3260,
                  status: 'Audited',
                },
                {
                  mo: 'Jan 24',
                  income: 4500,
                  exp: 2800,
                  cash: 1700,
                  status: 'Repair heavy',
                },
              ].map((item) => (
                <div
                  key={item.mo}
                  className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row justify-between md:items-center gap-6 bg-slate-50 border-slate-100 hover:bg-white transition-all shadow-sm dark:bg-black/20 dark:border-white/5 dark:hover:bg-white/5`}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs bg-white shadow-sm dark:bg-white/5 dark:shadow-none`}
                    >
                      {item.mo.split(' ')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">
                        {item.mo}
                      </p>
                      <p className="text-[9px] font-bold uppercase text-slate-500">
                        {item.status}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-8 md:gap-16">
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-500 mb-1">
                        Gross
                      </p>
                      <p className="text-base font-black tabular-nums">
                        ${item.income.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-500 mb-1">
                        Operating
                      </p>
                      <p className="text-base font-black tabular-nums text-red-500">
                        -${item.exp.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase text-slate-500 mb-1">
                        Net Flow
                      </p>
                      <p
                        className={`text-base font-black tabular-nums ${item.cash > 3000 ? 'text-emerald-500' : 'text-amber-500'}`}
                      >
                        +${item.cash.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-indigo-400">
                    YTD Expense Distribution
                  </p>
                  <p className="text-sm font-bold opacity-60">
                    Maintenance represents 42% of leakage.
                  </p>
                </div>
              </div>
              <button className="px-8 py-3 rounded-xl bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                View Breakdown
              </button>
            </div>
          </Card>

          <div className="space-y-8">
            <DebtArchitecture propertyId={propertyId} />

            <Card
              variant="rounded"
              padding="lg"
              radius="xl"
              className="bg-gradient-to-br from-amber-500/10 to-transparent"
            >
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 text-amber-500">
                Tax Shield Intel
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Unclaimed Depreciation
                  </p>
                  <p
                    className={`text-4xl font-black tracking-tighter text-slate-900 dark:text-white`}
                  >
                    $42,100
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="opacity-40">Cost Seg Potential</span>
                    <span className="text-amber-500">High Alpha</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <AddLoanDrawer
        isOpen={isAddLoanDrawerOpen}
        onClose={handleCloseDrawer}
        propertyId={propertyId}
        onSuccess={handleLoanSuccess}
      />
    </>
  )
}
