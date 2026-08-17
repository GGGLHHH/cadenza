import type { ChangeEvent, ComponentProps, ReactElement } from 'react'
import type { DropdownProps } from 'react-day-picker'
import { useMemo, useRef } from 'react'
import { defaultDateLib } from 'react-day-picker'
import { CalendarDayButton, Calendar as CalendarPrimitive } from '#primitives/calendar'
import { Select, SelectItem, SelectPopup, SelectTrigger } from './select'

/**
 * How far the year dropdown reaches in each direction when the caller names no
 * bounds. react-day-picker's own default is `[today - 100y, end of this year]`
 * — a birthday picker's range, and one that cannot reach next year at all. The
 * lower bound is its number; the upper one is that number made symmetric,
 * since a date field routinely points at the future. Narrow it per field with
 * `startMonth` / `endMonth`.
 */
const YEAR_REACH = 100

/**
 * The vendored calendar with one substitution — the `Checkbox` treatment (a
 * thin wrapper, not the plain re-export this used to be): under
 * `captionLayout="dropdown"` the month and year controls are rebuilt on this
 * library's `Select` instead of react-day-picker's native `<select>`.
 *
 * Two reasons, and the first is not cosmetic. The vendored dropdown is a
 * transparent `<select>` laid over the caption, and it opens on the mousedown
 * default action — which the pickers' popups cancel wholesale (their antd
 * treatment: a press inside the popup never takes focus off the field). Left
 * as-is the caption would be dead on click inside a `DatePicker`. Second, an
 * OS-drawn option list is the one popup in this library that cannot follow the
 * theme.
 *
 * Everything else passes straight through: selection mode, matchers, locale
 * and layout are still react-day-picker's under shadcn's styling.
 *
 * `className` lands on `DayPicker`, a plain component that takes a string —
 * honestly typed as such, no function-of-state form.
 */
export type CalendarProps = ComponentProps<typeof CalendarPrimitive>
export type CalendarDayButtonProps = ComponentProps<typeof CalendarDayButton>

/**
 * One dropdown, serving as both `MonthsDropdown` and `YearsDropdown` — the two
 * differ only in the options react-day-picker hands down.
 *
 * The props are a native `<select>`'s, so the bridge back is a stand-in event:
 * react-day-picker's handler reads `event.target.value` and nothing else
 * (`DayPicker.js`'s `handleMonthChange` / `handleYearChange`), so a one-key
 * object is the whole contract — mirroring the whole `ChangeEvent` would be
 * inventing obligations neither side has.
 */
function CalendarNavDropdown({
  'aria-label': ariaLabel,
  disabled,
  onChange,
  options,
  value,
}: DropdownProps): ReactElement {
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <Select<number>
      // A month is never "none": the calendar always shows one.
      clearable={false}
      disabled={disabled}
      items={options?.map(({ label, value }) => ({ label, value }))}
      value={Number(value)}
      onValueChange={(next) => {
        if (next === null)
          return
        onChange?.({ target: { value: String(next) } } as ChangeEvent<HTMLSelectElement>)
      }}
    >
      {/* `relative` is load-bearing, not spacing: the nav row is `absolute
          inset-x-0` across the whole caption and holds arrows only at its
          ends, so its empty middle swallows presses aimed at the caption. The
          vendored dropdown escapes through `dropdown_root`'s own `relative`;
          replacing that wrapper means re-earning the stacking context here.

          `sm` is exactly `--cell-size` tall (h-7), so the caption row keeps
          the height those arrows are aligned against.

          react-day-picker's label ("Choose the Month") goes on the trigger
          itself, not the root: the root's `aria-label` only feeds a trigger it
          composes for you, and this one is written out. Without it the button
          announces as its own caption text, which says what it shows but not
          what pressing it does.

          The rest is the `ghost` treatment the nav arrows on this same row
          already wear (`buttonVariant="ghost"`): the caption should read as
          the panel's own title, not as two form controls parked on top of it,
          so the border and the filled dark background go and the affordance
          moves to hover. The border is only made transparent — dropping its
          width would shift the caption by 2px the moment anything restored
          it. `aria-expanded` keeps the tint while the list is open, which
          Select already writes and ghost already styles.

          The padding comes in with it: a control's padding reads as its box,
          but with no box left it is just a gap, and the default one pushed
          the month and the year far enough apart to read as two separate
          things rather than one title. */}
      <SelectTrigger
        aria-label={ariaLabel}
        className="
          relative gap-1 border-transparent px-1.5 font-medium
          hover:bg-muted hover:text-foreground
          aria-expanded:bg-muted aria-expanded:text-foreground
          dark:bg-transparent
          dark:hover:bg-muted/50
        "
        ref={triggerRef}
        size="sm"
      />
      {/* `finalFocus` is spelled out for the same reason it had to be on the
          pickers' own popups: left to itself Base UI aims the focus back at
          whatever had it when the list opened, which inside a date field is
          the text input — outside this popup, so its guard drops the return
          entirely and focus lands on `<body>`. Naming the trigger fixes the
          cancelling paths (Escape, a press outside).

          Choosing a value is the one path it cannot fix, and the reason is
          upstream: the vendored calendar builds its `components` map inline,
          so every month change remounts the whole panel and the trigger this
          would return to is gone by the time the focus manager looks. The
          arrows have the same hole — pressing one drops focus too — so this
          is the panel's existing behaviour rather than something the dropdown
          introduces. Closing it properly means forking the vendored calendar
          for a stable component map. */}
      <SelectPopup finalFocus={() => triggerRef.current}>
        {options?.map(({ disabled, label, value }) => (
          <SelectItem disabled={disabled} key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

export function Calendar({
  captionLayout,
  components,
  endMonth,
  formatters,
  startMonth,
  ...props
}: CalendarProps): ReactElement {
  // Only the year dropdown needs bounds — it is a finite list, where the arrows
  // are not. Under `label` these stay undefined, or naming them would quietly
  // cap how far the arrows can walk.
  const yearDropdown = captionLayout === 'dropdown' || captionLayout === 'dropdown-years'
  const reach = useMemo(() => {
    const thisYear = new Date().getFullYear()
    return { end: new Date(thisYear + YEAR_REACH, 11), start: new Date(thisYear - YEAR_REACH, 0) }
  }, [])
  return (
    <CalendarPrimitive
      captionLayout={captionLayout}
      endMonth={endMonth ?? (yearDropdown ? reach.end : undefined)}
      startMonth={startMonth ?? (yearDropdown ? reach.start : undefined)}
      // Back onto react-day-picker's own locale channel. The vendored default
      // reads `date.toLocaleString(locale?.code, …)`, which falls through to
      // the *browser's* language when no `locale` is given — leaving the
      // caption in one language and the weekday row in react-day-picker's
      // English default. `dateLib.format` is the channel every other label
      // already uses, so the panel speaks one language either way. `LLL` keeps
      // the abbreviation the native `<select>` needed for width; the caption
      // is still the narrowest thing in the panel.
      formatters={{
        // The fallback is react-day-picker's own signature for its formatters.
        formatMonthDropdown: (month, dateLib = defaultDateLib) => dateLib.format(month, 'LLL'),
        ...formatters,
      }}
      // Defaults, not overrides: a caller composing their own dropdowns still
      // wins, the same way the vendored calendar treats its own components.
      components={{
        MonthsDropdown: CalendarNavDropdown,
        YearsDropdown: CalendarNavDropdown,
        ...components,
      }}
      {...props}
    />
  )
}

export { CalendarDayButton }
