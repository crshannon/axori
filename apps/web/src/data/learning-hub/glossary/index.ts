/**
 * Glossary Content Loader
 *
 * Aggregates all glossary terms from category JSON files
 * and provides utilities for accessing content.
 */


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
import type { GlossaryCategory, GlossaryTerm } from "@axori/shared";

/**
 * All glossary terms from all categories
 */
export const allGlossaryTerms: Array<GlossaryTerm> = [
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
] as Array<GlossaryTerm>;

/**
 * Get terms organized by category
 */
export const termsByCategory: Record<GlossaryCategory, Array<GlossaryTerm>> = {
  financing: financingData.terms as Array<GlossaryTerm>,
  operations: operationsData.terms as Array<GlossaryTerm>,
  valuation: valuationData.terms as Array<GlossaryTerm>,
  taxation: taxationData.terms as Array<GlossaryTerm>,
  "investment-metrics": investmentMetricsData.terms as Array<GlossaryTerm>,
  strategies: strategiesData.terms as Array<GlossaryTerm>,
  acquisition: acquisitionData.terms as Array<GlossaryTerm>,
  legal: legalData.terms as Array<GlossaryTerm>,
  "market-analysis": marketAnalysisData.terms as Array<GlossaryTerm>,
  "property-types": propertyTypesData.terms as Array<GlossaryTerm>,
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
export function getTermsByCategory(category: GlossaryCategory): Array<GlossaryTerm> {
  return termsByCategory[category];
}

/**
 * Get terms by investor level
 */
export function getTermsByLevel(
  level: "beginner" | "intermediate" | "advanced"
): Array<GlossaryTerm> {
  return allGlossaryTerms.filter((term) => term.investorLevel === level);
}

/**
 * Get related terms for a given term
 */
export function getRelatedTerms(term: GlossaryTerm): Array<GlossaryTerm> {
  return term.relatedTerms
    .map((slug) => getTermBySlug(slug))
    .filter((t): t is GlossaryTerm => t !== undefined);
}

/**
 * Get terms organized by first letter for A-Z navigation
 */
export function getTermsByLetter(): Record<string, Array<GlossaryTerm>> {
  const result: Partial<Record<string, Array<GlossaryTerm>>> = {};

  allGlossaryTerms.forEach((term) => {
    const letter = term.term.charAt(0).toUpperCase();
    const existing = result[letter];
    if (existing) {
      existing.push(term);
    } else {
      result[letter] = [term];
    }
  });

  // Sort terms within each letter
  Object.keys(result).forEach((letter) => {
    result[letter]?.sort((a, b) => a.term.localeCompare(b.term));
  });

  return result as Record<string, Array<GlossaryTerm>>;
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
