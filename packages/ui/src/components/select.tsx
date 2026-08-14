'use client'

import type { Select as SelectPrimitive } from '@base-ui/react/select'
import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconX } from '@tabler/icons-react'
import { createContext, use, useMemo, useRef } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { isOwnLabelPress, LABEL_PRESS_REASONS } from '#lib/own-label-press'
import { cn } from '#lib/utils'
import {
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectContent as SelectPopupPrimitive,
  Select as SelectRootPrimitive,
  SelectSeparator,
  SelectTrigger as SelectTriggerPrimitive,
  SelectValue,
} from '#primitives/select'

/**
 * The published Select family.
 *
 * Base UI's `Select` underneath — `value` / `defaultValue` / `onValueChange`,
 * `multiple`, `disabled`, `required`, `readOnly`, `modal`, all passed straight
 * through. Composition is the API:
 *
 * ```tsx
 * <Select>
 *   <SelectTrigger><SelectValue placeholder="Pick one" /><SelectClear /></SelectTrigger>
 *   <SelectPopup>
 *     <SelectEmpty>没有数据</SelectEmpty>
 *     {fruits.map(fruit => <SelectItem key={fruit.id} value={fruit.id}>{fruit.name}</SelectItem>)}
 *   </SelectPopup>
 * </Select>
 * ```
 *
 * No `SelectGroup` in sight: `SelectPopup` wraps ungrouped children in one
 * implicitly (the list padding lives on the group). Write your own group(s) —
 * for headings, say — and the implicit one steps aside.
 *
 * Things worth knowing before reaching for a prop that looks like it
 * should work:
 *
 * - **The visible label is not part of this family.** The trigger is box-only,
 *   so the text label is a sibling `FieldLabel` pointed at it:
 *
 *   ```tsx
 *   <Field>
 *     <FieldLabel htmlFor="fruit">Fruit</FieldLabel>
 *     <Select>
 *       <SelectTrigger id="fruit"><SelectValue /></SelectTrigger>
 *       …
 *   ```
 *
 *   That single channel carries both halves here: the trigger is a real
 *   `<button>`, so a native `<label for>` both names it and — because the
 *   browser forwards the click — opens the menu. No second `aria-label` and no
 *   seam-side click plumbing, both of which the React Aria build needed.
 * - **`SelectLabel` is a group heading**, not the control's label — it is the
 *   title above a `SelectGroup`'s items.
 * - **A set of options computed from data is a plain `.map()`.** There is no
 *   collection API that builds the list for you.
 * - **The trigger shows the raw value unless you say otherwise.** `SelectValue`
 *   is not fed by the option list; it resolves a label out of the root's `items`
 *   map, and falls back to printing the value itself. So a select whose values
 *   differ from their labels needs one of:
 *
 *   ```tsx
 *   <Select items={{ apple: '苹果', pear: '梨' }}>            // a map, or
 *   <Select items={fruits.map(f => ({ value: f.id, label: f.name }))}>
 *   <SelectValue>{value => labels[value] ?? '—'}</SelectValue> // or a function
 *   ```
 *
 *   `items` never renders anything itself — the options are still your `.map()`.
 * - **The empty state is `SelectEmpty`** — a slot that shows itself only while
 *   the list has no options (`:only-child`, zero JS). An empty Select still
 *   opens. With the implicit group this is automatic; only hand-written
 *   groups carry the one constraint — with no data, render no empty
 *   `SelectGroup` shell next to it, or the slot is no longer an only child.
 * - **Clearing is `SelectClear`** — compose it inside the trigger and an ✕
 *   stands in the chevron's spot while something is selected. See its JSDoc.
 *
 * `SelectPopup` is Portal + Positioner + Popup + List in one part, with the
 * scroll arrows already inside. Its positioning props (`side`, `sideOffset`,
 * `align`, `alignOffset`, `alignItemWithTrigger`) go to the positioner and
 * everything else to the popup.
 *
 * Two defaults are flipped here in the seam (the vendored primitive keeps
 * upstream's, byte-locked):
 *
 * - **`modal` defaults to `false`** — opening the select leaves the page
 *   scrollable and outside elements interactive. Base UI defaults to a modal
 *   select (scroll locked, outside pointer disabled).
 * - **`alignItemWithTrigger` defaults to `false`** — the popup drops beside
 *   the trigger like an ordinary dropdown, instead of overlaying the selected
 *   item under the cursor macOS-style.
 *
 * Both stay plain props: pass `modal` / `alignItemWithTrigger` to restore
 * upstream behaviour. The macOS overlay is also why Base UI's misclick guard
 * exists (a mouse release only selects after a 400ms hold or an 8px drag);
 * with the popup no longer opening under the pointer, that guard is dormant
 * until someone opts back in.
 *
 * Two `data-slot` values here are wiring, not labels — passing your own silently
 * unstyles things. `select-value` is what the trigger's layout rules target, and
 * `select-item` is what the focus highlight matches. Add your own marker under a
 * different attribute.
 */

