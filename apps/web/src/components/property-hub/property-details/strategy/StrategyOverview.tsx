import { Card, Typography, cn, Button } from '@axori/ui'
import { usePropertyStrategy } from '@/hooks/api/useStrategy'
import { useDrawer, DRAWERS } from '@/lib/drawer'
import type { PrimaryStrategy, BRRRRPhase } from '@axori/shared/src/validation'

interface StrategyOverviewProps {
  propertyId: string
}

// Strategy display configuration
const STRATEGY_CONFIG: Record<
  PrimaryStrategy,
  {
    label: string
    description: string
    icon: string
    color: string
  }
> = {
  primary_residence: {
    label: 'Primary Residence',
    description: 'Your home, building equity while you live',
    icon: '🏠',
    color: 'blue',
  },
  house_hack: {
    label: 'House Hack',
    description: 'Live in one unit, rent the others',
    icon: '🏘️',
    color: 'violet',
  },
  buy_and_hold: {
    label: 'Buy & Hold',
    description: 'Traditional long-term rental income',
    icon: '📈',
    color: 'emerald',
  },
  brrrr: {
    label: 'BRRRR',
    description: 'Buy, Rehab, Rent, Refinance, Repeat',
    icon: '🔄',
    color: 'amber',
  },
  short_term_rental: {
    label: 'Short-Term Rental',
    description: 'Airbnb, VRBO, vacation rentals',
    icon: '✈️',
    color: 'rose',
  },
  fix_and_flip: {
    label: 'Fix & Flip',
    description: 'Renovate and sell for profit',
    icon: '🔨',
    color: 'orange',
  },
  value_add: {
    label: 'Value Add',
    description: 'Renovate to increase rental income',
    icon: '⚡',
    color: 'indigo',
  },
  midterm_rental: {
    label: 'Midterm Rental',
    description: '30+ day furnished rentals',
    icon: '🧳',
    color: 'teal',
  },
}

const BRRRR_PHASES: {
  key: BRRRRPhase
  label: string
  shortLabel: string
}[] = [
  { key: 'acquisition', label: 'Acquisition', shortLabel: 'Buy' },
  { key: 'rehab', label: 'Rehab', shortLabel: 'Rehab' },
  { key: 'rent', label: 'Rent', shortLabel: 'Rent' },
  { key: 'refinance', label: 'Refinance', shortLabel: 'Refi' },
  { key: 'stabilized', label: 'Stabilized', shortLabel: 'Done' },
]

const EXIT_METHOD_LABELS: Record<string, string> = {
  hold_forever: 'Hold Forever',
  sell: 'Traditional Sale',
  '1031_exchange': '1031 Exchange',
  refinance_hold: 'Refinance & Hold',
  seller_finance: 'Seller Finance',
  convert_primary: 'Convert to Primary',
  gift_inherit: 'Gift/Inherit',
  undecided: 'Undecided',
}

const HOLD_PERIOD_LABELS: Record<string, string> = {
  indefinite: 'Indefinite',
  short: 'Short (< 2 years)',
  medium: 'Medium (2-5 years)',
  long: 'Long (5-10 years)',
  specific: 'Specific Year',
}

/**
 * StrategyOverview component - Main strategy display card
 *
 * Shows at-a-glance status of the property's investment strategy:
 * - Current strategy + variant badge
 * - BRRRR phase progress bar (if applicable)
 * - Exit strategy summary
 * - Edit action button
 */
