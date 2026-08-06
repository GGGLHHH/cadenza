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

it('shows the pending spinner and swallows clicks while pending', async () => {
  const onClick = vi.fn()
  render(<Button pending onClick={onClick}>保存</Button>)
  const button = screen.getByRole('button')
  // Focusable but inert: aria-disabled rather than the disabled attribute, so
  // focus does not evaporate mid-action. Clicks stop firing either way.
  expect(button.getAttribute('aria-disabled')).toBe('true')
  expect(button.hasAttribute('disabled')).toBe(false)
  expect(button.getAttribute('aria-busy')).toBe('true')
  expect(button.getAttribute('data-pending')).toBe('')
  expect(button.querySelector('[data-slot="spinner"]')).not.toBeNull()
  await userEvent.click(button)
  expect(onClick).not.toHaveBeenCalled()
})

it('a pending submit button stops submitting', () => {
  const { rerender } = render(<Button type="submit">保存</Button>)
  expect(screen.getByRole('button').getAttribute('type')).toBe('submit')
  // Not `type="submit"` while pending, or Enter in a sibling input would submit
  // the form this button is already busy submitting.
  rerender(<Button pending type="submit">保存</Button>)
  expect(screen.getByRole('button').getAttribute('type')).toBe('button')
})

it('defaults to type="button", so a form does not take it for its submit button', () => {
  render(<Button>保存</Button>)
  expect(screen.getByRole('button').getAttribute('type')).toBe('button')
})

it('leaves a LinkButton announcing as a link', () => {
  render(<LinkButton href="/a">打开</LinkButton>)
  // Base UI writes role="button" on every non-native button; this one navigates.
  expect(screen.getByRole('link').getAttribute('role')).toBeNull()
})

it('renders no spinner at rest', () => {
  render(<Button>保存</Button>)
  expect(screen.getByRole('button').querySelector('[data-slot="spinner"]')).toBeNull()
})

it('frosts the label in place — covered and melted, never replaced', () => {
  render(<Button pending>保存</Button>)
  const button = screen.getByRole('button', { name: '保存' })
  const overlay = button.querySelector('[data-slot="loading-overlay"]')
  expect(overlay?.getAttribute('data-loading')).toBe('')
  // The frost is a CONTENT blur on the label wrapper, not a backdrop blur:
  // the label stays in the tree (width, accessible name) and melts softly.
  const label = button.querySelector('[data-slot="button-label"]')
  expect(label?.textContent).toBe('保存')
  expect(label?.className).toContain('group-data-pending/button:blur-[2px]')
  // The spinner pairs with the background-toned scrim — currentColor would
  // camouflage it against the veiled label underneath.
  expect(button.querySelector('[data-slot="spinner"]')?.getAttribute('class')).toContain('text-foreground')
  // Button-scale physics, pinned so it never regresses: a backdrop kernel
  // sampling up to the button's silhouette smears edge halos — so the scrim
  // is flat and the host's overflow clip does ALL the shaping (verified in a
  // real browser at 8x magnification).
  expect(button.className).toContain('overflow-hidden')
  expect(overlay?.className).toContain('backdrop-blur-none')
  expect(overlay?.className).toContain('rounded-none')
})

it('keeps the machinery mounted while the prop is in play, so the exit can animate', () => {
  const { rerender } = render(<Button pending>保存</Button>)
  rerender(<Button pending={false}>保存</Button>)
  // Still in the DOM (hidden by the overlay's own CSS) — unmounting would cut
  // the fade-out short, since React removes nodes synchronously.
  expect(document.querySelector('[data-slot="loading-overlay"]')).not.toBeNull()
  expect(screen.getByRole('button').getAttribute('aria-disabled')).toBeNull()
})

it('strips href from a disabled LinkButton and dims it — :disabled never fires on a link', () => {
  render(<LinkButton disabled href="https://example.com">文档</LinkButton>)
  const link = screen.getByText('文档')
  expect(link.tagName).toBe('A')
  // No href: aria-disabled alone still leaves a link openable from the context
  // menu, and an anchor without href is not focusable either.
  expect(link.hasAttribute('href')).toBe(false)
  expect(link.getAttribute('aria-disabled')).toBe('true')
  expect(link.getAttribute('data-disabled')).toBe('')
  expect(link.className).toContain('data-disabled:opacity-50')
})

it('keeps href on a live LinkButton', () => {
  render(<LinkButton href="https://example.com">文档</LinkButton>)
  expect(screen.getByText('文档').getAttribute('href')).toBe('https://example.com')
})

it('fires onClick and stays silent when disabled', async () => {
  const onClick = vi.fn()
  const { rerender } = render(<Button onClick={onClick}>Save</Button>)
  await userEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledTimes(1)

  rerender(<Button disabled onClick={onClick}>Save</Button>)
  await userEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledTimes(1)
})
