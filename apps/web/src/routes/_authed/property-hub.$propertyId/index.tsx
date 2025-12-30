import { createFileRoute } from '@tanstack/react-router'
import { Body, Caption, Heading, Overline, Typography } from '@axori/ui'
import { PropertyScoreGauge } from '@/components/property-hub/PropertyScoreGauge'
import { cn } from '@/utils/helpers'

export const Route = createFileRoute('/_authed/property-hub/$propertyId/')({
  component: PropertyOverviewPage,
})

function PropertyOverviewPage() {
  const { propertyId } = Route.useParams()

  // Mock property data - in production, fetch based on propertyId
  const mockPropertyData: Record<string, any> = {
    prop_01: {
      addr: '2291 Lakeview Dr, Austin, TX',
      match: 92,
      iq: 92,
      price: '$840,000',
      type: 'Single Family',
      yearBuilt: '2015',
      mgmtType: 'Property Management Company',
      image:
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
    },
    prop_02: {
      addr: '124 Maple Avenue, Greensboro, NC',
      match: 84,
      iq: 84,
      price: '$450,000',
      type: 'Multi-Family Duplex',
      yearBuilt: '1998',
      mgmtType: 'Property Management Company',
      image:
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=1200',
    },
    prop_03: {
      addr: '4402 Westview Dr, Austin, TX',
      match: 76,
      iq: 76,
      price: '$1,200,000',
      type: 'Multi-Family Quad',
      yearBuilt: '1980',
      mgmtType: 'Property Management Company',
      image:
        'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&q=80&w=1200',
    },
    prop_04: {
      addr: '8801 Rainey St, Austin, TX',
      match: 88,
      iq: 88,
      price: '$910,000',
      type: 'Condo',
      yearBuilt: '2018',
      mgmtType: 'Property Management Company',
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
    },
  }

  const baseProp = mockPropertyData[propertyId] || mockPropertyData.prop_04

  const prop = {
    addr: baseProp.addr,
    match: baseProp.match,
    iq: baseProp.iq,
    price: baseProp.price,
    type: baseProp.type,
    mgmtType: baseProp.mgmtType,
    yearBuilt: baseProp.yearBuilt,
    image: baseProp.image,
    metrics: [
      { l: 'Gross Yield', v: '7.8%' },
      { l: 'Cap Rate', v: '6.2%' },
      { l: 'Cash-on-Cash', v: '11.4%' },
      { l: 'Debt Coverage', v: '1.65x' },
    ],
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
        <div className="lg:col-span-8 rounded-[4rem] overflow-hidden relative min-h-[500px] shadow-2xl">
          <img
            src={prop.image}
            className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            alt={prop.addr}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
            <div>
              <Heading
                level={3}
                className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4"
              >
                {prop.addr}
              </Heading>
              <div className="flex gap-3">
                <span className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                  {prop.type}
                </span>
                <span className="px-4 py-2 rounded-xl bg-indigo-500/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                  {prop.mgmtType}
                </span>
              </div>
            </div>
            <div className="text-right">
              <Overline className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">
                Portfolio Equity
              </Overline>
              <Typography
                variant="h3"
                className="text-4xl font-black text-[#E8FF4D] tracking-tighter"
              >
                $210,000
              </Typography>
            </div>
          </div>
        </div>

        <div
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
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {prop.metrics.map((m) => (
          <div
            key={m.l}
            className={cn(cardClass, 'p-8 flex flex-col justify-between')}
          >
            <Overline className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/70">
              {m.l}
            </Overline>
            <Typography
              variant="h4"
              className="text-4xl font-black tabular-nums tracking-tighter mt-4 text-black dark:text-white"
            >
              {m.v}
            </Typography>
          </div>
        ))}
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
