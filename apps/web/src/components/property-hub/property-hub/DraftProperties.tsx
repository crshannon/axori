import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { Caption, Card, Heading } from '@axori/ui'
import type { Property } from '@/hooks/api/useProperties'
import { useTheme } from '@/utils/providers/theme-provider'
import { cn } from '@/utils/helpers'

interface DraftPropertiesProps {
  draftProperties: Array<Property>
  onDelete: (propertyId: string, address: string) => void
}

export const DraftProperties = ({
  draftProperties,
  onDelete,
}: DraftPropertiesProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  if (draftProperties.length === 0) {
    return null
  }

  return (
    <div className="mb-10">
      <Heading
        level={3}
        className={cn(
          'text-xl font-black uppercase tracking-tighter mb-6',
          isDark ? 'text-white' : 'text-slate-900',
        )}
      >
        Incomplete Properties
      </Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {draftProperties.map((p) => {
          const fullAddress = `${p.address}, ${p.city}, ${p.state} ${p.zipCode}`
          return (
            <Card
              key={p.id}
              variant="rounded"
              padding="lg"
              radius="xl"
              className={cn(
                'border-2 border-dashed relative group',
                isDark
                  ? 'bg-white/5 border-amber-500/30 dark:border-amber-500/50'
                  : 'bg-amber-50/50 border-amber-300',
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest',
                        isDark
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-amber-500/10 text-amber-600',
                      )}
                    >
                      Draft
                    </span>
                  </div>
                  <Heading
                    level={5}
                    className={cn(
                      'text-sm font-black mb-1 truncate',
                      isDark ? 'text-white' : 'text-slate-900',
                    )}
                  >
                    {p.address}
                  </Heading>
                  <Caption
                    className={cn(
                      'text-xs opacity-60',
                      isDark ? 'text-white/60' : 'text-slate-500',
                    )}
                  >
                    {p.city}, {p.state}
                  </Caption>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(p.id, fullAddress)
                  }}
                  className={cn(
                    'p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity',
                    'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10',
                  )}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  to="/property-hub/add"
                  search={{ propertyId: p.id, step: undefined }}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center',
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white',
                  )}
                >
                  Continue Setup
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
