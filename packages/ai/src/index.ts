export * from './catalog'
export * from './runtime'
export * from './view'
// Types the facade's own props mention; ai-react does not re-export them.
export type { ChatClientState, ChatInterrupt, MultimodalContent, QueuedMessage, ToolApprovalInterrupt } from '@tanstack/ai-client'
export {
  defaultByokStorage,
  defineByok,
  isPasskeyStorageSupported,
  memoryStorage,
  passkeyStorage,
} from '@tanstack/ai-client/byok'
export type { ByokClient, ByokPrompt, ByokSnapshot, KeyringStorage, KeyStatus } from '@tanstack/ai-client/byok'
// The facade: TanStack AI's React surface as-is, plus the house conventions
// (catalog, runtime, views) that turn it into a complete conversation.
export * from '@tanstack/ai-react'
export {
  EventType,
  fromSpecTokenUsage,
  generateMessageId,
  parsePartialJSON,
  toolDefinition,
} from '@tanstack/ai/client'
export type { AnyClientTool, InferToolInput, InferToolOutput, ThinkingPart } from '@tanstack/ai/client'
