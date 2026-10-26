import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Button } from '../src'

const animate = vi.hoisted(() => vi.fn())
vi.mock('motion/react', async original => ({ ...await original<typeof import('motion/react')>(), animate }))

afterEach(() => {
  vi.useRealTimers()
  animate.mockClear()
})

function scales(): string[] {
  return animate.mock.calls.map(([, keyframes]) => (keyframes as { transform: string }).transform)
}

it('holds a tap-length press down for the minimum before springing back', () => {
  // A trackpad tap-to-click releases within a frame: animate-ui's whileTap
  // would turn back before moving. The release waits out the rest of 100ms.
  vi.useFakeTimers()
  render(<Button>tap</Button>)
  const button = screen.getByRole('button', { name: 'tap' })
  // Motion hands tap callbacks to its next frame, hence the 16ms steps.
  fireEvent.pointerDown(button, { button: 0, isPrimary: true, pointerId: 1 })
  vi.advanceTimersByTime(16)
  fireEvent.pointerUp(button, { button: 0, isPrimary: true, pointerId: 1 })
  vi.advanceTimersByTime(16)
  expect(scales()).toEqual(['scale(0.97)'])
  vi.advanceTimersByTime(50)
  expect(scales()).toEqual(['scale(0.97)'])
  vi.advanceTimersByTime(50)
  expect(scales()).toEqual(['scale(0.97)', 'scale(1)'])
})

it('does not press while disabled', () => {
  vi.useFakeTimers()
  render(<Button disabled>off</Button>)
  fireEvent.pointerDown(screen.getByRole('button', { name: 'off' }), { button: 0, isPrimary: true, pointerId: 1 })
  vi.advanceTimersByTime(200)
  expect(animate).not.toHaveBeenCalled()
})
