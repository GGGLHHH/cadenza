import type { Model, ThinkingLevel } from '../catalog/types'
import type { ProviderPreset } from './preset'
import { clampThinkingLevel } from '../catalog/thinking'

type Fragment = Record<string, unknown>
type Effort3 = 'low' | 'medium' | 'high'

/** 三档 effort 的 provider（grok / groq / vercel-gateway / ollama gpt-oss）共用的折叠表。 */
const EFFORT_3: Record<Exclude<ThinkingLevel, 'off'>, Effort3> = { minimal: 'low', low: 'low', medium: 'medium', high: 'high', xhigh: 'high', max: 'high' }

/** clamp 到模型支持的档位后再交给 preset；非推理模型关着时不发任何片段。 */
export function resolveThinking(preset: ProviderPreset, model: Model, level: ThinkingLevel): Fragment {
  const clamped = clampThinkingLevel(model, level)
  if (clamped === 'off' && !model.reasoning)
    return {}
  return preset.thinking(clamped, model)
}

// OpenAI Responses: reasoning.effort ∈ none|minimal|low|medium|high（ai-openai text-provider-options.ts:151-177）
export function openaiThinking(level: ThinkingLevel, model: Model): Fragment {
  if (!model.reasoning)
    return {}
  if (level === 'off')
    return { reasoning: { effort: 'none' } }
  const effort = level === 'minimal' ? 'minimal' : level === 'xhigh' || level === 'max' ? 'high' : level
  return { reasoning: { effort, summary: 'auto' } }
}

const ANTHROPIC_BUDGET: Record<Exclude<ThinkingLevel, 'off'>, number> = { minimal: 1024, low: 4096, medium: 16000, high: 32000, xhigh: 48000, max: 64000 }
/** adaptive + `output_config.effort`（AnthropicAdaptiveOrDisabled / AdaptiveOnly + OutputConfig）。 */
const ANTHROPIC_ADAPTIVE_EFFORT = new Set(['claude-opus-4-7', 'claude-opus-4-8', 'claude-sonnet-5', 'claude-fable-5'])
/** adaptive 但无 effort 分级（AnthropicAdaptiveThinkingOptions，4.6 代）。 */
const ANTHROPIC_ADAPTIVE_ONLY = new Set(['claude-opus-4-6', 'claude-sonnet-4-6'])
/** `thinking:{type:'disabled'}` 会被 400 拒绝的模型（AnthropicAdaptiveOnlyThinkingOptions）；off 落到最低档。 */
const ANTHROPIC_ALWAYS_ON = new Set(['claude-fable-5'])

// 四段分代的真源是 ai-anthropic model-meta.ts 的 AnthropicChatModelProviderOptionsByName；
// 按前缀猜会错（opus-5 / opus-5-fast 是 budget 代）。
export function anthropicThinking(level: ThinkingLevel, model: Model): Fragment {
  if (ANTHROPIC_ADAPTIVE_EFFORT.has(model.id)) {
    const effective = level === 'off' && ANTHROPIC_ALWAYS_ON.has(model.id) ? 'low' : level
    if (effective === 'off')
      return { thinking: { type: 'disabled' } }
    const effort = effective === 'minimal' ? 'low' : effective
    return { thinking: { type: 'adaptive', display: 'summarized' }, output_config: { effort } }
  }
  if (ANTHROPIC_ADAPTIVE_ONLY.has(model.id))
    return level === 'off' ? { thinking: { type: 'disabled' } } : { thinking: { type: 'adaptive', display: 'summarized' } }
  if (level === 'off')
    return { thinking: { type: 'disabled' } }
  return { thinking: { type: 'enabled', budget_tokens: ANTHROPIC_BUDGET[level] } }
}

const GEMINI_LEVEL: Record<Exclude<ThinkingLevel, 'off'>, 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH'> = { minimal: 'MINIMAL', low: 'LOW', medium: 'MEDIUM', high: 'HIGH', xhigh: 'HIGH', max: 'HIGH' }
const GEMINI_BUDGET: Record<Exclude<ThinkingLevel, 'off'>, number> = { minimal: 1024, low: 4096, medium: 8192, high: 16384, xhigh: 20480, max: 24576 }

