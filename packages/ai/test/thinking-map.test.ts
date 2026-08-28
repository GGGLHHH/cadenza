import type { Model, ThinkingLevel } from '../src/catalog/types'
import { describe, expect, it } from 'vitest'
import { THINKING_LEVELS } from '../src/catalog/thinking'
import { anthropicThinking, geminiThinking, openaiThinking, openrouterThinking } from '../src/server/thinking'

const m = (id: string, provider: string, extra: Partial<Model> = {}): Model => ({ id, name: id, provider, input: ['text'], reasoning: true, ...extra })
function table(fn: (level: ThinkingLevel, model: Model) => unknown, model: Model): Record<string, unknown> {
  return Object.fromEntries(THINKING_LEVELS.map(l => [l, fn(l, model)]))
}

describe('thinking → modelOptions', () => {
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
})
