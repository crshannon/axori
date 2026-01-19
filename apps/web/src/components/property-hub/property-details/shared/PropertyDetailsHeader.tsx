import { ArrowLeft } from 'lucide-react'
import { cn } from '@axori/ui'
import { PropertyDetailsHeaderActions } from './PropertyDetailsHeaderActions'
import { PropertyDetailsHeaderNav } from './PropertyDetailsHeaderNav'
import { useProperty } from '@/hooks/api/useProperties'

interface PropertyDetailsHeaderProps {
  propertyId: string
  onBack: () => void
  tabs: Array<{
    id: string
    label: string
    path: string
    icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  }>
  currentPath: string
  onNavigate: (path: string) => void
}

export const PropertyDetailsHeader = ({
  propertyId,
  onBack,
  tabs,
  currentPath,
  onNavigate,
}: PropertyDetailsHeaderProps) => {
  const { data: property } = useProperty(propertyId)

  if (!property) {
    return null
  }

  return (
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
            onClick={onBack}
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
              {property.address}
            </p>
          </div>
        </div>
        <PropertyDetailsHeaderActions />
      </div>

      {/* Navigation Tabs */}
      <PropertyDetailsHeaderNav
        tabs={tabs}
        currentPath={currentPath}
        propertyId={propertyId}
        onNavigate={onNavigate}
      />
    </header>
  )
}
