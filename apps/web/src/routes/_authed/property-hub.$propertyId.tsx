import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import {
  ArrowLeft,
  BarChart3,
  Brain,
  DollarSign,
  FileText,
  MessageCircle,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@axori/ui'

export const Route = createFileRoute('/_authed/property-hub/$propertyId')({
  component: PropertyLayout,
})

function PropertyLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { propertyId } = Route.useParams()

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      path: `/property-hub/${propertyId}`,
      icon: BarChart3,
    },
    {
      id: 'financials',
      label: 'Financials',
      path: `/property-hub/${propertyId}/financials`,
      icon: DollarSign,
    },
    {
      id: 'management',
      label: 'Management',
      path: `/property-hub/${propertyId}/management`,
      icon: ShieldCheck,
    },
    {
      id: 'communications',
      label: 'Communications',
      path: `/property-hub/${propertyId}/communications`,
      icon: MessageCircle,
    },
    {
      id: 'legal',
      label: 'Legal',
      path: `/property-hub/${propertyId}/legal`,
      icon: FileText,
    },
    {
      id: 'documents',
      label: 'Documents',
      path: `/property-hub/${propertyId}/documents`,
      icon: FileText,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: `/property-hub/${propertyId}/analytics`,
      icon: BarChart3,
    },
    {
      id: 'strategy',
      label: 'Strategy',
      path: `/property-hub/${propertyId}/strategy`,
      icon: Brain,
    },
    {
      id: 'settings',
      label: 'Settings',
      path: `/property-hub/${propertyId}/settings`,
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500 bg-slate-50 text-slate-900 dark:bg-[#0F1115] dark:text-white">
      {/* Header with integrated tabs */}
      <header
        className={cn(
          'sticky top-0 z-50 backdrop-blur-xl border-b transition-colors',
          'bg-white/80 border-slate-200 shadow-sm',
          'dark:bg-black/60 dark:border-white/5',
        )}
      >
        {/* Top row: Back button, title, actions */}
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate({ to: '/property-hub' })}
              className={cn(
                'p-4 rounded-2xl transition-all',
                'bg-slate-100 hover:bg-slate-200',
                'dark:bg-white/5 dark:hover:bg-white/10',
              )}
            >
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none">
                Property Details
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/70 mt-1">
                {propertyId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border',
                'bg-emerald-50 border-emerald-100 text-emerald-600',
                'dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-500',
              )}
            >
              CLAIMED ASSET
            </div>
            <button
              className={cn(
                'px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105',
                'bg-slate-900 text-white',
                'dark:bg-white dark:text-black',
              )}
            >
              Export Ledger
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="px-8 pb-4">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive =
                location.pathname === tab.path ||
                (tab.id === 'overview' &&
                  location.pathname === `/property-hub/${propertyId}`)

              return (
                <button
                  key={tab.id}
                  onClick={() => navigate({ to: tab.path as any })}
                  className={cn(
                    'px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer',
                    isActive
                      ? 'bg-violet-600 text-white shadow-lg dark:bg-[#E8FF4D] dark:text-black'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-white/60 dark:hover:bg-white/5',
                  )}
                >
                  <Icon size={16} strokeWidth={2.5} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      {/* Page Content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="py-10 text-center opacity-40 mt-12 border-t border-slate-500/10">
        <p className="text-[9px] font-black text-slate-500 dark:text-white uppercase tracking-[1em]">
          Axori Core Intelligence Matrix v2.5.01
        </p>
      </footer>
    </div>
  )
}
