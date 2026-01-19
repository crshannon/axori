import { useState } from 'react'
import { Card } from '@axori/ui'

export const FreedomForcast = () => {
  const [forecastYears, setForecastYears] = useState(10)
  const propertyPerformance = [
    {
      id: 1,
      addr: '123 Main St, Anytown, USA',
      currentRent: 1000,
      debtService: 200,
    },
    {
      id: 2,
      addr: '456 Oak Ave, Othertown, USA',
      currentRent: 1200,
      debtService: 250,
    },
    {
      id: 3,
      addr: '789 Pine Rd, Anothertown, USA',
      currentRent: 1500,
      debtService: 300,
    },
  ]
  const totalFuturePassive = propertyPerformance.reduce(
    (acc, p) => acc + p.currentRent + p.debtService,
    0,
  )
  const freedomGoal = 100000

  const calculateFutureRent = (currentRent: number, years: number) => {
    return currentRent * Math.pow(1.05, years)
  }

  return (
    <Card variant="rounded" padding="md" radius="md">
      <div className="h-full flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">
              Freedom Forecast
            </h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">
              Rent Growth + Debt Liberation
            </p>
          </div>
          <div className="px-4 py-2 rounded-2xl border flex items-center gap-3 bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10">
            <span className="text-[8px] font-black uppercase opacity-40">
              Horizon
            </span>
            <select
              value={forecastYears}
              onChange={(e) => setForecastYears(Number(e.target.value))}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer"
            >
              <option value={10}>10 Yrs</option>
              <option value={15}>15 Yrs</option>
              <option value={20}>20 Yrs</option>
              <option value={30}>30 Yrs</option>
            </select>
          </div>
        </div>

        <div className="space-y-6 flex-grow">
          {propertyPerformance.map((p) => {
            const futureRent = calculateFutureRent(p.currentRent, forecastYears)
            const rentGrowth = futureRent - p.currentRent
            const totalLiberated = rentGrowth + p.debtService
            const growthPercent = Math.round((rentGrowth / p.currentRent) * 100)

            return (
              <Card
                key={p.id}
                variant="rounded"
                padding="sm"
                radius="lg"
                className="rounded-3xl border-slate-500/10 bg-slate-500/5 group hover:border-current transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-tight leading-none mb-1">
                      {p.addr}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-500 uppercase">
                        Rent: ${p.currentRent} → ${futureRent}
                      </span>
                      <span className="text-[8px] font-black uppercase text-emerald-500">
                        +{growthPercent}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black tabular-nums tracking-tighter text-violet-600 dark:text-[#E8FF4D]">
                      +${totalLiberated.toLocaleString()}
                    </p>
                    <p className="text-[8px] font-black uppercase opacity-40">
                      Mo. Potential
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] font-black uppercase opacity-40">
                      <span>Grown Rent Lift</span>
                      <span>+${rentGrowth}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-500/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: '40%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] font-black uppercase opacity-40">
                      <span>Debt Service Reclaim</span>
                      <span>+${p.debtService}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-500/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card
          variant="rounded"
          padding="md"
          radius="md"
          className="mt-8 rounded-[2.5rem] bg-violet-600 text-white dark:bg-[#E8FF4D] dark:text-black shadow-2xl relative overflow-hidden border-none"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="text-left">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                Total {forecastYears}Y Autonomous Flow
              </p>
              <p className="text-4xl font-black tabular-nums tracking-tighter">
                ${totalFuturePassive.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                Impact
              </p>
              <p className="text-xl font-black tabular-nums tracking-tighter">
                {Math.round((totalFuturePassive / freedomGoal) * 100)}% of Goal
              </p>
            </div>
          </div>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%">
              <defs>
                <pattern
                  id="grid-forecast"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-forecast)" />
            </svg>
          </div>
        </Card>
      </div>
    </Card>
  )
}
