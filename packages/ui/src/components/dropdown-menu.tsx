'use client'

import type { Menu as MenuPrimitive } from '@base-ui/react/menu'
import type { ComponentProps, ReactElement, RefAttributes } from 'react'
import type {
  DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
  DropdownMenuItem as DropdownMenuItemPrimitive,
  DropdownMenuRadioItem as DropdownMenuRadioItemPrimitive,
  DropdownMenuSubTrigger as DropdownMenuSubmenuTriggerPrimitive,
} from '#primitives/dropdown-menu'
import { Menu as AnimatedMenu } from '@animate-ui/react/primitives/base-ui/menu'
import { IconCheck, IconChevronRight } from '@tabler/icons-react'
import { cn } from '#lib/utils'
import {
  DropdownMenuLabel as DropdownMenuGroupLabelPrimitive,
  DropdownMenuGroup as DropdownMenuGroupPrimitive,
  DropdownMenuSeparator as DropdownMenuSeparatorPrimitive,
  DropdownMenuShortcut,
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
// The rows are the vendored ones' composition and classes on animate-ui's
// parts: the vendored rows are Base UI's own, and animate-ui's row motion
// lives on its parts — the highlight gliding between rows (its items), checks
// drawing in, a radio's check gliding to the newly picked row (its radio
// group). The highlight keys off `data-highlighted` rather than the vendored
// `focus:`, as in `SelectItem` and `ComboboxItem`. The indicators take no
// `render`: animate-ui animates the check given as children, and steps aside
// for a `render`.

const ROW = `
  relative flex cursor-default items-center gap-1.5 rounded-md py-1 text-sm
  outline-hidden select-none
  data-highlighted:bg-accent data-highlighted:text-accent-foreground
  data-disabled:pointer-events-none data-disabled:opacity-50
  data-inset:ps-7
  [&_svg]:pointer-events-none [&_svg]:shrink-0
  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
`
const CHECK_ROW = `
  ps-1.5 pe-8 data-highlighted:**:text-accent-foreground
`
const INDICATOR = `
  pointer-events-none absolute inset-e-2 flex items-center justify-center
`

export function DropdownMenuItem({ className, inset, variant = 'default', ...props }: DropdownMenuItemProps): ReactElement {
  return (
    <AnimatedMenu.Item
      className={cn(
        ROW,
        `
          group/dropdown-menu-item px-1.5
          not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground
          data-[variant=destructive]:text-destructive
          data-[variant=destructive]:data-highlighted:bg-destructive/10
          data-[variant=destructive]:data-highlighted:text-destructive
          dark:data-[variant=destructive]:data-highlighted:bg-destructive/20
          data-[variant=destructive]:*:[svg]:text-destructive
        `,
        className,
      )}
      data-inset={inset}
      data-slot="dropdown-menu-item"
      data-variant={variant}
      {...props}
    />
  )
}

export function DropdownMenuCheckboxItem({ children, className, inset, ...props }: DropdownMenuCheckboxItemProps): ReactElement {
  return (
    <AnimatedMenu.CheckboxItem
      className={cn(ROW, CHECK_ROW, className)}
      data-inset={inset}
      data-slot="dropdown-menu-checkbox-item"
      {...props}
    >
      <AnimatedMenu.CheckboxItemIndicator className={INDICATOR} data-slot="dropdown-menu-checkbox-item-indicator">
        <IconCheck />
      </AnimatedMenu.CheckboxItemIndicator>
      {children}
    </AnimatedMenu.CheckboxItem>
  )
}

export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps): ReactElement {
  return <AnimatedMenu.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

export function DropdownMenuRadioItem({ children, className, inset, ...props }: DropdownMenuRadioItemProps): ReactElement {
  return (
    <AnimatedMenu.RadioItem
      className={cn(ROW, CHECK_ROW, className)}
      data-inset={inset}
      data-slot="dropdown-menu-radio-item"
      {...props}
    >
      <AnimatedMenu.RadioItemIndicator className={INDICATOR} data-slot="dropdown-menu-radio-item-indicator">
        <IconCheck />
      </AnimatedMenu.RadioItemIndicator>
      {children}
    </AnimatedMenu.RadioItem>
  )
}
export const DropdownMenuSeparator = DropdownMenuSeparatorPrimitive as (props: DropdownMenuSeparatorProps) => ReactElement
export function DropdownMenuSubmenu(props: DropdownMenuSubmenuProps): ReactElement {
  return <AnimatedMenu.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}
export function DropdownMenuSubmenuTrigger({ children, className, inset, ...props }: DropdownMenuSubmenuTriggerProps): ReactElement {
  return (
    <AnimatedMenu.SubmenuTrigger
      className={cn(
        ROW,
        `
          px-1.5
          not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground
          data-popup-open:bg-accent data-popup-open:text-accent-foreground
          data-open:bg-accent data-open:text-accent-foreground
        `,
        className,
      )}
      data-inset={inset}
      data-slot="dropdown-menu-sub-trigger"
      {...props}
    >
      {children}
      <IconChevronRight className="ms-auto" />
    </AnimatedMenu.SubmenuTrigger>
  )
}
export const DropdownMenuSubmenuPopup = DropdownMenuSubmenuPopupPart as (props: DropdownMenuSubmenuPopupProps) => ReactElement

export { DropdownMenuShortcut }
