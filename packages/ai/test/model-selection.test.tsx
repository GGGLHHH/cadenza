import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultCatalog } from '../src/catalog'
import { supportedThinkingLevels } from '../src/catalog/thinking'
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

  it('clamps a stored search that the current model cannot honour, on both read surfaces', () => {
    localStorage.setItem('test:selection', JSON.stringify({ provider: 'openai', model: 'gpt-5.2', thinking: 'off', search: true }))
    const { result } = renderHook(() => useModelSelection({ catalog: defaultCatalog, key: 'test:selection' }))
    expect(result.current.forwardedProps.search).toBe(false)
    expect(result.current.selection.search).toBe(false)
  })

  it('reads a selection stored before `search` existed as false, never undefined', () => {
    // `SearchToggle` passes `selection.search` as its controlled `value`, and
    // `useControllableState` locks controlled-ness at first render on
    // `value !== undefined` — one undefined and the toggle runs uncontrolled
    // for the rest of the session.
    localStorage.setItem('test:selection', JSON.stringify({ provider: 'deepseek', model: 'deepseek-v4-flash', thinking: 'high' }))
    const { result } = renderHook(() => useModelSelection({ catalog: defaultCatalog, key: 'test:selection' }))
    expect(result.current.selection.search).toBe(false)
    expect(result.current.forwardedProps.search).toBe(false)
    // And the legacy shape must not survive a write through any of the setters.
    act(() => result.current.setModel('deepseek/deepseek-v4-pro'))
    expect(JSON.parse(localStorage.getItem('test:selection')!)).toMatchObject({ search: false })
  })

  it('clamps a stored thinking level the current model no longer offers', () => {
    // What a catalog update that narrows `thinkingLevels` leaves behind. Unclamped it
    // reaches `ThinkingLevelPicker`, whose Select has no item carrying that value.
    localStorage.setItem('test:selection', JSON.stringify({ provider: 'deepseek', model: 'deepseek-v4-pro', thinking: 'medium', search: false }))
    const { result } = renderHook(() => useModelSelection({ catalog: defaultCatalog, key: 'test:selection' }))
    expect(supportedThinkingLevels(result.current.model)).not.toContain('medium')
    expect(supportedThinkingLevels(result.current.model)).toContain(result.current.selection.thinking)
  })

  it('leaves the stored choice alone while the catalog does not know the model', () => {
    // "No entry in the catalog" is not "this model cannot do it" — an id the catalog
    // dropped or renamed must not silently erase what the user picked.
    localStorage.setItem('test:selection', JSON.stringify({ provider: 'deepseek', model: 'deepseek-v9-imaginary', thinking: 'high', search: true, note: 'kept' }))
    const { result } = renderHook(() => useModelSelection({ catalog: defaultCatalog, key: 'test:selection' }))
    expect(result.current.model).toBeUndefined()
    expect(result.current.selection).toMatchObject({ thinking: 'high', search: true })
    act(() => result.current.setThinking('low'))
    // The write keeps `search`, and keys we never knew about ride along untouched.
    expect(JSON.parse(localStorage.getItem('test:selection')!)).toMatchObject({ search: true, note: 'kept' })
  })
})
