import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Field, FieldLabel } from '../src/components/field'
import {
  Select,
  SelectClear,
  SelectEmpty,
  SelectGroup,
  SelectItem,
  SelectPopup,
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
      <SelectPopup>
        <SelectGroup>
          {FRUITS.map(fruit => (
            <SelectItem key={fruit.id} value={fruit.id}>{fruit.name}</SelectItem>
          ))}
        </SelectGroup>
      </SelectPopup>
    </Select>,
  )
}

function renderFruitsWithEmpty(fruits: Fruit[]): void {
  render(
    <Select items={fruits.map(fruit => ({ value: fruit.id, label: fruit.name }))}>
      <SelectTrigger aria-label="水果"><SelectValue placeholder="选一个" /></SelectTrigger>
      <SelectPopup>
        <SelectEmpty>没有数据</SelectEmpty>
        {fruits.map(fruit => (
          <SelectItem key={fruit.id} value={fruit.id}>{fruit.name}</SelectItem>
        ))}
      </SelectPopup>
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

  it('defaults to non-modal — the page stays scrollable and interactive behind the open popup', async () => {
    // The discriminator is Base UI's internal backdrop (role="presentation"),
    // rendered only while `modal` — bare [data-base-ui-inert] would also match
    // the focus manager's outside-content MARKER, which appears for any open
    // popup, modal or not. The scroll lock shares the same gate: Positioner
    // engages it on (alignItemWithTriggerActive || modal), both now false.
    renderFruits()
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: '苹果' })
    expect(document.querySelector('[role="presentation"][data-base-ui-inert]')).toBeNull()
  })

  it('modal stays a plain prop — passing it restores Base UI\'s locked behaviour', async () => {
    renderFruits({ modal: true })
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: '苹果' })
    expect(document.querySelector('[role="presentation"][data-base-ui-inert]')).not.toBeNull()
  })

  it('selectClear: clears an uncontrolled select without opening the popup', async () => {
    const onValueChange = vi.fn()
    render(
      <Select defaultValue="pear" items={FRUIT_LABELS} onValueChange={onValueChange}>
        <SelectTrigger aria-label="水果">
          <SelectValue />
          <SelectClear />
        </SelectTrigger>
        <SelectPopup>
          {FRUITS.map(fruit => (
            <SelectItem key={fruit.id} value={fruit.id}>{fruit.name}</SelectItem>
          ))}
        </SelectPopup>
      </Select>,
    )
    expect(screen.getByRole('combobox').textContent).toContain('梨')

    // The chevron-hiding class rides the same boolean that renders the ✕.
    expect(screen.getByRole('combobox').className).toContain('[&>svg:last-child]:invisible')

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null, expect.objectContaining({ reason: 'clear-press' }))
    // Cleared back to the placeholder, and the popup never opened.
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('option', { name: '苹果' })).toBeNull()
    // Chevron restored: the class leaves with the ✕.
    expect(screen.getByRole('combobox').className).not.toContain('[&>svg:last-child]:invisible')
  })

  it('selectClear: only exists with something to clear — empty renders the plain chevron trigger', () => {
    render(
      <Select items={FRUIT_LABELS}>
        <SelectTrigger aria-label="水果">
          <SelectValue placeholder="选一个" />
          <SelectClear />
        </SelectTrigger>
        <SelectPopup>
          {FRUITS.map(fruit => (
            <SelectItem key={fruit.id} value={fruit.id}>{fruit.name}</SelectItem>
          ))}
        </SelectPopup>
      </Select>,
    )
    // The positioning container is there (the marker is composed), the ✕ is not.
    expect(document.querySelector('[data-slot="select-trigger-container"]')).not.toBeNull()
    expect(document.querySelector('[data-slot="select-clear"]')).toBeNull()
  })

  it('selectClear: hidden while disabled, and cancel() rejects the clear', async () => {
    const { rerender } = render(
      <Select defaultValue="pear" disabled items={FRUIT_LABELS}>
        <SelectTrigger aria-label="水果">
          <SelectValue />
          <SelectClear />
        </SelectTrigger>
        <SelectPopup />
      </Select>,
    )
    expect(document.querySelector('[data-slot="select-clear"]')).toBeNull()

    rerender(
      <Select defaultValue="pear" items={FRUIT_LABELS} onValueChange={(_value, details) => details.cancel()}>
        <SelectTrigger aria-label="水果">
          <SelectValue />
          <SelectClear />
        </SelectTrigger>
        <SelectPopup />
      </Select>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    // Rejected: still selected, ✕ still standing.
    expect(screen.getByRole('combobox').textContent).toContain('梨')
    expect(document.querySelector('[data-slot="select-clear"]')).not.toBeNull()
  })

  it('selectClear: a real button in the tab order — the only keyboard path to clearing', () => {
    render(
      <Select defaultValue="pear" items={FRUIT_LABELS}>
        <SelectTrigger aria-label="水果">
          <SelectValue />
          <SelectClear />
        </SelectTrigger>
        <SelectPopup />
      </Select>,
    )
    const clear = screen.getByRole('button', { name: 'Clear selection' })
    expect(clear.tagName).toBe('BUTTON')
    expect(clear.tabIndex).toBe(0)
    // A sibling of the trigger, never nested inside it (HTML forbids that).
    expect(clear.closest('[data-slot="select-trigger"]')).toBeNull()
  })

  it('one-liner: no children renders the whole default composition from items', async () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="水果" items={FRUIT_LABELS} placeholder="选一个" onValueChange={onValueChange} />)
    const trigger = screen.getByRole('combobox', { name: '水果' })
    expect(trigger.textContent).toContain('选一个')

    const user = userEvent.setup()
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: '梨' }))
    expect(onValueChange).toHaveBeenCalledWith('pear', expect.anything())
    expect(trigger.textContent).toContain('梨')

    // clearable defaults ON: the ✕ is part of the default composition.
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(trigger.textContent).toContain('选一个')
  })

  it('one-liner: clearable={false} is the master switch — no ✕ anywhere', async () => {
    render(<Select aria-label="水果" clearable={false} defaultValue="pear" items={FRUIT_LABELS} placeholder="选一个" />)
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
  })

  it('clearable={false} also kills an explicitly composed SelectClear', () => {
    render(
      <Select clearable={false} defaultValue="pear" items={FRUIT_LABELS}>
        <SelectTrigger aria-label="水果">
          <SelectValue />
          <SelectClear />
        </SelectTrigger>
        <SelectPopup />
      </Select>,
    )
    expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
  })

  it('one-liner: grouped items flatten — rendering groups is composition vocabulary', async () => {
    // Base UI usage: the grouped shape feeds label resolution (its resolver
    // flatMaps it); rendering group headings is always composed by the caller.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const grouped = [
      { value: '木管', items: [{ value: 'flute', label: '长笛' }] },
      { value: '铜管', items: [{ value: 'horn', label: '圆号' }] },
    ]
    render(<Select aria-label="乐器" items={grouped} placeholder="选一件" />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: '长笛' })
    expect(screen.getByRole('option', { name: '圆号' })).not.toBeNull()
    // One implicit group only — no headings, and the dev warning points at composition.
    expect(document.querySelectorAll('[data-slot="select-group"]').length).toBe(1)
    expect(screen.queryByText('木管')).toBeNull()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('composition'))
    error.mockRestore()
  })

  it('one-liner: a record of value → label renders too', async () => {
    render(<Select aria-label="水果" items={{ apple: '苹果', pear: '梨' }} placeholder="选一个" />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    expect(await screen.findByRole('option', { name: '苹果' })).not.toBeNull()
  })

  it('trigger without children composes its own default: SelectValue + clear', async () => {
    render(
      <Select defaultValue="pear" items={FRUIT_LABELS} placeholder="选一个">
        <SelectTrigger aria-label="水果" />
        <SelectPopup>
          {FRUITS.map(fruit => (
            <SelectItem key={fruit.id} value={fruit.id}>{fruit.name}</SelectItem>
          ))}
        </SelectPopup>
      </Select>,
    )
    const trigger = screen.getByRole('combobox', { name: '水果' })
    expect(trigger.textContent).toContain('梨')
    expect(screen.getByRole('button', { name: 'Clear selection' })).not.toBeNull()
  })

  it('wraps ungrouped content in an implicit SelectGroup — the padding lives there', async () => {
    renderFruitsWithEmpty(FRUITS)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: '苹果' })
    const groups = document.querySelectorAll('[data-slot="select-group"]')
    expect(groups.length).toBe(1)
    // The options landed inside it.
    expect(groups[0]?.querySelectorAll('[role="option"]').length).toBe(2)
  })

  it('leaves explicitly grouped content alone — no double wrap', async () => {
    renderFruits()
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: '苹果' })
    expect(document.querySelectorAll('[data-slot="select-group"]').length).toBe(1)
  })

  it('selectEmpty: an :only-child slot — present among options it stays CSS-hidden', async () => {
    renderFruitsWithEmpty(FRUITS)
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: '苹果' })
    const empty = document.querySelector('[data-slot="select-empty"]')
    // jsdom does not compute :only-child visibility; the contract is the
    // classes plus the structure — with options as siblings it is not the
    // only child, so `only:block` cannot fire and `hidden` holds.
    expect(empty?.className).toContain('only:block')
    expect(empty?.className).toContain('hidden')
    expect(empty?.parentElement?.children.length).toBeGreaterThan(1)
  })

  it('selectEmpty: alone in the list (no data, no group shell) it is the only child', async () => {
    renderFruitsWithEmpty([])
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    const empty = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot="select-empty"]')
      if (!found)
        throw new Error('not mounted yet')
      return found
    })
    expect(empty.parentElement?.children.length).toBe(1)
    expect(empty.textContent).toBe('没有数据')
  })

  it('defaults alignItemWithTrigger off — an ordinary anchored dropdown, not the macOS overlay', async () => {
    renderFruits()
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: '苹果' })
    // The vendored popup echoes the flag as data-align-trigger (value form).
    expect(document.querySelector('[data-slot="select-content"]')?.getAttribute('data-align-trigger')).toBe('false')
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
        <SelectPopup>
          <div data-testid="empty">还没有可选的</div>
        </SelectPopup>
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
        <SelectPopup>
          <SelectGroup>
            <SelectItem value="apple">苹果</SelectItem>
            <SelectSeparator />
            <SelectItem disabled value="pear">梨</SelectItem>
          </SelectGroup>
        </SelectPopup>
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
        <SelectPopup><SelectItem value="apple">苹果</SelectItem></SelectPopup>
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
          <SelectPopup><SelectItem value="apple">苹果</SelectItem></SelectPopup>
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

  // The label is the control, so clicking it while the menu is open closes it —
  // once. Base UI dismisses on a press outside the popup (`outside-press`, then
  // `cancel-open` for the same gesture), and the browser forwards the label's
  // click to the trigger, which toggles: unfiltered, those add up to a close
  // immediately followed by an open — the flicker this pins down. The seam
  // cancels the dismissals a label of our own trigger causes, leaving the
  // forwarded click to do the one toggle.
  it('closes the menu when the label is clicked again — no reopen', async () => {
    renderLabelled()
    const user = userEvent.setup()
    await user.click(screen.getByText('水果'))
    expect(await screen.findByRole('option', { name: '苹果' })).not.toBeNull()

    await user.click(screen.getByText('水果'))
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: '苹果' })).toBeNull()
    })
    expect(screen.getByRole('combobox', { name: '水果' }).getAttribute('aria-expanded')).toBe('false')
  })

  it('a press outside still dismisses', async () => {
    render(
      <>
        <button type="button">外面</button>
        <Field>
          <FieldLabel htmlFor="fruit">水果</FieldLabel>
          <Select>
            <SelectTrigger id="fruit"><SelectValue placeholder="选一个" /></SelectTrigger>
            <SelectPopup><SelectItem value="apple">苹果</SelectItem></SelectPopup>
          </Select>
        </Field>
      </>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByText('水果'))
    expect(await screen.findByRole('option', { name: '苹果' })).not.toBeNull()

    await user.click(screen.getByRole('button', { name: '外面' }))
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: '苹果' })).toBeNull()
    })
  })
})
