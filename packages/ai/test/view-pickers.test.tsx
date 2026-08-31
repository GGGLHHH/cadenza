import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { ModelPicker, SearchToggle, ThinkingLevelPicker, ThinkingToggle } from '../src/view/model-picker'

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

describe('thinkingToggle', () => {
  const flash = defaultCatalog.getModel('deepseek/deepseek-v4-flash')!
  const pro = defaultCatalog.getModel('deepseek/deepseek-v4-pro')!
  const plain = defaultCatalog.getModel('openai/gpt-4.1')!

  it('renders nothing for a model without reasoning', () => {
    const { container } = render(<ThinkingToggle model={plain} defaultValue="off" onValueChange={() => {}}>DeepThink</ThinkingToggle>)
    expect(container.querySelector('[data-slot=thinking-toggle]')).toBeNull()
  })

  it('switches on at the default level clamped to the model, and off again', async () => {
    const onValueChange = vi.fn()
    render(<ThinkingToggle model={pro} defaultValue="off" onValueChange={onValueChange}>DeepThink</ThinkingToggle>)
    const toggle = screen.getByRole('button', { name: 'DeepThink' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    expect(toggle.hasAttribute('data-thinking')).toBe(false)
    await userEvent.click(toggle)
    expect(onValueChange).toHaveBeenLastCalledWith('high', expect.anything())
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(toggle.hasAttribute('data-thinking')).toBe(true)
    await userEvent.click(toggle)
    expect(onValueChange).toHaveBeenLastCalledWith('off', expect.anything())
  })

  it('honours onLevel and a controlled value', async () => {
    const onValueChange = vi.fn()
    render(<ThinkingToggle model={flash} value="off" onLevel="max" onValueChange={onValueChange}>DeepThink</ThinkingToggle>)
    await userEvent.click(screen.getByRole('button', { name: 'DeepThink' }))
    expect(onValueChange).toHaveBeenLastCalledWith('max', expect.anything())
  })
})

describe('searchToggle', () => {
  const flash = defaultCatalog.getModel('deepseek/deepseek-v4-flash')!
  const plain = defaultCatalog.getModel('openai/gpt-4.1')!

  it('renders nothing for a model without provider-side search', () => {
    const { container } = render(<SearchToggle model={plain} defaultValue={false} onValueChange={() => {}}>Search</SearchToggle>)
    expect(container.querySelector('[data-slot=search-toggle]')).toBeNull()
  })

  it('switches on and off, mirroring the state on data-search', async () => {
    const onValueChange = vi.fn()
    render(<SearchToggle model={flash} defaultValue={false} onValueChange={onValueChange}>Search</SearchToggle>)
    const toggle = screen.getByRole('button', { name: 'Search' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    expect(toggle.hasAttribute('data-search')).toBe(false)
    await userEvent.click(toggle)
    expect(onValueChange).toHaveBeenLastCalledWith(true, expect.anything())
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(toggle.hasAttribute('data-search')).toBe(true)
    await userEvent.click(toggle)
    expect(onValueChange).toHaveBeenLastCalledWith(false, expect.anything())
  })

  it('stays where a controlled value puts it', async () => {
    const onValueChange = vi.fn()
    render(<SearchToggle model={flash} value={false} onValueChange={onValueChange}>Search</SearchToggle>)
    const toggle = screen.getByRole('button', { name: 'Search' })
    await userEvent.click(toggle)
    expect(onValueChange).toHaveBeenLastCalledWith(true, expect.anything())
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })
})
