import { createFileRoute } from '@tanstack/react-router'
import { cn } from '@/utils/helpers'

export const Route = createFileRoute(
  '/_authed/property-hub/$propertyId/documents',
)({
  component: DocumentsPage,
})

function DocumentsPage() {
  const cardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-sm',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  const handleDownload = (name: string) => {
    console.log(`Downloading document: ${name}`)
  }

  interface AxoriPropertyDocument {
    id: string
    name: string
    type: string
    size: string
    date: string
    category: string
    intel: string
    confidence: number
  }

  const documents: Array<AxoriPropertyDocument> = [
    {
      id: '1',
      name: 'Purchase Agreement',
      type: 'PDF',
      size: '2.4 MB',
      date: '2024-01-15',
      category: 'Purchase',
      intel: 'Purchase Agreement',
      confidence: 99,
    },
    {
      id: '2',
      name: 'Property Inspection Report',
      type: 'PDF',
      size: '5.1 MB',
      date: '2024-01-20',
      category: 'Inspection',
      intel: 'Property Inspection Report',
      confidence: 98,
    },
    {
      id: '3',
      name: 'Insurance Policy',
      type: 'PDF',
      size: '1.8 MB',
      date: '2024-02-01',
      category: 'Insurance',
      intel: 'Insurance Policy',
      confidence: 98,
    },
    {
      id: '4',
      name: 'Lease Agreement - Unit A',
      type: 'PDF',
      size: '3.2 MB',
      date: '2024-02-10',
      category: 'Leases',
      intel: 'Lease Agreement - Unit A',
      confidence: 99,
    },
  ]

  return (
    <div className="p-8 w-full grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`${cardClass} lg:col-span-1 flex flex-col gap-8`}>
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-6">
            Vault Folders
          </h3>
          <div className="space-y-2">
            {[
              { n: 'Lease Agreements', c: 4 },
              { n: 'Insurance Policies', c: 1 },
              { n: 'Tax Assessments', c: 3 },
              { n: 'Maintenance Records', c: 12 },
              { n: 'Closing Disclosures', c: 1 },
            ].map((f) => (
              <button
                key={f.n}
                className={`w-full p-4 rounded-2xl flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-left transition-all bg-slate-50 border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm dark:bg-white/5 dark:hover:bg-white/10`}
              >
                <span>{f.n}</span>
                <span className="opacity-30">{f.c}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div className={`p-6 rounded-3xl mb-6 bg-slate-50 dark:bg-white/5`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Sync Status
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold">AppFolio Connected</span>
            </div>
          </div>
          <button
            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-dashed border-slate-300 dark:border-white/20 hover:border-current transition-colors`}
          >
            + Upload Files
          </button>
        </div>
      </div>

      <div className={`${cardClass} lg:col-span-3`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">
              AI Document Intelligence
            </h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Automatic extraction of fiscal metadata
            </p>
          </div>
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search intel..."
              className={`pl-10 pr-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border outline-none bg-slate-100 border-slate-200 focus:border-violet-300 dark:bg-white/5 dark:border-white/5 dark:focus:border-white/20`}
            />
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc: AxoriPropertyDocument) => (
            <div
              key={doc.id}
              className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-center gap-8 transition-all bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md dark:bg-black/20 dark:border-white/5 dark:hover:bg-white/5`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white shadow-md dark:bg-white/5`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="flex-grow text-center md:text-left">
                <p className="text-base font-black tracking-tight">
                  {doc.intel}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {doc.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                      AI Confidence {doc.confidence}%
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap bg-indigo-100 text-indigo-700 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400`}
                >
                  {doc.category}
                </div>
                <button
                  onClick={() => handleDownload(doc.intel)}
                  className={`p-3 rounded-xl border border-slate-200 transition-all hover:bg-white shadow-sm dark:border-white/10 dark:hover:bg-white/5`}
                  title="Download Document"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-10">
            Vault encrypted via AES-256 standard
          </p>
        </div>
      </div>
    </div>
  )
}
