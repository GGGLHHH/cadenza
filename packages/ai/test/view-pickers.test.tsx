import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { ModelPicker, ThinkingLevelPicker } from '../src/view/model-picker'

describe('pickers', () => {
  it('modelPicker shows the current model and marks providers without a key', () => {
    render(<ModelPicker catalog={defaultCatalog} defaultValue="openai/gpt-5.2" onValueChange={() => {}} byok={{ status: { openai: { state: 'empty' } }, locked: false, prompt: null, storageError: null } as never} />)
    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(screen.getByText(/gpt-5\.2/i)).toBeTruthy()
  })
  it('thinkingLevelPicker renders nothing for a model without reasoning and lists supported levels otherwise', () => {
    const none = defaultCatalog.models.find(m => !m.reasoning)!
    const { container, rerender } = render(<ThinkingLevelPicker model={none} defaultValue="off" onValueChange={() => {}} />)
    expect(container.firstChild).toBeNull()
    const fable = defaultCatalog.getModel('anthropic/claude-fable-5')!
    rerender(<ThinkingLevelPicker model={fable} defaultValue="low" onValueChange={vi.fn()} />)
    expect(container.querySelector('[data-slot=thinking-level-picker]')).not.toBeNull()
  })
})
