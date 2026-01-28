import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@axori/ui'

export const Route = createFileRoute('/_public/pricing')({
  component: Pricing,
})

function Pricing() {
  const accentColorClass = 'text-violet-600 dark:text-[#E8FF4D]'
  const [hoverPlan, setHoverPlan] = useState<number | null>(1) // Default to highlight Pro

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      desc: 'Perfect for getting started with property investment tracking.',
      features: [
        '3 AI interactions monthly',
        'Basic property tracking',
        'Limited dashboard access',
      ],
      cta: 'Get Started',
      accent: 'bg-blue-400',
    },
    {
      name: 'Pro',
      price: '$24',
      period: '/month',
      desc: 'For active investors managing multiple properties.',
      features: [
        '100 AI interactions monthly',
        'Full dashboard & analytics',
        'Document processing',
        'Property Score system',
      ],
      cta: 'Go Pro',
      accent: 'bg-violet-600 dark:bg-[#E8FF4D]',
      recommended: true,
    },
    {
      name: 'Portfolio',
      price: '$49',
      period: '/month',
      desc: 'For growing portfolios and professional investors.',
      features: [
        '500 AI interactions monthly',
        'Everything in Pro',
        'AppFolio integration',
        'Advanced reporting',
        'Priority support',
      ],
      cta: 'Start Scaling',
      accent: 'bg-slate-900 dark:bg-white',
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      desc: 'Institutional scale for management groups and teams.',
      features: [
        'Unlimited AI interactions',
        'Everything in Portfolio',
        'Custom integrations',
        'Dedicated support',
        'Multi-user access',
      ],
      cta: 'Contact Sales',
      accent: 'bg-emerald-600',
    },
  ]

  return (
    <main className="flex-grow pt-12 pb-32 bg-slate-50 dark:bg-[#0a0a0c]">
      <div className="max-w-[1440px] mx-auto px-6">
        {/* Header Hero */}
        <div className="mb-24 text-center">
          <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em] font-extrabold uppercase mb-8 transition-colors text-slate-900 dark:text-white">
            COST OF <span className={accentColorClass}>INEFFICIENCY</span>{' '}
            <br />
            VS. COST OF <span className="opacity-30">AXORI</span>.
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-400 font-medium leading-relaxed">
            Choose the plan that fits your investment journey. We charge by
            value, not by the click.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {plans.map((plan, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoverPlan(i)}
              className={`group p-12 rounded-[3.5rem] border transition-all duration-500 flex flex-col min-h-[640px] relative overflow-hidden ${
                hoverPlan === i
                  ? 'bg-white border-violet-100 shadow-2xl shadow-slate-200/50 scale-[1.02] dark:bg-[#1A1A1A] dark:border-white/20 dark:shadow-black/20'
                  : 'bg-transparent border-black/5 opacity-60 dark:bg-transparent dark:border-white/5'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 px-8 py-3 rounded-bl-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl z-20 bg-violet-600 text-white dark:bg-[#E8FF4D] dark:text-black">
                  Recommended
                </div>
              )}

              <div className="mb-12 relative z-10">
                <div className={`w-14 h-1.5 mb-8 ${plan.accent}`}></div>
                <h2 className="text-5xl font-black uppercase tracking-tighter mb-2">
                  {plan.name}
                </h2>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-6xl font-black tracking-tighter tabular-nums">
                    {plan.price}
                  </span>
                  <span className="text-sm font-bold opacity-40 uppercase tracking-widest">
                    {plan.period}
                  </span>
                </div>
              </div>

              <p className="text-sm font-bold opacity-60 mb-12 leading-relaxed relative z-10">
                {plan.desc}
              </p>

              <ul className="space-y-6 mb-auto relative z-10">
                {plan.features.map((feat, fi) => (
                  <li
                    key={fi}
                    className="flex items-center gap-4 text-xs font-black uppercase tracking-widest"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        hoverPlan === i
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}
                    >
                      <Check className="w-3 h-3" strokeWidth={4} />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>

              <Link to="/sign-up" className="mt-12 relative z-10 block">
                <Button
                  fullWidth
                  className={`py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${
                    hoverPlan === i
                      ? 'bg-slate-900 text-white hover:scale-105 shadow-2xl shadow-slate-200 dark:bg-white dark:text-black dark:shadow-xl dark:shadow-black/20'
                      : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/40'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-32">
          <div className="lg:col-span-8 p-12 rounded-[3.5rem] border flex flex-col justify-between min-h-[450px] transition-all duration-500 relative overflow-hidden bg-slate-900 text-white dark:bg-white dark:text-black">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="grid-pricing"
                    width="60"
                    height="60"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 60 0 L 0 0 0 60"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pricing)" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
                WHY SO CHEAP?
                <br />
                (OR SO EXPENSIVE?)
              </h3>
              <p className="text-lg opacity-70 leading-relaxed max-w-xl font-medium">
                We built our infra to be efficient. One "Pro" license saves the
                average manager{' '}
                <span className="underline decoration-current font-black">
                  12.5 hours
                </span>{' '}
                per month. At $100/hr, that's a $1,250 ROI. Every month.
              </p>
            </div>
            <div className="mt-12 flex flex-wrap gap-8 relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                  TIME SAVED
                </p>
                <p
                  className={`text-4xl font-black tabular-nums ${accentColorClass}`}
                >
                  150h+
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                  Per Year
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                  ACCURACY
                </p>
                <p
                  className={`text-4xl font-black tabular-nums ${accentColorClass}`}
                >
                  99.9%
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                  AI OCR PRECISION
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 p-12 rounded-[3.5rem] border flex flex-col justify-center transition-colors relative overflow-hidden bg-white border-black/5 shadow-xl shadow-slate-200/50 dark:bg-[#1A1A1A] dark:border-white/10 dark:shadow-black/20">
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px]"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8">
              THE PROMISE
            </p>
            <h4 className="text-2xl font-black uppercase tracking-tight mb-4">
              No Lock-ins.
            </h4>
            <p className="text-sm opacity-60 leading-relaxed font-medium mb-8">
              Axori is a tool, not a trap. Cancel anytime, export your data to
              CSV or JSON in seconds. We earn your trust every billing cycle.
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-10 h-1 rounded-full bg-slate-200 dark:bg-white/10 ${
                    i < 5 ? accentColorClass.replace('text', 'bg') : ''
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Comparison Table - Bento Style */}
        <div className="mb-32">
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-12 text-center transition-colors text-slate-900 dark:text-white">
            The Specifics
          </h3>
          <div className="rounded-[3.5rem] overflow-hidden border transition-all duration-500 bg-white border-black/5 shadow-sm dark:bg-[#1A1A1A] dark:border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5">
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Infrastructure
                  </th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Free
                  </th>
                  <th
                    className={`p-8 text-[10px] font-black uppercase tracking-[0.3em] ${accentColorClass}`}
                  >
                    Pro
                  </th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Portfolio
                  </th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                {[
                  {
                    f: 'AI Interactions',
                    d: '3/month',
                    o: '100/month',
                    l: '500/month',
                    e: 'Unlimited',
                  },
                  {
                    f: 'Dashboard Access',
                    d: 'Limited',
                    o: 'Full',
                    l: 'Full',
                    e: 'Full',
                  },
                  {
                    f: 'Document Processing',
                    d: '—',
                    o: '✓',
                    l: '✓',
                    e: '✓',
                  },
                  {
                    f: 'Property Score',
                    d: '—',
                    o: '✓',
                    l: '✓',
                    e: '✓',
                  },
                  {
                    f: 'AppFolio Integration',
                    d: '—',
                    o: '—',
                    l: '✓',
                    e: '✓',
                  },
                  {
                    f: 'Support',
                    d: 'Community',
                    o: 'Email',
                    l: 'Priority',
                    e: 'Dedicated',
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-0 border-slate-100 dark:border-white/5 hover:bg-slate-500/5 transition-colors"
                  >
                    <td className="p-8 opacity-40">{row.f}</td>
                    <td className="p-8">{row.d}</td>
                    <td className="p-8">{row.o}</td>
                    <td className="p-8">{row.l}</td>
                    <td className="p-8">{row.e || 'Custom'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fun FAQ Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-10 rounded-[3rem] border flex flex-col justify-between transition-colors bg-slate-900 text-white dark:bg-white dark:text-black">
            <h5 className="text-xl font-black uppercase leading-tight mb-4">
              Can I switch plans?
            </h5>
            <p className="text-xs opacity-60 leading-relaxed font-bold">
              Yes. Upgrade as you acquire, downgrade if you liquidate. We scale
              with you.
            </p>
          </div>
          <div className="p-10 rounded-[3rem] border flex flex-col justify-between transition-colors bg-white border-black/5 shadow-sm dark:bg-[#1A1A1A] dark:border-white/5">
            <h5 className="text-xl font-black uppercase leading-tight mb-4">
              What's "Concierge"?
            </h5>
            <p className="text-xs opacity-60 leading-relaxed font-bold">
              A real human analyst who sanity checks your portfolio every
              quarter.
            </p>
          </div>
          <div className="p-10 rounded-[3rem] border flex flex-col justify-between transition-colors bg-violet-600 text-white shadow-2xl shadow-violet-200 dark:shadow-black/30">
            <h5 className="text-xl font-black uppercase leading-tight mb-4">
              Security?
            </h5>
            <p className="text-xs opacity-80 leading-relaxed font-bold italic">
              Bank-grade encryption. Your data is your alpha. We don't peek.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
