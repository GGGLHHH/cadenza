import type { Model, ThinkingLevel } from '../src/catalog/types'
import { describe, expect, it } from 'vitest'
import { THINKING_LEVELS } from '../src/catalog/thinking'
import {
  anthropicThinking,
  deepseekThinking,
  geminiThinking,
  grokThinking,
  groqThinking,
  llmgatewayThinking,
  noThinking,
  ollamaThinking,
  openaiCompatibleThinking,
  openaiThinking,
  openrouterThinking,
  vercelGatewayThinking,
} from '../src/server/thinking'

const m = (id: string, provider: string, extra: Partial<Model> = {}): Model => ({ id, name: id, provider, input: ['text'], reasoning: true, ...extra })
function table(fn: (level: ThinkingLevel, model: Model) => unknown, model: Model): Record<string, unknown> {
  return Object.fromEntries(THINKING_LEVELS.map(l => [l, fn(l, model)]))
}

describe('thinking → modelOptions', () => {
  it('deepseek: thinking switch plus reasoning_effort folded to low / high / max', () => {
    const flash = m('deepseek-v4-flash', 'deepseek', { thinkingLevels: ['off', 'low', 'high', 'max'] })
    expect(deepseekThinking('off', flash)).toEqual({ thinking: { type: 'disabled' } })
    expect(deepseekThinking('medium', flash)).toEqual({ thinking: { type: 'enabled' }, reasoning_effort: 'low' })
    expect(deepseekThinking('xhigh', flash)).toEqual({ thinking: { type: 'enabled' }, reasoning_effort: 'high' })
    expect(deepseekThinking('max', flash)).toEqual({ thinking: { type: 'enabled' }, reasoning_effort: 'max' })
    expect(deepseekThinking('high', m('x', 'deepseek', { reasoning: false }))).toEqual({})
  })

  it('openai', () => {
    expect(table(openaiThinking, m('gpt-5.2', 'openai'))).toMatchInlineSnapshot(`
      {
        "high": {
          "reasoning": {
            "effort": "high",
            "summary": "auto",
          },
        },
        "low": {
          "reasoning": {
            "effort": "low",
            "summary": "auto",
          },
        },
        "max": {
          "reasoning": {
            "effort": "high",
            "summary": "auto",
          },
        },
        "medium": {
          "reasoning": {
            "effort": "medium",
            "summary": "auto",
          },
        },
        "minimal": {
          "reasoning": {
            "effort": "minimal",
            "summary": "auto",
          },
        },
        "off": {
          "reasoning": {
            "effort": "none",
          },
        },
        "xhigh": {
          "reasoning": {
            "effort": "high",
            "summary": "auto",
          },
        },
      }
    `)
    expect(openaiThinking('high', m('gpt-4.1', 'openai', { reasoning: false }))).toEqual({})
  })
  it('anthropic budget generation', () => {
    expect(table(anthropicThinking, m('claude-sonnet-4-5', 'anthropic'))).toMatchInlineSnapshot(`
      {
        "high": {
          "thinking": {
            "budget_tokens": 32000,
            "type": "enabled",
          },
        },
        "low": {
          "thinking": {
            "budget_tokens": 4096,
            "type": "enabled",
          },
        },
        "max": {
          "thinking": {
            "budget_tokens": 64000,
            "type": "enabled",
          },
        },
        "medium": {
          "thinking": {
            "budget_tokens": 16000,
            "type": "enabled",
          },
        },
        "minimal": {
          "thinking": {
            "budget_tokens": 1024,
            "type": "enabled",
          },
        },
        "off": {
          "thinking": {
            "type": "disabled",
          },
        },
        "xhigh": {
          "thinking": {
            "budget_tokens": 48000,
            "type": "enabled",
          },
        },
      }
    `)
    expect(anthropicThinking('high', m('claude-opus-5', 'anthropic'))).toEqual({ thinking: { type: 'enabled', budget_tokens: 32000 } })
  })
  it('anthropic 4.6 adaptive without effort', () => {
    expect(table(anthropicThinking, m('claude-opus-4-6', 'anthropic', { thinkingLevels: ['off', 'medium'] }))).toMatchInlineSnapshot(`
      {
        "high": {
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "low": {
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "max": {
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "medium": {
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "minimal": {
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "off": {
          "thinking": {
            "type": "disabled",
          },
        },
        "xhigh": {
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
      }
    `)
  })
  it('anthropic 4.7+ / sonnet 5 adaptive with output_config.effort', () => {
    expect(table(anthropicThinking, m('claude-opus-4-7', 'anthropic'))).toMatchInlineSnapshot(`
      {
        "high": {
          "output_config": {
            "effort": "high",
          },
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "low": {
          "output_config": {
            "effort": "low",
          },
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "max": {
          "output_config": {
            "effort": "max",
          },
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "medium": {
          "output_config": {
            "effort": "medium",
          },
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "minimal": {
          "output_config": {
            "effort": "low",
          },
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
        "off": {
          "thinking": {
            "type": "disabled",
          },
        },
        "xhigh": {
          "output_config": {
            "effort": "xhigh",
          },
          "thinking": {
            "display": "summarized",
            "type": "adaptive",
          },
        },
      }
    `)
    expect(anthropicThinking('off', m('claude-sonnet-5', 'anthropic'))).toEqual({ thinking: { type: 'disabled' } })
  })
  it('anthropic fable 5 cannot be switched off', () => {
    expect(anthropicThinking('off', m('claude-fable-5', 'anthropic', { thinkingLevels: ['low', 'medium', 'high', 'xhigh', 'max'] }))).toEqual({ thinking: { type: 'adaptive', display: 'summarized' }, output_config: { effort: 'low' } })
  })
  it('gemini 3.x uses thinkingLevel, 2.5 uses thinkingBudget', () => {
    expect(table(geminiThinking, m('gemini-3.5-flash', 'gemini'))).toMatchInlineSnapshot(`
      {
        "high": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingLevel": "HIGH",
          },
        },
        "low": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingLevel": "LOW",
          },
        },
        "max": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingLevel": "HIGH",
          },
        },
        "medium": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingLevel": "MEDIUM",
          },
        },
        "minimal": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingLevel": "MINIMAL",
          },
        },
        "off": {},
        "xhigh": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingLevel": "HIGH",
          },
        },
      }
    `)
    expect(table(geminiThinking, m('gemini-2.5-pro', 'gemini'))).toMatchInlineSnapshot(`
      {
        "high": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingBudget": 16384,
          },
        },
        "low": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingBudget": 4096,
          },
        },
        "max": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingBudget": 24576,
          },
        },
        "medium": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingBudget": 8192,
          },
        },
        "minimal": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingBudget": 1024,
          },
        },
        "off": {
          "thinkingConfig": {
            "thinkingBudget": 0,
          },
        },
        "xhigh": {
          "thinkingConfig": {
            "includeThoughts": true,
            "thinkingBudget": 20480,
          },
        },
      }
    `)
  })
  it('openrouter passes the effort through and disables with enabled:false', () => {
    expect(openrouterThinking('xhigh', m('anthropic/claude-sonnet-5', 'openrouter'))).toEqual({ reasoning: { effort: 'xhigh' } })
    expect(openrouterThinking('off', m('anthropic/claude-sonnet-5', 'openrouter'))).toEqual({ reasoning: { enabled: false } })
  })
  // 附录 A：grok `{ reasoning: { effort } }`，三档折叠；off → effort:'none'；grok-build-* 的 `reasoning?: never` → {}
  it('grok folds to three efforts, off is effort:none, grok-build sends nothing', () => {
    expect(table(grokThinking, m('grok-4.5', 'grok'))).toMatchInlineSnapshot(`
      {
        "high": {
          "reasoning": {
            "effort": "high",
          },
        },
        "low": {
          "reasoning": {
            "effort": "low",
          },
        },
        "max": {
          "reasoning": {
            "effort": "high",
          },
        },
        "medium": {
          "reasoning": {
            "effort": "medium",
          },
        },
        "minimal": {
          "reasoning": {
            "effort": "low",
          },
        },
        "off": {
          "reasoning": {
            "effort": "none",
          },
        },
        "xhigh": {
          "reasoning": {
            "effort": "high",
          },
        },
      }
    `)
    expect(grokThinking('high', m('grok-build-0.1', 'grok', { reasoning: false }))).toEqual({})
    expect(grokThinking('off', m('grok-build-0.1', 'grok', { reasoning: false }))).toEqual({})
  })
  // 附录 A：groq `{ reasoning_effort, reasoning_format:'parsed' }`；off → `{ reasoning_effort:'none' }`；
  // 不发 include_reasoning（与 reasoning_format 互斥）；只对 reasoning:true 的模型发
  it('groq sends reasoning_effort + reasoning_format:parsed, never include_reasoning', () => {
    expect(table(groqThinking, m('openai/gpt-oss-120b', 'groq'))).toMatchInlineSnapshot(`
      {
        "high": {
          "reasoning_effort": "high",
          "reasoning_format": "parsed",
        },
        "low": {
          "reasoning_effort": "low",
          "reasoning_format": "parsed",
        },
        "max": {
          "reasoning_effort": "high",
          "reasoning_format": "parsed",
        },
        "medium": {
          "reasoning_effort": "medium",
          "reasoning_format": "parsed",
        },
        "minimal": {
          "reasoning_effort": "low",
          "reasoning_format": "parsed",
        },
        "off": {
          "reasoning_effort": "none",
        },
        "xhigh": {
          "reasoning_effort": "high",
          "reasoning_format": "parsed",
        },
      }
    `)
    expect(groqThinking('high', m('llama-3.3-70b-versatile', 'groq', { reasoning: false }))).toEqual({})
    expect(groqThinking('off', m('llama-3.3-70b-versatile', 'groq', { reasoning: false }))).toEqual({})
  })
  // 附录 A：vercel-gateway `{ reasoning: { effort }, include_reasoning: true }`，三档折叠；off → {}
  it('vercel-gateway folds to three efforts and asks for include_reasoning', () => {
    expect(table(vercelGatewayThinking, m('openai/gpt-5.2', 'vercel-gateway'))).toMatchInlineSnapshot(`
      {
        "high": {
          "include_reasoning": true,
          "reasoning": {
            "effort": "high",
          },
        },
        "low": {
          "include_reasoning": true,
          "reasoning": {
            "effort": "low",
          },
        },
        "max": {
          "include_reasoning": true,
          "reasoning": {
            "effort": "high",
          },
        },
        "medium": {
          "include_reasoning": true,
          "reasoning": {
            "effort": "medium",
          },
        },
        "minimal": {
          "include_reasoning": true,
          "reasoning": {
            "effort": "low",
          },
        },
        "off": {},
        "xhigh": {
          "include_reasoning": true,
          "reasoning": {
            "effort": "high",
          },
        },
      }
    `)
  })
  // 附录 A：llmgateway `{ reasoning_effort: L }`，七级原样（含 xhigh / max）；off → {}
  it('llmgateway passes all levels through as reasoning_effort', () => {
    expect(table(llmgatewayThinking, m('gpt-5.5', 'llmgateway'))).toMatchInlineSnapshot(`
      {
        "high": {
          "reasoning_effort": "high",
        },
        "low": {
          "reasoning_effort": "low",
        },
        "max": {
          "reasoning_effort": "max",
        },
        "medium": {
          "reasoning_effort": "medium",
        },
        "minimal": {
          "reasoning_effort": "minimal",
        },
        "off": {},
        "xhigh": {
          "reasoning_effort": "xhigh",
        },
      }
    `)
  })
  // 附录 A：ollama gpt-oss 系 `{ think: 'low'|'medium'|'high' }`；其它 `{ think: true }`；off → `{ think: false }`
  it('ollama: gpt-oss takes a three-tier think, others a boolean', () => {
    expect(table(ollamaThinking, m('gpt-oss:20b', 'ollama'))).toMatchInlineSnapshot(`
      {
        "high": {
          "think": "high",
        },
        "low": {
          "think": "low",
        },
        "max": {
          "think": "high",
        },
        "medium": {
          "think": "medium",
        },
        "minimal": {
          "think": "low",
        },
        "off": {
          "think": false,
        },
        "xhigh": {
          "think": "high",
        },
      }
    `)
    expect(table(ollamaThinking, m('qwen3:latest', 'ollama'))).toMatchInlineSnapshot(`
      {
        "high": {
          "think": true,
        },
        "low": {
          "think": true,
        },
        "max": {
          "think": true,
        },
        "medium": {
          "think": true,
        },
        "minimal": {
          "think": true,
        },
        "off": {
          "think": false,
        },
        "xhigh": {
          "think": true,
        },
      }
    `)
  })
  // 附录 A：openai-compatible 默认 `{ reasoning_effort }`（三档折叠），只在 Model.reasoning 时发；off → {}
  it('openai-compatible sends reasoning_effort only for reasoning models', () => {
    expect(table(openaiCompatibleThinking, m('deepseek-reasoner', 'deepseek'))).toMatchInlineSnapshot(`
      {
        "high": {
          "reasoning_effort": "high",
        },
        "low": {
          "reasoning_effort": "low",
        },
        "max": {
          "reasoning_effort": "high",
        },
        "medium": {
          "reasoning_effort": "medium",
        },
        "minimal": {
          "reasoning_effort": "low",
        },
        "off": {},
        "xhigh": {
          "reasoning_effort": "high",
        },
      }
    `)
    expect(openaiCompatibleThinking('high', m('deepseek-chat', 'deepseek', { reasoning: false }))).toEqual({})
  })
  // 附录 A：mistral / bedrock（Converse）没有推理参数 → 永远 {}
  it('mistral and bedrock send nothing at any level', () => {
    expect(table(noThinking, m('magistral-medium-latest', 'mistral'))).toEqual({ off: {}, minimal: {}, low: {}, medium: {}, high: {}, xhigh: {}, max: {} })
  })
})
