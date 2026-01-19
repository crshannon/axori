import { cn } from '@axori/ui'

interface Tab {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

interface PropertyDetailsHeaderNavProps {
  tabs: Array<Tab>
  currentPath: string
  propertyId: string
  onNavigate: (path: string) => void
}

export const PropertyDetailsHeaderNav = ({
  tabs,
  currentPath,
  propertyId,
  onNavigate,
}: PropertyDetailsHeaderNavProps) => {
  return (
    <nav className="px-8 pb-4">
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive =
            currentPath === tab.path ||
            (tab.id === 'overview' &&
              currentPath === `/property-hub/${propertyId}`)

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.path)}
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
  )
}
