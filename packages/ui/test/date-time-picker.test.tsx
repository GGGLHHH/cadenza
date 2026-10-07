import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DateTimePicker,
  DateTimePickerCancel,
  DateTimePickerClose,
  DateTimePickerFooter,
  DateTimePickerPopup,
} from '../src/components/date-time-picker'
import { Field, FieldLabel } from '../src/components/field'

// Fixed dates keep the calendar's grid deterministic: August 2026 starts on a
// Saturday, and none of the asserted days collide with outside days.
const AUG_16_0930 = new Date(2026, 7, 16, 9, 30)

function getInput(): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>('textbox')
}

function queryCalendar(): HTMLElement | null {
  return document.querySelector('[data-slot="calendar"]')
}

async function openPopup(): Promise<void> {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Open date and time picker' }))
  await waitFor(() => expect(queryCalendar()).not.toBeNull())
}

async function clickDay(day: string): Promise<void> {
  const user = userEvent.setup()
  await user.click(within(queryCalendar() as HTMLElement).getByText(day))
}

function option(columnName: string, label: string): HTMLElement {
  return within(screen.getByRole('radiogroup', { name: columnName })).getByRole('radio', { name: label })
}

async function pick(columnName: string, label: string): Promise<void> {
  const user = userEvent.setup()
  await user.click(option(columnName, label))
}

function dayButton(day: string): HTMLButtonElement {
  return within(queryCalendar() as HTMLElement).getByText(day).closest('button') as HTMLButtonElement
}

