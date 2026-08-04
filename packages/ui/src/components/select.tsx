'use client'

import type { ComponentProps, ReactElement, ReactNode, RefAttributes } from 'react'
import type {
  ListBoxProps,
  ListBoxSectionProps,
  SelectProps as RACSelectProps,
  SelectValueProps as RACSelectValueProps,
  SelectValueRenderProps,
} from 'react-aria-components'
import { use } from 'react'
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
 * The trigger, plus the one behaviour this seam adds: a click forwarded from an
 * associated `<label for>` opens the menu.
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
 */
function SelectTrigger({ onClickCapture, ...props }: SelectTriggerProps): ReactElement {
  const state = use(SelectStateContext)

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
