import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  DatePicker,
  DatePickerCancel,
  DatePickerClose,
  DatePickerFooter,
  DatePickerFooterClear,
  DatePickerPopup,
} from '../src/components/date-picker'
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

  it('a close from focus leaving the field does not pull focus back to the input', async () => {
    render(<DatePicker aria-label="日期" />)
    const input = getInput()
    const user = userEvent.setup()
    await user.click(input)
    await waitFor(() => expect(queryCalendar()).not.toBeNull())
    // Pressing empty space blurs the input first, which is the field's own
    // `focus-out` close. Focus has already left; returning it a beat later is
    // what makes the ring and caret blink off and back on.
    input.blur()
    await waitFor(() => expect(queryCalendar()).toBeNull())
    // The focus manager's return attempt runs in a microtask after unmount.
    await new Promise((resolve) => {
      setTimeout(resolve, 20)
    })
    expect(document.activeElement).not.toBe(input)
  })

  it('a close that leaves focus in place still returns it — escape from inside the calendar', async () => {
    render(<DatePicker aria-label="日期" />)
    const input = getInput()
    const user = userEvent.setup()
    await user.click(input)
    await waitFor(() => expect(queryCalendar()).not.toBeNull())
    // Tab moves focus into the calendar for real (it navigates by focus, not
    // by aria-activedescendant), so escape has somewhere to return from.
    await user.tab()
    expect(queryCalendar()?.contains(document.activeElement)).toBe(true)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(queryCalendar()).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(input))
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

  it('keys data-empty off what the input shows: a half-typed draft already fills the field', async () => {
    render(<DatePicker aria-label="日期" />)
    const root = document.querySelector('[data-slot="date-picker"]') as HTMLElement
    expect(root.getAttribute('data-empty')).toBe('')
    const user = userEvent.setup()
    // Not a parseable date yet — but the input visibly holds text, so the
    // clear affordance must already be there (Base UI's FieldControl reading:
    // filled follows the DOM input's text, not the committed value).
    await user.type(getInput(), '2026-')
    expect(root.getAttribute('data-empty')).toBeNull()
    await user.clear(getInput())
    expect(root.getAttribute('data-empty')).toBe('')
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

  it('parses through inputToValue when given, beyond the display format', async () => {
    const onValueChange = vi.fn()
    // A lenient parser: slashes or dashes, one-digit parts allowed.
    const inputToValue = (text: string): Date | null => {
      const match = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text.trim())
      return match === null ? null : new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    }
    render(<DatePicker aria-label="日期" inputToValue={inputToValue} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.type(getInput(), '2026/8/1')
    const [value] = onValueChange.mock.lastCall as [Date]
    expect(value.getMonth()).toBe(7)
    expect(value.getDate()).toBe(1)
    // The committed value still displays through `format`, once settled —
    // Escape first: with the popup open, Tab walks into the calendar.
    await user.keyboard('{Escape}')
    await user.tab()
    expect(getInput().value).toBe('2026-08-01')
  })

  it('keeps a draft alive across write-backs under a custom parser too', async () => {
    function Harness(): ReturnType<typeof DatePicker> {
      const [value, setValue] = useState<Date | null>(null)
      return (
        <DatePicker
          aria-label="日期"
          inputToValue={text => (/^\d{8}$/.test(text) ? new Date(Number(text.slice(0, 4)), Number(text.slice(4, 6)) - 1, Number(text.slice(6))) : null)}
          value={value}
          onValueChange={setValue}
        />
      )
    }
    render(<Harness />)
    const user = userEvent.setup()
    // The draft-vs-value comparison must judge by the same custom parser —
    // a token-format judge would drop this draft and reformat mid-typing.
    await user.type(getInput(), '20260801')
    expect(getInput().value).toBe('20260801')
  })

  describe('footer / confirm mode', () => {
    function renderWithFooter(props: Partial<Parameters<typeof DatePicker>[0]> = {}): ReturnType<typeof vi.fn> {
      const onValueChange = vi.fn()
      render(
        <DatePicker aria-label="日期" defaultValue={AUG_16} onValueChange={onValueChange} {...props}>
          {({ defaultChildren }) => (
            <>
              {defaultChildren}
              <DatePickerPopup>
                <DatePickerFooter>
                  <DatePickerFooterClear className="me-auto" variant="ghost">清除</DatePickerFooterClear>
                  <DatePickerCancel variant="outline">取消</DatePickerCancel>
                  <DatePickerClose>确定</DatePickerClose>
                </DatePickerFooter>
              </DatePickerPopup>
            </>
          )}
        </DatePicker>,
      )
      return onValueChange
    }

    async function openPopup(): Promise<void> {
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Open calendar' }))
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
    }

    it('renders the composed action parts with the caller\'s wording', async () => {
      renderWithFooter()
      await openPopup()
      expect(screen.getByRole('button', { name: '清除' })).not.toBeNull()
      expect(screen.getByRole('button', { name: '取消' })).not.toBeNull()
      expect(screen.getByRole('button', { name: '确定' })).not.toBeNull()
    })

    it('keeps the default calendar when the popup composes only a footer', async () => {
      renderWithFooter()
      await openPopup()
      // Plain children append below the calendar rather than replacing it.
      expect(queryCalendar()).not.toBeNull()
    })

    it('stages a pick instead of committing: value lands only on confirm, with reason close-press', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      await clickDay('20')
      // Staged, not committed — and the popup stays up.
      expect(onValueChange).not.toHaveBeenCalled()
      expect(queryCalendar()).not.toBeNull()
      // The input previews the staged date.
      expect(getInput().value).toBe('2026-08-20')
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '确定' }))
      const [value, details] = onValueChange.mock.lastCall as [Date, { reason: string }]
      expect(value.getDate()).toBe(20)
      expect(details.reason).toBe('close-press')
      await waitFor(() => expect(queryCalendar()).toBeNull())
    })

    it('popup clicks never take focus away from the input — no blur/refocus flicker', async () => {
      renderWithFooter()
      const input = getInput()
      let blurs = 0
      input.addEventListener('blur', () => {
        blurs += 1
      })
      const user = userEvent.setup()
      await user.click(input)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      // Picking a day and confirming are popup clicks: mousedown is
      // prevented (the antd treatment), so the input keeps focus throughout.
      await clickDay('20')
      expect(document.activeElement).toBe(input)
      await user.click(screen.getByRole('button', { name: '确定' }))
      await waitFor(() => expect(queryCalendar()).toBeNull())
      expect(document.activeElement).toBe(input)
      expect(blurs).toBe(0)
    })

    it('returns focus to where the popup was opened from, caret settled to the end', async () => {
      renderWithFooter()
      const input = getInput()
      const user = userEvent.setup()
      // Opened from the input: Base UI's guarded default returns focus there.
      await user.click(input)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await clickDay('20')
      await user.click(screen.getByRole('button', { name: '确定' }))
      await waitFor(() => expect(queryCalendar()).toBeNull())
      await waitFor(() => expect(document.activeElement).toBe(input))
      // A rewritten controlled value parks the caret at 0; once the guarded
      // return focus lands here, the root settles it to the end.
      await waitFor(() => expect(input.selectionStart).toBe(input.value.length))
      expect(input.value).toBe('2026-08-20')
    })

    it('cancel discards the staged pick and closes without a value change', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      await clickDay('20')
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '取消' }))
      expect(onValueChange).not.toHaveBeenCalled()
      await waitFor(() => expect(queryCalendar()).toBeNull())
      expect(getInput().value).toBe('2026-08-16')
    })

    it('escape acts as cancel: the staged pick is dropped', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      await clickDay('20')
      const user = userEvent.setup()
      await user.click(getInput())
      await user.keyboard('{Escape}')
      await waitFor(() => expect(queryCalendar()).toBeNull())
      expect(onValueChange).not.toHaveBeenCalled()
      expect(getInput().value).toBe('2026-08-16')
    })

    it('a staged pick already fills the field: data-empty clears on the pick, not at confirm', async () => {
      renderWithFooter({ defaultValue: undefined })
      const root = document.querySelector('[data-slot="date-picker"]') as HTMLElement
      expect(root.getAttribute('data-empty')).toBe('')
      await openPopup()
      await clickDay('20')
      // The input is already previewing the staged date; keeping the clear
      // button hidden until confirm makes it pop in the instant the popup
      // closes — the flicker this guards against.
      expect(root.getAttribute('data-empty')).toBeNull()
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '确定' }))
      expect(root.getAttribute('data-empty')).toBeNull()
    })

    it('a dismissed stage restores data-empty along with the dropped preview', async () => {
      renderWithFooter({ defaultValue: undefined })
      const root = document.querySelector('[data-slot="date-picker"]') as HTMLElement
      await openPopup()
      await clickDay('20')
      expect(root.getAttribute('data-empty')).toBeNull()
      const user = userEvent.setup()
      await user.click(getInput())
      await user.keyboard('{Escape}')
      await waitFor(() => expect(queryCalendar()).toBeNull())
      expect(root.getAttribute('data-empty')).toBe('')
    })

    it('the input-side clear button wipes a staged pick: confirm then has nothing to commit', async () => {
      const onValueChange = renderWithFooter({ defaultValue: undefined })
      await openPopup()
      await clickDay('20')
      expect(getInput().value).toBe('2026-08-20')
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Clear date' }))
      expect(getInput().value).toBe('')
      // Confirming must not resurrect the cleared pick.
      await user.click(screen.getByRole('button', { name: '确定' }))
      const reasons = onValueChange.mock.calls.map(([, details]) => (details as { reason: string }).reason)
      expect(reasons).not.toContain('close-press')
      expect(getInput().value).toBe('')
    })

    it('clear stages an empty value; confirm then commits null', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '清除' }))
      // Staged only: nothing committed yet, the input previews empty.
      expect(onValueChange).not.toHaveBeenCalled()
      expect(getInput().value).toBe('')
      await user.click(screen.getByRole('button', { name: '确定' }))
      const [value] = onValueChange.mock.lastCall as [Date | null]
      expect(value).toBeNull()
    })
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
