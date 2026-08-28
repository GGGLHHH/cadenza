// Server entry: no 'use client' banner. Route handlers import from here.
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
