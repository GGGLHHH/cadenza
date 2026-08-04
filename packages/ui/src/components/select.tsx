'use client'

import type {
  ComponentProps,
  ReactElement,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  RefAttributes,
} from 'react'
import type {
  ListBoxProps,
  ListBoxSectionProps,
  SelectProps as RACSelectProps,
  SelectValueProps as RACSelectValueProps,
  SelectValueRenderProps,
} from 'react-aria-components'
import { use, useEffect, useRef } from 'react'
import { SelectStateContext } from 'react-aria-components'
import {
  SelectContent,
  SelectEmpty,
  SelectGroup as SelectGroupPrimitive,
  SelectItem,
  SelectLabel,
  SelectList as SelectListPrimitive,
  SelectPopover,
  Select as SelectPrimitive,
  SelectSeparator,
  SelectTrigger as SelectTriggerPrimitive,
  SelectValue as SelectValuePrimitive,
} from '#primitives/select'

/**
 * The published Select family.
 *
 * React Aria's `Select` underneath — `value` / `defaultValue` / `onChange`,
 * `selectionMode`, `placeholder`, `isDisabled`, `isInvalid`, all passed
 * straight through. (`selectedKey` / `onSelectionChange` still exist but React
 * Stately has deprecated them; they type as `Key | null` either way, so the
 * single/multiple discrimination is lost. Use the new trio.)
 *
 * Composition is the API, and there are two assembly lines:
 *
 * ```tsx
 * // Shortcut: SelectContent is SelectPopover + SelectList in one part.
 * <SelectContent>
 *   <SelectGroup items={fruits}>{fruit => <SelectItem>{fruit.name}</SelectItem>}</SelectGroup>
 * </SelectContent>
 *
 * // Full: reach for this when you need the list's own props — `renderEmptyState`
 * // above all, which SelectContent cannot forward.
 * <SelectPopover>
 *   <SelectList items={fruits} renderEmptyState={() => <SelectEmpty>No fruit</SelectEmpty>}>
 *     {fruit => <SelectItem>{fruit.name}</SelectItem>}
 *   </SelectList>
 * </SelectPopover>
 * ```
 *
 * Five things worth knowing before reaching for a prop that looks like it
 * should work:
 *
 * - **The visible label is not part of this family.** The trigger is box-only,
 *   so the text label is a sibling `FieldLabel` pointed at it, and `Select`
 *   carries the matching `aria-label` — React Aria names the trigger, and the
 *   root is a plain `div` it never labels:
 *
 *   ```tsx
 *   <Field>
 *     <FieldLabel htmlFor="fruit">Fruit</FieldLabel>
 *     <Select aria-label="Fruit">
 *       <SelectTrigger id="fruit"><SelectValue /></SelectTrigger>
 *       …
 *   ```
 *
 *   Both channels are load-bearing and they carry different halves. `htmlFor`
 *   is what makes clicking the text focus the trigger and open the menu (see
 *   `SelectTrigger` — the opening half is this seam's addition; React Aria and
 *   a native `<select>` both stop at focus). The `aria-label` is what actually
 *   names the control, and dropping it does not degrade the name, it removes
 *   it: React Aria
 *   puts its own `aria-labelledby` on the trigger, and that outranks a native
 *   `<label for>` in the accessible-name computation, so the label text is
 *   never consulted. Write the same string twice.
 * - **`SelectLabel` is a group heading**, not the control's label — it is RAC's
 *   `Header`, meant for the title above a `SelectGroup`'s items.
 * - **Dynamic collections live on `SelectGroup` or `SelectList`**, never on the
 *   root: RAC omits `items` from `SelectProps` entirely, and `SelectContent`
 *   seals the list it renders.
 * - **`SelectEmpty` only works through `SelectList`'s `renderEmptyState`.**
 *   Written as a child of `SelectList` it is swallowed by RAC's collection
 *   builder; written outside it never matches the `group/select-list` its
 *   visibility rule keys off. Both mistakes render nothing and report nothing.
 * - **`SelectTrigger` appends its own chevron** after `children`, which is why
 *   its children stay `ReactNode`: RAC's function form would never be called.
 *
 * Three `data-slot` values here are wiring, not labels — passing your own
 * silently unstyles things. `select-value` is what the trigger's layout rules
 * target, `select-item` is matched by suffix (`[data-slot$=-item]`) for the
 * focus highlight, and `SelectList`'s `group/select-list` class is what
 * `SelectEmpty` keys off. Add your own marker under a different attribute.
 */

// RAC declares refs on the component types rather than in the props, so the
// four parts the primitive types with bare RAC interfaces lose them — restated
// here. The spreads already carry the ref at runtime. The parts typed
// `ComponentProps<typeof …>` keep theirs: RAC puts `RefAttributes` in the props
// parameter, and `Omit` on an intersection does not strip it.
export type SelectProps<
  T extends object = object,
  M extends 'single' | 'multiple' = 'single',
