import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { zhCN } from 'date-fns/locale'
import { describe, expect, it, vi } from 'vitest'
import { Calendar } from '../src/components/calendar'

const AUGUST_2026 = new Date(2026, 7, 1)

/** The caption's two dropdowns, in the order the locale lays them out. */
function captions(): HTMLElement[] {
  return screen.getAllByRole('combobox')
}

describe('calendar', () => {
  it('leaves the caption a plain label by default — the dropdowns are the pickers\' choice, not the calendar\'s', () => {
    render(<Calendar mode="single" month={AUGUST_2026} />)
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  describe('caption dropdowns', () => {
    it('renders month and year as this library\'s Select, not a native one', () => {
      render(<Calendar captionLayout="dropdown" mode="single" month={AUGUST_2026} />)
      expect(captions()).toHaveLength(2)
      // The vendored calendar's own dropdown is a real <select> laid over the
      // caption; ours must not leave one behind, since a native option list
      // opens on the mousedown default action the pickers' popups cancel.
      expect(document.querySelector('select')).toBeNull()
    })

    it('walks the calendar to the chosen month', async () => {
      const onMonthChange = vi.fn()
      render(
        <Calendar
          captionLayout="dropdown"
          mode="single"
          month={AUGUST_2026}
          onMonthChange={onMonthChange}
        />,
      )
      const user = userEvent.setup()
      await user.click(screen.getByRole('combobox', { name: /month/i }))
      await user.click(await screen.findByRole('option', { name: 'Mar' }))
      // react-day-picker's own handler reads `event.target.value` off a native
      // change event — this asserts the stand-in event still carries it.
      expect(onMonthChange).toHaveBeenCalledTimes(1)
      const [month] = onMonthChange.mock.lastCall as [Date]
      expect(month.getMonth()).toBe(2)
      expect(month.getFullYear()).toBe(2026)
    })

    it('reaches a century either side of today, not just backwards', async () => {
      render(<Calendar captionLayout="dropdown" mode="single" month={AUGUST_2026} />)
      const user = userEvent.setup()
      await user.click(screen.getByRole('combobox', { name: /year/i }))
      const years = (await screen.findAllByRole('option')).map(option => option.textContent)
      // react-day-picker's own default stops at the end of this year, which
      // cannot reach next year at all — a birthday picker's range.
      const thisYear = new Date().getFullYear()
      expect(years[0]).toBe(String(thisYear - 100))
      expect(years.at(-1)).toBe(String(thisYear + 100))
    })

    it('gives way to explicit bounds', async () => {
      render(
        <Calendar
          captionLayout="dropdown"
          endMonth={new Date(2027, 11)}
          mode="single"
          month={AUGUST_2026}
          startMonth={new Date(2025, 0)}
        />,
      )
      const user = userEvent.setup()
      await user.click(screen.getByRole('combobox', { name: /year/i }))
      const years = (await screen.findAllByRole('option')).map(option => option.textContent)
      expect(years).toEqual(['2025', '2026', '2027'])
    })

    it('speaks the calendar\'s language, not the browser\'s', async () => {
      render(<Calendar captionLayout="dropdown" locale={zhCN} mode="single" month={AUGUST_2026} />)
      const user = userEvent.setup()
      await user.click(screen.getByRole('combobox', { name: /月份|month/i }))
      // The vendored formatter reads `date.toLocaleString(locale?.code, …)`,
      // which falls through to the browser's language when no locale is given
      // — leaving the caption and the weekday row in different languages.
      expect(await screen.findByRole('option', { name: '8月' })).not.toBeNull()
    })

    it('takes localised accessible names through labels, which locale does not reach', async () => {
      render(
        <Calendar
          captionLayout="dropdown"
          labels={{ labelMonthDropdown: () => '选择月份', labelYearDropdown: () => '选择年份' }}
          locale={zhCN}
          mode="single"
          month={AUGUST_2026}
        />,
      )
      // `locale` is date-fns' channel and only formats visible text; the
      // announced names come from react-day-picker's `labels`, English until
      // the caller says otherwise. The dropdown has to honour that channel or
      // a screen reader hears "Choose the Year" in an otherwise Chinese panel.
      expect(screen.getByRole('combobox', { name: '选择年份' })).not.toBeNull()
      expect(screen.getByRole('combobox', { name: '选择月份' })).not.toBeNull()
    })
  })
})
