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

it('shows the pending spinner and swallows presses while isPending', async () => {
  const onPress = vi.fn()
  render(<Button isPending onPress={onPress}>保存</Button>)
  const button = screen.getByRole('button')
  // RAC keeps the button focusable (aria-disabled, not disabled) so focus
  // does not evaporate mid-interaction; presses stop firing regardless.
  expect(button.getAttribute('aria-disabled')).toBe('true')
  expect(button.querySelector('[data-slot="spinner"]')).not.toBeNull()
  await userEvent.click(button)
  expect(onPress).not.toHaveBeenCalled()
})

it('treats isLoading as an alias of isPending', () => {
  render(<Button isLoading>保存</Button>)
  const button = screen.getByRole('button')
  expect(button.getAttribute('aria-disabled')).toBe('true')
  expect(button.querySelector('[data-slot="spinner"]')).not.toBeNull()
})

it('renders no spinner at rest', () => {
  render(<Button>保存</Button>)
  expect(screen.getByRole('button').querySelector('[data-slot="spinner"]')).toBeNull()
})

it('keeps the label in place while pending — width never changes', () => {
  // Spectrum's pattern: the label goes opacity-0 but keeps sizing the button
  // and stays in the accessibility tree; the spinner overlays it, centred.
  render(<Button isPending>保存</Button>)
  const button = screen.getByRole('button')
  expect(button.querySelector('[data-slot="button-label"]')?.textContent).toBe('保存')
  expect(button.querySelector('[data-slot="button-pending"]')?.getAttribute('aria-hidden')).toBe('true')
  // Accessible name still comes from the label.
  expect(screen.getByRole('button', { name: '保存' })).not.toBeNull()
})

it('keeps the machinery mounted while the prop is in play, so the exit can animate', () => {
  const { rerender } = render(<Button isPending>保存</Button>)
  rerender(<Button isPending={false}>保存</Button>)
  // Still in the DOM (hidden by CSS off data-pending) — unmounting would cut
  // the fade-out short, since React removes nodes synchronously.
  expect(document.querySelector('[data-slot="spinner"]')).not.toBeNull()
  expect(screen.getByRole('button').getAttribute('aria-disabled')).toBeNull()
})

it('leaves function children alone — the caller owns the pending rendering', () => {
  render(
    <Button isPending>
      {({ isPending }) => <span data-testid="custom">{isPending ? '忙' : '闲'}</span>}
    </Button>,
  )
  expect(screen.getByTestId('custom').textContent).toBe('忙')
  expect(document.querySelector('[data-slot="spinner"]')).toBeNull()
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
