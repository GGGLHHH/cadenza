import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DateRangePicker } from '../src/components/date-range-picker'

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

  it('drops the end when a typed start passes it', async () => {
    const onValueChange = vi.fn()
    render(
      <DateRangePicker
        aria-label="日期范围"
        defaultValue={{ from: AUG_10, to: AUG_20 }}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    const [start] = getInputs()
    await user.clear(start)
    await user.type(start, '2026-08-25')
    const [value] = onValueChange.mock.lastCall as [{ from: Date, to?: Date }]
    expect(value.from.getDate()).toBe(25)
    // An inverted range is not silently reordered: the end clears instead.
    expect(value.to).toBeUndefined()
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

  it('emptying the start clears the range, emptying the end keeps the start', async () => {
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
    await user.clear(end)
    await user.click(outside)
    let [value] = onValueChange.mock.lastCall as [{ from: Date, to?: Date } | null]
    expect(value?.from.getDate()).toBe(10)
    expect(value?.to).toBeUndefined()
    await user.clear(start)
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

  it('mirrors disabled onto the root and both inputs', () => {
    render(<DateRangePicker aria-label="日期范围" disabled />)
    const root = document.querySelector('[data-slot="date-range-picker"]') as HTMLElement
    expect(root.getAttribute('data-disabled')).toBe('')
    const [start, end] = getInputs()
    expect(start.disabled).toBe(true)
    expect(end.disabled).toBe(true)
  })
})
