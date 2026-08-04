import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Field, FieldLabel } from '../src/components/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../src/components/select'

interface Fruit { id: string, name: string }
const FRUITS: Fruit[] = [{ id: 'apple', name: '苹果' }, { id: 'pear', name: '梨' }]

// `items` is what tells SelectValue how to render a value in the trigger — the
// option list does not feed it. Without it the trigger shows the raw value.
const FRUIT_LABELS = FRUITS.map(fruit => ({ value: fruit.id, label: fruit.name }))

function renderFruits(props: Partial<Parameters<typeof Select>[0]> = {}): void {
  render(
    <Select items={FRUIT_LABELS} {...props}>
      <SelectTrigger aria-label="水果"><SelectValue placeholder="选一个" /></SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {FRUITS.map(fruit => (
            <SelectItem key={fruit.id} value={fruit.id}>{fruit.name}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>,
  )
}

describe('select', () => {
  it('shows the placeholder until something is picked', () => {
    renderFruits()
    expect(screen.getByRole('combobox').textContent).toContain('选一个')
  })

  it('opens on click and lists the options', async () => {
    renderFruits()
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    expect(await screen.findByRole('option', { name: '苹果' })).not.toBeNull()
    expect(screen.getByRole('option', { name: '梨' })).not.toBeNull()
  })

  it('commits the picked option and reports it', async () => {
    const onValueChange = vi.fn()
    renderFruits({ onValueChange })
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '梨' }))
    expect(onValueChange).toHaveBeenCalledWith('pear', expect.anything())
    expect(screen.getByRole('combobox').textContent).toContain('梨')
  })

  it('keeps a controlled value pinned to the prop while still reporting the change', async () => {
    const onValueChange = vi.fn()
    renderFruits({ onValueChange, value: 'apple' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '梨' }))
    expect(onValueChange).toHaveBeenCalledWith('pear', expect.anything())
    expect(screen.getByRole('combobox').textContent).toContain('苹果')
  })

  it('opens with no options at all — an empty select is still a select', async () => {
    render(
      <Select>
        <SelectTrigger aria-label="水果"><SelectValue placeholder="选一个" /></SelectTrigger>
        <SelectContent>
          <div data-testid="empty">还没有可选的</div>
        </SelectContent>
      </Select>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    // No renderEmptyState hook and none needed: the empty state is plain JSX,
    // and nothing guards the open the way React Stately's collection size did.
    expect(screen.getByTestId('empty')).not.toBeNull()
  })

  it('picks several at once under multiple', async () => {
    const onValueChange = vi.fn()
    renderFruits({ multiple: true, onValueChange })
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '苹果' }))
    await user.click(screen.getByRole('option', { name: '梨' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['apple', 'pear'], expect.anything())
  })

  it('never commits a disabled option', async () => {
    const onValueChange = vi.fn()
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="水果"><SelectValue placeholder="选一个" /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="apple">苹果</SelectItem>
            <SelectSeparator />
            <SelectItem disabled value="pear">梨</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '梨' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('forwards ref on the trigger', () => {
    const trigger = createRef<HTMLButtonElement>()
    render(
      <Select>
        <SelectTrigger aria-label="水果" ref={trigger}><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="apple">苹果</SelectItem></SelectContent>
      </Select>,
    )
    expect(trigger.current?.dataset.slot).toBe('select-trigger')
  })
})

describe('the label channel', () => {
  function renderLabelled(): void {
    render(
      <Field>
        <FieldLabel htmlFor="fruit">水果</FieldLabel>
        <Select>
          <SelectTrigger id="fruit"><SelectValue placeholder="选一个" /></SelectTrigger>
          <SelectContent><SelectItem value="apple">苹果</SelectItem></SelectContent>
        </Select>
      </Field>,
    )
  }

  // One channel now carries both halves. The trigger is a real <button>, so a
  // native <label for> names it AND — because the browser forwards the click —
  // opens the menu. The React Aria build needed a second `aria-label` (its own
  // aria-labelledby outranked the native label) plus seam-side click plumbing
  // (usePress ignored a click with no pointer sequence behind it); neither is
  // needed here, and this pins that.
  it('names the trigger through htmlFor alone', () => {
    renderLabelled()
    expect(screen.getByRole('combobox', { name: '水果' })).not.toBeNull()
  })

  it('opens the menu when the label text is clicked', async () => {
    renderLabelled()
    const user = userEvent.setup()
    await user.click(screen.getByText('水果'))
    expect(await screen.findByRole('option', { name: '苹果' })).not.toBeNull()
  })
})
