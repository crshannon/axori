/**
 * Anthropic API Client for Forge Agent Orchestrator
 *
 * Handles communication with the Claude API including tool use
 * and streaming responses.
 *
 * Token Optimization Features:
 * - Context window management (sliding window + summarization)
 * - Rate limiting to stay under TPM thresholds
 * - Tool result compression
 */

// =============================================================================
// Types
// =============================================================================

export type ClaudeModel =
  | "claude-opus-4-5-20251101"
  | "claude-sonnet-4-5-20250929"
  | "claude-haiku-4-5-20251001";

// Context management configuration
export interface ContextConfig {
  maxContextTokens: number; // Max tokens to keep in context
  keepRecentMessages: number; // Always keep this many recent messages
  summarizeThreshold: number; // Summarize when context exceeds this
  compressToolResults: boolean; // Whether to compress large tool results
  maxToolResultTokens: number; // Max tokens per tool result
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<ContentBlock>;
}

export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: Array<string>;
  };
}

export interface AnthropicRequest {
  model: ClaudeModel;
  max_tokens: number;
  system?: string;
  messages: Array<AnthropicMessage>;
  tools?: Array<ToolDefinition>;
}

export interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<ContentBlock>;
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AnthropicError {
  type: "error";
  error: {
    type: string;
    message: string;
  };
}

// =============================================================================
// Token Estimation & Context Management
// =============================================================================

// Default context configuration
export const DEFAULT_CONTEXT_CONFIG: ContextConfig = {
  maxContextTokens: 15000, // Keep context under 15k tokens
  keepRecentMessages: 6, // Always keep last 6 messages (3 turns)
  summarizeThreshold: 12000, // Start summarizing at 12k tokens
  compressToolResults: true, // Compress large tool results
  maxToolResultTokens: 2000, // Max 2k tokens per tool result
};

/**
 * Rough token estimation (4 chars ≈ 1 token)
 */
function estimateTokens(content: string | Array<ContentBlock>): number {
  if (typeof content === "string") {
    return Math.ceil(content.length / 4);
  }
  return content.reduce((sum, block) => {
    if (block.type === "text" && block.text) {
      return sum + Math.ceil(block.text.length / 4);
    }
    if (block.type === "tool_result" && block.content) {
      return sum + Math.ceil(block.content.length / 4);
    }
    if (block.type === "tool_use" && block.input) {
      return sum + Math.ceil(JSON.stringify(block.input).length / 4);
    }
    return sum + 50; // Estimate for block overhead
  }, 0);
}

/**
 * Estimate total tokens in message array
 */
function estimateMessagesTokens(messages: Array<AnthropicMessage>): number {
  return messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
}

/**
 * Compress a tool result to fit within token limit
 */
function compressToolResult(content: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (content.length <= maxChars) {
    return content;
  }

  // For file contents, try to extract key information
  const lines = content.split("\n");
  const isCode = content.includes("function ") ||
    content.includes("export ") ||
    content.includes("import ") ||
    content.includes("class ");

  if (isCode) {
    // Extract imports, exports, function/class signatures
    const keyLines = lines.filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.startsWith("import ") ||
        trimmed.startsWith("export ") ||
        trimmed.startsWith("function ") ||
        trimmed.startsWith("async function ") ||
        trimmed.startsWith("class ") ||
        trimmed.startsWith("interface ") ||
        trimmed.startsWith("type ") ||
        trimmed.startsWith("const ") ||
        trimmed.startsWith("let ") ||
        trimmed.match(/^\s*(public|private|protected)?\s*(async\s+)?[a-zA-Z_]+\s*\(/)
      );
    });

    const summary = `[File summary - ${lines.length} lines total]\n\nKey definitions:\n${keyLines.slice(0, 50).join("\n")}`;

    if (summary.length <= maxChars) {
      return summary + `\n\n[... ${lines.length - 50} more lines truncated]`;
    }
  }

  // Fallback: truncate with indication
  const truncated = content.slice(0, maxChars - 100);
  const remainingChars = content.length - truncated.length;
  return truncated + `\n\n[... truncated ${remainingChars} characters]`;
}