export const StrategyOverview = ({ propertyId }: StrategyOverviewProps) => {
  const { data, isLoading, error } = usePropertyStrategy(propertyId)
  const { openDrawer } = useDrawer()

  // Loading state
  if (isLoading) {
    return (
      <Card variant="rounded" padding="lg" radius="xl" className="h-full">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-1/3" />
            <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-full w-24" />
          </div>
          <div className="h-24 bg-slate-200 dark:bg-white/10 rounded-2xl" />
          <div className="h-12 bg-slate-200 dark:bg-white/10 rounded-xl" />
        </div>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card variant="rounded" padding="lg" radius="xl" className="h-full">
        <div className="text-center py-8">
          <Typography variant="body-sm" className="text-rose-500">
            Failed to load strategy data
          </Typography>
        </div>
      </Card>
    )
  }

  const strategy = data?.strategy
  const brrrrPhase = data?.brrrrPhase

  // No strategy set state
  if (!strategy) {
    return (
      <Card variant="rounded" padding="lg" radius="xl" className="h-full">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <Typography
            variant="h6"
            className="text-slate-900 dark:text-white mb-2"
          >
            No Strategy Set
          </Typography>
          <Typography
            variant="body-sm"
            className="text-slate-500 dark:text-white/60 mb-6 max-w-sm"
          >
            Define your investment strategy to unlock context-aware insights and
            tracking.
          </Typography>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openDrawer(DRAWERS.STRATEGY_EDIT, { propertyId })}
          >
            Set Strategy
          </Button>
        </div>
      </Card>
    )
  }

  const config = STRATEGY_CONFIG[strategy.primaryStrategy]
  const isBrrrr = strategy.primaryStrategy === 'brrrr'
  const currentPhaseIndex = isBrrrr && brrrrPhase
    ? BRRRR_PHASES.findIndex((p) => p.key === brrrrPhase.currentPhase)
    : -1
  const progressPercent = isBrrrr && currentPhaseIndex >= 0
    ? ((currentPhaseIndex + 1) / BRRRR_PHASES.length) * 100
    : 0

  return (
    <Card variant="rounded" padding="lg" radius="xl" className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-1.5 h-5 rounded-full shadow-lg',
              config.color === 'emerald' && 'bg-emerald-500 shadow-emerald-500/50',
              config.color === 'blue' && 'bg-blue-500 shadow-blue-500/50',
              config.color === 'violet' && 'bg-violet-500 shadow-violet-500/50',
              config.color === 'amber' && 'bg-amber-500 shadow-amber-500/50',
              config.color === 'rose' && 'bg-rose-500 shadow-rose-500/50',
              config.color === 'orange' && 'bg-orange-500 shadow-orange-500/50',
              config.color === 'indigo' && 'bg-indigo-500 shadow-indigo-500/50',
              config.color === 'teal' && 'bg-teal-500 shadow-teal-500/50',
            )}
          />
          <Typography
            variant="h6"
            className="uppercase tracking-widest text-slate-900 dark:text-white"
          >
            Investment Strategy
          </Typography>
        </div>
        <button
          onClick={() => openDrawer(DRAWERS.STRATEGY_EDIT, { propertyId })}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Strategy Badge */}
      <div className="mb-8">
        <div
          className={cn(
            'p-6 rounded-3xl border transition-all',
            config.color === 'emerald' && 'bg-emerald-500/5 border-emerald-500/10',
            config.color === 'blue' && 'bg-blue-500/5 border-blue-500/10',
            config.color === 'violet' && 'bg-violet-500/5 border-violet-500/10',
            config.color === 'amber' && 'bg-amber-500/5 border-amber-500/10',
            config.color === 'rose' && 'bg-rose-500/5 border-rose-500/10',
            config.color === 'orange' && 'bg-orange-500/5 border-orange-500/10',
            config.color === 'indigo' && 'bg-indigo-500/5 border-indigo-500/10',
            config.color === 'teal' && 'bg-teal-500/5 border-teal-500/10',
          )}
        >
          <div className="flex items-center gap-4 mb-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <Typography
                variant="h4"
                className="text-slate-900 dark:text-white tracking-tight"
              >
                {config.label}
              </Typography>
              {strategy.strategyVariant && (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60">
                  {strategy.strategyVariant.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
          <Typography
            variant="body-sm"
            className="text-slate-600 dark:text-white/70"
          >
            {config.description}
          </Typography>
        </div>
      </div>

      {/* BRRRR Phase Tracker */}
      {isBrrrr && brrrrPhase && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <Typography
              variant="caption"
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60"
            >
              BRRRR Progress
            </Typography>
            <Typography
              variant="caption"
              className={cn(
                'text-[10px] font-black uppercase tracking-widest',
                progressPercent === 100
                  ? 'text-emerald-500'
                  : 'text-amber-500',
              )}
            >
              {progressPercent.toFixed(0)}% Complete
            </Typography>
          </div>

          {/* Phase Progress Bar */}
          <div className="relative">
            <div className="flex justify-between mb-2">
              {BRRRR_PHASES.map((phase, index) => {
                const isCompleted = index < currentPhaseIndex
                const isCurrent = index === currentPhaseIndex
                const isPending = index > currentPhaseIndex

                return (
                  <div
                    key={phase.key}
                    className="flex flex-col items-center flex-1"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all',
                        isCompleted &&
                          'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
                        isCurrent &&
                          'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20',
                        isPending &&
                          'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/40',
                      )}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <Typography
                      variant="caption"
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider mt-2',
                        isCompleted && 'text-emerald-500',
                        isCurrent && 'text-amber-500',
                        isPending && 'text-slate-400 dark:text-white/40',
                      )}
                    >
                      {phase.shortLabel}
                    </Typography>
                  </div>
                )
              })}
            </div>

            {/* Connecting Line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 dark:bg-white/10 -z-10">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(0, (currentPhaseIndex / (BRRRR_PHASES.length - 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Exit Strategy Summary */}
      <div className="pt-6 border-t border-slate-200 dark:border-white/5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Typography
              variant="caption"
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 mb-1 block"
            >
              Exit Method
            </Typography>
            <Typography
              variant="body-sm"
              className="font-bold text-slate-900 dark:text-white"
            >
              {strategy.exitMethod
                ? EXIT_METHOD_LABELS[strategy.exitMethod] || strategy.exitMethod
                : 'Not Set'}
            </Typography>
          </div>
          <div>
            <Typography
              variant="caption"
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 mb-1 block"
            >
              Hold Period
            </Typography>
            <Typography
              variant="body-sm"
              className="font-bold text-slate-900 dark:text-white"
            >
              {strategy.holdPeriod
                ? strategy.holdPeriod === 'specific' && strategy.targetExitYear
                  ? `Until ${strategy.targetExitYear}`
                  : HOLD_PERIOD_LABELS[strategy.holdPeriod]
                : 'Not Set'}
            </Typography>
          </div>
        </div>
      </div>
    </Card>
  )
}
