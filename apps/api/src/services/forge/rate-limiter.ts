/**
 * Token Rate Limiter for Forge Agent Orchestrator
 *
 * Implements rate limiting to stay under Anthropic's TPM (tokens per minute) limits.
 * Tier 1 limit: 30,000 TPM
 *
 * Features:
 * - Sliding window token tracking
 * - Automatic cooldown calculation
 * - Queue management for concurrent executions
 * - Execution scheduling to spread load
 */

// =============================================================================
// Types
// =============================================================================

interface TokenRecord {
  timestamp: number;
  tokens: number;
  executionId: string;
}

interface RateLimitConfig {
  tokensPerMinute: number; // TPM limit
  bufferPercent: number; // Safety buffer (e.g., 0.15 = 15% buffer)
  maxQueueSize: number; // Max executions to queue
  minCooldownMs: number; // Minimum cooldown between executions
}

interface ExecutionSlot {
  executionId: string;
  estimatedTokens: number;
  scheduledFor: Date;
  resolve: () => void;
  reject: (error: Error) => void;
}

// =============================================================================
// Rate Limiter
// =============================================================================

const DEFAULT_CONFIG: RateLimitConfig = {
  tokensPerMinute: 30000, // Anthropic Tier 1 limit
  bufferPercent: 0.15, // 15% safety buffer → effective limit 25,500
  maxQueueSize: 10, // Max 10 executions in queue
  minCooldownMs: 2000, // Minimum 2 second gap between executions
};

/**
 * Token Rate Limiter singleton
 */
class TokenRateLimiter {
  private tokenHistory: Array<TokenRecord> = [];
  private executionQueue: Array<ExecutionSlot> = [];
  private config: RateLimitConfig;
  private isProcessingQueue = false;
  private lastExecutionEnd = 0;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the effective TPM limit (with buffer)
   */
  get effectiveLimit(): number {
    return Math.floor(this.config.tokensPerMinute * (1 - this.config.bufferPercent));
  }

  /**
   * Get current token usage in the last minute
   */
  getUsageInLastMinute(): { tokens: number; records: number } {
    const now = Date.now();
    const windowStart = now - 60000;

    // Clean up old records
    this.tokenHistory = this.tokenHistory.filter((r) => r.timestamp > windowStart);

    const tokens = this.tokenHistory.reduce((sum, r) => sum + r.tokens, 0);
    return { tokens, records: this.tokenHistory.length };
  }

  /**
   * Check if we have capacity for an estimated token count
   */
  hasCapacity(estimatedTokens: number): boolean {
    const { tokens } = this.getUsageInLastMinute();
    return tokens + estimatedTokens <= this.effectiveLimit;
  }

  /**
   * Calculate cooldown needed before executing with estimated tokens
   */
  calculateCooldown(estimatedTokens: number): number {
    const { tokens } = this.getUsageInLastMinute();
    const availableTokens = this.effectiveLimit - tokens;

    if (availableTokens >= estimatedTokens) {
      // Have capacity, but respect minimum cooldown
      const timeSinceLastExecution = Date.now() - this.lastExecutionEnd;
      return Math.max(0, this.config.minCooldownMs - timeSinceLastExecution);
    }

    // Need to wait for tokens to expire from the window
    // Find oldest record and calculate when it will expire
    if (this.tokenHistory.length === 0) {
      return 0;
    }

    // Sort by timestamp to find oldest
    const sorted = [...this.tokenHistory].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate how many tokens need to expire
    let tokensToExpire = estimatedTokens - availableTokens;
    let waitUntil = Date.now();

    for (const record of sorted) {
      tokensToExpire -= record.tokens;
      waitUntil = record.timestamp + 60000; // When this record expires

      if (tokensToExpire <= 0) {
        break;
      }
    }

    const cooldown = Math.max(0, waitUntil - Date.now());
    return Math.max(cooldown, this.config.minCooldownMs);
  }

  /**
   * Record token usage from an execution
   */
  recordUsage(executionId: string, tokens: number): void {
    this.tokenHistory.push({
      timestamp: Date.now(),
      tokens,
      executionId,
    });
    this.lastExecutionEnd = Date.now();

    console.log(
      `[rate-limiter] Recorded ${tokens} tokens for ${executionId}. ` +
        `Usage: ${this.getUsageInLastMinute().tokens}/${this.effectiveLimit} TPM`
    );
  }

