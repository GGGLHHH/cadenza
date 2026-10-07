'use client'

import type { Locale } from 'date-fns'
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import type { TimeConstraints, TimeGranularity } from '#lib/time'
import type { TimeColumnsProps } from './time-columns'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { resolveRenderChildren, useControllableState } from '@gedatou/cadenza-utils'
import { IconClock, IconX } from '@tabler/icons-react'
import { format as formatDate, isValid, parse as parseDate, set } from 'date-fns'
import { createContext, use, useEffect, useRef, useState } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { isOwnLabelPress, LABEL_PRESS_REASONS } from '#lib/own-label-press'
import { popupClassName } from '#lib/popup'
import { granularityOf, isTimeAllowed, timeSerialFormat, truncateTime } from '#lib/time'
import { cn, dataAttr } from '#lib/utils'
import { Button } from './button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './input-group'
import { TimeColumns } from './time-columns'

/**
 * The published TimePicker family — the DatePicker treatment for a time of
 * day: an editable field whose typed time commits as soon as it parses, with
 * `TimeColumns` (hours / minutes / seconds) in a popup anchored to the field.
 *
 * Everything but the panel is DatePicker's, mechanism for mechanism — the
 * `InputGroup` shell, the Popover anchored to the root, the own-box presses
 * that are not outside presses, the draft that survives its own write-backs,
 * the footer whose presence is confirm mode. Where a comment here is short,
 * the long reason is on the DatePicker part of the same name.
 *
 * One deliberate difference: **a pick does not close the popup.** A day is a
 * whole date, so DatePicker closes on it; an hour is not a whole time, and
 * closing on "the last column" breaks the moment someone picks the minute
 * first. Picks commit as they happen (native `<input type="time">`'s popup
 * does the same); Escape, Enter, a press outside or Tab leaving the field
 * closes it.
 *
 * The value is a `Date | null` like DatePicker's, of which only the time of
 * day is meaningful — the shape Base UI's own temporal internals give time
 * values (`internals/temporal`: the date library's object or `null`). Edits
 * keep the value's date; a field with no value starts from today. The value is
 * normalised to the format's smallest unit (seconds zeroed unless the format
 * shows them), DatePicker's start-of-day treatment.
 *
 * The root is a plain `<div>`, so its `className` is honestly a string. Style
 * off state through the data attributes it writes — `data-empty`,
 * `data-open`, `data-disabled`, `data-readonly`.
 */

/** Why the value changed. Clearing is a reason, not a separate callback; `close-press` is the footer's confirm. */
export type TimePickerChangeEventReason
  = 'input-change' | 'input-clear' | 'item-press' | 'clear-press' | 'close-press' | 'none'

export type TimePickerChangeEventDetails = ChangeEventDetails<TimePickerChangeEventReason>

/**
 * Why the popup opened or closed. Base UI's own reasons pass through
 * untouched; the seam adds the input-side gestures it wires itself. No
 * `item-press`: a pick never closes.
 */
export type TimePickerOpenChangeEventReason
  = PopoverPrimitive.Root.ChangeEventReason
    | 'input-press' | 'list-navigation' | 'keyboard'

export type TimePickerOpenChangeEventDetails = ChangeEventDetails<TimePickerOpenChangeEventReason>

/** What the root's parts read, and what function children are handed. */
export interface TimePickerState {
  /** The input is showing something — Base UI's Field word, read off the visible text (draft, staged or committed). */
  filled: boolean
  open: boolean
  disabled: boolean
  readOnly: boolean
}

/** The columns wiring the popup hands to a function child — spread it into `<TimeColumns>` and add your own props on top. */
export interface TimePickerColumnsProps {
  value: Date | null
  onValueChange: NonNullable<TimeColumnsProps['onValueChange']>
  granularity: TimeGranularity
  minuteStep: number
  min: Date | undefined
  max: Date | undefined
}

interface TimePickerContextValue extends TimePickerState {
  'value': Date | null
  /** What the input and columns show: the staged value while confirming, the committed one otherwise. */
  'preview': Date | null
  /** A `TimePickerFooter` is mounted: picks stage instead of committing. */
  'confirmMode': boolean
  'draft': string | null
  'clearable': boolean
  'format': string
  'granularity': TimeGranularity
  'locale': Locale | undefined
  'constraints': Required<Pick<TimeConstraints, 'minuteStep'>> & Pick<TimeConstraints, 'min' | 'max'>
  'placeholder'?: string
  'id'?: string
  'aria-label'?: string
  'inputRef': RefObject<HTMLInputElement | null>
  'rootRef': RefObject<HTMLDivElement | null>
  'portalRef': RefObject<HTMLDivElement | null>
  'setDraft': (draft: string | null) => void
  'setValue': (value: Date | null, eventDetails?: TimePickerChangeEventDetails) => void
  /** Settles the draft: commit an empty draft as a clear, drop an unparseable one. */
  'commitDraft': (event: Event) => void
  /** Typed text → time on the reference date (already normalised), `null` when it is not a time yet. */
  'parseText': (text: string, referenceDate: Date) => Date | null
  'setOpen': (open: boolean, eventDetails: TimePickerOpenChangeEventDetails) => void
  /** Stages a value while confirming instead of committing it; `undefined` drops the stage. */
  'stage': (next: Date | null | undefined) => void
  /** Commits the staged value (reason `close-press`) and closes. */
  'confirm': (event: Event) => void
  'setFooterMounted': (mounted: boolean) => void
  /** The popup's `finalFocus`: whether this close should return focus at all (see the root). */
  'resolveReturnFocus': () => boolean
}

