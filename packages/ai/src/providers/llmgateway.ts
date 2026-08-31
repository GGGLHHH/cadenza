import { createLLMGatewayText } from '@tanstack/ai-llmgateway'
import { llmgateway as data } from '../catalog/providers/llmgateway'
import { definePreset } from '../server/preset'
import { llmgatewayThinking } from '../server/thinking'

// `LLMGatewayModelId` is `KnownId | (string & {})`, so no cast is needed.
export const llmgateway = definePreset({
  ...data,
  create: (model, key) => createLLMGatewayText(model, key ?? ''),
  thinking: llmgatewayThinking,
})
