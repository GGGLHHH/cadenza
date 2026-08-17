'use client'

import type { Locale } from 'date-fns'
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import type { DateRange as DayPickerRange, Matcher } from 'react-day-picker'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { IconArrowNarrowRight, IconCalendar, IconX } from '@tabler/icons-react'
import { format as formatDate, isValid, parse as parseDate, startOfDay } from 'date-fns'
import { createContext, use, useEffect, useRef, useState } from 'react'
import { dateMatchModifiers } from 'react-day-picker'
import { createChangeEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { isOwnLabelPress, LABEL_PRESS_REASONS } from '#lib/own-label-press'
import { popupClassName, SERIAL_FORMAT } from '#lib/popup'
import { cn, dataAttr } from '#lib/utils'
import { Button } from './button'
import { Calendar } from './calendar'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group'

/**
 * The published DateRangePicker family — the DatePicker treatment with two
 * editable ends and a two-month range calendar. The value's keys are
 * react-day-picker's (`from`/`to`, passed through to the calendar untouched);
 * the parts are named after its range vocabulary's UI side (`range_start`/
 * `range_end`): `DateRangePickerStartInput` edits `from`,
 * `DateRangePickerEndInput` edits `to`.
 *
 * The input the user is in decides which end the calendar fills — press the
 * end input and the next day lands on the end, start still empty — and a pick
 * hops focus to the end still waiting, so two presses complete a range. Both
 * ends of the value are therefore optional, and the caret settles wherever
 * the completing day landed. A day that would invert the range swaps roles
 * with the other end rather than clearing it (`placeEnd`); typing follows the
 * same rules, holding anything that would move the other end until the text
 * is a whole date. Picking in the calendar closes only once both ends are
 * chosen.
 */

/**
 * The committed range. Both ends are optional: the pressed input decides
 * which end the calendar fills, so a range can legitimately hold only an end.
 * A range with neither end is never produced — that is `null`, the controlled
 * empty value.
 */
export interface DateRange {
  from?: Date
  to?: Date
}

/** Why the value changed. Clearing is a reason, not a separate callback; `close-press` is the footer's confirm. */
export type DateRangePickerChangeEventReason
  = 'input-change' | 'input-clear' | 'item-press' | 'clear-press' | 'close-press' | 'none'

export type DateRangePickerChangeEventDetails = ChangeEventDetails<DateRangePickerChangeEventReason>

/** Why the popup opened or closed — Base UI's reasons plus the seam's input-side gestures. */
export type DateRangePickerOpenChangeEventReason
  = PopoverPrimitive.Root.ChangeEventReason
    | 'input-press' | 'item-press' | 'list-navigation' | 'keyboard'

export type DateRangePickerOpenChangeEventDetails = ChangeEventDetails<DateRangePickerOpenChangeEventReason>

/** What the root's parts read, and what function children are handed. */
export interface DateRangePickerState {
  /** An input is showing something — Base UI's Field word (`data-filled`), read off the visible text (drafts, staged or committed). */
  filled: boolean
  open: boolean
  disabled: boolean
  readOnly: boolean
}

/** The calendar wiring the popup hands to a function child — spread it into `<Calendar>` and add your own props on top. */
export interface DateRangePickerCalendarProps {
  mode: 'range'
  selected: DayPickerRange | undefined
  onSelect: (range: DayPickerRange | undefined, triggerDate: Date) => void
  month: Date
  onMonthChange: (month: Date) => void
  numberOfMonths: number
  disabled: Matcher | Matcher[] | undefined
  locale: Locale | undefined
  /**
   * `'dropdown'` — the caption's month and year are pickable, so a distant
   * range takes one press instead of a walk through the arrows. Both months
   * get a set; the second one's is offset, so choosing March there leaves
   * February–March rather than March–April. Spread this on and pass
   * `captionLayout="label"` after it for the plain caption.
   */
  captionLayout: 'dropdown'
}

type RangeEnd = 'from' | 'to'

/**
 * Puts `day` on one end. With the other end empty it simply goes there;
 * otherwise the two days are sorted, so a day that would invert the range
 * swaps roles with the other one instead of deleting it. Choosing the 20th
 * and then the 10th means the 10th–20th, and moving a start past the end
 * makes the old end the new start — never a date silently thrown away.
 *
 * Which end was aimed at only matters while the other is empty; once both
 * days exist, chronology decides. The caret follows the day rather than the
 * end aimed at (see the popup), so the two stay in step.
 */
function placeEnd(current: DateRange | null, end: RangeEnd, day: Date): DateRange {
  const other = end === 'from' ? current?.to : current?.from
  if (other === undefined)
    return end === 'from' ? { from: day } : { to: day }
  return day.getTime() <= other.getTime() ? { from: day, to: other } : { from: other, to: day }
}

/** Empties one end, and the whole range once nothing is left. */
function dropEnd(current: DateRange, end: RangeEnd): DateRange | null {
  const rest = end === 'from' ? current.to : current.from
  if (rest === undefined)
    return null
  return end === 'from' ? { to: rest } : { from: rest }
}

/** Same two ends, to the millisecond. */
function sameRange(a: DateRange | null, b: DateRange | null): boolean {
  return a?.from?.getTime() === b?.from?.getTime() && a?.to?.getTime() === b?.to?.getTime()
}

interface DateRangePickerContextValue extends DateRangePickerState {
  value: DateRange | null
  /** What the inputs and calendar show: the staged range while confirming, the committed one otherwise. */
  preview: DateRange | null
  /** A `DateRangePickerFooter` is mounted: picks stage instead of committing. */
  confirmMode: boolean
  drafts: Record<RangeEnd, string | null>
  clearable: boolean
  format: string
  locale: Locale | undefined
  disabledDates: Matcher | Matcher[] | undefined
  startPlaceholder?: string
  endPlaceholder?: string
  id?: string
  /** Which end the calendar's next press fills — the end whose input was last entered. */
  activeEnd: RangeEnd
  /** Aims the calendar at one end. Pressing or tabbing into an input calls this. */
  setActiveEnd: (end: RangeEnd) => void
  inputRefs: Record<RangeEnd, RefObject<HTMLInputElement | null>>
  rootRef: RefObject<HTMLDivElement | null>
  portalRef: RefObject<HTMLDivElement | null>
  setDraft: (end: RangeEnd, draft: string | null) => void
  setValue: (value: DateRange | null, eventDetails?: DateRangePickerChangeEventDetails) => void
  /** Settles one end's draft: commit an empty draft as a clear, drop an unparseable one. */
  commitDraft: (end: RangeEnd, event: Event) => void
  /** Typed text → day (already start-of-day normalised), `null` when it is not a date yet. */
  parseText: (text: string, referenceDate: Date) => Date | null
  setOpen: (open: boolean, eventDetails: DateRangePickerOpenChangeEventDetails) => void
  month: Date
  setMonth: (month: Date) => void
  /** Stages a range while confirming (`DateRangePickerFooter` mounted) instead of committing it; `undefined` drops the stage (the pending domain's own word for "nothing staged"). */
  stage: (next: DateRange | null | undefined) => void
  /** Commits the staged range (reason `close-press`) and closes. */
  confirm: (event: Event) => void
  setFooterMounted: (mounted: boolean) => void
  /** Flag the next close as submitting — call before `setOpen(false)`; the root then settles the caret. */
  markSubmitClose: () => void
  /** Points this close's return focus at one input instead of wherever the popup was opened from. */
  aimReturnFocus: (element: HTMLInputElement | null) => void
  /** The popup's `finalFocus`: where this close should return focus, or `false` for nowhere (see the root). */
  resolveReturnFocus: () => HTMLInputElement | boolean
}

const DateRangePickerContext = createContext<DateRangePickerContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  DateRangePickerContext.displayName = 'DateRangePickerContext'

function useDateRangePickerContext(): DateRangePickerContextValue {
  const context = use(DateRangePickerContext)
  if (context === null)
    throw new Error('cadenza-ui: DateRangePickerContext is missing. DateRangePicker parts must be placed within <DateRangePicker>.')
  return context
}

// `onChange` joins the omitted div props: the root is a `<div>`, so React
// declares a native handler under that name and an intersection would demand a
// callback satisfying both signatures. Ours never reaches the element.
export type DateRangePickerProps
  = Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'>
    & {
      /** Controlled value. `null` is the controlled empty value. */
      'value'?: DateRange | null
      /** Uncontrolled initial value. */
      'defaultValue'?: DateRange | null
      /**
       * Fires on every committed change with why it happened.
       * `eventDetails.cancel()` rejects the change entirely.
       */
      'onValueChange'?: (value: DateRange | null, eventDetails: DateRangePickerChangeEventDetails) => void
      /** Controlled popup state. */
      'open'?: boolean
      /** Whether the popup is initially open. */
      'defaultOpen'?: boolean
      /** Fires when the popup opens or closes. `cancel()` keeps it where it is. */
      'onOpenChange'?: (open: boolean, eventDetails: DateRangePickerOpenChangeEventDetails) => void
      /** Fires after the popup's open/close animation completes. */
      'onOpenChangeComplete'?: (open: boolean) => void
      /** Imperative popup actions (`unmount`, `close`), Base UI's own type. */
      'actionsRef'?: PopoverPrimitive.Root.Props['actionsRef']
      /** Base UI's modal switch, pinned to `false`: an inline date field must not lock the page. */
      'modal'?: PopoverPrimitive.Root.Props['modal']
      /**
       * The display and parse format, date-fns tokens. The hidden inputs
       * always serialise as `yyyy-MM-dd`, whatever is shown.
       */
      'format'?: string
      /** date-fns locale for formatting, parsing and the calendar. */
      'locale'?: Locale
      /**
       * Replaces how typed text parses into a date, both ends alike — accept
       * several formats, compact digits, whatever the field should
       * understand. `null` means "not a date yet". Must be pure; the result
       * is normalised to the start of its day, and display still follows
       * `format`. Defaults to strict parsing by `format`.
       */
      'inputToValue'?: (text: string) => Date | null
      /**
       * Days the calendar disables — react-day-picker matchers. A typed date
       * matching one is rejected too, not just unpickable.
       */
      'disabledDates'?: Matcher | Matcher[]
      /** With a name, two hidden inputs (start then end) serialise for the form. */
      'name'?: string
      'disabled'?: boolean
      'readOnly'?: boolean
      /**
       * The clear affordance's master switch, default ON — `false` removes the
       * clear button everywhere, an explicitly composed `DateRangePickerClear`
       * included.
       */
      'clearable'?: boolean
      /** Placeholder for the default composition's start input. */
      'startPlaceholder'?: string
      /** Placeholder for the default composition's end input. */
      'endPlaceholder'?: string
      /** Forwarded to the start input, so a `FieldLabel htmlFor` reaches it. */
      'id'?: string
      /** Accessible name for the field as a group; the inputs carry their own. */
      'aria-label'?: string
      /**
       * Replaces the default composition (two inputs, clear, calendar
       * button). Compose the parts yourself inside the root; the popup stays
       * present unless a `DateRangePickerPopup` is composed. A function
       * receives the field's state plus the default composition as
       * `defaultChildren`.
       */
      'children'?: ReactNode | ((state: DateRangePickerState & { defaultChildren: ReactNode }) => ReactNode)
    }

interface RangeInputProps extends ComponentProps<typeof InputGroupInput> {
  end: RangeEnd
}

/**
 * The shared editing behaviour of both ends — the DatePicker input treatment
 * applied to one half of the range. Carries no `data-slot` of its own for the
 * focus-ring contract reason documented on `DatePickerInput`.
 */
function RangeInput({
  end,
  onBlur,
  onChange,
  onClick,
  onFocus,
  onKeyDown,
  ref,
  ...props
}: RangeInputProps): ReactElement {
  const field = useDateRangePickerContext()
  const committed = field.preview === null ? undefined : field.preview[end]
  const text = field.drafts[end]
    ?? (committed === undefined ? '' : formatDate(committed, field.format, { locale: field.locale }))
  return (
    <InputGroupInput
      aria-expanded={field.open}
      aria-haspopup="dialog"
      autoComplete="off"
      disabled={field.disabled}
      readOnly={field.readOnly}
      value={text}
      {...props}
      // Claimed, not taken: the caller's ref still gets the element. The
      // root's label-press, end-hop and final-focus wiring need it.
      ref={(node: HTMLInputElement | null) => {
        field.inputRefs[end].current = node
        if (typeof ref === 'function')
          return ref(node)
        if (ref !== null && ref !== undefined)
          ref.current = node
      }}
      // Chained after the spread: the field's text is wired through these
      // handlers, and a caller listening in must not silently unhook them.
      onFocus={(event) => {
        onFocus?.(event)
        // Entering an input aims the calendar at that end — focus, not click,
        // so tabbing between the ends re-aims it too.
        field.setActiveEnd(end)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        const next = event.relatedTarget
        // Hopping to the other end settles this one but stays in the field.
        const other: RangeEnd = end === 'from' ? 'to' : 'from'
        if (next !== null && next === field.inputRefs[other].current) {
          field.commitDraft(end, event.nativeEvent)
          return
        }
        // Focus moving into our own box or portal is not leaving the field.
        // Base UI's focus guards render inside the root, so a Tab that is
        // about to land in the calendar answers `rootRef.contains` too.
        //
        // The portal node rather than the popup, which is what lets the
        // calendar's month and year lists count as ours: they are popups of
        // their own, and this end holds focus for most of the stretch where
        // jumping months is the point — picking a day hands the caret to the
        // end still waiting. Nested portals resolve their container to the
        // parent portal node, so containment still answers (see the popup
        // part for Base UI drawing the same line).
        if (next !== null && (field.rootRef.current?.contains(next)
          || field.portalRef.current?.contains(next))) {
          return
        }
        field.commitDraft('from', event.nativeEvent)
        field.commitDraft('to', event.nativeEvent)
        if (field.open)
          field.setOpen(false, createChangeEventDetails('focus-out', event.nativeEvent))
      }}
      onChange={(event) => {
        const raw = event.target.value
        field.setDraft(end, raw)
        const day = field.parseText(raw, new Date())
        if (day !== null) {
          const disabledMatch = field.disabledDates !== undefined
            && dateMatchModifiers(day, field.disabledDates)
          if (!disabledMatch) {
            const current = field.preview
            const next = placeEnd(current, end, day)
            // Typing arrives a character at a time and the halfway states
            // parse too — "2026-08-2" reads as the 2nd before the 0 lands. A
            // keystroke that only fills its own end is always safe, but one
            // that would move the other end has to wait until the text is a
            // whole date, or a halfway reading would rearrange the field
            // under the user's hands.
            //
            // "Whole" is decided by a round trip: format the parsed day back
            // out and see if it matches what was typed. Canonical, finished
            // text does ("2026-08-10"); text still being typed does not
            // ("2026-08-1" formats back to "2026-08-01"). A custom
            // `inputToValue` writes in its own notation, so it never matches
            // and keeps the cautious behaviour — settling on the way out
            // through `commitDraft`.
            const touchesOtherEnd = end === 'from'
              ? current?.to?.getTime() !== next.to?.getTime()
              : current?.from?.getTime() !== next.from?.getTime()
            const wholeDate = formatDate(day, field.format, { locale: field.locale }) === raw.trim()
            if ((!touchesOtherEnd || wholeDate) && !sameRange(next, current)) {
              if (field.confirmMode)
                field.stage(next)
              else
                field.setValue(next, createChangeEventDetails('input-change', event.nativeEvent))
              field.setMonth(day)
            }
          }
        }
        onChange?.(event)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented)
          return
        if (!field.open && !field.readOnly && !field.disabled)
          field.setOpen(true, createChangeEventDetails('input-press', event.nativeEvent))
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented)
          return
        if (event.key === 'Escape' && field.open) {
          // The popup's Escape, not the page's: an enclosing dialog must not
          // also close off this press.
          event.stopPropagation()
          field.setOpen(false, createChangeEventDetails('escape-key', event.nativeEvent))
        }
        if (event.key === 'Enter') {
          field.commitDraft(end, event.nativeEvent)
          if (field.open) {
            // While the popup is open, Enter belongs to it — settling the
            // draft, not submitting the form. Confirming, it IS the confirm.
            event.preventDefault()
            if (field.confirmMode)
              field.confirm(event.nativeEvent)
            else
              field.setOpen(false, createChangeEventDetails('keyboard', event.nativeEvent))
          }
        }
        if (event.key === 'ArrowDown' && !field.open && !field.readOnly)
          field.setOpen(true, createChangeEventDetails('list-navigation', event.nativeEvent))
      }}
    />
  )
}

