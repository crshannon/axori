import { createFileRoute } from '@tanstack/react-router'
import { Body, Caption, Heading, Overline, Typography } from '@axori/ui'
import { PropertyHero, PropertyMetrics } from '@/components/property-hub'
import { cn } from '@/utils/helpers'
import { useProperty } from '@/hooks/api/useProperties'
import { DataCompleteness } from '@/components/property-hub/property-details/overview/DataCompleteness'
import { CashFlowSummaryCard } from '@/components/property-hub/property-details/overview/CashFlowSummaryCard'
import { usePropertyMetrics } from '@/components/property-hub/property-details/overview/hooks/usePropertyMetrics'
import { AsyncLoader } from '@/components/loader/async-loader'
import { AxoriSuggestions } from '@/components/property-hub/AxoriSuggestions'

export const Route = createFileRoute('/_authed/property-hub/$propertyId/')({
  component: PropertyOverviewPage,
})

function PropertyOverviewPage() {
  const { propertyId } = Route.useParams()

  // Fetch property data using the hook (includes normalized data)
  const { data: property, isLoading, error } = useProperty(propertyId)

  // Get real equity from property metrics
  const { metrics } = usePropertyMetrics(property, propertyId)
  const equity = metrics.equity.value

  // Show loading state with AsyncLoader
  if (isLoading) {
    return (
      <AsyncLoader
        isVisible={isLoading}
        duration={4000}
        statuses={[
          'Loading Property Intelligence...',
          'Analyzing Financial Metrics...',
          'Crawling Transaction History...',
          'Computing Yield Projections...',
          'Finalizing Asset Profile...',
        ]}
      />
    )
  }

  // Show error state
  if (error || !property) {
    return (
      <div className="p-8 w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">
            Error loading property
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {error instanceof Error ? error.message : 'Property not found'}
          </p>
        </div>
      </div>
    )
  }

  // Construct full address - use fullAddress if available, otherwise construct from parts
  const fullAddress =
    property.fullAddress ||
    (property.address && property.city && property.state && property.zipCode
      ? `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`
      : property.address || 'Address not available')

  // Extract normalized data
  const propertyType =
    property.characteristics?.propertyType || property.propertyType || 'Unknown'
  const yearBuilt = property.characteristics?.yearBuilt || null
  const managementType = property.management?.isSelfManaged
    ? 'Self-Managed'
    : property.management?.companyName || 'Unknown'
  const currentValue =
    property.acquisition?.currentValue ||
    property.valuation?.currentValue ||
    null

  // Format current value as currency
  const formattedPrice = currentValue
    ? `$${currentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : 'Price not available'

  // Mock data for UI elements that haven't been wired up yet
  const prop = {
    addr: fullAddress,
    match: 92, // TODO: Calculate from property data
    iq: 92, // TODO: Calculate from property data
    price: formattedPrice,
    type: propertyType,
    mgmtType: managementType,
    yearBuilt: yearBuilt?.toString() || 'Unknown',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200', // TODO: Add property images
    swot: {
      strengths: [
        'Section 8 voucher readiness',
        'Low structural risk score',
        'Recent HVAC upgrade',
      ],
      weaknesses: ['Shared utility metering', 'Limited off-street parking'],
      opportunities: ['ADU potential in backyard', 'Tax abatement available'],
      threats: ['New high-density supply nearby'],
    },
    drivers: [
      {
        id: 'tax',
        name: 'Cost Segregation',
        status: 'Unrealized Alpha',
        impact: '+$14.2k/yr',
        desc: 'Accelerate depreciation by isolating 5-yr and 15-yr life assets via engineering-based audit.',
        action: 'Initiate Audit',
      },
      {
        id: 'risk',
        name: 'Insurance Arbitrage',
        status: 'Optimal',
        impact: '-$840/yr',
        desc: 'Current premium matches AI-benchmark for 78704 multi-family zip code.',
        action: 'Review Carriers',
      },
      {
        id: 'ops',
        name: 'Utility RUBS Fix',
        status: 'Active Leak',
        impact: '+$2,100/yr',
        desc: 'Install sub-metering to recover tenant usage costs currently lost to shared metering.',
        action: 'Deploy IoT Sensors',
      },
    ],
  }

  const cardClass = cn(
    'p-10 rounded-[3.5rem] border transition-all duration-500',
    'bg-white border-slate-200 shadow-sm',
    'dark:bg-[#1A1A1A] dark:border-white/5',
  )

  return (
    <div className="p-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <PropertyHero propertyId={propertyId} equity={equity} />
        <PropertyMetrics propertyId={propertyId} />

        {/* <div
          className={cn(
            cardClass,
            'lg:col-span-4 flex flex-col justify-center items-center text-center',
          )}
        >
          <PropertyScoreGauge score={prop.iq} size="lg" />
          <div className="mt-12 space-y-6 w-full text-left">
            <Heading
              level={4}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/70 px-4"
            >
              Performance Radar
            </Heading>
            <div className="space-y-4">
              {[
                { l: 'Yield Alpha', v: '+2.1%', c: 'text-emerald-500' },
                { l: 'Market Trend', v: 'Stable', c: 'text-sky-500' },
              ].map((i) => (
                <div
                  key={i.l}
                  className={cn(
                    'p-4 rounded-3xl flex justify-between items-center',
                    'bg-slate-50',
                    'dark:bg-white/5',
                  )}
                >
                  <Overline className="text-[10px] font-black uppercase opacity-60">
                    {i.l}
                  </Overline>
                  <Typography
                    variant="h4"
                    className={cn('text-sm font-black', i.c)}
                  >
                    {i.v}
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <CashFlowSummaryCard propertyId={propertyId} />
        <DataCompleteness propertyId={propertyId} />
      </div>

      {/* Axori Suggestions */}
      <div className="mb-12">
        <AxoriSuggestions propertyId={propertyId} maxItems={4} compact />
      </div>

      {/* Operational Alpha Drivers */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-1 bg-violet-600 dark:bg-[#E8FF4D]"></div>
          <Heading
            level={3}
            className="text-3xl font-black uppercase tracking-tighter"
          >
            Operational Alpha Drivers
          </Heading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prop.drivers.map((driver) => (
            <div
              key={driver.id}
              className={cn(
                cardClass,
                'group relative overflow-hidden flex flex-col',
              )}
            >
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <Overline
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest mb-1',
                      driver.status.includes('Alpha') ||
                        driver.status.includes('Leak')
                        ? 'text-amber-500'
                        : 'text-emerald-500',
                    )}
                  >
                    {driver.status}
                  </Overline>
                  <Heading
                    level={4}
                    className="text-xl font-black uppercase tracking-tighter"
                  >
                    {driver.name}
                  </Heading>
                </div>
                <Typography
                  variant="h3"
                  className={cn(
                    'text-xl font-black tabular-nums tracking-tighter',
                    driver.impact.startsWith('+')
                      ? 'text-emerald-500'
                      : 'text-slate-500 dark:text-white/70',
                  )}
                >
                  {driver.impact}
                </Typography>
              </div>

              <Body className="text-sm font-medium text-slate-500 dark:text-white/70 leading-relaxed mb-10 flex-grow">
                {driver.desc}
              </Body>

              <button
                className={cn(
                  'w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all',
                  driver.status.includes('Alpha') ||
                    driver.status.includes('Leak')
                    ? 'bg-violet-600 text-white shadow-xl shadow-violet-200 hover:scale-105 dark:bg-[#E8FF4D] dark:text-black dark:shadow-lg dark:shadow-[#E8FF4D]/10 dark:hover:scale-105'
                    : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/40',
                )}
              >
                {driver.action}
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className={cn(cardClass, 'lg:col-span-7')}>
          <Heading
            level={3}
            className="text-2xl font-black uppercase tracking-tighter mb-10"
          >
            Market Pulse Analysis
          </Heading>
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { l: 'Median Rent', v: '$2,850', s: '+12% YoY' },
              { l: 'Vacancy Ave', v: '4.2%', s: 'Optimal' },
              { l: 'Sales Velocity', v: 'High', s: 'Tier 1' },
            ].map((stat) => (
              <div
                key={stat.l}
                className={cn(
                  'p-6 rounded-3xl',
                  'bg-slate-50',
                  'dark:bg-white/5',
                )}
              >
                <Overline className="text-[9px] font-black uppercase text-slate-500 dark:text-white/70 mb-2">
                  {stat.l}
                </Overline>
                <Typography
                  variant="h3"
                  className="text-xl font-black tracking-tight"
                >
                  {stat.v}
                </Typography>
                <Caption className="text-[8px] font-bold text-emerald-500 mt-1 uppercase">
                  {stat.s}
                </Caption>
              </div>
            ))}
          </div>
          <div
            className={cn(
              'h-40 w-full rounded-3xl border border-dashed flex items-center justify-center',
              'border-slate-200',
              'dark:border-white/10',
            )}
          >
            <Overline className="text-[10px] font-black uppercase tracking-widest opacity-40">
              Live Sub-market Heatmap Connected
            </Overline>
          </div>
        </div>

        <div className={cn(cardClass, 'lg:col-span-5')}>
          <Heading
            level={3}
            className="text-2xl font-black uppercase tracking-tighter mb-10"
          >
            Asset SWOT
          </Heading>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <Overline className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                Strengths
              </Overline>
              <ul className="space-y-2">
                {prop.swot.strengths.map((s) => (
                  <li
                    key={s}
                    className="text-[10px] font-bold uppercase opacity-60 flex gap-2"
                  >
                    <span className="text-emerald-500">+</span>
                    <Body className="text-[10px]">{s}</Body>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <Overline className="text-[10px] font-black uppercase text-red-500 tracking-widest">
                Weaknesses
              </Overline>
              <ul className="space-y-2">
                {prop.swot.weaknesses.map((w) => (
                  <li
                    key={w}
                    className="text-[10px] font-bold uppercase opacity-60 flex gap-2"
                  >
                    <span className="text-red-500">−</span>
                    <Body className="text-[10px]">{w}</Body>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'p-16 rounded-[4rem] text-center border-2 transition-all duration-700',
          'bg-white border-violet-100 shadow-2xl shadow-violet-100',
          'dark:bg-black dark:border-[#E8FF4D]/20 dark:shadow-2xl dark:shadow-[#E8FF4D]/5',
        )}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-3xl mx-auto mb-10 flex items-center justify-center text-3xl font-black shadow-2xl',
            'bg-violet-600 text-white',
            'dark:bg-[#E8FF4D] dark:text-black',
          )}
        >
          A
        </div>
        <Heading
          level={2}
          className="text-4xl font-black uppercase tracking-tighter leading-none mb-6"
        >
          AI STEWARDSHIP ENGINE
        </Heading>
        <Body className="max-w-2xl mx-auto text-xl font-medium text-slate-500 dark:text-white/70 italic mb-12 leading-relaxed">
          "Your <strong>Cash Flow</strong> strategy is currently outperforming
          benchmarks. To maintain velocity, initiate the{' '}
          <strong>Cost Segregation Audit</strong> before fiscal year-end."
        </Body>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            className={cn(
              'px-16 py-6 rounded-full font-black uppercase tracking-widest text-xs transition-all hover:scale-105 shadow-xl',
              'bg-slate-900 text-white',
              'dark:bg-white dark:text-black',
            )}
          >
            Execute Tax Optimization
          </button>
          <button
            className={cn(
              'px-16 py-6 rounded-full font-black uppercase tracking-widest text-xs transition-all border-2',
              'border-slate-200 text-slate-900 hover:bg-slate-50',
              'dark:border-white/10 dark:text-white dark:hover:bg-white/5',
            )}
          >
            Request Pro-Forma Audit
          </button>
        </div>
      </div>
    </div>
  )
}
