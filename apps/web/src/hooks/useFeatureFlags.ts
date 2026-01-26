/**
 * Feature Flags Hook
 *
 * Provides access to feature flags for controlling app behavior.
 * Currently supports environment variables for build-time flags.
 *
 * TODO: Integrate with PostHog for runtime feature flags when needed.
 */

export interface FeatureFlags {
  /** When true, shows coming soon hero and hides auth */
  comingSoonMode: boolean;
  /** When true, allows sign-in/sign-up even in coming soon mode (for internal testing) */
  allowAuthBypass: boolean;
}

/**
 * Hook to access feature flags
 *
 * @returns Feature flags object
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { comingSoonMode } = useFeatureFlags();
 *
 *   if (comingSoonMode) {
 *     return <ComingSoonHero />;
 *   }
 *   return <RegularHero />;
 * }
 * ```
 */
export function useFeatureFlags(): FeatureFlags {
  // Environment variables are resolved at build time
  // VITE_ prefix makes them available to client-side code
  const comingSoonMode = import.meta.env.VITE_COMING_SOON_MODE === "true";
  const allowAuthBypass = import.meta.env.VITE_ALLOW_AUTH_BYPASS === "true";

  return {
    comingSoonMode,
    allowAuthBypass,
  };
}

/**
 * Convenience hook for coming soon mode
 *
 * @returns true if coming soon mode is enabled
 */
export function useComingSoonMode(): boolean {
  return useFeatureFlags().comingSoonMode;
}

/**
 * Check if auth should be shown
 * Auth is hidden in coming soon mode unless bypass is enabled
 *
 * @returns true if auth buttons should be visible
 */
export function useShowAuth(): boolean {
  const { comingSoonMode, allowAuthBypass } = useFeatureFlags();
  return !comingSoonMode || allowAuthBypass;
}
