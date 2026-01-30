/**
 * Anthropic API Client for Forge Agent Orchestrator
 *
 * Handles communication with the Claude API including tool use
 * and streaming responses.
 */

// =============================================================================
// Types
// =============================================================================

export type ClaudeModel =
  | "claude-opus-4-5-20251101"
  | "claude-sonnet-4-5-20250929"
  | "claude-haiku-4-5-20251001";

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
// Client
// =============================================================================

/**
 * Anthropic API client class
 */
export class AnthropicClient {
  private apiKey: string;
  private baseUrl = "https://api.anthropic.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || "";
    if (!this.apiKey) {
      console.warn("ANTHROPIC_API_KEY not set - agent executions will fail");
    }
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
        "anthropic-version": "2024-01-01",
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
    } = {}
  ): Promise<{
    messages: Array<AnthropicMessage>;
    totalInputTokens: number;
    totalOutputTokens: number;
    iterations: number;
    finalResponse: string;
  }> {
    const { maxIterations = 50, onToolUse, onResponse, onIteration } = options;

    const messages = [...request.messages];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let iterations = 0;
    let finalResponse = "";

    while (iterations < maxIterations) {
      iterations++;

      // Send message to Claude
      const response = await this.sendMessage({
        ...request,
        messages,
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      onResponse?.(response);

      // Add assistant response to messages
      messages.push({
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

      // Add tool results as user message
      if (toolResults.length > 0) {
        messages.push({
          role: "user",
          content: toolResults,
        });
      }

      // Callback for checkpointing
      if (onIteration) {
        await onIteration(iterations, messages);
      }
    }

    return {
      messages,
      totalInputTokens,
      totalOutputTokens,
      iterations,
      finalResponse,
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
