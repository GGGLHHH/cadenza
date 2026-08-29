// @vitest-environment node
import type { ModelMessage } from '@tanstack/ai'
import { describe, expect, it } from 'vitest'
import { deepseek } from '../src/providers/deepseek'

// The hooks are protected on the class; the test reaches them structurally.
interface Hooks {
  extractReasoning: (chunk: unknown) => { text: string } | undefined
  convertMessage: (message: ModelMessage) => Record<string, unknown>
}

const adapter = deepseek.create('deepseek-v4-flash', 'sk-x') as unknown as Hooks

describe('deepSeekChatAdapter', () => {
  it('turns delta.reasoning_content into reasoning, and nothing else into nothing', () => {
    expect(adapter.extractReasoning({ choices: [{ delta: { reasoning_content: 'let me see' } }] })).toEqual({ text: 'let me see' })
    expect(adapter.extractReasoning({ choices: [{ delta: { content: 'answer' } }] })).toBeUndefined()
    expect(adapter.extractReasoning({ choices: [{ delta: { reasoning_content: '' } }] })).toBeUndefined()
    expect(adapter.extractReasoning({})).toBeUndefined()
  })

  it('echoes the assistant turn\'s thinking as reasoning_content, empty when there was none', () => {
    const thought = adapter.convertMessage({ role: 'assistant', content: 'Paris', thinking: [{ content: 'capital?' }, { content: 'yes' }] })
    expect(thought).toMatchObject({ role: 'assistant', reasoning_content: 'capital?\nyes' })
    const plain = adapter.convertMessage({ role: 'assistant', content: 'Paris' })
    expect(plain).toMatchObject({ role: 'assistant', reasoning_content: '' })
    expect(adapter.convertMessage({ role: 'user', content: 'hi' })).not.toHaveProperty('reasoning_content')
  })

  it('the preset builds the DeepSeek adapter and keeps the compatible discovery', () => {
    const built = deepseek.create('deepseek-v4-flash', 'sk-x')
    expect(built.name).toBe('deepseek')
    expect(built.model).toBe('deepseek-v4-flash')
    expect(typeof deepseek.discoverModels).toBe('function')
  })
})
