import { Body, Heading, Overline, ProgressBar, Typography } from '@axori/ui'
import { cn } from '@/utils/helpers'

interface Property {
  id: string
  addr: string
  price: string
  yield: string
  iq: number
  match: number
  strategy: string
  image: string
  lat: number
  lng: number
  reason: string
  cashFlow: string
  currentValue: string
}

interface PropertyDetailPanelProps {
  property: Property | null
  isOpen: boolean
  isDark: boolean
  onClose: () => void
  onActivateIntel: (propertyId: string) => void
}

export const PropertyDetailPanel = ({
  property,
  isOpen,
  isDark,
  onClose,
  onActivateIntel,
}: PropertyDetailPanelProps) => {
  const cardClass = cn(
    'p-5 rounded-2xl border',
    isDark
      ? 'bg-white/5 border-white/5'
      : 'bg-white border-slate-200 shadow-sm',
  )

  if (!property) return null

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 w-full md:w-[650px] z-[100] transition-transform duration-700 ease-in-out shadow-[-30px_0_60px_rgba(0,0,0,0.3)]',
        isOpen ? 'translate-x-0' : 'translate-x-full',
        isDark ? 'bg-[#121212]' : 'bg-slate-50',
      )}
    >
      <div className="h-full flex flex-col p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={onClose}
            className={cn(
              'p-3 rounded-xl transition-all',
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-white'
                : 'bg-white shadow-sm hover:bg-slate-50 text-slate-900',
            )}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => onActivateIntel(property.id)}
              className={cn(
                'px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:scale-105',
                isDark
                  ? 'bg-[#E8FF4D] text-black shadow-lg'
                  : 'bg-violet-600 text-white shadow-xl shadow-violet-200',
              )}
            >
              ACTIVATE INTEL
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-4 mb-6">
            <span
              className={cn(
                'px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl',
                isDark ? 'bg-white text-black' : 'bg-slate-900 text-white',
              )}
            >
              {property.match}% DNA ALIGNMENT
            </span>
            <div
              className={cn(
                'flex-grow h-px',
                isDark ? 'bg-white/10' : 'bg-slate-500/10',
              )}
            ></div>
          </div>
          <Heading
            level={3}
            className={cn(
              'text-3xl font-black uppercase tracking-tighter leading-none mb-4',
              isDark ? 'text-white' : 'text-slate-900',
            )}
          >
            {property.addr}
          </Heading>
          <Body
            className={cn(
              'text-base font-medium italic mb-8 leading-relaxed',
              isDark ? 'text-white/70' : 'text-slate-500',
            )}
          >
            "{property.reason}"
          </Body>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <div
            className={cn(
              cardClass,
              'flex flex-col justify-between group overflow-hidden',
            )}
          >
            <Overline
              className={cn(
                'text-[10px] font-black uppercase tracking-widest mb-4',
                isDark ? 'text-white/70' : 'text-slate-500',
              )}
            >
              Freedom Number Impact
            </Overline>
            <Typography
              variant="h3"
              className={cn(
                'text-2xl font-black tabular-nums tracking-tighter',
                isDark ? 'text-[#E8FF4D]' : 'text-violet-600',
              )}
            >
              {property.cashFlow}
            </Typography>
            <Overline
              className={cn(
                'text-[9px] font-bold uppercase tracking-widest mt-3',
                isDark ? 'text-white/40' : 'text-slate-500',
              )}
            >
              Covers 8% of your goal
            </Overline>
          </div>
          <div
            className={cn(
              cardClass,
              'flex flex-col justify-between group overflow-hidden',
            )}
          >
            <Overline
              className={cn(
                'text-[10px] font-black uppercase tracking-widest mb-4',
                isDark ? 'text-white/70' : 'text-slate-500',
              )}
            >
              Strategy Fit
            </Overline>
            <Typography
              variant="h3"
              className={cn(
                'text-2xl font-black uppercase tracking-tighter',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              {property.strategy}
            </Typography>
            <div className="flex items-center gap-2 mt-3">
              <ProgressBar
                value={98}
                variant="simple"
                height="sm"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <section className="mb-12">
          <Heading
            level={3}
            className={cn(
              'text-lg font-black uppercase tracking-tighter mb-6',
              isDark ? 'text-white' : 'text-slate-900',
            )}
          >
            Intelligence Breakdown
          </Heading>
          <div className="space-y-3">
            {[
              {
                label: 'Market Stability',
                val: 'Low Risk',
                icon: 'M',
                color: 'text-emerald-500',
              },
              {
                label: 'Regulatory Risk',
                val: 'Moderate',
                icon: 'R',
                color: 'text-amber-500',
              },
              {
                label: 'Yield Velocity',
                val: 'High Alpha',
                icon: 'V',
                color: 'text-[#E8FF4D]',
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className={cn(
                  'p-4 rounded-2xl border flex items-center justify-between',
                  isDark
                    ? 'bg-white/5 border-white/5'
                    : 'bg-white border-slate-200 shadow-sm',
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs',
                      isDark
                        ? 'bg-white/10 text-white/60'
                        : 'bg-slate-500/10 text-slate-600',
                    )}
                  >
                    {metric.icon}
                  </div>
                  <Body
                    weight="black"
                    className={cn(
                      'text-sm uppercase tracking-tight',
                      isDark ? 'text-white' : 'text-slate-900',
                    )}
                  >
                    {metric.label}
                  </Body>
                </div>
                <Overline
                  className={cn(
                    'text-[10px] font-black uppercase tracking-widest',
                    metric.color,
                  )}
                >
                  {metric.val}
                </Overline>
              </div>
            ))}
          </div>
        </section>

        <div
          className={cn(
            'mt-auto pt-8 border-t',
            isDark ? 'border-white/10' : 'border-slate-500/10',
          )}
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              className={cn(
                'py-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all',
                isDark
                  ? 'border-white/10 hover:bg-white/5'
                  : 'border-slate-200 hover:bg-slate-50 shadow-sm',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              Compare Assets
            </button>
            <button
              className={cn(
                'py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105',
                isDark
                  ? 'bg-white text-black hover:scale-105'
                  : 'bg-slate-900 text-white hover:scale-105 shadow-xl shadow-slate-200',
              )}
            >
              Download Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