export type DateRangePickerStartInputProps = ComponentProps<typeof InputGroupInput>
export type DateRangePickerEndInputProps = ComponentProps<typeof InputGroupInput>
export type DateRangePickerTriggerProps = ComponentProps<typeof InputGroupButton>
export type DateRangePickerClearProps = ComponentProps<typeof InputGroupButton>

/** The start-date input — edits the range's `from`. */
export function DateRangePickerStartInput(props: DateRangePickerStartInputProps): ReactElement {
  const field = useDateRangePickerContext()
  return (
    <RangeInput
      aria-label="Start date"
      end="from"
      id={field.id}
      placeholder={field.startPlaceholder}
      {...props}
    />
  )
}

/** The end-date input — edits the range's `to`. */
export function DateRangePickerEndInput(props: DateRangePickerEndInputProps): ReactElement {
  const field = useDateRangePickerContext()
  return (
    <RangeInput
      aria-label="End date"
      end="to"
      placeholder={field.endPlaceholder}
      {...props}
    />
  )
}

/**
 * The calendar button — the DatePicker trigger, addressed to this family.
 * Out of the tab order, absent from the read-only default composition, for
 * the reasons documented there.
 */
export function DateRangePickerTrigger({
  children,
  className,
  onClick,
  ...props
}: DateRangePickerTriggerProps): ReactElement {
  const field = useDateRangePickerContext()
  return (
    <InputGroupAddon align="inline-end" data-slot="date-range-picker-trigger-addon">
      <InputGroupButton
        aria-label="Open calendar"
        className={className}
        data-slot="date-range-picker-trigger"
        disabled={field.disabled}
        tabIndex={-1}
        {...props}
        // After the spread: a caller listening for clicks must not silently
        // take the toggle away.
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented || field.readOnly)
            return
          field.setOpen(!field.open, createChangeEventDetails('trigger-press', event.nativeEvent))
        }}
      >
        {children ?? <IconCalendar aria-hidden />}
      </InputGroupButton>
    </InputGroupAddon>
  )
}

