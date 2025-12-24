import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import {
  Body,
  Caption,
  Heading,
  Overline,
  PropertyCard,
  Typography,
} from '@axori/ui'
import { PageHeader } from '@/components/layouts/PageHeader'
import { AddPropertyWizard } from '@/components/property-hub/add-property-wizard'
import { cn } from '@/utils/helpers'
import { useOnboardingStatus } from '@/utils/onboarding'
import { useTheme } from '@/utils/providers/theme-provider'

export const Route = createFileRoute('/_authed/property-hub')({
  component: RouteComponent,
})

interface Property {
  id: string
  addr: string
  nickname: string
  strategy: string
  status: string
  score: number
  cash: string
  value: string
  img: string
  mgmt: string
}

const mockProperties: Array<Property> = [
  {
    id: 'prop_01',
    addr: '2291 Lakeview Dr, Austin, TX',
    nickname: 'The Lake House',
    strategy: 'Cash Flow',
    status: 'Active',
    score: 92,
    cash: '+$450',
    value: '$840k',
    img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400',
    mgmt: 'Self-Managed',
  },
  {
    id: 'prop_02',
    addr: '124 Maple Avenue, Greensboro, NC',
    nickname: 'Maple Duplex',
    strategy: 'Cash Flow',
    status: 'Active',
    score: 84,
    cash: '+$320',
    value: '$450k',
    img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=400',
    mgmt: 'Apex PM Group',
  },
  {
    id: 'prop_03',
    addr: '4402 Westview Dr, Austin, TX',
    nickname: 'Tech Ridge Quad',
    strategy: 'Appreciation',
    status: 'In Renovation',
    score: 76,
    cash: '-$120',
    value: '$1.2M',
    img: 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&q=80&w=400',
    mgmt: 'Self-Managed',
  },
  {
    id: 'prop_04',
    addr: '8801 Rainey St, Austin, TX',
    nickname: 'Downtown Condo',
    strategy: 'Appreciation',
    status: 'Active',
    score: 88,
    cash: '+$680',
    value: '$910k',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    mgmt: 'Horizon Assets',
  },
]

const alerts = [
  {
    type: 'lease',
    msg: 'Lease expiring in 30 days: Maple Duplex',
    priority: 'High',
    color: 'text-amber-500',
  },
  {
    type: 'performance',
    msg: 'Negative cash flow detected: Tech Ridge Quad',
    priority: 'Critical',
    color: 'text-red-500',
  },
  {
    type: 'document',
    msg: 'Missing Insurance Policy: The Lake House',
    priority: 'Med',
    color: 'text-sky-500',
  },
  {
    type: 'document',
    msg: 'Annual inspection due next month: Riverside Condo',
    priority: 'Low',
    color: 'text-slate-400',
  },
]

