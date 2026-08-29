import { deepseek as data } from '../catalog/providers/deepseek'
import { deepseekThinking } from '../server/thinking'
import { openaiCompatiblePreset } from './openai-compatible'

/**
 * DeepSeek 说 OpenAI Chat Completions 协议（`https://api.deepseek.com`），所以走
 * `@tanstack/ai-openai/compatible`；`discoverModels` 随 `openaiCompatiblePreset` 免费得到（`GET /models`）。
 * 已知限制：thinking 开着时，多轮工具调用要把上一轮的 `reasoning_content` 原样回传，
 * compatible adapter 不带这个字段——需要它的会话把档位设为 `off`。
 */
export const deepseek = openaiCompatiblePreset({
  id: data.id,
  label: data.label,
  baseURL: 'https://api.deepseek.com',
  env: 'DEEPSEEK_API_KEY',
  models: data.models,
  thinking: deepseekThinking,
})
