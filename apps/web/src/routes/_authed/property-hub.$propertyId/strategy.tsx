import { createFileRoute } from '@tanstack/react-router'
import { Card, Typography } from '@axori/ui'
import { StrategyOverview } from '@/components/property-hub/property-details/strategy'
import { usePropertyStrategy } from '@/hooks/api/useStrategy'

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/strategy',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { propertyId } = Route.useParams()
  const { data } = usePropertyStrategy(propertyId)

  const strategy = data?.strategy
  const brrrrPhase = data?.brrrrPhase

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Strategy Overview Card */}
        <StrategyOverview propertyId={propertyId} />

        {/* Exit Strategy Lab - Placeholder for Phase 3 */}
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
            {strategy ? (
              // Show strategy-aligned exit paths when strategy is set
              [
                {
                  l: `Primary Path: ${strategy.exitMethod === 'hold_forever' ? 'Hold Indefinitely' : strategy.exitMethod?.replace(/_/g, ' ') || 'Not Set'}`,
                  v: strategy.exitMethod === 'hold_forever' ? 'Optimal' : 'Active',
                  d: strategy.exitMethod === 'hold_forever'
                    ? 'Focus on maximum yield and cost-segregation tax shielding. ROI maximized at 10-year mark.'
                    : 'Your configured exit strategy path.',
                  status: 'Active',
                },
                {
                  l: 'Pivot Path: Refi-to-Scale',
                  v: 'Future Option',
                  d: 'Cash-out refinance to redeploy capital into additional properties.',
                  status: 'Watching',
                },
                {
                  l: 'Emergency Path: Market Sale',
                  v: 'Not Recommended',
                  d: 'Immediate liquidation option. High friction cost destroys accumulated alpha.',
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
              ))
            ) : (
              // Placeholder when no strategy is set
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                  <span className="text-xl">📊</span>
                </div>
                <Typography
                  variant="body-sm"
                  className="text-slate-500 dark:text-white/60"
                >
                  Set an investment strategy to unlock exit strategy analysis
                </Typography>
              </div>
            )}
          </div>

          {strategy && (
            <div className="mt-10 pt-8 border-t border-slate-500/10 text-center">
              <button className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 hover:opacity-100 transition-opacity">
                Run Full Scenario Modeler →
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* BRRRR Phase Tracker - Only show for BRRRR strategy */}
      {strategy?.primaryStrategy === 'brrrr' && brrrrPhase && (
        <Card variant="rounded" padding="lg" radius="xl">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">
            BRRRR Cycle Progress
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { phase: 'acquisition', label: 'Buy', icon: '🏠' },
              { phase: 'rehab', label: 'Rehab', icon: '🔨' },
              { phase: 'rent', label: 'Rent', icon: '🔑' },
              { phase: 'refinance', label: 'Refi', icon: '💰' },
              { phase: 'stabilized', label: 'Repeat', icon: '🔄' },
            ].map((step, index) => {
              const phases = [
                'acquisition',
                'rehab',
                'rent',
                'refinance',
                'stabilized',
              ]
              const currentIndex = phases.indexOf(brrrrPhase.currentPhase)
              const isComplete = index < currentIndex
              const isCurrent = index === currentIndex

              return (
                <div
                  key={step.phase}
                  className={`p-6 rounded-2xl text-center transition-all ${
                    isComplete
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : isCurrent
                        ? 'bg-amber-500/10 border border-amber-500/30 ring-2 ring-amber-500/20'
                        : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  <span className="text-3xl mb-2 block">{step.icon}</span>
                  <Typography
                    variant="body-sm"
                    className={`font-black uppercase tracking-wider ${
                      isComplete
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isCurrent
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400 dark:text-white/40'
                    }`}
                  >
                    {step.label}
                  </Typography>
                  {isComplete && (
                    <span className="text-emerald-500 text-xs font-bold mt-1 block">
                      ✓ Complete
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-amber-500 text-xs font-bold mt-1 block">
                      In Progress
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Sensitivity Analysis Card */}
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
