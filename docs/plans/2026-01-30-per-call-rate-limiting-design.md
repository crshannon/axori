# Per-Call Rate Limiting Design

## Problem Statement

Forge agent executions are hitting Anthropic's 50,000 TPM (tokens per minute) rate limit mid-execution. The current rate limiter only checks capacity once at execution start, not before each API call iteration.

**Example failure:**
```
Anthropic API error: This request would exceed your organization's rate limit
of 50,000 input tokens per minute (model: claude-haiku-4-5-20251001)
```

**Root cause:** `waitForCapacity` is called once per execution, but `executeWithTools` makes multiple API calls in a loop without checking remaining capacity.

## Solution Overview

Move rate limiting from execution-level to iteration-level:

1. **Before each API call** - Estimate tokens for this specific call
2. **Track and attribute spikes** - Log which components cause large calls
3. **Persist spikes to database** - Enable analysis and resolution tracking
4. **Enforce limits** - Wait for capacity or compress aggressively
5. **Record usage immediately** - Track per-iteration, not per-execution

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    executeWithTools Loop                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  For each iteration │
                    └─────────┬─────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  1. Manage context window   │
                │     (existing compression)  │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  2. Estimate call tokens    │
                │     (system+tools+messages) │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  3. Spike detection         │
                │     If > 20k: log & persist │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  4. Pre-flight enforcement  │
                │     - Check rate limiter    │
                │     - Wait if needed        │
                │     - Compress if too large │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  5. Send API call           │
                └─────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │  6. Record usage immediately│
                │     (per-iteration tracking)│
                └─────────────────────────────┘
```

---

## Component 1: Database Schema

**New table: `forge_token_spikes`**

```typescript
// packages/db/src/schema/index.ts

