import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useControllableState } from '../src'

it('uncontrolled: owns state, seeds from fallback, supports updater fn', () => {
  const { result } = renderHook(() => useControllableState({ fallback: 0 }))
  expect(result.current[0]).toBe(0)
  act(() => result.current[1](5))
  expect(result.current[0]).toBe(5)
  act(() => result.current[1](prev => prev + 1))
  expect(result.current[0]).toBe(6)
})

it('uncontrolled: defaultValue wins over fallback', () => {
  const { result } = renderHook(() => useControllableState({ defaultValue: 3, fallback: 0 }))
  expect(result.current[0]).toBe(3)
})

it('controlled: state follows the prop, setState only fires onChange', () => {
  const onChange = vi.fn()
  const { result, rerender } = renderHook(
    ({ value }) => useControllableState({ value, onChange, fallback: '' }),
    { initialProps: { value: 'a' } },
  )
  expect(result.current[0]).toBe('a')

  act(() => result.current[1]('b'))
  expect(onChange).toHaveBeenCalledWith('b')
  // Parent has not applied it yet — state still mirrors the prop.
  expect(result.current[0]).toBe('a')

  rerender({ value: 'b' })
  expect(result.current[0]).toBe('b')
})

it('setState identity is stable across renders', () => {
  const { result, rerender } = renderHook(() => useControllableState({ fallback: 0 }))
  const first = result.current[1]
  act(() => result.current[1](1))
  rerender()
  expect(result.current[1]).toBe(first)
})
