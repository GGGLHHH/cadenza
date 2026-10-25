'use client'

import type { Menu as MenuPrimitive } from '@base-ui/react/menu'
import type { ComponentProps, ReactElement, RefAttributes } from 'react'
import { Menu as AnimatedMenu } from '@animate-ui/react/primitives/base-ui/menu'
import { cn } from '#lib/utils'
import {
  DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
  DropdownMenuLabel as DropdownMenuGroupLabelPrimitive,
  DropdownMenuGroup as DropdownMenuGroupPrimitive,
  DropdownMenuItem as DropdownMenuItemPrimitive,
  DropdownMenuRadioGroup as DropdownMenuRadioGroupPrimitive,
  DropdownMenuRadioItem as DropdownMenuRadioItemPrimitive,
  DropdownMenuSeparator as DropdownMenuSeparatorPrimitive,
  DropdownMenuShortcut,
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

// The vendored DropdownMenuContent / SubContent, rebuilt on animate-ui's
// parts: its Portal and Popup read the open state from its own Root and
// SubmenuRoot, which the vendored parts are not wired to. Composition and
// classes are the vendored ones minus tw-animate; the items, labels and
// triggers stay vendored — they only read Base UI's context, which
// animate-ui's Root still provides.
type MenuPopupPartProps = AnimatedMenu.Popup.Props
  & Pick<AnimatedMenu.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>

function DropdownMenuPopupPart({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  className,
  ...props
}: MenuPopupPartProps): ReactElement {
  return (
    <AnimatedMenu.Portal>
      <AnimatedMenu.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <AnimatedMenu.Popup
          data-slot="dropdown-menu-content"
          className={cn(`
            z-50 overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1
            text-popover-foreground shadow-md ring-1 ring-foreground/10
            outline-none inline-(--anchor-width) max-block-(--available-height)
            min-inline-32
            data-closed:overflow-hidden
          `, className)}
          {...props}
        />
      </AnimatedMenu.Positioner>
    </AnimatedMenu.Portal>
  )
}

function DropdownMenuSubmenuPopupPart({
  align = 'start',
  alignOffset = -3,
  side = 'right',
  sideOffset = 0,
  className,
  ...props
}: MenuPopupPartProps): ReactElement {
  return (
    <DropdownMenuPopupPart
      data-slot="dropdown-menu-sub-content"
      className={cn(`
        rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1
        ring-foreground/10 inline-auto min-inline-24
      `, className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

export type DropdownMenuProps = MenuPrimitive.Root.Props
/** `onOpenChange`'s second argument. */
export type DropdownMenuOpenChangeEventDetails = MenuPrimitive.Root.ChangeEventDetails

export type DropdownMenuTriggerProps = MenuPrimitive.Trigger.Props & RefAttributes<HTMLButtonElement>
export type DropdownMenuTriggerState = MenuPrimitive.Trigger.State
export type DropdownMenuPopupProps = ComponentProps<typeof DropdownMenuPopupPart> & RefAttributes<HTMLDivElement>
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
export type DropdownMenuSubmenuPopupProps = ComponentProps<typeof DropdownMenuSubmenuPopupPart> & RefAttributes<HTMLDivElement>

/**
 * The root. Renders no DOM of its own; the seam's one behavioural change is
 * the `modal={false}` default.
 */
export function DropdownMenu({ modal = false, ...props }: DropdownMenuProps): ReactElement {
  return <AnimatedMenu.Root data-slot="dropdown-menu" modal={modal} {...props} />
}

export const DropdownMenuTrigger = DropdownMenuTriggerPrimitive as (props: DropdownMenuTriggerProps) => ReactElement
export const DropdownMenuPopup = DropdownMenuPopupPart as (props: DropdownMenuPopupProps) => ReactElement
export const DropdownMenuGroup = DropdownMenuGroupPrimitive as (props: DropdownMenuGroupProps) => ReactElement
export const DropdownMenuGroupLabel = DropdownMenuGroupLabelPrimitive as (props: DropdownMenuGroupLabelProps) => ReactElement
export const DropdownMenuItem = DropdownMenuItemPrimitive as (props: DropdownMenuItemProps) => ReactElement
export const DropdownMenuCheckboxItem = DropdownMenuCheckboxItemPrimitive as (props: DropdownMenuCheckboxItemProps) => ReactElement
export const DropdownMenuRadioGroup = DropdownMenuRadioGroupPrimitive as (props: DropdownMenuRadioGroupProps) => ReactElement
export const DropdownMenuRadioItem = DropdownMenuRadioItemPrimitive as (props: DropdownMenuRadioItemProps) => ReactElement
export const DropdownMenuSeparator = DropdownMenuSeparatorPrimitive as (props: DropdownMenuSeparatorProps) => ReactElement
export function DropdownMenuSubmenu(props: DropdownMenuSubmenuProps): ReactElement {
  return <AnimatedMenu.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}
export const DropdownMenuSubmenuTrigger = DropdownMenuSubmenuTriggerPrimitive as (props: DropdownMenuSubmenuTriggerProps) => ReactElement
export const DropdownMenuSubmenuPopup = DropdownMenuSubmenuPopupPart as (props: DropdownMenuSubmenuPopupProps) => ReactElement

export { DropdownMenuShortcut }