function RouteComponent() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded, user } = useUser()
  const { completed: onboardingCompleted, isLoading: onboardingLoading } =
    useOnboardingStatus()
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [strategyFilter, setStrategyFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (isLoaded && isSignedIn && !onboardingLoading && !onboardingCompleted) {
      navigate({ to: '/onboarding' as any })
    }
  }, [isLoaded, isSignedIn, onboardingLoading, onboardingCompleted, navigate])

  // Show loading while checking onboarding status
  if (!isLoaded || onboardingLoading) {
    return <div className="p-8">Loading...</div>
  }

  // Don't render if onboarding not completed (will redirect)
  if (!onboardingCompleted) {
    return null
  }

  const onNavigatePropertyAnalysis = (id: string) => {
    // TODO: Navigate to property analysis page
    navigate({ to: `/analysis/${id}` as any })
  }

  const filteredProps = mockProperties.filter((p) => {
    const matchesSearch =
      p.addr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStrategy =
      strategyFilter === 'All' || p.strategy === strategyFilter
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter
    return matchesSearch && matchesStrategy && matchesStatus
  })

  const totalValue = mockProperties.reduce(
    (acc, p) =>
      acc +
      parseFloat(p.value.replace('$', '').replace('M', '000').replace('k', '')),
    0,
  )
  const totalCashFlow = mockProperties.reduce(
    (acc, p) => acc + parseFloat(p.cash.replace('$', '').replace('k', '000')),
    0,
  )
  const avgScore = Math.round(
    mockProperties.reduce((acc, p) => acc + p.score, 0) / mockProperties.length,
  )

  const cardClass = cn(
    'p-8 rounded-[3rem] border transition-all duration-500',
    isDark
      ? 'bg-[#1A1A1A] border-white/5'
      : 'bg-white border-slate-200 shadow-sm',
  )

  return (
    <main className="flex-grow flex flex-col overflow-y-auto max-h-screen">
      <PageHeader
        title="Property Hub"
        rightContent={
          <div className="flex flex-wrap gap-4">
            <button
              className={cn(
                'px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest border',
                isDark
                  ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                  : 'bg-white border-slate-200 hover:shadow-md text-slate-900',
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Bulk Upload
            </button>
            <button
              className={cn(
                'px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest border',
                isDark
                  ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                  : 'bg-white border-slate-200 hover:shadow-md text-slate-900',
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Data
            </button>
            <button
              onClick={() => setIsWizardOpen(true)}
              className={cn(
                'px-8 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest hover:scale-105',
                isDark
                  ? 'bg-[#E8FF4D] text-black'
                  : 'bg-violet-600 text-white shadow-xl shadow-violet-200',
              )}
            >
              <Plus size={16} strokeWidth={3} />
              Add Property
            </button>
          </div>
        }
      />

      <div className="p-8 flex flex-col gap-10">
        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { l: 'Portfolio Value', v: '$3.4M', s: 'Current' },
            { l: 'Total Cash Flow', v: `+$${totalCashFlow}`, s: 'Monthly Net' },
            { l: 'Portfolio IQ', v: `${avgScore}`, s: 'Avg Score' },
            { l: 'Asset Count', v: `${mockProperties.length}`, s: 'Units' },
          ].map((stat, i) => (
            <div key={i} className={cardClass}>
              <Overline
                className={cn(
                  'mb-2',
                  isDark ? 'text-white/60' : 'text-slate-500',
                )}
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
            </div>
          ))}
        </div>

        {/* Alerts */}
        <section
          className={cn(
            'p-8 rounded-3xl border',
            isDark
              ? 'bg-white/5 border-white/10'
              : 'bg-slate-50 border-slate-200',
          )}
        >
          <div className="flex items-center gap-4 mb-8">
            <div
              className={cn('w-8 h-1', isDark ? 'bg-white/20' : 'bg-slate-300')}
            ></div>
            <Heading
              level={3}
              className={cn(
                'text-xl font-black uppercase tracking-tighter',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              Strategic Alerts
            </Heading>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  cardClass,
                  'p-4 flex items-center justify-between gap-4 group cursor-pointer transition-all',
                  isDark
                    ? 'hover:bg-white/10 border-white/10'
                    : 'hover:bg-white border-slate-200 hover:shadow-md',
                )}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                      isDark ? 'bg-white/10' : 'bg-slate-100',
                    )}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={alert.color}
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Overline
                      className={cn(
                        'mb-2',
                        alert.color,
                        isDark ? 'opacity-80' : '',
                      )}
                    >
                      {alert.priority} Priority
                    </Overline>
                    <Body
                      weight="black"
                      transform="uppercase"
                      className={cn(
                        'text-sm tracking-tight leading-snug',
                        isDark ? 'text-white' : 'text-slate-900',
                      )}
                    >
                      {alert.msg}
                    </Body>
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className={cn(
                    'shrink-0 transition-transform group-hover:translate-x-1',
                    isDark ? 'text-white/40' : 'text-slate-400',
                  )}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className={cn('h-px ', isDark ? 'bg-white/10' : 'bg-slate-200')} />

        {/* Assets View Controls */}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                onChange={(e) => setStrategyFilter(e.target.value)}
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
                onChange={(e) => setStatusFilter(e.target.value)}
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
                onClick={() => setViewMode(m)}
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

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProps.map((p) => (
              <PropertyCard
                key={p.id}
                id={p.id}
                image={p.img}
                address={p.addr}
                nickname={p.nickname}
                status={p.status}
                score={p.score}
                cashFlow={p.cash}
                currentValue={p.value}
                theme={isDark ? 'dark' : 'light'}
                onClick={onNavigatePropertyAnalysis}
                cardClassName={cn(
                  'rounded-[3rem] border',
                  isDark
                    ? 'bg-[#1A1A1A] border-white/5'
                    : 'bg-white border-slate-200 shadow-sm',
                )}
                className="hover:shadow-2xl"
              />
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className={cn(cardClass, 'p-0 overflow-hidden')}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={cn(
                    'border-b',
                    isDark ? 'border-white/5' : 'border-slate-100',
                  )}
                >
                  <th
                    className={cn(
                      'p-8 text-[10px] font-black uppercase tracking-widest',
                      isDark ? 'text-white/60' : 'text-slate-500',
                    )}
                  >
                    Asset Profile
                  </th>
                  <th
                    className={cn(
                      'p-8 text-[10px] font-black uppercase tracking-widest',
                      isDark ? 'text-white/60' : 'text-slate-500',
                    )}
                  >
                    Strategy / Status
                  </th>
                  <th
                    className={cn(
                      'p-8 text-[10px] font-black uppercase tracking-widest',
                      isDark ? 'text-white/60' : 'text-slate-500',
                    )}
                  >
                    Score
                  </th>
                  <th
                    className={cn(
                      'p-8 text-[10px] font-black uppercase tracking-widest',
                      isDark ? 'text-white/60' : 'text-slate-500',
                    )}
                  >
                    Cash Flow
                  </th>
                  <th
                    className={cn(
                      'p-8 text-[10px] font-black uppercase tracking-widest text-right',
                      isDark ? 'text-white/60' : 'text-slate-500',
                    )}
                  >
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs font-black uppercase">
                {filteredProps.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onNavigatePropertyAnalysis(p.id)}
                    className={cn(
                      'border-b last:border-0 cursor-pointer transition-all',
                      isDark
                        ? 'border-white/5 hover:bg-white/5'
                        : 'border-slate-100 hover:bg-slate-50',
                    )}
                  >
                    <td className="p-8">
                      <div>
                        <Overline
                          className={cn(
                            'mb-1',
                            isDark ? 'text-white/60' : 'text-slate-500',
                          )}
                        >
                          {p.nickname}
                        </Overline>
                        <Body
                          weight="black"
                          className={cn(
                            'text-base tracking-tight',
                            isDark ? 'text-white' : 'text-slate-900',
                          )}
                        >
                          {p.addr}
                        </Body>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col gap-1">
                        <span className="opacity-40">{p.strategy}</span>
                        <span
                          className={
                            p.status === 'Active'
                              ? 'text-emerald-500'
                              : 'text-amber-500'
                          }
                        >
                          {p.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <Typography
                          variant="h3"
                          className={cn(
                            'text-2xl font-black tabular-nums tracking-tighter',
                            p.score > 80
                              ? 'text-emerald-500'
                              : 'text-amber-500',
                          )}
                        >
                          {p.score}
                        </Typography>
                        <div
                          className={cn(
                            'h-1.5 w-16 rounded-full overflow-hidden',
                            isDark ? 'bg-white/10' : 'bg-slate-500/10',
                          )}
                        >
                          <div
                            className={cn(
                              'h-full',
                              p.score > 80 ? 'bg-emerald-500' : 'bg-amber-500',
                            )}
                            style={{ width: `${p.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <Typography
                        variant="h3"
                        className={cn(
                          'text-xl font-black tabular-nums tracking-tighter',
                          p.cash.startsWith('+') || !p.cash.startsWith('-')
                            ? 'text-emerald-500'
                            : 'text-red-500',
                        )}
                      >
                        {p.cash}
                      </Typography>
                    </td>
                    <td className="p-8 text-right">
                      <Typography
                        variant="h3"
                        className={cn(
                          'text-xl font-black tabular-nums tracking-tighter',
                          isDark ? 'text-white' : 'text-slate-900',
                        )}
                      >
                        {p.value}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Management View */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div
              className={cn(
                'w-12 h-1',
                isDark ? 'bg-violet-500' : 'bg-violet-600',
              )}
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
            <div className={cardClass}>
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
                  {
                    mockProperties.filter((p) => p.mgmt === 'Self-Managed')
                      .length
                  }{' '}
                  Assets
                </span>
              </div>
              <div className="space-y-6">
                {mockProperties
                  .filter((p) => p.mgmt === 'Self-Managed')
                  .map((p) => (
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
                        {p.addr}
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
                            {p.score}
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
                            {p.cash}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* PM Managed */}
            <div className={cardClass}>
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
                {['Apex PM Group', 'Horizon Assets'].map((pm) => {
                  const pmAssets = mockProperties.filter((p) => p.mgmt === pm)
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
                        {pmAssets.map((p) => (
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
                              {p.nickname}
                            </Body>
                            <Typography
                              variant="h6"
                              className={cn(
                                'text-xs font-black tabular-nums',
                                isDark ? 'text-white' : 'text-slate-900',
                              )}
                            >
                              {p.cash}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add Property Wizard */}
      {isWizardOpen && (
        <AddPropertyWizard
          onClose={() => setIsWizardOpen(false)}
          onComplete={() => {
            setIsWizardOpen(false)
            // TODO: Refresh properties list or navigate to new property
          }}
        />
      )}
    </main>
  )
}
