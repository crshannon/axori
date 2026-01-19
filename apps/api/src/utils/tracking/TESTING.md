# Tracking Testing Guide

## Testing Without PostHog Account

Tracking is designed to fail gracefully. If `POSTHOG_API_KEY` is not set:

1. Tracking will be disabled automatically
2. Console warning: `⚠️  Tracking disabled (no PostHog API key)`
3. All tracking calls become no-ops
4. App continues normally

## Testing With PostHog

### 1. Get PostHog API Key

1. Create account at https://posthog.com
2. Create a project
3. Go to Project Settings → Project API Key
4. Copy the API key

### 2. Set Environment Variables

Add to your `.env.local`:

```bash
POSTHOG_API_KEY=your_api_key_here
POSTHOG_HOST=https://app.posthog.com  # Optional, defaults to this
POSTHOG_ENABLED=true                   # Optional, defaults to true
```

### 3. Test Error Tracking

Trigger validation errors to see tracking in action:

```bash
# Test validation error
curl -X POST http://localhost:3001/api/properties \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Check PostHog dashboard for $exception event with errorType: "ValidationError"
```

### 4. Verify Events in PostHog

1. Go to PostHog dashboard
2. Navigate to "Events" or "Live Events"
3. Look for:
   - `$exception` events with `errorType: "ValidationError"`
   - `$exception` events with `errorType: "ApiError"`
   - Route, operation, and context properties

## Test Checklist

- [ ] Tracking initializes correctly (check console on API start)
- [ ] Validation errors are tracked automatically
- [ ] API errors are tracked automatically
- [ ] Database errors are tracked automatically
- [ ] Events appear in PostHog dashboard
- [ ] Error context (route, operation) is included
- [ ] Tracking failures don't break the app (graceful degradation)

## Manual Testing

### Test 1: Validation Error Tracking

```typescript
// In any route handler
const validated = validateData(invalidData, mySchema, {
  operation: "testOperation",
});
// Should trigger validation error and track to PostHog
```

### Test 2: API Error Tracking

```typescript
// In any route handler
throw new ApiError("Test error", 500, { operation: "testOperation" });
// Should track to PostHog
```

### Test 3: Custom Event Tracking

```typescript
import { tracking } from "../utils/tracking";

await tracking.capture({
  event: "test_event",
  properties: { test: "value" },
});
// Check PostHog for "test_event"
```

## Expected Event Properties

### Validation Error Event

```json
{
  "event": "$exception",
  "properties": {
    "errorType": "ValidationError",
    "route": "/api/properties/123",
    "operation": "updateProperty",
    "method": "PUT",
    "$exception_message": "Validation failed",
    "$exception_type": "ZodError",
    "validationErrors": [...],
    "errorCount": 3
  }
}
```

### API Error Event

```json
{
  "event": "$exception",
  "properties": {
    "errorType": "ApiError",
    "route": "/api/properties/123",
    "operation": "updateProperty",
    "method": "PUT",
    "userId": "user_123",
    "$exception_message": "Property not found",
    "$exception_type": "ApiError"
  }
}
```
