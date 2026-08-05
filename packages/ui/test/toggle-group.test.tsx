import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ToggleGroup, ToggleGroupItem } from '../src/components/toggle-group'

function renderAlign(props: Partial<Parameters<typeof ToggleGroup>[0]> = {}): void {
  render(
    <ToggleGroup aria-label="对齐" {...props}>
      <ToggleGroupItem value="start">左</ToggleGroupItem>
      <ToggleGroupItem value="center">中</ToggleGroupItem>
      <ToggleGroupItem value="end">右</ToggleGroupItem>
    </ToggleGroup>,
  )
}

it('navigates the way it looks when vertical', async () => {
  const user = userEvent.setup()
  renderAlign({ orientation: 'vertical' })

  // The vendored group declared its own `orientation`, used it for the flex
  // direction and then never handed it to Base UI — so a group that looked
  // vertical still moved on ArrowRight and ignored ArrowDown.
  const group = screen.getByRole('group', { name: '对齐' })
  expect(group.getAttribute('data-orientation')).toBe('vertical')

  const start = screen.getByRole('button', { name: '左' })
  start.focus()
  await user.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '中' }))
})

it('reports the pressed values as an array with details', async () => {
  const user = userEvent.setup()
  const onValueChange = vi.fn()
  renderAlign({ defaultValue: ['start'], onValueChange })

  await user.click(screen.getByRole('button', { name: '中' }))

  // Single-select is still an array — `multiple` only decides how many entries
  // may be in it at once.
  expect(onValueChange).toHaveBeenCalledWith(['center'], expect.objectContaining({ reason: 'none' }))
  expect(screen.getByRole('button', { name: '中' }).getAttribute('data-pressed')).toBe('')
})

it('hands variant and size down to the items, and lets an item override', () => {
  render(
    <ToggleGroup aria-label="对齐" size="sm" variant="outline">
      <ToggleGroupItem value="start">左</ToggleGroupItem>
      <ToggleGroupItem size="lg" value="center">中</ToggleGroupItem>
    </ToggleGroup>,
  )

  const inherited = screen.getByRole('button', { name: '左' })
  expect(inherited.getAttribute('data-variant')).toBe('outline')
  expect(inherited.getAttribute('data-size')).toBe('sm')
  expect(inherited.getAttribute('class')).toContain('border')

  // Item wins over group wins over library default. The vendored item read
  // `context.size || size`, so a group that set the knob could never be
  // overridden — its own defaulted prop is what forced that order.
  const overridden = screen.getByRole('button', { name: '中' })
  expect(overridden.getAttribute('data-size')).toBe('lg')
  expect(overridden.getAttribute('data-variant')).toBe('outline')
})

it('keeps the function className the cn route actually supports', () => {
  render(
    <ToggleGroup aria-label="对齐">
      <ToggleGroupItem className={state => (state.pressed ? 'on' : 'off')} value="start">左</ToggleGroupItem>
    </ToggleGroup>,
  )
  // Unlike `Toggle`, this file merges the caller's className through `cn`
  // rather than handing it to cva — so the function form resolves instead of
  // being dropped, and the type says so.
  expect(screen.getByRole('button', { name: '左' }).getAttribute('class')).toContain('off')
})
