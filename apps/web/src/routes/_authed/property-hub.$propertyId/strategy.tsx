import { createFileRoute } from '@tanstack/react-router'
import { Card } from '@axori/ui'

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/strategy',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card variant="rounded" padding="lg" radius="xl">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black uppercase tracking-tighter">
              Strategy DNA Alignment
            </h3>
            <span
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400`}
            >
              Target Acquired
            </span>
          </div>

          <div className="space-y-12">
            <div>
              <div className="flex justify-between items-end mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    Thesis: Cash Flow focus
                  </span>
                  <p className="text-sm font-bold opacity-60">
                    High stability, optimized distributions
                  </p>
                </div>
                <span
                  className={`text-6xl font-black tabular-nums tracking-tighter text-violet-600 dark:text-[#E8FF4D]`}
                >
                  98%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-500/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-violet-600 dark:bg-[#E8FF4D] rounded-full transition-all duration-1000`}
                  style={{ width: '98%' }}
                ></div>
              </div>
            </div>

            <div
              className={`p-8 rounded-[2.5rem] border bg-slate-50 border-slate-200 text-slate-700 shadow-inner dark:bg-black/40 dark:border-white/5 dark:text-white/80 dark:shadow-none`}
            >
              <p className="text-base font-medium leading-relaxed italic">
                "This asset is a foundational yield generator. Current market
                conditions favor a long-term hold to capture full depreciation
                cycle while maintaining 1.6x debt coverage. Recommend ignoring
                short-term neighborhood volatility."
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-[9px] font-black uppercase text-emerald-500 mb-2">
                  Alpha Opportunity
                </p>
                <p className="text-xs font-bold leading-tight">
                  Implement RUBS to increase yield 1.2%
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-[9px] font-black uppercase text-amber-500 mb-2">
                  Risk Mitigation
                </p>
                <p className="text-xs font-bold leading-tight">
                  Renew master insurance before May hike
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          variant="rounded"
          padding="lg"
          radius="xl"
          className="flex flex-col"
        >
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-10">
            Exit Strategy Lab
          </h3>
          <div className="space-y-6 flex-grow">
            {[
              {
                l: 'Primary Path: Hold Indefinitely',
                v: 'Optimal',
                d: 'Focus on maximum yield and cost-segregation tax shielding. ROI maximized at 10-year mark.',
                status: 'Active',
              },
              {
                l: 'Pivot Path: Refi-to-Scale',
                v: 'Target Q3 2026',
                d: 'Projected equity pull of $85k at 5.5% cap. Redeploy into San Antonio SFR corridor.',
                status: 'Watching',
              },
              {
                l: 'Emergency Path: Market Sale',
                v: 'Not Recommended',
                d: 'Immediate liquidation at $440k estimated. High friction cost (6%) destroys 2 years of alpha.',
                status: 'Inactive',
              },
            ].map((ex) => (
              <div
                key={ex.l}
                className={`p-8 rounded-[2.5rem] border transition-all hover:scale-[1.02] cursor-pointer bg-slate-50 border-slate-100 hover:bg-white shadow-sm dark:bg-black/20 dark:border-white/5 dark:hover:bg-white/10 dark:shadow-none`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${ex.status === 'Active' ? 'text-emerald-500' : 'opacity-40'}`}
                    >
                      {ex.status}
                    </span>
                    <span className="text-base font-black uppercase tracking-tight leading-tight">
                      {ex.l}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black`}
                  >
                    {ex.v}
                  </span>
                </div>
                <p className="text-xs font-bold opacity-40 leading-relaxed max-w-[400px]">
                  {ex.d}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-500/10 text-center">
            <button className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity">
              Run Full Scenario Modeler →
            </button>
          </div>
        </Card>
      </div>

      <Card
        variant="rounded"
        padding="lg"
        radius="xl"
        className="bg-black text-white border-none overflow-hidden relative group"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <svg width="240" height="240" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 20V10M18 20V4M6 20v-4" />
          </svg>
        </div>
        <div className="relative z-10">
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">
            "What-If" Sensitivity Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { l: 'Rent +5%', v: '+$2,400/yr', s: 'Cash flow lift' },
              { l: 'Interest +1%', v: '-$3,120/yr', s: 'EBITDA impact' },
              { l: 'Vacancy +2%', v: '-$1,080/yr', s: 'Operational drag' },
              { l: 'Market -10%', v: '-$42.5k', s: 'Equity correction' },
            ].map((i) => (
              <div key={i.l} className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  {i.l}
                </p>
                <p
                  className={`text-2xl font-black tabular-nums tracking-tighter ${i.v.startsWith('+') ? 'text-[#E8FF4D]' : 'text-red-500'}`}
                >
                  {i.v}
                </p>
                <p className="text-[9px] font-bold uppercase opacity-60">
                  {i.s}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
