import type { BedrockConverseModels } from '@tanstack/ai-bedrock'
import { createBedrockConverse } from '@tanstack/ai-bedrock'
import { bedrock as data } from '../catalog/providers/bedrock'
import { definePreset } from '../server/preset'
import { noThinking } from '../server/thinking'

// Bearer key only (BedrockClientConfig.auth 'auto' picks apikey when one is given);
// SigV4 is per-deployment, not per-request, so it is not a BYOK path.
export const bedrock = definePreset({
  ...data,
  create: (model, key) => createBedrockConverse(model as BedrockConverseModels, key ?? ''),
  thinking: noThinking,
})
