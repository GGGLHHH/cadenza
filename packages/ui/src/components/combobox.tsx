'use client'

import type { ReactElement } from 'react'
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'
import { IconCheck, IconChevronDown, IconX } from '@tabler/icons-react'
import { cn, dataAttr } from '#lib/utils'
import { Button } from './button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group'

export type ComboboxProps<Value, Multiple extends boolean | undefined = false>
  = ComboboxPrimitive.Root.Props<Value, Multiple>
export type ComboboxState = ComboboxPrimitive.Root.State
export type ComboboxChangeEventDetails = ComboboxPrimitive.Root.ChangeEventDetails
export type ComboboxValueProps = ComboboxPrimitive.Value.Props
export type ComboboxTriggerProps = ComboboxPrimitive.Trigger.Props
export type ComboboxClearProps = ComboboxPrimitive.Clear.Props
export type ComboboxPopupProps = ComboboxPrimitive.Popup.Props
  & Pick<ComboboxPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'anchor' | 'side' | 'sideOffset'>
export type ComboboxListProps = ComboboxPrimitive.List.Props
export type ComboboxItemProps = ComboboxPrimitive.Item.Props
export type ComboboxGroupProps = ComboboxPrimitive.Group.Props
export type ComboboxGroupLabelProps = ComboboxPrimitive.GroupLabel.Props
export type ComboboxCollectionProps = ComboboxPrimitive.Collection.Props
export type ComboboxEmptyProps = ComboboxPrimitive.Empty.Props
export type ComboboxSeparatorProps = ComboboxPrimitive.Separator.Props
export type ComboboxChipsProps = ComboboxPrimitive.Chips.Props
export type ComboboxChipProps = ComboboxPrimitive.Chip.Props & {
  /** Render the chip's own remove button. */
  removable?: boolean
}
export type ComboboxChipsInputProps = ComboboxPrimitive.Input.Props

export type ComboboxInputProps
  = Omit<ComboboxPrimitive.Input.Props, 'className'>
    & {
    /** Render the dropdown arrow. Off for an input that lives inside the popup. */
      trigger?: boolean
      /**
       * Render the clear button. It only mounts once there is something to
       * clear, and the arrow steps aside while it is on screen — see
       * `ComboboxClear` for what "something" means in each selection mode.
       */
      clearable?: boolean
      /**
       * Classes for the bordered **row**, not the input inside it — the row is
       * the `InputGroup` this part assembles, a plain DOM element, so this is a
       * string and not the Base UI `(state) => string` form.
       */
      className?: string
    }

/**
 * The published Combobox family — a text input that filters a list.
 *
 * ```tsx
 * <Combobox items={composers}>
 *   <ComboboxInput placeholder="搜索作曲家" />
 *   <ComboboxPopup>
 *     <ComboboxEmpty>没有匹配</ComboboxEmpty>
 *     <ComboboxList>
 *       {(composer: string) => <ComboboxItem key={composer} value={composer}>{composer}</ComboboxItem>}
 *     </ComboboxList>
 *   </ComboboxPopup>
 * </Combobox>
 * ```
 *
 * **This one filters in the browser.** The whole list lives in `items` and Base
 * UI narrows it as you type. When the list lives on a server and arrives a page
 * at a time, that is a different component —
 * [`InfiniteCombobox`](/docs/components/infinite-select), which owns its own
 * query and paging.
 *
 * This is the seam's own port of shadcn's composition, not a re-export. The
 * vendored file is one of the two the build excludes: its `ComboboxInput`
 * declares the Base UI function `className` and then routes it to an
 * `InputGroup`, a plain DOM element that can only take a string — the type
 * promised a contract the element could not keep, and `tsc` said so. The port
 * fixes the route by telling the truth about it, and takes the chance to settle
 * the names:
 *
 * - `ComboboxContent` → **`ComboboxPopup`** (a popup is a Popup; Content is for
 *   content moved *into* a popup, as in navigation-menu)
 * - `ComboboxLabel` → **`ComboboxGroupLabel`**, since that is what it is — the
 *   heading over a `ComboboxGroup`, not the field's label
 * - `showTrigger` / `showClear` → **`trigger`** / **`clearable`**; the library
 *   has no `show*` booleans
 * - `useComboboxAnchor` is gone. It returned `useRef<HTMLDivElement>(null)` and
 *   nothing else; a published hook is a promise to keep, and this one had no
 *   content. Pass an ordinary ref to `ComboboxPopup`'s `anchor`.
 *
 * Everything else is Base UI's, passed straight through: the controlled triple
 * `value` / `defaultValue` / `onValueChange`, `inputValue` /
 * `onInputValueChange` for the text, `multiple`, `disabled`, `readOnly`,
 * `name`, and the `Value` / `Multiple` generics — which stay generic, so a
 * `multiple` combobox hands its callback an array and a single one does not.
 */
export function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxProps<Value, Multiple>,
): ReactElement {
  return <ComboboxPrimitive.Root {...props} />
}

