/**
 * Learning Hub Recommendation Engine
 *
 * Generates personalized content recommendations based on:
 * - User's onboarding data (persona, phase, strategy)
 * - Portfolio composition (property types, loan types)
 * - Learning activity (viewed terms, gaps)
 */

import { getViewedTerms } from "./progress";
import type { GlossaryCategory } from "@axori/shared";
import { allGlossaryTerms } from "@/data/learning-hub/glossary";

// ============================================
// Types
// ============================================

export interface UserLearningContext {
  // From onboarding
  persona?: "freedom-seeker" | "wealth-builder" | "tax-optimizer" | "legacy-builder";
  phase?: "researching" | "first-property" | "scaling" | "optimizing";
  strategy?: "buy-and-hold" | "brrrr" | "house-hacking" | "fix-and-flip" | "mixed";
  freedomNumber?: number;

  // From portfolio
  totalProperties: number;
  totalEquity: number;
  hasLoans: boolean;
  propertyTypes: Array<string>;
  loanTypes: Array<string>;

  // From activity
  viewedTermSlugs: Array<string>;
  bookmarkedSlugs: Array<string>;
}

export interface Recommendation {
  type: "term" | "article" | "path" | "calculator";
  slug: string;
  title: string;
  description: string;
  reason: string;
  priority: number; // 1-10, higher = more relevant
  category?: GlossaryCategory;
}

// ============================================
// Recommendation Rules
// ============================================

// Terms recommended by persona
const PERSONA_TERMS: Partial<Record<string, Array<string>>> = {
  "freedom-seeker": ["cash-flow", "passive-income", "noi", "cap-rate", "dscr"],
  "wealth-builder": ["equity", "appreciation", "leverage", "refinance", "brrrr"],
  "tax-optimizer": ["depreciation", "1031-exchange", "cost-segregation", "passive-losses", "bonus-depreciation"],
  "legacy-builder": ["llc", "asset-protection", "estate-planning", "cash-flow", "equity"],
};

// Terms recommended by phase
const PHASE_TERMS: Partial<Record<string, Array<string>>> = {
  researching: ["cap-rate", "cash-on-cash-return", "noi", "cash-flow", "dscr", "ltv"],
  "first-property": ["closing-costs", "due-diligence", "earnest-money", "inspection", "conventional-loan", "fha-loan"],
  scaling: ["portfolio-loan", "dscr-loan", "refinance", "brrrr", "1031-exchange", "syndication"],
  optimizing: ["cost-segregation", "depreciation", "tax-loss-harvesting", "refinance", "equity-stripping"],
};

// Terms recommended by strategy
const STRATEGY_TERMS: Partial<Record<string, Array<string>>> = {
  "buy-and-hold": ["cash-flow", "appreciation", "cap-rate", "noi", "vacancy-rate"],
  brrrr: ["brrrr", "arv", "hard-money-loan", "refinance", "equity", "forced-appreciation"],
  "house-hacking": ["house-hacking", "fha-loan", "owner-occupied", "rental-income", "pmi"],
  "fix-and-flip": ["arv", "hard-money-loan", "closing-costs", "holding-costs", "roi"],
  mixed: ["diversification", "portfolio-management", "risk-management", "asset-allocation"],
};

// Essential terms everyone should know (by category)
const ESSENTIAL_TERMS: Record<GlossaryCategory, Array<string>> = {
  financing: ["ltv", "dscr", "interest-rate", "amortization"],
  valuation: ["cap-rate", "arv", "comps"],
  operations: ["noi", "vacancy-rate", "gross-rent"],
  taxation: ["depreciation", "1031-exchange"],
  acquisition: ["closing-costs", "due-diligence"],
  legal: ["llc", "title-insurance"],
  "market-analysis": ["absorption-rate", "days-on-market"],
  "investment-metrics": ["cash-on-cash-return", "roi", "irr"],
  "property-types": ["sfr", "multifamily"],
  strategies: ["brrrr", "house-hacking"],
};

