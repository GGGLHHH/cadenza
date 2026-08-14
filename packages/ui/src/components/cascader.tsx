'use client'

import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck, IconChevronRight, IconSelector, IconX } from '@tabler/icons-react'
import { createContext, Fragment, use, useMemo, useRef } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { isOwnLabelPress, LABEL_PRESS_REASONS } from '#lib/own-label-press'
import { cn, dataAttr } from '#lib/utils'

/**
 * The published Cascader family: a Select-shaped form control whose options
 * form a tree — picking a leaf selects the whole path to it.
 *
 * Base UI has no cascader primitive, so this is a seam-built composite
 * (`Slider`/`Combobox` precedent), assembled directly on `@base-ui/react`'s
 * Menu: submenus supply the level-by-level panels — hover or ArrowRight opens
 * the next level, typeahead and roving focus come along for free — while the
 * seam supplies everything a menu does not have: the value protocol, the
 * Select-styled trigger, label resolution and form serialization. It is not
 * built on the vendored dropdown-menu primitive because that is an action-menu
 * wrapper — anchor-width popups, `dropdown-menu-*` slots, no concept of a
 * value.
 *
 * ```tsx
 * <Cascader
 *   placeholder="选择地区"
 *   items={[
 *     { value: 'zhejiang', label: '浙江', items: [
 *       { value: 'hangzhou', label: '杭州', items: [
 *         { value: 'xihu', label: '西湖区' },
 *       ] },
 *     ] },
 *   ]}
 *   onValueChange={path => console.log(path)} // ['zhejiang', 'hangzhou', 'xihu']
 * />
 * ```
 *
 * Things worth knowing:
 *
 * - **The value is the path**, root to leaf (`string[]`), `null` while empty.
 *   Only leaves (nodes without `items`) are selectable — picking one closes
 *   the popup. There is no select-any-level mode.
 * - **`items` is the single source of truth.** The popup renders from it and
 *   the trigger resolves its labels from it — there is no JSX item vocabulary.
 *   Composition covers the trigger side only (`CascaderTrigger`,
 *   `CascaderValue`, `CascaderClear`, or your own `CascaderPopup` for
 *   positioning props).
 * - **Reopening lands where the value lives**: submenus along the selected
 *   path open automatically and their triggers carry `data-selected`.
 * - **The visible label is a sibling `FieldLabel`** pointed at the trigger,
 *   same as Select — the trigger is a real `<button>`, so `htmlFor` both
 *   names it and opens it:
 *
 *   ```tsx
 *   <Field>
 *     <FieldLabel htmlFor="region">地区</FieldLabel>
 *     <Cascader id="region" items={regions} />
 *   </Field>
 *   ```
 * - **Form serialization**: with a `name`, each selected path segment renders
 *   one hidden input under that name, in order (Base UI's `multiple` Select
 *   pattern). Plain `type="hidden"` — native `required` validation does not
 *   see it; validate in the form layer.
 * - **`modal` defaults to `false`** (Base UI menus default to modal), matching
 *   the seam's Select.
 * - **Clearing is `CascaderClear`** — present in the default composition,
 *   `clearable={false}` removes it everywhere.
 *
 * Not in this version, by scope: `multiple`, search, async loading of
 * branches, select-any-level. The popup has no children channel — a composed
 * item vocabulary is the upgrade path if one is ever needed.
 */

/** A node of the `items` tree. `items` present makes it a branch (submenu), absent makes it a selectable leaf. `value` must be unique among its siblings. */
export interface CascaderNode {
  value: string
  /** Shown in the menu and the trigger; falls back to `value`. */
  label?: ReactNode
  disabled?: boolean
  items?: CascaderNode[]
}

/** Base UI's Menu reasons plus the seam's `'clear-press'` (`CascaderClear`). */
export type CascaderChangeEventReason = MenuPrimitive.Root.ChangeEventReason | 'clear-press'

export type CascaderChangeEventDetails = ChangeEventDetails<CascaderChangeEventReason>