export const forgeTokenSpikes = pgTable("forge_token_spikes", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Execution context
  executionId: uuid("execution_id").references(() => forgeAgentExecutions.id),
  ticketId: uuid("ticket_id").references(() => forgeTickets.id),
  ticketIdentifier: text("ticket_identifier"),

  // When & where
  iteration: integer("iteration").notNull(),
  protocol: text("protocol").notNull(),
  model: text("model").notNull(),

  // Token breakdown
  totalTokens: integer("total_tokens").notNull(),
  thresholdTokens: integer("threshold_tokens").notNull(),
  systemPromptTokens: integer("system_prompt_tokens"),
  toolDefinitionsTokens: integer("tool_definitions_tokens"),
  messageHistoryTokens: integer("message_history_tokens"),

  // Attribution (JSON)
  largestComponents: jsonb("largest_components").$type<Array<{
    type: string;
    source: string;
    tokens: number;
  }>>(),

  // Outcome
  wasBlocked: boolean("was_blocked").default(false),
  actualApiTokens: integer("actual_api_tokens"),

  // Resolution tracking
  status: text("status").default("open"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Component 2: Token Spike Tracking

**New types in `anthropic.ts`:**

```typescript
export interface TokenBreakdown {
  total: number;
  systemPrompt: number;
  toolDefinitions: number;
  messageHistory: number;
  perMessage: Array<{
    role: string;
    type: string;
    source: string;
    tokens: number;
  }>;
}

export interface TokenSpike {
  executionId: string;
  ticketId: string;
  ticketIdentifier: string;
  iteration: number;
  protocol: string;
  model: string;

  totalTokens: number;
  thresholdTokens: number;
  systemPromptTokens: number;
  toolDefinitionsTokens: number;
  messageHistoryTokens: number;

  largestComponents: Array<{
    type: string;
    source: string;
    tokens: number;
  }>;

  wasBlocked: boolean;
}
```

**Estimation function:**

```typescript
function estimateRequestBreakdown(
  request: AnthropicRequest,
  messages: Array<AnthropicMessage>
): TokenBreakdown {
  const systemPrompt = request.system
    ? Math.ceil(request.system.length / 4)
    : 0;

  const toolDefinitions = request.tools
    ? Math.ceil(JSON.stringify(request.tools).length / 4)
    : 0;

  const perMessage: TokenBreakdown["perMessage"] = [];

  for (const msg of messages) {
    if (typeof msg.content === "string") {
      perMessage.push({
        role: msg.role,
        type: "text",
        source: msg.content.slice(0, 50),
        tokens: Math.ceil(msg.content.length / 4),
      });
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === "tool_result" && block.content) {
          // Extract tool name from context if possible
          const source = `tool_result: ${block.content.slice(0, 30)}...`;
          perMessage.push({
            role: msg.role,
            type: "tool_result",
            source,
            tokens: Math.ceil(block.content.length / 4),
          });
        } else if (block.type === "text" && block.text) {
          perMessage.push({
            role: msg.role,
            type: "text",
            source: block.text.slice(0, 50),
            tokens: Math.ceil(block.text.length / 4),
          });
        } else if (block.type === "tool_use" && block.input) {
          perMessage.push({
            role: msg.role,
            type: "tool_use",
            source: `${block.name}(...)`,
            tokens: Math.ceil(JSON.stringify(block.input).length / 4),
          });
        }
      }
    }
  }

  const messageHistory = perMessage.reduce((sum, m) => sum + m.tokens, 0);

  return {
    total: systemPrompt + toolDefinitions + messageHistory,
    systemPrompt,
    toolDefinitions,
    messageHistory,
    perMessage,
  };
}
```

---

## Component 3: Enforcement Configuration

```typescript
export interface EnforcementConfig {
  spikeThreshold: number;         // Log spike if call exceeds (default: 20000)
  maxWaitMs: number;              // Max wait for capacity (default: 30000)
  aggressiveCompressionAt: number; // Compress harder above (default: 35000)
  hardLimit: number;              // Never exceed per call (default: 45000)
}

export const DEFAULT_ENFORCEMENT: EnforcementConfig = {
  spikeThreshold: 20000,
  maxWaitMs: 30000,
  aggressiveCompressionAt: 35000,
  hardLimit: 45000,
};
```

---

## Component 4: Pre-Flight Enforcement

```typescript
async function enforceTokenLimit(
  request: AnthropicRequest,
  managedMessages: Array<AnthropicMessage>,
  context: {
    executionId: string;
    ticketId: string;
    ticketIdentifier: string;
    protocol: string;
    model: string;
    iteration: number;
  },
  rateLimiter: TokenRateLimiter,
  config: EnforcementConfig
): Promise<{
  messages: Array<AnthropicMessage>;
  waitedMs: number;
  wasCompressed: boolean;
  spike: TokenSpike | null;
}> {
  // 1. Estimate tokens
  let breakdown = estimateRequestBreakdown(request, managedMessages);

  // 2. Detect and persist spike
  let spike: TokenSpike | null = null;
  if (breakdown.total > config.spikeThreshold) {
    spike = buildTokenSpike(breakdown, context);
    await persistSpike(spike);
    console.warn(`⚠️ TOKEN SPIKE: ${formatSpikeWarning(spike)}`);
  }

  // 3. Aggressive compression if needed
  let finalMessages = managedMessages;
  let wasCompressed = false;

  if (breakdown.total > config.aggressiveCompressionAt) {
    finalMessages = aggressiveCompress(managedMessages, config.hardLimit);
    wasCompressed = true;
    breakdown = estimateRequestBreakdown(request, finalMessages);
    console.log(`[enforcement] Compressed ${managedMessages.length} → ${finalMessages.length} messages`);
  }

  // 4. Hard limit check
  if (breakdown.total > config.hardLimit) {
    if (spike) {
      await updateSpikeBlocked(spike.id);
    }
    throw new Error(
      `Token limit exceeded: ${breakdown.total} > ${config.hardLimit}. ` +
      `Largest: ${breakdown.perMessage.sort((a, b) => b.tokens - a.tokens)[0]?.source}`
    );
  }

  // 5. Wait for rate limiter
  const waitedMs = await rateLimiter.waitForCapacityWithTimeout(
    context.executionId,
    breakdown.total,
    config.maxWaitMs
  );

  return { messages: finalMessages, waitedMs, wasCompressed, spike };
}
```

---

## Component 5: Aggressive Compression

```typescript
function aggressiveCompress(
  messages: Array<AnthropicMessage>,
  targetTokens: number
): Array<AnthropicMessage> {
  let compressed = [...messages];
  let currentTokens = estimateMessagesTokens(compressed);

  // Strategy 1: Compress tool results to 500 tokens max (vs 2000 default)
  if (currentTokens > targetTokens) {
    compressed = compressed.map((msg) => {
      if (Array.isArray(msg.content)) {
        return {
          ...msg,
          content: msg.content.map((block) => {
            if (block.type === "tool_result" && block.content) {
              return {
                ...block,
                content: compressToolResult(block.content, 500),
              };
            }
            return block;
          }),
        };
      }
      return msg;
    });
    currentTokens = estimateMessagesTokens(compressed);
  }

  // Strategy 2: Keep only last 3 messages (vs 6 default)
  if (currentTokens > targetTokens && compressed.length > 4) {
    const first = compressed[0];
    const recent = compressed.slice(-3);
    compressed = [
      first,
      {
        role: "user" as const,
        content: `[${compressed.length - 4} middle messages summarized for token limit]`,
      },
      ...recent,
    ];
    currentTokens = estimateMessagesTokens(compressed);
  }

  // Strategy 3: Truncate remaining text blocks
  if (currentTokens > targetTokens) {
    compressed = compressed.map((msg) => {
      if (typeof msg.content === "string" && msg.content.length > 2000) {
        return {
          ...msg,
          content: msg.content.slice(0, 2000) + "\n[truncated for token limit]",
        };
      }
      return msg;
    });
  }

  return compressed;
}
```

---

## Component 6: Rate Limiter Enhancements

**Add to `rate-limiter.ts`:**

```typescript
// Model-specific TPM limits (Anthropic Tier 1)
const MODEL_TPM_LIMITS: Record<string, number> = {
  "claude-opus-4-5-20251101": 20000,
  "claude-sonnet-4-5-20250929": 40000,
  "claude-haiku-4-5-20251001": 50000,
};

class TokenRateLimiter {
  // ... existing code ...

  /**
   * Get effective limit for a specific model
   */
  getEffectiveLimitForModel(model: string): number {
    const baseTpm = MODEL_TPM_LIMITS[model] || 30000;
    return Math.floor(baseTpm * (1 - this.config.bufferPercent));
  }

  /**
   * Wait for capacity with timeout
   * Returns milliseconds waited
   */
  async waitForCapacityWithTimeout(
    executionId: string,
    estimatedTokens: number,
    maxWaitMs: number
  ): Promise<number> {
    const startTime = Date.now();

    while (!this.hasCapacity(estimatedTokens)) {
      const waited = Date.now() - startTime;
      if (waited >= maxWaitMs) {
        throw new Error(
          `Rate limit timeout: waited ${waited}ms for ${estimatedTokens} tokens. ` +
          `Usage: ${this.getUsageInLastMinute().tokens}/${this.effectiveLimit}`
        );
      }

      const cooldown = Math.min(
        this.calculateCooldown(estimatedTokens),
        maxWaitMs - waited,
        5000
      );

      console.log(
        `[rate-limiter] Waiting ${cooldown}ms for capacity ` +
        `(need ${estimatedTokens}, have ${this.effectiveLimit - this.getUsageInLastMinute().tokens})`
      );

      await new Promise((resolve) => setTimeout(resolve, cooldown));
    }

    return Date.now() - startTime;
  }

  /**
   * Record usage immediately after each API call
   */
  recordIterationUsage(
    executionId: string,
    iteration: number,
    inputTokens: number,
    outputTokens: number
  ): void {
    const total = inputTokens + outputTokens;
    this.tokenHistory.push({
      timestamp: Date.now(),
      tokens: total,
      executionId,
    });

    console.log(
      `[rate-limiter] Iteration ${iteration}: +${total} tokens ` +
      `(${inputTokens} in, ${outputTokens} out). ` +
      `Usage: ${this.getUsageInLastMinute().tokens}/${this.effectiveLimit} TPM`
    );
  }
}
```

---

## Component 7: Integration in executeWithTools

**Update `anthropic.ts`:**

```typescript
async executeWithTools(
  request: AnthropicRequest,
  toolExecutor: ToolExecutor,
  options: ExecuteWithToolsOptions = {}
): Promise<ExecutionResult> {
  const {
    maxIterations = 50,
    enforcement,
    executionContext,
    rateLimiter,
    // ... other options
  } = options;

  const effectiveEnforcement = { ...DEFAULT_ENFORCEMENT, ...enforcement };

  // ... existing setup ...

  let totalWaitedMs = 0;
  let totalSpikes = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Step 1: Context window management (existing)
    let managedMessages = manageContextWindow(fullMessages, effectiveConfig);

    // Step 2: NEW - Pre-flight enforcement
    if (rateLimiter && executionContext) {
      const enforceResult = await enforceTokenLimit(
        request,
        managedMessages,
        {
          ...executionContext,
          model: request.model,
          iteration: iterations,
        },
        rateLimiter,
        effectiveEnforcement
      );

      managedMessages = enforceResult.messages;
      totalWaitedMs += enforceResult.waitedMs;
      if (enforceResult.spike) totalSpikes++;
    }

    // Step 3: Send API call
    const response = await this.sendMessage({
      ...request,
      messages: managedMessages,
    });

    // Step 4: NEW - Record usage immediately
    if (rateLimiter && executionContext) {
      rateLimiter.recordIterationUsage(
        executionContext.executionId,
        iterations,
        response.usage.input_tokens,
        response.usage.output_tokens
      );
    }

    // ... rest of existing loop ...
  }

  return {
    // ... existing fields ...
    enforcement: {
      totalWaitedMs,
      totalSpikes,
    },
  };
}
```

---

## Component 8: Orchestrator Changes

**Update `orchestrator.ts`:**

```typescript
const result = await client.executeWithTools(
  {
    model: config.model,
    max_tokens: config.maxTokens,
    system: config.systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tools: config.tools,
  },
  (name, input) => executeToolCall(name, input, context),
  {
    maxIterations: 30,
    onToolUse: async (name, input) => {
      await appendToExecutionLog(executionId, `🔧 ${name}`);
    },
    onIteration: async (iteration, messages) => {
      if (iteration % 5 === 0) {
        await saveCheckpoint(executionId, iteration, messages);
      }
    },
    // NEW: Pass enforcement context
    executionContext: {
      executionId,
      ticketId: context.ticketId,
      ticketIdentifier: context.ticketIdentifier,
      protocol: context.protocol,
    },
    rateLimiter: getRateLimiter(),
    enforcement: {
      spikeThreshold: 20000,
      maxWaitMs: 30000,
      aggressiveCompressionAt: 35000,
      hardLimit: 45000,
    },
  }
);
```

---

## Component 9: API Endpoints for Spike Review

**New file: `apps/api/src/routes/forge/token-spikes.ts`**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/forge/token-spikes` | List spikes (filter by status, ticket, date) |
| GET | `/forge/token-spikes/:id` | Get spike details |
| PATCH | `/forge/token-spikes/:id` | Update status/resolution |
| GET | `/forge/token-spikes/summary` | Aggregate stats |

**Summary response example:**

```json
{
  "totalSpikes": 47,
  "openSpikes": 12,
  "topOffenders": [
    { "source": "read_file: orchestrator.ts", "count": 23, "avgTokens": 14200 },
    { "source": "read_file: tools.ts", "count": 11, "avgTokens": 8900 }
  ],
  "byProtocol": {
    "haiku_quick_edit": { "spikes": 31, "avgTokens": 22400 },
    "sonnet_implementation": { "spikes": 16, "avgTokens": 34100 }
  }
}
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `packages/db/src/schema/index.ts` | Modify | Add `forgeTokenSpikes` table |
| `packages/db/drizzle/` | Generate | New migration for table |
| `apps/api/src/services/forge/anthropic.ts` | Modify | Add enforcement logic |
| `apps/api/src/services/forge/rate-limiter.ts` | Modify | Add per-iteration tracking |
| `apps/api/src/services/forge/orchestrator.ts` | Modify | Pass enforcement context |
| `apps/api/src/services/forge/token-spikes.ts` | Create | Spike persistence helpers |
| `apps/api/src/routes/forge/token-spikes.ts` | Create | API endpoints |

---

## Success Criteria

1. No more "50,000 input tokens per minute" errors during execution
2. Token spikes are logged with full attribution before they cause failures
3. Spikes are persisted and reviewable via API
4. Aggressive compression kicks in before hard limits are hit
5. Rate limiter waits appropriately between high-token calls
