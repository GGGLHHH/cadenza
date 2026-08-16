'use client'

import type { Locale } from 'date-fns'
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import type { Matcher } from 'react-day-picker'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { IconCalendar, IconX } from '@tabler/icons-react'
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
 * The published DatePicker family.
 *
 * An editable date field with a calendar popup: typing a date commits it as
 * soon as it parses, picking a day in the calendar commits and closes. Base UI
 * has no date component, so the behaviour is the seam's own — the input shell
 * is `SearchField`'s treatment (shadcn's `InputGroup` pieces under their own
 * names), the popup is Base UI's Popover anchored to the root, the panel is
 * the promoted `Calendar` (react-day-picker).
 *
 * The input is not a Base UI Trigger, so Base UI would read a press on it as
 * an outside press and close the popup the input's own handler is about to
 * open — a close-then-open flicker. The root cancels those closes the same way
 * Cascader cancels its own-label presses: a press inside the root's box is not
 * "outside" in any sense the user would recognise.
 *
 * The root is a plain `<div>`, so its `className` is honestly a string. Style
 * off state through the data attributes it writes — `data-empty`,
 * `data-open`, `data-disabled`, `data-readonly`.
 */

/** Why the value changed. Clearing is a reason, not a separate callback. */
export type DatePickerChangeEventReason
  = 'input-change' | 'input-clear' | 'item-press' | 'clear-press' | 'none'

export type DatePickerChangeEventDetails = ChangeEventDetails<DatePickerChangeEventReason>

/**
 * Why the popup opened or closed. Base UI's own reasons pass through
 * untouched; the seam adds the input-side gestures it wires itself.
 */
export type DatePickerOpenChangeEventReason
  = PopoverPrimitive.Root.ChangeEventReason
    | 'input-press' | 'item-press' | 'list-navigation' | 'keyboard'

export type DatePickerOpenChangeEventDetails = ChangeEventDetails<DatePickerOpenChangeEventReason>

/** What the root's parts read, and what function children are handed. */
export interface DatePickerState {
  /** Something is picked — Base UI's Field word (`data-filled`). */
  filled: boolean
  open: boolean
  disabled: boolean
  readOnly: boolean
}

/** The calendar wiring the popup hands to a function child — spread it into `<Calendar>` and add your own props on top. */
export interface DatePickerCalendarProps {
  mode: 'single'
  selected: Date | undefined
  onSelect: (date: Date | undefined, triggerDate: Date) => void
  month: Date
  onMonthChange: (month: Date) => void
  disabled: Matcher | Matcher[] | undefined
  locale: Locale | undefined
}

interface DatePickerContextValue extends DatePickerState {
  'value': Date | null
  'draft': string | null
  'clearable': boolean
  'format': string
  'locale': Locale | undefined
  'disabledDates': Matcher | Matcher[] | undefined
  'placeholder'?: string
  'id'?: string
  'aria-label'?: string
  'inputRef': RefObject<HTMLInputElement | null>
  'rootRef': RefObject<HTMLDivElement | null>
  'popupRef': RefObject<HTMLDivElement | null>
  'setDraft': (draft: string | null) => void
  'setValue': (value: Date | null, eventDetails?: DatePickerChangeEventDetails) => void
  /** Settles the draft: commit an empty draft as a clear, drop an unparseable one. */
  'commitDraft': (event: Event) => void
  'setOpen': (open: boolean, eventDetails: DatePickerOpenChangeEventDetails) => void
  'month': Date
  'setMonth': (month: Date) => void
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  DatePickerContext.displayName = 'DatePickerContext'

function useDatePickerContext(): DatePickerContextValue {
  const context = use(DatePickerContext)
  if (context === null)
    throw new Error('cadenza-ui: DatePickerContext is missing. DatePicker parts must be placed within <DatePicker>.')
  return context
}

// `onChange` joins the omitted div props: the root is a `<div>`, so React
// declares a native handler under that name and an intersection would demand a
// callback satisfying both signatures. Ours never reaches the element.
export type DatePickerProps
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
      'onValueChange'?: (value: Date | null, eventDetails: DatePickerChangeEventDetails) => void
      /** Controlled popup state. */
      'open'?: boolean
      /** Whether the popup is initially open. */
      'defaultOpen'?: boolean
      /** Fires when the popup opens or closes. `cancel()` keeps it where it is. */
      'onOpenChange'?: (open: boolean, eventDetails: DatePickerOpenChangeEventDetails) => void
      /** Fires after the popup's open/close animation completes. */
      'onOpenChangeComplete'?: (open: boolean) => void
      /** Imperative popup actions (`unmount`, `close`), Base UI's own type. */
      'actionsRef'?: PopoverPrimitive.Root.Props['actionsRef']
      /** Base UI's modal switch, pinned to `false`: an inline date field must not lock the page. */
      'modal'?: PopoverPrimitive.Root.Props['modal']
      /**
       * The display and parse format, date-fns tokens. The hidden input always
       * serialises as `yyyy-MM-dd`, whatever is shown.
       */
      'format'?: string
      /** date-fns locale for formatting, parsing and the calendar. */
      'locale'?: Locale
      /**
       * Days the calendar disables — react-day-picker matchers. A typed date
       * matching one is rejected too, not just unpickable.
       */
      'disabledDates'?: Matcher | Matcher[]
      /** With a name, a hidden input serialises the value for the form. */
      'name'?: string
      'disabled'?: boolean
      'readOnly'?: boolean
      /**
       * The clear affordance's master switch, default ON — `false` removes the
       * clear button everywhere, an explicitly composed `DatePickerClear`
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
       * Replaces the default composition (input, clear, calendar button).
       * Compose the parts yourself inside the root; the popup stays present
       * unless a `DatePickerPopup` is composed. A function receives the
       * field's state plus the default composition as `defaultChildren`.
       */
      'children'?: ReactNode | ((state: DatePickerState & { defaultChildren: ReactNode }) => ReactNode)
    }