export interface CascaderProps {
  /** The option tree — feeds both the popup and the trigger's label resolution. */
  'items': CascaderNode[]
  /** The selected path, root to leaf. `null` when nothing is selected; `undefined` renders uncontrolled. */
  'value'?: string[] | null
  'defaultValue'?: string[] | null
  /** `eventDetails.cancel()` rejects the change — a `CascaderClear` press included. */
  'onValueChange'?: (value: string[] | null, eventDetails: CascaderChangeEventDetails) => void
  'open'?: boolean
  'defaultOpen'?: boolean
  'onOpenChange'?: (open: boolean, eventDetails: MenuPrimitive.Root.ChangeEventDetails) => void
  'onOpenChangeComplete'?: (open: boolean) => void
  'actionsRef'?: MenuPrimitive.Root.Props['actionsRef']
  'disabled'?: boolean
  /** Locks page scroll and blocks outside interaction while open. The seam default is `false`; Base UI menus default to modal. */
  'modal'?: boolean
  /** Form field name: one hidden input per selected path segment, in order. Nothing renders while empty. */
  'name'?: string
  /**
   * The clear affordance's master switch, default ON: the default compositions
   * render a `CascaderClear` and an explicitly composed one works —
   * `clearable={false}` removes it everywhere.
   */
  'clearable'?: boolean
  /** Placeholder for the default compositions' `CascaderValue`. Ignored once you write the trigger's children. */
  'placeholder'?: string
  /** Forwarded to the default composition's trigger for a `FieldLabel htmlFor`. Ignored once you write your own trigger. */
  'id'?: string
  /** Accessible name for the default composition's trigger — the no-visible-label case. Ignored once you write your own trigger. */
  'aria-label'?: string
  'children'?: ReactNode
}

interface CascaderContextValue {
  items: CascaderNode[]
  /** The selected path; `null` while empty. */
  selectedPath: string[] | null
  /** `JSON.stringify(selectedPath)` — the key leaf radio items match against. */
  selectedKey: string | null
  /** Per-segment labels resolved from `items`, falling back to the raw segment. */
  labels: ReactNode[]
  /** Something is selected. Base UI's Field word for "has a value" (`data-filled`), not a coined `hasValue`. */
  filled: boolean
  disabled: boolean
  /** The clear master switch (root's `clearable`, default true). */
  clearable: boolean
  /** Root's `placeholder`, claimed by the trigger's default composition. */
  placeholder: string | undefined
  /** A leaf radio item was picked: `key` is the JSON path, details come straight from Base UI. */
  onSelect: (key: string, eventDetails: CascaderChangeEventDetails) => void
  /** Clears back to `null` with reason `'clear-press'`. */
  clear: (event: Event) => void
  /** The trigger element — the root tells a press on the control's own `FieldLabel` apart from an outside press. */
  triggerRef: RefObject<HTMLElement | null>
}

const CascaderContext = createContext<CascaderContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  CascaderContext.displayName = 'CascaderContext'

function useCascaderContext(): CascaderContextValue {
  const context = use(CascaderContext)
  if (context === null)
    throw new Error('cadenza-ui: CascaderContext is missing. Cascader parts must be placed within <Cascader>.')
  return context
}

/** Walk `items` along `path`, collecting each segment's label (the raw segment when unresolvable — SelectValue's fallback behaviour). */
function resolveLabels(items: CascaderNode[], path: string[]): ReactNode[] {
  const labels: ReactNode[] = []
  let level: CascaderNode[] | undefined = items
  for (const segment of path) {
    // Annotated to break TS's circular control-flow inference (node ↔ level).
    const node: CascaderNode | undefined = level?.find(candidate => candidate.value === segment)
    labels.push(node?.label ?? segment)
    level = node?.items
  }
  return labels
}

/**
 * The root. Renders no DOM of its own; with a `name`, the hidden inputs render
 * beside it — outside the popup, which unmounts on close.
 *
 * The seam owns the value (Menu has none to own): `value` / `defaultValue` /
 * `onValueChange` follow the controlled protocol, with `null` as the
 * controlled empty value.
 */
