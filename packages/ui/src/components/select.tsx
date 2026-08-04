import type { ComponentProps } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
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
 *   <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
 *   <SelectContent>
 *     <SelectGroup>
 *       {fruits.map(fruit => <SelectItem key={fruit.id} value={fruit.id}>{fruit.name}</SelectItem>)}
 *     </SelectGroup>
 *   </SelectContent>
 * </Select>
 * ```
 *
 * Four things worth knowing before reaching for a prop that looks like it
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
 * - **The empty state is your own JSX.** There is no `renderEmptyState` hook,
 *   and none is needed: render whatever you want inside `SelectContent` when the
 *   list is empty. An empty Select still opens.
 *
 * `SelectContent` is Portal + Positioner + Popup + List in one part, with the
 * scroll arrows already inside. Its positioning props (`side`, `sideOffset`,
 * `align`, `alignOffset`, `alignItemWithTrigger`) go to the positioner and
 * everything else to the popup.
 *
 * `alignItemWithTrigger` defaults to true — the selected item sits *under the
 * cursor* when the menu opens, the way a native macOS select does. That is also
 * what keeps a click from picking an option by accident: Base UI unlocks an
 * item for a mouse release only after a 400ms hold, or after the pointer has
 * dragged 8px off it.
 *
 * Two `data-slot` values here are wiring, not labels — passing your own silently
 * unstyles things. `select-value` is what the trigger's layout rules target, and
 * `select-item` is what the focus highlight matches. Add your own marker under a
 * different attribute.
 */
export type SelectProps = ComponentProps<typeof Select>
export type SelectContentProps = ComponentProps<typeof SelectContent>
export type SelectGroupProps = ComponentProps<typeof SelectGroup>
export type SelectItemProps = ComponentProps<typeof SelectItem>
export type SelectLabelProps = ComponentProps<typeof SelectLabel>
export type SelectSeparatorProps = ComponentProps<typeof SelectSeparator>
export type SelectTriggerProps = ComponentProps<typeof SelectTrigger>
export type SelectValueProps = ComponentProps<typeof SelectValue>

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
