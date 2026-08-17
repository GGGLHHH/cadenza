'use client'

import type { Locale } from 'date-fns'
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import type { Matcher } from 'react-day-picker'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { IconCalendar, IconX } from '@tabler/icons-react'
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

/** Why the value changed. Clearing is a reason, not a separate callback; `close-press` is the footer's confirm. */
export type DatePickerChangeEventReason
  = 'input-change' | 'input-clear' | 'item-press' | 'clear-press' | 'close-press' | 'none'

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
  /** The input is showing something — Base UI's Field word (`data-filled`), read off the visible text (draft, staged or committed). */
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
  /**
   * `'dropdown'` — the caption's month and year are pickable, so a distant
   * date takes one press instead of a walk through the arrows. Spread this on
   * and pass `captionLayout="label"` after it for the plain caption.
   */
  captionLayout: 'dropdown'
}

interface DatePickerContextValue extends DatePickerState {
  'value': Date | null
  /** What the input and calendar show: the staged value while confirming, the committed one otherwise. */
  'preview': Date | null
  /** A `DatePickerFooter` is mounted: picks stage instead of committing. */
  'confirmMode': boolean
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
  'portalRef': RefObject<HTMLDivElement | null>
  'setDraft': (draft: string | null) => void
  'setValue': (value: Date | null, eventDetails?: DatePickerChangeEventDetails) => void
  /** Settles the draft: commit an empty draft as a clear, drop an unparseable one. */
  'commitDraft': (event: Event) => void
  /** Typed text → day (already start-of-day normalised), `null` when it is not a date yet. */
  'parseText': (text: string, referenceDate: Date) => Date | null
  'setOpen': (open: boolean, eventDetails: DatePickerOpenChangeEventDetails) => void
  'month': Date
  'setMonth': (month: Date) => void
  /** Stages a value while confirming (`DatePickerFooter` mounted) instead of committing it; `undefined` drops the stage (the pending domain's own word for "nothing staged"). */
  'stage': (next: Date | null | undefined) => void
  /** Commits the staged value (reason `close-press`) and closes. */
  'confirm': (event: Event) => void
  'setFooterMounted': (mounted: boolean) => void
  /** Flag the next close as submitting — call before `setOpen(false)`; the root then settles the caret. */
  'markSubmitClose': () => void
  /** The popup's `finalFocus`: whether this close should return focus at all (see the root). */
  'resolveReturnFocus': () => boolean
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
       * Replaces how typed text parses into a date — accept several formats,
       * compact digits, whatever the field should understand. `null` means
       * "not a date yet". Must be pure; the result is normalised to the start
       * of its day, and display still follows `format`. Defaults to strict
       * parsing by `format`.
       */
      'inputToValue'?: (text: string) => Date | null
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
        // Focus moving into our own box or portal is not leaving the field.
        // Base UI's focus guards render inside the root, so a Tab that is
        // about to land in the calendar answers `rootRef.contains` too.
        //
        // The portal node rather than the popup, which is what lets the
        // calendar's month and year lists count as ours: they are popups of
        // their own, portalled out of the panel, and opening one moves focus
        // onto its selected option. Nested portals resolve their container to
        // the parent portal node, so containment still answers — the same
        // reasoning Base UI's own focus manager uses (see the popup part).
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
        const day = field.parseText(raw, new Date())
        if (day !== null) {
          const disabledMatch = field.disabledDates !== undefined
            && dateMatchModifiers(day, field.disabledDates)
          const sameDay = field.preview !== null && day.getTime() === field.preview.getTime()
          if (!disabledMatch && !sameDay) {
            if (field.confirmMode)
              field.stage(day)
            else
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
      // `invisible`, not `hidden`: the empty state must keep the button's
      // box, or the input's width jumps the moment a value lands and the
      // whole field visibly shifts (the Cascader zero-layout-shift verdict).
      className="group-data-empty/date-picker:invisible"
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
          // A staged-but-unconfirmed pick is part of what this button clears —
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
// the input while picking, and returns there when a pick closes the popup.
export type DatePickerPopupProps
  = Omit<PopoverPrimitive.Popup.Props, 'children' | 'initialFocus' | 'finalFocus'>
    & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
    & {
      /**
       * Extends or replaces the popup's content. Plain children render BELOW
       * the default calendar (`<DatePickerPopup><DatePickerFooter …/></DatePickerPopup>`);
       * a function replaces the calendar entirely — it receives the seam's
       * wiring to spread into your own:
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
  onMouseDown,
  ref,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: DatePickerPopupProps): ReactElement {
  const field = useDatePickerContext()
  const calendarProps: DatePickerCalendarProps = {
    mode: 'single',
    selected: field.preview ?? undefined,
    // Re-picking the selected day reports `undefined`; the trigger date keeps
    // it a confirmation instead of a surprise deselection.
    onSelect: (date, triggerDate) => {
      const day = startOfDay(date ?? triggerDate)
      field.setDraft(null)
      if (field.confirmMode) {
        // Staged, not committed: the footer's confirm settles the gesture.
        field.stage(day)
        return
      }
      field.setValue(day, createChangeEventDetails('item-press'))
      field.markSubmitClose()
      field.setOpen(false, createChangeEventDetails('item-press'))
    },
    month: field.month,
    onMonthChange: field.setMonth,
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
    // lists land there, so the input's blur judge recognises them for free.
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
          data-slot="date-picker-popup"
          className={cn(popupClassName, className)}
          // Base UI's Combobox treatment for this shape: focus stays on the
          // input, so a close has nothing to return. The root's judge spells
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

export type DatePickerFooterProps = ComponentProps<'div'>
export type DatePickerFooterClearProps = ComponentProps<typeof Button>
export type DatePickerCancelProps = ComponentProps<typeof Button>
export type DatePickerCloseProps = ComponentProps<typeof Button>

/**
 * The action row under the calendar — a layout shell, the `AlertDialogFooter`
 * treatment: compose the action parts (and their wording) yourself. Its
 * presence IS the mode switch (the MUI action-bar treatment): while it is
 * mounted, picks and typed dates stage instead of committing, and only
 * `DatePickerClose` (or Enter) settles them — `DatePickerCancel`, Escape or
 * clicking away drops the staged value. It only lives while the popup is
 * open, so a closed field types-and-commits as usual.
 *
 * Compose inside `DatePickerPopup` (plain children render below the default
 * calendar), and normally include a `DatePickerClose` — without one, only
 * Enter can settle.
 */
export function DatePickerFooter({ className, ...props }: DatePickerFooterProps): ReactElement {
  const { setFooterMounted } = useDatePickerContext()
  useEffect(() => {
    setFooterMounted(true)
    return () => setFooterMounted(false)
  }, [setFooterMounted])
  return (
    <div
      className={cn(`
        flex items-center justify-end gap-2 border-bs border-border p-2
      `, className)}
      data-slot="date-picker-footer"
      {...props}
    />
  )
}

/**
 * Stages an empty value — the popup stays up, `DatePickerClose` settles it.
 * `Footer` in the name only disambiguates from the input-side
 * `DatePickerClear`; wording and variant are the caller's, per the
 * `AlertDialogClose` treatment.
 */
export function DatePickerFooterClear({ onClick, ...props }: DatePickerFooterClearProps): ReactElement {
  const field = useDatePickerContext()
  return (
    <Button
      data-slot="date-picker-footer-clear"
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
export function DatePickerCancel({ onClick, ...props }: DatePickerCancelProps): ReactElement {
  const field = useDatePickerContext()
  return (
    <Button
      data-slot="date-picker-cancel"
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
 * value (reason `close-press`) and closes the popup.
 */
export function DatePickerClose({ onClick, ...props }: DatePickerCloseProps): ReactElement {
  const field = useDatePickerContext()
  return (
    <Button
      data-slot="date-picker-close"
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
  inputToValue,
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
  // Confirm mode's staging area: `undefined` = nothing staged. Only a footer
  // (mounted while the popup is open) routes changes through here.
  const [pending, setPending] = useState<Date | null | undefined>(undefined)
  const [footerMounted, setFooterMounted] = useState(false)
  // Whether the close now underway submitted a value — after such a close,
  // if Base UI's guarded return-focus landed on our input, the caret gets
  // settled to the end (a rewritten controlled value parks it at 0).
  const [submittedClose, setSubmittedClose] = useState(false)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const portalRef = useRef<HTMLDivElement | null>(null)
  // Whether the close now underway is one where focus already left the field.
  // Read by `resolveReturnFocus` below, from inside the focus manager's
  // unmount cleanup — a ref, because a state flip would not have rendered by
  // then.
  const focusLeftFieldRef = useRef(false)

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
  // draft — otherwise the input keeps showing ghost text over the new value.
  // The draft survives only the write-back its own typing produced, so a
  // controlled parent echoing each keystroke never reformats mid-word.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (draft !== null) {
      // The new value itself is the parse reference — render-pure, and "did
      // this draft produce that value" is exactly the question being asked.
      const parsed = value === null ? null : parseText(draft, value)
      const draftProducedIt = value !== null && parsed !== null
        && parsed.getTime() === value.getTime()
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
    if (next) {
      setMonth(startOfDay(value ?? new Date()))
      setSubmittedClose(false)
      focusLeftFieldRef.current = false
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
    // A submitting close rewrote the controlled value, which parks a blurred
    // input's caret at 0. Base UI's guarded return focus has run by now — if
    // it landed on our input, settle the caret to the end; where focus went
    // is entirely its call (the industry behaviour: back to where the popup
    // was opened from, never stolen).
    if (!nextOpen && submittedClose) {
      setSubmittedClose(false)
      // A frame later: Base UI's return focus runs in a microtask after the
      // popup unmounts, which is after this callback fires. Only touch the
      // selection when it is actually off — `setSelectionRange` restarts the
      // caret blink and disturbs the focus ring, and Chrome already parks a
      // focused input's caret at the end on a value rewrite, so the pointer
      // path must stay untouched (this is for keyboard return focus).
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

  // Base UI's own Combobox is this exact shape — a typeable input outside the
  // popup — and it passes `finalFocus={false}`: focus never went into the
  // popup, so there is nothing to return, and returning anyway is what makes
  // the ring and caret blink off and back on. (Its guarded boolean default
  // waves through any close whose active element is `body` — see
  // FloatingFocusManager's `activeEl !== doc.body` clause — and an outside
  // press parks focus on exactly that.)
  //
  // Not a flat `false` only because the calendar navigates by real focus
  // where Combobox's list is virtual: a keyboard user's focus genuinely goes
  // into the popup, and Escape has to bring it back. So only the closes where
  // focus already left get refused; `true` leaves the destination to the
  // manager, which returns focus to wherever it was when the popup opened.
  // Keyed off the reason recorded in `setOpen` rather than off where focus
  // sits, because by the time this runs the popup's ref is already detached.
  const resolveReturnFocus = (): boolean => !focusLeftFieldRef.current

  const preview = pending !== undefined ? pending : value
  // Filled follows what the input is showing, not the committed value — Base
  // UI's own reading (FieldControl flips `filled` off the DOM input's text on
  // every keystroke). Keyed off the committed value it lags a whole popup
  // cycle in confirm mode: the input previews the staged date with the clear
  // button still hidden, and the button pops in the instant the popup closes.
  const filled = draft !== null ? draft.trim() !== '' : preview !== null
  const state: DatePickerState = { filled, open, disabled, readOnly }
  // Not memoised: `draft` changes on every keystroke anyway, so a stable
  // identity would buy nothing and only hide the dependency. (The documented
  // exception to the provider-value-must-memo rule.)
  const context: DatePickerContextValue = {
    ...state,
    'value': value,
    'preview': preview,
    'confirmMode': footerMounted,
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
    'portalRef': portalRef,
    'setDraft': setDraft,
    'setValue': setValue,
    'commitDraft': commitDraft,
    'parseText': parseText,
    'setOpen': setOpen,
    'month': month,
    'setMonth': setMonth,
    'stage': setPending,
    'confirm': confirm,
    'setFooterMounted': setFooterMounted,
    'markSubmitClose': () => setSubmittedClose(true),
    'resolveReturnFocus': resolveReturnFocus,
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
          onOpenChangeComplete={handleOpenChangeComplete}
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
