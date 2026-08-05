import { render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Slider } from '../src/components/slider'

function thumbs(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"]')]
}

it('renders one thumb per value in play, not two by default', () => {
  // The vendored slider counted `Array.isArray(value)` only, falling back to
  // `[min, max]` — so every single-value slider grew a second thumb stacked on
  // the first: an extra tab stop for a control with one value.
  const { container, rerender } = render(<Slider aria-label="音量" defaultValue={50} />)
  expect(thumbs(container)).toHaveLength(1)

  rerender(<Slider aria-label="区间" defaultValue={[25, 75]} />)
  expect(thumbs(container)).toHaveLength(2)

  rerender(<Slider aria-label="默认" />)
  expect(thumbs(container)).toHaveLength(1)
})

it('follows the controlled value, including zero', () => {
  // `??` not `||` in the thumb count: 0 is a value, not an absence.
  const { container } = render(<Slider aria-label="音量" onValueChange={vi.fn()} value={0} />)
  expect(thumbs(container)).toHaveLength(1)
  expect(container.querySelector('input')?.value).toBe('0')
})

it('names the group from aria-label and keeps the styling hooks', () => {
  const { container } = render(<Slider aria-label="音量" className="mbs-4" defaultValue={40} />)
  const root = container.querySelector('[data-slot="slider"]')
  expect(root?.getAttribute('aria-label')).toBe('音量')
  expect(root?.getAttribute('class')).toContain('mbs-4')
  expect(container.querySelector('[data-slot="slider-track"]')).not.toBeNull()
  expect(container.querySelector('[data-slot="slider-range"]')).not.toBeNull()
})
