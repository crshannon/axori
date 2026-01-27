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
  const viewed = getStorageItem<Record<string, ViewedTerm>>(VIEWED_TERMS_KEY, {});
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
export function getViewedTerms(): ViewedTerm[] {
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
  const bookmarks = getStorageItem<Bookmark[]>(BOOKMARKS_KEY, []);

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
  const bookmarks = getStorageItem<Bookmark[]>(BOOKMARKS_KEY, []);
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
  const bookmarks = getStorageItem<Bookmark[]>(BOOKMARKS_KEY, []);
  return bookmarks.some(
    (b) => b.contentType === contentType && b.slug === slug
  );
}

/**
 * Get all bookmarks
 */
export function getBookmarks(): Bookmark[] {
  return getStorageItem<Bookmark[]>(BOOKMARKS_KEY, []);
}

/**
 * Get bookmarks by type
 */
export function getBookmarksByType(
  contentType: Bookmark["contentType"]
): Bookmark[] {
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
  const recent = getStorageItem<RecentlyViewedItem[]>(RECENTLY_VIEWED_KEY, []);

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
export function getRecentlyViewed(limit = 10): RecentlyViewedItem[] {
  const recent = getStorageItem<RecentlyViewedItem[]>(RECENTLY_VIEWED_KEY, []);
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
  const recent = getStorageItem<RecentlyViewedItem[]>(RECENTLY_VIEWED_KEY, []);
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

  const history = getStorageItem<SearchHistoryItem[]>(SEARCH_HISTORY_KEY, []);

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
export function getSearchHistory(limit = 10): SearchHistoryItem[] {
  const history = getStorageItem<SearchHistoryItem[]>(SEARCH_HISTORY_KEY, []);
  return history.slice(0, limit);
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  setStorageItem(SEARCH_HISTORY_KEY, []);
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

  return {
    totalTermsViewed: viewedTerms.length,
    totalBookmarks: bookmarks.length,
    recentActivityCount: recentlyViewed.length,
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
}
