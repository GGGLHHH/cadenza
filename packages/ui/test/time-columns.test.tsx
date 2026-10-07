import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimeColumns } from '../src/components/time-columns'

// A fixed value with a non-today date proves picks keep the date.
const AUG_16_0930 = new Date(2026, 7, 16, 9, 30)

function column(name: string): HTMLElement {
  return screen.getByRole('radiogroup', { name })
}

function option(columnName: string, label: string): HTMLElement {
  return within(column(columnName)).getByRole('radio', { name: label })
}

describe('time-columns', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders an hours and a minutes column, seconds only at second granularity', () => {
    const { rerender } = render(<TimeColumns />)
    expect(within(column('Hours')).getAllByRole('radio')).toHaveLength(24)
    expect(within(column('Minutes')).getAllByRole('radio')).toHaveLength(60)
    expect(screen.queryByRole('radiogroup', { name: 'Seconds' })).toBeNull()
    rerender(<TimeColumns granularity="second" />)
    expect(within(column('Seconds')).getAllByRole('radio')).toHaveLength(60)
  })

  it('checks the options of the value', () => {
    render(<TimeColumns value={AUG_16_0930} />)
    expect(option('Hours', '09').getAttribute('aria-checked')).toBe('true')
    expect(option('Minutes', '30').getAttribute('aria-checked')).toBe('true')
  })

  it('a pick keeps the date and the untouched units, with reason item-press', async () => {
    const onValueChange = vi.fn()
    render(<TimeColumns defaultValue={AUG_16_0930} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.click(option('Hours', '14'))
    const [value, details] = onValueChange.mock.lastCall as [Date, { reason: string }]
    expect([value.getFullYear(), value.getMonth(), value.getDate()]).toEqual([2026, 7, 16])
    expect([value.getHours(), value.getMinutes()]).toEqual([14, 30])
    expect(details.reason).toBe('item-press')
    expect(option('Hours', '14').getAttribute('aria-checked')).toBe('true')
  })

  it('with no value, a first pick builds on the start of today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 5, 15, 42, 7))
    const onValueChange = vi.fn()
    render(<TimeColumns onValueChange={onValueChange} />)
    const user = userEvent.setup()
    await user.click(option('Minutes', '45'))
    const [value] = onValueChange.mock.lastCall as [Date]
    expect(value.getDate()).toBe(5)
    expect([value.getHours(), value.getMinutes(), value.getSeconds()]).toEqual([0, 45, 0])
  })

  it('arrow keys move the selection with the focus, the radio-group way', async () => {
    const onValueChange = vi.fn()
    render(<TimeColumns defaultValue={AUG_16_0930} onValueChange={onValueChange} />)
    const user = userEvent.setup()
    // Tab lands on the checked option — the roving stop Base UI parks there.
    await user.tab()
    expect(document.activeElement).toBe(option('Hours', '09'))
    await user.keyboard('{ArrowDown}')
    const [value] = onValueChange.mock.lastCall as [Date]
    expect(value.getHours()).toBe(10)
  })

  it('offers only multiples of minuteStep', () => {
    render(<TimeColumns minuteStep={15} />)
    const labels = within(column('Minutes')).getAllByRole('radio').map(radio => radio.textContent)
    expect(labels).toEqual(['00', '15', '30', '45'])
  })

  it('disables the options outside min/max, comparing times of day only', () => {
    // The bounds' dates differ from the value's on purpose: only the time counts.
    render(
      <TimeColumns
        max={new Date(2000, 0, 1, 17, 0)}
        min={new Date(2030, 5, 9, 8, 30)}
        value={AUG_16_0930}
      />,
    )
    expect(option('Hours', '07').getAttribute('aria-disabled')).toBe('true')
    expect(option('Hours', '08').getAttribute('aria-disabled')).not.toBe('true')
    expect(option('Hours', '17').getAttribute('aria-disabled')).not.toBe('true')
    expect(option('Hours', '18').getAttribute('aria-disabled')).toBe('true')
  })

  it('a pick that would leave the bounds slides the smaller units to the first allowed option', async () => {
    const onValueChange = vi.fn()
    render(
      <TimeColumns
        defaultValue={new Date(2026, 7, 16, 9, 10)}
        min={new Date(2026, 7, 16, 8, 30)}
        onValueChange={onValueChange}
      />,
    )
    const user = userEvent.setup()
    // 08:10 is before min: the minutes slide to 08:30 rather than produce a
    // value the minutes column itself shows as disabled.
    await user.click(option('Hours', '08'))
    const [value] = onValueChange.mock.lastCall as [Date]
    expect([value.getHours(), value.getMinutes()]).toEqual([8, 30])
  })

  it('honours cancel(): a cancelled pick never reaches the state', async () => {
    render(<TimeColumns defaultValue={AUG_16_0930} onValueChange={(_value, details) => details.cancel()} />)
    const user = userEvent.setup()
    await user.click(option('Hours', '14'))
    expect(option('Hours', '09').getAttribute('aria-checked')).toBe('true')
  })

  it('takes its accessible names from labels', () => {
    render(<TimeColumns granularity="second" labels={{ hours: '时', minutes: '分', seconds: '秒' }} />)
    expect(column('时')).not.toBeNull()
    expect(column('分')).not.toBeNull()
    expect(column('秒')).not.toBeNull()
  })
})
