import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from '../src/components/progress'

const bar = (c: HTMLElement): HTMLElement => c.querySelector('[role=progressbar]')!

it('maps value to aria-valuenow and mirrors the status on every part', () => {
  const { container, rerender } = render(<Progress value={56} />)
  expect(bar(container).dataset.slot).toBe('progress')
  expect(bar(container).getAttribute('aria-valuenow')).toBe('56')
  expect(bar(container).hasAttribute('data-progressing')).toBe(true)
  expect(container.querySelector('[data-slot=progress-track]')).not.toBeNull()
  expect(container.querySelector('[data-slot=progress-indicator]')?.hasAttribute('data-progressing')).toBe(true)
  rerender(<Progress value={100} />)
  expect(bar(container).hasAttribute('data-complete')).toBe(true)
  rerender(<Progress value={2} max={4} />)
  expect(bar(container).getAttribute('aria-valuenow')).toBe('2')
  expect(bar(container).getAttribute('aria-valuemax')).toBe('4')
})

it('is indeterminate on null: no aria-valuenow, data-indeterminate on the indicator', () => {
  const { container } = render(<Progress value={null} />)
  expect(bar(container).hasAttribute('aria-valuenow')).toBe(false)
  expect(bar(container).hasAttribute('data-indeterminate')).toBe(true)
  expect(container.querySelector('[data-slot=progress-indicator]')?.hasAttribute('data-indeterminate')).toBe(true)
})

it('wires the label through aria-labelledby and prints the formatted value', () => {
  const { container } = render(
    <Progress value={25}>
      <ProgressLabel>Upload</ProgressLabel>
      <ProgressValue />
    </Progress>,
  )
  const label = container.querySelector('[data-slot=progress-label]')!
  expect(bar(container).getAttribute('aria-labelledby')).toBe(label.id)
  expect(container.querySelector('[data-slot=progress-value]')?.textContent).toBe('25%')
})

it('steps aside when a track is composed instead of rendering a second one', () => {
  const { container } = render(
    <Progress value={40}>
      <ProgressTrack className="block-2">
        <ProgressIndicator className={({ status }) => `is-${status}`} />
      </ProgressTrack>
    </Progress>,
  )
  expect(container.querySelectorAll('[data-slot=progress-track]')).toHaveLength(1)
  expect(container.querySelector('[data-slot=progress-track]')?.className).toContain('block-2')
  expect(container.querySelector('[data-slot=progress-indicator]')?.className).toContain('is-progressing')
})
