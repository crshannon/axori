/**
 * Glossary Content Loader
 *
 * Aggregates all glossary terms from category JSON files
 * and provides utilities for accessing content.
 */

import type { GlossaryTerm, GlossaryCategory } from "@axori/shared";

// Import glossary files
import financingData from "./financing.json";
import operationsData from "./operations.json";
import valuationData from "./valuation.json";
import taxationData from "./taxation.json";
import investmentMetricsData from "./investment-metrics.json";
import strategiesData from "./strategies.json";
import acquisitionData from "./acquisition.json";
import legalData from "./legal.json";
import marketAnalysisData from "./market-analysis.json";
import propertyTypesData from "./property-types.json";

/**
 * All glossary terms from all categories
 */
export const allGlossaryTerms: GlossaryTerm[] = [
  ...financingData.terms,
  ...operationsData.terms,
  ...valuationData.terms,
  ...taxationData.terms,
  ...investmentMetricsData.terms,
  ...strategiesData.terms,
  ...acquisitionData.terms,
  ...legalData.terms,
  ...marketAnalysisData.terms,
  ...propertyTypesData.terms,
] as GlossaryTerm[];

/**
 * Get terms organized by category
 */
export const termsByCategory: Record<GlossaryCategory, GlossaryTerm[]> = {
  financing: financingData.terms as GlossaryTerm[],
  operations: operationsData.terms as GlossaryTerm[],
  valuation: valuationData.terms as GlossaryTerm[],
  taxation: taxationData.terms as GlossaryTerm[],
  "investment-metrics": investmentMetricsData.terms as GlossaryTerm[],
  strategies: strategiesData.terms as GlossaryTerm[],
  acquisition: acquisitionData.terms as GlossaryTerm[],
  legal: legalData.terms as GlossaryTerm[],
  "market-analysis": marketAnalysisData.terms as GlossaryTerm[],
  "property-types": propertyTypesData.terms as GlossaryTerm[],
};

/**
 * Get a single term by slug
 */
export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return allGlossaryTerms.find((term) => term.slug === slug);
}

/**
 * Get terms by category
 */
export function getTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return termsByCategory[category] || [];
}

/**
 * Get terms by investor level
 */
export function getTermsByLevel(
  level: "beginner" | "intermediate" | "advanced"
): GlossaryTerm[] {
  return allGlossaryTerms.filter((term) => term.investorLevel === level);
}

/**
 * Get related terms for a given term
 */
export function getRelatedTerms(term: GlossaryTerm): GlossaryTerm[] {
  return term.relatedTerms
    .map((slug) => getTermBySlug(slug))
    .filter((t): t is GlossaryTerm => t !== undefined);
}

/**
 * Get terms organized by first letter for A-Z navigation
 */
export function getTermsByLetter(): Record<string, GlossaryTerm[]> {
  const result: Record<string, GlossaryTerm[]> = {};

  allGlossaryTerms.forEach((term) => {
    const letter = term.term.charAt(0).toUpperCase();
    if (!result[letter]) {
      result[letter] = [];
    }
    result[letter].push(term);
  });

  // Sort terms within each letter
  Object.keys(result).forEach((letter) => {
    result[letter].sort((a, b) => a.term.localeCompare(b.term));
  });

  return result;
}

/**
 * Get count of terms per category
 */
export function getCategoryCounts(): Record<GlossaryCategory, number> {
  return Object.entries(termsByCategory).reduce(
    (acc, [category, terms]) => {
      acc[category as GlossaryCategory] = terms.length;
      return acc;
    },
    {} as Record<GlossaryCategory, number>
  );
}

/**
 * Get count of terms per level
 */
export function getLevelCounts(): Record<string, number> {
  return {
    beginner: getTermsByLevel("beginner").length,
    intermediate: getTermsByLevel("intermediate").length,
    advanced: getTermsByLevel("advanced").length,
  };
}

/**
 * Total number of glossary terms
 */
export const totalTermCount = allGlossaryTerms.length;