> = RACSelectProps<T, M> & RefAttributes<HTMLDivElement>

/** Generic, unlike the vendored part: `items` plus function children. */
export type SelectGroupProps<T extends object = object>
  = ListBoxSectionProps<T> & RefAttributes<HTMLElement>

/** Generic, unlike the vendored part: `items`, function children, `renderEmptyState`. */
export type SelectListProps<T extends object = object>
  = ListBoxProps<T> & RefAttributes<HTMLDivElement>

/**
 * `children` is narrowed to RAC's function form on purpose. The primitive
 * discards any non-function children and renders its own function instead, so
 * `<SelectValue>Hello</SelectValue>` puts nothing on screen — the narrowing
 * turns that silent drop into a compile error. Placeholder text is `Select`'s
 * `placeholder` prop, not this.
 */
export type SelectValueProps<T extends object = object>
  = Omit<RACSelectValueProps<T>, 'children'>
    & RefAttributes<HTMLSpanElement>
    & {
      children?: (
        values: SelectValueRenderProps<T> & { defaultChildren: ReactNode | undefined },
      ) => ReactNode
    }

export type SelectTriggerProps = ComponentProps<typeof SelectTriggerPrimitive>
export type SelectContentProps = ComponentProps<typeof SelectContent>
export type SelectPopoverProps = ComponentProps<typeof SelectPopover>
export type SelectItemProps = ComponentProps<typeof SelectItem>
export type SelectLabelProps = ComponentProps<typeof SelectLabel>
export type SelectSeparatorProps = ComponentProps<typeof SelectSeparator>
export type SelectEmptyProps = ComponentProps<typeof SelectEmpty>

/**
 * How far the pointer must travel, while held, before a release over an option
 * counts as a deliberate drag-select rather than a drift during a click.
 *
 * Base UI reads 8px as a drag, which does not transfer: its popup puts the
 * selected item under the cursor, so travel means leaving that item, and the
 * item under the cursor is guarded by time alone. Here the menu opens below —
 * the first option starts about 8px under the trigger's bottom edge, so an 8px
 * threshold unlocks exactly the drift this is meant to catch. The number has to
 * clear the gap plus most of a 28px row, and stay under the ~38px a drag from
 * the middle of the trigger to the first option covers.
 */
const DRAG_UNLOCK_PX = 24

/**
 * How long the pointer must stay down before a release over an option counts as
 * deliberate on its own. Base UI's `SELECTED_DELAY`.
 */
const HOLD_UNLOCK_MS = 400

/**
 * Marks the document while a press on a trigger is still unclassified. Paired
 * with the rule in `styles.css` that makes select lists untargetable — see
 * {@link SelectTrigger}. Exported so a consumer styling around it has a name to
 * refer to rather than a string copied out of the stylesheet.
 */
export const PRESS_GRACE_ATTRIBUTE = 'data-select-press-grace'

/**
 * The trigger. Two behaviours live here that React Aria does not provide, both
 * about the same thing: what a press on the trigger is allowed to do.
 *
 * ## A click forwarded from an associated `<label for>` opens the menu
 *
 * React Aria deliberately stops at focus — `useSelect`'s own `labelProps.onClick`
 * only calls `focus()`, matching a native `<select>`. And when the label is not
 * React Aria's own, as in the `Field` anatomy, even that does not apply: the
 * browser forwards a bare `click` with no pointer sequence behind it, `usePress`
 * never sees a press, and clicking the text does nothing but focus.
 *
 * The forwarded click is told apart by where it landed. It carries the
 * coordinates of the click on the *label*, so it reports a position outside the
 * trigger's own box; a press on the trigger reports one inside it. Assistive
 * tech and `element.click()` land at the origin, which is also outside — those
 * arrive with `detail === 0` and `usePress` already handles them, so they are
 * excluded rather than opened twice. Keyboard activation never produces a click
 * at all (React Aria calls `preventDefault`).
 *
 * Deliberately stateless: tracking the pointer sequence instead looks tempting
 * and does not work, because React Aria's overlay swallows the trigger's own
 * click once the menu is open, so any flag set on `pointerdown` is never cleared.
 *
 * ## A press that opens the menu cannot also pick an option
 *
 * The menu opens on press *start*, four pixels under the trigger. Release ten
 * pixels lower — a drift, not a gesture — and the pointer is over the first
 * option, which commits. Nothing about that requires the press to have started
 * on the option:
 *
 * ```js
 * // react-aria/usePress.mjs — the element's own pointerup handler
 * if (e.button === 0 && !state.isPressed)
 *   triggerPressUpEvent(e, state.pointerType || e.pointerType)
 * ```
 *
 * `!state.isPressed` is not a guard against foreign presses, it *selects* for
 * them: an element mid-press defers to `onClick` instead, so this branch exists
 * precisely for a release the element did not start. React Aria then wires that
 * branch up for every option — `useSelect` hands the listbox
 * `shouldSelectOnPressUp: true` and `shouldFocusOnHover: true`, whose product is
 * `useOption`'s `allowsDifferentPressOrigin`, which is what subscribes
 * `onPressUp` to selection. It is the native `<select>` press-drag-release
 * gesture, and it fires for an ordinary click that drifted.
 *
 * So the press is classified, on the two axes Base UI's Select uses (its
 * `SelectTrigger`/`SelectItem` pair, same bug, same fix). Until it reads as a
 * gesture the list is made untargetable, so the release lands on the popover and
 * commits nothing:
 *
 * - travelled more than {@link DRAG_UNLOCK_PX} → a drag, unlock
 * - held longer than {@link HOLD_UNLOCK_MS} → deliberate, unlock
 * - released → unlock on the next tick, after this release is over
 *
 * `pointer-events` rather than swallowing the event: `stopPropagation` on a
 * `pointerup` also takes it from React Aria's own global listener (the one
 * `usePress` registers on `document` at press start), and a library has no
 * business deleting an event other code is listening for. Mouse only — the
 * `onPressUp` above only selects for `pointerType === 'mouse'`, so touch and pen
 * were never affected and must not start being.
 *
 * The lock is an attribute on the document element, paired with a rule in
 * `styles.css`, rather than an inline style on the list. The list does not exist
 * yet when the press starts — the menu it belongs to is what the press is
 * opening — so anything that reaches for the element has to guess when it lands,
 * and that guess is wrong on any machine where React commits a frame later than
 * this one. A rule that is already in the stylesheet applies the moment the list
 * mounts, whenever that is.
 */
