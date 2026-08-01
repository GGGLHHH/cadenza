import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Spinner } from '../src'

it('renders a status role with the aria-only English fallback name', () => {
  render(<Spinner />)
  const spinner = screen.getByRole('status', { name: 'Loading' })
  expect(spinner.getAttribute('data-slot')).toBe('spinner')
})

it('lets the caller replace the accessible name and the size', () => {
  render(<Spinner aria-label="加载中" className="block-6 inline-6" />)
  const spinner = screen.getByRole('status', { name: '加载中' })
  // The logical size utilities sort after the physical ones in the built
  // stylesheet, so at equal specificity they win over the baked-in size-4.
  expect(spinner.getAttribute('class')).toContain('block-6')
  expect(spinner.getAttribute('class')).toContain('inline-6')
})
