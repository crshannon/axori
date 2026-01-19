# Analytics Tracking Utility

Platform-agnostic tracking interface that can be easily swapped between different analytics providers (PostHog, Mixpanel, etc.).

## Architecture

The tracking system is designed with three layers:

1. **Interface** (`index.ts`) - Platform-agnostic `TrackingProvider` interface
2. **Providers** (`providers/`) - Implementation-specific providers (PostHog, etc.)
3. **Manager** (`index.ts`) - Singleton `TrackingManager` that routes to active provider

## Current Provider: PostHog

PostHog is the current tracking provider. To swap to a different provider:

1. Implement the `TrackingProvider` interface in `providers/[provider-name].ts`
2. Initialize it in `apps/api/src/index.ts`
3. Update the `initialize` call

## Usage

### Automatic Error Tracking

Error tracking is automatically integrated into `apps/api/src/utils/errors.ts`:

- **Validation Errors**: Tracked as `$exception` with `errorType: "ValidationError"`
- **API Errors**: Tracked as `$exception` with context (route, operation, etc.)
- **Database Errors**: Tracked as `$exception` with PostgreSQL error codes

No manual tracking needed - it's handled automatically by error handlers.

### Console Logging (Local Development)

In development/local mode (`NODE_ENV=development` or `NODE_ENV=local`), all tracking events are automatically logged to the console:

```
[TRACKING EVENT] 2024-12-18T23:48:18.406Z
{
  "event": "property_created",
  "properties": {
    "propertyId": "123"
  },
  "userId": "user_123"
}

[TRACKING EXCEPTION] 2024-12-18T23:48:18.406Z
{
  "errorType": "ValidationError",
  "errorMessage": "Validation failed",
  "context": {
    "route": "/api/properties/123",
    "operation": "updateProperty"
  }
}
```

This makes it easy to see what's being tracked without needing to check PostHog during development.

### Manual Event Tracking

To manually track custom events:

```typescript
import { tracking } from "../utils/tracking";

// Track a custom event
await tracking.capture({
  event: "property_created",
  properties: {
    propertyId: "123",
    propertyType: "Single Family",
  },
  userId: "user_123",
});

// Track an exception manually
await tracking.captureException(new Error("Something went wrong"), {
  customContext: "value",
});

// Identify a user
await tracking.identify("user_123", {
  email: "user@example.com",
  firstName: "John",
});
```

## Configuration

### Environment Variables

PostHog is configured via environment variables:

```bash
# Required
POSTHOG_API_KEY=your_posthog_api_key

# Optional
POSTHOG_HOST=https://app.posthog.com  # Default: https://app.posthog.com
POSTHOG_ENABLED=true                   # Default: true (set to false to disable)
```

### Initialization

Tracking is initialized in `apps/api/src/index.ts`:

```typescript
import { tracking } from "./utils/tracking";
import { initializePostHog } from "./utils/tracking/providers/posthog";

const posthogProvider = initializePostHog();
if (posthogProvider) {
  tracking.initialize(posthogProvider, true);
}
```

## Tracking Events

### Automatic Events

**Validation Errors** (`$exception`):

```typescript
{
  event: "$exception",
  properties: {
    errorType: "ValidationError",
    route: "/api/properties/123",
    operation: "updateProperty",
    validationErrors: [...],
    errorCount: 3,
  }
}
```

**API Errors** (`$exception`):

```typescript
{
  event: "$exception",
  properties: {
    errorType: "ApiError",
    route: "/api/properties/123",
    operation: "updateProperty",
    userId: "user_123",
    $exception_message: "Error message",
    $exception_type: "ApiError",
    $exception_stack: "...",
  }
}
```

## Swapping Providers

### Example: Switch to Mixpanel

1. **Create Mixpanel Provider** (`providers/mixpanel.ts`):

```typescript
import type { TrackingProvider, TrackingEvent } from "../index";

export class MixpanelProvider implements TrackingProvider {
  private client: any;

  constructor(config: { token: string }) {
    // Initialize Mixpanel client
    this.client = require("mixpanel").init(config.token);
  }

  async capture(event: TrackingEvent): Promise<void> {
    this.client.track(event.event, event.properties || {});
  }

  async captureException(
    error: Error | unknown,
    context?: Record<string, unknown>
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.client.track("exception", {
      error: errorMessage,
      ...context,
    });
  }
}

export function initializeMixpanel() {
  const token = process.env.MIXPANEL_TOKEN;
  if (!token) return null;
  return new MixpanelProvider({ token });
}
```

2. **Update Initialization** (`apps/api/src/index.ts`):

```typescript
import { initializeMixpanel } from "./utils/tracking/providers/mixpanel";

const mixpanelProvider = initializeMixpanel();
if (mixpanelProvider) {
  tracking.initialize(mixpanelProvider, true);
}
```

That's it! All error tracking will now use Mixpanel instead of PostHog.

## Error Handling

Tracking failures are handled gracefully:

- **Silent Failures**: If tracking fails, the app continues normally
- **Error Logging**: Tracking errors are logged to console (not thrown)
- **Fallback**: If no provider is configured, `NoopTrackingProvider` is used (no-op)

## Testing

### Disable Tracking in Tests

```typescript
import { tracking } from "../utils/tracking";
import { NoopTrackingProvider } from "../utils/tracking/index";

// Disable tracking for tests
tracking.initialize(new NoopTrackingProvider(), false);
```

### Mock Tracking in Tests

```typescript
const mockProvider = {
  capture: vi.fn(),
  captureException: vi.fn(),
};

tracking.initialize(mockProvider, true);
// ... test code
expect(mockProvider.captureException).toHaveBeenCalledWith(...);
```

## Security & Privacy

### Sensitive Data

The tracking utility automatically excludes sensitive data:

- **User Data**: Only `userId` is tracked, not full user objects
- **Request Data**: Only presence of data is tracked (`hasData: true`), not full payloads
- **Error Messages**: Only error messages/types are tracked, not full stack traces (unless explicitly included)

### Custom Filtering

Providers can implement additional filtering in their `capture`/`captureException` methods:

```typescript
async capture(event: TrackingEvent): Promise<void> {
  // Filter sensitive fields
  const sanitizedProperties = this.sanitizeProperties(event.properties || {});

  // Send to PostHog
  await this.sendToPostHog({
    ...event,
    properties: sanitizedProperties,
  });
}

private sanitizeProperties(props: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ["password", "apiKey", "token"];
  const sanitized = { ...props };

  for (const key of sensitive) {
    if (key in sanitized) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}
```

## Performance

Tracking is non-blocking:

- All tracking operations are async
- Failures don't block request handling
- Batch tracking (if needed) can be implemented in providers
