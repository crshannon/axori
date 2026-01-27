/**
 * useLearningContext Hook
 *
 * Provides unified access to user's learning context:
 * - Onboarding data (persona, phase, strategy)
 * - Portfolio metrics (from properties API)
 * - Learning activity (from localStorage)
 *
 * Used by the recommendation engine to personalize content.
 */

import { useMemo, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import {
  getViewedTerms,
  getBookmarks,
  getLearningStats,
} from "@/lib/learning-hub/progress";
import type { UserLearningContext } from "@/lib/learning-hub/recommendations";

// Types for API responses
interface OnboardingData {
  phase?: string;
  persona?: string;
  strategy?: string;
  freedomNumber?: number;
  markets?: string[];
}

interface PortfolioSummary {
  totalProperties: number;
  totalEquity: number;
  propertyTypes: string[];
  loanTypes: string[];
  hasLoans: boolean;
}

/**
 * Fetch user's onboarding data from API
 */
function useOnboardingData() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["user", "onboarding"],
    queryFn: async (): Promise<OnboardingData | null> => {
      if (!user?.id) return null;

      try {
        const response = await apiFetch<{
          onboardingData: string | null;
        }>("/api/users/me", { clerkId: user.id });

        if (response.onboardingData) {
          return JSON.parse(response.onboardingData) as OnboardingData;
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch portfolio summary from API
 */
function usePortfolioSummary() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["portfolio", "summary"],
    queryFn: async (): Promise<PortfolioSummary> => {
      if (!user?.id) {
        return {
          totalProperties: 0,
          totalEquity: 0,
          propertyTypes: [],
          loanTypes: [],
          hasLoans: false,
        };
      }

      try {
        // Try to get portfolio data from properties API
        const properties = await apiFetch<Array<{
          propertyType?: string;
          currentValue?: number;
          loan?: {
            loanType?: string;
            currentBalance?: number;
          };
        }>>("/api/properties", { clerkId: user.id });

        const propertyTypes = [...new Set(
          properties
            .map((p) => p.propertyType)
            .filter((t): t is string => !!t)
        )];

        const loanTypes = [...new Set(
          properties
            .map((p) => p.loan?.loanType)
            .filter((t): t is string => !!t)
        )];

        const totalEquity = properties.reduce((sum, p) => {
          const value = p.currentValue || 0;
          const loanBalance = p.loan?.currentBalance || 0;
          return sum + (value - loanBalance);
        }, 0);

        return {
          totalProperties: properties.length,
          totalEquity,
          propertyTypes,
          loanTypes,
          hasLoans: loanTypes.length > 0,
        };
      } catch {
        return {
          totalProperties: 0,
          totalEquity: 0,
          propertyTypes: [],
          loanTypes: [],
          hasLoans: false,
        };
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Internal hook to get activity data from localStorage
 * Re-renders when activity changes
 */
function useActivityData() {
  const [activity, setActivity] = useState(() => ({
    viewedTermSlugs: getViewedTerms().map((t) => t.slug),
    bookmarkedSlugs: getBookmarks()
      .filter((b) => b.contentType === "term")
      .map((b) => b.slug),
    stats: getLearningStats(),
  }));

  // Refresh activity data periodically and on focus
  useEffect(() => {
    const refresh = () => {
      setActivity({
        viewedTermSlugs: getViewedTerms().map((t) => t.slug),
        bookmarkedSlugs: getBookmarks()
          .filter((b) => b.contentType === "term")
          .map((b) => b.slug),
        stats: getLearningStats(),
      });
    };

    // Refresh on window focus
    window.addEventListener("focus", refresh);

    // Refresh every 30 seconds
    const interval = setInterval(refresh, 30000);

    return () => {
      window.removeEventListener("focus", refresh);
      clearInterval(interval);
    };
  }, []);

  return activity;
}

/**
 * Main hook to get unified learning context
 */
export function useLearningContext() {
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingData();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolioSummary();
  const activity = useActivityData();

  const context = useMemo<UserLearningContext>(() => ({
    // Onboarding data
    persona: onboarding?.persona as UserLearningContext["persona"],
    phase: onboarding?.phase as UserLearningContext["phase"],
    strategy: onboarding?.strategy as UserLearningContext["strategy"],
    freedomNumber: onboarding?.freedomNumber,

    // Portfolio data
    totalProperties: portfolio?.totalProperties || 0,
    totalEquity: portfolio?.totalEquity || 0,
    hasLoans: portfolio?.hasLoans || false,
    propertyTypes: portfolio?.propertyTypes || [],
    loanTypes: portfolio?.loanTypes || [],

    // Activity data
    viewedTermSlugs: activity.viewedTermSlugs,
    bookmarkedSlugs: activity.bookmarkedSlugs,
  }), [onboarding, portfolio, activity]);

  return {
    context,
    stats: activity.stats,
    isLoading: onboardingLoading || portfolioLoading,
    hasOnboarding: !!onboarding,
    hasPortfolio: (portfolio?.totalProperties || 0) > 0,
  };
}

/**
 * Lighter hook for just activity tracking
 * Use when you don't need full context
 */
export function useLearningActivity() {
  const [viewedCount, setViewedCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setViewedCount(getViewedTerms().length);
      setBookmarkCount(getBookmarks().length);
    };

    refresh();
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return {
    viewedCount,
    bookmarkCount,
    refresh: () => {
      setViewedCount(getViewedTerms().length);
      setBookmarkCount(getBookmarks().length);
    },
  };
}
