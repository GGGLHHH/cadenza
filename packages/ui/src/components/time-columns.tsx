'use client'

import type { ComponentProps, ReactElement, RefObject } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import type { TimeConstraints, TimeGranularity } from '#lib/time'
import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { useControllableState } from '@gedatou/cadenza-utils'
import { set, startOfDay } from 'date-fns'
import { useLayoutEffect, useRef } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { secondsOfDay, truncateTime } from '#lib/time'
import { cn, dataAttr } from '#lib/utils'

/**
 * The published TimeColumns: hours, minutes and — at `granularity="second"` —
 * seconds as side-by-side scrolling columns. It is to `TimePicker` what
 * `Calendar` is to `DatePicker`: the pickers' panel, usable on its own wherever
 * a time of day is picked inline.
 *
 * Base UI has no time component, so the panel is the seam's own. Each column
 * is a Base UI `RadioGroup`, which hands over everything a column needs:
 * roving focus with one Tab stop per column, that stop parked on the checked
 * option (Base UI's `data-composite-item-active`), arrow keys that move the
 * selection with the focus — a native radio group's behaviour, and Chrome's own
 * time popup's — and "10 of 24" from the radio semantics.
 *
 * Only the time of day is read and written. A pick keeps the value's date (with
 * no value, today's) and the units it does not touch; a pick that would leave
 * `min`/`max` or the minute step slides the smaller units to the first option
 * that is allowed, so the columns never produce a value they themselves show
 * as disabled.
 *
 * The root is a plain `<div>`, so its `className` is honestly a string.
 */

/** Why the value changed: a pick in one of the columns — arrow keys included, which select as they move. */
export type TimeColumnsChangeEventReason = 'item-press'

export type TimeColumnsChangeEventDetails = ChangeEventDetails<TimeColumnsChangeEventReason>

/**
 * The columns' accessible names. English aria-only fallbacks, the house
 * pattern (`DatePickerTrigger`'s "Open calendar"): they never render visibly,
 * and passing your own replaces them.
 */
export interface TimeColumnsLabels {
  hours: string
  minutes: string
  seconds: string
}

// `onChange` joins the omitted div props for the reason DatePicker gives: the
// root is a `<div>`, and an intersection with its native handler would demand
// a callback satisfying both signatures.
export type TimeColumnsProps
  = Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'>
    & TimeConstraints
    & {
      /** Controlled value. `null` checks nothing. Only the time of day is read. */
      value?: Date | null
      /** Uncontrolled initial value. */
      defaultValue?: Date | null
      /**
       * Fires on every pick with the new value — the old one's date with the
       * picked time. `eventDetails.cancel()` rejects the pick.
       */
      onValueChange?: (value: Date, eventDetails: TimeColumnsChangeEventDetails) => void
      /** `'second'` adds the seconds column. */
      granularity?: TimeGranularity
      disabled?: boolean
      /** Replaces the columns' English accessible names. */
      labels?: Partial<TimeColumnsLabels>
    }