/** Base UI's Select reasons plus the seam's `'clear-press'` (`SelectClear`). */
export type SelectChangeEventReason = SelectPrimitive.Root.ChangeEventReason | 'clear-press'

export type SelectChangeEventDetails = ChangeEventDetails<SelectChangeEventReason>

/** What `onValueChange` reports: the item value, `null` for a cleared single, an array under `multiple`. */
type SelectValueOf<Value, Multiple extends boolean | undefined>
  = Parameters<NonNullable<SelectPrimitive.Root.Props<Value, Multiple>['onValueChange']>>[0]

/**
 * A generic alias, not `ComponentProps<typeof Select>`: the root is generic
 * over `<Value, Multiple>`, and `ComponentProps` would instantiate that away —
 * `onValueChange`'s value would degrade to non-generic. `onValueChange` is
 * re-declared for the widened reason union (`'clear-press'`).
 */
export type SelectProps<Value = string, Multiple extends boolean | undefined = false>
  = Omit<SelectPrimitive.Root.Props<Value, Multiple>, 'onValueChange'> & {
    /** `eventDetails.cancel()` rejects the change — a `SelectClear` press included. */
    'onValueChange'?: (value: SelectValueOf<Value, Multiple>, eventDetails: SelectChangeEventDetails) => void
    /**
     * The clear affordance's master switch, default ON: the default
     * compositions render a `SelectClear` and an explicitly composed one
     * works — `clearable={false}` removes it everywhere. A boolean ability
     * adjective, not a part you can forget.
     */
    'clearable'?: boolean
    /** Placeholder for the default compositions' `SelectValue`. Ignored once you write the trigger's children. */
    'placeholder'?: string
    /**
     * Accessible name for the default composition's trigger — the no-visible-
     * label case. With a `FieldLabel htmlFor` pointed at the root's `id`
     * (Base UI routes it to the trigger) this is unnecessary. Ignored once
     * you write your own trigger.
     */
    'aria-label'?: string
  }
export type SelectPopupProps = ComponentProps<typeof SelectPopupPrimitive>
export type SelectGroupProps = ComponentProps<typeof SelectGroup>
export type SelectItemProps = ComponentProps<typeof SelectItem>
export type SelectLabelProps = ComponentProps<typeof SelectLabel>
export type SelectSeparatorProps = ComponentProps<typeof SelectSeparator>
export type SelectTriggerProps = ComponentProps<typeof SelectTriggerPrimitive>
export type SelectValueProps = ComponentProps<typeof SelectValue>

interface SelectContextValue {
  /** Something is selected — a non-null single value or a non-empty array. Base UI's Field word for "has a value" (`data-filled`), not a coined `hasValue`. */
  filled: boolean
  disabled: boolean
  readOnly: boolean
  /** The clear master switch (root's `clearable`, default true). */
  clearable: boolean
  /** Root's `placeholder`, claimed by the trigger's default composition. */
  placeholder: string | undefined
  /** Clears back to the empty value (`null` / `[]`) with reason `'clear-press'`. */
  clear: (event: Event) => void
  /**
   * The trigger element. The root needs it to tell a press on the control's own
   * `FieldLabel` apart from a press outside the select — see `isOwnLabelPress`.
   */
  triggerRef: RefObject<HTMLButtonElement | null>
}

const SelectContext = createContext<SelectContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  SelectContext.displayName = 'SelectContext'

function useSelectContext(): SelectContextValue {
  const context = use(SelectContext)
  if (context === null)
    throw new Error('cadenza-ui: SelectContext is missing. Select parts must be placed within <Select>.')
  return context
}

/**
 * The root, with the seam's `modal={false}` default. Renders no DOM of its own.
 *
 * The seam owns the value (always feeding Base UI a controlled one): that is
 * what lets `SelectClear` clear an uncontrolled select — Base UI exposes no
 * imperative value channel and its own context is private. The controlled
 * empty value is `null` for single, `[]` for `multiple`.
 */
