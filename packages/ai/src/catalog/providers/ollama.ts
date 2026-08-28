import type { Provider } from '../types'
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-ollama 0.10.2 (model-meta.ts → meta/model-meta-*.ts) — 升级 adapter 时 diff 这张表
// `ollamaByok` 无 env；`x-byok-ollama` 头的值 = host URL。id 带 tag（`OLLAMA_TEXT_MODELS` 里只有 `name:tag` 形式）；
// contextWindow = meta `context`；reasoning = capabilities 含 'thinking'；本地模型无定价。
export const ollama: Provider = {
  id: 'ollama',
  label: 'Ollama',
  byok: defineByokProvider({ id: 'ollama', label: 'Ollama' }),
  keyRequired: false,
  runtime: 'local',
  models: [
    { id: 'llama3.3:latest', name: 'Llama 3.3', provider: 'ollama', input: ['text'], reasoning: false, contextWindow: 128_000 },
    { id: 'qwen3:latest', name: 'Qwen3', provider: 'ollama', input: ['text'], reasoning: true, contextWindow: 40_000 },
    { id: 'gpt-oss:20b', name: 'GPT-OSS 20B', provider: 'ollama', input: ['text'], reasoning: true, contextWindow: 128_000 },
    { id: 'deepseek-r1:latest', name: 'DeepSeek R1', provider: 'ollama', input: ['text'], reasoning: true, contextWindow: 128_000 },
    { id: 'gemma3:latest', name: 'Gemma 3', provider: 'ollama', input: ['text', 'image'], reasoning: false, contextWindow: 128_000 },
    { id: 'mistral:latest', name: 'Mistral 7B', provider: 'ollama', input: ['text'], reasoning: false, contextWindow: 32_000 },
    { id: 'phi4:latest', name: 'Phi-4', provider: 'ollama', input: ['text'], reasoning: false, contextWindow: 16_000 },
    { id: 'llava:latest', name: 'LLaVA', provider: 'ollama', input: ['text', 'image'], reasoning: false, contextWindow: 32_000 },
  ],
}
