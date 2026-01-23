import { cn } from '@axori/ui'
import { createFileRoute } from '@tanstack/react-router'
import { usePropertyPermissions } from '@/hooks/api'

export const Route = createFileRoute('/_authed/property-hub/$propertyId/legal')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  const { propertyId } = Route.useParams()
  const { canEdit } = usePropertyPermissions(propertyId)

  const cardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-sm',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div
        className={`${cardClass} relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/40 dark:to-transparent`}
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <svg width="300" height="300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
          </svg>
        </div>

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-16 relative z-10">
          <div>
            <h3 className="text-4xl font-black uppercase tracking-tighter mb-2">
              Legal Climate Radar
            </h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              Jurisdiction: Travis County / City of Austin
            </p>
          </div>
          <div
            className={`px-8 py-4 rounded-3xl backdrop-blur-md flex items-center gap-6 border-2 bg-white border-indigo-100 shadow-xl shadow-indigo-100/50 dark:shadow-black/10 dark:bg-black/40 dark:border-indigo-500/20`}
          >
            <div>
              <p className="text-[9px] font-black uppercase opacity-40">
                Local Risk Level
              </p>
              <p className="text-2xl font-black text-emerald-500 tracking-tighter uppercase">
                Favorable
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="m22 10-6-6m0 0-6 6m6-6v18c-5 0-10-5-10-10s5-10 10-10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
          {[
            {
              l: 'Zoning Code',
              v: 'MF-3-NP',
              s: 'Multifamily (Medium Density). Neighborhood Plan overlay allows for ADU development.',
              c: 'text-indigo-400',
            },
            {
              l: 'Rent Regulation',
              v: 'Pre-empted',
              s: 'Texas State Law Section 214.001 pre-empts local rent control ordinances.',
              c: 'text-emerald-500',
            },
            {
              l: 'Tax Volatility',
              v: 'Elevated',
              s: 'Homestead cap does not apply to non-owner occupied. Forecast +12% YoY.',
              c: 'text-amber-500',
            },
          ].map((item) => (
            <div key={item.l} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full bg-current opacity-20"></div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">
                  {item.l}
                </p>
              </div>
              <p
                className={`text-4xl font-black uppercase tabular-nums tracking-tighter ${item.c}`}
              >
                {item.v}
              </p>
              <p className="text-sm font-medium leading-relaxed opacity-60 italic max-w-[280px]">
                "{item.s}"
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={cardClass}>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8">
            Public Hearing Watch
          </h3>
          <div className="space-y-6">
            {[
              {
                date: 'Apr 12',
                event: 'Short Term Rental Ordinance Review',
                impact: 'Moderate Risk',
                color: 'text-amber-500',
              },
              {
                date: 'May 04',
                event: 'City Council: Zoning Density Uplift',
                impact: 'High Opportunity',
                color: 'text-emerald-500',
              },
            ].map((h) => (
              <div
                key={h.event}
                className={`p-6 rounded-[2.5rem] border flex justify-between items-center bg-slate-50 border-slate-200 shadow-sm dark:bg-white/5 dark:border-white/5`}
              >
                <div className="flex items-center gap-6">
                  <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black bg-white shadow-xs dark:bg-white/5`}
                  >
                    <span className="text-[8px] opacity-40">
                      {h.date.split(' ')[0]}
                    </span>
                    <span className="text-sm leading-none">
                      {h.date.split(' ')[1]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">
                      {h.event}
                    </p>
                    <p
                      className={`text-[9px] font-black uppercase tracking-widest ${h.color}`}
                    >
                      {h.impact}
                    </p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full border border-slate-500/20 flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8">
            Asset Compliance Status
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Rental License',
                status: 'Valid (Exp 2026)',
                icon: 'check',
              },
              { label: 'Fire Safety', status: 'Inspection Due', icon: 'warn' },
              { label: 'Lead Paint', status: 'Certified', icon: 'check' },
              {
                label: 'Liability Ins.',
                status: 'Policy Active',
                icon: 'check',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`p-5 rounded-3xl flex items-center gap-4 bg-slate-50 shadow-inner dark:bg-white/5`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.icon === 'check' ? 'text-emerald-500' : 'text-amber-500'}`}
                >
                  {stat.icon === 'check' ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase opacity-40">
                    {stat.label}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-tight">
                    {stat.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {canEdit && (
            <button className="w-full mt-8 py-4 rounded-2xl bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-500/20">
              Run Compliance Audit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
