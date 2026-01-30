/**
 * Anthropic API Client
 *
 * Handles communication with the Claude API including tool use
 * and streaming responses.
 */

import type { ClaudeModel } from "./protocols"

// Types for Anthropic API
export interface AnthropicMessage {
  role: "user" | "assistant"
  content: string | Array<ContentBlock>
}

export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result"
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
  is_error?: boolean
}

export interface ToolDefinition {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, unknown>
    required?: Array<string>
  }
}

export interface AnthropicRequest {
  model: ClaudeModel
  max_tokens: number
  system?: string
  messages: Array<AnthropicMessage>
  tools?: Array<ToolDefinition>
}

export interface AnthropicResponse {
  id: string
  type: "message"
  role: "assistant"
  content: Array<ContentBlock>
  model: string
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use"
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export interface AnthropicError {
  type: "error"
  error: {
    type: string
    message: string
  }
}

/**
 * Anthropic API client class
 */
export class AnthropicClient {
  private apiKey: string
  private baseUrl = "https://api.anthropic.com/v1"

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || ""
    if (!this.apiKey) {
      console.warn("ANTHROPIC_API_KEY not set - agent executions will fail")
    }
  }

  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(request: AnthropicRequest): Promise<AnthropicResponse> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2024-01-01",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = (await response.json()) as AnthropicError
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
    }

    return response.json() as Promise<AnthropicResponse>
  }

  /**
   * Execute a conversation with tool use loop
   *
   * This continues the conversation until Claude indicates it's done
   * (stop_reason !== "tool_use") or max iterations reached.
   */
  async executeWithTools(
    request: AnthropicRequest,
    toolExecutor: (name: string, input: Record<string, unknown>) => Promise<string>,
    options: {
      maxIterations?: number
      onToolUse?: (name: string, input: Record<string, unknown>) => void
      onResponse?: (response: AnthropicResponse) => void
      onCheckpoint?: (iteration: number, messages: Array<AnthropicMessage>) => Promise<void>
    } = {}
  ): Promise<{
    messages: Array<AnthropicMessage>
    totalInputTokens: number
    totalOutputTokens: number
    iterations: number
  }> {
    const { maxIterations = 50, onToolUse, onResponse, onCheckpoint } = options

    const messages = [...request.messages]
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let iterations = 0

    while (iterations < maxIterations) {
      iterations++

      // Send message to Claude
      const response = await this.sendMessage({
        ...request,
        messages,
      })

      totalInputTokens += response.usage.input_tokens
      totalOutputTokens += response.usage.output_tokens

      onResponse?.(response)

      // Add assistant response to messages
      messages.push({
        role: "assistant",
        content: response.content,
      })

      // Check if we're done
      if (response.stop_reason !== "tool_use") {
        break
      }

      // Process tool calls
      const toolResults: Array<ContentBlock> = []

      for (const block of response.content) {
        if (block.type === "tool_use" && block.name && block.id) {
          onToolUse?.(block.name, block.input || {})

          try {
            const result = await toolExecutor(block.name, block.input || {})
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result,
            })
          } catch (error) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: error instanceof Error ? error.message : "Unknown error",
              is_error: true,
            })
          }
        }
      }

      // Add tool results as user message
      if (toolResults.length > 0) {
        messages.push({
          role: "user",
          content: toolResults,
        })
      }

      // Checkpoint for long-running tasks
      if (onCheckpoint && iterations % 5 === 0) {
        await onCheckpoint(iterations, messages)
      }
    }

    return {
      messages,
      totalInputTokens,
      totalOutputTokens,
      iterations,
    }
  }

  /**
   * Extract text content from response
   */
  static extractText(response: AnthropicResponse): string {
    return response.content
      .filter((block): block is ContentBlock & { text: string } => block.type === "text")
      .map((block) => block.text)
      .join("\n")
  }

  /**
   * Check if response contains tool use
   */
  static hasToolUse(response: AnthropicResponse): boolean {
    return response.content.some((block) => block.type === "tool_use")
  }

  /**
   * Get tool calls from response
   */
  static getToolCalls(response: AnthropicResponse): Array<{
    id: string
    name: string
    input: Record<string, unknown>
  }> {
    return response.content
      .filter((block): block is ContentBlock & { id: string; name: string } =>
        block.type === "tool_use" && !!block.id && !!block.name
      )
      .map((block) => ({
        id: block.id,
        name: block.name,
        input: block.input || {},
      }))
  }
}

/**
 * Create a singleton instance
 */
let clientInstance: AnthropicClient | null = null

export function getAnthropicClient(): AnthropicClient {
  if (!clientInstance) {
    clientInstance = new AnthropicClient()
  }
  return clientInstance
}
