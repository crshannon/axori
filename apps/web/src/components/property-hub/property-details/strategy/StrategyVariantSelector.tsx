import { Typography, cn } from '@axori/ui'
import type { PrimaryStrategy } from '@axori/shared/src/validation'

interface StrategyVariantSelectorProps {
  strategy: PrimaryStrategy
  selectedVariant: string | null
  onSelect: (variant: string | null) => void
  disabled?: boolean
}

// Variant configuration per strategy
const STRATEGY_VARIANTS: Record<
  PrimaryStrategy,
  {
    key: string
    label: string
    description: string
  }[]
> = {
  primary_residence: [
    {
      key: 'standard',
      label: 'Standard',
      description: 'Traditional homeownership, building equity over time',
    },
    {
      key: 'future_rental',
      label: 'Future Rental',
      description: 'Planning to convert to rental property later',
    },
    {
      key: 'live_in_flip',
      label: 'Live-In Flip',
      description: 'Renovate while living there, sell for profit',
    },
  ],
  house_hack: [
    {
      key: 'duplex',
      label: 'Duplex',
      description: 'Live in one unit, rent the other',
    },
    {
      key: 'triplex_quad',
      label: 'Triplex/Quad',
      description: 'Live in one unit, rent 2-3 others',
    },
    {
      key: 'room_rental',
      label: 'Room Rental',
      description: 'Rent out individual rooms in your home',
    },
    {
      key: 'adu',
      label: 'ADU',
      description: 'Rent out accessory dwelling unit',
    },
    {
      key: 'basement',
      label: 'Basement',
      description: 'Rent out finished basement apartment',
    },
  ],
  buy_and_hold: [
    {
      key: 'cash_flow_focused',
      label: 'Cash Flow Focused',
      description: 'Maximize monthly income over appreciation',
    },
    {
      key: 'appreciation_focused',
      label: 'Appreciation Focused',
      description: 'Prioritize long-term value growth',
    },
    {
      key: 'balanced',
      label: 'Balanced',
      description: 'Equal focus on cash flow and appreciation',
    },
    {
      key: 'debt_freedom',
      label: 'Debt Freedom',
      description: 'Focus on paying off mortgage quickly',
    },
    {
      key: 'legacy',
      label: 'Legacy',
      description: 'Build generational wealth to pass down',
    },
  ],
  brrrr: [
    {
      key: 'classic',
      label: 'Classic BRRRR',
      description: 'Full cycle with cash-out refinance',
    },
    {
      key: 'brrrr_light',
      label: 'BRRRR Light',
      description: 'Minimal rehab, focus on speed',
    },
    {
      key: 'delayed_refi',
      label: 'Delayed Refi',
      description: 'Wait for better rates or seasoning',
    },
  ],
  short_term_rental: [
    {
      key: 'full_time_str',
      label: 'Full-Time STR',
      description: 'Property dedicated to short-term rental',
    },
    {
      key: 'seasonal_str',
      label: 'Seasonal STR',
      description: 'Short-term rental during peak seasons only',
    },
    {
      key: 'arbitrage',
      label: 'Rental Arbitrage',
      description: 'Lease property and sublet as STR',
    },
  ],
  fix_and_flip: [
    {
      key: 'standard',
      label: 'Standard Flip',
      description: 'Traditional buy, renovate, sell',
    },
    {
      key: 'wholesale',
      label: 'Wholesale',
      description: 'Assign contract without renovation',
    },
    {
      key: 'creative_finance',
      label: 'Creative Finance',
      description: 'Subject-to, seller finance, etc.',
    },
  ],
  value_add: [
    {
      key: 'renovate_hold',
      label: 'Renovate & Hold',
      description: 'Major renovation then long-term hold',
    },
    {
      key: 'rent_optimization',
      label: 'Rent Optimization',
      description: 'Improve operations to increase rents',
    },
    {
      key: 'conversion',
      label: 'Conversion',
      description: 'Convert property type (e.g., office to residential)',
    },
  ],
  midterm_rental: [
    {
      key: 'travel_nurse',
      label: 'Travel Nurse',
      description: 'Targeting healthcare professionals',
    },
    {
      key: 'corporate',
      label: 'Corporate Housing',
      description: 'Business travelers and relocations',
    },
    {
      key: 'furnished_finder',
      label: 'Furnished Finder',
      description: 'General midterm rental market',
    },
  ],
}

/**
 * StrategyVariantSelector component - Secondary variant selection
 *
 * Shows variant options specific to the selected primary strategy.
 * Displayed as a list of selectable options with descriptions.
 */
export const StrategyVariantSelector = ({
  strategy,
  selectedVariant,
  onSelect,
  disabled = false,
}: StrategyVariantSelectorProps) => {
  const variants = STRATEGY_VARIANTS[strategy]

  if (!variants || variants.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Typography
          variant="caption"
          className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60"
        >
          Strategy Variant
        </Typography>
        {selectedVariant && (
          <button
            onClick={() => !disabled && onSelect(null)}
            disabled={disabled}
            className="text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-white/80 transition-colors disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2">
        {variants.map((variant) => {
          const isSelected = selectedVariant === variant.key

          return (
            <button
              key={variant.key}
              onClick={() => !disabled && onSelect(variant.key)}
              disabled={disabled}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all duration-200',
                'hover:scale-[1.01] active:scale-[0.99]',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
                !isSelected && [
                  'bg-white dark:bg-white/5',
                  'border-slate-200 dark:border-white/10',
                  'hover:border-slate-300 dark:hover:border-white/20',
                ],
                isSelected && [
                  'bg-violet-500/10 dark:bg-[#E8FF4D]/10',
                  'border-violet-500/30 dark:border-[#E8FF4D]/30',
                  'ring-2 ring-violet-500/20 dark:ring-[#E8FF4D]/20',
                ],
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <Typography
                    variant="body-sm"
                    className={cn(
                      'font-bold',
                      isSelected
                        ? 'text-violet-600 dark:text-[#E8FF4D]'
                        : 'text-slate-700 dark:text-white/80',
                    )}
                  >
                    {variant.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-slate-500 dark:text-white/50 mt-0.5"
                  >
                    {variant.description}
                  </Typography>
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-violet-500 dark:bg-[#E8FF4D] flex items-center justify-center text-white dark:text-black text-xs flex-shrink-0 ml-3">
                    ✓
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