const TimePickerContext = createContext<TimePickerContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  TimePickerContext.displayName = 'TimePickerContext'

function useTimePickerContext(): TimePickerContextValue {
  const context = use(TimePickerContext)
  if (context === null)
    throw new Error('cadenza-ui: TimePickerContext is missing. TimePicker parts must be placed within <TimePicker>.')
  return context
}

// `onChange` joins the omitted div props: the root is a `<div>`, and an
// intersection with its native handler would demand a callback satisfying
// both signatures. Ours never reaches the element.
export type TimePickerProps
  = Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'>
    & TimeConstraints
    & {
      /** Controlled value. `null` is the controlled empty value. Only the time of day is meaningful. */
      'value'?: Date | null
      /** Uncontrolled initial value. */
      'defaultValue'?: Date | null
      /**
       * Fires on every committed change with why it happened (`reason:
       * 'clear-press'`/`'input-clear'` replaces an `onClear` callback).
       * `eventDetails.cancel()` rejects the change entirely.
       */
      'onValueChange'?: (value: Date | null, eventDetails: TimePickerChangeEventDetails) => void
      /** Controlled popup state. */
      'open'?: boolean
      /** Whether the popup is initially open. */
      'defaultOpen'?: boolean
      /** Fires when the popup opens or closes. `cancel()` keeps it where it is. */
      'onOpenChange'?: (open: boolean, eventDetails: TimePickerOpenChangeEventDetails) => void
      /** Fires after the popup's open/close animation completes. */
      'onOpenChangeComplete'?: (open: boolean) => void
      /** Imperative popup actions (`unmount`, `close`), Base UI's own type. */
      'actionsRef'?: PopoverPrimitive.Root.Props['actionsRef']
      /** Base UI's modal switch, pinned to `false`: an inline time field must not lock the page. */
      'modal'?: PopoverPrimitive.Root.Props['modal']
      /**
       * The display and parse format, date-fns tokens. A seconds token (`s`)
       * adds the seconds column. The hidden input always serialises as
       * `HH:mm` (`HH:mm:ss` with seconds), whatever is shown.
       */
      'format'?: string
      /** date-fns locale for formatting and parsing. */
      'locale'?: Locale
      /**
       * Replaces how typed text parses — accept `0930`, `9.30`, whatever the
       * field should understand. `null` means "not a time yet". Must be pure;
       * only the time of day of the result is taken, the date stays the
       * value's. Defaults to strict parsing by `format`.
       */
      'inputToValue'?: (text: string) => Date | null
      /** With a name, a hidden input serialises the value for the form. */
      'name'?: string
      'disabled'?: boolean
      'readOnly'?: boolean
      /**
       * The clear affordance's master switch, default ON — `false` removes the
       * clear button everywhere, an explicitly composed `TimePickerClear`
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
       * Replaces the default composition (input, clear, clock button). Compose
       * the parts yourself inside the root; the popup stays present unless a
       * `TimePickerPopup` is composed. A function receives the field's state
       * plus the default composition as `defaultChildren`.
       */
      'children'?: ReactNode | ((state: TimePickerState & { defaultChildren: ReactNode }) => ReactNode)
    }

export type TimePickerInputProps = ComponentProps<typeof InputGroupInput>
export type TimePickerTriggerProps = ComponentProps<typeof InputGroupButton>
export type TimePickerClearProps = ComponentProps<typeof InputGroupButton>

/**
 * The text input — the `DatePickerInput` treatment. While it has focus the raw
 * draft is shown; otherwise the committed value, formatted. Carries no
 * `data-slot` of its own: `InputGroupInput`'s is the focus-ring contract.
 */