/**
 * The clear button — clears both ends at once and hides itself while the
 * field is empty, off the root's `data-empty`.
 */
export function DateRangePickerClear({
  className,
  children,
  onClick,
  ...props
}: DateRangePickerClearProps): ReactElement | null {
  const field = useDateRangePickerContext()
  if (!field.clearable)
    return null
  return (
    <InputGroupAddon
      align="inline-end"
      // `invisible`, not `hidden`: the empty state must keep the button's
      // box, or the inputs' widths jump the moment a value lands and the
      // whole field visibly shifts (the Cascader zero-layout-shift verdict).
      className="group-data-empty/date-range-picker:invisible"
      data-slot="date-range-picker-clear-addon"
    >
      <InputGroupButton
        aria-label="Clear dates"
        className={cn('rounded-full', className)}
        data-slot="date-range-picker-clear"
        disabled={field.disabled}
        tabIndex={-1}
        {...props}
        // After the spread for the same reason as the trigger's onClick.
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented)
            return
          field.setDraft('from', null)
          field.setDraft('to', null)
          // A staged-but-unconfirmed range is part of what this button clears —
          // left in place it would keep previewing, and confirming would
          // resurrect it.
          field.stage(undefined)
          field.setValue(null, createChangeEventDetails('clear-press', event.nativeEvent))
        }}
      >
        {children ?? <IconX aria-hidden />}
      </InputGroupButton>
    </InputGroupAddon>
  )
}