// Gemini 2.x 用 thinkingBudget，3.x 用 thinkingLevel（ai-gemini text-provider-options.ts:235-251）
export function geminiThinking(level: ThinkingLevel, model: Model): Fragment {
  const legacy = model.id.startsWith('gemini-2.')
  if (level === 'off')
    return legacy ? { thinkingConfig: { thinkingBudget: 0 } } : {}
  return legacy
    ? { thinkingConfig: { includeThoughts: true, thinkingBudget: GEMINI_BUDGET[level] } }
    : { thinkingConfig: { includeThoughts: true, thinkingLevel: GEMINI_LEVEL[level] } }
}

// OpenRouter 的 ReasoningEffort 含 xhigh/max，原样透传；`enabled:false` 由 adapter 规范化为 effort:'none'
export function openrouterThinking(level: ThinkingLevel, _model: Model): Fragment {
  return level === 'off' ? { reasoning: { enabled: false } } : { reasoning: { effort: level } }
}

// xAI: reasoning.effort ∈ none|low|medium|high（ai-grok text-provider-options.ts:11-17）；
// grok-build-* 的 provider options 是 `reasoning?: never`，什么都不发。
export function grokThinking(level: ThinkingLevel, model: Model): Fragment {
  if (model.id.startsWith('grok-build-'))
    return {}
  return { reasoning: { effort: level === 'off' ? 'none' : EFFORT_3[level] } }
}

// Groq: reasoning_effort ∈ none|low|medium|high + reasoning_format:'parsed'（ai-groq text-provider-options.ts:98-104）；
// include_reasoning 与 reasoning_format 互斥，永远不发；非推理模型不收这些键。
export function groqThinking(level: ThinkingLevel, model: Model): Fragment {
  if (!model.reasoning)
    return {}
  if (level === 'off')
    return { reasoning_effort: 'none' }
  return { reasoning_effort: EFFORT_3[level], reasoning_format: 'parsed' }
}

// Vercel AI Gateway（Chat Completions 路径）：reasoning 是开放对象，include_reasoning 让推理回流（text-provider-options.ts:38-39）
export function vercelGatewayThinking(level: ThinkingLevel, _model: Model): Fragment {
  return level === 'off' ? {} : { reasoning: { effort: EFFORT_3[level] }, include_reasoning: true }
}

// LLM Gateway 的 reasoning_effort 与七级同名（含 xhigh/max，ai-llmgateway text-provider-options.ts:57-66），原样透传
export function llmgatewayThinking(level: ThinkingLevel, _model: Model): Fragment {
  return level === 'off' ? {} : { reasoning_effort: level }
}

// Ollama: gpt-oss 系是 OllamaChatRequestThinking_OpenAI（think: 'low'|'medium'|'high'），其它模型 think 是布尔
export function ollamaThinking(level: ThinkingLevel, model: Model): Fragment {
  if (level === 'off')
    return { think: false }
  return { think: model.id.startsWith('gpt-oss') ? EFFORT_3[level] : true }
}

// OpenAI 兼容端点的公约数：Chat Completions 的 reasoning_effort（DeepSeek / Qwen 等都认），只对推理模型发
export function openaiCompatibleThinking(level: ThinkingLevel, model: Model): Fragment {
  if (!model.reasoning || level === 'off')
    return {}
  return { reasoning_effort: EFFORT_3[level] }
}

// mistral（无设置项）/ bedrock（Converse 没有推理参数）：目录里 thinkingLevels 隐含 ['off']，这里兜底也不发
// DeepSeek（OpenAI Chat Completions 方言）：`thinking.type` 开关 + `reasoning_effort`（pi-ai openai-completions.js:646-656）；
// 档位只有 low / high / max（thinkingLevelMap），其余折叠。
const DEEPSEEK_EFFORT: Record<Exclude<ThinkingLevel, 'off'>, 'low' | 'high' | 'max'> = { minimal: 'low', low: 'low', medium: 'low', high: 'high', xhigh: 'high', max: 'max' }
export function deepseekThinking(level: ThinkingLevel, model: Model): Fragment {
  if (!model.reasoning)
    return {}
  if (level === 'off')
    return { thinking: { type: 'disabled' } }
  return { thinking: { type: 'enabled' }, reasoning_effort: DEEPSEEK_EFFORT[level] }
}

export function noThinking(_level: ThinkingLevel, _model: Model): Fragment {
  return {}
}

export { EFFORT_3 }