export type DatePickerInputProps = ComponentProps<typeof InputGroupInput>
export type DatePickerTriggerProps = ComponentProps<typeof InputGroupButton>
export type DatePickerClearProps = ComponentProps<typeof InputGroupButton>

/**
 * The text input. It reads the field's text, its handlers and its accessible
 * name from context, so it works anywhere inside the field. While it has
 * focus the raw draft is shown; otherwise the committed value, formatted.
 *
 * Deliberately carries no `data-slot` of its own — `InputGroupInput`'s
 * `data-slot="input-group-control"` is the contract `InputGroup` draws its
 * focus ring off, and a value here would silently replace it.
 */
export function DatePickerInput({
  className,
  onBlur,
  onChange,
  onClick,
  onKeyDown,
  ref,
  ...props
}: DatePickerInputProps): ReactElement {
  const field = useDatePickerContext()
  const text = field.draft
    ?? (field.value === null ? '' : formatDate(field.value, field.format, { locale: field.locale }))
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
        // Focus moving into our own box or popup is not leaving the field.
        // Base UI's focus guards render inside the root, so a Tab that is
        // about to land in the calendar answers `rootRef.contains` too.
        if (next !== null && (field.rootRef.current?.contains(next)
          || field.popupRef.current?.contains(next))) {
          return
        }
        field.commitDraft(event.nativeEvent)
        if (field.open)
          field.setOpen(false, createChangeEventDetails('focus-out', event.nativeEvent))
      }}
      onChange={(event) => {
        const raw = event.target.value
        field.setDraft(raw)
        const parsed = parseDate(raw, field.format, new Date(), { locale: field.locale })
        if (isValid(parsed)) {
          const day = startOfDay(parsed)
          const disabledMatch = field.disabledDates !== undefined
            && dateMatchModifiers(day, field.disabledDates)
          const sameDay = field.value !== null && day.getTime() === field.value.getTime()
          if (!disabledMatch && !sameDay) {
            field.setValue(day, createChangeEventDetails('input-change', event.nativeEvent))
            field.setMonth(day)
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

/**
 * The calendar button. It toggles the popup and stays out of the tab order —
 * keyboard users open with ArrowDown from the input, which keeps the field a
 * single stop.
 *
 * Leave it out when the field is read only — the default composition does.
 * Not for tidiness: a read-only field's calendar button is disabled, and
 * `InputGroup` dims itself for *any* disabled descendant
 * (`has-disabled:opacity-50`), so a read-only field would render as disabled.
 */
export function DatePickerTrigger({
  children,
  className,
  onClick,
  ...props
}: DatePickerTriggerProps): ReactElement {
  const field = useDatePickerContext()
  return (
    <InputGroupAddon align="inline-end" data-slot="date-picker-trigger-addon">
      <InputGroupButton
        // English aria-only fallback, the house pattern: it never renders
        // visibly, and a caller-passed aria-label wins.
        aria-label="Open calendar"
        className={className}
        data-slot="date-picker-trigger"
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
 * The clear button. It clears the field on click and hides itself while the
 * field is empty, off the root's `data-empty`. Left out of the read-only
 * default composition for the same `has-disabled` reason as the trigger.
 */
export function DatePickerClear({
  className,
  children,
  onClick,
  ...props
}: DatePickerClearProps): ReactElement | null {
  const field = useDatePickerContext()
  if (!field.clearable)
    return null
  return (
    <InputGroupAddon
      align="inline-end"
      className="group-data-empty/date-picker:hidden"
      data-slot="date-picker-clear-addon"
    >
      <InputGroupButton
        aria-label="Clear date"
        className={cn('rounded-full', className)}
        data-slot="date-picker-clear"
        disabled={field.disabled}
        // Out of the tab order on purpose: keyboard users clear by emptying
        // the text, and a stop between the input and the next control is
        // friction.
        tabIndex={-1}
        {...props}
        // After the spread for the same reason as the trigger's onClick.
        onClick={(event) => {
          onClick?.(event)
          if (event.defaultPrevented)
            return
          field.setDraft(null)
          field.setValue(null, createChangeEventDetails('clear-press', event.nativeEvent))
        }}
      >
        {children ?? <IconX aria-hidden />}
      </InputGroupButton>
    </InputGroupAddon>
  )
}

// `initialFocus`/`finalFocus` are the form's, not the caller's: focus stays in
// the input while picking, and returns there when a pick closes the popup.
export type DatePickerPopupProps
  = Omit<PopoverPrimitive.Popup.Props, 'children' | 'initialFocus' | 'finalFocus'>
    & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
    & {
      /**
       * Replaces the default calendar. A function receives the seam's calendar
       * wiring — spread it into your own `<Calendar>` and add props on top:
       * `{(calendar) => <Calendar {...calendar} numberOfMonths={2} />}`.
       */
      children?: ReactNode | ReactNode[] | ((calendarProps: DatePickerCalendarProps) => ReactNode)
    }

/**
 * Portal + Positioner + Popup in one part, anchored to the root's box rather
 * than a trigger — the input, the buttons and the popup all belong to one
 * field, so the popup hangs off the field's edge, not a button's.
 */
export function DatePickerPopup({
  align = 'start',
  alignOffset = 0,
  children,
  className,
  ref,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: DatePickerPopupProps): ReactElement {
  const field = useDatePickerContext()
  const calendarProps: DatePickerCalendarProps = {
    mode: 'single',
    selected: field.value ?? undefined,
    // Re-picking the selected day reports `undefined`; the trigger date keeps
    // it a confirmation instead of a surprise deselection.
    onSelect: (date, triggerDate) => {
      const day = startOfDay(date ?? triggerDate)
      field.setDraft(null)
      field.setValue(day, createChangeEventDetails('item-press'))
      field.setOpen(false, createChangeEventDetails('item-press'))
    },
    month: field.month,
    onMonthChange: field.setMonth,
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
          data-slot="date-picker-popup"
          className={cn(popupClassName, className)}
          finalFocus={field.inputRef}
          initialFocus={false}
          {...props}
          // Claimed, not taken: the caller's ref still gets the element. The
          // input's blur needs it to tell "into our popup" from "away".
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

export function DatePicker({
  'aria-label': ariaLabel,
  actionsRef,
  children,
  className,
  clearable = true,
  defaultOpen,
  defaultValue,
  disabled = false,
  disabledDates,
  format = 'yyyy-MM-dd',
  id,
  locale,
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
}: DatePickerProps): ReactElement {
  // No `onChange` wiring in the hooks: the cancel protocol needs the user
  // callback to run before the state write, so they only hold state and the
  // callbacks fire explicitly in setValue/setOpen.
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

  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)

  // A value change from outside (a form reset, a programmatic set) drops the
  // draft — otherwise the input keeps showing ghost text over the new value.
  // The draft survives only the write-back its own typing produced, so a
  // controlled parent echoing each keystroke never reformats mid-word.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (draft !== null) {
      // The new value itself is the parse reference — render-pure, and "did
      // this draft produce that value" is exactly the question being asked.
      const parsed = value === null ? null : parseDate(draft, format, value, { locale })
      const draftProducedIt = value !== null && parsed !== null && isValid(parsed)
        && startOfDay(parsed).getTime() === value.getTime()
      if (!draftProducedIt)
        setDraft(null)
    }
  }

  const setValue = (
    next: Date | null,
    eventDetails: DatePickerChangeEventDetails = createChangeEventDetails('none'),
  ): void => {
    onValueChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    setValueState(next)
  }

  const setOpen = (next: boolean, eventDetails: DatePickerOpenChangeEventDetails): void => {
    if (next === open)
      return
    onOpenChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    if (next)
      setMonth(startOfDay(value ?? new Date()))
    setOpenState(next)
  }

  const commitDraft = (event: Event): void => {
    if (draft === null)
      return
    setDraft(null)
    if (draft.trim() === '') {
      if (value !== null)
        setValue(null, createChangeEventDetails('input-clear', event))
    }
    // A parseable draft already committed on change; anything else reverts to
    // the formatted value by dropping the draft.
  }

  const handlePrimitiveOpenChange = (
    nextOpen: boolean,
    eventDetails: PopoverPrimitive.Root.ChangeEventDetails,
  ): void => {
    // A press inside our own box (the input, the buttons) or on our own label
    // is not an outside press: Base UI would close here and the input's own
    // handler would reopen — a flicker. Cancelled before the caller's
    // callback runs — the caller still hears about it, with `isCanceled`
    // already set — the Cascader label treatment widened to the whole field.
    if (!nextOpen && LABEL_PRESS_REASONS.has(eventDetails.reason)) {
      const target = eventDetails.event.target
      if (isOwnLabelPress(eventDetails.event, inputRef.current)
        || (target instanceof Node && rootRef.current?.contains(target) === true)) {
        eventDetails.cancel()
      }
    }
    // Focus leaving through the popup's far side never blurs the input (it
    // lost focus when the calendar took it), so the draft settles here.
    if (!nextOpen && eventDetails.reason === 'focus-out')
      commitDraft(eventDetails.event)
    setOpen(nextOpen, eventDetails)
  }

  const state: DatePickerState = { filled: value !== null, open, disabled, readOnly }
  // Not memoised: `draft` changes on every keystroke anyway, so a stable
  // identity would buy nothing and only hide the dependency. (The documented
  // exception to the provider-value-must-memo rule.)
  const context: DatePickerContextValue = {
    ...state,
    'value': value,
    'draft': draft,
    'clearable': clearable,
    'format': format,
    'locale': locale,
    'disabledDates': disabledDates,
    'placeholder': placeholder,
    'id': id,
    'aria-label': ariaLabel,
    'inputRef': inputRef,
    'rootRef': rootRef,
    'popupRef': popupRef,
    'setDraft': setDraft,
    'setValue': setValue,
    'commitDraft': commitDraft,
    'setOpen': setOpen,
    'month': month,
    'setMonth': setMonth,
  }

  const defaultChildren = (
    <InputGroup>
      <DatePickerInput placeholder={placeholder} />
      {!readOnly && <DatePickerClear />}
      {!readOnly && <DatePickerTrigger />}
    </InputGroup>
  )

  // Layered takeover: an unwritten part stays present by default. Children
  // replace the input side; the popup defaults in unless one is composed.
  // Resolved before the search so a function child's composition counts too.
  const resolvedChildren = resolveRenderChildren(children, state, defaultChildren)
  const hasComposedPopup = findComposedPart(resolvedChildren, DatePickerPopup) !== undefined
  return (
    <DatePickerContext value={context}>
      <div
        className={cn('group/date-picker inline-full', className)}
        data-disabled={dataAttr(disabled)}
        data-empty={dataAttr(!state.filled)}
        data-open={dataAttr(open)}
        data-readonly={dataAttr(readOnly)}
        data-slot="date-picker"
        ref={rootRef}
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
          {hasComposedPopup ? null : <DatePickerPopup />}
        </PopoverPrimitive.Root>
        {name !== undefined && (
          // Always mounted, outside the portal: the popup unmounts on close,
          // and a key that flickers in and out of FormData is worse than ''.
          <input
            disabled={disabled}
            name={name}
            type="hidden"
            value={value === null ? '' : formatDate(value, SERIAL_FORMAT)}
          />
        )}
      </div>
    </DatePickerContext>
  )
}
