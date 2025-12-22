import { useMemo, useState } from 'react'
import { useMarkets } from '../hooks/useMarkets'
import type { OnboardingForm } from '../hooks/useOnboardingForm'

interface Step7MarketSelectionProps {
  form: OnboardingForm
  onComplete: () => void
  isDark: boolean
}

export function Step7MarketSelection({
  form,
  onComplete,
  isDark,
}: Step7MarketSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Get selected markets from form
  const selectedMarketIds = form.state.values.markets || []

  // Show trending markets when no search is applied
  const hasFilters = !!searchQuery

  // Fetch trending markets when no search
  const { data: trendingMarkets = [], isLoading: isLoadingTrending } =
    useMarkets({
      active: true,
      trending: !hasFilters, // Show trending when no search
    })

  // Fetch selected markets if any are selected and no search
  const { data: selectedMarketsData = [], isLoading: isLoadingSelected } =
    useMarkets({
      active: true,
      ids:
        !hasFilters && selectedMarketIds.length > 0
          ? selectedMarketIds
          : undefined,
    })

  // Combine and deduplicate markets
  const combinedMarkets = useMemo(() => {
    if (hasFilters) {
      // When searching, return empty (we'll use searchResults)
      return []
    }

    // Combine trending and selected markets, deduplicate by ID
    const uniqueMarkets = new Map<string, (typeof trendingMarkets)[0]>()

    // Add selected markets first (so they appear at the top)
    selectedMarketsData.forEach((market) => {
      uniqueMarkets.set(market.id, market)
    })

    // Add trending markets (won't overwrite selected ones)
    trendingMarkets.forEach((market) => {
      if (!uniqueMarkets.has(market.id)) {
        uniqueMarkets.set(market.id, market)
      }
    })

    return Array.from(uniqueMarkets.values())
  }, [trendingMarkets, selectedMarketsData, hasFilters])

  // Fetch search results when searching
  const { data: searchResults = [], isLoading: isLoadingSearch } = useMarkets({
    search: searchQuery || undefined,
    active: true,
  })

  const isLoading = hasFilters
    ? isLoadingSearch
    : isLoadingTrending || isLoadingSelected
  const displayMarkets = hasFilters ? searchResults : combinedMarkets

  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-huge mb-4">Select Your Markets</h3>
      <p className="text-xl text-slate-400 font-medium mb-8 italic">
        Choose up to 3 target markets (optional)
      </p>

      {/* Search */}
      <div className="mb-6">
        <div
          className={`p-3 rounded-2xl border ${
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
            className={`w-full px-4 py-2 rounded-xl border font-medium bg-transparent text-sm ${
              isDark
                ? 'border-white/10 text-white placeholder:text-white/40'
                : 'border-black/10 text-slate-900 placeholder:text-slate-400'
            }`}
          />
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
                    <span className="ml-2 opacity-60">
                      {selectedMarkets.length > 0
                        ? '(Your selections + trending)'
                        : '(Trending markets)'}
                    </span>
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
              ) : displayMarkets.length === 0 ? (
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
                <div className="grid grid-cols-1 gap-3 mb-12 max-h-[400px] overflow-y-auto">
                  {displayMarkets.map((market) => {
                    const isSelected = selectedMarkets.includes(market.id)
                    const isDisabled =
                      !isSelected && selectedMarkets.length >= 3

                    return (
                      <button
                        key={market.id}
                        type="button"
                        onClick={() => handleMarketToggle(market.id)}
                        disabled={isDisabled}
                        className={`w-full p-6 rounded-[2rem] border flex items-center gap-4 transition-all group ${
                          isSelected
                            ? isDark
                              ? 'bg-[#E8FF4D] text-black border-[#E8FF4D]'
                              : 'bg-violet-600 text-white border-violet-600 shadow-xl'
                            : isDisabled
                              ? isDark
                                ? 'bg-white/5 border-white/5 opacity-30 cursor-not-allowed'
                                : 'bg-white border-black/5 opacity-30 cursor-not-allowed'
                              : isDark
                                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                : 'bg-white border-black/5 hover:border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-black uppercase tracking-tight truncate">
                              {market.name}, {market.state}
                            </h4>
                            {market.investmentProfile &&
                              market.investmentProfile.length > 0 && (
                                <div className="flex gap-1 flex-shrink-0">
                                  {market.investmentProfile
                                    .slice(0, 2)
                                    .map((profile) => (
                                      <span
                                        key={profile}
                                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
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
                              )}
                          </div>
                          {(market.avgCapRate || market.medianPrice) && (
                            <div className="flex gap-4 text-xs">
                              {market.avgCapRate && (
                                <span className="font-black tabular-nums opacity-70">
                                  {market.avgCapRate.toFixed(1)}% cap
                                </span>
                              )}
                              {market.medianPrice && (
                                <span className="font-black tabular-nums opacity-70">
                                  ${(market.medianPrice / 1000).toFixed(0)}k
                                  median
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border flex-shrink-0 ${
                            isSelected
                              ? 'border-current'
                              : 'border-current opacity-10'
                          }`}
                        >
                          {isSelected ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          ) : (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-12">
                <button
                  type="button"
                  disabled={!isValid}
                  onClick={onComplete}
                  className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${
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
