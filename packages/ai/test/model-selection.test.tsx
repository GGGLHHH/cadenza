import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { useModelSelection } from '../src/runtime/selection'
import { createMemoryStorage } from './helpers/memory-storage'

describe('useModelSelection', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
  })
  afterEach(() => {
    localStorage.removeItem('test:selection')
  })

  it('starts from initial, clamps thinking when switching to a non-reasoning model, and exposes forwardedProps', () => {
    const { result } = renderHook(() => useModelSelection({ catalog: defaultCatalog, key: 'test:selection', initial: { provider: 'openai', model: 'gpt-5.2', thinking: 'high', search: false } }))
    expect(result.current.forwardedProps).toEqual({ provider: 'openai', model: 'gpt-5.2', thinking: 'high', search: false })
    expect(result.current.model?.id).toBe('gpt-5.2')
    const nonReasoning = defaultCatalog.models.find(m => !m.reasoning)!
    act(() => result.current.setModel(`${nonReasoning.provider}/${nonReasoning.id}`))
    expect(result.current.selection.thinking).toBe('off')
    expect(result.current.provider?.id).toBe(nonReasoning.provider)
    expect((JSON.parse(localStorage.getItem('test:selection')!) as { model: string }).model).toBe(nonReasoning.id)
  })

  it('clamps setThinking to the model floor and keeps forwardedProps stable across renders', () => {
    const { result, rerender } = renderHook(() => useModelSelection({ catalog: defaultCatalog, key: 'test:selection', initial: { provider: 'anthropic', model: 'claude-fable-5', thinking: 'medium', search: false } }))
    const before = result.current.forwardedProps
    rerender()
    expect(result.current.forwardedProps).toBe(before)
    act(() => result.current.setThinking('off'))
    expect(result.current.selection.thinking).toBe('low')
  })

  it('search only turns on for a model that has it, and drops when switching away', () => {
    const { result } = renderHook(() => useModelSelection({ catalog: defaultCatalog, key: 'test:selection', initial: { provider: 'openai', model: 'gpt-5.2', thinking: 'off', search: false } }))
    act(() => result.current.setSearch(true))
    expect(result.current.selection.search).toBe(false)
    act(() => result.current.setModel('deepseek/deepseek-v4-flash'))
    act(() => result.current.setSearch(true))
    expect(result.current.selection.search).toBe(true)
    expect(result.current.forwardedProps.search).toBe(true)
    act(() => result.current.setModel('openai/gpt-5.2'))
    expect(result.current.selection.search).toBe(false)
  })

  it('clamps a stored search that the current model cannot honour', () => {
    localStorage.setItem('test:selection', JSON.stringify({ provider: 'openai', model: 'gpt-5.2', thinking: 'off', search: true }))
    const { result } = renderHook(() => useModelSelection({ catalog: defaultCatalog, key: 'test:selection' }))
    expect(result.current.forwardedProps.search).toBe(false)
  })
})
