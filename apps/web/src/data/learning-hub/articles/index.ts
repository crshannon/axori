/**
 * Learning Articles Content Loader
 *
 * Aggregates all learning articles and provides utilities for accessing content.
 */

import articlesData from "./articles.json";
import type {
  GlossaryCategory,
  InvestorLevel,
  InvestorPersona,
  LearningArticle,
} from "@axori/shared";

// Import articles

/**
 * All learning articles
 */
export const allLearningArticles: Array<LearningArticle> =
  articlesData.articles as Array<LearningArticle>;

/**
 * Get a single article by slug
 */
export function getArticleBySlug(slug: string): LearningArticle | undefined {
  return allLearningArticles.find((article) => article.slug === slug);
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(
  category: GlossaryCategory
): Array<LearningArticle> {
  return allLearningArticles.filter((article) => article.category === category);
}

/**
 * Get articles by investor level
 */
export function getArticlesByLevel(level: InvestorLevel): Array<LearningArticle> {
  return allLearningArticles.filter((article) => article.investorLevel === level);
}

/**
 * Get articles targeting a specific persona
 */
export function getArticlesByPersona(persona: InvestorPersona): Array<LearningArticle> {
  return allLearningArticles.filter((article) =>
    article.targetPersonas.includes(persona)
  );
}

/**
 * Get published articles
 */
export function getPublishedArticles(): Array<LearningArticle> {
  return allLearningArticles.filter((article) => article.status === "published");
}

/**
 * Get articles by tag
 */
export function getArticlesByTag(tag: string): Array<LearningArticle> {
  return allLearningArticles.filter((article) =>
    article.tags.includes(tag.toLowerCase())
  );
}

/**
 * Get related articles for a given article
 */
export function getRelatedArticles(article: LearningArticle): Array<LearningArticle> {
  // First try explicit related articles
  const explicit = article.relatedArticles
    .map((slug) => getArticleBySlug(slug))
    .filter((a): a is LearningArticle => a !== undefined);

  if (explicit.length >= 3) return explicit.slice(0, 3);

  // Fill with articles from same category
  const sameCategory = allLearningArticles
    .filter((a) => a.slug !== article.slug && a.category === article.category)
    .slice(0, 3 - explicit.length);

  return [...explicit, ...sameCategory].slice(0, 3);
}

/**
 * Get all unique tags from articles
 */
export function getAllTags(): Array<string> {
  const tags = new Set<string>();
  allLearningArticles.forEach((article) => {
    article.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Total number of articles
 */
export const totalArticleCount = allLearningArticles.length;
