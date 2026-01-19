/**
 * PostHog Tracking Provider
 *
 * Implementation of TrackingProvider using PostHog
 */

import type { TrackingProvider, TrackingEvent } from "../index";

interface PostHogConfig {
  apiKey: string;
  host?: string; // PostHog host (default: https://app.posthog.com)
  enabled?: boolean;
}

/**
 * PostHog tracking provider implementation
 */
export class PostHogProvider implements TrackingProvider {
  private apiKey: string;
  private host: string;
  private enabled: boolean;

  constructor(config: PostHogConfig) {
    this.apiKey = config.apiKey;
    this.host = config.host || "https://app.posthog.com";
    this.enabled = config.enabled ?? true;
  }

  /**
   * Capture an event via PostHog API
   */
  async capture(event: TrackingEvent): Promise<void> {
    if (!this.enabled) return;

    const payload = {
      api_key: this.apiKey,
      event: event.event,
      properties: {
        ...event.properties,
        timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
        $lib: "axori-api",
        $lib_version: process.env.npm_package_version || "1.0.0",
      },
      distinct_id: event.distinctId || event.userId || "anonymous",
    };

    // Use fetch to send to PostHog
    try {
      const response = await fetch(`${this.host}/capture/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`PostHog API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // Log but don't throw - tracking failures shouldn't break the app
      console.error("[POSTHOG ERROR]", error);
      throw error; // Re-throw to be caught by TrackingManager
    }
  }

  /**
   * Capture an exception/error via PostHog
   */
  async captureException(
    error: Error | unknown,
    context?: Record<string, unknown>
  ): Promise<void> {
    if (!this.enabled) return;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorType = error?.constructor?.name || "UnknownError";

    await this.capture({
      event: "$exception",
      properties: {
        $exception_message: errorMessage,
        $exception_type: errorType,
        ...(errorStack && { $exception_stack: errorStack }),
        ...context,
      },
    });
  }

  /**
   * Identify a user (PostHog supports this)
   * Uses the same /capture/ endpoint with $identify event
   */
  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    if (!this.enabled) return;

    // PostHog identify is done via a special $identify event
    await this.capture({
      event: "$identify",
      distinctId: userId,
      properties: {
        $set: traits || {},
      },
    });
  }
}

/**
 * Initialize PostHog tracking from environment variables
 */
export function initializePostHog(): PostHogProvider | null {
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST;
  const enabled = process.env.POSTHOG_ENABLED !== "false";

  if (!apiKey) {
    console.warn("[TRACKING] PostHog API key not found. Tracking disabled.");
    return null;
  }

  return new PostHogProvider({
    apiKey,
    host,
    enabled,
  });
}

