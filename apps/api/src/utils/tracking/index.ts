/**
 * Analytics Tracking Utility
 *
 * Platform-agnostic tracking interface that can be easily swapped
 * between different analytics providers (PostHog, Mixpanel, etc.)
 */

import type { ErrorContext } from "../errors";

export interface TrackingEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  distinctId?: string;
  timestamp?: Date;
}

export interface TrackingProvider {
  /**
   * Capture an event
   */
  capture(event: TrackingEvent): Promise<void> | void;

  /**
   * Capture an error/exception
   */
  captureException(
    error: Error | unknown,
    context?: Record<string, unknown>
  ): Promise<void> | void;

  /**
   * Identify a user (optional, if provider supports it)
   */
  identify?(userId: string, traits?: Record<string, unknown>): Promise<void> | void;
}

/**
 * No-op tracking provider (default, when tracking is disabled)
 */
class NoopTrackingProvider implements TrackingProvider {
  capture(): void {
    // No-op
  }

  captureException(): void {
    // No-op
  }

  identify(): void {
    // No-op
  }
}

/**
 * Check if we're in development/local mode
 */
function isDevelopment(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "local" ||
    process.env.NODE_ENV === undefined // Default to dev if not set
  );
}

/**
 * Tracking manager - singleton that routes to the active provider
 */
class TrackingManager {
  private provider: TrackingProvider = new NoopTrackingProvider();
  private enabled = false;
  private logToConsole: boolean;

  constructor() {
    this.logToConsole = isDevelopment();
  }

  /**
   * Initialize tracking with a provider
   */
  initialize(provider: TrackingProvider, enabled = true): void {
    this.provider = provider;
    this.enabled = enabled;
  }

  /**
   * Check if tracking is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log tracking event to console (for local development)
   */
  private logToConsoleIfDevelopment(
    type: "event" | "exception" | "identify",
    data: Record<string, unknown>
  ): void {
    if (!this.logToConsole) return;

    const timestamp = new Date().toISOString();
    const prefix = `[TRACKING ${type.toUpperCase()}]`;

    // Format for readability in console
    console.log(prefix, timestamp);
    console.log(JSON.stringify(data, null, 2));
  }

  /**
   * Capture an event
   */
  async capture(event: TrackingEvent): Promise<void> {
    // Log to console in development
    if (this.logToConsole) {
      this.logToConsoleIfDevelopment("event", {
        event: event.event,
        properties: event.properties,
        userId: event.userId || event.distinctId || "anonymous",
        timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
      });
    }

    if (!this.enabled) return;
    try {
      await this.provider.capture(event);
    } catch (error) {
      // Fail silently - don't break the app if tracking fails
      console.error("[TRACKING ERROR]", error);
    }
  }

  /**
   * Capture an error/exception
   */
  async captureException(
    error: Error | unknown,
    context?: Record<string, unknown>
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorType = error?.constructor?.name || "UnknownError";

    // Log to console in development
    if (this.logToConsole) {
      this.logToConsoleIfDevelopment("exception", {
        errorType,
        errorMessage,
        ...(errorStack && { errorStack }),
        ...(context && { context }),
      });
    }

    if (!this.enabled) return;
    try {
      await this.provider.captureException(error, context);
    } catch (trackingError) {
      // Fail silently - don't break the app if tracking fails
      console.error("[TRACKING ERROR]", trackingError);
    }
  }

  /**
   * Identify a user (if provider supports it)
   */
  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    // Log to console in development
    if (this.logToConsole) {
      this.logToConsoleIfDevelopment("identify", {
        userId,
        ...(traits && { traits }),
      });
    }

    if (!this.enabled || !this.provider.identify) return;
    try {
      await this.provider.identify(userId, traits);
    } catch (error) {
      // Fail silently
      console.error("[TRACKING ERROR]", error);
    }
  }
}

// Export singleton instance
export const tracking = new TrackingManager();

/**
 * Helper to convert ErrorContext to tracking properties
 */
export function errorContextToProperties(
  context?: ErrorContext
): Record<string, unknown> {
  if (!context) return {};

  const properties: Record<string, unknown> = {};

  if (context.route) properties.route = context.route;
  if (context.method) properties.method = context.method;
  if (context.operation) properties.operation = context.operation;
  if (context.userId) properties.userId = context.userId;

  // Include params if present
  if (context.params && Object.keys(context.params).length > 0) {
    properties.params = context.params;
  }

  // Include sanitized data (limit size, remove sensitive fields)
  if (context.data) {
    properties.hasData = true;
    // Don't send full data - just indicate it was present
    // Individual providers can handle sensitive data filtering
  }

  return properties;
}