// `initialFocus`/`finalFocus` are the form's, not the caller's: focus stays in
// the inputs while picking, and returns there when a pick closes the popup.
export type DateRangePickerPopupProps
  = Omit<PopoverPrimitive.Popup.Props, 'children' | 'initialFocus' | 'finalFocus'>
    & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
    & {
      /**
       * Extends or replaces the popup's content. Plain children render BELOW
       * the default two-month calendar
       * (`<DateRangePickerPopup><DateRangePickerFooter …/></DateRangePickerPopup>`);
       * a function replaces the calendar entirely — it receives the seam's
       * wiring to spread into your own:
       * `{(calendar) => <Calendar {...calendar} numberOfMonths={1} />}`.
       */
      children?: ReactNode | ReactNode[] | ((calendarProps: DateRangePickerCalendarProps) => ReactNode)
    }

/**
 * Portal + Positioner + Popup in one part, anchored to the root's box — the
 * DatePicker popup with a two-month range calendar inside.
 */
export function DateRangePickerPopup({
  align = 'start',
  alignOffset = 0,
  children,
  className,
  onMouseDown,
  ref,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: DateRangePickerPopupProps): ReactElement {
  const field = useDateRangePickerContext()
  const calendarProps: DateRangePickerCalendarProps = {
    mode: 'range',
    selected: { from: field.preview?.from, to: field.preview?.to },
    // The day pressed, not the range react-day-picker computed from it: which
    // end this fills is the field's decision (the active end), so its own
    // adjust-by-proximity model is deliberately bypassed. `range` is unused.
    onSelect: (_range, triggerDate) => {
      field.setDraft('from', null)
      field.setDraft('to', null)
      const end = field.activeEnd
      const day = startOfDay(triggerDate)
      const next = placeEnd(field.preview, end, day)
      if (field.confirmMode)
        field.stage(next)
      else
        field.setValue(next, createChangeEventDetails('item-press'))
      // Where the day actually ended up, which is not always the end aimed at
      // — sorting can put it in the other one.
      const landedOn: RangeEnd = next[end]?.getTime() === day.getTime()
        ? end
        : end === 'from' ? 'to' : 'from'
      // Still short an end? Go wait in the empty one, so a second press
      // completes the range without reaching for the other input. Otherwise
      // stay on the day just placed — there is nothing left to fill, and
      // hopping away from the user's last move is the jarring part.
      const complete = next.from !== undefined && next.to !== undefined
      const caretEnd: RangeEnd = complete
        ? landedOn
        : next.from === undefined ? 'from' : 'to'
      field.setActiveEnd(caretEnd)
      field.inputRefs[caretEnd].current?.focus()
      // Where the popup's own return focus should land, since the close below
      // would otherwise send it back to whichever input opened the popup.
      field.aimReturnFocus(field.inputRefs[caretEnd].current)
      // Instant mode needs a completion signal to commit and close on; while
      // confirming, the footer is that signal.
      if (!field.confirmMode && complete) {
        field.markSubmitClose()
        field.setOpen(false, createChangeEventDetails('item-press'))
      }
    },
    month: field.month,
    onMonthChange: field.setMonth,
    numberOfMonths: 2,
    disabled: field.disabledDates,
    locale: field.locale,
    captionLayout: 'dropdown',
  }
  return (
    // The portal node, not the popup, is what "inside the field" means once a
    // popup can host popups of its own — Base UI draws the same line
    // (`FloatingFocusManager`'s `contains(portalContext.portalNode, …)`), and
    // it holds because a nested `FloatingPortal` resolves its container to the
    // parent portal node rather than `<body>`. The calendar's month and year
    // lists land there, so the inputs' blur judge recognises them for free.
    <PopoverPrimitive.Portal ref={field.portalRef}>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={field.rootRef}
        className="isolate z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          data-slot="date-range-picker-popup"
          className={cn(popupClassName, className)}
          // Base UI's Combobox treatment for this shape: focus stays on the
          // inputs, so a close has nothing to return. The root's judge spells
          // out the one exception (see `resolveReturnFocus` there); the
          // function form deliberately replaces the focus manager's own
          // guard, which lets a `body` active element through. The caret fix
          // for submitting closes lives in the root's onOpenChangeComplete.
          finalFocus={field.resolveReturnFocus}
          initialFocus={false}
          {...props}
          // The antd treatment: popup mouse presses never take focus away
          // from the field, so a pointer session has no blur/refocus flicker
          // and nothing to return — the guarded default only ever works for
          // keyboard users, whose focus genuinely enters the popup. Chained
          // after the spread so a caller cannot silently unhook it.
          onMouseDown={(event) => {
            onMouseDown?.(event)
            event.preventDefault()
          }}
          ref={ref}
        >
          {typeof children === 'function'
            ? children(calendarProps)
            : (
                <>
                  <Calendar {...calendarProps} />
                  {children}
                </>
              )}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export type DateRangePickerFooterProps = ComponentProps<'div'>
export type DateRangePickerFooterClearProps = ComponentProps<typeof Button>
export type DateRangePickerCancelProps = ComponentProps<typeof Button>
export type DateRangePickerCloseProps = ComponentProps<typeof Button>

/**
 * The action row under the calendar — the DatePicker footer, addressed to
 * this family: a layout shell whose presence switches the popup to confirm
 * mode (picks and typed dates stage; `DateRangePickerClose` or Enter
 * settles; `DateRangePickerCancel`, Escape or clicking away drops the staged
 * range). Compose the action parts and their wording yourself, and normally
 * include a `DateRangePickerClose` — without one, only Enter can settle.
 */
export function DateRangePickerFooter({ className, ...props }: DateRangePickerFooterProps): ReactElement {
  const { setFooterMounted } = useDateRangePickerContext()
  useEffect(() => {
    setFooterMounted(true)
    return () => setFooterMounted(false)
  }, [setFooterMounted])
  return (
    <div
      className={cn(`
        flex items-center justify-end gap-2 border-bs border-border p-2
      `, className)}
      data-slot="date-range-picker-footer"
      {...props}
    />
  )
}

/**
 * Stages an empty range — the popup stays up, `DateRangePickerClose` settles
 * it. `Footer` in the name only disambiguates from the input-side
 * `DateRangePickerClear`.
 */
export function DateRangePickerFooterClear({ onClick, ...props }: DateRangePickerFooterClearProps): ReactElement {
  const field = useDateRangePickerContext()
  return (
    <Button
      data-slot="date-range-picker-footer-clear"
      size="sm"
      type="button"
      {...props}
      // After the spread: a caller listening for clicks must not silently
      // take the clearing away.
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented)
          field.stage(null)
      }}
    />
  )
}

