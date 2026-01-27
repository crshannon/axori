import { cn } from '@axori/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { PropertyScoreGauge } from '@/components/property-hub'
import { usePropertyPermissions } from '@/hooks/api'

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/management',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { propertyId } = Route.useParams()
  const { canEdit } = usePropertyPermissions(propertyId)
  const [mgmtToggle, setMgmtToggle] = useState<'Self' | 'PM'>('Self')

  const prop = {
    pmCompany: 'Property Management Company',
  }

  const cardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-sm',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  return (
    <div className="p-8 w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">
            Operational Hub
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              Active Ops Mode:
            </span>
            <div className="flex p-1 rounded-xl bg-slate-500/10 backdrop-blur-md">
              {(['Self', 'PM'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setMgmtToggle(v)}
                  className={`px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mgmtToggle === v ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                >
                  {v === 'Self' ? 'Self-Managed' : 'Property Manager'}
                </button>
              ))}
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 shadow-xs dark:border-white/10 dark:hover:bg-white/5">
              {mgmtToggle === 'Self'
                ? 'Bulk Lease Send'
                : 'PM Performance Audit'}
            </button>
            <button className="px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest bg-violet-600 text-white shadow-xl hover:scale-105 shadow-violet-200 dark:bg-[#E8FF4D] dark:text-black dark:shadow-none">
              {mgmtToggle === 'Self'
                ? 'Open Maintenance CRM'
                : 'Reconcile PM Statement'}
            </button>
          </div>
        )}
      </div>

      {mgmtToggle === 'Self' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className={`${cardClass} lg:col-span-8 flex flex-col`}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                Unit Ledger & Rent Roll
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500">
                  Real-Time Sync
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              {[
                {
                  unit: 'Unit A',
                  tenant: 'Sarah J.',
                  status: 'Paid',
                  date: 'Mar 01',
                  amount: '$2,100',
                  trend: 'up',
                },
                {
                  unit: 'Unit B',
                  tenant: 'Michael R.',
                  status: 'Pending',
                  date: 'Mar 05',
                  amount: '$1,850',
                  trend: 'stable',
                },
                {
                  unit: 'Unit C',
                  tenant: 'Derrick W.',
                  status: 'Grace Period',
                  date: 'Mar 02',
                  amount: '$2,100',
                  trend: 'down',
                },
                {
                  unit: 'Unit D',
                  tenant: 'Elena S.',
                  status: 'Paid',
                  date: 'Mar 01',
                  amount: '$1,900',
                  trend: 'up',
                },
              ].map((t) => (
                <div
                  key={t.unit}
                  className="p-6 rounded-[2.5rem] border flex items-center justify-between group hover:scale-[1.01] transition-all bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md dark:bg-black/20 dark:border-white/5 dark:hover:border-white/20"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs bg-white shadow-xs dark:bg-white/5">
                      {t.unit.slice(-1)}
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">
                        {t.tenant}
                      </p>
                      <p className="text-[9px] font-bold uppercase opacity-40">
                        {t.unit} • Auto-Pay On
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-16">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] font-black uppercase opacity-40 mb-1">
                        Last Paid
                      </p>
                      <p className="text-xs font-black">{t.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase opacity-40 mb-1">
                        Status
                      </p>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          t.status === 'Paid'
                            ? 'text-emerald-500'
                            : t.status === 'Pending'
                              ? 'text-amber-500'
                              : 'text-red-500'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="text-right w-20">
                      <p className="text-[9px] font-black uppercase opacity-40 mb-1">
                        Amount
                      </p>
                      <span className="text-base font-black tabular-nums">
                        {t.amount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {canEdit && (
              <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="py-6 rounded-3xl border-2 border-dashed font-black text-[10px] uppercase tracking-widest transition-all border-slate-200 hover:border-slate-400 text-slate-400 hover:text-slate-600 dark:border-white/10 dark:hover:border-white/30 dark:text-white/40 dark:hover:text-white">
                  + Deploy New Lease
                </button>
                <button className="py-6 rounded-3xl border-2 border-dashed font-black text-[10px] uppercase tracking-widest transition-all border-slate-200 hover:border-slate-400 text-slate-400 hover:text-slate-600 dark:border-white/10 dark:hover:border-white/30 dark:text-white/40 dark:hover:text-white">
                  Invite Unit to Axori Pay
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className={cardClass}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  Active Tickets
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              </div>
              <div className="space-y-6">
                <div className="p-6 rounded-[2rem] border-2 bg-red-500/5 border-red-500/20">
                  <p className="text-[9px] font-black uppercase text-red-500 mb-2">
                    High Priority • Unit A
                  </p>
                  <h4 className="text-sm font-black uppercase tracking-tight mb-4 leading-tight">
                    HVAC Compressor Malfunction
                  </h4>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button className="flex-grow py-3 rounded-xl bg-red-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20">
                        Dispatch Pro
                      </button>
                      <button className="px-4 rounded-xl border border-red-500/20 bg-white dark:bg-white/5">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-red-500"
                        >
                          <path d="M15 3h6v6" />
                          <path d="M10 14L21 3" />
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6 rounded-[2rem] border bg-slate-50 border-slate-100 opacity-50 dark:bg-white/5 dark:border-white/5">
                  <p className="text-[9px] font-black uppercase mb-1">
                    Completed Yesterday
                  </p>
                  <p className="text-xs font-bold uppercase">
                    Minor Plumb - Unit D
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`${cardClass} bg-indigo-500/5 border-indigo-500/20 flex flex-col justify-between`}
            >
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-indigo-400">
                  Lease Health AI
                </h3>
                <p className="text-xs font-bold leading-relaxed opacity-60 mb-8">
                  Market trends suggest a <strong>$125/mo</strong> upside for
                  Unit B renewal in May. Axori auto-notifier is queued.
                </p>
              </div>
              {canEdit && (
                <button className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                  Enable Auto-Renew Logic
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className={`${cardClass} lg:col-span-5 flex flex-col gap-10`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">
                PRIMARY PARTNER
              </p>
              <h3 className="text-4xl font-black uppercase tracking-tighter mb-2">
                {prop.pmCompany}
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase">
                  Institutional Tier
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 text-[8px] font-black uppercase tracking-widest">
                  7.5% Management Fee
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-8 rounded-[2.5rem] border bg-slate-50 border-slate-200 shadow-inner dark:bg-white/5 dark:border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Oversight Score
                  </h4>
                  <span className="text-emerald-500 font-black text-xs">
                    Exceeding Kpis
                  </span>
                </div>
                <div className="flex items-end justify-between gap-8">
                  <div className="flex-shrink-0">
                    <PropertyScoreGauge score={94} size="sm" />
                  </div>
                  <div className="flex-grow space-y-3">
                    {[
                      { l: 'Response Time', v: '98%', c: 'bg-emerald-500' },
                      { l: 'Expense Control', v: '82%', c: 'bg-emerald-500' },
                      { l: 'Tenant Health', v: '91%', c: 'bg-emerald-500' },
                    ].map((item) => (
                      <div key={item.l} className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase">
                          <span className="opacity-40">{item.l}</span>
                          <span>{item.v}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-500/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.c} rounded-full`}
                            style={{ width: item.v }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button className="w-full py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all border-slate-200 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5">
                Request Full Performance Audit
              </button>
            </div>
          </div>

          <div className={`${cardClass} lg:col-span-7 flex flex-col`}>
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">
                  Statement Reconciliation
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Cross-referencing reported vs actuals
                </p>
              </div>
              <span className="px-4 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                AppFolio API Connected
              </span>
            </div>

            <div className="space-y-4 mb-10">
              {[
                {
                  mo: 'February 2024',
                  status: 'Perfect Match',
                  income: '$8,400',
                  exp: '$2,140',
                  color: 'text-emerald-500',
                },
                {
                  mo: 'January 2024',
                  status: 'Audit Req. ($140 Delta)',
                  income: '$8,400',
                  exp: '$2,850',
                  color: 'text-amber-500',
                },
                {
                  mo: 'December 2023',
                  status: 'Verified',
                  income: '$8,200',
                  exp: '$1,980',
                  color: 'text-emerald-500',
                },
              ].map((s) => (
                <div
                  key={s.mo}
                  className="p-6 rounded-[2rem] border flex items-center justify-between bg-slate-50 border-slate-100 dark:bg-white/5 dark:border-white/5"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">
                      {s.mo}
                    </p>
                    <p
                      className={`text-[9px] font-black uppercase tracking-widest mt-1 ${s.color}`}
                    >
                      {s.status}
                    </p>
                  </div>
                  <div className="flex gap-10 text-right">
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-30 mb-1">
                        Distributions
                      </p>
                      <p className="text-sm font-black tabular-nums">
                        {s.income}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-slate-500/20 flex items-center justify-center opacity-30 hover:opacity-100 cursor-pointer transition-opacity">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-[3rem] border border-indigo-500/20 bg-indigo-500/5 mt-auto relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:rotate-12 transition-transform">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h4 className="text-xl font-black uppercase tracking-tighter mb-4 text-indigo-400">
                Communication Proxy Shield
              </h4>
              <p className="text-xs font-bold leading-relaxed opacity-60 mb-6">
                Axori AI is currently intercepting and logging all PM
                correspondence. You are only alerted for capital calls over{' '}
                <strong>$1,000</strong>.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Active
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-20">
                  Last Scanned: 12m ago
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
