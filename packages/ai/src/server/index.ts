// Server entry: no 'use client' banner. Route handlers import from here.
export * from './catalog-handler'
export * from './chat-handler'
export * from './generation-handlers'
export * from './preset'
export * from './selection'
export * from './thinking'
export * from './title-handler'
export {
  chat,
  chatParamsFromRequest,
  maxIterations,
  memoryStream,
  mergeAgentTools,
  toolDefinition,
  toServerSentEventsResponse,
} from '@tanstack/ai'
export { defineByokProvider } from '@tanstack/ai/byok'
export { byokMissing, getByokKey } from '@tanstack/ai/byok/server'
