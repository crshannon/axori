import { useTheme } from '@/utils/providers/theme-provider'
import { cn } from '@/utils/helpers'

interface PropertyViewControlsProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export const PropertyViewControls = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: PropertyViewControlsProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
      <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
        <div className="relative">
          <svg
            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
            width="16"
            height="16"
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
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'pl-14 pr-8 py-4 rounded-3xl text-[11px] font-black uppercase border transition-all outline-none w-full md:w-80',
              isDark
                ? 'bg-white/5 border-white/5 focus:border-[#E8FF4D]/30 text-white'
                : 'bg-white border-slate-200 focus:border-violet-300 text-slate-900',
            )}
          />
        </div>
        <div className="flex gap-2">
          <select
            defaultValue="All"
            onChange={() => {
              // TODO: Implement strategy filter for real properties
            }}
            className={cn(
              'px-6 py-4 rounded-3xl text-[9px] font-black uppercase border outline-none appearance-none transition-all',
              isDark
                ? 'bg-white/5 border-white/5 focus:border-[#E8FF4D]/30 text-white'
                : 'bg-white border-slate-200 focus:border-violet-300 text-slate-900',
            )}
          >
            <option value="All">Strategy: All</option>
            <option value="Cash Flow">Cash Flow</option>
            <option value="Appreciation">Appreciation</option>
          </select>
          <select
            defaultValue="All"
            onChange={() => {
              // TODO: Implement status filter for real properties
            }}
            className={cn(
              'px-6 py-4 rounded-3xl text-[9px] font-black uppercase border outline-none appearance-none transition-all',
              isDark
                ? 'bg-white/5 border-white/5 focus:border-[#E8FF4D]/30 text-white'
                : 'bg-white border-slate-200 focus:border-violet-300 text-slate-900',
            )}
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="In Renovation">In Renovation</option>
          </select>
        </div>
      </div>
      <div
        className={cn(
          'flex p-1.5 rounded-2xl',
          isDark ? 'bg-white/5' : 'bg-slate-500/10',
        )}
      >
        {(['grid', 'list'] as const).map((m) => (
          <button
            key={m}
            onClick={() => onViewModeChange(m)}
            className={cn(
              'px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              viewMode === m
                ? isDark
                  ? 'bg-white text-black'
                  : 'bg-slate-900 text-white'
                : isDark
                  ? 'opacity-40 text-white hover:opacity-100'
                  : 'opacity-40 text-black hover:opacity-100',
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
