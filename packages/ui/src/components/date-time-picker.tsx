'use client'

import type { Locale } from 'date-fns'
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import type { Matcher } from 'react-day-picker'
import type { ChangeEventDetails } from '#lib/change-event-details'
import type { TimeGranularity } from '#lib/time'
import type { DatePickerCalendarProps } from './date-picker'
import type { TimePickerColumnsProps } from './time-picker'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { IconCalendarTime, IconX } from '@tabler/icons-react'
import {
  addMinutes,
  addSeconds,
  format as formatDate,
  isSameDay,
  isValid,
  parse as parseDate,
  set,
  startOfDay,
} from 'date-fns'
import { createContext, use, useEffect, useRef, useState } from 'react'
import { dateMatchModifiers } from 'react-day-picker'
import { createChangeEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { isOwnLabelPress, LABEL_PRESS_REASONS } from '#lib/own-label-press'
import { popupClassName, SERIAL_FORMAT } from '#lib/popup'
import { granularityOf, timeSerialFormat, truncateTime } from '#lib/time'
import { cn, dataAttr } from '#lib/utils'
import { Button } from './button'
import { Calendar } from './calendar'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group'
import { TimeColumns } from './time-columns'

/**
 * The published DateTimePicker family — the DatePicker treatment for a date
 * and a time together: one editable field (`yyyy-MM-dd HH:mm` by default), and
 * a popup holding the promoted `Calendar` beside `TimeColumns`.
 *
 * Everything but the panel is DatePicker's, mechanism for mechanism; where a
 * comment here is short, the long reason is on the DatePicker part of the same
 * name. Like TimePicker, **a pick does not close the popup**: a day alone is
 * not a date-time, and neither is an hour. Picks commit as they happen;
 * Escape, Enter, a press outside or Tab leaving the field closes it.
 *
 * - **A day pick keeps the time**, a time pick keeps the day. With no value
 *   yet, a day starts at midnight and a time starts on today.
 * - **`min` / `max` are instants**: days outside them are disabled in the
 *   calendar, and on the boundary day the columns disable the times past the
 *   bound. A pick that would cross a bound lands on it instead (rounded onto
 *   the minute step), so the field never holds a value it would refuse typed.
 * - **`disabledDates`** is DatePicker's: react-day-picker matchers, typed
 *   values on a matched day are rejected too.
 *
 * The value is normalised to the format's smallest unit (seconds zeroed
 * unless the format shows them). The root is a plain `<div>`, so its
 * `className` is honestly a string; style off `data-empty`, `data-open`,
 * `data-disabled`, `data-readonly`.
 */

/** Why the value changed. Clearing is a reason, not a separate callback; `close-press` is the footer's confirm. */
export type DateTimePickerChangeEventReason
  = 'input-change' | 'input-clear' | 'item-press' | 'clear-press' | 'close-press' | 'none'

export type DateTimePickerChangeEventDetails = ChangeEventDetails<DateTimePickerChangeEventReason>

/**
 * Why the popup opened or closed. Base UI's own reasons pass through
 * untouched; the seam adds the input-side gestures it wires itself. No
 * `item-press`: a pick never closes.
 */
export type DateTimePickerOpenChangeEventReason
  = PopoverPrimitive.Root.ChangeEventReason
    | 'input-press' | 'list-navigation' | 'keyboard'

export type DateTimePickerOpenChangeEventDetails = ChangeEventDetails<DateTimePickerOpenChangeEventReason>

/** What the root's parts read, and what function children are handed. */
export interface DateTimePickerState {
  /** The input is showing something — Base UI's Field word, read off the visible text (draft, staged or committed). */
  filled: boolean
  open: boolean
  disabled: boolean
  readOnly: boolean
}

/** The calendar wiring — DatePicker's, re-aliased to this family. */
export type DateTimePickerCalendarProps = DatePickerCalendarProps
/** The columns wiring — TimePicker's, re-aliased to this family. */
export type DateTimePickerColumnsProps = TimePickerColumnsProps

/** What a popup function child receives: both wirings, to spread into your own `Calendar` and `TimeColumns`. */
export interface DateTimePickerPanelProps {
  calendar: DateTimePickerCalendarProps
  columns: DateTimePickerColumnsProps
}

interface DateTimePickerContextValue extends DateTimePickerState {
  'value': Date | null
  /** What the input and panel show: the staged value while confirming, the committed one otherwise. */
  'preview': Date | null
  /** A `DateTimePickerFooter` is mounted: picks stage instead of committing. */
  'confirmMode': boolean
  'draft': string | null
  'clearable': boolean
  'format': string
  'granularity': TimeGranularity
  'locale': Locale | undefined
  'minuteStep': number
  'min': Date | undefined
  'max': Date | undefined
  /** The calendar's matchers: `disabledDates` plus the days outside `min`/`max`. */
  'disabledDays': Matcher[]
  'placeholder'?: string
  'id'?: string
  'aria-label'?: string
  'inputRef': RefObject<HTMLInputElement | null>
  'rootRef': RefObject<HTMLDivElement | null>
  'portalRef': RefObject<HTMLDivElement | null>
  'setDraft': (draft: string | null) => void
  'setValue': (value: Date | null, eventDetails?: DateTimePickerChangeEventDetails) => void
  /** Settles the draft: commit an empty draft as a clear, drop an unparseable one. */
  'commitDraft': (event: Event) => void
  /** Typed text → date-time (already normalised), `null` when it is not one yet. */
  'parseText': (text: string, referenceDate: Date) => Date | null
  /** Whether the field may hold this value: off disabled days, inside the bounds, on the minute step. */
  'isAllowed': (value: Date) => boolean
  /** Pulls a picked value back onto the bound it crossed. */
  'clamp': (value: Date) => Date
  'setOpen': (open: boolean, eventDetails: DateTimePickerOpenChangeEventDetails) => void
  'month': Date
  'setMonth': (month: Date) => void
  /** Stages a value while confirming instead of committing it; `undefined` drops the stage. */
  'stage': (next: Date | null | undefined) => void
  /** Commits the staged value (reason `close-press`) and closes. */
  'confirm': (event: Event) => void
  'setFooterMounted': (mounted: boolean) => void
  /** The popup's `finalFocus`: whether this close should return focus at all (see the root). */
  'resolveReturnFocus': () => boolean
}

const DateTimePickerContext = createContext<DateTimePickerContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  DateTimePickerContext.displayName = 'DateTimePickerContext'

function useDateTimePickerContext(): DateTimePickerContextValue {
  const context = use(DateTimePickerContext)
  if (context === null)
    throw new Error('cadenza-ui: DateTimePickerContext is missing. DateTimePicker parts must be placed within <DateTimePicker>.')
  return context
}

// `onChange` joins the omitted div props: the root is a `<div>`, and an
// intersection with its native handler would demand a callback satisfying
// both signatures. Ours never reaches the element.
export type DateTimePickerProps
  = Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'>
    & {
      /** Controlled value. `null` is the controlled empty value. */
      'value'?: Date | null
      /** Uncontrolled initial value. */
      'defaultValue'?: Date | null
      /**
       * Fires on every committed change with why it happened (`reason:
       * 'clear-press'`/`'input-clear'` replaces an `onClear` callback).
       * `eventDetails.cancel()` rejects the change entirely.
       */
      'onValueChange'?: (value: Date | null, eventDetails: DateTimePickerChangeEventDetails) => void
      /** Controlled popup state. */
      'open'?: boolean
      /** Whether the popup is initially open. */
      'defaultOpen'?: boolean
      /** Fires when the popup opens or closes. `cancel()` keeps it where it is. */
      'onOpenChange'?: (open: boolean, eventDetails: DateTimePickerOpenChangeEventDetails) => void
      /** Fires after the popup's open/close animation completes. */
      'onOpenChangeComplete'?: (open: boolean) => void
      /** Imperative popup actions (`unmount`, `close`), Base UI's own type. */
      'actionsRef'?: PopoverPrimitive.Root.Props['actionsRef']
      /** Base UI's modal switch, pinned to `false`: an inline field must not lock the page. */
      'modal'?: PopoverPrimitive.Root.Props['modal']
      /**
       * The display and parse format, date-fns tokens. A seconds token (`s`)
       * adds the seconds column. The hidden input always serialises as
       * `yyyy-MM-ddTHH:mm` (`…:ss` with seconds) — `<input type="datetime-local">`'s
       * wire format — whatever is shown.
       */
      'format'?: string
      /** date-fns locale for formatting, parsing and the calendar. */
      'locale'?: Locale
      /**
       * Replaces how typed text parses into a date-time. `null` means "not
       * one yet". Must be pure; the result is normalised like a pick. Defaults
       * to strict parsing by `format`.
       */
      'inputToValue'?: (text: string) => Date | null
      /** Days the calendar disables — react-day-picker matchers. A typed value on a matched day is rejected too. */
      'disabledDates'?: Matcher | Matcher[]
      /** Earliest value, an instant: earlier days and times are disabled. */
      'min'?: Date
      /** Latest value, an instant: later days and times are disabled. */
      'max'?: Date
      /** Minutes offered (and accepted) are multiples of this. */
      'minuteStep'?: number
      /** With a name, a hidden input serialises the value for the form. */
      'name'?: string
      'disabled'?: boolean
      'readOnly'?: boolean
      /**
       * The clear affordance's master switch, default ON — `false` removes the
       * clear button everywhere, an explicitly composed `DateTimePickerClear`
       * included.
       */
      'clearable'?: boolean
      /** Placeholder for the default composition's input. */
      'placeholder'?: string
      /** Forwarded to the input, so a `FieldLabel htmlFor` reaches it. */
      'id'?: string
      /** Accessible name for the default composition's input. */
      'aria-label'?: string
      /**
       * Replaces the default composition (input, clear, picker button).
       * Compose the parts yourself inside the root; the popup stays present
       * unless a `DateTimePickerPopup` is composed. A function receives the
       * field's state plus the default composition as `defaultChildren`.
       */
      'children'?: ReactNode | ((state: DateTimePickerState & { defaultChildren: ReactNode }) => ReactNode)
    }

export type DateTimePickerInputProps = ComponentProps<typeof InputGroupInput>
export type DateTimePickerTriggerProps = ComponentProps<typeof InputGroupButton>
export type DateTimePickerClearProps = ComponentProps<typeof InputGroupButton>

/**
 * The text input — the `DatePickerInput` treatment. While it has focus the raw
 * draft is shown; otherwise the committed value, formatted. Carries no
 * `data-slot` of its own: `InputGroupInput`'s is the focus-ring contract.
 */
export function DateTimePickerInput({
  className,
  onBlur,
  onChange,
  onClick,
  onKeyDown,
  ref,
  ...props
}: DateTimePickerInputProps): ReactElement {
  const field = useDateTimePickerContext()
  const text = field.draft
    ?? (field.preview === null ? '' : formatDate(field.preview, field.format, { locale: field.locale }))
  return (
    <InputGroupInput
      aria-expanded={field.open}
      aria-haspopup="dialog"
      aria-label={field['aria-label']}
      autoComplete="off"
      className={className}
      disabled={field.disabled}
      id={field.id}
      readOnly={field.readOnly}
      value={text}
      {...props}
      // Claimed, not taken: the caller's ref still gets the element. The
      // root's label-press and final-focus wiring need it.
      ref={(node: HTMLInputElement | null) => {
        field.inputRef.current = node
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
        // Focus moving into our own box or portal is not leaving the field —
        // the portal node, which also answers for the calendar's month and
        // year lists (popups of their own, nested into it).
        if (next !== null && (field.rootRef.current?.contains(next)
          || field.portalRef.current?.contains(next))) {
          return
        }
        field.commitDraft(event.nativeEvent)
        if (field.open)
          field.setOpen(false, createChangeEventDetails('focus-out', event.nativeEvent))
      }}
      onChange={(event) => {
        const raw = event.target.value
        field.setDraft(raw)
        const dateTime = field.parseText(raw, new Date())
        if (dateTime !== null) {
          const same = field.preview !== null && dateTime.getTime() === field.preview.getTime()
          if (field.isAllowed(dateTime) && !same) {
            if (field.confirmMode)
              field.stage(dateTime)
            else
              field.setValue(dateTime, createChangeEventDetails('input-change', event.nativeEvent))
            field.setMonth(startOfDay(dateTime))
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
          field.commitDraft(event.nativeEvent)
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

/**
 * The picker button — the DatePicker trigger, addressed to this family. Out
 * of the tab order (ArrowDown from the input opens), absent from the
 * read-only default composition, for the reasons documented on
 * `DatePickerTrigger`.
 */
export function DateTimePickerTrigger({
  children,
  className,
  onClick,
  ...props
}: DateTimePickerTriggerProps): ReactElement {
  const field = useDateTimePickerContext()
  return (
    <InputGroupAddon align="inline-end" data-slot="date-time-picker-trigger-addon">
      <InputGroupButton
        // English aria-only fallback, the house pattern: it never renders
        // visibly, and a caller-passed aria-label wins.
        aria-label="Open date and time picker"
        className={className}
        data-slot="date-time-picker-trigger"
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
        {children ?? <IconCalendarTime aria-hidden />}
      </InputGroupButton>
    </InputGroupAddon>
  )
}

/**
 * The clear button — the DatePicker clear, addressed to this family. Hides
 * itself while the field is empty (`invisible`, keeping its box: no layout
 * shift when a value lands).
 */
export function DateTimePickerClear({
  className,
  children,
  onClick,
  ...props
}: DateTimePickerClearProps): ReactElement | null {
  const field = useDateTimePickerContext()
  if (!field.clearable)
    return null
  return (
    <InputGroupAddon
      align="inline-end"
      className="group-data-empty/date-time-picker:invisible"
      data-slot="date-time-picker-clear-addon"
    >
      <InputGroupButton
        aria-label="Clear date and time"
        className={cn('rounded-full', className)}
        data-slot="date-time-picker-clear"
        disabled={field.disabled}
        // Out of the tab order on purpose: keyboard users clear by emptying
        // the text.
        tabIndex={-1}
        {...props}
        // After the spread for the same reason as the trigger's onClick.
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented)
            return
          field.setDraft(null)
          // A staged-but-unconfirmed pick is part of what this button clears —
          // left in place, confirming would resurrect it.
          field.stage(undefined)
          field.setValue(null, createChangeEventDetails('clear-press', event.nativeEvent))
        }}
      >
        {children ?? <IconX aria-hidden />}
      </InputGroupButton>
    </InputGroupAddon>
  )
}

// `initialFocus`/`finalFocus` are the field's, not the caller's: focus stays in
// the input while picking, and returns there when a close should return it.
export type DateTimePickerPopupProps
  = Omit<PopoverPrimitive.Popup.Props, 'children' | 'initialFocus' | 'finalFocus'>
    & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
    & {
      /**
       * Extends or replaces the popup's content. Plain children render BELOW
       * the default panel (`<DateTimePickerPopup><DateTimePickerFooter …/></DateTimePickerPopup>`);
       * a function replaces the panel entirely — it receives both wirings to
       * spread into your own:
       * `{({ calendar, columns }) => <><Calendar {...calendar} /><TimeColumns {...columns} /></>}`.
       */
      children?: ReactNode | ReactNode[] | ((panelProps: DateTimePickerPanelProps) => ReactNode)
    }

/**
 * Portal + Positioner + Popup in one part, anchored to the root's box — the
 * DatePicker popup with `TimeColumns` beside the calendar.
 */
export function DateTimePickerPopup({
  align = 'start',
  alignOffset = 0,
  children,
  className,
  onMouseDown,
  ref,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: DateTimePickerPopupProps): ReactElement {
  const field = useDateTimePickerContext()
  // Both halves commit the same way: staged while confirming, committed
  // otherwise — and the popup stays up either way (see the family JSDoc).
  const take = (next: Date): void => {
    field.setDraft(null)
    if (field.confirmMode)
      field.stage(next)
    else
      field.setValue(next, createChangeEventDetails('item-press'))
  }
  const calendarProps: DateTimePickerCalendarProps = {
    mode: 'single',
    selected: field.preview ?? undefined,
    // Re-picking the selected day reports `undefined`; the trigger date keeps
    // it a confirmation instead of a surprise deselection.
    onSelect: (date, triggerDate) => {
      const time = field.preview
      take(field.clamp(truncateTime(set(startOfDay(date ?? triggerDate), {
        hours: time?.getHours() ?? 0,
        minutes: time?.getMinutes() ?? 0,
        seconds: time?.getSeconds() ?? 0,
      }), field.granularity)))
    },
    month: field.month,
    onMonthChange: field.setMonth,
    disabled: field.disabledDays,
    locale: field.locale,
    captionLayout: 'dropdown',
  }
  // The columns only know times of day, so the bounds reach them only on the
  // boundary day — the day the value is on. With no value yet nothing is
  // disabled; a first pick past a bound is clamped onto it like any other.
  const onBoundaryDay = (bound: Date | undefined): Date | undefined =>
    bound !== undefined && field.preview !== null && isSameDay(field.preview, bound) ? bound : undefined
  const columnsProps: DateTimePickerColumnsProps = {
    value: field.preview,
    onValueChange: time => take(field.clamp(time)),
    granularity: field.granularity,
    minuteStep: field.minuteStep,
    min: onBoundaryDay(field.min),
    max: onBoundaryDay(field.max),
  }
  return (
    // The portal node, not the popup, is what "inside the field" means — the
    // DatePicker popup's reasoning, Base UI's own line.
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
          data-slot="date-time-picker-popup"
          className={cn(popupClassName, className)}
          // Base UI's Combobox treatment for this shape — focus stays on the
          // input; the root's judge spells out when a close still returns it.
          finalFocus={field.resolveReturnFocus}
          initialFocus={false}
          {...props}
          // The antd treatment: popup mouse presses never take focus away from
          // the field. Chained after the spread so a caller cannot silently
          // unhook it.
          onMouseDown={(event) => {
            onMouseDown?.(event)
            event.preventDefault()
          }}
          ref={ref}
        >
          {typeof children === 'function'
            ? children({ calendar: calendarProps, columns: columnsProps })
            : (
                <>
                  {/* A grid, not a flex row: the columns hold 24 or 60 options
                      but must stand exactly as tall as the calendar, whose
                      height changes with the month's week count. At zero
                      height they add nothing to the row track, and a
                      percentage min-height on a grid item resolves against its
                      grid area — the track the calendar alone sized. A flex
                      row has no such second pass. */}
                  <div className="grid grid-flow-col">
                    <Calendar {...calendarProps} />
                    <TimeColumns
                      {...columnsProps}
                      className="border-s block-0 min-block-full"
                    />
                  </div>
                  {children}
                </>
              )}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export type DateTimePickerFooterProps = ComponentProps<'div'>
export type DateTimePickerFooterClearProps = ComponentProps<typeof Button>
export type DateTimePickerCancelProps = ComponentProps<typeof Button>
export type DateTimePickerCloseProps = ComponentProps<typeof Button>

/**
 * The action row under the panel — the DatePicker footer, addressed to this
 * family: a layout shell whose presence IS confirm mode. While it is mounted,
 * picks and typed values stage instead of committing, and only
 * `DateTimePickerClose` (or Enter) settles them — `DateTimePickerCancel`,
 * Escape or a press outside drops the staged value.
 */
export function DateTimePickerFooter({ className, ...props }: DateTimePickerFooterProps): ReactElement {
  const { setFooterMounted } = useDateTimePickerContext()
  useEffect(() => {
    setFooterMounted(true)
    return () => setFooterMounted(false)
  }, [setFooterMounted])
  return (
    <div
      className={cn(`
        flex items-center justify-end gap-2 border-bs border-border p-2
      `, className)}
      data-slot="date-time-picker-footer"
      {...props}
    />
  )
}

/**
 * Stages an empty value — the popup stays up, `DateTimePickerClose` settles
 * it. `Footer` in the name only disambiguates from the input-side
 * `DateTimePickerClear`.
 */
export function DateTimePickerFooterClear({ onClick, ...props }: DateTimePickerFooterClearProps): ReactElement {
  const field = useDateTimePickerContext()
  return (
    <Button
      data-slot="date-time-picker-footer-clear"
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

/** Closes the popup without committing — the staged value is dropped. */
export function DateTimePickerCancel({ onClick, ...props }: DateTimePickerCancelProps): ReactElement {
  const field = useDateTimePickerContext()
  return (
    <Button
      data-slot="date-time-picker-cancel"
      size="sm"
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented)
          field.setOpen(false, createChangeEventDetails('close-press', event.nativeEvent))
      }}
    />
  )
}

/** Close-and-commit — commits the staged value (reason `close-press`) and closes the popup. */
export function DateTimePickerClose({ onClick, ...props }: DateTimePickerCloseProps): ReactElement {
  const field = useDateTimePickerContext()
  return (
    <Button
      data-slot="date-time-picker-close"
      size="sm"
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented)
          field.confirm(event.nativeEvent)
      }}
    />
  )
}

export function DateTimePicker({
  'aria-label': ariaLabel,
  actionsRef,
  children,
  className,
  clearable = true,
  defaultOpen,
  defaultValue,
  disabled = false,
  disabledDates,
  format = 'yyyy-MM-dd HH:mm',
  id,
  inputToValue,
  locale,
  max,
  min,
  minuteStep = 1,
  modal = false,
  name,
  onOpenChange,
  onOpenChangeComplete,
  onValueChange,
  open: openProp,
  placeholder,
  readOnly = false,
  value: valueProp,
  ...props
}: DateTimePickerProps): ReactElement {
  // No `onChange` wiring in the hooks: the cancel protocol needs the user
  // callback to run before the state write (DatePicker's arrangement).
  const [value, setValueState] = useControllableState<Date | null>({
    value: valueProp,
    defaultValue,
    fallback: null,
  })
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    fallback: false,
  })
  const [draft, setDraft] = useState<string | null>(null)
  // The calendar's month is internal: it resets to the value when the popup
  // opens and follows typing while it is up.
  const [month, setMonth] = useState<Date>(() => startOfDay(valueProp ?? defaultValue ?? new Date()))
  // Confirm mode's staging area: `undefined` = nothing staged.
  const [pending, setPending] = useState<Date | null | undefined>(undefined)
  const [footerMounted, setFooterMounted] = useState(false)
  // Whether the close now underway submitted a value — the caret fix after
  // such a close (see `handleOpenChangeComplete`).
  const [submittedClose, setSubmittedClose] = useState(false)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const portalRef = useRef<HTMLDivElement | null>(null)
  // Whether the close now underway is one where focus already left the field,
  // read from inside the focus manager's unmount cleanup — a ref, because a
  // state flip would not have rendered by then.
  const focusLeftFieldRef = useRef(false)

  const granularity = granularityOf(format)

  // The one parsing seam: typed text and the draft-vs-value judge below must
  // speak the same language, or a custom parser's draft would be dropped and
  // reformatted mid-typing.
  const parseText = (text: string, referenceDate: Date): Date | null => {
    const parsed = inputToValue === undefined
      ? parseDate(text, format, referenceDate, { locale })
      : inputToValue(text)
    return parsed === null || !isValid(parsed) ? null : truncateTime(parsed, granularity)
  }

  const isAllowed = (dateTime: Date): boolean =>
    (disabledDates === undefined || !dateMatchModifiers(dateTime, disabledDates))
    && (min === undefined || dateTime.getTime() >= min.getTime())
    && (max === undefined || dateTime.getTime() <= max.getTime())
    && dateTime.getMinutes() % minuteStep === 0

  // A pick past a bound lands on the bound, rounded onto the grid the columns
  // offer — up past `min`, down below `max` — so it is a value the field would
  // accept typed.
  const clamp = (dateTime: Date): Date => {
    if (min !== undefined && dateTime.getTime() < min.getTime()) {
      let up = truncateTime(min, granularity)
      if (up.getTime() < min.getTime())
        up = granularity === 'second' ? addSeconds(up, 1) : addMinutes(up, 1)
      const over = up.getMinutes() % minuteStep
      return over === 0 ? up : set(addMinutes(up, minuteStep - over), { seconds: 0 })
    }
    if (max !== undefined && dateTime.getTime() > max.getTime()) {
      const down = truncateTime(max, granularity)
      const over = down.getMinutes() % minuteStep
      return over === 0 ? down : set(addMinutes(down, -over), { seconds: 0 })
    }
    return dateTime
  }

  // A value change from outside (a form reset, a programmatic set) drops the
  // draft; the draft survives only the write-back its own typing produced.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (draft !== null) {
      const parsed = value === null ? null : parseText(draft, value)
      const draftProducedIt = value !== null && parsed !== null
        && parsed.getTime() === value.getTime()
      if (!draftProducedIt)
        setDraft(null)
    }
  }

  const setValue = (
    next: Date | null,
    eventDetails: DateTimePickerChangeEventDetails = createChangeEventDetails('none'),
  ): void => {
    onValueChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    setValueState(next)
  }

  const setOpen = (next: boolean, eventDetails: DateTimePickerOpenChangeEventDetails): void => {
    if (next === open)
      return
    onOpenChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    if (next) {
      setMonth(startOfDay(value ?? new Date()))
      setSubmittedClose(false)
      focusLeftFieldRef.current = false
    }
    else {
      // Closing settles confirm mode: whatever was staged and not confirmed
      // is dropped — dismissing IS the cancel.
      setPending(undefined)
      // Every close funnels through here, so this is where the two reasons
      // that mean "focus already left" are recognised.
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
    // A submitting close rewrote the controlled value, which parks a blurred
    // input's caret at 0; if Base UI's guarded return focus landed on our
    // input, settle the caret to the end — a frame later, after that return
    // focus has run (DatePicker's correction, verbatim).
    if (!nextOpen && submittedClose) {
      setSubmittedClose(false)
      requestAnimationFrame(() => {
        const input = inputRef.current
        const end = input?.value.length ?? 0
        if (input !== null && document.activeElement === input
          && (input.selectionStart !== end || input.selectionEnd !== end)) {
          input.setSelectionRange(end, end)
        }
      })
    }
    onOpenChangeComplete?.(nextOpen)
  }

  const commitDraft = (event: Event): void => {
    if (draft === null)
      return
    setDraft(null)
    if (draft.trim() === '') {
      // While confirming, an emptied field stages the clear like every other
      // popup-open change; confirm settles it.
      if (footerMounted)
        setPending(null)
      else if (value !== null)
        setValue(null, createChangeEventDetails('input-clear', event))
    }
    // A parseable draft already committed on change; anything else reverts to
    // the formatted value by dropping the draft.
  }

  const handlePrimitiveOpenChange = (
    nextOpen: boolean,
    eventDetails: PopoverPrimitive.Root.ChangeEventDetails,
  ): void => {
    // A press inside our own box or on our own label is not an outside press
    // (the Cascader label treatment widened to the whole field) — cancelled
    // before the caller's callback runs, so it hears it with `isCanceled` set.
    if (!nextOpen && LABEL_PRESS_REASONS.has(eventDetails.reason)) {
      const target = eventDetails.event.target
      if (isOwnLabelPress(eventDetails.event, inputRef.current)
        || (target instanceof Node && rootRef.current?.contains(target) === true)) {
        eventDetails.cancel()
      }
    }
    // Focus leaving through the popup's far side never blurs the input (it
    // lost focus when the panel took it), so the draft settles here.
    if (!nextOpen && eventDetails.reason === 'focus-out')
      commitDraft(eventDetails.event)
    setOpen(nextOpen, eventDetails)
  }

  // Only the closes where focus already left are refused; the calendar and
  // the columns navigate by real focus, so Escape from inside them must bring
  // it back (DatePicker's `resolveReturnFocus`, same reasoning).
  const resolveReturnFocus = (): boolean => !focusLeftFieldRef.current

  const disabledDays: Matcher[] = [
    ...(disabledDates === undefined ? [] : [disabledDates].flat()),
    ...(min === undefined ? [] : [{ before: min }]),
    ...(max === undefined ? [] : [{ after: max }]),
  ]

  const preview = pending !== undefined ? pending : value
  // Filled follows what the input is showing, not the committed value — Base
  // UI's FieldControl reading, and what keeps confirm mode's clear button from
  // popping in only once the popup closes.
  const filled = draft !== null ? draft.trim() !== '' : preview !== null
  const state: DateTimePickerState = { filled, open, disabled, readOnly }
  // Not memoised: `draft` changes on every keystroke anyway, so a stable
  // identity would buy nothing and only hide the dependency. (The documented
  // exception to the provider-value-must-memo rule.)
  const context: DateTimePickerContextValue = {
    ...state,
    'value': value,
    'preview': preview,
    'confirmMode': footerMounted,
    'draft': draft,
    'clearable': clearable,
    'format': format,
    'granularity': granularity,
    'locale': locale,
    'minuteStep': minuteStep,
    'min': min,
    'max': max,
    'disabledDays': disabledDays,
    'placeholder': placeholder,
    'id': id,
    'aria-label': ariaLabel,
    'inputRef': inputRef,
    'rootRef': rootRef,
    'portalRef': portalRef,
    'setDraft': setDraft,
    'setValue': setValue,
    'commitDraft': commitDraft,
    'parseText': parseText,
    'isAllowed': isAllowed,
    'clamp': clamp,
    'setOpen': setOpen,
    'month': month,
    'setMonth': setMonth,
    'stage': setPending,
    'confirm': confirm,
    'setFooterMounted': setFooterMounted,
    'resolveReturnFocus': resolveReturnFocus,
  }

  const defaultChildren = (
    <InputGroup>
      <DateTimePickerInput placeholder={placeholder} />
      {!readOnly && <DateTimePickerClear />}
      {!readOnly && <DateTimePickerTrigger />}
    </InputGroup>
  )

  // Layered takeover: an unwritten part stays present by default. Children
  // replace the input side; the popup defaults in unless one is composed.
  const resolvedChildren = resolveRenderChildren(children, state, defaultChildren)
  const hasComposedPopup = findComposedPart(resolvedChildren, DateTimePickerPopup) !== undefined
  return (
    <DateTimePickerContext value={context}>
      <div
        className={cn('group/date-time-picker inline-full', className)}
        data-disabled={dataAttr(disabled)}
        data-empty={dataAttr(!state.filled)}
        data-open={dataAttr(open)}
        data-readonly={dataAttr(readOnly)}
        data-slot="date-time-picker"
        ref={rootRef}
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
          {hasComposedPopup ? null : <DateTimePickerPopup />}
        </PopoverPrimitive.Root>
        {name !== undefined && (
          // Always mounted, outside the portal: the popup unmounts on close,
          // and a key that flickers in and out of FormData is worse than ''.
          <input
            disabled={disabled}
            name={name}
            type="hidden"
            value={value === null ? '' : formatDate(value, `${SERIAL_FORMAT}'T'${timeSerialFormat(granularity)}`)}
          />
        )}
      </div>
    </DateTimePickerContext>
  )
}
