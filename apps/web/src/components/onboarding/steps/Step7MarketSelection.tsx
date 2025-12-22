import { useMemo, useState } from 'react'
import { useMarkets } from '../hooks/useMarkets'
import type { OnboardingForm } from '../hooks/useOnboardingForm'

interface Step7MarketSelectionProps {
  form: OnboardingForm
  onComplete: () => void
  onBack: () => void
  isDark: boolean
}

export function Step7MarketSelection({
  form,
  onComplete,
  onBack,
  isDark,
}: Step7MarketSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('')
  const [profileFilter, setProfileFilter] = useState<
    'cash_flow' | 'appreciation' | 'hybrid' | ''
  >('')

  // Show trending markets when no search/filters are applied
  const hasFilters = searchQuery || stateFilter || profileFilter

  const { data: markets = [], isLoading } = useMarkets({
    search: searchQuery || undefined,
    state: stateFilter || undefined,
    investmentProfile: profileFilter || undefined,
    active: true,
    trending: !hasFilters, // Show trending when no filters
  })

  // Get unique states for filter
  const uniqueStates = useMemo(() => {
    const states = new Set(markets.map((m) => m.state))
    return Array.from(states).sort()
  }, [markets])

  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-4">Select Your Markets</h3>
      <p className="text-xl text-slate-400 font-medium mb-8 italic">
        Choose up to 3 target markets (optional)
      </p>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div
          className={`p-4 rounded-2xl border ${
            isDark
              ? 'bg-white/5 border-white/10'
              : 'bg-white border-black/5 shadow-sm'
          }`}
        >
          <input
            type="text"
            placeholder="Search by city or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border font-medium bg-transparent ${
              isDark
                ? 'border-white/10 text-white placeholder:text-white/40'
                : 'border-black/10 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className={`px-4 py-2 rounded-xl border font-medium text-sm ${
              isDark
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-white border-black/10 text-slate-900'
            }`}
          >
            <option value="">All States</option>
            {uniqueStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          {/* Investment Profile Filter */}
          <select
            value={profileFilter}
            onChange={(e) =>
              setProfileFilter(
                e.target.value as 'cash_flow' | 'appreciation' | 'hybrid' | '',
              )
            }
            className={`px-4 py-2 rounded-xl border font-medium text-sm ${
              isDark
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-white border-black/10 text-slate-900'
            }`}
          >
            <option value="">All Profiles</option>
            <option value="cash_flow">Cash Flow</option>
            <option value="appreciation">Appreciation</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Markets List */}
      <form.Field name="markets">
        {(field) => {
          const selectedMarkets = field.state.value || []

          const handleMarketToggle = (marketId: string) => {
            const current = selectedMarkets
            if (current.includes(marketId)) {
              // Remove market
              field.handleChange(current.filter((id) => id !== marketId))
            } else {
              // Add market (max 3)
              if (current.length < 3) {
                field.handleChange([...current, marketId])
              }
            }
          }

          // Step is optional - allow 0-3 markets
          const isValid = selectedMarkets.length <= 3

          return (
            <>
              {/* Selected Count */}
              <div className="flex items-center justify-between mb-4">
                <p
                  className={`text-sm font-medium ${
                    isDark ? 'text-white/60' : 'text-slate-500'
                  }`}
                >
                  {selectedMarkets.length} of 3 markets selected
                  {!hasFilters && (
                    <span className="ml-2 opacity-60">(Trending markets)</span>
                  )}
                </p>
              </div>

              {isLoading ? (
                <div
                  className={`p-16 rounded-[4rem] border text-center ${
                    isDark
                      ? 'bg-[#1A1A1A] border-white/5'
                      : 'bg-white border-black/5 shadow-2xl'
                  }`}
                >
                  <p className="text-lg font-medium">Loading markets...</p>
                </div>
              ) : markets.length === 0 ? (
                <div
                  className={`p-16 rounded-[4rem] border text-center ${
                    isDark
                      ? 'bg-[#1A1A1A] border-white/5'
                      : 'bg-white border-black/5 shadow-2xl'
                  }`}
                >
                  <p className="text-lg font-medium">No markets found</p>
                </div>
              ) : (
                <div className="space-y-3 mb-12 max-h-[500px] overflow-y-auto">
                  {markets.map((market) => {
                    const isSelected = selectedMarkets.includes(market.id)
                    const isDisabled =
                      !isSelected && selectedMarkets.length >= 3

                    return (
                      <button
                        key={market.id}
                        type="button"
                        onClick={() => handleMarketToggle(market.id)}
                        disabled={isDisabled}
                        className={`w-full p-6 rounded-[2rem] border text-left transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-[#E8FF4D] text-black border-[#E8FF4D] shadow-lg'
                              : 'bg-violet-600 text-white border-violet-600 shadow-xl'
                            : isDisabled
                              ? isDark
                                ? 'bg-white/5 border-white/5 opacity-30 cursor-not-allowed'
                                : 'bg-white border-black/5 opacity-30 cursor-not-allowed'
                              : isDark
                                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                : 'bg-white border-black/5 hover:border-violet-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-xl font-black uppercase mb-1">
                              {market.name}, {market.state}
                            </h4>
                            {market.region && (
                              <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
                                {market.region}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {market.investmentProfile?.map((profile) => (
                                <span
                                  key={profile}
                                  className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                                    isSelected
                                      ? 'bg-black/10'
                                      : isDark
                                        ? 'bg-white/10'
                                        : 'bg-black/5'
                                  }`}
                                >
                                  {profile.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            {market.avgCapRate && (
                              <div className="mb-1">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                  Cap Rate
                                </p>
                                <p className="text-lg font-black tabular-nums">
                                  {market.avgCapRate.toFixed(1)}%
                                </p>
                              </div>
                            )}
                            {market.medianPrice && (
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                  Median Price
                                </p>
                                <p className="text-sm font-black tabular-nums">
                                  ${(market.medianPrice / 1000).toFixed(0)}k
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? isDark
                                    ? 'border-black bg-black'
                                    : 'border-white bg-white'
                                  : isDark
                                    ? 'border-white/30'
                                    : 'border-black/30'
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke={isDark ? '#E8FF4D' : '#6366f1'}
                                  strokeWidth="4"
                                >
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-4 mt-12">
                <button
                  type="button"
                  onClick={onBack}
                  className={`flex-1 py-6 rounded-3xl font-black text-xs uppercase tracking-widest border ${
                    isDark
                      ? 'border-white/10 text-white/40'
                      : 'border-black/10 text-slate-400'
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!isValid}
                  onClick={onComplete}
                  className={`flex-[2] py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${
                    isValid
                      ? isDark
                        ? 'bg-[#E8FF4D] text-black shadow-lg shadow-[#E8FF4D]/30 hover:scale-105'
                        : 'bg-violet-600 text-white shadow-xl shadow-violet-200 hover:scale-105'
                      : 'opacity-20 cursor-not-allowed'
                  }`}
                >
                  Complete Onboarding
                </button>
              </div>
            </>
          )
        }}
      </form.Field>
    </div>
  )
}
