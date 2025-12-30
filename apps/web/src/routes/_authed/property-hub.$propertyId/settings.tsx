import { cn } from '@axori/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/settings',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const cardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-sm',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  const labelClass = `text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-2`
  const inputClass = `w-full px-6 py-4 rounded-2xl text-sm font-bold border outline-none transition-all bg-slate-50 border-slate-200 focus:border-violet-300 dark:bg-white/5 dark:border-white/5 dark:focus:border-[#E8FF4D]/30 dark:text-white`

  const prop = {
    nickname: 'The Golden Goose',
    addr: '123 Main St, Austin, TX 78701',
    thesis: 'Cash Flow Optimization',
    currency: 'USD ($)',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    taxJurisdiction: 'Travis County CAD',
    currencyOverride: 'Portfolio Default (USD)',
    purchasePrice: '$425,000',
    closingDate: '2021-04-12',
    yearBuilt: '2021',
    yieldMaximization: 'Yield Maximization',
    equityGrowth: 'Equity Growth',
    capitalRecirculation: 'Capital Recirculation',
    collaborators: [
      { name: 'John Doe', role: 'Owner', status: 'Active' },
      { name: 'Jane Doe', role: 'Co-Owner', status: 'Active' },
    ],
    type: 'single-family',
    notificationEngine: [
      {
        id: 'email',
        label: 'Fiscal Ledger Digest',
        sub: 'Weekly P&L Summaries',
      },
      {
        id: 'sms',
        label: 'Operational Emergency',
        sub: 'Immediate Repairs/Calls',
      },
      {
        id: 'push',
        label: 'Legal Climate Shift',
        sub: 'Zoning & Regulatory Updates',
      },
    ],
    calculationPresumptions: [
      { l: 'Vacancy Reserve', v: '5.0%', d: 'Calculated from Gross' },
    ],
    cloudConnect: [
      {
        id: 'appfolio',
        label: 'AppFolio Active',
        sub: 'Stream: AppFolio Active',
      },
    ],
    dangerZone: [
      {
        t: 'Archive Asset',
        d: 'Move this property to the historical archive. Recalculates portfolio aggregates but preserves documents.',
        b: 'Confirm Archival',
      },
      {
        t: 'Purge Fiscal Logs',
        d: 'Delete all extracted P&L metadata, OCR receipts, and expense histories. Irreversible.',
        b: 'Purge Logs',
        danger: true,
      },
      {
        t: 'Self-Destruct',
        d: 'Complete deletion of property profile, document vault, and intelligence mapping.',
        b: 'Destroy Asset',
        danger: true,
      },
    ],
  }
  const [notifs, setNotifs] = useState({ email: true, sms: false, push: true })

  const [collaborators] = useState([
    { name: 'Sarah Jenkins', role: 'Partner', status: 'Active' },
    { name: 'Michael Ross', role: 'CPA', status: 'View Only' },
  ])

  return (
    <div className="p-8 w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Column: Configuration & Collaboration */}
        <div className="lg:col-span-8 space-y-8">
          {/* Asset Configuration */}
          <div className={cardClass}>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-10">
              Asset Configuration
            </h3>
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className={labelClass}>Property Nickname</label>
                  <input
                    type="text"
                    defaultValue={prop.nickname}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Property Type</label>
                  <select defaultValue={prop.type} className={inputClass}>
                    <option value="multi-family">Multi-Family Duplex</option>
                    <option value="single-family">
                      Single Family Residential
                    </option>
                    <option value="commercial-retail">
                      Commercial - Retail
                    </option>
                    <option value="industrial-flex">Industrial Flex</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>Street Address</label>
                  <input
                    type="text"
                    defaultValue={prop.addr}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      defaultValue={prop.city}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>State / Region</label>
                    <input
                      type="text"
                      defaultValue={prop.state}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Zip Code</label>
                    <input
                      type="text"
                      defaultValue={prop.zip}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-500/10 dark:border-white/5">
                <div className="space-y-1.5">
                  <label className={labelClass}>Tax Jurisdiction</label>
                  <input
                    type="text"
                    defaultValue="Travis County CAD"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Currency Override</label>
                  <select className={inputClass}>
                    <option>Portfolio Default (USD)</option>
                    <option>Local (CAD)</option>
                    <option>Local (EUR)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Acquisition Metadata */}
          <div className={cardClass}>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-10">
              Acquisition Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className={labelClass}>Purchase Price ($)</label>
                <input
                  type="text"
                  defaultValue="$425,000"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Closing Date</label>
                <input
                  type="date"
                  defaultValue="2021-04-12"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Year Built</label>
                <input
                  type="text"
                  defaultValue={prop.yearBuilt}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Asset DNA Calibration */}
          <div
            className={`${cardClass} bg-gradient-to-br from-indigo-500/5 to-transparent`}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                Asset DNA Calibration
              </h3>
              <span
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-500/20 text-violet-400`}
              >
                Locked to Portfolio
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed opacity-60 mb-10 max-w-xl">
              Changing the core thesis for this asset will recalibrate all ROI
              projections, exit strategies, and legal alert sensitivities.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                'Yield Maximization',
                'Equity Growth',
                'Capital Recirculation',
              ].map((dna) => (
                <button
                  key={dna}
                  className={`p-6 rounded-[2rem] border text-left transition-all ${dna === 'Yield Maximization' ? 'bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-white dark:text-black dark:border-white' : 'border-slate-100 hover:border-slate-300 dark:border-white/5 dark:hover:border-white/20'}`}
                >
                  <p className="text-[11px] font-black uppercase tracking-tight">
                    {dna}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Stakeholder Matrix */}
          <div className={cardClass}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                Stakeholder Matrix
              </h3>
              <button
                className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5`}
              >
                Invite Collaborator
              </button>
            </div>
            <div className="space-y-4">
              {collaborators.map((c) => (
                <div
                  key={c.name}
                  className={`p-6 rounded-[2rem] border flex items-center justify-between bg-slate-50 border-slate-100 dark:bg-black/20 dark:border-white/5`}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs bg-white shadow-sm dark:bg-white/5`}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">
                        {c.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {c.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span
                      className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-emerald-200 text-emerald-600 dark:border-emerald-500/20 dark:text-emerald-500`}
                    >
                      {c.status}
                    </span>
                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Engine Presumptions & Notifs */}
        <div className="lg:col-span-4 space-y-8">
          {/* Notification Engine */}
          <div className={cardClass}>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-8">
              Notification Engine
            </h3>
            <div className="space-y-6">
              {[
                {
                  id: 'email',
                  label: 'Fiscal Ledger Digest',
                  sub: 'Weekly P&L Summaries',
                },
                {
                  id: 'sms',
                  label: 'Operational Emergency',
                  sub: 'Immediate Repairs/Calls',
                },
                {
                  id: 'push',
                  label: 'Legal Climate Shift',
                  sub: 'Zoning & Regulatory Updates',
                },
              ].map((n) => (
                <div key={n.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight">
                      {n.label}
                    </p>
                    <p className="text-[9px] font-bold opacity-40 uppercase">
                      {n.sub}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifs({
                        ...notifs,
                        [n.id]: !notifs[n.id as keyof typeof notifs],
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-all relative ${notifs[n.id as keyof typeof notifs] ? 'bg-violet-600 dark:bg-[#E8FF4D]' : 'bg-slate-500/20'}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full transition-all ${notifs[n.id as keyof typeof notifs] ? 'right-1 bg-white dark:bg-black' : 'left-1 bg-slate-400'}`}
                    ></div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Presumptions */}
          <div className={cardClass}>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-8">
              Calculation Presumptions
            </h3>
            <div className="space-y-6">
              {[
                { l: 'Vacancy Reserve', v: '5.0%', d: 'Calculated from Gross' },
                {
                  l: 'Maintenance Reserve',
                  v: '8.0%',
                  d: 'Based on asset age',
                },
                { l: 'Expense Inflation', v: '3.0%', d: 'Annual projection' },
                {
                  l: 'CapEx Sinking',
                  v: '$2,500',
                  d: 'Target annual set-aside',
                },
              ].map((item) => (
                <div
                  key={item.l}
                  className="flex justify-between items-end border-b border-slate-500/10 pb-4 dark:border-white/5"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-500">
                      {item.l}
                    </p>
                    <p className="text-[8px] font-bold opacity-30 uppercase">
                      {item.d}
                    </p>
                  </div>
                  <input
                    type="text"
                    defaultValue={item.v}
                    className="w-16 text-right font-black text-sm bg-transparent outline-none border-none focus:text-violet-500 dark:focus:text-[#E8FF4D]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Data Access API */}
          <div
            className={`${cardClass} bg-slate-900 border-none text-white dark:bg-black dark:border-white/5`}
          >
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4">
              Cloud Connect
            </h3>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Stream: AppFolio Active
              </span>
            </div>
            <div className="space-y-4">
              <button className="w-full py-4 rounded-2xl bg-white/5 text-white/40 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                Rotate Intelligence Keys
              </button>
              <button className="w-full py-4 rounded-2xl bg-white/5 text-white/40 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                Download Asset JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <section className="mt-20">
        <div className="flex items-center gap-4 mb-10">
          <div className={`w-12 h-1 bg-red-500`}></div>
          <h3 className="text-3xl font-black uppercase tracking-tighter text-red-500">
            System Sovereignty
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              t: 'Archive Asset',
              d: 'Move this property to the historical archive. Recalculates portfolio aggregates but preserves documents.',
              b: 'Confirm Archival',
              danger: false,
            },
            {
              t: 'Purge Fiscal Logs',
              d: 'Delete all extracted P&L metadata, OCR receipts, and expense histories. Irreversible.',
              b: 'Purge Logs',
              danger: true,
            },
            {
              t: 'Self-Destruct',
              d: 'Complete deletion of property profile, document vault, and intelligence mapping.',
              b: 'Destroy Asset',
              danger: true,
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`${cardClass} border-red-500/10 bg-red-500/5`}
            >
              <h4 className="text-lg font-black uppercase tracking-tight mb-4 text-red-500">
                {item.t}
              </h4>
              <p className="text-xs font-bold opacity-50 leading-relaxed mb-10">
                {item.d}
              </p>
              <button
                className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${item.danger ? 'bg-red-500 text-white shadow-xl shadow-red-500/20 hover:scale-105' : 'border border-red-500/30 text-red-500 hover:bg-red-500/10'}`}
              >
                {item.b}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
