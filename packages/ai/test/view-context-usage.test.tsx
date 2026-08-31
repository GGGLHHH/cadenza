import type { Model } from '../src/catalog/types'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContextUsage } from '../src/view/context-usage'

const model: Model = { id: 'm', name: 'M', provider: 'p', input: ['text'], reasoning: false, contextWindow: 128_000, cost: { input: 1, output: 2 } }
const usage = { promptTokens: 32_000, completionTokens: 500, totalTokens: 32_500 }

describe('contextUsage', () => {
  it('draws the bar as prompt / contextWindow and mirrors the ratio', () => {
    const { container } = render(<ContextUsage model={model} usage={usage}>tokens</ContextUsage>)
    const root = container.querySelector('[data-slot=context-usage]')!
    expect(root.getAttribute('data-ratio')).toBe('0.25')
    expect(root.getAttribute('data-slot')).toBe('context-usage')
    expect(root.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')).toBe('25')
    // Base UI's progress root adds a visually hidden "x" span; read the label span, not the root.
    expect(root.querySelector('[data-slot=context-usage-tokens]')?.parentElement?.textContent).toBe('32000 tokens')
    // The whole thing is the tooltip's trigger (a real button).
    expect(root.tagName).toBe('BUTTON')
  })

  it('shows only the numbers when the model has no context window', () => {
    const { container } = render(<ContextUsage model={{ ...model, contextWindow: undefined }} usage={usage} />)
    const root = container.querySelector('[data-slot=context-usage]')!
    expect(root.hasAttribute('data-ratio')).toBe(false)
    expect(root.querySelector('[role=progressbar]')).toBeNull()
    expect(root.textContent).toBe('32000')
  })
})
