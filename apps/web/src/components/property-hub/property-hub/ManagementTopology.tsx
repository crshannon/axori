import { Body, Card, Heading, Overline, Typography } from '@axori/ui'
import { formatCashFlow, getPropertyCashFlow, getPropertyScore } from './utils'
import type { Property } from '@/hooks/api/useProperties'
import { useTheme } from '@/utils/providers/theme-provider'
import { cn } from '@/utils/helpers'

interface ManagementTopologyProps {
  activeProperties: Array<Property>
}

export const ManagementTopology = ({
  activeProperties,
}: ManagementTopologyProps) => {
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

  const selfManagedProperties = activeProperties.filter(
    (p) => p.management && p.management.isSelfManaged === true,
  )

  const pmManagedProperties = activeProperties.filter(
    (p) =>
      p.management &&
      p.management.isSelfManaged === false &&
      p.management.companyName,
  )

  const pmCompanies = Array.from(
    new Set(pmManagedProperties.map((p) => p.management?.companyName)),
  ).filter((name): name is string => !!name)

  return (
    <section>
      <div className="flex items-center gap-4 mb-10">
        <div
          className={cn('w-12 h-1', isDark ? 'bg-violet-500' : 'bg-violet-600')}
        ></div>
        <Heading
          level={3}
          className={cn(
            'text-2xl font-black uppercase tracking-tighter',
            isDark ? 'text-white' : 'text-slate-900',
          )}
        >
          Management Topology
        </Heading>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Self Managed */}
        <Card variant="rounded" padding="md" radius="lg">
          <div className="flex justify-between items-center mb-8">
            <Heading
              level={3}
              className={cn(
                'text-xl font-black uppercase tracking-tighter',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              Self-Managed
            </Heading>
            <span
              className={cn(
                'px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest',
                isDark ? 'bg-white text-black' : 'bg-slate-900 text-white',
              )}
            >
              {selfManagedProperties.length} Assets
            </span>
          </div>
          <div className="space-y-6">
            {selfManagedProperties.map((p) => {
              const score = getPropertyScore(p)
              const cashFlow = getPropertyCashFlow(p)
              const fullAddress = `${p.address}, ${p.city}, ${p.state}`
              return (
                <div
                  key={p.id}
                  className="flex justify-between items-center pb-4 border-b border-slate-500/5 last:border-0"
                >
                  <Body
                    weight="black"
                    transform="uppercase"
                    className={cn(
                      'text-xs tracking-tight',
                      isDark ? 'text-white' : 'text-slate-900',
                    )}
                  >
                    {fullAddress}
                  </Body>
                  <div className="flex gap-4 text-right">
                    <div>
                      <Overline
                        className={cn(
                          'text-[8px] font-black opacity-30 uppercase',
                          isDark ? 'text-white/30' : 'text-slate-500/30',
                        )}
                      >
                        Score
                      </Overline>
                      <Typography
                        variant="h6"
                        className="text-sm font-black text-emerald-500"
                      >
                        {score}
                      </Typography>
                    </div>
                    <div>
                      <Overline
                        className={cn(
                          'text-[8px] font-black opacity-30 uppercase',
                          isDark ? 'text-white/30' : 'text-slate-500/30',
                        )}
                      >
                        Cash Flow
                      </Overline>
                      <Typography
                        variant="h6"
                        className={cn(
                          'text-sm font-black',
                          isDark ? 'text-white' : 'text-slate-900',
                        )}
                      >
                        {formatCashFlow(cashFlow)}
                      </Typography>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* PM Managed */}
        <Card variant="rounded" padding="md" radius="lg">
          <div className="flex justify-between items-center mb-8">
            <Heading
              level={3}
              className={cn(
                'text-xl font-black uppercase tracking-tighter',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              PM Partners
            </Heading>
            <div className="flex gap-2">
              <span
                className={cn(
                  'px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase',
                )}
              >
                Service Active
              </span>
            </div>
          </div>
          <div className="space-y-10">
            {pmCompanies.map((pm) => {
              const pmAssets = activeProperties.filter(
                (p) => p.management && p.management.companyName === pm,
              )
              if (pmAssets.length === 0) return null
              return (
                <div key={pm}>
                  <div className="flex justify-between items-center mb-4">
                    <Overline
                      className={cn(
                        'text-[10px] font-black uppercase tracking-widest',
                        isDark ? 'text-white/60' : 'text-slate-500',
                      )}
                    >
                      {pm}
                    </Overline>
                    <Body
                      weight="black"
                      transform="uppercase"
                      className={cn(
                        'text-[10px]',
                        isDark ? 'text-white' : 'text-slate-900',
                      )}
                    >
                      {pmAssets.length} Assets
                    </Body>
                  </div>
                  <div className="space-y-3">
                    {pmAssets.map((p) => {
                      const cashFlow = getPropertyCashFlow(p)
                      return (
                        <div
                          key={p.id}
                          className={cn(
                            'p-4 rounded-2xl border flex justify-between items-center',
                            isDark
                              ? 'bg-white/5 border-white/5'
                              : 'bg-slate-50 border-slate-100',
                          )}
                        >
                          <Body
                            weight="black"
                            transform="uppercase"
                            className={cn(
                              'text-[11px] tracking-tight',
                              isDark ? 'text-white' : 'text-slate-900',
                            )}
                          >
                            {p.address}
                          </Body>
                          <Typography
                            variant="h6"
                            className={cn(
                              'text-xs font-black tabular-nums',
                              isDark ? 'text-white' : 'text-slate-900',
                            )}
                          >
                            {formatCashFlow(cashFlow)}
                          </Typography>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </section>
  )
}
