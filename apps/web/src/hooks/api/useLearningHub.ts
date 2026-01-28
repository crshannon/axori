/**
 * Learning Hub API Hooks
 *
 * TanStack Query hooks for learning hub progress, bookmarks, and achievements.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

// =====================================================
// TYPES
// =====================================================

export type LearningContentType = "term" | "article" | "path" | "lesson" | "quiz";
export type LearningProgressStatus = "viewed" | "in_progress" | "completed";

export interface LearningProgress {
  id: string;
  userId: string;
  contentType: LearningContentType;
  contentSlug: string;
  status: LearningProgressStatus;
  progressData: Record<string, unknown> | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningBookmark {
  id: string;
  userId: string;
  contentType: LearningContentType;
  contentSlug: string;
  createdAt: string;
}

export interface LearningAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  metadata: Record<string, unknown> | null;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizSlug: string;
  score: number;
  maxScore: number;
  answers: Record<string, unknown>;
  completedAt: string;
}

export interface LearningStats {
  termsViewed: number;
  articlesRead: number;
  pathsCompleted: number;
  pathsInProgress: number;
  totalBookmarks: number;
  achievementsUnlocked: number;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const learningHubKeys = {
  all: ["learning-hub"] as const,
  progress: () => [...learningHubKeys.all, "progress"] as const,
  progressItem: (contentType: LearningContentType, slug: string) =>
    [...learningHubKeys.progress(), contentType, slug] as const,
  bookmarks: () => [...learningHubKeys.all, "bookmarks"] as const,
  bookmarksByType: (contentType?: LearningContentType) =>
    [...learningHubKeys.bookmarks(), contentType] as const,
  achievements: () => [...learningHubKeys.all, "achievements"] as const,
  quizAttempts: (slug: string) => [...learningHubKeys.all, "quiz", slug, "attempts"] as const,
  stats: () => [...learningHubKeys.all, "stats"] as const,
};

// =====================================================
// PROGRESS HOOKS
// =====================================================

/**
 * Get all learning progress for current user
 */
export function useLearningProgress() {
  return useQuery({
    queryKey: learningHubKeys.progress(),
    queryFn: async () => {
      const response = await apiFetch<{ progress: Array<LearningProgress> }>("/api/learning-hub/progress");
      return response.progress;
    },
  });
}

/**
 * Get progress for a specific content item
 */
export function useLearningProgressItem(contentType: LearningContentType, slug: string) {
  return useQuery({
    queryKey: learningHubKeys.progressItem(contentType, slug),
    queryFn: async () => {
      const response = await apiFetch<{ progress: LearningProgress | null }>(
        `/api/learning-hub/progress/${contentType}/${slug}`
      );
      return response.progress;
    },
    enabled: !!slug,
  });
}

/**
 * Create or update learning progress
 */
export function useUpsertLearningProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contentType: LearningContentType;
      contentSlug: string;
      status?: LearningProgressStatus;
      progressData?: Record<string, unknown>;
    }) => {
      const response = await apiFetch<{ progress: LearningProgress }>("/api/learning-hub/progress", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.progress;
    },
    onSuccess: (data) => {
      // Invalidate progress queries
      queryClient.invalidateQueries({ queryKey: learningHubKeys.progress() });
      queryClient.invalidateQueries({
        queryKey: learningHubKeys.progressItem(data.contentType, data.contentSlug),
      });
      queryClient.invalidateQueries({ queryKey: learningHubKeys.stats() });
    },
  });
}

// =====================================================
// BOOKMARKS HOOKS
// =====================================================

/**
 * Get all bookmarks for current user
 */
export function useLearningBookmarks(contentType?: LearningContentType) {
  return useQuery({
    queryKey: learningHubKeys.bookmarksByType(contentType),
    queryFn: async () => {
      const url = contentType
        ? `/api/learning-hub/bookmarks?contentType=${contentType}`
        : "/api/learning-hub/bookmarks";
      const response = await apiFetch<{ bookmarks: Array<LearningBookmark> }>(url);
      return response.bookmarks;
    },
  });
}

/**
 * Add a bookmark
 */
export function useAddLearningBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { contentType: LearningContentType; contentSlug: string }) => {
      const response = await apiFetch<{ bookmark: LearningBookmark }>("/api/learning-hub/bookmarks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.bookmark;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningHubKeys.bookmarks() });
      queryClient.invalidateQueries({ queryKey: learningHubKeys.stats() });
    },
  });
}

/**
 * Remove a bookmark
 */
export function useRemoveLearningBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentType, slug }: { contentType: LearningContentType; slug: string }) => {
      await apiFetch<{ success: boolean }>(`/api/learning-hub/bookmarks/${contentType}/${slug}`, {
        method: "DELETE",
      });
      return { contentType, slug };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningHubKeys.bookmarks() });
      queryClient.invalidateQueries({ queryKey: learningHubKeys.stats() });
    },
  });
}

// =====================================================
// ACHIEVEMENTS HOOKS
// =====================================================

/**
 * Get all achievements for current user
 */
export function useLearningAchievements() {
  return useQuery({
    queryKey: learningHubKeys.achievements(),
    queryFn: async () => {
      const response = await apiFetch<{ achievements: Array<LearningAchievement> }>(
        "/api/learning-hub/achievements"
      );
      return response.achievements;
    },
  });
}

/**
 * Unlock an achievement
 */
export function useUnlockLearningAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { achievementId: string; metadata?: Record<string, unknown> }) => {
      const response = await apiFetch<{ achievement: LearningAchievement }>(
        "/api/learning-hub/achievements",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return response.achievement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningHubKeys.achievements() });
      queryClient.invalidateQueries({ queryKey: learningHubKeys.stats() });
    },
  });
}

// =====================================================
// QUIZ HOOKS
// =====================================================

/**
 * Get quiz attempts for a specific quiz
 */
export function useQuizAttempts(slug: string) {
  return useQuery({
    queryKey: learningHubKeys.quizAttempts(slug),
    queryFn: async () => {
      const response = await apiFetch<{ attempts: Array<QuizAttempt> }>(
        `/api/learning-hub/quizzes/${slug}/attempts`
      );
      return response.attempts;
    },
    enabled: !!slug,
  });
}

/**
 * Submit a quiz attempt
 */
export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      score,
      maxScore,
      answers,
    }: {
      slug: string;
      score: number;
      maxScore: number;
      answers: Record<string, unknown>;
    }) => {
      const response = await apiFetch<{ attempt: QuizAttempt }>(
        `/api/learning-hub/quizzes/${slug}/attempts`,
        {
          method: "POST",
          body: JSON.stringify({ score, maxScore, answers }),
        }
      );
      return response.attempt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: learningHubKeys.quizAttempts(data.quizSlug) });
      queryClient.invalidateQueries({ queryKey: learningHubKeys.stats() });
    },
  });
}

// =====================================================
// STATS HOOKS
// =====================================================

/**
 * Get learning stats for current user
 */
export function useLearningStats() {
  return useQuery({
    queryKey: learningHubKeys.stats(),
    queryFn: async () => {
      const response = await apiFetch<{ stats: LearningStats }>("/api/learning-hub/stats");
      return response.stats;
    },
  });
}