export function Cascader({
  'aria-label': ariaLabel,
  actionsRef,
  children,
  clearable = true,
  defaultOpen,
  defaultValue,
  disabled = false,
  id,
  items,
  modal = false,
  name,
  onOpenChange,
  onOpenChangeComplete,
  onValueChange,
  open,
  placeholder,
  value: valueProp,
}: CascaderProps): ReactElement {
  const [value, setValue] = useControllableState<string[] | null>({
    value: valueProp,
    defaultValue,
    fallback: null,
  })

  const handleValueChange = (next: string[] | null, eventDetails: CascaderChangeEventDetails): void => {
    onValueChange?.(next, eventDetails)
    if (eventDetails.isCanceled)
      return
    setValue(next)
  }
  // The context's callbacks read through a ref so the memoised value does not
  // have to chase the per-render handler identity.
  const handleValueChangeRef = useRef(handleValueChange)
  handleValueChangeRef.current = handleValueChange

  const triggerRef = useRef<HTMLElement | null>(null)
  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails: MenuPrimitive.Root.ChangeEventDetails,
  ): void => {
    // Same correction as the Select seam: a press on our own label is not an
    // outside press. Cancelled before the caller's callback runs — the caller
    // still hears about it, with `isCanceled` already set — and the browser
    // then forwards the label's click to the trigger, which toggles itself.
    if (!nextOpen && LABEL_PRESS_REASONS.has(eventDetails.reason)
      && isOwnLabelPress(eventDetails.event, triggerRef.current)) {
      eventDetails.cancel()
    }
    onOpenChange?.(nextOpen, eventDetails)
  }

  const filled = value !== null && value.length > 0
  const context = useMemo<CascaderContextValue>(() => ({
    items,
    selectedPath: filled ? value : null,
    selectedKey: filled ? JSON.stringify(value) : null,
    labels: filled && value !== null ? resolveLabels(items, value) : [],
    filled,
    disabled,
    clearable,
    placeholder,
    onSelect: (key, eventDetails) =>
      handleValueChangeRef.current(JSON.parse(key) as string[], eventDetails),
    clear: event => handleValueChangeRef.current(null, createChangeEventDetails('clear-press', event)),
    triggerRef,
  }), [items, value, filled, disabled, clearable, placeholder])

  // Layered takeover: an unwritten part stays present by default. Children
  // replace the trigger side; the popup defaults in unless one is composed.
  const hasComposedPopup = findComposedPart(children, CascaderPopup) !== undefined
  return (
    <CascaderContext value={context}>
      <MenuPrimitive.Root
        actionsRef={actionsRef}
        defaultOpen={defaultOpen}
        disabled={disabled}
        modal={modal}
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
      >
        {children ?? <CascaderTrigger aria-label={ariaLabel} id={id} />}
        {hasComposedPopup ? null : <CascaderPopup />}
      </MenuPrimitive.Root>
      {name !== undefined && (value ?? []).map((segment, index) => (
        // Positional identity is the point — a path submits in order.
        // eslint-disable-next-line react/no-array-index-key
        <input key={index} type="hidden" name={name} value={segment} disabled={disabled} />
      ))}
    </CascaderContext>
  )
}

// `handle`/`payload` are Menu-as-menu machinery the root does not surface.
// No `RefAttributes` patch: Base UI's Props already carry the trigger's ref
// (`HTMLButtonElement`), audited per the seam checklist.
export type CascaderTriggerProps = Omit<MenuPrimitive.Trigger.Props, 'handle' | 'payload'>
  & { size?: 'sm' | 'default' }

/**
 * The trigger — a real `<button>` styled like the Select trigger, chevron
 * included. No children → its default composition: a `CascaderValue`, plus
 * the clear affordance (`clearable` gates it). Compose a `CascaderClear`
 * among its children and the same lift-out applies: the ✕ renders as a
 * sibling button overlaying the chevron's spot (a `<button>` may not nest
 * another).
 */