export function Select<Value = string, Multiple extends boolean | undefined = false>(
  {
    'aria-label': ariaLabel,
    children,
    clearable = true,
    defaultValue,
    disabled = false,
    modal = false,
    multiple,
    onOpenChange,
    onValueChange,
    placeholder,
    readOnly = false,
    value: valueProp,
    ...props
  }: SelectProps<Value, Multiple>,
): ReactElement {
  type StateValue = SelectValueOf<Value, Multiple>
  const [value, setValue] = useControllableState<StateValue>({
    value: valueProp as StateValue | undefined,
    defaultValue: defaultValue as StateValue | undefined,
    fallback: (multiple === true ? [] : null) as StateValue,
  })

  const handleValueChange = (next: StateValue, eventDetails: SelectChangeEventDetails): void => {
    onValueChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    setValue(next)
  }
  // The context's clear() reads through a ref so the memoised value does not
  // have to chase the per-render handler identity.
  const handleValueChangeRef = useRef(handleValueChange)
  handleValueChangeRef.current = handleValueChange

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails: SelectPrimitive.Root.ChangeEventDetails,
  ): void => {
    // Cancelled before the caller's callback runs, not after: this corrects
    // what the event *is* — a press on our own label is not an outside press —
    // rather than deciding what to do about it. The caller still hears about
    // it, with `isCanceled` already set. The browser then forwards the label's
    // click to the trigger, which toggles the popup itself.
    if (!nextOpen && LABEL_PRESS_REASONS.has(eventDetails.reason)
      && isOwnLabelPress(eventDetails.event, triggerRef.current)) {
      eventDetails.cancel()
    }
    onOpenChange?.(nextOpen, eventDetails)
  }

  const filled = multiple === true ? Array.isArray(value) && value.length > 0 : value != null
  const context = useMemo<SelectContextValue>(() => ({
    filled,
    disabled,
    readOnly,
    clearable,
    placeholder,
    clear: event => handleValueChangeRef.current(
      (multiple === true ? [] : null) as StateValue,
      createChangeEventDetails('clear-press', event),
    ),
    triggerRef,
  }), [filled, disabled, readOnly, clearable, placeholder, multiple])

  return (
    <SelectContext value={context}>
      <SelectRootPrimitive<Value, Multiple>
        {...props}
        disabled={disabled}
        modal={modal}
        multiple={multiple}
        readOnly={readOnly}
        value={value}
        onOpenChange={handleOpenChange}
        onValueChange={handleValueChange}
      >
        {children ?? (
          <>
            <SelectTrigger aria-label={ariaLabel} />
            <SelectPopup>{renderDefaultOptions(props.items)}</SelectPopup>
          </>
        )}
      </SelectRootPrimitive>
    </SelectContext>
  )
}

/**
 * The default composition's options, straight from the root's `items` — the
 * same data that already feeds `SelectValue`'s label resolution, so the
 * one-liner needs the list stated exactly once. A record and a flat
 * `{ value, label }` array render as options; a grouped array renders
 * FLATTENED, mirroring Base UI's own handling of the shape (its
 * `resolveValueLabel` flatMaps groups — the grouped form exists for label
 * resolution, and rendering groups is composition vocabulary everywhere in
 * Base UI, Combobox included). A dev warning points at the composition path
 * when headings would be lost.
 */
function renderDefaultOptions(items: SelectPrimitive.Root.Props<unknown, false>['items']): ReactNode {
  if (items === undefined)
    return null
  if (!Array.isArray(items)) {
    return Object.entries(items).map(([value, label]) => (
      <SelectItem key={value} value={value}>{label}</SelectItem>
    ))
  }
  const isGrouped = items.every(entry => typeof entry === 'object' && entry !== null && 'items' in entry)
  if (isGrouped && process.env.NODE_ENV !== 'production') {
    console.error(
      'cadenza-ui: grouped `items` render as a flat list in the default composition — '
      + 'group headings are composition vocabulary (Base UI usage). '
      + 'Write SelectPopup with SelectGroup/SelectLabel to render groups.',
    )
  }
  const flatItems = isGrouped
    ? (items as ReadonlyArray<{ items: ReadonlyArray<{ label: ReactNode, value: unknown }> }>).flatMap(group => group.items)
    : (items as ReadonlyArray<{ label: ReactNode, value: unknown }>)
  return flatItems.map(item => (
    <SelectItem key={String(item.value)} value={item.value}>{item.label}</SelectItem>
  ))
}

/**
 * The merged popup part, with the seam's `alignItemWithTrigger={false}`
 * default.
 *
 * Children get an implicit `SelectGroup` unless one is already composed
 * (direct child or in a Fragment): the list's padding and scroll margin live
 * on the group, so an ungrouped list would sit edge-to-edge against the popup
 * border. Write your own group(s) and the structure is entirely yours.
 * `SelectEmpty` rides along — alone in the implicit group it is still an
 * `:only-child`.
 */
export function SelectPopup({ alignItemWithTrigger = false, children, ...props }: SelectPopupProps): ReactElement {
  const hasGroup = findComposedPart(children, SelectGroup) !== undefined
  return (
    <SelectPopupPrimitive alignItemWithTrigger={alignItemWithTrigger} {...props}>
      {hasGroup ? children : <SelectGroup>{children}</SelectGroup>}
    </SelectPopupPrimitive>
  )
}