/** Closes the popup without committing — the staged range is dropped. */
export function DateRangePickerCancel({ onClick, ...props }: DateRangePickerCancelProps): ReactElement {
  const field = useDateRangePickerContext()
  return (
    <Button
      data-slot="date-range-picker-cancel"
      size="sm"
      type="button"
      {...props}
      // After the spread for the same reason as the clear's onClick.
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented)
          field.setOpen(false, createChangeEventDetails('close-press', event.nativeEvent))
      }}
    />
  )
}

/**
 * Close-and-commit — Base UI's word for exactly this: commits the staged
 * range (reason `close-press`) and closes the popup.
 */
export function DateRangePickerClose({ onClick, ...props }: DateRangePickerCloseProps): ReactElement {
  const field = useDateRangePickerContext()
  return (
    <Button
      data-slot="date-range-picker-close"
      size="sm"
      type="button"
      {...props}
      // After the spread for the same reason as the clear's onClick.
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented)
          field.confirm(event.nativeEvent)
      }}
    />
  )
}

export function DateRangePicker({
  'aria-label': ariaLabel,
  actionsRef,
  children,
  className,
  clearable = true,
  defaultOpen,
  defaultValue,
  disabled = false,
  disabledDates,
  endPlaceholder,
  format = 'yyyy-MM-dd',
  id,
  inputToValue,
  locale,
  modal = false,
  name,
  onOpenChange,
  onOpenChangeComplete,
  onValueChange,
  open: openProp,
  readOnly = false,
  startPlaceholder,
  value: valueProp,
  ...props
}: DateRangePickerProps): ReactElement {
  // No `onChange` wiring in the hooks: the cancel protocol needs the user
  // callback to run before the state write, so they only hold state and the
  // callbacks fire explicitly in setValue/setOpen.
  const [value, setValueState] = useControllableState<DateRange | null>({
    value: valueProp,
    defaultValue,
    fallback: null,
  })
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    fallback: false,
  })
  const [drafts, setDrafts] = useState<Record<RangeEnd, string | null>>({ from: null, to: null })
  // The calendar's month is internal: it resets to the range's start when the
  // popup opens and follows typing while it is up.
  const [month, setMonth] = useState<Date>(
    () => startOfDay((valueProp ?? defaultValue)?.from ?? new Date()),
  )
  // Confirm mode's staging area: `undefined` = nothing staged. Only a footer
  // (mounted while the popup is open) routes changes through here.
  const [pending, setPending] = useState<DateRange | null | undefined>(undefined)
  const [footerMounted, setFooterMounted] = useState(false)
  // Which end the calendar fills next. Entering an input aims it there, and a
  // press hops it to the other end so a second press completes the range.
  const [activeEnd, setActiveEnd] = useState<RangeEnd>('from')
  // Whether the close now underway submitted a range — after such a close,
  // if Base UI's guarded return-focus landed on one of our inputs, the caret
  // gets settled to the end (a rewritten controlled value parks it at 0).
  const [submittedClose, setSubmittedClose] = useState(false)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const portalRef = useRef<HTMLDivElement | null>(null)
  // Whether the close now underway is one where focus already left the field.
  // Read by `resolveReturnFocus` below, from inside the focus manager's
  // unmount cleanup — a ref, because a state flip would not have rendered by
  // then.
  const focusLeftFieldRef = useRef(false)
  // Where this close should return focus, when a pick has moved the caret away
  // from the input the popup was opened from. `null` leaves the destination to
  // the focus manager (back to where it opened from). The element itself, not
  // the end it belongs to: the inputs' ref callbacks are inline, so React
  // detaches and reattaches them on every render, and the focus manager reads
  // this from inside its unmount cleanup — right where that gap can fall.
  const returnElementRef = useRef<HTMLInputElement | null>(null)
  const fromInputRef = useRef<HTMLInputElement | null>(null)
  const toInputRef = useRef<HTMLInputElement | null>(null)

  const setDraft = (end: RangeEnd, draft: string | null): void =>
    setDrafts(current => ({ ...current, [end]: draft }))

  // The one parsing seam: typed text and the draft-vs-value judge below must
  // speak the same language, or a custom parser's draft would be dropped and
  // reformatted mid-typing.
  const parseText = (text: string, referenceDate: Date): Date | null => {
    if (inputToValue !== undefined) {
      const parsed = inputToValue(text)
      return parsed === null || !isValid(parsed) ? null : startOfDay(parsed)
    }
    const parsed = parseDate(text, format, referenceDate, { locale })
    return isValid(parsed) ? startOfDay(parsed) : null
  }

  // A value change from outside (a form reset, a programmatic set) drops the
  // drafts — otherwise the inputs keep showing ghost text over the new value.
  // Each end's draft survives only the write-back its own typing produced.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    const survives = (end: RangeEnd): boolean => {
      const draft = drafts[end]
      if (draft === null)
        return true
      const committed = value?.[end]
      if (committed === undefined)
        return false
      // The committed date is the parse reference — render-pure, and "did
      // this draft produce that value" is exactly the question being asked.
      const parsed = parseText(draft, committed)
      return parsed !== null && parsed.getTime() === committed.getTime()
    }
    const keepFrom = survives('from')
    const keepTo = survives('to')
    if (!keepFrom || !keepTo) {
      setDrafts(current => ({
        from: keepFrom ? current.from : null,
        to: keepTo ? current.to : null,
      }))
    }
  }

  const setValue = (
    next: DateRange | null,
    eventDetails: DateRangePickerChangeEventDetails = createChangeEventDetails('none'),
  ): void => {
    onValueChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    setValueState(next)
  }

  const setOpen = (next: boolean, eventDetails: DateRangePickerOpenChangeEventDetails): void => {
    if (next === open)
      return
    onOpenChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    if (next) {
      setMonth(startOfDay(value?.from ?? new Date()))
      setSubmittedClose(false)
      focusLeftFieldRef.current = false
      returnElementRef.current = null
    }
    else {
      // Closing settles confirm mode: whatever was staged and not confirmed
      // is dropped — dismissing IS the cancel (the MUI/antd treatment).
      setPending(undefined)
      // Every close funnels through here, so this is where the two reasons
      // that mean "focus already left" are recognised. A press on empty space
      // blurs the input first, which is the input's own `focus-out` close —
      // it never reaches Base UI as an outside press.
      focusLeftFieldRef.current
        = eventDetails.reason === 'focus-out' || eventDetails.reason === 'outside-press'
    }
    setOpenState(next)
  }

  const confirm = (event: Event): void => {
    if (pending !== undefined)
      setValue(pending, createChangeEventDetails('close-press', event))
    setSubmittedClose(true)
    setOpen(false, createChangeEventDetails('close-press', event))
  }

  const handleOpenChangeComplete = (nextOpen: boolean): void => {
    // A submitting close rewrote the controlled values, which parks a blurred
    // input's caret at 0. Base UI's guarded return focus has run by now — if
    // it landed on either of our inputs, settle that caret to the end; where
    // focus went is entirely its call (the industry behaviour: back to where
    // the popup was opened from, never stolen).
    if (!nextOpen && submittedClose) {
      setSubmittedClose(false)
      // A frame later: Base UI's return focus runs in a microtask after the
      // popup unmounts, which is after this callback fires. Only touch the
      // selection when it is actually off — `setSelectionRange` restarts the
      // caret blink and disturbs the focus ring, and Chrome already parks a
      // focused input's caret at the end on a value rewrite, so the pointer
      // path must stay untouched (this is for keyboard return focus).
      requestAnimationFrame(() => {
        const active = document.activeElement
        const input = [fromInputRef.current, toInputRef.current].find(candidate => candidate !== null && candidate === active)
        if (input === undefined || input === null)
          return
        const end = input.value.length
        if (input.selectionStart !== end || input.selectionEnd !== end)
          input.setSelectionRange(end, end)
      })
    }
    onOpenChangeComplete?.(nextOpen)
  }

  const commitDraft = (end: RangeEnd, event: Event): void => {
    const draft = drafts[end]
    if (draft === null)
      return
    setDraft(end, null)
    const current = pending !== undefined ? pending : value
    const settle = (next: DateRange | null, reason: 'input-change' | 'input-clear'): void => {
      if (sameRange(next, current))
        return
      // While confirming, this stages like every other popup-open change.
      if (footerMounted)
        setPending(next)
      else
        setValue(next, createChangeEventDetails(reason, event))
    }
    if (draft.trim() === '') {
      // Emptying one input empties that end only; the range goes once both
      // ends are gone.
      settle(current === null ? null : dropEnd(current, end), 'input-clear')
      return
    }
    // Text that parsed but was held back because it would have moved the
    // other end (see the typing guard). Leaving the field is the moment the
    // intent is complete, so it settles under the full rule now.
    const day = parseText(draft, new Date())
    if (day === null || (disabledDates !== undefined && dateMatchModifiers(day, disabledDates)))
      return
    settle(placeEnd(current, end, day), 'input-change')
  }

  const handlePrimitiveOpenChange = (
    nextOpen: boolean,
    eventDetails: PopoverPrimitive.Root.ChangeEventDetails,
  ): void => {
    // A press inside our own box or on our own label is not an outside press
    // — the DatePicker correction, verbatim.
    if (!nextOpen && LABEL_PRESS_REASONS.has(eventDetails.reason)) {
      const target = eventDetails.event.target
      if (isOwnLabelPress(eventDetails.event, fromInputRef.current)
        || (target instanceof Node && rootRef.current?.contains(target) === true)) {
        eventDetails.cancel()
      }
    }
    // Focus leaving through the popup's far side never blurs the inputs, so
    // the drafts settle here.
    if (!nextOpen && eventDetails.reason === 'focus-out') {
      commitDraft('from', eventDetails.event)
      commitDraft('to', eventDetails.event)
    }
    setOpen(nextOpen, eventDetails)
  }

  // Base UI's own Combobox is this exact shape — typeable inputs outside the
  // popup — and it passes `finalFocus={false}`: focus never went into the
  // popup, so there is nothing to return, and returning anyway is what makes
  // the ring and caret blink off and back on. (Its guarded boolean default
  // waves through any close whose active element is `body` — see
  // FloatingFocusManager's `activeEl !== doc.body` clause — and a press on
  // empty space parks focus on exactly that.)
  //
  // Not a flat `false` only because the calendar navigates by real focus
  // where Combobox's list is virtual: a keyboard user's focus genuinely goes
  // into the popup, and Escape has to bring it back. So only the closes where
  // focus already left get refused — keyed off the reason recorded in
  // `setOpen` rather than off where focus sits, because by the time this runs
  // the popup's ref is already detached. `true` hands the destination to the
  // manager (back to whichever input opened the popup); a pick that moved the
  // caret names its own input instead, or the range just assembled would send
  // the caret back to the end the user started from.
  const resolveReturnFocus = (): HTMLInputElement | boolean => {
    if (focusLeftFieldRef.current)
      return false
    return returnElementRef.current ?? true
  }

  const preview = pending !== undefined ? pending : value
  // Filled follows what the inputs are showing, not the committed value —
  // Base UI's own reading (FieldControl flips `filled` off the DOM input's
  // text on every keystroke). Keyed off the committed value it lags a whole
  // popup cycle in confirm mode: the inputs preview the staged range with the
  // clear button still hidden, and it pops in the instant the popup closes.
  const endShown = (end: RangeEnd): boolean => {
    const draft = drafts[end]
    if (draft !== null)
      return draft.trim() !== ''
    return preview !== null && preview[end] !== undefined
  }
  const state: DateRangePickerState = { filled: endShown('from') || endShown('to'), open, disabled, readOnly }
  // Not memoised: `drafts` changes on every keystroke anyway, so a stable
  // identity would buy nothing and only hide the dependency. (The documented
  // exception to the provider-value-must-memo rule.)
  const context: DateRangePickerContextValue = {
    ...state,
    value,
    preview,
    confirmMode: footerMounted,
    drafts,
    clearable,
    format,
    locale,
    disabledDates,
    startPlaceholder,
    endPlaceholder,
    id,
    activeEnd,
    setActiveEnd,
    inputRefs: { from: fromInputRef, to: toInputRef },
    rootRef,
    portalRef,
    setDraft,
    setValue,
    commitDraft,
    parseText,
    setOpen,
    month,
    setMonth,
    stage: setPending,
    confirm,
    setFooterMounted,
    markSubmitClose: () => setSubmittedClose(true),
    aimReturnFocus: (element: HTMLInputElement | null) => {
      returnElementRef.current = element
    },
    resolveReturnFocus,
  }

  const defaultChildren = (
    <InputGroup>
      <DateRangePickerStartInput />
      <IconArrowNarrowRight
        aria-hidden
        className="shrink-0 text-muted-foreground block-4 inline-4"
      />
      <DateRangePickerEndInput />
      {!readOnly && <DateRangePickerClear />}
      {!readOnly && <DateRangePickerTrigger />}
    </InputGroup>
  )

  // Layered takeover: an unwritten part stays present by default. Children
  // replace the input side; the popup defaults in unless one is composed.
  // Resolved before the search so a function child's composition counts too.
  const resolvedChildren = resolveRenderChildren(children, state, defaultChildren)
  const hasComposedPopup = findComposedPart(resolvedChildren, DateRangePickerPopup) !== undefined
  return (
    <DateRangePickerContext value={context}>
      <div
        aria-label={ariaLabel}
        className={cn('group/date-range-picker inline-full', className)}
        data-disabled={dataAttr(disabled)}
        data-empty={dataAttr(!state.filled)}
        data-open={dataAttr(open)}
        data-readonly={dataAttr(readOnly)}
        data-slot="date-range-picker"
        ref={rootRef}
        role="group"
        {...props}
      >
        <PopoverPrimitive.Root
          actionsRef={actionsRef}
          modal={modal}
          open={open}
          onOpenChange={handlePrimitiveOpenChange}
          onOpenChangeComplete={handleOpenChangeComplete}
        >
          {resolvedChildren}
          {hasComposedPopup ? null : <DateRangePickerPopup />}
        </PopoverPrimitive.Root>
        {name !== undefined && (
          // Always mounted, outside the portal: the popup unmounts on close,
          // and keys that flicker in and out of FormData are worse than ''.
          <>
            <input
              disabled={disabled}
              name={name}
              type="hidden"
              value={value?.from === undefined ? '' : formatDate(value.from, SERIAL_FORMAT)}
            />
            <input
              disabled={disabled}
              name={name}
              type="hidden"
              value={value?.to === undefined ? '' : formatDate(value.to, SERIAL_FORMAT)}
            />
          </>
        )}
      </div>
    </DateRangePickerContext>
  )
}
