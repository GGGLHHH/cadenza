import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { expect, it } from 'vitest'
import { LoadingOverlay } from '../src'

it('stays mounted but invisible at rest, so the exit can animate', () => {
  render(<LoadingOverlay />)
  const overlay = document.querySelector('[data-slot="loading-overlay"]')
  expect(overlay).not.toBeNull()
  expect(overlay?.getAttribute('data-loading')).toBeNull()
  // invisible removes it from the accessibility tree — no phantom "Loading"
  // announcement — and pointer-events-none keeps it from eating clicks.
  expect(overlay?.className).toContain('invisible')
  expect(overlay?.className).toContain('pointer-events-none')
})

it('shows the centred spinner and the wait cursor while loading', () => {
  render(<LoadingOverlay isLoading />)
  const overlay = document.querySelector('[data-slot="loading-overlay"]')
  expect(overlay?.getAttribute('data-loading')).toBe('')
  expect(overlay?.className).toContain('cursor-wait')
  expect(overlay?.className).not.toContain('invisible')
  // Load-bearing, not cosmetic: Chromium only clips backdrop-filter by the
  // element's own radius — dropping this reopens square corner notches.
  expect(overlay?.className).toContain('rounded-[inherit]')
  expect(screen.getByRole('status', { name: 'Loading' })).not.toBeNull()
})

it('lets children replace the default spinner', () => {
  render(<LoadingOverlay isLoading>正在加载数据…</LoadingOverlay>)
  expect(document.querySelector('[data-slot="spinner"]')).toBeNull()
  expect(screen.getByText('正在加载数据…')).not.toBeNull()
})

it('spreads div props and forwards the ref', () => {
  const ref = createRef<HTMLDivElement>()
  render(<LoadingOverlay className="rounded-xl" data-testid="mask" isLoading ref={ref} />)
  expect(ref.current?.dataset.slot).toBe('loading-overlay')
  expect(screen.getByTestId('mask').className).toContain('rounded-xl')
  expect(screen.getByTestId('mask').className).toContain('backdrop-blur-sm')
})
