import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Badge } from '../src/components/badge'

it('mirrors the variant as a data attribute on the badge slot', () => {
  const { container } = render(<Badge variant="outline">New</Badge>)
  const badge = container.querySelector<HTMLElement>('[data-slot=badge]')!
  expect(badge.tagName).toBe('SPAN')
  expect(badge.dataset.variant).toBe('outline')
})

it('renders as a link through render, keeping the badge classes', () => {
  const { container } = render(<Badge render={<a href="/new" />}>New</Badge>)
  const badge = container.querySelector<HTMLElement>('[data-slot=badge]')!
  expect(badge.tagName).toBe('A')
  expect(badge.getAttribute('href')).toBe('/new')
})
