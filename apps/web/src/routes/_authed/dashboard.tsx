import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useUser } from '@clerk/tanstack-react-start'
import { useEffect } from 'react'
import { Body, Caption, Heading, Label, Overline, Typography } from '@axori/ui'
import PropertyScoreGauge from '@/components/home/PropertyScoreGauge'
import { PageHeader } from '@/components/layouts/PageHeader'
import { cn } from '@/utils/helpers'
import { useOnboardingStatus } from '@/utils/onboarding'
import { useTheme } from '@/utils/providers/theme-provider'

export const Route = createFileRoute('/_authed/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded, user } = useUser()
  const { completed: onboardingCompleted, isLoading: onboardingLoading } =
    useOnboardingStatus()
  const { appTheme } = useTheme()
  const isDark = appTheme === 'dark'

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

  // Don't render dashboard if onboarding not completed (will redirect)
  if (!onboardingCompleted) {
    return null
  }

  const userInitial =
    user?.firstName?.charAt(0) ||
    user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() ||
    'IN'

  return (
    <main className="flex-grow flex flex-col overflow-y-auto max-h-screen">
      <PageHeader
        title="Portfolio Overview"
        rightContent={
          <>
            <div className={`relative hidden md:block`}>
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search properties..."
                className={`pl-12 pr-6 py-3 rounded-full text-xs font-bold border transition-all w-72 outline-none ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-[#E8FF4D]/30'
                    : 'bg-slate-100 border-slate-200 text-slate-900 focus:bg-white focus:shadow-lg focus:border-violet-300 shadow-inner'
                }`}
              />
            </div>
            <button
              className={`relative p-2.5 rounded-full transition-all hover:scale-110 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10'
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span
                className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 bg-red-500 ${
                  isDark ? 'border-black' : 'border-white'
                }`}
              ></span>
            </button>
            <div
              className={`flex items-center gap-3 pl-6 border-l ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}
            >
              <div className="text-right hidden sm:block">
                <Overline
                  className={cn(isDark ? 'text-white/40' : 'text-slate-400')}
                >
                  Account #{user?.id ? user.id.slice(-4) : '9042'}
                </Overline>
                <Label
                  size="sm"
                  className={cn(
                    'mt-1 block',
                    isDark ? 'text-[#E8FF4D]' : 'text-violet-600',
                  )}
                >
                  Private Equity
                </Label>
              </div>
              <div
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center font-black shadow-md transition-colors',
                  isDark
                    ? 'bg-[#1A1A1A] border border-white/10 text-white'
                    : 'bg-slate-200 border border-white text-slate-900',
                )}
              >
                {userInitial}
              </div>
            </div>
          </>
        }
      />

      {/* Dashboard Grid */}
      <div className="p-6 xl:p-8 grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
        {/* Left Column */}
        <div className="xl:col-span-9 space-y-6">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: 'SCORE',
                val: '74',
                sub: 'Excellent',
                icon: <PropertyScoreGauge score={74} size="xs" />,
              },
              {
                label: 'TOTAL EQUITY',
                val: '$517k',
                sub: '+12%',
                subColor: 'text-emerald-500',
              },
              {
                label: 'CASH FLOW',
                val: '$970',
                sub: 'MoM',
                subColor: 'text-emerald-500',
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-6 rounded-[2rem] flex items-center gap-6 shadow-sm border transition-all hover:shadow-md ${
                  isDark
                    ? 'bg-[#1A1A1A] border-white/5'
                    : 'bg-white border-slate-100'
                }`}
              >
                {stat.icon ? (
                  stat.icon
                ) : (
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isDark
                        ? 'bg-white/5 text-[#E8FF4D]'
                        : 'bg-violet-50 text-violet-600'
                    }`}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 2v20M2 12h20" />
                    </svg>
                  </div>
                )}
                <div>
                  <Label
                    size="sm"
                    className={cn(
                      'mb-1',
                      isDark ? 'text-white/60' : 'text-slate-400',
                    )}
                  >
                    {stat.label}
                  </Label>
                  <div className="flex items-baseline gap-2">
                    <Typography
                      variant="h4"
                      className={cn(
                        'text-2xl',
                        isDark ? 'text-white' : 'text-slate-900',
                      )}
                    >
                      {stat.val}
                    </Typography>
                    <Caption
                      className={cn(
                        stat.subColor ||
                          (isDark ? 'text-white/60' : 'text-slate-500'),
                      )}
                    >
                      {stat.sub}
                    </Caption>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Middle Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority Actions */}
            <div
              className={`p-8 rounded-[2.5rem] shadow-sm flex flex-col border transition-all ${
                isDark
                  ? 'bg-slate-900 border-white/5'
                  : 'bg-white border-slate-100 hover:shadow-xl'
              }`}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <Heading
                    level={4}
                    className={cn(isDark ? 'text-white' : 'text-slate-900')}
                  >
                    Priority Actions
                  </Heading>
                  <Caption
                    className={cn(
                      'mt-1',
                      isDark ? 'text-white/60' : 'text-slate-400',
                    )}
                  >
                    3 tasks pending
                  </Caption>
                </div>
                <button
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all transform hover:scale-110 ${
                    isDark
                      ? 'border-white/10 hover:bg-white/10'
                      : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {[
                  {
                    title: 'Review Insurance Policy',
                    sub: '8802 Oakridge Lane',
                    color: 'bg-amber-500',
                    icon: (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Upload Q3 Tax Docs',
                    sub: 'Portfolio wide',
                    color: 'bg-blue-500',
                    icon: (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    ),
                  },
                ].map((act, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl flex items-center gap-4 border transition-all group cursor-pointer ${
                      isDark
                        ? 'bg-white/5 border-white/5 hover:bg-white/10'
                        : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${act.color} text-white shadow-lg`}
                    >
                      {act.icon}
                    </div>
                    <div className="flex-grow">
                      <Body
                        size="sm"
                        weight="black"
                        transform="uppercase"
                        className={cn(isDark ? 'text-white' : 'text-slate-900')}
                      >
                        {act.title}
                      </Body>
                      <Caption
                        className={cn(
                          isDark ? 'text-white/60' : 'text-slate-400',
                        )}
                      >
                        {act.sub}
                      </Caption>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${act.color}`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategy Match Card - Iconic brand color */}
            <div
              className={`p-8 rounded-[2.5rem] shadow-xl flex flex-col relative transition-all duration-500 group overflow-hidden ${
                isDark
                  ? 'bg-amber-400 text-black shadow-amber-400/20'
                  : 'bg-amber-400 text-black shadow-amber-200'
              }`}
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <Heading level={4} className="text-black">
                    Strategy Match
                  </Heading>
                  <Caption className="text-black/60 mt-1 italic">
                    Aligned: Cash Flow Focus
                  </Caption>
                </div>
                <div className="bg-black text-amber-400 px-4 py-1.5 rounded-full shadow-lg">
                  <Label size="sm" className="text-amber-400">
                    85% Score
                  </Label>
                </div>
              </div>
              <div className="space-y-6 relative z-10 flex-grow">
                <div>
                  <div className="flex justify-between mb-3">
                    <Label size="sm" className="text-black/80">
                      Portfolio Optimization
                    </Label>
                    <Label size="sm" className="text-black/80">
                      92%
                    </Label>
                  </div>
                  <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-1000"
                      style={{ width: '92%' }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/30 backdrop-blur-md p-5 rounded-3xl border border-white/20">
                    <Overline className="text-black/60 mb-2">VACANCY</Overline>
                    <Typography
                      variant="h4"
                      className="text-black tabular-nums"
                    >
                      4.2%
                    </Typography>
                  </div>
                  <div className="bg-black/5 p-5 rounded-3xl border border-black/5">
                    <Overline className="text-black/60 mb-2">EXPENSES</Overline>
                    <Typography
                      variant="h4"
                      className="text-black tabular-nums"
                    >
                      -12%
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Chart & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div
              className={`md:col-span-7 p-8 rounded-[2.5rem] shadow-sm border transition-all ${
                isDark
                  ? 'bg-[#1A1A1A] border-white/5'
                  : 'bg-white border-slate-100 hover:shadow-xl'
              }`}
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <Heading
                    level={4}
                    className={cn(isDark ? 'text-white' : 'text-slate-900')}
                  >
                    Financials
                  </Heading>
                  <Caption
                    className={cn(
                      'mt-1',
                      isDark ? 'text-white/60' : 'text-slate-400',
                    )}
                  >
                    Actual Net Yield vs Projection
                  </Caption>
                </div>
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-white/40 hover:bg-white/5'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>

              <div className="h-44 relative flex items-end gap-2 px-2">
                <svg
                  className="absolute inset-0 w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 400 120"
                >
                  <path
                    d="M0 100 Q 50 120 100 80 T 200 60 T 300 90 T 400 50"
                    fill="none"
                    stroke={isDark ? '#E8FF4D' : '#8B5CF6'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d="M0 100 Q 50 120 100 80 T 200 60 T 300 90 T 400 50 V 150 H 0 Z"
                    fill={isDark ? 'url(#dashGradDark)' : 'url(#dashGradLight)'}
                    opacity="0.15"
                  />
                  <defs>
                    <linearGradient
                      id="dashGradDark"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#E8FF4D" />
                      <stop offset="100%" stopColor="#E8FF4D" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient
                      id="dashGradLight"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-x-2 bottom-0 flex justify-between pt-4 border-t border-slate-400/10">
                  {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'].map(
                    (m) => (
                      <Overline
                        key={m}
                        className={cn(
                          'opacity-40',
                          isDark ? 'text-white/40' : 'text-slate-400/40',
                        )}
                      >
                        {m}
                      </Overline>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div
              className={`md:col-span-5 p-8 rounded-[2.5rem] shadow-sm border transition-all ${
                isDark
                  ? 'bg-[#1A1A1A] border-white/5'
                  : 'bg-white border-slate-100 hover:shadow-xl'
              }`}
            >
              <div className="flex justify-between items-start mb-10">
                <Heading
                  level={4}
                  className={cn(isDark ? 'text-white' : 'text-slate-900')}
                >
                  Schedule
                </Heading>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    isDark
                      ? 'border-white/10 text-white/60'
                      : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
              <div className="space-y-8">
                {[
                  {
                    day: '15',
                    label: 'Mortgage Payment',
                    sub: 'Auto-pay scheduled',
                    color: 'text-blue-500',
                  },
                  {
                    day: '18',
                    label: 'Lease Renewal',
                    sub: '124 Maple Ave',
                    color: 'text-amber-500',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 group cursor-pointer">
                    <div className="text-center min-w-[40px]">
                      <Overline
                        className={cn(
                          'mb-1',
                          isDark ? 'text-white/60' : 'text-slate-400',
                        )}
                      >
                        SEP
                      </Overline>
                      <Typography
                        variant="h4"
                        className={cn(
                          'leading-none group-hover:scale-110 transition-transform',
                          isDark ? 'text-white' : 'text-slate-900',
                        )}
                      >
                        {item.day}
                      </Typography>
                    </div>
                    <div className="flex-grow pt-2">
                      <Body
                        size="sm"
                        weight="black"
                        transform="uppercase"
                        className={cn(isDark ? 'text-white' : 'text-slate-900')}
                      >
                        {item.label}
                      </Body>
                      <div className="flex items-center gap-2 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <div
                          className={`w-2 h-2 rounded-full ${item.color.replace(
                            'text-',
                            'bg-',
                          )}`}
                        ></div>
                        <Caption
                          className={cn(
                            isDark ? 'text-white/60' : 'text-slate-400',
                          )}
                        >
                          {item.sub}
                        </Caption>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            <div
              className={`p-8 rounded-[2.5rem] shadow-sm border transition-all relative overflow-hidden group ${
                isDark
                  ? 'bg-[#1A1A1A] border-white/5'
                  : 'bg-white border-slate-100 hover:shadow-xl'
              }`}
            >
              <div
                className={`absolute top-6 right-8 px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase shadow-lg transition-colors ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                +14% Impact
              </div>
              <Overline
                className={cn(
                  'mb-6',
                  isDark ? 'text-white/60' : 'text-slate-400',
                )}
              >
                Automation Impact
              </Overline>
              <div className="flex items-baseline gap-2 mb-10">
                <Typography
                  variant="display"
                  className={cn(
                    'text-6xl',
                    isDark ? 'text-white' : 'text-slate-900',
                  )}
                >
                  14h
                </Typography>
                <Typography
                  variant="h4"
                  className={cn(
                    'opacity-60',
                    isDark ? 'text-white/60' : 'text-slate-400',
                  )}
                >
                  30m
                </Typography>
              </div>
              <div className="h-24 w-full">
                <svg
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 60 Q 50 50 100 70 T 200 40 T 300 60 T 400 30"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {[0, 100, 200].map((x) => (
                    <circle
                      key={x}
                      cx={x}
                      cy={x === 0 ? 60 : x === 100 ? 70 : 40}
                      r="6"
                      fill="#8B5CF6"
                      stroke={isDark ? '#1A1A1A' : '#FFF'}
                      strokeWidth="3"
                    />
                  ))}
                </svg>
              </div>
            </div>

            <div
              className={`p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
                isDark
                  ? 'bg-slate-900 border-white/5'
                  : 'bg-slate-900 text-white'
              }`}
            >
              <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                    isDark
                      ? 'bg-[#E8FF4D] text-black'
                      : 'bg-violet-600 text-white'
                  }`}
                >
                  AI DEAL ENGINE
                </div>
              </div>
              <div className="mt-12 relative z-10">
                <Typography variant="display" className="text-5xl text-white">
                  5
                </Typography>
                <Heading level={5} className="text-white mt-3 leading-none">
                  High-Alpha Deals Found
                </Heading>
                <Caption className="text-white/60 mt-2">
                  Personalized for your portfolio constraints
                </Caption>
              </div>
              <button
                className={`mt-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl relative z-10 ${
                  isDark ? 'bg-white text-black' : 'bg-violet-600 text-white'
                }`}
              >
                Evaluate Opportunities →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Portfolio Insight & Assets */}
        <div className="xl:col-span-3 space-y-6 mt-6 xl:mt-0">
          {/* AI Insights Card - High impact color */}
          <div
            className={`p-8 rounded-[3rem] shadow-2xl relative transition-all duration-500 overflow-hidden group ${
              isDark
                ? 'bg-violet-600'
                : 'bg-violet-600 text-white shadow-violet-200'
            }`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
              <svg
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>
                <Heading level={6} className="text-white">
                  Portfolio Insight
                </Heading>
              </div>
              <button className="text-white/60 hover:text-white transition-colors">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </button>
            </div>
            <Body
              size="sm"
              weight="bold"
              className="text-white opacity-95 leading-relaxed relative z-10"
            >
              Your portfolio health is{' '}
              <span className="bg-white/20 px-2 py-0.5 rounded">Optimal</span>{' '}
              at <span className="font-black">74/100</span>. Strategic
              adjustment to{' '}
              <span className="font-black underline underline-offset-4 decoration-white/40">
                8802 Oakridge Lane
              </span>{' '}
              tax structure could lift your score to{' '}
              <span className="text-[#E8FF4D] font-black">89</span>.
            </Body>
            <div className="mt-12 space-y-4 relative z-10">
              <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E8FF4D] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(232,255,77,0.5)]"
                  style={{ width: '74%' }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.4em] opacity-60">
                <span>CURRENT: 74</span>
                <span>GOAL: 89</span>
              </div>
            </div>
          </div>

          {/* Property List Section */}
          <div
            className={`p-6 rounded-[2.5rem] border transition-all duration-500 shadow-sm ${
              isDark
                ? 'bg-[#1A1A1A] border-white/5'
                : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50'
            }`}
          >
            <div className="flex justify-between items-center mb-10 px-3">
              <div className="flex items-center gap-3">
                <Overline
                  className={cn(isDark ? 'text-white/60' : 'text-slate-400')}
                >
                  Assets
                </Overline>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-colors ${
                    isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-100 text-slate-900 border border-slate-200 shadow-inner'
                  }`}
                >
                  5
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-110 ${
                    isDark
                      ? 'border-white/5 hover:bg-white/5'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="21" y1="4" x2="14" y2="4" />
                    <line x1="10" y1="4" x2="3" y2="4" />
                    <line x1="14" y1="2" x2="14" y2="6" />
                  </svg>
                </button>
                <button
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 shadow-lg ${
                    isDark
                      ? 'bg-[#E8FF4D] text-black'
                      : 'bg-slate-900 text-[#E8FF4D]'
                  }`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  addr: '2291 Lakeview Dr, Austin, TX',
                  strategy: 'Cash Flow Strategy',
                  score: 92,
                  cash: '$450',
                  equity: '$210k',
                  img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=300',
                },
                {
                  addr: '124 Maple Avenue, Greensboro, NC',
                  strategy: 'Cash Flow Strategy',
                  score: 84,
                  cash: '$320',
                  equity: '$145k',
                  img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=300',
                },
                {
                  addr: '4059 West Side, Greensboro, NC',
                  strategy: 'BRRRR Strategy',
                  score: 78,
                  cash: '$150',
                  equity: '$190k',
                  img: 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&q=80&w=300',
                },
              ].map((prop, idx) => (
                <div
                  key={idx}
                  className={`group cursor-pointer p-4 rounded-3xl border transition-all ${
                    isDark
                      ? 'border-white/5 hover:border-white/20 hover:bg-white/5'
                      : 'border-slate-50 hover:border-violet-200 hover:bg-white hover:shadow-xl'
                  }`}
                >
                  <div className="flex gap-4 mb-5">
                    <div className="relative overflow-hidden w-16 h-16 rounded-2xl flex-shrink-0">
                      <img
                        src={prop.img}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                        alt={prop.addr}
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <div className="flex-grow pt-1">
                      <Body
                        size="sm"
                        weight="black"
                        transform="uppercase"
                        className={cn(
                          'leading-tight',
                          isDark ? 'text-white' : 'text-slate-900',
                        )}
                      >
                        {prop.addr}
                      </Body>
                      <Caption
                        className={cn(
                          'mt-1.5 transition-colors',
                          isDark
                            ? 'text-white/60 group-hover:text-[#E8FF4D]'
                            : 'text-slate-400 group-hover:text-violet-600',
                        )}
                      >
                        {prop.strategy}
                      </Caption>
                    </div>
                    <button
                      className={cn(
                        'opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2',
                        isDark ? 'text-white/40' : 'text-slate-400',
                      )}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                        <circle cx="5" cy="12" r="1.5" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mb-6 px-1">
                    <div
                      className={cn(
                        'border-l-2 pl-3',
                        isDark ? 'border-white/10' : 'border-slate-100',
                      )}
                    >
                      <Overline
                        className={cn(
                          'mb-1.5',
                          isDark ? 'text-white/60' : 'text-slate-400',
                        )}
                      >
                        MO. CASH FLOW
                      </Overline>
                      <Typography
                        variant="h4"
                        className={cn(
                          'leading-none',
                          isDark ? 'text-white' : 'text-slate-900',
                        )}
                      >
                        {prop.cash}
                      </Typography>
                    </div>
                    <div
                      className={cn(
                        'border-l-2 pl-3',
                        isDark ? 'border-white/10' : 'border-slate-100',
                      )}
                    >
                      <Overline
                        className={cn(
                          'mb-1.5',
                          isDark ? 'text-white/60' : 'text-slate-400',
                        )}
                      >
                        EQUITY
                      </Overline>
                      <Typography
                        variant="h4"
                        className={cn(
                          'leading-none',
                          isDark ? 'text-white' : 'text-slate-900',
                        )}
                      >
                        {prop.equity}
                      </Typography>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-2xl border ${
                      isDark
                        ? 'bg-white/5 border-white/10'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <Label
                        size="sm"
                        className={cn(
                          isDark ? 'text-white/80' : 'text-slate-700',
                        )}
                      >
                        IQ Rating
                      </Label>
                      <Label
                        size="sm"
                        className={
                          prop.score > 80
                            ? 'text-emerald-500'
                            : 'text-amber-500'
                        }
                      >
                        {prop.score}/100
                      </Label>
                    </div>
                    <div
                      className={`w-full h-2 rounded-full overflow-hidden flex gap-1 ${
                        isDark ? 'bg-black/20' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: '35%' }}
                      ></div>
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: '45%' }}
                      ></div>
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: '20%' }}
                      ></div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4">
                      {[
                        { label: 'Fin.', color: 'bg-blue-500' },
                        { label: 'Mkt.', color: 'bg-violet-500' },
                        { label: 'Ops.', color: 'bg-emerald-500' },
                      ].map((tag) => (
                        <div
                          key={tag.label}
                          className="flex items-center gap-2"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${tag.color}`}
                          ></span>
                          <Overline
                            className={cn(
                              isDark ? 'text-white/60' : 'text-slate-400',
                            )}
                          >
                            {tag.label}
                          </Overline>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
