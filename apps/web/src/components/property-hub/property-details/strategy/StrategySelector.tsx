import { Typography, cn } from '@axori/ui'
import type { PrimaryStrategy } from '@axori/shared/src/validation'

interface StrategySelectorProps {
  selectedStrategy: PrimaryStrategy | null
  onSelect: (strategy: PrimaryStrategy) => void
  disabled?: boolean
}

// Strategy cards configuration
const STRATEGY_CARDS: {
  strategy: PrimaryStrategy
  label: string
  description: string
  icon: string
  color: string
  features: string[]
}[] = [
  {
    strategy: 'primary_residence',
    label: 'Primary Residence',
    description: 'Your home, building equity while you live',
    icon: '🏠',
    color: 'blue',
    features: ['Equity building', 'Tax benefits', 'Stability'],
  },
  {
    strategy: 'house_hack',
    label: 'House Hack',
    description: 'Live in one unit, rent the others',
    icon: '🏘️',
    color: 'violet',
    features: ['Reduced expenses', 'Owner-occupied rates', 'Learn landlording'],
  },
  {
    strategy: 'buy_and_hold',
    label: 'Buy & Hold',
    description: 'Traditional long-term rental income',
    icon: '📈',
    color: 'emerald',
    features: ['Steady cash flow', 'Appreciation', 'Passive income'],
  },
  {
    strategy: 'brrrr',
    label: 'BRRRR',
    description: 'Buy, Rehab, Rent, Refinance, Repeat',
    icon: '🔄',
    color: 'amber',
    features: ['Equity velocity', 'Capital recycling', 'Forced appreciation'],
  },
  {
    strategy: 'short_term_rental',
    label: 'Short-Term Rental',
    description: 'Airbnb, VRBO, vacation rentals',
    icon: '✈️',
    color: 'rose',
    features: ['Higher income potential', 'Flexibility', 'Personal use'],
  },
  {
    strategy: 'fix_and_flip',
    label: 'Fix & Flip',
    description: 'Renovate and sell for profit',
    icon: '🔨',
    color: 'orange',
    features: ['Quick profits', 'Active income', 'Market timing'],
  },
  {
    strategy: 'value_add',
    label: 'Value Add',
    description: 'Renovate to increase rental income',
    icon: '⚡',
    color: 'indigo',
    features: ['Forced appreciation', 'Higher rents', 'Long-term hold'],
  },
  {
    strategy: 'midterm_rental',
    label: 'Midterm Rental',
    description: '30+ day furnished rentals',
    icon: '🧳',
    color: 'teal',
    features: ['Less turnover', 'Higher rates', 'Travel professionals'],
  },
]

/**
 * StrategySelector component - Card-based strategy selection
 *
 * Displays 8 strategy cards in a responsive grid layout.
 * Each card shows the strategy name, icon, description, and key features.
 */
export const StrategySelector = ({
  selectedStrategy,
  onSelect,
  disabled = false,
}: StrategySelectorProps) => {
  return (
    <div className="space-y-4">
      <Typography
        variant="caption"
        className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60"
      >
        Select Investment Strategy
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STRATEGY_CARDS.map((card) => {
          const isSelected = selectedStrategy === card.strategy

          return (
            <button
              key={card.strategy}
              onClick={() => !disabled && onSelect(card.strategy)}
              disabled={disabled}
              className={cn(
                'w-full text-left p-5 rounded-2xl border transition-all duration-200',
                'hover:scale-[1.02] active:scale-[0.98]',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
                !isSelected && [
                  'bg-white dark:bg-white/5',
                  'border-slate-200 dark:border-white/10',
                  'hover:border-slate-300 dark:hover:border-white/20',
                ],
                isSelected && [
                  card.color === 'blue' && 'bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20',
                  card.color === 'violet' && 'bg-violet-500/10 border-violet-500/30 ring-2 ring-violet-500/20',
                  card.color === 'emerald' && 'bg-emerald-500/10 border-emerald-500/30 ring-2 ring-emerald-500/20',
                  card.color === 'amber' && 'bg-amber-500/10 border-amber-500/30 ring-2 ring-amber-500/20',
                  card.color === 'rose' && 'bg-rose-500/10 border-rose-500/30 ring-2 ring-rose-500/20',
                  card.color === 'orange' && 'bg-orange-500/10 border-orange-500/30 ring-2 ring-orange-500/20',
                  card.color === 'indigo' && 'bg-indigo-500/10 border-indigo-500/30 ring-2 ring-indigo-500/20',
                  card.color === 'teal' && 'bg-teal-500/10 border-teal-500/30 ring-2 ring-teal-500/20',
                ],
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
                    !isSelected && 'bg-slate-100 dark:bg-white/5',
                    isSelected && [
                      card.color === 'blue' && 'bg-blue-500/20',
                      card.color === 'violet' && 'bg-violet-500/20',
                      card.color === 'emerald' && 'bg-emerald-500/20',
                      card.color === 'amber' && 'bg-amber-500/20',
                      card.color === 'rose' && 'bg-rose-500/20',
                      card.color === 'orange' && 'bg-orange-500/20',
                      card.color === 'indigo' && 'bg-indigo-500/20',
                      card.color === 'teal' && 'bg-teal-500/20',
                    ],
                  )}
                >
                  {card.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <Typography
                      variant="body"
                      className={cn(
                        'font-bold',
                        isSelected
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-white/80',
                      )}
                    >
                      {card.label}
                    </Typography>
                    {isSelected && (
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-white text-xs',
                          card.color === 'blue' && 'bg-blue-500',
                          card.color === 'violet' && 'bg-violet-500',
                          card.color === 'emerald' && 'bg-emerald-500',
                          card.color === 'amber' && 'bg-amber-500',
                          card.color === 'rose' && 'bg-rose-500',
                          card.color === 'orange' && 'bg-orange-500',
                          card.color === 'indigo' && 'bg-indigo-500',
                          card.color === 'teal' && 'bg-teal-500',
                        )}
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  <Typography
                    variant="body-sm"
                    className="text-slate-500 dark:text-white/60 mb-3"
                  >
                    {card.description}
                  </Typography>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {card.features.map((feature) => (
                      <span
                        key={feature}
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                          !isSelected &&
                            'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50',
                          isSelected && [
                            card.color === 'blue' && 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
                            card.color === 'violet' && 'bg-violet-500/20 text-violet-600 dark:text-violet-400',
                            card.color === 'emerald' && 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                            card.color === 'amber' && 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
                            card.color === 'rose' && 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
                            card.color === 'orange' && 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
                            card.color === 'indigo' && 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
                            card.color === 'teal' && 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
                          ],
                        )}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
