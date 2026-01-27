/**
 * Learning Hub Progress Tracking
 *
 * Tracks user progress, bookmarks, and activity using localStorage.
 * Will be migrated to database in Phase 5.
 */

// Storage keys
const STORAGE_PREFIX = "axori:learning-hub";
const VIEWED_TERMS_KEY = `${STORAGE_PREFIX}:viewed-terms`;
const BOOKMARKS_KEY = `${STORAGE_PREFIX}:bookmarks`;
const SEARCH_HISTORY_KEY = `${STORAGE_PREFIX}:search-history`;
const RECENTLY_VIEWED_KEY = `${STORAGE_PREFIX}:recently-viewed`;
const PATH_PROGRESS_KEY = `${STORAGE_PREFIX}:path-progress`;

// Types
export interface ViewedTerm {
  slug: string;
  viewedAt: string; // ISO date string
  viewCount: number;
}

export interface Bookmark {
  contentType: "term" | "article" | "path";
  slug: string;
  title: string;
  bookmarkedAt: string;
}

export interface RecentlyViewedItem {
  contentType: "term" | "article" | "path";
  slug: string;
  title: string;
  viewedAt: string;
}

export interface SearchHistoryItem {
  query: string;
  searchedAt: string;
  resultCount: number;
}

export interface PathProgress {
  pathSlug: string;
  completedLessons: Array<string>; // Lesson IDs
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
}

// Helper to safely access localStorage
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

// ============================================
// Viewed Terms Tracking
// ============================================

/**
 * Mark a term as viewed, incrementing view count
 */
export function markTermViewed(slug: string): void {
  const viewed = getStorageItem<Partial<Record<string, ViewedTerm>>>(VIEWED_TERMS_KEY, {});
  const existing = viewed[slug];

  viewed[slug] = {
    slug,
    viewedAt: new Date().toISOString(),
    viewCount: existing ? existing.viewCount + 1 : 1,
  };

  setStorageItem(VIEWED_TERMS_KEY, viewed);

  // Also add to recently viewed
  addToRecentlyViewed("term", slug, slug); // Title will be updated by caller
}

/**
 * Get all viewed terms
 */