  /**
   * Wait for capacity and record usage atomically
   * Returns when it's safe to execute
   */
  async waitForCapacity(
    executionId: string,
    estimatedTokens: number
  ): Promise<void> {
    // Check queue size
    if (this.executionQueue.length >= this.config.maxQueueSize) {
      throw new Error(
        `Rate limit queue full (${this.config.maxQueueSize} executions waiting). ` +
          `Try again later.`
      );
    }

    // Create slot in queue
    return new Promise<void>((resolve, reject) => {
      const cooldown = this.calculateCooldown(estimatedTokens);
      const scheduledFor = new Date(Date.now() + cooldown);

      const slot: ExecutionSlot = {
        executionId,
        estimatedTokens,
        scheduledFor,
        resolve,
        reject,
      };

      this.executionQueue.push(slot);

      console.log(
        `[rate-limiter] ${executionId} queued. ` +
          `Estimated: ${estimatedTokens} tokens. ` +
          `Scheduled for: ${scheduledFor.toISOString()} ` +
          `(cooldown: ${cooldown}ms)`
      );

      // Process queue
      this.processQueue();
    });
  }

  /**
   * Process the execution queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.executionQueue.length > 0) {
        const slot = this.executionQueue[0];
        const now = Date.now();
        const waitTime = slot.scheduledFor.getTime() - now;

        if (waitTime > 0) {
          await new Promise((r) => setTimeout(r, waitTime));
        }

        // Double-check capacity before releasing
        const cooldown = this.calculateCooldown(slot.estimatedTokens);
        if (cooldown > 0) {
          // Reschedule
          slot.scheduledFor = new Date(Date.now() + cooldown);
          continue;
        }

        // Release the execution
        this.executionQueue.shift();
        slot.resolve();

        // Small gap between releases
        await new Promise((r) => setTimeout(r, 100));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    usedTokens: number;
    effectiveLimit: number;
    percentUsed: number;
    queueLength: number;
    cooldownMs: number;
  } {
    const { tokens } = this.getUsageInLastMinute();
    return {
      usedTokens: tokens,
      effectiveLimit: this.effectiveLimit,
      percentUsed: Math.round((tokens / this.effectiveLimit) * 100),
      queueLength: this.executionQueue.length,
      cooldownMs: this.calculateCooldown(5000), // Estimate for typical request
    };
  }

  /**
   * Clear rate limiter state (for testing)
   */
  reset(): void {
    this.tokenHistory = [];
    this.executionQueue = [];
    this.lastExecutionEnd = 0;
  }
}

// =============================================================================
// Token Estimation Helpers
// =============================================================================

/**
 * Estimate tokens for a protocol based on typical usage
 */
export function estimateProtocolTokens(protocol: string): number {
  const estimates: Record<string, number> = {
    opus_full_feature: 45000, // 30-60k range, use midpoint
    opus_architecture: 30000, // 20-40k range
    opus_planning: 22500, // 15-30k range
    sonnet_implementation: 17500, // 10-25k range
    sonnet_bug_fix: 14000, // 8-20k range
    sonnet_tests: 17500, // 10-25k range
    haiku_quick_edit: 3500, // 2-5k range
    haiku_docs: 5500, // 3-8k range
  };

  return estimates[protocol] || 17500; // Default to sonnet_implementation estimate
}

/**
 * Calculate recommended cooldown between executions
 */
export function calculateRecommendedCooldown(
  protocol: string,
  tpmLimit = 30000
): number {
  const estimatedTokens = estimateProtocolTokens(protocol);
  // Time needed to regenerate these tokens at the TPM rate
  // tokens / (tokens_per_minute / 60000ms) = ms needed
  return Math.ceil((estimatedTokens / tpmLimit) * 60000);
}

// =============================================================================
// Singleton Export
// =============================================================================

let rateLimiterInstance: TokenRateLimiter | null = null;

export function getRateLimiter(config?: Partial<RateLimitConfig>): TokenRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new TokenRateLimiter(config);
  }
  return rateLimiterInstance;
}

export { TokenRateLimiter, type RateLimitConfig };