/**
 * Summarize middle messages to reduce context size
 */
function summarizeMiddleMessages(
  messages: Array<AnthropicMessage>,
  keepRecent: number
): Array<AnthropicMessage> {
  if (messages.length <= keepRecent + 1) {
    return messages;
  }

  // Keep first message (task) and recent messages
  const firstMessage = messages[0];
  const recentMessages = messages.slice(-keepRecent);
  const middleMessages = messages.slice(1, -keepRecent);

  // Create summary of middle messages
  const toolUses: Array<string> = [];
  const keyFindings: Array<string> = [];

  for (const msg of middleMessages) {
    if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === "tool_use" && block.name) {
          toolUses.push(`- ${block.name}(${JSON.stringify(block.input || {}).slice(0, 100)})`);
        }
        if (block.type === "text" && block.text) {
          // Extract key findings (first sentence or line)
          const firstLine = block.text.split(/[.\n]/)[0];
          if (firstLine && firstLine.length > 10 && firstLine.length < 200) {
            keyFindings.push(`- ${firstLine}`);
          }
        }
      }
    }
  }

  const summaryContent = `[Context Summary - ${middleMessages.length} messages condensed]

Tools used:
${toolUses.slice(0, 10).join("\n")}${toolUses.length > 10 ? `\n... and ${toolUses.length - 10} more tool calls` : ""}

Key findings:
${keyFindings.slice(0, 5).join("\n")}${keyFindings.length > 5 ? `\n... and ${keyFindings.length - 5} more findings` : ""}

[End of summary - continuing with recent context]`;

  return [
    firstMessage,
    { role: "user" as const, content: summaryContent },
    ...recentMessages,
  ];
}

/**
 * Manage context window to stay within token limits
 */
function manageContextWindow(
  messages: Array<AnthropicMessage>,
  config: ContextConfig
): Array<AnthropicMessage> {
  let managedMessages = [...messages];
  let currentTokens = estimateMessagesTokens(managedMessages);

  // First pass: compress tool results if enabled
  if (config.compressToolResults && currentTokens > config.summarizeThreshold) {
    managedMessages = managedMessages.map((msg) => {
      if (Array.isArray(msg.content)) {
        const compressedContent = msg.content.map((block) => {
          if (block.type === "tool_result" && block.content) {
            const compressed = compressToolResult(
              block.content,
              config.maxToolResultTokens
            );
            return { ...block, content: compressed };
          }
          return block;
        });
        return { ...msg, content: compressedContent };
      }
      return msg;
    });
    currentTokens = estimateMessagesTokens(managedMessages);
  }

  // Second pass: summarize middle messages if still too large
  if (currentTokens > config.maxContextTokens) {
    managedMessages = summarizeMiddleMessages(
      managedMessages,
      config.keepRecentMessages
    );
  }

  return managedMessages;
}

// =============================================================================
// Client
// =============================================================================

/**
 * Anthropic API client class
 */
export class AnthropicClient {
  private apiKey: string;
  private baseUrl = "https://api.anthropic.com/v1";
  private contextConfig: ContextConfig;