export function TimePickerInput({
  className,
  onBlur,
  onChange,
  onClick,
  onKeyDown,
  ref,
  ...props
}: TimePickerInputProps): ReactElement {
  const field = useTimePickerContext()
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
        // the columns live in the portal, and a Tab about to land in them
        // passes Base UI's focus guards inside the root first.
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
        // The reference keeps the date: typing a time edits the value's time
        // of day, it does not move it to today.
        const time = field.parseText(raw, field.preview ?? new Date())
        if (time !== null) {
          const sameTime = field.preview !== null && time.getTime() === field.preview.getTime()
          if (isTimeAllowed(time, field.constraints) && !sameTime) {
            if (field.confirmMode)
              field.stage(time)
            else
              field.setValue(time, createChangeEventDetails('input-change', event.nativeEvent))
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
 * The clock button — the DatePicker trigger, addressed to this family. Out of
 * the tab order (ArrowDown from the input opens), absent from the read-only
 * default composition, for the reasons documented on `DatePickerTrigger`.
 */
export function TimePickerTrigger({
  children,
  className,
  onClick,
  ...props
}: TimePickerTriggerProps): ReactElement {
  const field = useTimePickerContext()
  return (
    <InputGroupAddon align="inline-end" data-slot="time-picker-trigger-addon">
      <InputGroupButton
        // English aria-only fallback, the house pattern: it never renders
        // visibly, and a caller-passed aria-label wins.
        aria-label="Open time picker"
        className={className}
        data-slot="time-picker-trigger"
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
        {children ?? <IconClock aria-hidden />}
      </InputGroupButton>
    </InputGroupAddon>
  )
}

/**
 * The clear button — the DatePicker clear, addressed to this family. Hides
 * itself while the field is empty (`invisible`, keeping its box: no layout
 * shift when a value lands).
 */
export function TimePickerClear({
  className,
  children,
  onClick,
  ...props
}: TimePickerClearProps): ReactElement | null {
  const field = useTimePickerContext()
  if (!field.clearable)
    return null
  return (
    <InputGroupAddon
      align="inline-end"
      className="group-data-empty/time-picker:invisible"
      data-slot="time-picker-clear-addon"
    >
      <InputGroupButton
        aria-label="Clear time"
        className={cn('rounded-full', className)}
        data-slot="time-picker-clear"
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
export type TimePickerPopupProps
  = Omit<PopoverPrimitive.Popup.Props, 'children' | 'initialFocus' | 'finalFocus'>
    & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
    & {
      /**
       * Extends or replaces the popup's content. Plain children render BELOW
       * the default columns (`<TimePickerPopup><TimePickerFooter …/></TimePickerPopup>`);
       * a function replaces the columns entirely — it receives the seam's
       * wiring to spread into your own:
       * `{(columns) => <TimeColumns {...columns} labels={{ hours: '时', minutes: '分' }} />}`.
       */
      children?: ReactNode | ReactNode[] | ((columnsProps: TimePickerColumnsProps) => ReactNode)
    }

/**
 * Portal + Positioner + Popup in one part, anchored to the root's box — the
 * DatePicker popup with `TimeColumns` inside.
 */
export function TimePickerPopup({
  align = 'start',
  alignOffset = 0,
  children,
  className,
  onMouseDown,
  ref,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: TimePickerPopupProps): ReactElement {
  const field = useTimePickerContext()
  const columnsProps: TimePickerColumnsProps = {
    value: field.preview,
    onValueChange: (time) => {
      field.setDraft(null)
      // Staged while confirming, committed otherwise — and either way the
      // popup stays up: an hour is not a whole time (see the family JSDoc).
      if (field.confirmMode)
        field.stage(time)
      else
        field.setValue(time, createChangeEventDetails('item-press'))
    },
    granularity: field.granularity,
    minuteStep: field.constraints.minuteStep,
    min: field.constraints.min,
    max: field.constraints.max,
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
          data-slot="time-picker-popup"
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
            ? children(columnsProps)
            : (
                <>
                  <TimeColumns {...columnsProps} />
                  {children}
                </>
              )}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export type TimePickerFooterProps = ComponentProps<'div'>
export type TimePickerFooterClearProps = ComponentProps<typeof Button>
export type TimePickerCancelProps = ComponentProps<typeof Button>
export type TimePickerCloseProps = ComponentProps<typeof Button>

/**
 * The action row under the columns — the DatePicker footer, addressed to this
 * family: a layout shell whose presence IS confirm mode. While it is mounted,
 * picks and typed times stage instead of committing, and only
 * `TimePickerClose` (or Enter) settles them — `TimePickerCancel`, Escape or a
 * press outside drops the staged value.
 */
export function TimePickerFooter({ className, ...props }: TimePickerFooterProps): ReactElement {
  const { setFooterMounted } = useTimePickerContext()
  useEffect(() => {
    setFooterMounted(true)
    return () => setFooterMounted(false)
  }, [setFooterMounted])
  return (
    <div
      className={cn(`
        flex items-center justify-end gap-2 border-bs border-border p-2
      `, className)}
      data-slot="time-picker-footer"
      {...props}
    />
  )
}

/**
 * Stages an empty value — the popup stays up, `TimePickerClose` settles it.
 * `Footer` in the name only disambiguates from the input-side
 * `TimePickerClear`.
 */
export function TimePickerFooterClear({ onClick, ...props }: TimePickerFooterClearProps): ReactElement {
  const field = useTimePickerContext()
  return (
    <Button
      data-slot="time-picker-footer-clear"
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
export function TimePickerCancel({ onClick, ...props }: TimePickerCancelProps): ReactElement {
  const field = useTimePickerContext()
  return (
    <Button
      data-slot="time-picker-cancel"
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
export function TimePickerClose({ onClick, ...props }: TimePickerCloseProps): ReactElement {
  const field = useTimePickerContext()
  return (
    <Button
      data-slot="time-picker-close"
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

export function TimePicker({
  'aria-label': ariaLabel,
  actionsRef,
  children,
  className,
  clearable = true,
  defaultOpen,
  defaultValue,
  disabled = false,
  format = 'HH:mm',
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
}: TimePickerProps): ReactElement {
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
  // reformatted mid-typing. Only the time of day is taken from the parse — a
  // custom parser's date is not the field's to change.
  const parseText = (text: string, referenceDate: Date): Date | null => {
    const parsed = inputToValue === undefined
      ? parseDate(text, format, referenceDate, { locale })
      : inputToValue(text)
    if (parsed === null || !isValid(parsed))
      return null
    return truncateTime(set(referenceDate, {
      hours: parsed.getHours(),
      minutes: parsed.getMinutes(),
      seconds: parsed.getSeconds(),
    }), granularity)
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
    eventDetails: TimePickerChangeEventDetails = createChangeEventDetails('none'),
  ): void => {
    onValueChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    setValueState(next)
  }

  const setOpen = (next: boolean, eventDetails: TimePickerOpenChangeEventDetails): void => {
    if (next === open)
      return
    onOpenChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    if (next) {
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
    // lost focus when the columns took it), so the draft settles here.
    if (!nextOpen && eventDetails.reason === 'focus-out')
      commitDraft(eventDetails.event)
    setOpen(nextOpen, eventDetails)
  }

  // Combobox's `finalFocus={false}` would do for pointer users, but the
  // columns navigate by real focus: a keyboard user's focus genuinely goes in,
  // and Escape has to bring it back. So only the closes where focus already
  // left are refused (DatePicker's `resolveReturnFocus`, same reasoning).
  const resolveReturnFocus = (): boolean => !focusLeftFieldRef.current

  const preview = pending !== undefined ? pending : value
  // Filled follows what the input is showing, not the committed value — Base
  // UI's FieldControl reading, and what keeps confirm mode's clear button from
  // popping in only once the popup closes.
  const filled = draft !== null ? draft.trim() !== '' : preview !== null
  const state: TimePickerState = { filled, open, disabled, readOnly }
  // Not memoised: `draft` changes on every keystroke anyway, so a stable
  // identity would buy nothing and only hide the dependency. (The documented
  // exception to the provider-value-must-memo rule.)
  const context: TimePickerContextValue = {
    ...state,
    'value': value,
    'preview': preview,
    'confirmMode': footerMounted,
    'draft': draft,
    'clearable': clearable,
    'format': format,
    'granularity': granularity,
    'locale': locale,
    'constraints': { max, min, minuteStep },
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
    'stage': setPending,
    'confirm': confirm,
    'setFooterMounted': setFooterMounted,
    'resolveReturnFocus': resolveReturnFocus,
  }

  const defaultChildren = (
    <InputGroup>
      <TimePickerInput placeholder={placeholder} />
      {!readOnly && <TimePickerClear />}
      {!readOnly && <TimePickerTrigger />}
    </InputGroup>
  )

  // Layered takeover: an unwritten part stays present by default. Children
  // replace the input side; the popup defaults in unless one is composed.
  const resolvedChildren = resolveRenderChildren(children, state, defaultChildren)
  const hasComposedPopup = findComposedPart(resolvedChildren, TimePickerPopup) !== undefined
  return (
    <TimePickerContext value={context}>
      <div
        className={cn('group/time-picker inline-full', className)}
        data-disabled={dataAttr(disabled)}
        data-empty={dataAttr(!state.filled)}
        data-open={dataAttr(open)}
        data-readonly={dataAttr(readOnly)}
        data-slot="time-picker"
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
          {hasComposedPopup ? null : <TimePickerPopup />}
        </PopoverPrimitive.Root>
        {name !== undefined && (
          // Always mounted, outside the portal: the popup unmounts on close,
          // and a key that flickers in and out of FormData is worse than ''.
          <input
            disabled={disabled}
            name={name}
            type="hidden"
            value={value === null ? '' : formatDate(value, timeSerialFormat(granularity))}
          />
        )}
      </div>
    </TimePickerContext>
  )
}
