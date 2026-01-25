import { Body, Heading, Overline } from '@axori/ui'
import { cn } from '@/utils/helpers'
import { useTheme } from '@/utils/providers/theme-provider'

interface DNAProfileProps {
  risk: string
  strategy: string
  structure: string
  onRecalibrate?: () => void
  cardClass?: string
}

export const DNAProfile = ({
  risk,
  strategy,
  structure,
  onRecalibrate,
  cardClass,
}: DNAProfileProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  const dnaItems = [
    {
      l: 'Risk',
      v: risk,
      c: 'text-amber-500',
    },
    {
      l: 'Strategy',
      v: strategy,
      c: isDark ? 'text-[#E8FF4D]' : 'text-violet-600',
    },
    {
      l: 'Structure',
      v: structure,
      c: 'text-sky-500',
    },
  ]

  return (
    <div className={cn(cardClass, 'h-full p-8')}>
      <Heading
        level={3}
        className={cn(
          'text-xl font-black uppercase tracking-tighter mb-10',
          isDark ? 'text-white' : 'text-slate-900',
        )}
      >
        DNA Profile
      </Heading>
      <div className="grid grid-cols-1 gap-4">
        {dnaItems.map((dna) => (
          <div
            key={dna.l}
            className={cn(
              'p-4 rounded-2xl flex justify-between items-center',
              isDark ? 'bg-white/5' : 'bg-slate-50',
            )}
          >
            <Overline
              className={cn(
                'text-[9px] font-black uppercase',
                isDark ? 'text-white/60' : 'text-slate-500',
              )}
            >
              {dna.l}
            </Overline>
            <Body weight="black" className={cn('text-[10px] uppercase', dna.c)}>
              {dna.v}
            </Body>
          </div>
        ))}
      </div>
      {onRecalibrate && (
        <button
          onClick={onRecalibrate}
          className={cn(
            'w-full mt-6 py-3 rounded-xl border font-black uppercase text-[9px] tracking-widest transition-all',
            isDark
              ? 'border-white/10 hover:bg-white/5 text-white'
              : 'border-slate-200 hover:bg-slate-50 text-slate-900',
          )}
        >
          Recalibrate
        </button>
      )}
    </div>
  )
}
