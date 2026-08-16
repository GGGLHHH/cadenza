import type { ComponentProps } from 'react'
import { Calendar, CalendarDayButton } from '#primitives/calendar'

/**
 * The vendored calendar, published as-is — DOM, wiring and types are all
 * right, so this is a plain re-export (the `Spinner` treatment). It is
 * `react-day-picker`'s `DayPicker` under shadcn's styling: selection mode,
 * matchers, locale and layout all pass straight through.
 *
 * `className` lands on `DayPicker`, a plain component that takes a string —
 * honestly typed as such, no function-of-state form.
 */
export type CalendarProps = ComponentProps<typeof Calendar>
export type CalendarDayButtonProps = ComponentProps<typeof CalendarDayButton>

export { Calendar, CalendarDayButton }
