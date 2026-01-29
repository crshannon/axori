/**
 * Learning Hub Data Migration
 *
 * Migrates localStorage learning hub data to the database via API.
 * This ensures users don't lose their progress when we switch to database storage.
 */

import type { LearningContentType } from "@/hooks/api/useLearningHub";

// Storage keys (same as in progress.ts)
const STORAGE_PREFIX = "axori:learning-hub";
const VIEWED_TERMS_KEY = `${STORAGE_PREFIX}:viewed-terms`;
const BOOKMARKS_KEY = `${STORAGE_PREFIX}:bookmarks`;
const PATH_PROGRESS_KEY = `${STORAGE_PREFIX}:path-progress`;
const MIGRATION_KEY = `${STORAGE_PREFIX}:migrated`;

// Types matching progress.ts
interface LocalViewedTerm {
  slug: string;
  viewedAt: string;
  viewCount: number;
}

interface LocalBookmark {
  contentType: "term" | "article" | "path";
  slug: string;
  title: string;
  bookmarkedAt: string;
}

interface LocalPathProgress {
  pathSlug: string;
  completedLessons: Array<string>;
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
}

// Helper to safely read localStorage
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Check if migration has already been completed
 */
export function isMigrationComplete(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MIGRATION_KEY) === "true";
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MIGRATION_KEY, "true");
}

/**
 * Check if there's any localStorage data to migrate
 */
export function hasLocalStorageData(): boolean {
  if (typeof window === "undefined") return false;

  const viewedTerms = getStorageItem<Record<string, LocalViewedTerm>>(VIEWED_TERMS_KEY, {});
  const bookmarks = getStorageItem<Array<LocalBookmark>>(BOOKMARKS_KEY, []);
  const pathProgress = getStorageItem<Record<string, LocalPathProgress>>(PATH_PROGRESS_KEY, {});

  return (
    Object.keys(viewedTerms).length > 0 ||
    bookmarks.length > 0 ||
    Object.keys(pathProgress).length > 0
  );
}

/**
 * Get localStorage data for migration
 */
export function getLocalStorageData() {
  const viewedTerms = getStorageItem<Record<string, LocalViewedTerm>>(VIEWED_TERMS_KEY, {});
  const bookmarks = getStorageItem<Array<LocalBookmark>>(BOOKMARKS_KEY, []);
  const pathProgress = getStorageItem<Record<string, LocalPathProgress>>(PATH_PROGRESS_KEY, {});

  return {
    viewedTerms: Object.values(viewedTerms),
    bookmarks,
    pathProgress: Object.values(pathProgress),
  };
}

/**
 * Migrate a single progress item to the API
 */
async function migrateProgress(
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>,
  contentType: LearningContentType,
  contentSlug: string,
  status: "viewed" | "in_progress" | "completed" = "viewed",
  progressData?: Record<string, unknown>
): Promise<boolean> {
  try {
    await apiFetch("/api/learning-hub/progress", {
      method: "POST",
      body: JSON.stringify({
        contentType,
        contentSlug,
        status,
        progressData,
      }),
    });
    return true;
  } catch (error) {
    console.error(`Failed to migrate progress for ${contentType}:${contentSlug}`, error);
    return false;
  }
}

/**
 * Migrate a single bookmark to the API
 */
async function migrateBookmark(
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>,
  contentType: LearningContentType,
  contentSlug: string
): Promise<boolean> {
  try {
    await apiFetch("/api/learning-hub/bookmarks", {
      method: "POST",
      body: JSON.stringify({
        contentType,
        contentSlug,
      }),
    });
    return true;
  } catch (error) {
    console.error(`Failed to migrate bookmark for ${contentType}:${contentSlug}`, error);
    return false;
  }
}

/**
 * Migrate all localStorage data to the database
 *
 * @param apiFetch - The API fetch function from the app
 * @returns Migration result with counts
 */
export async function migrateToDatabase(
  apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>
): Promise<{
  success: boolean;
  migratedTerms: number;
  migratedBookmarks: number;
  migratedPaths: number;
  errors: number;
}> {
  // Skip if already migrated
  if (isMigrationComplete()) {
    return {
      success: true,
      migratedTerms: 0,
      migratedBookmarks: 0,
      migratedPaths: 0,
      errors: 0,
    };
  }

  const { viewedTerms, bookmarks, pathProgress } = getLocalStorageData();

  let migratedTerms = 0;
  let migratedBookmarks = 0;
  let migratedPaths = 0;
  let errors = 0;

  // Migrate viewed terms
  for (const term of viewedTerms) {
    const success = await migrateProgress(apiFetch, "term", term.slug, "viewed");
    if (success) {
      migratedTerms++;
    } else {
      errors++;
    }
  }

  // Migrate bookmarks
  for (const bookmark of bookmarks) {
    const contentType = bookmark.contentType as LearningContentType;
    const success = await migrateBookmark(apiFetch, contentType, bookmark.slug);
    if (success) {
      migratedBookmarks++;
    } else {
      errors++;
    }
  }

  // Migrate path progress
  for (const path of pathProgress) {
    const status = path.completedAt ? "completed" : "in_progress";
    const success = await migrateProgress(apiFetch, "path", path.pathSlug, status, {
      completedLessons: path.completedLessons,
      startedAt: path.startedAt,
      lastActivityAt: path.lastActivityAt,
    });
    if (success) {
      migratedPaths++;
    } else {
      errors++;
    }
  }

  // Mark as complete if no errors (or if there was no data to migrate)
  const totalItems = viewedTerms.length + bookmarks.length + pathProgress.length;
  if (errors === 0 || totalItems === 0) {
    markMigrationComplete();
  }

  return {
    success: errors === 0,
    migratedTerms,
    migratedBookmarks,
    migratedPaths,
    errors,
  };
}

/**
 * Clear localStorage data after successful migration
 * Only call this after confirming migration was successful
 */
export function clearMigratedData(): void {
  if (typeof window === "undefined") return;

  // Only clear if migration is complete
  if (!isMigrationComplete()) {
    console.warn("Cannot clear data before migration is complete");
    return;
  }

  localStorage.removeItem(VIEWED_TERMS_KEY);
  localStorage.removeItem(BOOKMARKS_KEY);
  localStorage.removeItem(PATH_PROGRESS_KEY);
}

/**
 * Reset migration status (for testing/debugging)
 */
export function resetMigrationStatus(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MIGRATION_KEY);
}
