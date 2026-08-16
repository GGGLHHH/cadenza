'use client'

import type { Locale } from 'date-fns'
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import type { DateRange as DayPickerRange, Matcher } from 'react-day-picker'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { IconArrowNarrowRight, IconCalendar, IconX } from '@tabler/icons-react'
import { format as formatDate, isValid, parse as parseDate, startOfDay } from 'date-fns'
import { createContext, use, useRef, useState } from 'react'
import { dateMatchModifiers } from 'react-day-picker'
import { createChangeEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { isOwnLabelPress, LABEL_PRESS_REASONS } from '#lib/own-label-press'
import { popupClassName, SERIAL_FORMAT } from '#lib/popup'
import { cn, dataAttr } from '#lib/utils'
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
 * Typing into either end commits as soon as it parses; a typed start past the
 * end drops the end rather than silently reordering. Picking in the calendar
 * closes only once both ends are chosen.
 */

/** The committed range. `to` is open while the gesture is half done. */
export interface DateRange {
  from: Date
  to?: Date
}

/** Why the value changed. Clearing is a reason, not a separate callback. */
export type DateRangePickerChangeEventReason
  = 'input-change' | 'input-clear' | 'item-press' | 'clear-press' | 'none'

export type DateRangePickerChangeEventDetails = ChangeEventDetails<DateRangePickerChangeEventReason>

/** Why the popup opened or closed — Base UI's reasons plus the seam's input-side gestures. */
export type DateRangePickerOpenChangeEventReason
  = PopoverPrimitive.Root.ChangeEventReason
    | 'input-press' | 'item-press' | 'list-navigation' | 'keyboard'

export type DateRangePickerOpenChangeEventDetails = ChangeEventDetails<DateRangePickerOpenChangeEventReason>

/** What the root's parts read, and what function children are handed. */
export interface DateRangePickerState {
  /** Something is picked — Base UI's Field word (`data-filled`). */
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
}

type RangeEnd = 'from' | 'to'

interface DateRangePickerContextValue extends DateRangePickerState {
  value: DateRange | null
  drafts: Record<RangeEnd, string | null>
  clearable: boolean
  format: string
  locale: Locale | undefined
  disabledDates: Matcher | Matcher[] | undefined
  startPlaceholder?: string
  endPlaceholder?: string
  id?: string
  inputRefs: Record<RangeEnd, RefObject<HTMLInputElement | null>>
  rootRef: RefObject<HTMLDivElement | null>
  popupRef: RefObject<HTMLDivElement | null>
  setDraft: (end: RangeEnd, draft: string | null) => void
  setValue: (value: DateRange | null, eventDetails?: DateRangePickerChangeEventDetails) => void
  /** Settles one end's draft: commit an empty draft as a clear, drop an unparseable one. */
  commitDraft: (end: RangeEnd, event: Event) => void
  /** Typed text → day (already start-of-day normalised), `null` when it is not a date yet. */
  parseText: (text: string, referenceDate: Date) => Date | null
  setOpen: (open: boolean, eventDetails: DateRangePickerOpenChangeEventDetails) => void
  month: Date
  setMonth: (month: Date) => void
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
  onKeyDown,
  ref,
  ...props
}: RangeInputProps): ReactElement {
  const field = useDateRangePickerContext()
  const committed = field.value === null ? undefined : field.value[end]
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
      onBlur={(event) => {
        onBlur?.(event)
        const next = event.relatedTarget
        // Hopping to the other end settles this one but stays in the field.
        const other: RangeEnd = end === 'from' ? 'to' : 'from'
        if (next !== null && next === field.inputRefs[other].current) {
          field.commitDraft(end, event.nativeEvent)
          return
        }
        // Focus moving into our own box or popup is not leaving the field.
        // Base UI's focus guards render inside the root, so a Tab that is
        // about to land in the calendar answers `rootRef.contains` too.
        if (next !== null && (field.rootRef.current?.contains(next)
          || field.popupRef.current?.contains(next))) {
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
            const current = field.value
            let next: DateRange | null = null
            if (end === 'from') {
              // A start past the end drops the end rather than reordering:
              // the field the user is editing must keep showing what they
              // typed.
              next = current?.to !== undefined && day.getTime() <= current.to.getTime()
                ? { from: day, to: current.to }
                : { from: day }
            }
            else {
              // ponytail: an end typed before any start stays a draft — the
              // value's `from` anchor is required. Pick the start first (the
              // calendar always does).
              next = current !== null && day.getTime() >= current.from.getTime()
                ? { from: current.from, to: day }
                : null
            }
            const same = next !== null && current !== null
              && next.from.getTime() === current.from.getTime()
              && next.to?.getTime() === current.to?.getTime()
            if (next !== null && !same) {
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
            // draft, not submitting the form.
            event.preventDefault()
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
      className="group-data-empty/date-range-picker:hidden"
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
       * Replaces the default two-month calendar. A function receives the
       * seam's calendar wiring — spread it into your own `<Calendar>` and add
       * props on top: `{(calendar) => <Calendar {...calendar} numberOfMonths={1} />}`.
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
  ref,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: DateRangePickerPopupProps): ReactElement {
  const field = useDateRangePickerContext()
  const calendarProps: DateRangePickerCalendarProps = {
    mode: 'range',
    selected: field.value ?? undefined,
    onSelect: (range, triggerDate) => {
      field.setDraft('from', null)
      field.setDraft('to', null)
      if (range?.from === undefined) {
        field.setValue(null, createChangeEventDetails('item-press'))
        return
      }
      // react-day-picker's first press reports `{from: day, to: day}`, which
      // reads as a finished range. The stored shape drives the gesture
      // instead: a fresh press (nothing yet, or a full range being restarted)
      // stores half a range, and react-day-picker continues from a half one
      // by completing it.
      const startingFresh = field.value === null || field.value.to !== undefined
      if (startingFresh) {
        field.setValue({ from: startOfDay(triggerDate) }, createChangeEventDetails('item-press'))
        return
      }
      const next: DateRange = range.to === undefined
        ? { from: range.from }
        : { from: range.from, to: range.to }
      field.setValue(next, createChangeEventDetails('item-press'))
      // Half a range keeps the popup up — the gesture is not finished.
      if (next.to !== undefined)
        field.setOpen(false, createChangeEventDetails('item-press'))
    },
    month: field.month,
    onMonthChange: field.setMonth,
    numberOfMonths: 2,
    disabled: field.disabledDates,
    locale: field.locale,
  }
  return (
    <PopoverPrimitive.Portal>
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
          finalFocus={field.inputRefs.from}
          initialFocus={false}
          {...props}
          // Claimed, not taken: the caller's ref still gets the element. The
          // inputs' blur needs it to tell "into our popup" from "away".
          ref={(node: HTMLDivElement | null) => {
            field.popupRef.current = node
            if (typeof ref === 'function')
              return ref(node)
            if (ref !== null && ref !== undefined)
              ref.current = node
          }}
        >
          {typeof children === 'function'
            ? children(calendarProps)
            : children ?? <Calendar {...calendarProps} />}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
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

  const rootRef = useRef<HTMLDivElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
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
    if (next)
      setMonth(startOfDay(value?.from ?? new Date()))
    setOpenState(next)
  }

  const commitDraft = (end: RangeEnd, event: Event): void => {
    const draft = drafts[end]
    if (draft === null)
      return
    setDraft(end, null)
    if (draft.trim() === '') {
      // Emptying the start clears the range (the anchor is gone); emptying
      // the end keeps the start.
      if (end === 'from' && value !== null)
        setValue(null, createChangeEventDetails('input-clear', event))
      if (end === 'to' && value?.to !== undefined)
        setValue({ from: value.from }, createChangeEventDetails('input-clear', event))
    }
    // A parseable draft already committed on change; anything else reverts to
    // the formatted value by dropping the draft.
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

  const state: DateRangePickerState = { filled: value !== null, open, disabled, readOnly }
  // Not memoised: `drafts` changes on every keystroke anyway, so a stable
  // identity would buy nothing and only hide the dependency. (The documented
  // exception to the provider-value-must-memo rule.)
  const context: DateRangePickerContextValue = {
    ...state,
    value,
    drafts,
    clearable,
    format,
    locale,
    disabledDates,
    startPlaceholder,
    endPlaceholder,
    id,
    inputRefs: { from: fromInputRef, to: toInputRef },
    rootRef,
    popupRef,
    setDraft,
    setValue,
    commitDraft,
    parseText,
    setOpen,
    month,
    setMonth,
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
          onOpenChangeComplete={onOpenChangeComplete}
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
              value={value === null ? '' : formatDate(value.from, SERIAL_FORMAT)}
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
