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

it('controlled-ness locks at first render: turning value undefined warns and does not fall back to internal state', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const initialProps: { value?: string } = { value: 'a' }
  const { result, rerender } = renderHook(
    ({ value }: { value?: string }) => useControllableState({ value, fallback: 'x' }),
    { initialProps },
  )
  act(() => result.current[1]('internal'))
  rerender({ value: undefined })
  // Still controlled: renders the (undefined) prop, not the internal write.
  expect(result.current[0]).toBeUndefined()
  expect(error).toHaveBeenCalledWith(expect.stringContaining('controlled'))
  error.mockRestore()
})

it('uncontrolled: changing defaultValue after mount warns and never takes effect', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const { result, rerender } = renderHook(
    ({ defaultValue }) => useControllableState({ defaultValue, fallback: 0 }),
    { initialProps: { defaultValue: 1 } },
  )
  rerender({ defaultValue: 2 })
  expect(result.current[0]).toBe(1)
  expect(error).toHaveBeenCalledWith(expect.stringContaining('defaultValue'))
  error.mockRestore()
})