export function CascaderTrigger({ children, className, ref, size = 'default', ...props }: CascaderTriggerProps): ReactElement {
  const { filled, disabled, clearable, clear, triggerRef } = useCascaderContext()
  const autoComposed = children === undefined
  const composedClearProps = autoComposed ? {} : findComposedPart(children, CascaderClear)
  const clearProps = clearable ? composedClearProps : undefined
  const clearVisible = clearProps !== undefined && filled && !disabled
  const trigger = (
    <MenuPrimitive.Trigger
      data-placeholder={dataAttr(!filled)}
      data-size={size}
      data-slot="cascader-trigger"
      className={cn(
        `
          flex items-center justify-between gap-1.5 rounded-lg border
          border-input bg-transparent py-2 ps-2.5 pe-2 text-sm whitespace-nowrap
          transition-colors outline-none select-none inline-fit
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/50
          disabled:cursor-not-allowed disabled:opacity-50
          aria-invalid:border-destructive aria-invalid:ring-3
          aria-invalid:ring-destructive/20
          data-placeholder:text-muted-foreground
          data-[size=default]:block-8
          data-[size=sm]:rounded-[min(var(--radius-md),10px)]
          data-[size=sm]:block-7
          *:data-[slot=cascader-value]:line-clamp-1
          *:data-[slot=cascader-value]:flex
          *:data-[slot=cascader-value]:items-center
          *:data-[slot=cascader-value]:gap-1.5
          dark:bg-input/30
          dark:hover:bg-input/50
          dark:aria-invalid:border-destructive/50
          dark:aria-invalid:ring-destructive/40
          [&_svg]:pointer-events-none [&_svg]:shrink-0
          [&_svg:not([class*='size-'])]:block-4
          [&_svg:not([class*='size-'])]:inline-4
        `,
        clearVisible && '[&>svg:last-child]:invisible',
        className,
      )}
      // Claimed, not taken: the caller's ref still gets the element. The root
      // needs it to recognise presses on this control's own label.
      ref={(node: HTMLButtonElement | null) => {
        triggerRef.current = node
        if (typeof ref === 'function')
          ref(node)
        else if (ref !== null && ref !== undefined)
          ref.current = node
      }}
      {...props}
    >
      {autoComposed ? <CascaderValue /> : children}
      <IconSelector
        aria-hidden
        className="pointer-events-none text-muted-foreground block-4 inline-4"
      />
    </MenuPrimitive.Trigger>
  )
  if (clearProps === undefined)
    return trigger
  return (
    <span className="relative inline-flex inline-fit" data-slot="cascader-trigger-container">
      {trigger}
      {clearVisible && <CascaderClearOverlay {...clearProps} clear={clear} />}
    </span>
  )
}

export type CascaderValueProps = Omit<ComponentProps<'span'>, 'children'> & {
  /** Shown while nothing is selected; falls back to the root's `placeholder`. */
  placeholder?: string
  /** Custom display, called only while something is selected — the default joins `labels` with a `/`. */
  children?: (labels: ReactNode[], value: string[]) => ReactNode
}

/**
 * The trigger's value display: the selected path's labels joined by a muted
 * `/`, or the placeholder. Labels resolve from the root's `items`; an
 * unresolvable segment prints its raw value, SelectValue-style.
 */
export function CascaderValue({ children, className, placeholder, ...props }: CascaderValueProps): ReactElement {
  const { filled, labels, selectedPath, placeholder: rootPlaceholder } = useCascaderContext()
  return (
    <span
      className={cn('flex flex-1 items-center gap-1.5 text-start', className)}
      data-slot="cascader-value"
      {...props}
    >
      {filled && selectedPath !== null
        ? (children?.(labels, selectedPath) ?? labels.map((label, index) => (
            // Positional identity again: labels are the path, in order.
            // eslint-disable-next-line react/no-array-index-key
            <Fragment key={index}>
              {index > 0 && <span aria-hidden className="text-muted-foreground">/</span>}
              {label}
            </Fragment>
          )))
        : (placeholder ?? rootPlaceholder)}
    </span>
  )
}

export type CascaderClearProps = Omit<ComponentProps<'button'>, 'type'>

/**
 * The clear affordance: compose it inside `CascaderTrigger` and, while
 * something is selected, an ✕ stands in the chevron's spot — click it and the
 * value clears (`null`, reason `'clear-press'`) without opening the popup.
 *
 * A marker part: it renders nothing where written — the trigger lifts it out,
 * because HTML forbids a button inside a button. The lifted element IS a real
 * `<button>` (tab stop and all). Direct child of the trigger or inside a
 * Fragment only.
 */
export function CascaderClear(_props: CascaderClearProps): null {
  return null
}

