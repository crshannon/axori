/**
 * Agent Module Exports
 *
 * Central export point for all agent-related functionality.
 */

// Protocols
export {
  PROTOCOLS,
  MODEL_COSTS,
  suggestProtocol,
  calculateEstimatedCost,
  type AgentProtocol,
  type ClaudeModel,
  type ProtocolConfig,
} from "./protocols"

// Anthropic Client
export {
  AnthropicClient,
  getAnthropicClient,
  type AnthropicMessage,
  type AnthropicRequest,
  type AnthropicResponse,
  type ContentBlock,
  type ToolDefinition,
} from "./anthropic"

// Tools
export {
  TOOL_DEFINITIONS,
  createToolExecutors,
  getToolDefinitions,
} from "./tools"

// Orchestrator
export {
  AgentOrchestrator,
  getOrchestrator,
  checkForConflicts,
  acquireFileLocks,
  releaseFileLocks,
  type ExecutionContext,
  type ExecutionResult,
  type ExecutionOptions,
} from "./orchestrator"
