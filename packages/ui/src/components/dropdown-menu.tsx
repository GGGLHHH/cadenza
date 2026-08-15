'use client'

import type { Menu as MenuPrimitive } from '@base-ui/react/menu'
import type { ComponentProps, ReactElement, RefAttributes } from 'react'
import {
  DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
  DropdownMenuLabel as DropdownMenuGroupLabelPrimitive,
  DropdownMenuGroup as DropdownMenuGroupPrimitive,
  DropdownMenuItem as DropdownMenuItemPrimitive,
  DropdownMenuContent as DropdownMenuPopupPrimitive,
  DropdownMenuRadioGroup as DropdownMenuRadioGroupPrimitive,
  DropdownMenuRadioItem as DropdownMenuRadioItemPrimitive,
  DropdownMenu as DropdownMenuRootPrimitive,
  DropdownMenuSeparator as DropdownMenuSeparatorPrimitive,
  DropdownMenuShortcut,
  DropdownMenuSubContent as DropdownMenuSubmenuPopupPrimitive,
  DropdownMenuSub as DropdownMenuSubmenuPrimitive,
  DropdownMenuSubTrigger as DropdownMenuSubmenuTriggerPrimitive,
  DropdownMenuTrigger as DropdownMenuTriggerPrimitive,
} from '#primitives/dropdown-menu'

/**
 * The published DropdownMenu family — a menu of actions behind a trigger.
 *
 * Base UI's `Menu` under shadcn's base-nova skin. Composition is the whole
 * API — menu content is your actions, so there is no data-props one-liner
 * (that channel belongs to value-bearing controls like `Select`):
 *
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger render={<Button variant="outline" />}>打开</DropdownMenuTrigger>
 *   <DropdownMenuPopup>
 *     <DropdownMenuItem onClick={rename}>重命名</DropdownMenuItem>
 *     <DropdownMenuItem variant="destructive" onClick={remove}>删除</DropdownMenuItem>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuSubmenu>
 *       <DropdownMenuSubmenuTrigger>更多</DropdownMenuSubmenuTrigger>
 *       <DropdownMenuSubmenuPopup>…</DropdownMenuSubmenuPopup>
 *     </DropdownMenuSubmenu>
 *   </DropdownMenuPopup>
 * </DropdownMenu>
 * ```
 *
 * Naming is the Base UI vocabulary, so parts differ from shadcn's for anyone
 * migrating: `Content → Popup`, `Label → GroupLabel` (it titles a group, it
 * never labels the control), `Sub → Submenu`, `SubTrigger → SubmenuTrigger`,
 * `SubContent → SubmenuPopup`. The `data-slot` hooks keep the vendored
 * (shadcn) spelling — `dropdown-menu-content`, `dropdown-menu-label`,
 * `dropdown-menu-sub-trigger` — the same tolerated mismatch as Select.
 *
 * Worth knowing before reaching for a prop:
 *
 * - **`modal` defaults to `false`** (Base UI menus default to modal), matching
 *   Select and Cascader: opening the menu leaves the page scrollable and
 *   outside elements interactive. Pass `modal` to restore upstream behaviour;
 *   nested menus ignore it, hover-opened menus are never modal.
 * - **`DropdownMenuPopup` is Portal + Positioner + Popup in one part.** Its
 *   positioning props (`side`, `sideOffset`, `align`, `alignOffset`) go to the
 *   positioner, everything else to the popup. Same for `SubmenuPopup`, whose
 *   defaults already suit a side flyout.
 * - **Check and radio marks are built in** — `DropdownMenuCheckboxItem` and
 *   `DropdownMenuRadioItem` render their own indicator; there is no separate
 *   ItemIndicator part.
 * - **`DropdownMenuShortcut` is a plain `<span>`** for the right-aligned key
 *   hint — purely visual, it binds no keyboard event. Its `className` is a
 *   string (plain DOM, no state contract).
 * - **Selection lives elsewhere.** The moment the menu's job is choosing a
 *   value rather than firing actions, that is `Select` (single/multiple) or
 *   `Cascader` (drill-down) — both serialize into forms; a menu never does.
 *
 * Every re-declaration below is a cast, not a wrapper: the vendored parts
 * route each prop with a plain spread, but Base UI declares `ref` on the
 * component type rather than in `.Props`, so the published types restore it
 * with `RefAttributes`.
 */

export type DropdownMenuProps = MenuPrimitive.Root.Props
/** `onOpenChange`'s second argument. */
export type DropdownMenuOpenChangeEventDetails = MenuPrimitive.Root.ChangeEventDetails

