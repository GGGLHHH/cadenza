import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  DateRangePicker,
  DateRangePickerCancel,
  DateRangePickerClose,
  DateRangePickerFooter,
  DateRangePickerPopup,
} from '../src/components/date-range-picker'

const AUG_10 = new Date(2026, 7, 10)
const AUG_20 = new Date(2026, 7, 20)

function getInputs(): [HTMLInputElement, HTMLInputElement] {
  const inputs = screen.getAllByRole<HTMLInputElement>('textbox')
  expect(inputs).toHaveLength(2)
  return [inputs[0], inputs[1]]
}

function queryCalendar(): HTMLElement | null {
  return document.querySelector('[data-slot="calendar"]')
}

async function clickDay(day: string): Promise<void> {
  const calendar = queryCalendar()
  expect(calendar).not.toBeNull()
  const user = userEvent.setup()
  // Two months are up; pick the day in the first (August) grid.
  const grid = within(calendar as HTMLElement).getAllByRole('grid')[0]
  await user.click(within(grid).getByText(day))
}

describe('date-range-picker', () => {
  it('renders two inputs and shows a formatted range', () => {
    render(<DateRangePicker aria-label="日期范围" value={{ from: AUG_10, to: AUG_20 }} />)
    const [start, end] = getInputs()
    expect(start.value).toBe('2026-08-10')
    expect(end.value).toBe('2026-08-20')
  })

  it('commits a typed start date with reason input-change', async () => {
    const onValueChange = vi.fn()
    render(<DateRangePicker aria-label="日期范围" onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.type(getInputs()[0], '2026-08-10')
    const [value, details] = onValueChange.mock.lastCall as [{ from: Date, to?: Date }, { reason: string }]
    expect(value.from.getDate()).toBe(10)
    expect(value.to).toBeUndefined()
    expect(details.reason).toBe('input-change')
  })

  it('completes the range from the end input', async () => {
    const onValueChange = vi.fn()
    render(
      <DateRangePicker
        aria-label="日期范围"
        defaultValue={{ from: AUG_10 }}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    await user.type(getInputs()[1], '2026-08-20')
    const [value] = onValueChange.mock.lastCall as [{ from: Date, to?: Date }]
    expect(value.from.getDate()).toBe(10)
    expect(value.to?.getDate()).toBe(20)
  })

  it('sorts a typed end that undercuts the start, as soon as the text is a whole date', async () => {
    const onValueChange = vi.fn()
    render(
      <DateRangePicker
        aria-label="日期范围"
        defaultValue={{ from: AUG_20 }}
        onValueChange={onValueChange}
      />,
    )
    const [start, end] = getInputs()
    const user = userEvent.setup()
    await user.type(end, '2026-08-10')
    // No need to leave the field: the last keystroke makes it a whole date,
    // and two days sort into a range exactly as two presses would.
    const [value] = onValueChange.mock.lastCall as [{ from?: Date, to?: Date }]
    expect(value.from?.getDate()).toBe(10)
    expect(value.to?.getDate()).toBe(20)
    expect(start.value).toBe('2026-08-10')
  })

  it('holds back halfway text that would move the other end', async () => {
    const onValueChange = vi.fn()
    render(
      <DateRangePicker
        aria-label="日期范围"
        defaultValue={{ from: AUG_20 }}
        onValueChange={onValueChange}
      />,
    )
    const [start, end] = getInputs()
    const user = userEvent.setup()
    // "2026-08-1" parses as the 1st, which would sort ahead of the start —
    // but it is a date still being typed, so the start must not move.
    await user.type(end, '2026-08-1')
    expect(start.value).toBe('2026-08-20')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('swaps rather than clearing when a typed start passes the end', async () => {
    const onValueChange = vi.fn()
    render(
      <DateRangePicker
        aria-label="日期范围"
        defaultValue={{ from: AUG_10, to: AUG_20 }}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    const [start, end] = getInputs()
    await user.clear(start)
    await user.type(start, '2026-08-25')
    // Same rule as a press, on the keystroke that completes the date: the
    // two days swap roles, neither is thrown away.
    const [value] = onValueChange.mock.lastCall as [{ from?: Date, to?: Date }]
    expect(value.from?.getDate()).toBe(20)
    expect(value.to?.getDate()).toBe(25)
    expect(end.value).toBe('2026-08-25')
  })

  it('picks a full range in the calendar and closes only once it is complete', async () => {
    const onValueChange = vi.fn()
    render(<DateRangePicker aria-label="日期范围" onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Open calendar' }))
    await waitFor(() => expect(queryCalendar()).not.toBeNull())
    await clickDay('10')
    // Half a range keeps the popup up — the gesture is not finished.
    expect(queryCalendar()).not.toBeNull()
    await clickDay('20')
    await waitFor(() => expect(queryCalendar()).toBeNull())
    const [value, details] = onValueChange.mock.lastCall as [{ from: Date, to?: Date }, { reason: string }]
    expect(value.from.getDate()).toBe(10)
    expect(value.to?.getDate()).toBe(20)
    expect(details.reason).toBe('item-press')
    const [start, end] = getInputs()
    expect(start.value).toBe('2026-08-10')
    expect(end.value).toBe('2026-08-20')
  })

  describe('active end — the pressed input decides which end the calendar fills', () => {
    it('opening from the end input fills the end first, leaving the start empty', async () => {
      const onValueChange = vi.fn()
      render(<DateRangePicker aria-label="日期范围" onValueChange={onValueChange} />)
      const [start, end] = getInputs()
      const user = userEvent.setup()
      await user.click(end)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await clickDay('20')
      expect(end.value).toBe('2026-08-20')
      expect(start.value).toBe('')
      const [value] = onValueChange.mock.lastCall as [{ from?: Date, to?: Date }]
      expect(value.from).toBeUndefined()
      expect(value.to?.getDate()).toBe(20)
      // Half a range, so the popup stays up for the other end.
      expect(queryCalendar()).not.toBeNull()
    })

    it('hops the active end after a pick, so the next press completes the range', async () => {
      const onValueChange = vi.fn()
      render(<DateRangePicker aria-label="日期范围" onValueChange={onValueChange} />)
      const [start, end] = getInputs()
      const user = userEvent.setup()
      await user.click(end)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await clickDay('20')
      // The end is filled, so the active end hopped to the start.
      await clickDay('10')
      expect(start.value).toBe('2026-08-10')
      expect(end.value).toBe('2026-08-20')
      const [value] = onValueChange.mock.lastCall as [{ from?: Date, to?: Date }]
      expect(value.from?.getDate()).toBe(10)
      expect(value.to?.getDate()).toBe(20)
    })

    it('pressing the start input re-aims the calendar at the start', async () => {
      render(
        <DateRangePicker aria-label="日期范围" defaultValue={{ from: AUG_10, to: AUG_20 }} />,
      )
      const [start, end] = getInputs()
      const user = userEvent.setup()
      await user.click(start)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await clickDay('15')
      expect(start.value).toBe('2026-08-15')
      expect(end.value).toBe('2026-08-20')
    })

    it('moves focus to the other end after filling one, so two presses need no reaching', async () => {
      render(<DateRangePicker aria-label="日期范围" />)
      const [start, end] = getInputs()
      const user = userEvent.setup()
      await user.click(start)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await clickDay('10')
      await waitFor(() => expect(document.activeElement).toBe(end))
    })

    it('leaves the caret in the input the completing pick landed in', async () => {
      render(<DateRangePicker aria-label="日期范围" />)
      const [start, end] = getInputs()
      const user = userEvent.setup()
      await user.click(start)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      // Half a range: focus goes to the end still waiting to be filled.
      await clickDay('10')
      await waitFor(() => expect(document.activeElement).toBe(end))
      // Completing it: nothing is left to fill, so the caret stays where the
      // pick landed rather than hopping away from the user's last move.
      await clickDay('20')
      await waitFor(() => expect(queryCalendar()).toBeNull())
      await waitFor(() => expect(document.activeElement).toBe(end))
    })

    it('follows the pick into the other input when sorting moves it there', async () => {
      render(<DateRangePicker aria-label="日期范围" />)
      const [start, end] = getInputs()
      const user = userEvent.setup()
      await user.click(start)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await clickDay('20')
      await waitFor(() => expect(document.activeElement).toBe(end))
      // Aimed at the end, but the earlier day sorts into the start — the
      // caret follows the day, not the end that was aimed at.
      await clickDay('10')
      await waitFor(() => expect(queryCalendar()).toBeNull())
      await waitFor(() => expect(document.activeElement).toBe(start))
    })

    it('sorts two picks into a range instead of letting the second wipe the first', async () => {
      const onValueChange = vi.fn()
      render(<DateRangePicker aria-label="日期范围" onValueChange={onValueChange} />)
      const [start, end] = getInputs()
      const user = userEvent.setup()
      await user.click(end)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await clickDay('20')
      expect(end.value).toBe('2026-08-20')
      // Focus hopped to the start, and the day pressed there falls earlier.
      // Half a range means the user is still assembling one, so two days are
      // two days — they sort into a range rather than one deleting the other.
      await clickDay('10')
      expect(start.value).toBe('2026-08-10')
      expect(end.value).toBe('2026-08-20')
    })

    it('the same two presses in the other order land the same range', async () => {
      render(<DateRangePicker aria-label="日期范围" />)
      const [start, end] = getInputs()
      const user = userEvent.setup()
      await user.click(start)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await clickDay('20')
      expect(start.value).toBe('2026-08-20')
      await clickDay('10')
      expect([start.value, end.value]).toEqual(['2026-08-10', '2026-08-20'])
    })

    it('swaps rather than clearing when a press inverts a complete range', async () => {
      render(
        <DateRangePicker aria-label="日期范围" defaultValue={{ from: AUG_10, to: AUG_20 }} />,
      )
      const [start, end] = getInputs()
      const user = userEvent.setup()
      await user.click(start)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      // Pressing a day past the end in the start input: the two days swap
      // roles rather than one being thrown away. Clearing would cost the
      // user a date they never asked to lose.
      await clickDay('25')
      expect(start.value).toBe('2026-08-20')
      expect(end.value).toBe('2026-08-25')
    })

    it('serializes an end-only range with an empty start input', () => {
      render(<DateRangePicker aria-label="日期范围" name="stay" value={{ to: AUG_20 }} />)
      const hidden = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="stay"]'))
      expect(hidden.map(input => input.value)).toEqual(['', '2026-08-20'])
    })
  })

  it('clears the whole range from the clear button', async () => {
    const onValueChange = vi.fn()
    render(
      <DateRangePicker
        aria-label="日期范围"
        defaultValue={{ from: AUG_10, to: AUG_20 }}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Clear dates' }))
    const [value, details] = onValueChange.mock.lastCall as [null, { reason: string }]
    expect(value).toBeNull()
    expect(details.reason).toBe('clear-press')
    const [start, end] = getInputs()
    expect(start.value).toBe('')
    expect(end.value).toBe('')
  })

  it('emptying either input clears only that end, and the range once both are gone', async () => {
    const onValueChange = vi.fn()
    render(
      <div>
        <DateRangePicker
          aria-label="日期范围"
          defaultValue={{ from: AUG_10, to: AUG_20 }}
          onValueChange={onValueChange}
        />
        <button type="button">外部</button>
      </div>,
    )
    const user = userEvent.setup()
    const outside = screen.getByRole('button', { name: '外部' })
    const [start, end] = getInputs()
    await user.clear(start)
    await user.click(outside)
    // The start is not an anchor the rest hangs off — the end stands alone.
    let [value] = onValueChange.mock.lastCall as [{ from?: Date, to?: Date } | null]
    expect(value?.from).toBeUndefined()
    expect(value?.to?.getDate()).toBe(20)
    await user.clear(end)
    await user.click(outside)
    ;[value] = onValueChange.mock.lastCall as [null]
    expect(value).toBeNull()
  })

  it('drops unsettled drafts when the value changes from outside (a form reset)', async () => {
    const { rerender } = render(
      <DateRangePicker aria-label="日期范围" value={{ from: AUG_10, to: AUG_20 }} />,
    )
    const user = userEvent.setup()
    const [start] = getInputs()
    await user.clear(start)
    await user.type(start, 'garbage')
    expect(start.value).toBe('garbage')
    // A programmatic reset must not leave ghost text over the new value.
    rerender(<DateRangePicker aria-label="日期范围" value={null} />)
    expect(getInputs()[0].value).toBe('')
  })

  it('parses both ends through inputToValue when given', async () => {
    const onValueChange = vi.fn()
    const inputToValue = (text: string): Date | null => {
      const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(text.trim())
      return match === null ? null : new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    }
    render(
      <DateRangePicker
        aria-label="日期范围"
        defaultValue={{ from: AUG_10 }}
        inputToValue={inputToValue}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    await user.type(getInputs()[1], '2026/8/20')
    const [value] = onValueChange.mock.lastCall as [{ from: Date, to?: Date }]
    expect(value.to?.getDate()).toBe(20)
  })

  it('serializes both ends through always-present hidden inputs', () => {
    render(<DateRangePicker aria-label="日期范围" name="stay" value={{ from: AUG_10, to: AUG_20 }} />)
    const hidden = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="stay"]'))
    expect(hidden.map(input => input.value)).toEqual(['2026-08-10', '2026-08-20'])
  })

  describe('caption dropdowns', () => {
    it('the panel stays open while the year list is used mid-range', async () => {
      const onValueChange = vi.fn()
      render(<DateRangePicker aria-label="日期范围" onValueChange={onValueChange} />)
      const user = userEvent.setup()
      await user.click(getInputs()[0])
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      // Picking a day hands the caret to the end still waiting, so an input
      // holds focus for exactly the stretch where jumping months is the point
      // — half a range is picked and the other end is elsewhere in the year.
      // The list is portalled out of both the field's box and its popup, and
      // opening it moves focus onto the selected option; read as a plain blur
      // that closes the panel the press was aimed at.
      await clickDay('10')
      await user.click(screen.getAllByRole('combobox', { name: /year/i })[0])
      await user.click(await screen.findByRole('option', { name: '2030' }))
      expect(queryCalendar()).not.toBeNull()
      // Navigating is not choosing: the half-range is untouched.
      expect(getInputs()[0].value).toBe('2026-08-10')
      expect(onValueChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('footer / confirm mode', () => {
    function renderWithFooter(): ReturnType<typeof vi.fn> {
      const onValueChange = vi.fn()
      render(
        <DateRangePicker aria-label="日期范围" onValueChange={onValueChange}>
          {({ defaultChildren }) => (
            <>
              {defaultChildren}
              <DateRangePickerPopup>
                <DateRangePickerFooter>
                  <DateRangePickerCancel variant="outline">取消</DateRangePickerCancel>
                  <DateRangePickerClose>确定</DateRangePickerClose>
                </DateRangePickerFooter>
              </DateRangePickerPopup>
            </>
          )}
        </DateRangePicker>,
      )
      return onValueChange
    }

    async function openPopup(): Promise<void> {
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Open calendar' }))
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
    }

    it('stages a full range and commits it only on confirm, with reason close-press', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      await clickDay('10')
      await clickDay('20')
      // Both picks staged: nothing committed, the popup stays up.
      expect(onValueChange).not.toHaveBeenCalled()
      expect(queryCalendar()).not.toBeNull()
      const [start, end] = getInputs()
      expect(start.value).toBe('2026-08-10')
      expect(end.value).toBe('2026-08-20')
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '确定' }))
      const [value, details] = onValueChange.mock.lastCall as [{ from: Date, to?: Date }, { reason: string }]
      expect(value.from.getDate()).toBe(10)
      expect(value.to?.getDate()).toBe(20)
      expect(details.reason).toBe('close-press')
      await waitFor(() => expect(queryCalendar()).toBeNull())
    })

    it('a staged first pick already fills the field: data-empty clears on the pick, not at confirm', async () => {
      renderWithFooter()
      const root = document.querySelector('[data-slot="date-range-picker"]') as HTMLElement
      expect(root.getAttribute('data-empty')).toBe('')
      await openPopup()
      await clickDay('10')
      // Half a range staged: the start input is previewing text, so the clear
      // affordance must not wait for confirm to pop in.
      expect(root.getAttribute('data-empty')).toBeNull()
      await clickDay('20')
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '确定' }))
      expect(root.getAttribute('data-empty')).toBeNull()
    })

    it('the input-side clear button wipes a staged range: confirm then has nothing to commit', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      await clickDay('10')
      const [start] = getInputs()
      expect(start.value).toBe('2026-08-10')
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Clear dates' }))
      expect(start.value).toBe('')
      const root = document.querySelector('[data-slot="date-range-picker"]') as HTMLElement
      expect(root.getAttribute('data-empty')).toBe('')
      // Confirming must not resurrect the cleared pick.
      await user.click(screen.getByRole('button', { name: '确定' }))
      const reasons = onValueChange.mock.calls.map(([, details]) => (details as { reason: string }).reason)
      expect(reasons).not.toContain('close-press')
    })

    it('does not steal focus on a non-submitting close — open from the start input, Escape, stay there', async () => {
      renderWithFooter()
      const [start, end] = getInputs()
      const user = userEvent.setup()
      // Open from the start input; focus never enters the popup.
      await user.click(start)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await user.keyboard('{Escape}')
      await waitFor(() => expect(queryCalendar()).toBeNull())
      // Base UI's guarded default applies: nothing dragged the focus to the
      // end input.
      expect(document.activeElement).toBe(start)
      expect(document.activeElement).not.toBe(end)
    })

    it('returns focus to where the popup was opened from, caret settled to the end', async () => {
      renderWithFooter()
      const [, end] = getInputs()
      const user = userEvent.setup()
      // Opened from the end input: Base UI's guarded default returns focus
      // there — the popup never chooses a different element.
      await user.click(end)
      await waitFor(() => expect(queryCalendar()).not.toBeNull())
      await clickDay('10')
      await clickDay('20')
      await user.click(screen.getByRole('button', { name: '确定' }))
      await waitFor(() => expect(queryCalendar()).toBeNull())
      await waitFor(() => expect(document.activeElement).toBe(end))
      // A rewritten controlled value parks the caret at 0; once the guarded
      // return focus lands here, the root settles it to the end.
      await waitFor(() => expect(end.selectionStart).toBe(end.value.length))
    })

    it('cancel drops the staged range and closes without a value change', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      await clickDay('10')
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '取消' }))
      expect(onValueChange).not.toHaveBeenCalled()
      await waitFor(() => expect(queryCalendar()).toBeNull())
      expect(getInputs()[0].value).toBe('')
    })
  })

  it('a close from focus leaving the field does not pull focus back to the input', async () => {
    render(<DateRangePicker aria-label="日期范围" />)
    const [start] = getInputs()
    const user = userEvent.setup()
    await user.click(start)
    await waitFor(() => expect(queryCalendar()).not.toBeNull())
    // Pressing empty space blurs the input first, which is the field's own
    // `focus-out` close. Focus has already left; returning it a beat later is
    // what makes the ring and caret blink off and back on.
    start.blur()
    await waitFor(() => expect(queryCalendar()).toBeNull())
    await new Promise((resolve) => {
      setTimeout(resolve, 20)
    })
    expect(document.activeElement).not.toBe(start)
  })

  it('mirrors disabled onto the root and both inputs', () => {
    render(<DateRangePicker aria-label="日期范围" disabled />)
    const root = document.querySelector('[data-slot="date-range-picker"]') as HTMLElement
    expect(root.getAttribute('data-disabled')).toBe('')
    const [start, end] = getInputs()
    expect(start.disabled).toBe(true)
    expect(end.disabled).toBe(true)
  })
})
