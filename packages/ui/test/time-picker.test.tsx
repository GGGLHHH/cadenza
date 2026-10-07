import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Field, FieldLabel } from '../src/components/field'
import {
  TimePicker,
  TimePickerCancel,
  TimePickerClose,
  TimePickerFooter,
  TimePickerFooterClear,
  TimePickerPopup,
} from '../src/components/time-picker'

// A date other than today's: every edit must keep it.
const AUG_16_0930 = new Date(2026, 7, 16, 9, 30)

function getInput(): HTMLInputElement {
  return screen.getByRole<HTMLInputElement>('textbox')
}

function queryColumns(): HTMLElement | null {
  return document.querySelector('[data-slot="time-columns"]')
}

async function openPopup(): Promise<void> {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Open time picker' }))
  await waitFor(() => expect(queryColumns()).not.toBeNull())
}

async function pick(columnName: string, label: string): Promise<void> {
  const user = userEvent.setup()
  const column = screen.getByRole('radiogroup', { name: columnName })
  await user.click(within(column).getByRole('radio', { name: label }))
}

describe('time-picker', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the default composition: an editable input plus a clock trigger button', () => {
    render(<TimePicker aria-label="时间" placeholder="选择时间" />)
    expect(getInput().placeholder).toBe('选择时间')
    expect(screen.getByRole('button', { name: 'Open time picker' })).not.toBeNull()
  })

  it('shows the formatted value and keeps the visible text in sync with a controlled value', () => {
    const { rerender } = render(<TimePicker aria-label="时间" value={AUG_16_0930} />)
    expect(getInput().value).toBe('09:30')
    rerender(<TimePicker aria-label="时间" value={new Date(2026, 7, 16, 14, 5)} />)
    expect(getInput().value).toBe('14:05')
  })

  it('commits a typed time as soon as it parses, keeping the value\'s date', async () => {
    const onValueChange = vi.fn()
    render(<TimePicker aria-label="时间" defaultValue={AUG_16_0930} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.clear(getInput())
    await user.type(getInput(), '14:45')
    const [value, details] = onValueChange.mock.lastCall as [Date, { reason: string }]
    expect([value.getFullYear(), value.getMonth(), value.getDate()]).toEqual([2026, 7, 16])
    expect([value.getHours(), value.getMinutes(), value.getSeconds()]).toEqual([14, 45, 0])
    expect(details.reason).toBe('input-change')
  })

  it('a typed time with no value lands on today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 5, 15, 42, 7))
    const onValueChange = vi.fn()
    render(<TimePicker aria-label="时间" onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.type(getInput(), '08:15')
    const [value] = onValueChange.mock.lastCall as [Date]
    expect([value.getMonth(), value.getDate()]).toEqual([9, 5])
    expect([value.getHours(), value.getMinutes(), value.getSeconds()]).toEqual([8, 15, 0])
  })

  it('reverts unparseable text to the last committed value when the field is left', async () => {
    render(
      <div>
        <TimePicker aria-label="时间" defaultValue={AUG_16_0930} />
        <button type="button">外部</button>
      </div>,
    )
    const user = userEvent.setup()
    await user.clear(getInput())
    await user.type(getInput(), 'later')
    await user.click(screen.getByRole('button', { name: '外部' }))
    expect(getInput().value).toBe('09:30')
    await waitFor(() => expect(queryColumns()).toBeNull())
  })

  it('clears the value when the text is emptied and the field is left, with reason input-clear', async () => {
    const onValueChange = vi.fn()
    render(<TimePicker aria-label="时间" defaultValue={AUG_16_0930} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.clear(getInput())
    await user.tab()
    const [value, details] = onValueChange.mock.lastCall as [Date | null, { reason: string }]
    expect(value).toBeNull()
    expect(details.reason).toBe('input-clear')
  })

  it('commits picks with reason item-press and keeps the popup open across them', async () => {
    const onValueChange = vi.fn()
    render(<TimePicker aria-label="时间" defaultValue={AUG_16_0930} onValueChange={onValueChange} />)
    await openPopup()
    await pick('Hours', '14')
    expect(getInput().value).toBe('14:30')
    // An hour is not a whole time: the popup stays for the minutes.
    expect(queryColumns()).not.toBeNull()
    await pick('Minutes', '05')
    const [value, details] = onValueChange.mock.lastCall as [Date, { reason: string }]
    expect([value.getDate(), value.getHours(), value.getMinutes()]).toEqual([16, 14, 5])
    expect(details.reason).toBe('item-press')
    // Not even the minutes close it — picking order is the user's.
    expect(queryColumns()).not.toBeNull()
    const user = userEvent.setup()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(queryColumns()).toBeNull())
    expect(getInput().value).toBe('14:05')
  })

  it('opens on pressing the input and closes on Enter without submitting the form', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault())
    render(
      <form onSubmit={event => onSubmit(event.nativeEvent)}>
        <TimePicker aria-label="时间" defaultValue={AUG_16_0930} />
      </form>,
    )
    const user = userEvent.setup()
    await user.click(getInput())
    await waitFor(() => expect(queryColumns()).not.toBeNull())
    await user.keyboard('{Enter}')
    await waitFor(() => expect(queryColumns()).toBeNull())
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('clears the value from the clear button with reason clear-press', async () => {
    const onValueChange = vi.fn()
    render(<TimePicker aria-label="时间" defaultValue={AUG_16_0930} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Clear time' }))
    const [value, details] = onValueChange.mock.lastCall as [Date | null, { reason: string }]
    expect(value).toBeNull()
    expect(details.reason).toBe('clear-press')
    expect(getInput().value).toBe('')
  })

  it('respects clearable={false}: no clear button anywhere', () => {
    render(<TimePicker aria-label="时间" clearable={false} defaultValue={AUG_16_0930} />)
    expect(screen.queryByRole('button', { name: 'Clear time' })).toBeNull()
  })

  it('serializes as HH:mm through an always-present hidden input, HH:mm:ss when seconds show', () => {
    const { rerender } = render(<TimePicker aria-label="时间" name="at" value={null} />)
    const hidden = document.querySelector('input[name="at"]') as HTMLInputElement
    expect(hidden.value).toBe('')
    rerender(<TimePicker aria-label="时间" name="at" value={AUG_16_0930} />)
    expect(hidden.value).toBe('09:30')
    rerender(<TimePicker aria-label="时间" format="HH:mm:ss" name="at" value={new Date(2026, 7, 16, 9, 30, 15)} />)
    expect(hidden.value).toBe('09:30:15')
  })

  it('adds the seconds column when the format shows seconds', async () => {
    render(<TimePicker aria-label="时间" defaultValue={AUG_16_0930} format="HH:mm:ss" />)
    expect(getInput().value).toBe('09:30:00')
    await openPopup()
    expect(screen.getByRole('radiogroup', { name: 'Seconds' })).not.toBeNull()
  })

  it('honours cancel(): a cancelled change never reaches the state', async () => {
    render(
      <TimePicker
        aria-label="时间"
        defaultValue={AUG_16_0930}
        onValueChange={(_value, details) => details.cancel()}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Clear time' }))
    expect(getInput().value).toBe('09:30')
  })

  it('rejects typed times the columns would not offer: outside min/max or off the minute step', async () => {
    const onValueChange = vi.fn()
    render(
      <TimePicker
        aria-label="时间"
        max={new Date(2026, 0, 1, 17, 0)}
        min={new Date(2026, 0, 1, 8, 0)}
        minuteStep={15}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    await user.type(getInput(), '07:30')
    await user.clear(getInput())
    await user.type(getInput(), '09:20')
    expect(onValueChange).not.toHaveBeenCalled()
    await user.clear(getInput())
    await user.type(getInput(), '09:45')
    const [value] = onValueChange.mock.lastCall as [Date]
    expect([value.getHours(), value.getMinutes()]).toEqual([9, 45])
  })

  it('mirrors disabled and readOnly onto the root as data attributes and onto the input', () => {
    const { rerender } = render(<TimePicker aria-label="时间" disabled />)
    const root = document.querySelector('[data-slot="time-picker"]') as HTMLElement
    expect(root.getAttribute('data-disabled')).toBe('')
    expect(getInput().disabled).toBe(true)
    rerender(<TimePicker aria-label="时间" readOnly />)
    expect(root.getAttribute('data-readonly')).toBe('')
    expect(getInput().readOnly).toBe(true)
    // Read-only drops both buttons from the default composition.
    expect(screen.queryByRole('button', { name: 'Open time picker' })).toBeNull()
  })

  it('keeps the draft across the controlled write-back its own typing produced', async () => {
    function Harness(): ReturnType<typeof TimePicker> {
      const [value, setValue] = useState<Date | null>(AUG_16_0930)
      return <TimePicker aria-label="时间" value={value} onValueChange={setValue} />
    }
    render(<Harness />)
    const user = userEvent.setup()
    await user.clear(getInput())
    // "9:3" already parses (09:03) and writes back; the raw text must survive.
    await user.type(getInput(), '9:3')
    expect(getInput().value).toBe('9:3')
  })

  it('parses through inputToValue when given, beyond the display format', async () => {
    const onValueChange = vi.fn()
    // Compact digits: "0930" → 09:30.
    const inputToValue = (text: string): Date | null => {
      const match = /^(\d{2})(\d{2})$/.exec(text.trim())
      return match === null ? null : new Date(2000, 0, 1, Number(match[1]), Number(match[2]))
    }
    render(
      <TimePicker
        aria-label="时间"
        defaultValue={AUG_16_0930}
        inputToValue={inputToValue}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    await user.clear(getInput())
    await user.type(getInput(), '1415')
    const [value] = onValueChange.mock.lastCall as [Date]
    // The custom parser's date (2000-01-01) is not taken: only its time is.
    expect([value.getFullYear(), value.getDate(), value.getHours(), value.getMinutes()]).toEqual([2026, 16, 14, 15])
    await user.keyboard('{Escape}')
    await user.tab()
    expect(getInput().value).toBe('14:15')
  })

  it('tab walks into the columns, landing on the checked hour; escape brings focus back', async () => {
    render(<TimePicker aria-label="时间" defaultValue={AUG_16_0930} />)
    const input = getInput()
    const user = userEvent.setup()
    await user.click(input)
    await waitFor(() => expect(queryColumns()).not.toBeNull())
    await user.tab()
    expect(document.activeElement?.textContent).toBe('09')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(queryColumns()).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(input))
  })

  describe('footer / confirm mode', () => {
    function renderWithFooter(props: Partial<Parameters<typeof TimePicker>[0]> = {}): ReturnType<typeof vi.fn> {
      const onValueChange = vi.fn()
      render(
        <TimePicker aria-label="时间" defaultValue={AUG_16_0930} onValueChange={onValueChange} {...props}>
          {({ defaultChildren }) => (
            <>
              {defaultChildren}
              <TimePickerPopup>
                <TimePickerFooter>
                  <TimePickerFooterClear className="me-auto" variant="ghost">清除</TimePickerFooterClear>
                  <TimePickerCancel variant="outline">取消</TimePickerCancel>
                  <TimePickerClose>确定</TimePickerClose>
                </TimePickerFooter>
              </TimePickerPopup>
            </>
          )}
        </TimePicker>,
      )
      return onValueChange
    }

    it('keeps the default columns when the popup composes only a footer', async () => {
      renderWithFooter()
      await openPopup()
      expect(queryColumns()).not.toBeNull()
      expect(screen.getByRole('button', { name: '确定' })).not.toBeNull()
    })

    it('stages picks instead of committing: the value lands only on confirm, with reason close-press', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      await pick('Hours', '14')
      await pick('Minutes', '45')
      expect(onValueChange).not.toHaveBeenCalled()
      expect(getInput().value).toBe('14:45')
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '确定' }))
      const [value, details] = onValueChange.mock.lastCall as [Date, { reason: string }]
      expect([value.getDate(), value.getHours(), value.getMinutes()]).toEqual([16, 14, 45])
      expect(details.reason).toBe('close-press')
      await waitFor(() => expect(queryColumns()).toBeNull())
    })

    it('cancel discards the staged picks and closes without a value change', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      await pick('Hours', '14')
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '取消' }))
      expect(onValueChange).not.toHaveBeenCalled()
      await waitFor(() => expect(queryColumns()).toBeNull())
      expect(getInput().value).toBe('09:30')
    })

    it('clear stages an empty value; confirm then commits null', async () => {
      const onValueChange = renderWithFooter()
      await openPopup()
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '清除' }))
      expect(onValueChange).not.toHaveBeenCalled()
      expect(getInput().value).toBe('')
      await user.click(screen.getByRole('button', { name: '确定' }))
      const [value] = onValueChange.mock.lastCall as [Date | null]
      expect(value).toBeNull()
    })
  })

  it('wires a FieldLabel to the input through htmlFor', () => {
    render(
      <Field>
        <FieldLabel htmlFor="start">开始时间</FieldLabel>
        <TimePicker id="start" />
      </Field>,
    )
    expect(screen.getByLabelText('开始时间')).toBe(getInput())
  })
})