describe('date-time-picker', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the default composition and formats the value as date and time', () => {
    const { rerender } = render(<DateTimePicker aria-label="时间" value={AUG_16_0930} />)
    expect(screen.getByRole('button', { name: 'Open date and time picker' })).not.toBeNull()
    expect(getInput().value).toBe('2026-08-16 09:30')
    rerender(<DateTimePicker aria-label="时间" value={new Date(2026, 7, 20, 18, 5)} />)
    expect(getInput().value).toBe('2026-08-20 18:05')
  })

  it('commits a typed date-time as soon as it parses, with reason input-change', async () => {
    const onValueChange = vi.fn()
    render(<DateTimePicker aria-label="时间" onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.type(getInput(), '2026-08-20 14:45')
    const [value, details] = onValueChange.mock.lastCall as [Date, { reason: string }]
    expect([value.getMonth(), value.getDate(), value.getHours(), value.getMinutes()]).toEqual([7, 20, 14, 45])
    expect(details.reason).toBe('input-change')
  })

  it('reverts unparseable text on leaving, and clears on an emptied field with reason input-clear', async () => {
    const onValueChange = vi.fn()
    render(<DateTimePicker aria-label="时间" defaultValue={AUG_16_0930} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.clear(getInput())
    await user.type(getInput(), 'soon')
    await user.keyboard('{Escape}')
    await user.tab()
    expect(getInput().value).toBe('2026-08-16 09:30')
    await user.clear(getInput())
    await user.keyboard('{Escape}')
    await user.tab()
    const [value, details] = onValueChange.mock.lastCall as [Date | null, { reason: string }]
    expect(value).toBeNull()
    expect(details.reason).toBe('input-clear')
  })

  it('a day pick keeps the time, a time pick keeps the day, and neither closes the popup', async () => {
    const onValueChange = vi.fn()
    render(<DateTimePicker aria-label="时间" defaultValue={AUG_16_0930} onValueChange={onValueChange} />)
    await openPopup()
    await clickDay('20')
    expect(getInput().value).toBe('2026-08-20 09:30')
    expect((onValueChange.mock.lastCall as [Date, { reason: string }])[1].reason).toBe('item-press')
    expect(queryCalendar()).not.toBeNull()
    await pick('Hours', '14')
    await pick('Minutes', '05')
    expect(getInput().value).toBe('2026-08-20 14:05')
    expect(queryCalendar()).not.toBeNull()
    const user = userEvent.setup()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(queryCalendar()).toBeNull())
  })

  it('with no value, a day starts at midnight and a time starts on today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 10, 15, 42, 7))
    const onValueChange = vi.fn()
    const { unmount } = render(<DateTimePicker aria-label="时间" onValueChange={onValueChange} />)
    await openPopup()
    await clickDay('20')
    const [day] = onValueChange.mock.lastCall as [Date]
    expect([day.getDate(), day.getHours(), day.getMinutes()]).toEqual([20, 0, 0])
    unmount()
    render(<DateTimePicker aria-label="时间" onValueChange={onValueChange} />)
    await openPopup()
    await pick('Hours', '08')
    const [time] = onValueChange.mock.lastCall as [Date]
    expect([time.getDate(), time.getHours(), time.getMinutes()]).toEqual([10, 8, 0])
  })

  it('serializes as yyyy-MM-ddTHH:mm through an always-present hidden input', () => {
    const { rerender } = render(<DateTimePicker aria-label="时间" name="at" value={null} />)
    const hidden = document.querySelector('input[name="at"]') as HTMLInputElement
    expect(hidden.value).toBe('')
    rerender(<DateTimePicker aria-label="时间" name="at" value={AUG_16_0930} />)
    expect(hidden.value).toBe('2026-08-16T09:30')
    rerender(<DateTimePicker aria-label="时间" format="yyyy-MM-dd HH:mm:ss" name="at" value={new Date(2026, 7, 16, 9, 30, 15)} />)
    expect(hidden.value).toBe('2026-08-16T09:30:15')
  })

  describe('min / max', () => {
    const MAX = new Date(2026, 7, 20, 14, 23, 47)

    it('disables the days past the bound and, on the boundary day, the times past it', async () => {
      render(<DateTimePicker aria-label="时间" defaultValue={new Date(2026, 7, 20, 9, 0)} max={MAX} />)
      await openPopup()
      expect(dayButton('21').disabled).toBe(true)
      expect(dayButton('20').disabled).toBe(false)
      expect(option('Hours', '14').getAttribute('aria-disabled')).not.toBe('true')
      expect(option('Hours', '15').getAttribute('aria-disabled')).toBe('true')
    })

    it('leaves the times free on any other day', async () => {
      render(<DateTimePicker aria-label="时间" defaultValue={AUG_16_0930} max={MAX} />)
      await openPopup()
      expect(option('Hours', '23').getAttribute('aria-disabled')).not.toBe('true')
    })

    it('a day pick that would cross the bound lands on it instead', async () => {
      const onValueChange = vi.fn()
      render(<DateTimePicker aria-label="时间" defaultValue={new Date(2026, 7, 16, 20, 0)} max={MAX} onValueChange={onValueChange} />)
      await openPopup()
      await clickDay('20')
      const [value] = onValueChange.mock.lastCall as [Date]
      // 20:00 on the 20th is past max: it lands on 14:23 — max, floored onto
      // the minute grid the columns offer.
      expect([value.getDate(), value.getHours(), value.getMinutes(), value.getSeconds()]).toEqual([20, 14, 23, 0])
    })

    it('rejects typed values outside the bounds, on disabled days, or off the minute step', async () => {
      const onValueChange = vi.fn()
      render(
        <DateTimePicker
          aria-label="时间"
          disabledDates={{ dayOfWeek: [0] }}
          max={MAX}
          minuteStep={15}
          onValueChange={onValueChange}
        />,
      )
      const user = userEvent.setup()
      for (const text of ['2026-08-20 15:00', '2026-08-16 09:00', '2026-08-18 09:10']) {
        await user.clear(getInput())
        await user.type(getInput(), text)
      }
      // Past max; a Sunday; off the 15-minute step.
      expect(onValueChange).not.toHaveBeenCalled()
      await user.clear(getInput())
      await user.type(getInput(), '2026-08-18 09:15')
      const [value] = onValueChange.mock.lastCall as [Date]
      expect([value.getDate(), value.getHours(), value.getMinutes()]).toEqual([18, 9, 15])
    })
  })

  it('stages picks in confirm mode and commits them only on close, with reason close-press', async () => {
    const onValueChange = vi.fn()
    render(
      <DateTimePicker aria-label="时间" defaultValue={AUG_16_0930} onValueChange={onValueChange}>
        {({ defaultChildren }) => (
          <>
            {defaultChildren}
            <DateTimePickerPopup>
              <DateTimePickerFooter>
                <DateTimePickerCancel variant="outline">取消</DateTimePickerCancel>
                <DateTimePickerClose>确定</DateTimePickerClose>
              </DateTimePickerFooter>
            </DateTimePickerPopup>
          </>
        )}
      </DateTimePicker>,
    )
    await openPopup()
    await clickDay('20')
    await pick('Hours', '18')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(getInput().value).toBe('2026-08-20 18:30')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '确定' }))
    const [value, details] = onValueChange.mock.lastCall as [Date, { reason: string }]
    expect([value.getDate(), value.getHours(), value.getMinutes()]).toEqual([20, 18, 30])
    expect(details.reason).toBe('close-press')
    await waitFor(() => expect(queryCalendar()).toBeNull())
  })

  it('honours cancel(): a cancelled change never reaches the state', async () => {
    render(
      <DateTimePicker
        aria-label="时间"
        defaultValue={AUG_16_0930}
        onValueChange={(_value, details) => details.cancel()}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Clear date and time' }))
    expect(getInput().value).toBe('2026-08-16 09:30')
  })

  it('wires a FieldLabel to the input through htmlFor', () => {
    render(
      <Field>
        <FieldLabel htmlFor="visit">就诊时间</FieldLabel>
        <DateTimePicker id="visit" />
      </Field>,
    )
    expect(screen.getByLabelText('就诊时间')).toBe(getInput())
  })
})
