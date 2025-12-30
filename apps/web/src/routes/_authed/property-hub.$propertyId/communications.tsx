import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card } from '@axori/ui'

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/communications',
)({
  component: CommunicationsPage,
})

function CommunicationsPage() {
  const [copied, setCopied] = useState(false)
  const { propertyId } = Route.useParams()
  const prop = {
    emailAddress: `prop-${propertyId}@axori.com`,
  }
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(prop.emailAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Email Forwarding Config Card */}
      <Card
        variant="rounded"
        padding="lg"
        radius="xl"
        className="lg:col-span-4 flex flex-col gap-10 bg-gradient-to-br from-indigo-500/10 to-transparent"
      >
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-6">
            Inbox Intelligence
          </h3>
          <p className="text-sm font-medium leading-relaxed opacity-60 mb-8">
            Forward any lease, email, or contractor quote to this address. Our
            AI will automatically categorize, extract terms, and create tasks.
          </p>

          <div
            className={`p-6 rounded-[2.5rem] border bg-slate-50 border-slate-200 dark:bg-black/40 dark:border-white/5`}
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Dedicated Prop-Email
            </p>
            <div className="flex items-center justify-between gap-4">
              <code
                className={`text-xs font-black select-all text-violet-600 dark:text-[#E8FF4D]`}
              >
                {prop.emailAddress}
              </code>
              <button
                onClick={handleCopyEmail}
                className={`p-2 rounded-xl transition-all bg-white shadow-sm hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 dark:shadow-none`}
              >
                {copied ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-emerald-500"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="dark:text-slate-400"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Extraction Status
          </h4>
          {[
            { l: 'PDF OCR Processing', s: 'Idle', c: 'opacity-40' },
            { l: 'Intent Analysis', s: 'Active', c: 'text-emerald-500' },
            { l: 'Auto-Tasking', s: 'Active', c: 'text-emerald-500' },
          ].map((i) => (
            <div key={i.l} className="flex justify-between items-center px-4">
              <span className="text-[10px] font-bold uppercase opacity-60">
                {i.l}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${i.c}`}
              >
                {i.s}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Communication Feed & To-Dos */}
      <div className="lg:col-span-8 space-y-8">
        {/* Active Task Management */}
        <Card variant="rounded" padding="lg" radius="xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                System Generated Tasks
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">
                Extracted from communications
              </p>
            </div>
            <button
              className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 shadow-xs dark:border-white/10 dark:hover:bg-white/5 dark:shadow-none`}
            >
              Add Manual Task
            </button>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 1,
                type: 'Maintenance',
                task: 'Review HVAC Quote from "CoolAir Services"',
                status: 'Urgent',
                origin: 'Forwarded Email',
                date: '2h ago',
              },
              {
                id: 2,
                type: 'Admin',
                task: 'Confirm Lease Renewal: Unit B (Tenant: Sarah)',
                status: 'Pending',
                origin: 'System Alert',
                date: '5h ago',
              },
              {
                id: 3,
                type: 'Financial',
                task: 'Approve Plumbing Invoice: $420',
                status: 'Action Required',
                origin: 'Forwarded Image',
                date: '1d ago',
              },
            ].map((t) => (
              <div
                key={t.id}
                className={`p-6 rounded-[2.5rem] border flex items-center gap-8 transition-all hover:scale-[1.01] bg-slate-50 border-slate-100 hover:bg-white shadow-xs dark:bg-black/20 dark:border-white/5 dark:hover:bg-white/10 dark:shadow-none`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all border-slate-300 hover:border-violet-600 dark:border-white/10 dark:hover:border-[#E8FF4D]`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-current opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-white shadow-xs text-slate-500 dark:bg-white/5 dark:shadow-none dark:text-slate-400`}
                    >
                      {t.type}
                    </span>
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest ${t.status === 'Urgent' ? 'text-red-500' : 'text-amber-500'}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm font-black uppercase tracking-tight">
                    {t.task}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <p className="text-[9px] font-bold opacity-30 uppercase">
                      Origin: {t.origin}
                    </p>
                    <p className="text-[9px] font-bold opacity-30 uppercase">
                      • {t.date}
                    </p>
                  </div>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Communication Inbox History */}
        <Card variant="rounded" padding="lg" radius="xl">
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8">
            Communication History
          </h3>
          <div className="space-y-0">
            {[
              {
                from: 'CoolAir Services',
                subject: 'RE: HVAC Quote - 4402 Westview',
                date: 'Mar 14',
                type: 'Email',
              },
              {
                from: 'Tenant (Sarah)',
                subject: 'Question regarding pet policy renewal',
                date: 'Mar 12',
                type: 'Email',
              },
              {
                from: 'PM Horizon Assets',
                subject: 'Monthly Report: February 2024',
                date: 'Mar 05',
                type: 'System',
              },
            ].map((msg, i) => (
              <div
                key={i}
                className={`py-6 flex justify-between items-center border-b last:border-0 border-slate-100 dark:border-white/5 group cursor-pointer`}
              >
                <div className="flex items-center gap-6">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-slate-100 group-hover:bg-white shadow-xs text-slate-400 dark:bg-white/5 dark:group-hover:bg-white/10 dark:shadow-none dark:text-slate-500`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">
                      {msg.from}
                    </p>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                      {msg.subject}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">
                    {msg.date}
                  </p>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-20">
                    {msg.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