function CascaderClearOverlay({
  'aria-label': ariaLabel = 'Clear selection',
  className,
  children,
  clear,
  onClick,
  ...props
}: CascaderClearProps & { clear: (event: Event) => void }): ReactElement {
  return (
    <button
      aria-label={ariaLabel}
      data-slot="cascader-clear"
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
      // After the spread: a caller listening for clicks must not silently
      // take clearing away.
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

/** Shared by the root popup and every submenu panel. */
const popupClassName = `
  max-h-(--available-height) origin-(--transform-origin) overflow-x-hidden
  overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md
  ring-1 ring-foreground/10 duration-100 outline-none
  data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0
  data-closed:zoom-out-95
  data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
  data-[side=bottom]:slide-in-from-top-2
  data-[side=inline-end]:slide-in-from-left-2
  data-[side=inline-start]:slide-in-from-right-2
  data-[side=left]:slide-in-from-right-2
  data-[side=right]:slide-in-from-left-2
  data-[side=top]:slide-in-from-bottom-2
`

const itemClassName = `
  relative flex cursor-default items-center gap-1.5 rounded-md text-sm
  outline-hidden select-none
  focus:bg-accent focus:text-accent-foreground
  data-disabled:cursor-not-allowed data-disabled:opacity-50
  [&_svg]:pointer-events-none [&_svg]:shrink-0
  [&_svg:not([class*='size-'])]:size-4
`

export type CascaderPopupProps = Omit<MenuPrimitive.Popup.Props, 'children'>
  & Pick<MenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>

/**
 * Portal + Positioner + Popup in one part. Its content is the root's `items`
 * tree — no children channel: branches render as submenu panels flying out to
 * the inline end, leaves as radio items that commit the path and close.
 * Positioning props go to the positioner, everything else to the popup.
 */
export function CascaderPopup({
  align = 'start',
  alignOffset = 0,
  className,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: CascaderPopupProps): ReactElement {
  const { items, selectedKey, selectedPath, onSelect } = useCascaderContext()
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50 outline-none"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="cascader-popup"
          className={cn(popupClassName, 'min-inline-(--anchor-width)', className)}
          {...props}
        >
          <MenuPrimitive.RadioGroup
            value={selectedKey}
            onValueChange={(key, eventDetails) => onSelect(key as string, eventDetails)}
          >
            {renderNodes(items, [], selectedPath)}
          </MenuPrimitive.RadioGroup>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

/**
 * One level of the tree. A leaf is a `Menu.RadioItem` keyed by its JSON path —
 * one radio group spans every panel (React context crosses the submenu
 * portals), so exactly one leaf in the whole tree is checked. A branch is a
 * whole submenu: trigger plus a flying panel of the next level. Branches on
 * the selected path open on mount (the popup remounts per open, so this is
 * per-reopen) and carry `data-selected`.
 */
function renderNodes(nodes: CascaderNode[], ancestors: string[], selectedPath: string[] | null): ReactNode {
  return nodes.map((node) => {
    const path = [...ancestors, node.value]
    if (node.items === undefined) {
      return (
        <MenuPrimitive.RadioItem
          key={node.value}
          closeOnClick
          data-slot="cascader-item"
          disabled={node.disabled}
          value={JSON.stringify(path)}
          className={cn(itemClassName, 'py-1 ps-1.5 pe-8')}
        >
          <span
            className="
              pointer-events-none absolute inset-e-2 flex items-center
              justify-center
            "
            data-slot="cascader-item-indicator"
          >
            <MenuPrimitive.RadioItemIndicator>
              <IconCheck aria-hidden />
            </MenuPrimitive.RadioItemIndicator>
          </span>
          {node.label ?? node.value}
        </MenuPrimitive.RadioItem>
      )
    }
    const onSelectedPath = selectedPath !== null
      && path.every((segment, index) => selectedPath[index] === segment)
    return (
      <MenuPrimitive.SubmenuRoot key={node.value} closeParentOnEsc defaultOpen={onSelectedPath}>
        <MenuPrimitive.SubmenuTrigger
          data-selected={dataAttr(onSelectedPath)}
          data-slot="cascader-submenu-trigger"
          disabled={node.disabled}
          className={cn(
            itemClassName,
            `
              px-1.5 py-1
              data-popup-open:bg-accent data-popup-open:text-accent-foreground
              data-selected:font-medium
            `,
          )}
        >
          {node.label ?? node.value}
          <IconChevronRight
            aria-hidden
            className="ms-auto text-muted-foreground"
          />
        </MenuPrimitive.SubmenuTrigger>
        <MenuPrimitive.Portal>
          <MenuPrimitive.Positioner
            align="start"
            alignOffset={-3}
            className="isolate z-50 outline-none"
            side="inline-end"
            sideOffset={0}
          >
            <MenuPrimitive.Popup className={cn(popupClassName, 'min-inline-24')} data-slot="cascader-submenu-popup">
              {renderNodes(node.items, path, selectedPath)}
            </MenuPrimitive.Popup>
          </MenuPrimitive.Positioner>
        </MenuPrimitive.Portal>
      </MenuPrimitive.SubmenuRoot>
    )
  })
}