const DEFAULT_LABELS: TimeColumnsLabels = { hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' }
const HOURS = Array.from({ length: 24 }, (_, index) => index)
const SIXTY = Array.from({ length: 60 }, (_, index) => index)
const LAST_SECOND_OF_DAY = 24 * 3600 - 1

export function TimeColumns({
  className,
  defaultValue,
  disabled = false,
  granularity = 'minute',
  labels,
  max,
  min,
  minuteStep = 1,
  onValueChange,
  value: valueProp,
  ...props
}: TimeColumnsProps): ReactElement {
  const [value, setValueState] = useControllableState<Date | null>({
    value: valueProp,
    defaultValue,
    fallback: null,
  })
  const minutes = SIXTY.filter(minute => minute % minuteStep === 0)
  const seconds = granularity === 'second' ? SIXTY : [0]
  // The bounds as seconds of the day: a time of day is compared, never a date.
  const lo = min === undefined ? 0 : secondsOfDay(min)
  const hi = max === undefined ? LAST_SECOND_OF_DAY : secondsOfDay(max)
  const bounded = min !== undefined || max !== undefined

  // The time a pick builds on: the value's — or, with none, the start of the
  // day lifted to `min`, so the first pick already starts inside the bounds.
  // Only the time of day is needed to render; which day it lands on is the
  // pick's business (see `pick`), so render stays clock-free.
  const baseHour = value === null ? Math.floor(lo / 3600) : value.getHours()
  const baseMinute = value === null ? Math.floor(lo / 60) % 60 : value.getMinutes()
  const baseSecond = granularity === 'second' ? (value === null ? lo % 60 : value.getSeconds()) : 0

  const inBounds = (hour: number, minute: number, second: number): boolean => {
    const time = hour * 3600 + minute * 60 + second
    return time >= lo && time <= hi
  }
  const allowed = (hour: number, minute: number, second: number): boolean =>
    inBounds(hour, minute, second) && minute % minuteStep === 0
  // The first allowed minute/second inside an hour (or inside one minute of
  // it). Seconds are contiguous, so the earliest one at or after `lo` is
  // arithmetic, not a search — this runs for every cell on every render.
  const firstAllowed = (hour: number, onlyMinute?: number): [number, number] | undefined => {
    for (const minute of onlyMinute === undefined ? minutes : [onlyMinute]) {
      const second = granularity === 'second' ? Math.max(0, lo - (hour * 3600 + minute * 60)) : 0
      if (second <= 59 && allowed(hour, minute, second))
        return [minute, second]
    }
    return undefined
  }

  const pick = (hour: number, minute: number, second: number, event: Event): void => {
    // The value's day, or today's for a first pick.
    const day = value ?? startOfDay(new Date())
    const next = truncateTime(set(day, { hours: hour, minutes: minute, seconds: second, milliseconds: 0 }), granularity)
    const eventDetails = createChangeEventDetails('item-press', event)
    onValueChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    setValueState(next)
  }
  const pickHour = (hour: number, event: Event): void => {
    const [minute, second] = allowed(hour, baseMinute, baseSecond)
      ? [baseMinute, baseSecond]
      : firstAllowed(hour) ?? [baseMinute, baseSecond]
    pick(hour, minute, second, event)
  }
  const pickMinute = (minute: number, event: Event): void => {
    const second = allowed(baseHour, minute, baseSecond)
      ? baseSecond
      : firstAllowed(baseHour, minute)?.[1] ?? baseSecond
    pick(baseHour, minute, second, event)
  }

  const hoursRef = useRef<HTMLDivElement | null>(null)
  const minutesRef = useRef<HTMLDivElement | null>(null)
  const secondsRef = useRef<HTMLDivElement | null>(null)
  const revealedRef = useRef(false)
  const checkedHour = value?.getHours() ?? null
  const checkedMinute = value?.getMinutes() ?? null
  const checkedSecond = value?.getSeconds() ?? null
  // The checked option rides at the top of its column. On mount it is put
  // there unconditionally — Base UI's composite scrolls it into view too, to
  // the nearest edge, and whichever of us runs last must not leave it parked
  // at the bottom. Later (a typed time, a press) only an option that is out of
  // view moves: one the pointer just pressed stays under the pointer.
  useLayoutEffect(() => {
    for (const column of [hoursRef.current, minutesRef.current, secondsRef.current])
      revealChecked(column, !revealedRef.current)
    revealedRef.current = true
  }, [checkedHour, checkedMinute, checkedSecond])

  const columnLabels = { ...DEFAULT_LABELS, ...labels }
  return (
    <div
      className={cn('flex [--cell-size:--spacing(7)] block-56', className)}
      data-disabled={dataAttr(disabled)}
      data-slot="time-columns"
      {...props}
    >
      <TimeColumn
        aria-label={columnLabels.hours}
        checked={checkedHour}
        columnRef={hoursRef}
        disabled={disabled}
        isOptionDisabled={hour => bounded && firstAllowed(hour) === undefined}
        options={HOURS}
        onPick={pickHour}
      />
      <TimeColumn
        aria-label={columnLabels.minutes}
        checked={checkedMinute}
        columnRef={minutesRef}
        disabled={disabled}
        isOptionDisabled={minute => bounded && firstAllowed(baseHour, minute) === undefined}
        options={minutes}
        onPick={pickMinute}
      />
      {granularity === 'second' && (
        <TimeColumn
          aria-label={columnLabels.seconds}
          checked={checkedSecond}
          columnRef={secondsRef}
          disabled={disabled}
          isOptionDisabled={second => bounded && !inBounds(baseHour, baseMinute, second)}
          options={seconds}
          onPick={(second, event) => pick(baseHour, baseMinute, second, event)}
        />
      )}
    </div>
  )
}

interface TimeColumnProps {
  'aria-label': string
  'checked': number | null
  'columnRef': RefObject<HTMLDivElement | null>
  'disabled': boolean
  'isOptionDisabled': (option: number) => boolean
  'options': number[]
  'onPick': (option: number, event: Event) => void
}

/**
 * One column — a `RadioGroup` that is its own scroll container. Not wrapped in
 * `ScrollArea` the way Cascader's panels are: its viewport makes itself a Tab
 * stop whenever it overflows (`ScrollAreaViewport`'s `tabIndex`), a column
 * always overflows, and the radio group's roving stop is the only one a column
 * should cost. Being the scroll container itself is also what Base UI's
 * composite scrolls (`scrollIntoViewIfNeeded(rootRef.current, …)`) as arrow
 * keys walk past the edge.
 */
function TimeColumn({
  'aria-label': ariaLabel,
  checked,
  columnRef,
  disabled,
  isOptionDisabled,
  onPick,
  options,
}: TimeColumnProps): ReactElement {
  return (
    <RadioGroupPrimitive<number | null>
      aria-label={ariaLabel}
      className="
        relative flex scrollbar-none flex-col gap-0.5 overflow-y-auto p-1
        outline-none block-full inline-14
        not-first:border-s
      "
      data-slot="time-columns-column"
      disabled={disabled}
      ref={columnRef}
      // `null`, not `undefined`: nothing checked must stay controlled.
      value={checked}
      onValueChange={(option, eventDetails) => {
        if (option !== null)
          onPick(option, eventDetails.event)
      }}
    >
      {options.map(option => (
        // Hover styles only the unchecked options (Base UI's complementary
        // `data-unchecked`). Laid over the checked colours they lose on
        // specificity, not order: this library's `data-checked:` is a
        // zero-weight `:where()`, while `dark:` is an `:is(.dark *)` — so in
        // the dark theme the hovered checked option got the muted background
        // under its dark text, and its digits vanished until the pointer left.
        <RadioPrimitive.Root
          className="
            flex shrink-0 items-center justify-center rounded-md text-sm
            tabular-nums outline-none select-none block-(--cell-size)
            focus-visible:ring-[3px] focus-visible:ring-ring/50
            data-checked:bg-primary data-checked:text-primary-foreground
            data-unchecked:hover:bg-muted data-unchecked:hover:text-foreground
            dark:data-unchecked:hover:bg-muted/50
            data-disabled:opacity-50
          "
          data-slot="time-columns-item"
          disabled={isOptionDisabled(option)}
          key={option}
          value={option}
        >
          {String(option).padStart(2, '0')}
        </RadioPrimitive.Root>
      ))}
    </RadioGroupPrimitive>
  )
}

function revealChecked(column: HTMLElement | null, always: boolean): void {
  const item = column?.querySelector<HTMLElement>('[data-checked]') ?? null
  if (column === null || item === null)
    return
  const outOfView = item.offsetTop < column.scrollTop
    || item.offsetTop + item.offsetHeight > column.scrollTop + column.clientHeight
  if (always || outOfView)
    column.scrollTop = item.offsetTop - Number.parseFloat(getComputedStyle(column).paddingTop)
}
