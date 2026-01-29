/**
 * Learning Hub Migration Hook
 *
 * Automatically migrates localStorage learning data to the database
 * when the user is authenticated.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiFetch } from "@/lib/api/client";
import {
  clearMigratedData,
  hasLocalStorageData,
  isMigrationComplete,
  migrateToDatabase,
} from "@/lib/learning-hub/migration";

interface MigrationStatus {
  /** Whether migration is currently running */
  isMigrating: boolean;
  /** Whether migration has been completed (either now or previously) */
  isComplete: boolean;
  /** Migration result if just completed */
  result?: {
    success: boolean;
    migratedTerms: number;
    migratedBookmarks: number;
    migratedPaths: number;
    errors: number;
  };
  /** Error if migration failed */
  error?: Error;
}

/**
 * Hook to handle learning hub data migration
 *
 * Automatically runs migration when:
 * - User is authenticated
 * - There's localStorage data to migrate
 * - Migration hasn't been completed yet
 *
 * @param options.autoMigrate - Whether to auto-migrate on mount (default: true)
 * @param options.clearAfterMigration - Whether to clear localStorage after migration (default: false)
 */
export function useLearningHubMigration(options?: {
  autoMigrate?: boolean;
  clearAfterMigration?: boolean;
}) {
  const { autoMigrate = true, clearAfterMigration = false } = options ?? {};
  const { isSignedIn, isLoaded } = useAuth();
  const [status, setStatus] = useState<MigrationStatus>({
    isMigrating: false,
    isComplete: isMigrationComplete(),
  });

  /**
   * Manually trigger migration
   */
  const migrate = useCallback(async () => {
    if (!isSignedIn) {
      setStatus((prev) => ({
        ...prev,
        error: new Error("User must be signed in to migrate data"),
      }));
      return;
    }

    if (isMigrationComplete()) {
      setStatus((prev) => ({ ...prev, isComplete: true }));
      return;
    }

    if (!hasLocalStorageData()) {
      setStatus((prev) => ({ ...prev, isComplete: true }));
      return;
    }

    setStatus((prev) => ({ ...prev, isMigrating: true, error: undefined }));

    try {
      const result = await migrateToDatabase(apiFetch);

      setStatus({
        isMigrating: false,
        isComplete: result.success,
        result,
      });

      // Clear localStorage if requested and migration was successful
      if (clearAfterMigration && result.success) {
        clearMigratedData();
      }
    } catch (error) {
      setStatus({
        isMigrating: false,
        isComplete: false,
        error: error instanceof Error ? error : new Error("Migration failed"),
      });
    }
  }, [isSignedIn, clearAfterMigration]);

  // Auto-migrate when user is authenticated
  useEffect(() => {
    if (!autoMigrate || !isLoaded || !isSignedIn) return;
    if (isMigrationComplete() || !hasLocalStorageData()) return;

    migrate();
  }, [autoMigrate, isLoaded, isSignedIn, migrate]);

  return {
    ...status,
    migrate,
    hasLocalData: hasLocalStorageData(),
  };
}

export default useLearningHubMigration;