  constructor(apiKey?: string, contextConfig?: Partial<ContextConfig>) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || "";
    this.contextConfig = { ...DEFAULT_CONTEXT_CONFIG, ...contextConfig };
    if (!this.apiKey) {
      console.warn("ANTHROPIC_API_KEY not set - agent executions will fail");
    }
  }

  /**
   * Update context configuration
   */
  setContextConfig(config: Partial<ContextConfig>): void {
    this.contextConfig = { ...this.contextConfig, ...config };
  }

  /**
   * Check if the client is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(request: AnthropicRequest): Promise<AnthropicResponse> {
    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = (await response.json()) as AnthropicError;
      throw new Error(
        `Anthropic API error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json() as Promise<AnthropicResponse>;
  }

  /**
   * Execute a conversation with tool use loop
   * Now with context window management to reduce token usage
   */
  async executeWithTools(
    request: AnthropicRequest,
    toolExecutor: (
      name: string,
      input: Record<string, unknown>
    ) => Promise<string>,
    options: {
      maxIterations?: number;
      onToolUse?: (name: string, input: Record<string, unknown>) => void;
      onResponse?: (response: AnthropicResponse) => void;
      onIteration?: (
        iteration: number,
        messages: Array<AnthropicMessage>
      ) => Promise<void>;
      contextConfig?: Partial<ContextConfig>;
    } = {}
  ): Promise<{
    messages: Array<AnthropicMessage>;
    totalInputTokens: number;
    totalOutputTokens: number;
    iterations: number;
    finalResponse: string;
    contextManaged: boolean;
  }> {
    const { maxIterations = 50, onToolUse, onResponse, onIteration, contextConfig } = options;
    const effectiveConfig = { ...this.contextConfig, ...contextConfig };

    // Full message history for checkpointing
    const fullMessages = [...request.messages];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let iterations = 0;
    let finalResponse = "";
    let contextManaged = false;

    while (iterations < maxIterations) {
      iterations++;

      // Apply context window management before sending
      const managedMessages = manageContextWindow(fullMessages, effectiveConfig);
      if (managedMessages.length !== fullMessages.length) {
        contextManaged = true;
        console.log(
          `[context] Iteration ${iterations}: Reduced ${fullMessages.length} → ${managedMessages.length} messages ` +
          `(~${estimateMessagesTokens(fullMessages)} → ~${estimateMessagesTokens(managedMessages)} tokens)`
        );
      }

      // Send message to Claude with managed context
      const response = await this.sendMessage({
        ...request,
        messages: managedMessages,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      onResponse?.(response);

      // Add assistant response to full message history
      fullMessages.push({
        role: "assistant",
        content: response.content,
      });

      // Extract text for final response
      const textBlocks = response.content.filter(
        (block): block is ContentBlock & { text: string } =>
          block.type === "text"
      );
      if (textBlocks.length > 0) {
        finalResponse = textBlocks.map((b) => b.text).join("\n");
      }

      // Check if we're done
      if (response.stop_reason !== "tool_use") {
        break;
      }

      // Process tool calls
      const toolResults: Array<ContentBlock> = [];

      for (const block of response.content) {
        if (block.type === "tool_use" && block.name && block.id) {
          onToolUse?.(block.name, block.input || {});

          try {
            const result = await toolExecutor(block.name, block.input || {});
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result,
            });
          } catch (error) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: error instanceof Error ? error.message : "Unknown error",
              is_error: true,
            });
          }
        }
      }

      // Add tool results as user message to full history
      if (toolResults.length > 0) {
        fullMessages.push({
          role: "user",
          content: toolResults,
        });
      }

      // Callback for checkpointing (with full history)
      if (onIteration) {
        await onIteration(iterations, fullMessages);
      }
    }

    return {
      messages: fullMessages,
      totalInputTokens,
      totalOutputTokens,
      iterations,
      finalResponse,
      contextManaged,
    };
  }

  /**
   * Extract text content from response
   */
  static extractText(response: AnthropicResponse): string {
    return response.content
      .filter(
        (block): block is ContentBlock & { text: string } =>
          block.type === "text"
      )
      .map((block) => block.text)
      .join("\n");
  }
}

// =============================================================================
// Singleton
// =============================================================================

let clientInstance: AnthropicClient | null = null;

export function getAnthropicClient(): AnthropicClient {
  if (!clientInstance) {
    clientInstance = new AnthropicClient();
  }
  return clientInstance;
}
