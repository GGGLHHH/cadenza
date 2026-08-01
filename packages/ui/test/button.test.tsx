import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Button, buttonVariants, LinkButton } from '../src'
import { cn } from '../src/lib/utils'

it('later tailwind utilities win', () => {
  expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
})

it('applies variant and size classes', () => {
  const cls = buttonVariants({ variant: 'ghost', size: 'icon' })
  expect(cls).toContain('size-8')
  expect(cls).not.toContain('bg-primary')
})

it('className overrides the variant class', () => {
  render(<Button className="bg-red-500">Save</Button>)
  const classes = screen.getByRole('button').className.split(' ')
  expect(classes).toContain('bg-red-500')
  // twMerge drops the base background but keeps the hover variant — different conflict group.
  expect(classes).not.toContain('bg-primary')
  expect(classes).toContain('hover:bg-primary/80')
})

it('exposes variant and size as data attributes', () => {
  render(<Button variant="outline" size="sm">Save</Button>)
  const button = screen.getByRole('button')
  expect(button.dataset.variant).toBe('outline')
  expect(button.dataset.size).toBe('sm')
})

it('dims a disabled LinkButton — :disabled never fires on a link', () => {
  render(<LinkButton href="https://example.com" isDisabled>文档</LinkButton>)
  // RAC renders a disabled link as a <span data-disabled>, so the variants'
  // `disabled:` styles can never match; the dimming rides the data attribute.
  const link = screen.getByText('文档')
  expect(link.tagName).toBe('SPAN')
  expect(link.getAttribute('data-disabled')).toBe('true')
  expect(link.className).toContain('data-disabled:opacity-50')
})

it('fires onPress and stays silent when disabled', async () => {
  const onPress = vi.fn()
  const { rerender } = render(<Button onPress={onPress}>Save</Button>)
  await userEvent.click(screen.getByRole('button'))
  expect(onPress).toHaveBeenCalledTimes(1)

  rerender(<Button isDisabled onPress={onPress}>Save</Button>)
  await userEvent.click(screen.getByRole('button'))
  expect(onPress).toHaveBeenCalledTimes(1)
})
