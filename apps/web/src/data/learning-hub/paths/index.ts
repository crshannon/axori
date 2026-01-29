/**
 * Learning Paths Content Loader
 *
 * Aggregates all learning paths from JSON files
 * and provides utilities for accessing content.
 */


// Import path files
import realEstateInvesting101 from "./real-estate-investing-101.json";
import masteringBrrrr from "./mastering-brrrr.json";
import taxOptimizationBasics from "./tax-optimization-basics.json";
import financingFundamentals from "./financing-fundamentals.json";
import analyzingDeals from "./analyzing-deals.json";
import type { InvestorLevel, InvestorPersona, LearningPath } from "@axori/shared";

/**
 * All learning paths
 */
export const allLearningPaths: Array<LearningPath> = [
  realEstateInvesting101,
  financingFundamentals,
  masteringBrrrr,
  taxOptimizationBasics,
  analyzingDeals,
] as Array<LearningPath>;

/**
 * Get a single path by slug
 */
export function getPathBySlug(slug: string): LearningPath | undefined {
  return allLearningPaths.find((path) => path.slug === slug);
}

/**
 * Get paths by investor level
 */
export function getPathsByLevel(level: InvestorLevel): Array<LearningPath> {
  return allLearningPaths.filter((path) => path.investorLevel === level);
}

/**
 * Get paths targeting a specific persona
 */
export function getPathsByPersona(persona: InvestorPersona): Array<LearningPath> {
  return allLearningPaths.filter((path) =>
    path.targetPersonas.includes(persona)
  );
}

/**
 * Get paths that are published
 */
export function getPublishedPaths(): Array<LearningPath> {
  return allLearningPaths.filter((path) => path.status === "published");
}

/**
 * Get paths organized by level
 */
export function getPathsByLevelGrouped(): Record<InvestorLevel, Array<LearningPath>> {
  return {
    beginner: getPathsByLevel("beginner"),
    intermediate: getPathsByLevel("intermediate"),
    advanced: getPathsByLevel("advanced"),
  };
}

/**
 * Get total lessons count for a path
 */
export function getPathLessonCount(path: LearningPath): number {
  return path.modules.reduce((total, module) => total + module.lessons.length, 0);
}

/**
 * Get total estimated time for a path in minutes
 */
export function getPathTotalMinutes(path: LearningPath): number {
  return path.modules.reduce(
    (total, module) =>
      total +
      module.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.estimatedMinutes, 0),
    0
  );
}

/**
 * Get prerequisite paths for a given path
 */
export function getPrerequisitePaths(path: LearningPath): Array<LearningPath> {
  if (!path.prerequisites) return [];
  return path.prerequisites
    .map((slug) => getPathBySlug(slug))
    .filter((p): p is LearningPath => p !== undefined);
}

/**
 * Total number of learning paths
 */
export const totalPathCount = allLearningPaths.length;