/**
 * The trigger. Plain passthrough until a `SelectClear` is composed among its
 * children — then it wraps itself in a positioning container and lifts the
 * clear affordance out of the button (a `<button>` may not nest another), so
 * the ✕ renders as a real sibling button overlaying the chevron's spot.
 *
 * One boolean drives both ends of the swap: the same `clearVisible` that
 * renders the ✕ also hands the vendored trigger the class hiding its chevron
 * (`visibility`, so the icon keeps holding its layout box) — the two can
 * never drift into stacking or both vanishing, and no stylesheet rule is
 * involved.
 */
export function SelectTrigger({ children, className, ref, ...props }: SelectTriggerProps): ReactElement {
  const { filled, disabled, readOnly, clearable, placeholder, clear, triggerRef } = useSelectContext()
  // No children → the trigger's own default composition: a SelectValue wired
  // to the root's placeholder, plus the clear affordance (`clearable` gates
  // it). An explicitly composed SelectClear works the same — clearable stays
  // the master switch either way.
  const autoComposed = children === undefined
  const composedClearProps = autoComposed ? {} : findComposedPart(children, SelectClear)
  const clearProps = clearable ? composedClearProps : undefined
  const clearVisible = clearProps !== undefined && filled && !disabled && !readOnly
  const trigger = (
    <SelectTriggerPrimitive
      className={cn(clearVisible && '[&>svg:last-child]:invisible', className)}
      // Claimed, not taken: the caller's ref still gets the element. The root
      // needs it to recognise presses on this control's own label.
      ref={(node) => {
        triggerRef.current = node
        if (typeof ref === 'function')
          ref(node)
        else if (ref !== null && ref !== undefined)
          ref.current = node
      }}
      {...props}
    >
      {autoComposed ? <SelectValue placeholder={placeholder} /> : children}
    </SelectTriggerPrimitive>
  )
  if (clearProps === undefined)
    return trigger
  return (
    <span className="relative inline-flex inline-fit" data-slot="select-trigger-container">
      {trigger}
      {clearVisible && <SelectClearOverlay {...clearProps} clear={clear} />}
    </span>
  )
}

export type SelectClearProps = Omit<ComponentProps<'button'>, 'type'>

/**
 * The clear affordance: compose it inside `SelectTrigger` and, while something
 * is selected, an ✕ stands in the chevron's spot — click it and the value
 * clears (`null` / `[]`, reason `'clear-press'`) without opening the popup.
 * Empty, disabled or read-only renders nothing and the chevron returns.
 *
 * A marker part: it renders nothing where written — the trigger lifts it out,
 * because HTML forbids a button inside a button. The lifted element IS a real
 * `<button>` (tab stop and all): there is no other keyboard path to clearing,
 * so the mouse-only antd treatment would lock keyboard users out.
 * Direct child of the trigger or inside a Fragment only.
 */
export function SelectClear(_props: SelectClearProps): null {
  return null
}

function SelectClearOverlay({
  'aria-label': ariaLabel = 'Clear selection',
  className,
  children,
  clear,
  onClick,
  ...props
}: SelectClearProps & { clear: (event: Event) => void }): ReactElement {
  return (
    <button
      aria-label={ariaLabel}
      data-slot="select-clear"
      type="button"
      className={cn(
        `
          absolute inset-e-2 inset-bs-1/2 flex -translate-y-1/2 items-center
          justify-center rounded-sm text-muted-foreground outline-none
          hover:text-foreground
          focus-visible:ring-2 focus-visible:ring-ring/50
        `,
        className,
      )}
      {...props}
      // After the spread, same as SearchFieldClear: a caller listening for
      // clicks must not silently take clearing away.
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented)
          clear(event.nativeEvent)
      }}
    >
      {children ?? <IconX aria-hidden className="block-4 inline-4" />}
    </button>
  )
}

export type SelectEmptyProps = ComponentProps<'div'>

/**
 * The empty-state slot: write it into `SelectPopup` alongside the options
 * and it shows itself only while it is the list's only child — i.e. while
 * there are no options. Pure CSS (`:only-child`), no wiring. The constraint
 * that makes it work: with no data, render no empty `SelectGroup` shell.
 */
export function SelectEmpty({ className, ...props }: SelectEmptyProps): ReactElement {
  return (
    <div
      className={cn(`
        hidden px-2 py-3 text-center text-sm text-muted-foreground
        only:block
      `, className)}
      data-slot="select-empty"
      role="status"
      {...props}
    />
  )
}

export {
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectValue,
}