export type DropdownMenuTriggerProps = MenuPrimitive.Trigger.Props & RefAttributes<HTMLButtonElement>
export type DropdownMenuTriggerState = MenuPrimitive.Trigger.State
export type DropdownMenuPopupProps = ComponentProps<typeof DropdownMenuPopupPrimitive> & RefAttributes<HTMLDivElement>
export type DropdownMenuPopupState = MenuPrimitive.Popup.State
export type DropdownMenuGroupProps = MenuPrimitive.Group.Props & RefAttributes<HTMLDivElement>
export type DropdownMenuGroupLabelProps = ComponentProps<typeof DropdownMenuGroupLabelPrimitive> & RefAttributes<HTMLDivElement>
export type DropdownMenuItemProps = ComponentProps<typeof DropdownMenuItemPrimitive> & RefAttributes<HTMLDivElement>
export type DropdownMenuItemState = MenuPrimitive.Item.State
export type DropdownMenuCheckboxItemProps = ComponentProps<typeof DropdownMenuCheckboxItemPrimitive> & RefAttributes<HTMLDivElement>
export type DropdownMenuCheckboxItemState = MenuPrimitive.CheckboxItem.State
export type DropdownMenuRadioGroupProps = MenuPrimitive.RadioGroup.Props & RefAttributes<HTMLDivElement>
export type DropdownMenuRadioItemProps = ComponentProps<typeof DropdownMenuRadioItemPrimitive> & RefAttributes<HTMLDivElement>
export type DropdownMenuRadioItemState = MenuPrimitive.RadioItem.State
export type DropdownMenuSeparatorProps = MenuPrimitive.Separator.Props & RefAttributes<HTMLDivElement>
export type DropdownMenuShortcutProps = ComponentProps<'span'>
export type DropdownMenuSubmenuProps = MenuPrimitive.SubmenuRoot.Props
export type DropdownMenuSubmenuTriggerProps = ComponentProps<typeof DropdownMenuSubmenuTriggerPrimitive> & RefAttributes<HTMLDivElement>
export type DropdownMenuSubmenuTriggerState = MenuPrimitive.SubmenuTrigger.State
export type DropdownMenuSubmenuPopupProps = ComponentProps<typeof DropdownMenuSubmenuPopupPrimitive> & RefAttributes<HTMLDivElement>

/**
 * The root. Renders no DOM of its own; the seam's one behavioural change is
 * the `modal={false}` default.
 */
export function DropdownMenu({ modal = false, ...props }: DropdownMenuProps): ReactElement {
  return <DropdownMenuRootPrimitive modal={modal} {...props} />
}

export const DropdownMenuTrigger = DropdownMenuTriggerPrimitive as (props: DropdownMenuTriggerProps) => ReactElement
export const DropdownMenuPopup = DropdownMenuPopupPrimitive as (props: DropdownMenuPopupProps) => ReactElement
export const DropdownMenuGroup = DropdownMenuGroupPrimitive as (props: DropdownMenuGroupProps) => ReactElement
export const DropdownMenuGroupLabel = DropdownMenuGroupLabelPrimitive as (props: DropdownMenuGroupLabelProps) => ReactElement
export const DropdownMenuItem = DropdownMenuItemPrimitive as (props: DropdownMenuItemProps) => ReactElement
export const DropdownMenuCheckboxItem = DropdownMenuCheckboxItemPrimitive as (props: DropdownMenuCheckboxItemProps) => ReactElement
export const DropdownMenuRadioGroup = DropdownMenuRadioGroupPrimitive as (props: DropdownMenuRadioGroupProps) => ReactElement
export const DropdownMenuRadioItem = DropdownMenuRadioItemPrimitive as (props: DropdownMenuRadioItemProps) => ReactElement
export const DropdownMenuSeparator = DropdownMenuSeparatorPrimitive as (props: DropdownMenuSeparatorProps) => ReactElement
export const DropdownMenuSubmenu = DropdownMenuSubmenuPrimitive as (props: DropdownMenuSubmenuProps) => ReactElement
export const DropdownMenuSubmenuTrigger = DropdownMenuSubmenuTriggerPrimitive as (props: DropdownMenuSubmenuTriggerProps) => ReactElement
export const DropdownMenuSubmenuPopup = DropdownMenuSubmenuPopupPrimitive as (props: DropdownMenuSubmenuPopupProps) => ReactElement

export { DropdownMenuShortcut }