function SelectTrigger({ onClickCapture, onPointerDown, ...props }: SelectTriggerProps): ReactElement {
  const state = use(SelectStateContext)
  // The teardown of the press currently being classified, if any. Also the
  // unmount safety net: a press that outlives its trigger still lets go.
  const unlockRef = useRef<(() => void) | null>(null)
  useEffect(() => () => unlockRef.current?.(), [])

  const lockUntilClassified = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    unlockRef.current?.()
    if (event.button !== 0 || event.pointerType !== 'mouse')
      return

    const trigger = event.currentTarget
    const doc = trigger.ownerDocument
    const view = doc.defaultView
    if (view === null)
      return

    const originX = event.clientX
    const originY = event.clientY
    let holdTimer = 0
    let releaseTimer = 0

    const unlock = (): void => {
      unlockRef.current = null
      doc.documentElement.removeAttribute(PRESS_GRACE_ATTRIBUTE)
      doc.removeEventListener('pointermove', onMove, true)
      doc.removeEventListener('pointerup', onRelease, true)
      view.clearTimeout(holdTimer)
      view.clearTimeout(releaseTimer)
    }

    function onMove(moved: PointerEvent): void {
      if (Math.abs(moved.clientX - originX) > DRAG_UNLOCK_PX
        || Math.abs(moved.clientY - originY) > DRAG_UNLOCK_PX) {
        unlock()
      }
    }

    // Not on this release — the guard has to still be up while it is dispatched.
    function onRelease(): void {
      releaseTimer = view!.setTimeout(unlock, 0)
    }

    unlockRef.current = unlock
    doc.documentElement.setAttribute(PRESS_GRACE_ATTRIBUTE, '')
    doc.addEventListener('pointermove', onMove, true)
    doc.addEventListener('pointerup', onRelease, true)
    holdTimer = view.setTimeout(unlock, HOLD_UNLOCK_MS)
  }

  return (
    <SelectTriggerPrimitive
      {...props}
      onClickCapture={(event) => {
        const box = event.currentTarget.getBoundingClientRect()
        const landedOutside = event.clientX < box.left || event.clientX > box.right
          || event.clientY < box.top || event.clientY > box.bottom
        if (landedOutside && event.detail !== 0)
          state?.toggle()
        onClickCapture?.(event)
      }}
      onPointerDown={(event) => {
        lockUntilClassified(event)
        onPointerDown?.(event)
      }}
    />
  )
}

// Casts, not wrappers: every prop already reaches the primitive through a plain
// spread, so only the types need restating. One cast at the seam instead of one
// at every dynamic-collection call site.
type SelectMode = 'single' | 'multiple'

const Select = SelectPrimitive as <T extends object = object, M extends SelectMode = 'single'>(
  props: SelectProps<T, M>,
) => ReactElement

const SelectGroup = SelectGroupPrimitive as <T extends object = object>(
  props: SelectGroupProps<T>,
) => ReactElement

const SelectList = SelectListPrimitive as <T extends object = object>(
  props: SelectListProps<T>,
) => ReactElement

const SelectValue = SelectValuePrimitive as <T extends object = object>(
  props: SelectValueProps<T>,
) => ReactElement

export {
  Select,
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectList,
  SelectPopover,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
