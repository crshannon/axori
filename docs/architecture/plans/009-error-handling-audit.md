# Error Handling & Tracking Audit

**Date**: 2024-12-XX  
**Status**: ✅ Complete (Ready for Testing)  
**Related**: `.skills/architect/best-practices.md`, `apps/api/src/utils/errors.ts`, `apps/api/src/utils/tracking/`

## Summary

Implemented centralized error handling with automatic error tracking to PostHog. The tracking system is platform-agnostic and can be easily swapped to other providers.

## Implementation Complete ✅

### 1. Error Handling Utilities (`apps/api/src/utils/errors.ts`)

**Status**: ✅ Complete with tracking integration

- `withErrorHandling()` - Route wrapper for automatic error handling
- `validateData()` - Data validation with context logging
- `validateRequest()` - Request validation with context
- `handleError()` - Generic error handler with tracking
- `handleZodError()` - Zod-specific error handler with tracking

**Features**:

- Automatic error logging with full context
- Automatic error tracking to PostHog
- Consistent error response format
- Database error code handling (PostgreSQL)

### 2. Tracking System (`apps/api/src/utils/tracking/`)

**Status**: ✅ Complete

**Architecture**:

- **Interface** (`index.ts`) - Platform-agnostic `TrackingProvider` interface
- **Provider** (`providers/posthog.ts`) - PostHog implementation
- **Manager** (`index.ts`) - Singleton `TrackingManager` for routing

**Features**:

- Platform-agnostic interface (easily swappable)
- PostHog provider implementation
- Graceful degradation (no-op when disabled)
- Automatic error tracking integration

### 3. Integration

**Status**: ✅ Complete

- Tracking initialized in `apps/api/src/index.ts`
- Error handlers automatically track to PostHog
- Console logging remains for local debugging

## Configuration

### Environment Variables

```bash
# Required for PostHog tracking
POSTHOG_API_KEY=your_posthog_api_key

# Optional
POSTHOG_HOST=https://app.posthog.com  # Default
POSTHOG_ENABLED=true                   # Default: true
```

### Tracking Initialization

Tracking is automatically initialized on API startup:

```typescript
// apps/api/src/index.ts
import { tracking } from "./utils/tracking";
import { initializePostHog } from "./utils/tracking/providers/posthog";

const posthogProvider = initializePostHog();
if (posthogProvider) {
  tracking.initialize(posthogProvider, true);
  console.log("✓ PostHog tracking initialized");
} else {
  console.log("⚠️  Tracking disabled (no PostHog API key)");
}
```

## Error Tracking Events

All errors are automatically tracked as `$exception` events:

### Validation Errors

```json
{
  "event": "$exception",
  "properties": {
    "errorType": "ValidationError",
    "route": "/api/properties/123",
    "operation": "updateProperty",
    "method": "PUT",
    "validationErrors": [...],
    "errorCount": 3
  }
}
```

### API Errors

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

## Swapping Tracking Providers

To swap from PostHog to another provider:

1. **Implement `TrackingProvider` interface** in `providers/[provider-name].ts`
2. **Update initialization** in `apps/api/src/index.ts`
3. **No other changes needed** - error handlers use the interface

See `apps/api/src/utils/tracking/README.md` for detailed guide.

## Testing

### Without PostHog

- Tracking automatically disabled if `POSTHOG_API_KEY` not set
- Console warning on startup
- App continues normally (graceful degradation)

### With PostHog

1. Set `POSTHOG_API_KEY` in `.env.local`
2. Trigger errors in API routes
3. Check PostHog dashboard for `$exception` events

See `apps/api/src/utils/tracking/TESTING.md` for detailed testing guide.

## Next Steps

1. ✅ **Error handling utilities** - Complete
2. ✅ **Tracking system** - Complete
3. ✅ **Integration** - Complete
4. ⏳ **Testing** - Ready for testing (waiting on PostHog account)
5. ⏳ **Route migration** - Routes can be migrated incrementally

## Files Created/Modified

### New Files

- `apps/api/src/utils/tracking/index.ts` - Tracking interface and manager
- `apps/api/src/utils/tracking/providers/posthog.ts` - PostHog provider
- `apps/api/src/utils/tracking/README.md` - Usage documentation
- `apps/api/src/utils/tracking/TESTING.md` - Testing guide

### Modified Files

- `apps/api/src/utils/errors.ts` - Added tracking integration
- `apps/api/src/index.ts` - Added tracking initialization
- `.skills/architect/best-practices.md` - Added error handling patterns
- `.skills/architect/SKILL.md` - Added error handling reference

## Benefits

1. **No More Hunting** - All errors automatically logged and tracked
2. **Platform Agnostic** - Easily swap tracking providers
3. **Graceful Degradation** - Works without tracking configured
4. **Consistent Format** - All errors follow same format
5. **Full Context** - Route, operation, and error details tracked
6. **Production Ready** - Error tracking for debugging production issues

## References

- Error utilities: `apps/api/src/utils/errors.ts`
- Tracking utilities: `apps/api/src/utils/tracking/`
- Usage guide: `apps/api/src/utils/tracking/README.md`
- Testing guide: `apps/api/src/utils/tracking/TESTING.md`
- Best practices: `.skills/architect/best-practices.md#error-handling-consistency`
