/**
 * Forge Services
 *
 * Agent orchestration and execution services
 *
 * Token Optimization:
 * - Context window management (anthropic.ts)
 * - Rate limiting (rate-limiter.ts)
 * - Smart file reading (tools.ts)
 */

export {
  getAnthropicClient,
  AnthropicClient,
  DEFAULT_CONTEXT_CONFIG,
} from "./anthropic";
export type {
  ClaudeModel,
  AnthropicMessage,
  AnthropicRequest,
  AnthropicResponse,
  ToolDefinition,
  ContextConfig,
} from "./anthropic";

export { startExecution, checkHealth } from "./orchestrator";

export {
  getRateLimiter,
  TokenRateLimiter,
  estimateProtocolTokens,
  calculateRecommendedCooldown,
} from "./rate-limiter";
export type { RateLimitConfig } from "./rate-limiter";

export type { SmartReadOptions } from "./tools";
