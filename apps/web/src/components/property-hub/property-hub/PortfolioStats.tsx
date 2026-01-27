import { Card, Overline, Typography } from '@axori/ui'
import { useMemo } from 'react'
import {
  formatCashFlow,
  formatPropertyValue,
  getPropertyCashFlow,
  getPropertyScore,
} from './utils'
import type { Property } from '@/hooks/api/useProperties'
import { useTheme } from '@/utils/providers/theme-provider'
import { cn } from '@/utils/helpers'

interface PortfolioStatsProps {
  activeProperties: Array<Property>
}

export const PortfolioStats = ({ activeProperties }: PortfolioStatsProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  const stats = useMemo(() => {
    const totalValue = activeProperties.reduce((acc, p) => {
      const value =
        p.valuation?.currentValue || p.acquisition?.currentValue || 0
      return acc + value
    }, 0)

    const totalCashFlow = activeProperties.reduce((acc, p) => {
      return acc + getPropertyCashFlow(p)
    }, 0)

    const scores = activeProperties.map((p) => getPropertyScore(p))
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length)
        : 0

    return {
      totalValue,
      totalCashFlow,
      avgScore,
      assetCount: activeProperties.length,
    }
  }, [activeProperties])

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        {
          l: 'Portfolio Value',
          v: formatPropertyValue(stats.totalValue),
          s: 'Current',
        },
        {
          l: 'Total Cash Flow',
          v: formatCashFlow(stats.totalCashFlow),
          s: 'Monthly Net',
        },
        { l: 'Portfolio IQ', v: `${stats.avgScore}`, s: 'Avg Score' },
        { l: 'Asset Count', v: `${stats.assetCount}`, s: 'Units' },
      ].map((stat, i) => (
        <Card key={i} variant="rounded" padding="md" radius="lg">
          <Overline
            className={cn('mb-2', isDark ? 'text-white/60' : 'text-slate-500')}
          >
            {stat.l}
          </Overline>
          <div className="flex items-baseline gap-2">
            <Typography
              variant="h3"
              className={cn(
                'text-4xl font-black tabular-nums tracking-tighter',
                stat.v.includes('+') ? 'text-emerald-500' : '',
                isDark && !stat.v.includes('+')
                  ? 'text-white'
                  : 'text-emerald-500',
              )}
            >
              {stat.v}
            </Typography>
            <Overline
              className={cn(
                'opacity-40',
                isDark ? 'text-white/40' : 'text-slate-500/40',
              )}
            >
              {stat.s}
            </Overline>
          </div>
        </Card>
      ))}
    </div>
  )
}
