import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from '../src/components/date-picker'
import { Field, FieldLabel } from '../src/components/field'

// Fixed dates keep the calendar's grid deterministic: August 2026 starts on a
// Saturday, and none of the asserted days collide with outside days.
const AUG_16 = new Date(2026, 7, 16)

function getInput(): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>('textbox')
}

function queryCalendar(): HTMLElement | null {
  return document.querySelector('[data-slot="calendar"]')
}

async function clickDay(day: string): Promise<void> {
  const calendar = queryCalendar()
  expect(calendar).not.toBeNull()
  const user = userEvent.setup()
  await user.click(within(calendar as HTMLElement).getByText(day))
}

describe('date-picker', () => {
  it('renders the default composition: an editable input plus a calendar trigger button', () => {
    render(<DatePicker aria-label="日期" placeholder="选择日期" />)
    const input = getInput()
    expect(input.placeholder).toBe('选择日期')
    // The trigger is a real button — InputGroupAddon forwards clicks on
    // anything else to the input, which would swallow the toggle.
    expect(screen.getByRole('button', { name: 'Open calendar' })).not.toBeNull()
  })

  it('shows the formatted value and keeps the visible text in sync with a controlled value', () => {
    const { rerender } = render(<DatePicker aria-label="日期" value={AUG_16} />)
    expect(getInput().value).toBe('2026-08-16')
    rerender(<DatePicker aria-label="日期" value={new Date(2026, 7, 20)} />)
    expect(getInput().value).toBe('2026-08-20')
  })

  it('commits a typed date as soon as it parses, with reason input-change', async () => {
    const onValueChange = vi.fn()
    render(<DatePicker aria-label="日期" onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.type(getInput(), '2026-08-20')
    const [value, details] = onValueChange.mock.lastCall as [Date, { reason: string }]
    expect(value.getFullYear()).toBe(2026)
    expect(value.getMonth()).toBe(7)
    expect(value.getDate()).toBe(20)
    expect(details.reason).toBe('input-change')
  })

  it('reverts unparseable text to the last committed value when the field is left', async () => {
    const onValueChange = vi.fn()
    render(
      <div>
        <DatePicker aria-label="日期" defaultValue={AUG_16} onValueChange={onValueChange} />
        <button type="button">外部</button>
      </div>,
    )
    const user = userEvent.setup()
    const input = getInput()
    await user.clear(input)
    await user.type(input, 'nonsense')
    // Clicking elsewhere both closes the popup (outside press) and blurs the
    // input; the unparseable draft must be dropped, not kept as ghost text.
    await user.click(screen.getByRole('button', { name: '外部' }))
    expect(input.value).toBe('2026-08-16')
    await waitFor(() => expect(queryCalendar()).toBeNull())
  })

  it('clears the value when the text is emptied and the field is left, with reason input-clear', async () => {
    const onValueChange = vi.fn()
    render(<DatePicker aria-label="日期" defaultValue={AUG_16} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.clear(getInput())
    await user.tab()
    const [value, details] = onValueChange.mock.lastCall as [Date | null, { reason: string }]
    expect(value).toBeNull()
    expect(details.reason).toBe('input-clear')
    expect(getInput().value).toBe('')
  })

  it('opens the calendar from the trigger button and commits a picked day with reason item-press', async () => {
    const onValueChange = vi.fn()
    render(<DatePicker aria-label="日期" defaultValue={AUG_16} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    await waitFor(() => expect(queryCalendar()).not.toBeNull())
    await clickDay('20')
    const [value, details] = onValueChange.mock.lastCall as [Date, { reason: string }]
    expect(value.getDate()).toBe(20)
    expect(details.reason).toBe('item-press')
    // Picking a day is a completed gesture: the popup closes.
    await waitFor(() => expect(queryCalendar()).toBeNull())
    expect(getInput().value).toBe('2026-08-20')
  })

  it('opens on pressing the input and closes on Escape without touching the value', async () => {
    const onValueChange = vi.fn()
    render(<DatePicker aria-label="日期" defaultValue={AUG_16} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.click(getInput())
    await waitFor(() => expect(queryCalendar()).not.toBeNull())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(queryCalendar()).toBeNull())
    expect(onValueChange).not.toHaveBeenCalled()
    expect(getInput().value).toBe('2026-08-16')
  })

  it('clears the value from the clear button with reason clear-press', async () => {
    const onValueChange = vi.fn()
    render(<DatePicker aria-label="日期" defaultValue={AUG_16} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Clear date' }))
    const [value, details] = onValueChange.mock.lastCall as [Date | null, { reason: string }]
    expect(value).toBeNull()
    expect(details.reason).toBe('clear-press')
    expect(getInput().value).toBe('')
  })

  it('respects clearable={false}: no clear button anywhere', () => {
    render(<DatePicker aria-label="日期" clearable={false} defaultValue={AUG_16} />)
    expect(screen.queryByRole('button', { name: 'Clear date' })).toBeNull()
  })

  it('serializes into a form through an always-present hidden input', () => {
    // `null`, not `undefined`: controlled-ness is locked at first render.
    const { rerender } = render(<DatePicker aria-label="日期" name="birthday" value={null} />)
    const hidden = document.querySelector('input[name="birthday"]') as HTMLInputElement
    // Always mounted so the key never flickers in and out of FormData.
    expect(hidden).not.toBeNull()
    expect(hidden.value).toBe('')
    rerender(<DatePicker aria-label="日期" name="birthday" value={AUG_16} />)
    expect(hidden.value).toBe('2026-08-16')
  })

  it('honours cancel(): a cancelled change never reaches the state', async () => {
    render(
      <DatePicker
        aria-label="日期"
        defaultValue={AUG_16}
        onValueChange={(_value, details) => details.cancel()}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Clear date' }))
    // The clear was cancelled: the field still shows the value.
    expect(getInput().value).toBe('2026-08-16')
  })

  it('rejects typed dates that disabledDates matches', async () => {
    const onValueChange = vi.fn()
    render(
      <DatePicker
        aria-label="日期"
        disabledDates={{ after: new Date(2026, 7, 31) }}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    await user.type(getInput(), '2026-09-15')
    const reasons = onValueChange.mock.calls.map(([, details]) => (details as { reason: string }).reason)
    expect(reasons).not.toContain('input-change')
  })

  it('mirrors disabled and readOnly onto the root as data attributes and onto the input', () => {
    const { rerender } = render(<DatePicker aria-label="日期" disabled />)
    const root = document.querySelector('[data-slot="date-picker"]') as HTMLElement
    expect(root.getAttribute('data-disabled')).toBe('')
    expect(getInput().disabled).toBe(true)
    rerender(<DatePicker aria-label="日期" readOnly />)
    expect(root.getAttribute('data-readonly')).toBe('')
    expect(getInput().readOnly).toBe(true)
  })

  it('drops an unsettled draft when the value changes from outside (a form reset)', async () => {
    const { rerender } = render(<DatePicker aria-label="日期" value={AUG_16} />)
    const user = userEvent.setup()
    // Editing leaves a draft behind (no blur): the visible text is the draft.
    await user.clear(getInput())
    await user.type(getInput(), 'garbage')
    expect(getInput().value).toBe('garbage')
    // A programmatic reset must not leave ghost text over the new value.
    rerender(<DatePicker aria-label="日期" value={null} />)
    expect(getInput().value).toBe('')
  })

  it('keeps the draft across the controlled write-back its own typing produced', async () => {
    function Harness(): ReturnType<typeof DatePicker> {
      const [value, setValue] = useState<Date | null>(null)
      return <DatePicker aria-label="日期" value={value} onValueChange={setValue} />
    }
    render(<Harness />)
    const user = userEvent.setup()
    // Every parsed keystroke writes back through the controlled value; the
    // raw text must survive it, or typing gets reformatted mid-word.
    await user.type(getInput(), '2026-08-20')
    expect(getInput().value).toBe('2026-08-20')
  })

  it('wires a FieldLabel to the input through htmlFor', async () => {
    render(
      <Field>
        <FieldLabel htmlFor="birthday">生日</FieldLabel>
        <DatePicker id="birthday" />
      </Field>,
    )
    expect(screen.getByLabelText('生日')).toBe(getInput())
  })
})