export function getViewedTerms(): Array<ViewedTerm> {
  const viewed = getStorageItem<Record<string, ViewedTerm>>(VIEWED_TERMS_KEY, {});
  return Object.values(viewed).sort(
    (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
  );
}

/**
 * Check if a term has been viewed
 */
export function isTermViewed(slug: string): boolean {
  const viewed = getStorageItem<Record<string, ViewedTerm>>(VIEWED_TERMS_KEY, {});
  return !!viewed[slug];
}

/**
 * Get count of viewed terms
 */
export function getViewedTermCount(): number {
  const viewed = getStorageItem<Record<string, ViewedTerm>>(VIEWED_TERMS_KEY, {});
  return Object.keys(viewed).length;
}

// ============================================
// Bookmarks
// ============================================

/**
 * Add a bookmark
 */
export function addBookmark(
  contentType: Bookmark["contentType"],
  slug: string,
  title: string
): void {
  const bookmarks = getStorageItem<Array<Bookmark>>(BOOKMARKS_KEY, []);

  // Check if already bookmarked
  const exists = bookmarks.some(
    (b) => b.contentType === contentType && b.slug === slug
  );
  if (exists) return;

  bookmarks.unshift({
    contentType,
    slug,
    title,
    bookmarkedAt: new Date().toISOString(),
  });

  // Keep max 50 bookmarks
  if (bookmarks.length > 50) {
    bookmarks.pop();
  }

  setStorageItem(BOOKMARKS_KEY, bookmarks);
}

/**
 * Remove a bookmark
 */
export function removeBookmark(
  contentType: Bookmark["contentType"],
  slug: string
): void {
  const bookmarks = getStorageItem<Array<Bookmark>>(BOOKMARKS_KEY, []);
  const filtered = bookmarks.filter(
    (b) => !(b.contentType === contentType && b.slug === slug)
  );
  setStorageItem(BOOKMARKS_KEY, filtered);
}

/**
 * Toggle bookmark state
 */
export function toggleBookmark(
  contentType: Bookmark["contentType"],
  slug: string,
  title: string
): boolean {
  if (isBookmarked(contentType, slug)) {
    removeBookmark(contentType, slug);
    return false;
  } else {
    addBookmark(contentType, slug, title);
    return true;
  }
}

/**
 * Check if content is bookmarked
 */
export function isBookmarked(
  contentType: Bookmark["contentType"],
  slug: string
): boolean {
  const bookmarks = getStorageItem<Array<Bookmark>>(BOOKMARKS_KEY, []);
  return bookmarks.some(
    (b) => b.contentType === contentType && b.slug === slug
  );
}

/**
 * Get all bookmarks
 */
export function getBookmarks(): Array<Bookmark> {
  return getStorageItem<Array<Bookmark>>(BOOKMARKS_KEY, []);
}

/**
 * Get bookmarks by type
 */
export function getBookmarksByType(
  contentType: Bookmark["contentType"]
): Array<Bookmark> {
  return getBookmarks().filter((b) => b.contentType === contentType);
}

// ============================================
// Recently Viewed
// ============================================

/**
 * Add to recently viewed list
 */
export function addToRecentlyViewed(
  contentType: RecentlyViewedItem["contentType"],
  slug: string,
  title: string
): void {
  const recent = getStorageItem<Array<RecentlyViewedItem>>(RECENTLY_VIEWED_KEY, []);

  // Remove if already exists (to move to front)
  const filtered = recent.filter(
    (r) => !(r.contentType === contentType && r.slug === slug)
  );

  filtered.unshift({
    contentType,
    slug,
    title,
    viewedAt: new Date().toISOString(),
  });

  // Keep max 20 items
  if (filtered.length > 20) {
    filtered.pop();
  }

  setStorageItem(RECENTLY_VIEWED_KEY, filtered);
}

/**
 * Get recently viewed items
 */
export function getRecentlyViewed(limit = 10): Array<RecentlyViewedItem> {
  const recent = getStorageItem<Array<RecentlyViewedItem>>(RECENTLY_VIEWED_KEY, []);
  return recent.slice(0, limit);
}

/**
 * Update title for a recently viewed item
 * (Called when we have the full term data)
 */
export function updateRecentlyViewedTitle(
  contentType: RecentlyViewedItem["contentType"],
  slug: string,
  title: string
): void {
  const recent = getStorageItem<Array<RecentlyViewedItem>>(RECENTLY_VIEWED_KEY, []);
  const updated = recent.map((r) =>
    r.contentType === contentType && r.slug === slug ? { ...r, title } : r
  );
  setStorageItem(RECENTLY_VIEWED_KEY, updated);
}

// ============================================
// Search History
// ============================================

/**
 * Track a search query
 */
export function trackSearchQuery(query: string, resultCount: number): void {
  if (!query.trim()) return;

  const history = getStorageItem<Array<SearchHistoryItem>>(SEARCH_HISTORY_KEY, []);

  // Remove duplicate queries
  const filtered = history.filter(
    (h) => h.query.toLowerCase() !== query.toLowerCase()
  );

  filtered.unshift({
    query: query.trim(),
    searchedAt: new Date().toISOString(),
    resultCount,
  });

  // Keep max 20 searches
  if (filtered.length > 20) {
    filtered.pop();
  }

  setStorageItem(SEARCH_HISTORY_KEY, filtered);
}

/**
 * Get search history
 */
export function getSearchHistory(limit = 10): Array<SearchHistoryItem> {
  const history = getStorageItem<Array<SearchHistoryItem>>(SEARCH_HISTORY_KEY, []);
  return history.slice(0, limit);
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  setStorageItem(SEARCH_HISTORY_KEY, []);
}

// ============================================
// Path Progress Tracking
// ============================================

/**
 * Get all path progress data
 */
function getAllPathProgress(): Partial<Record<string, PathProgress>> {
  return getStorageItem<Partial<Record<string, PathProgress>>>(PATH_PROGRESS_KEY, {});
}

/**
 * Get progress for a specific path
 */
export function getPathProgress(pathSlug: string): PathProgress | null {
  const all = getAllPathProgress();
  return all[pathSlug] ?? null;
}

/**
 * Get completed lessons for a path
 */
export function getCompletedLessons(pathSlug: string): Array<string> {
  const progress = getPathProgress(pathSlug);
  return progress?.completedLessons || [];
}

/**
 * Mark a lesson as completed
 */
export function markLessonCompleted(
  pathSlug: string,
  lessonId: string,
  totalLessons: number
): void {
  const all = getAllPathProgress();
  const existing = all[pathSlug];
  const now = new Date().toISOString();

  if (existing) {
    // Add lesson if not already completed
    if (!existing.completedLessons.includes(lessonId)) {
      existing.completedLessons.push(lessonId);
    }
    existing.lastActivityAt = now;

    // Check if path is now complete
    if (existing.completedLessons.length >= totalLessons && !existing.completedAt) {
      existing.completedAt = now;
    }

    all[pathSlug] = existing;
  } else {
    // Create new progress entry
    all[pathSlug] = {
      pathSlug,
      completedLessons: [lessonId],
      startedAt: now,
      lastActivityAt: now,
      completedAt: totalLessons <= 1 ? now : undefined,
    };
  }

  setStorageItem(PATH_PROGRESS_KEY, all);
}

/**
 * Mark a lesson as incomplete
 */
export function markLessonIncomplete(pathSlug: string, lessonId: string): void {
  const all = getAllPathProgress();
  const existing = all[pathSlug];

  if (existing) {
    existing.completedLessons = existing.completedLessons.filter(
      (id) => id !== lessonId
    );
    existing.lastActivityAt = new Date().toISOString();
    // Remove completedAt if we're uncompleting a lesson
    existing.completedAt = undefined;
    all[pathSlug] = existing;
    setStorageItem(PATH_PROGRESS_KEY, all);
  }
}

/**
 * Check if a lesson is completed
 */
export function isLessonCompleted(pathSlug: string, lessonId: string): boolean {
  const completedLessons = getCompletedLessons(pathSlug);
  return completedLessons.includes(lessonId);
}

/**
 * Get all paths with progress
 */
export function getPathsWithProgress(): Array<PathProgress> {
  const all = getAllPathProgress();
  return Object.values(all)
    .filter((p): p is PathProgress => p !== undefined)
    .sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
}

/**
 * Get paths in progress (started but not completed)
 */
export function getPathsInProgress(): Array<PathProgress> {
  return getPathsWithProgress().filter(
    (p) => p.completedLessons.length > 0 && !p.completedAt
  );
}

/**
 * Get completed paths
 */
export function getCompletedPaths(): Array<PathProgress> {
  return getPathsWithProgress().filter((p) => p.completedAt);
}

// ============================================
// Stats & Analytics
// ============================================

/**
 * Get learning stats for display
 */
export function getLearningStats() {
  const viewedTerms = getViewedTerms();
  const bookmarks = getBookmarks();
  const recentlyViewed = getRecentlyViewed();
  const pathsInProgress = getPathsInProgress();
  const completedPaths = getCompletedPaths();

  return {
    totalTermsViewed: viewedTerms.length,
    totalBookmarks: bookmarks.length,
    recentActivityCount: recentlyViewed.length,
    pathsInProgress: pathsInProgress.length,
    pathsCompleted: completedPaths.length,
    mostViewedTerms: viewedTerms
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5),
    lastViewedAt: viewedTerms[0]?.viewedAt || null,
  };
}

/**
 * Clear all learning hub data (for testing/reset)
 */
export function clearAllLearningData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VIEWED_TERMS_KEY);
  localStorage.removeItem(BOOKMARKS_KEY);
  localStorage.removeItem(SEARCH_HISTORY_KEY);
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
  localStorage.removeItem(PATH_PROGRESS_KEY);
}