/** The selected value, for a trigger that shows it. */
export function ComboboxValue(props: ComboboxValueProps): ReactElement {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

/** The dropdown arrow. `ComboboxInput` renders one unless told not to. */
export function ComboboxTrigger({
  children,
  className,
  ...props
}: ComboboxTriggerProps): ReactElement {
  return (
    <ComboboxPrimitive.Trigger
      aria-label="Open list"
      className={cn(`
        [&_svg:not([class*='size-'])]:block-4
        [&_svg:not([class*='size-'])]:inline-4
      `, className)}
      data-slot="combobox-trigger"
      {...props}
    >
      {children}
      <IconChevronDown className="
        pointer-events-none text-muted-foreground block-4 inline-4
      "
      />
    </ComboboxPrimitive.Trigger>
  )
}

/**
 * Clears the combobox. Base UI mounts it only when there is something to clear,
 * and what that means follows the selection mode: a selected value when single
 * (the default), at least one chip when `multiple`, and any text at all when
 * `selectionMode="none"` — so a single combobox you have merely typed in, but
 * not picked from, still shows the arrow. That conditional mounting is what
 * lets this and the arrow share one slot in the row.
 */
export function ComboboxClear({ className, ...props }: ComboboxClearProps): ReactElement {
  return (
    <ComboboxPrimitive.Clear
      aria-label="Clear"
      className={className}
      data-slot="combobox-clear"
      render={<InputGroupButton size="icon-xs" variant="ghost" />}
      {...props}
    >
      <IconX className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  )
}

/**
 * The text field, assembled as a bordered row: the input, then the arrow and
 * the clear button in a trailing addon. `children` go into the row after them.
 */
export function ComboboxInput({
  children,
  className,
  clearable = true,
  trigger = true,
  ...props
}: ComboboxInputProps): ReactElement {
  return (
    <InputGroup className={cn('inline-auto', className)}>
      {/*
        Nothing here passes `disabled` down. Base UI's Input already resolves
        `fieldDisabled || comboboxDisabled || disabledProp` and writes it on
        whatever it renders — and a render element's own props win the merge, so
        the vendored `disabled = false` default was overwriting that: a
        root-level `<Combobox disabled>` left the field typable and the row
        un-greyed. The trigger and the clear button read the same root state
        for themselves (`useStore(store, selectors.disabled)`), and a caller's
        own `disabled` still rides in through the spread.
      */}
      <ComboboxPrimitive.Input render={<InputGroupInput />} {...props} />
      {(trigger || clearable) && (
        <InputGroupAddon align="inline-end">
          {trigger && (
            <InputGroupButton
              className={`
                group-has-data-[slot=combobox-clear]/input-group:hidden
                data-pressed:bg-transparent
              `}
              // Both of these are the outer button's defaults asserting
              // themselves over the part underneath: `Button` writes
              // `data-slot="button"` and `useButton` writes `tabIndex=0`, and a
              // render element's props win the merge. Base UI gives its trigger
              // `tabIndex: -1` on purpose when the input is outside the popup —
              // the input is the tab stop, the arrow would be a duplicate one.
              data-slot="combobox-trigger"
              render={<ComboboxTrigger />}
              size="icon-xs"
              tabIndex={-1}
              variant="ghost"
            />
          )}
          {clearable && <ComboboxClear />}
        </InputGroupAddon>
      )}
      {children}
    </InputGroup>
  )
}

/**
 * The floating list. Anchors to the input by default; pass `anchor` a ref to
 * anchor it elsewhere — a `ComboboxChips` row, say.
 */
export function ComboboxPopup({
  align = 'start',
  alignOffset = 0,
  anchor,
  className,
  side = 'bottom',
  sideOffset = 6,
  ...props
}: ComboboxPopupProps): ReactElement {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <ComboboxPrimitive.Popup
          className={cn(
            `
              group/combobox-popup relative origin-(--transform-origin)
              overflow-hidden rounded-lg bg-popover text-popover-foreground
              shadow-md ring-1 ring-foreground/10 duration-100
              inline-(--anchor-width) max-block-(--available-height)
              max-inline-(--available-width)
              min-inline-[calc(var(--anchor-width)+(--spacing(7)))]
              data-chips:min-inline-(--anchor-width)
              data-[side=bottom]:slide-in-from-top-2
              data-[side=inline-end]:slide-in-from-left-2
              data-[side=inline-start]:slide-in-from-right-2
              data-[side=left]:slide-in-from-right-2
              data-[side=right]:slide-in-from-left-2
              data-[side=top]:slide-in-from-bottom-2
              *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mbe-0
              *:data-[slot=input-group]:border-input/30
              *:data-[slot=input-group]:bg-input/30
              *:data-[slot=input-group]:shadow-none
              *:data-[slot=input-group]:block-8
              *:data-[slot=input-group]:focus-within:border-inherit
              *:data-[slot=input-group]:focus-within:ring-0
              data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
              data-closed:animate-out data-closed:fade-out-0
              data-closed:zoom-out-95
            `,
            className,
          )}
          data-chips={dataAttr(anchor !== undefined)}
          data-slot="combobox-popup"
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

/** The scrolling list of items. Takes a render function over the filtered items. */
export function ComboboxList({ className, ...props }: ComboboxListProps): ReactElement {
  return (
    <ComboboxPrimitive.List
      className={cn(
        `
          no-scrollbar scroll-py-1 overflow-y-auto overscroll-contain p-1
          max-block-[min(calc(--spacing(72)-(--spacing(9))),calc(var(--available-height)-(--spacing(9))))]
          data-empty:p-0
        `,
        className,
      )}
      data-slot="combobox-list"
      {...props}
    />
  )
}

/** One option. `value` is what lands in the combobox's value. */
export function ComboboxItem({ children, className, ...props }: ComboboxItemProps): ReactElement {
  return (
    <ComboboxPrimitive.Item
      className={cn(
        `
          relative flex cursor-default items-center gap-2 rounded-md py-1 ps-1.5
          pe-8 text-sm outline-hidden select-none inline-full
          data-highlighted:bg-accent data-highlighted:text-accent-foreground
          not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground
          data-disabled:pointer-events-none data-disabled:opacity-50
          [&_svg]:pointer-events-none [&_svg]:shrink-0
          [&_svg:not([class*='size-'])]:block-4
          [&_svg:not([class*='size-'])]:inline-4
        `,
        className,
      )}
      data-slot="combobox-item"
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={(
          <span className="
            pointer-events-none absolute inset-e-2 flex items-center
            justify-center block-4 inline-4
          "
          />
        )}
      >
        <IconCheck className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

/** A section of items. Pair with `ComboboxGroupLabel` for a heading. */
export function ComboboxGroup({ className, ...props }: ComboboxGroupProps): ReactElement {
  return (
    <ComboboxPrimitive.Group className={className} data-slot="combobox-group" {...props} />
  )
}

/** The heading over a `ComboboxGroup` — not the field's label. */
export function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxGroupLabelProps): ReactElement {
  return (
    <ComboboxPrimitive.GroupLabel
      className={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
      data-slot="combobox-group-label"
      {...props}
    />
  )
}

/** Renders a group's items. The grouped-list counterpart to `ComboboxList`. */
export function ComboboxCollection(props: ComboboxCollectionProps): ReactElement {
  return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
}

/** Shown when the filter matches nothing. The library ships no copy — write it. */
export function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps): ReactElement {
  return (
    <ComboboxPrimitive.Empty
      className={cn(
        `
          hidden justify-center py-2 text-center text-sm text-muted-foreground
          inline-full
          group-data-empty/combobox-popup:flex
        `,
        className,
      )}
      data-slot="combobox-empty"
      {...props}
    />
  )
}

export function ComboboxSeparator({ className, ...props }: ComboboxSeparatorProps): ReactElement {
  return (
    <ComboboxPrimitive.Separator
      className={cn('-mx-1 my-1 bg-border block-px', className)}
      data-slot="combobox-separator"
      {...props}
    />
  )
}

/**
 * The bordered row that holds the selected chips and the input, for a
 * `multiple` combobox. Give it a ref and hand the same ref to `ComboboxPopup`'s
 * `anchor` so the list tracks the row as it grows.
 */
export function ComboboxChips({ className, ...props }: ComboboxChipsProps): ReactElement {
  return (
    <ComboboxPrimitive.Chips
      className={cn(
        `
          flex flex-wrap items-center gap-1 rounded-lg border border-input
          bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors
          min-block-8
          focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50
          has-aria-invalid:border-destructive has-aria-invalid:ring-3
          has-aria-invalid:ring-destructive/20
          has-data-[slot=combobox-chip]:px-1
          dark:bg-input/30
          dark:has-aria-invalid:border-destructive/50
          dark:has-aria-invalid:ring-destructive/40
        `,
        className,
      )}
      data-slot="combobox-chips"
      {...props}
    />
  )
}

/** One selected value in a `ComboboxChips` row. */
export function ComboboxChip({
  children,
  className,
  removable = true,
  ...props
}: ComboboxChipProps): ReactElement {
  return (
    <ComboboxPrimitive.Chip
      className={cn(
        `
          flex items-center justify-center gap-1 rounded-sm bg-muted px-1.5
          text-xs font-medium whitespace-nowrap text-foreground
          block-[calc(--spacing(5.25))] inline-fit
          has-disabled:pointer-events-none has-disabled:cursor-not-allowed
          has-disabled:opacity-50
          has-data-[slot=combobox-chip-remove]:pe-0
        `,
        className,
      )}
      data-slot="combobox-chip"
      {...props}
    >
      {children}
      {removable && (
        <ComboboxPrimitive.ChipRemove
          className="
            -ms-1 opacity-50
            hover:opacity-100
          "
          data-slot="combobox-chip-remove"
          render={<Button size="icon-xs" variant="ghost" />}
        >
          <IconX className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  )
}

/** The bare input that sits among the chips — no border of its own. */
export function ComboboxChipsInput({
  className,
  ...props
}: ComboboxChipsInputProps): ReactElement {
  return (
    <ComboboxPrimitive.Input
      className={cn('flex-1 outline-none min-inline-16', className)}
      data-slot="combobox-chips-input"
      {...props}
    />
  )
}
