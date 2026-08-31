import type { VercelGatewayChatModel } from '@tanstack/ai-vercel-gateway'
import { createVercelGatewayText } from '@tanstack/ai-vercel-gateway'
import { vercelGateway as data } from '../catalog/providers/vercel-gateway'
import { definePreset } from '../server/preset'
import { vercelGatewayThinking } from '../server/thinking'

// `api: 'chat'`: the factory defaults to the Responses adapter, whose provider
// options carry no `reasoning` key; the thinking map (spec 附录 A) is the Chat
// Completions shape, so the preset pins that path.
export const vercelGateway = definePreset({
  ...data,
  create: (model, key) => createVercelGatewayText(model as VercelGatewayChatModel, key ?? '', { api: 'chat' }),
  thinking: vercelGatewayThinking,
})
