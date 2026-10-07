import { startOfMinute, startOfSecond } from 'date-fns'

/**
 * The smallest unit a time field edits. The seconds column exists only at
 * `'second'`; at `'minute'` seconds are always zero.
 */
export type TimeGranularity = 'minute' | 'second'

/**
 * Reads the granularity off a date-fns format: a seconds token (`s`) outside
 * quoted literals means the field shows seconds, so they must be pickable too.
 * Localized tokens (`p`, `pp`) are not decoded — spell the format out.
 */
export function granularityOf(format: string): TimeGranularity {
  return /s/.test(format.replace(/'[^']*'/g, '')) ? 'second' : 'minute'
}

/**
 * Drops the units the field cannot show — the time pickers' counterpart of
 * DatePicker's start-of-day normalisation, and for the same reason: two values
 * that display alike must compare alike.
 */
export function truncateTime(date: Date, granularity: TimeGranularity): Date {
  return granularity === 'second' ? startOfSecond(date) : startOfMinute(date)
}

/** How time hidden inputs serialise — `<input type="time">`'s own wire format. */
export function timeSerialFormat(granularity: TimeGranularity): string {
  return granularity === 'second' ? 'HH:mm:ss' : 'HH:mm'
}

/** Seconds since midnight: compares times of day regardless of the date. */
export function secondsOfDay(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
}

/**
 * Whether a time of day is one the field can produce: inside the bounds'
 * times of day (dates ignored) and on the minute step. Typed values answer to
 * the same judge as the columns — what cannot be picked cannot be typed.
 */
export function isTimeAllowed(date: Date, { max, min, minuteStep = 1 }: TimeConstraints): boolean {
  const seconds = secondsOfDay(date)
  return (min === undefined || seconds >= secondsOfDay(min))
    && (max === undefined || seconds <= secondsOfDay(max))
    && date.getMinutes() % minuteStep === 0
}

export interface TimeConstraints {
  /** Earliest time of day; its date is ignored. */
  min?: Date
  /** Latest time of day; its date is ignored. */
  max?: Date
  /** Minutes offered (and accepted) are multiples of this. */
  minuteStep?: number
}