// ============================================
// Recommendation Generator
// ============================================

/**
 * Generate personalized recommendations
 */
export function generateRecommendations(
  context: UserLearningContext,
  limit = 10
): Array<Recommendation> {
  const recommendations: Array<Recommendation> = [];
  const viewedSet = new Set(context.viewedTermSlugs);

  // Helper to add term recommendation if not already viewed
  const addTermRecommendation = (
    slug: string,
    reason: string,
    priority: number
  ) => {
    if (viewedSet.has(slug)) return;
    if (recommendations.some((r) => r.slug === slug)) return;

    const term = allGlossaryTerms.find((t) => t.slug === slug);
    if (!term) return;

    recommendations.push({
      type: "term",
      slug: term.slug,
      title: term.term,
      description: term.shortDefinition,
      reason,
      priority,
      category: term.category,
    });
  };

  // 1. Persona-based recommendations (priority 9)
  const personaTerms = context.persona ? PERSONA_TERMS[context.persona] : undefined;
  if (personaTerms) {
    const personaReasons: Record<string, string> = {
      "freedom-seeker": "Essential for achieving financial freedom",
      "wealth-builder": "Key to building long-term wealth",
      "tax-optimizer": "Critical for tax optimization strategy",
      "legacy-builder": "Important for building generational wealth",
    };
    personaTerms.forEach((slug) => {
      addTermRecommendation(
        slug,
        personaReasons[context.persona!] || "Matches your investor profile",
        9
      );
    });
  }

  // 2. Phase-based recommendations (priority 8)
  const phaseTerms = context.phase ? PHASE_TERMS[context.phase] : undefined;
  if (phaseTerms) {
    const phaseReasons: Record<string, string> = {
      researching: "Fundamental concept for new investors",
      "first-property": "Important for your first acquisition",
      scaling: "Key to growing your portfolio",
      optimizing: "Essential for portfolio optimization",
    };
    phaseTerms.forEach((slug) => {
      addTermRecommendation(
        slug,
        phaseReasons[context.phase!] || "Relevant to your current phase",
        8
      );
    });
  }

  // 3. Strategy-based recommendations (priority 7)
  const strategyTerms = context.strategy ? STRATEGY_TERMS[context.strategy] : undefined;
  if (strategyTerms) {
    addTermRecommendation(
      strategyTerms[0],
      `Core concept for ${context.strategy!.replace(/-/g, " ")} strategy`,
      7
    );
    strategyTerms.slice(1).forEach((slug) => {
      addTermRecommendation(
        slug,
        `Supports your ${context.strategy!.replace(/-/g, " ")} approach`,
        6
      );
    });
  }

  // 4. Portfolio-based recommendations (priority 7)
  if (context.hasLoans) {
    addTermRecommendation("dscr", "Important for your financed properties", 7);
    addTermRecommendation("refinance", "Potential opportunity for your loans", 6);
    addTermRecommendation("interest-rate", "Affects your loan costs", 6);
  }

  if (context.totalProperties > 0) {
    addTermRecommendation("noi", "Track performance of your properties", 7);
    addTermRecommendation("cap-rate", "Benchmark your property values", 6);
    addTermRecommendation("depreciation", "Tax benefit for your properties", 7);
  }

  if (context.totalProperties >= 3) {
    addTermRecommendation("portfolio-loan", "Consolidate your financing", 6);
    addTermRecommendation("1031-exchange", "Tax-deferred growth strategy", 7);
  }

  // 5. Gap-based recommendations - find unviewed essentials (priority 5)
  const viewedCategories = new Set<GlossaryCategory>();
  context.viewedTermSlugs.forEach((slug) => {
    const term = allGlossaryTerms.find((t) => t.slug === slug);
    if (term) viewedCategories.add(term.category);
  });

  Object.entries(ESSENTIAL_TERMS).forEach(([category, slugs]) => {
    if (!viewedCategories.has(category as GlossaryCategory)) {
      // User hasn't explored this category - recommend essentials
      slugs.slice(0, 2).forEach((slug) => {
        addTermRecommendation(
          slug,
          `Explore ${category.replace(/-/g, " ")} concepts`,
          5
        );
      });
    }
  });

  // 6. Related to bookmarks (priority 4)
  context.bookmarkedSlugs.slice(0, 3).forEach((bookmarkedSlug) => {
    const bookmarkedTerm = allGlossaryTerms.find((t) => t.slug === bookmarkedSlug);
    if (bookmarkedTerm?.relatedTerms) {
      bookmarkedTerm.relatedTerms.slice(0, 2).forEach((relatedSlug) => {
        addTermRecommendation(
          relatedSlug,
          `Related to your bookmarked term: ${bookmarkedTerm.term}`,
          4
        );
      });
    }
  });

  // Sort by priority (descending) and limit
  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/**
 * Get quick recommendations without full context
 * Uses just the journey selection from the Learning Hub
 */
export function getQuickRecommendations(
  journey: "builder" | "optimizer" | "explorer",
  viewedSlugs: Array<string> = [],
  limit = 5
): Array<Recommendation> {
  const journeyMappings: Record<string, Partial<UserLearningContext>> = {
    builder: {
      persona: "wealth-builder",
      phase: "scaling",
      strategy: "brrrr",
    },
    optimizer: {
      persona: "tax-optimizer",
      phase: "optimizing",
      strategy: "buy-and-hold",
    },
    explorer: {
      persona: "freedom-seeker",
      phase: "researching",
      strategy: "buy-and-hold",
    },
  };

  const context: UserLearningContext = {
    ...journeyMappings[journey],
    totalProperties: 0,
    totalEquity: 0,
    hasLoans: false,
    propertyTypes: [],
    loanTypes: [],
    viewedTermSlugs: viewedSlugs,
    bookmarkedSlugs: [],
  };

  return generateRecommendations(context, limit);
}

/**
 * Get "continue learning" recommendations based on recently viewed
 */
export function getContinueLearning(limit = 5): Array<Recommendation> {
  const viewed = getViewedTerms();
  const recommendations: Array<Recommendation> = [];

  // Get related terms from recently viewed
  viewed.slice(0, 3).forEach((viewedTerm) => {
    const term = allGlossaryTerms.find((t) => t.slug === viewedTerm.slug);
    if (term?.relatedTerms) {
      term.relatedTerms.forEach((relatedSlug) => {
        // Skip if already viewed or already in recommendations
        if (viewed.some((v) => v.slug === relatedSlug)) return;
        if (recommendations.some((r) => r.slug === relatedSlug)) return;

        const relatedTerm = allGlossaryTerms.find((t) => t.slug === relatedSlug);
        if (!relatedTerm) return;

        recommendations.push({
          type: "term",
          slug: relatedTerm.slug,
          title: relatedTerm.term,
          description: relatedTerm.shortDefinition,
          reason: `Related to ${term.term}`,
          priority: 5,
          category: relatedTerm.category,
        });
      });
    }
  });

  return recommendations.slice(0, limit);
}

/**
 * Get terms to explore a category
 */
export function getCategoryRecommendations(
  category: GlossaryCategory,
  viewedSlugs: Array<string> = [],
  limit = 5
): Array<Recommendation> {
  const viewedSet = new Set(viewedSlugs);

  const categoryTerms = allGlossaryTerms
    .filter((t) => t.category === category && !viewedSet.has(t.slug))
    .sort((a, b) => {
      // Prioritize beginner terms, then by term name
      const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      const levelDiff = levelOrder[a.investorLevel] - levelOrder[b.investorLevel];
      if (levelDiff !== 0) return levelDiff;
      return a.term.localeCompare(b.term);
    })
    .slice(0, limit);

  return categoryTerms.map((term) => ({
    type: "term" as const,
    slug: term.slug,
    title: term.term,
    description: term.shortDefinition,
    reason: `Explore ${category.replace(/-/g, " ")}`,
    priority: 5,
    category: term.category,
  }));
}
