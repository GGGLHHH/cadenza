'use client'

import type { ComponentProps, ReactElement, ReactNode, RefObject } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck, IconChevronRight, IconSelector, IconX } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { createContext, Fragment, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { isOwnLabelPress, LABEL_PRESS_REASONS } from '#lib/own-label-press'
import { cn, dataAttr } from '#lib/utils'
import { LoadingOverlay } from './loading-overlay'
import { ScrollArea } from './scroll-area'
import { Spinner } from './spinner'

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
 *   Only leaves are selectable — picking one closes the popup. There is no
 *   select-any-level mode.
 * - **`items` is the single source of truth.** The popup renders from it and
 *   the trigger resolves its labels from it — there is no JSX item vocabulary.
 *   Composition covers the trigger side only (`CascaderTrigger`,
 *   `CascaderValue`, `CascaderClear`, or your own `CascaderPopup` for
 *   positioning props).
 * - **Levels can load on demand**: give `loadItems` and a panel whose children
 *   are not statically known fetches them when it opens. With a loader
 *   present, a node without `items` is a branch unless it says `leaf: true`;
 *   a node with static `items` never consults the loader. `items` itself
 *   becomes optional — omit it and the first level loads through
 *   `loadItems([])` too. Loading looks the same as everywhere else in this
 *   library: the panel carries `data-loading` under a frosted `LoadingOverlay`
 *   while its first page is in flight (the InfiniteSelect treatment); a
 *   rejected load marks the panel `data-error` (and warns in dev) and retries
 *   the next time it opens — richer error UI belongs inside the loader.
 *   Echoing a stored value needs no open: the root prefetches the selected
 *   path's levels into the same cache, so the trigger's labels resolve on
 *   their own (a segment beyond a paged level's first page falls back to its
 *   raw value — `CascaderValue`'s children can take display over).
 * - **Levels can page**: return `{ items, hasNextPage: true }` from
 *   `loadItems` and the panel keeps a trailing intersection sentinel that
 *   loads the next page as it scrolls into view — a spinner row while the
 *   page arrives, a fading end-of-list rule once every page is in
 *   (InfiniteSelect's tail, verbatim). A bare array means the level is
 *   complete. Panels scroll inside a `ScrollArea` capped at `maxListHeight`.
 * - **Levels can virtualize**: `virtualized` renders every panel through a
 *   fixed-row-height window (`rowHeight`). Upstream Menu has no virtualization
 *   support (Base UI only ships it for Combobox), so the keyboard ceiling is
 *   real: typeahead and Home/End only see the mounted window; ArrowUp/Down
 *   walk fine because focus scrolls the window along. Reopening scrolls the
 *   selected node back into view.
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
 * Not in this version, by scope: `multiple`, search, select-any-level. The
 * popup has no children channel — a composed item vocabulary is the upgrade
 * path if one is ever needed.
 */

/**
 * A node of the `items` tree. `items` present makes it a branch with known
 * children; without a loader, absent `items` makes it a leaf. With a root
 * `loadItems`, absent `items` makes it a *lazy branch* instead, unless it
 * declares `leaf: true`. `value` must be unique among its siblings.
 */
export interface CascaderNode {
  value: string
  /** Shown in the menu and the trigger; falls back to `value`. */
  label?: ReactNode
  disabled?: boolean
  /** With a root `loadItems`, marks a node that has no children to load. Ignored when `items` is present. */
  leaf?: boolean
  items?: CascaderNode[]
}

/** One page of children from `loadItems`. Returning a bare array instead means the level is complete. */
export interface CascaderPage {
  items: CascaderNode[]
  /** More pages exist — the panel keeps a trailing sentinel that requests the next page when scrolled into view. */
  hasNextPage?: boolean
}

/** Base UI's Menu reasons plus the seam's `'clear-press'` (`CascaderClear`). */
export type CascaderChangeEventReason = MenuPrimitive.Root.ChangeEventReason | 'clear-press'

export type CascaderChangeEventDetails = ChangeEventDetails<CascaderChangeEventReason>

export interface CascaderProps {
  /**
   * The option tree — feeds both the popup and the trigger's label
   * resolution. Optional only when `loadItems` is present (the first level
   * then loads through `loadItems([])`).
   */
  'items'?: CascaderNode[]
  /** The selected path, root to leaf. `null` when nothing is selected; `undefined` renders uncontrolled. */
  'value'?: string[] | null
  'defaultValue'?: string[] | null
  /** `eventDetails.cancel()` rejects the change — a `CascaderClear` press included. */
  'onValueChange'?: (value: string[] | null, eventDetails: CascaderChangeEventDetails) => void
  /**
   * Loads one page of a lazy branch's children. Called with the branch's path
   * (`[]` for the first level) when its panel opens uncached, and again with
   * increasing `page` while previous results said `hasNextPage`. Results are
   * cached for the component's lifetime; a rejection marks the panel
   * `data-error` and is retried when the panel next opens.
   */
  'loadItems'?: (path: string[], details: { page: number }) => Promise<CascaderNode[] | CascaderPage>
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
  /**
   * Render every panel through a fixed-row-height virtual window — for levels
   * with thousands of nodes. Menu has no upstream virtualization, so typeahead
   * and Home/End only see the mounted window; arrow-key walking is unaffected.
   */
  'virtualized'?: boolean
  /** Fixed row height (px) the virtual window is measured with. Only read under `virtualized`. */
  'rowHeight'?: number
  /** Every panel's scroll viewport is capped at this height (px) — the InfiniteSelect default. */
  'maxListHeight'?: number
  /** Placeholder for the default compositions' `CascaderValue`. Ignored once you write the trigger's children. */
  'placeholder'?: string
  /** Forwarded to the default composition's trigger for a `FieldLabel htmlFor`. Ignored once you write your own trigger. */
  'id'?: string
  /** Accessible name for the default composition's trigger — the no-visible-label case. Ignored once you write your own trigger. */
  'aria-label'?: string
  'children'?: ReactNode
}

/** What the seam remembers about one lazy panel, keyed by its JSON path. */
interface CascaderPanelState {
  items: CascaderNode[]
  /** The next page index `loadItems` will be asked for. */
  nextPage: number
  hasNextPage: boolean
  /** A load is in flight. */
  pending: boolean
  error: boolean
}

interface CascaderContextValue {
  items: CascaderNode[] | undefined
  /** The selected path; `null` while empty. */
  selectedPath: string[] | null
  /** `JSON.stringify(selectedPath)` — the key leaf radio items match against. */
  selectedKey: string | null
  /** Per-segment labels resolved from `items` and loaded panels, falling back to the raw segment. */
  labels: ReactNode[]
  /** Something is selected. Base UI's Field word for "has a value" (`data-filled`), not a coined `hasValue`. */
  filled: boolean
  disabled: boolean
  /** The clear master switch (root's `clearable`, default true). */
  clearable: boolean
  /** Root's `placeholder`, claimed by the trigger's default composition. */
  placeholder: string | undefined
  /** Loaded pages per lazy panel. */
  panels: ReadonlyMap<string, CascaderPanelState>
  /** A `loadItems` is present — itemless nodes default to lazy branches. */
  hasLoader: boolean
  /** Request the next uncached page for a panel (page 0 on first call). No-op while one is in flight. */
  requestPage: (path: string[]) => void
  virtualized: boolean
  rowHeight: number
  maxListHeight: number
  /** A leaf radio item was picked: `key` is the JSON path, details come straight from Base UI. */
  onSelect: (key: string, eventDetails: CascaderChangeEventDetails) => void
  /** Clears back to `null` with reason `'clear-press'`. */
  clear: (event: Event) => void
  /** The trigger element — the root tells a press on the control's own `FieldLabel` apart from an outside press. */
  triggerRef: RefObject<HTMLElement | null>
  /**
   * The box the trigger and the lifted ✕ share (mounted only while there is a
   * ✕ to lift). The root needs it because Menu's `outsidePress` override
   * ignores the target entirely (menu/root/MenuRoot.js:285), leaving
   * `useDismiss`'s anchor of floating ∪ domReference
   * (floating-ui-react/hooks/useDismiss.js:83-85) — and the lifted ✕, a DOM
   * sibling of the trigger, is in neither.
   */
  containerRef: RefObject<HTMLSpanElement | null>
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

/**
 * Walk the tree along `path`, collecting each segment's label (the raw
 * segment when unresolvable — SelectValue's fallback behaviour). Children come
 * from static `items` first, then from the loaded-panel cache, so a lazily
 * loaded selection still displays its labels.
 */
function resolveLabels(
  items: CascaderNode[] | undefined,
  path: string[],
  panels: ReadonlyMap<string, CascaderPanelState>,
): ReactNode[] {
  const labels: ReactNode[] = []
  const ancestors: string[] = []
  let level: CascaderNode[] | undefined = items ?? panels.get('[]')?.items
  for (const segment of path) {
    // Annotated to break TS's circular control-flow inference (node ↔ level).
    const node: CascaderNode | undefined = level?.find(candidate => candidate.value === segment)
    labels.push(node?.label ?? segment)
    ancestors.push(segment)
    level = node?.items ?? panels.get(JSON.stringify(ancestors))?.items
  }
  return labels
}

/**
 * The root. Renders no DOM of its own; with a `name`, the hidden inputs render
 * beside it — outside the popup, which unmounts on close.
 *
 * The seam owns the value (Menu has none to own): `value` / `defaultValue` /
 * `onValueChange` follow the controlled protocol, with `null` as the
 * controlled empty value. It also owns the lazy-load cache: loaded pages
 * survive popup close/reopen for the component's lifetime.
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
  loadItems,
  maxListHeight = 256,
  modal = false,
  name,
  onOpenChange,
  onOpenChangeComplete,
  onValueChange,
  open,
  placeholder,
  rowHeight = 32,
  value: valueProp,
  virtualized = false,
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

  const [panels, setPanels] = useState<ReadonlyMap<string, CascaderPanelState>>(() => new Map())
  const panelsRef = useRef(panels)
  panelsRef.current = panels
  const loadItemsRef = useRef(loadItems)
  loadItemsRef.current = loadItems

  const requestPage = useCallback((path: string[]): void => {
    const load = loadItemsRef.current
    if (load === undefined)
      return
    const key = JSON.stringify(path)
    const current = panelsRef.current.get(key)
    if (current?.pending === true)
      return
    const page = current?.nextPage ?? 0
    // Synchronous on purpose, panel-mount and echo effects included: the
    // pending latch must be visible before any concurrent caller re-checks,
    // or the same page fires twice. The real state lands async, below.
    // eslint-disable-next-line react/set-state-in-effect
    setPanels(prev => new Map(prev).set(key, {
      items: current?.items ?? [],
      nextPage: page,
      // Carried through the fetch: zeroing it here would unmount the sentinel
      // and flash the end-of-list rule while a page is still coming.
      hasNextPage: current?.hasNextPage ?? false,
      pending: true,
      error: false,
    }))
    load(path, { page }).then((result) => {
      const pageItems = Array.isArray(result) ? result : result.items
      const hasNextPage = !Array.isArray(result) && result.hasNextPage === true
      setPanels(prev => new Map(prev).set(key, {
        items: page === 0 ? pageItems : [...(prev.get(key)?.items ?? []), ...pageItems],
        nextPage: page + 1,
        hasNextPage,
        pending: false,
        error: false,
      }))
    }, (error: unknown) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          'cadenza-ui: Cascader `loadItems` rejected — the panel is marked data-error and retries when it next opens. '
          + 'Handle errors inside the loader for richer UI.',
          error,
        )
      }
      setPanels(prev => new Map(prev).set(key, {
        items: prev.get(key)?.items ?? [],
        nextPage: page,
        hasNextPage: false,
        pending: false,
        error: true,
      }))
    })
  }, [])

  if (process.env.NODE_ENV !== 'production' && items === undefined && loadItems === undefined) {
    console.error(
      'cadenza-ui: Cascader received neither `items` nor `loadItems` — the popup has nothing to render.',
    )
  }

  const triggerRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLSpanElement | null>(null)
  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails: MenuPrimitive.Root.ChangeEventDetails,
  ): void => {
    // Same correction as the Select seam: a press on our own label, or on our
    // own lifted ✕, is not an outside press. Cancelled before the caller's
    // callback runs — the caller still hears about it, with `isCanceled`
    // already set — and the browser then forwards the label's click to the
    // trigger, which toggles itself.
    //
    // The ✕ half is Base UI's own answer to the same question: its Combobox
    // overrides `outsidePress` to spare exactly the parts that sit outside the
    // trigger — `!contains(clearRef.current, target)` and its siblings, see
    // combobox/root/AriaCombobox.js:911. Menu's override answers `true`
    // without ever looking at the target, so our lifted ✕ (a sibling button —
    // HTML forbids nesting it) reads as outside. Widened to the whole
    // container rather than the ✕ alone, the DatePicker treatment: anything in
    // our own box is ours. Without it one press reports both `clear-press` and
    // a dismissal the user never performed.
    //
    // The menu still closes, as `focus-out`: the ✕ is a real button and takes
    // focus off the menu. That reason is honest, so it is left alone — the
    // wrong one is what this removes.
    if (!nextOpen && LABEL_PRESS_REASONS.has(eventDetails.reason)) {
      const target = eventDetails.event.target
      if (isOwnLabelPress(eventDetails.event, triggerRef.current)
        || (target instanceof Node && containerRef.current?.contains(target) === true)) {
        eventDetails.cancel()
      }
    }
    onOpenChange?.(nextOpen, eventDetails)
  }

  const hasLoader = loadItems !== undefined
  const filled = value !== null && value.length > 0

  // Echo without opening: with a loader and a value, walk the selected path
  // and prefetch each unresolved lazy level's first page into the same cache
  // the panels use — the trigger's labels swap in as pages land, popup
  // closed. One level per pass; the cache update re-runs the effect for the
  // next. A level that is loaded (or errored) but still misses its segment
  // stops the walk: deep pages and stale values fall back to the raw
  // segment (CascaderValue's children can take display over from there).
  useEffect(() => {
    if (!hasLoader || value === null)
      return
    const ancestors: string[] = []
    let staticNodes: CascaderNode[] | undefined = items
    for (const segment of value) {
      const key = JSON.stringify(ancestors)
      const nodes = staticNodes ?? panels.get(key)?.items
      if (nodes === undefined) {
        if (panels.get(key) === undefined)
          requestPage([...ancestors])
        return
      }
      const node = nodes.find(candidate => candidate.value === segment)
      if (node === undefined || node.leaf === true)
        return
      ancestors.push(segment)
      staticNodes = node.items
    }
  }, [hasLoader, value, items, panels, requestPage])

  const context = useMemo<CascaderContextValue>(() => ({
    items,
    selectedPath: filled ? value : null,
    selectedKey: filled ? JSON.stringify(value) : null,
    labels: filled && value !== null ? resolveLabels(items, value, panels) : [],
    filled,
    disabled,
    clearable,
    placeholder,
    panels,
    hasLoader,
    requestPage,
    virtualized,
    rowHeight,
    maxListHeight,
    onSelect: (key, eventDetails) =>
      handleValueChangeRef.current(JSON.parse(key) as string[], eventDetails),
    clear: event => handleValueChangeRef.current(null, createChangeEventDetails('clear-press', event)),
    triggerRef,
    containerRef,
  }), [items, value, filled, disabled, clearable, placeholder, panels, hasLoader, requestPage, virtualized, rowHeight, maxListHeight])

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
  const { filled, disabled, clearable, clear, triggerRef, containerRef } = useCascaderContext()
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
        // Inside the clear container the trigger must follow the container's
        // width: layouts that stretch form controls (Field's `*:w-full`)
        // stretch the container, and a fit-content trigger would leave the
        // lifted ✕ pinned to the far edge, orphaned from the button.
        clearProps !== undefined && 'flex-1',
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
    <span className="relative inline-flex inline-fit" data-slot="cascader-trigger-container" ref={containerRef}>
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
 * `/`, or the placeholder. Labels resolve from the root's `items` (and loaded
 * panels); an unresolvable segment prints its raw value, SelectValue-style.
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
  onMouseDown,
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
      // Base UI's own clear does exactly this, with the same one-line reason
      // (`ComboboxClear.js:96-98`, "Avoid stealing focus from the input"): a
      // pointer press on a clear affordance must not move focus. It matters
      // more here than upstream, because HTML forbids a button inside a button
      // so this one is lifted out of the trigger — taking focus would land it
      // outside the popup's own elements and the dismissal machinery would
      // read a genuine focus-out. Cancelling the mousedown default is what
      // keeps a press on the control's own part from reading as leaving it.
      onMouseDown={(event) => {
        onMouseDown?.(event)
        event.preventDefault()
      }}
    >
      {children ?? <IconX aria-hidden className="block-4 inline-4" />}
    </button>
  )
}

/**
 * Shared by the root popup and every submenu panel. The popup does not scroll
 * itself — each panel scrolls inside its own `ScrollArea` viewport (the
 * InfiniteSelect treatment: overlay scrollbars, `scroll-fade-y`); the popup
 * only clips to its radius.
 */
const popupClassName = `
  origin-(--transform-origin) overflow-hidden rounded-lg bg-popover
  text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100
  outline-none
  data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
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

/** Every panel's scroll container — the sentinel's observer root and the virtualizer's scroll element (InfiniteSelect's anchor, verbatim). */
const viewportSelector = '[data-slot="scroll-area-viewport"]'

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
  const { items, selectedKey, onSelect } = useCascaderContext()
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
          {/* One radio group spans every panel: React context crosses the
              submenu portals, so exactly one leaf in the whole tree is
              checked. */}
          <MenuPrimitive.RadioGroup
            value={selectedKey}
            onValueChange={(key, eventDetails) => onSelect(key as string, eventDetails)}
          >
            <CascaderPanel nodes={items} path={[]} />
          </MenuPrimitive.RadioGroup>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

/**
 * One level's content — the InfiniteSelect list treatment, panel-sized. A
 * `relative` shell holds a `ScrollArea` (viewport capped at `maxListHeight`)
 * and a frosted `LoadingOverlay` that covers the visible viewport rather than
 * scrolling with the rows; while the first page is in flight and nothing
 * exists to size the list, a `min-block-24` shell gives the frost something
 * to show on.
 *
 * A lazy panel (no static nodes, loader present) requests its first page on
 * mount — mount, not open-change, so the selected path's `defaultOpen`
 * submenus load level by level on reopen too. Status is externalized on the
 * shell: `data-loading`, `data-error` (retried on the next mount),
 * `data-empty`.
 */
function CascaderPanel({ nodes, path }: { nodes: CascaderNode[] | undefined, path: string[] }): ReactElement {
  const { panels, hasLoader, requestPage, virtualized, maxListHeight } = useCascaderContext()
  const key = JSON.stringify(path)
  const entry = panels.get(key)
  const lazy = nodes === undefined && hasLoader
  useEffect(() => {
    if (lazy && (entry === undefined || (entry.error && !entry.pending)))
      requestPage(path)
    // Mount-only per panel (deps exclude `entry`): a rejected load waits for
    // the next open instead of retrying in a loop.
    // eslint-disable-next-line react/exhaustive-deps
  }, [lazy, key])

  const effective = nodes ?? entry?.items ?? []
  const filled = effective.length > 0
  const loading = lazy && !filled && (entry === undefined || entry.pending)
  const loadingMore = entry?.pending === true && filled
  const error = entry?.error === true
  const empty = !loading && !error && !filled
  const hasNextPage = entry?.hasNextPage === true
  // A level that ever paged — only those get the visible end-of-list rule;
  // static and single-load levels just stop.
  const paged = entry !== undefined && (entry.hasNextPage || entry.nextPage > 1)
  return (
    <div
      className={cn('relative', loading && 'min-block-24')}
      data-empty={dataAttr(empty)}
      data-error={dataAttr(error)}
      data-loading={dataAttr(loading)}
      data-slot="cascader-panel"
    >
      {filled && (
        <ScrollArea
          viewportClassName="scroll-fade-y overscroll-contain"
          viewportStyle={{ maxHeight: maxListHeight }}
        >
          <div
            className={cn('flex flex-col p-1', virtualized && `
              relative block p-0
            `)}
            data-slot="cascader-list"
          >
            {virtualized
              ? <CascaderVirtualRows nodes={effective} parentPath={path} />
              : effective.map(node => <CascaderRow key={node.value} node={node} parentPath={path} />)}
          </div>
          {hasNextPage
            ? (
                <>
                  <CascaderLoadMoreSentinel path={path} />
                  {loadingMore && (
                    <div
                      className="
                        flex items-center justify-center py-1.5 text-center
                        text-xs text-muted-foreground
                      "
                      data-slot="cascader-load-more"
                    >
                      {/* A default, not an optional extra: without it the next
                          page would arrive with no feedback at all (the
                          InfiniteSelect rule). */}
                      <Spinner aria-hidden className="block-3.5 inline-3.5" />
                    </div>
                  )}
                </>
              )
            : paged && (
              // Every page is in: the list visibly ends instead of just stopping.
              <div
                className="
                  flex items-center justify-center py-3 text-center text-xs
                  text-muted-foreground
                "
                data-slot="cascader-no-more"
              >
                <span
                  aria-hidden
                  className="
                    bg-linear-to-r from-transparent via-muted-foreground/40
                    to-transparent block-px inline-24
                  "
                  data-slot="cascader-no-more-rule"
                />
              </div>
            )}
        </ScrollArea>
      )}
      <LoadingOverlay loading={loading} />
    </div>
  )
}

/**
 * A leaf is a `Menu.RadioItem` keyed by its JSON path. A branch is a whole
 * submenu: trigger plus a flying panel of the next level. Branches on the
 * selected path open on mount (the popup remounts per open, so this is
 * per-reopen) and carry `data-selected`.
 */
function CascaderRow({ node, parentPath }: { node: CascaderNode, parentPath: string[] }): ReactElement {
  const { selectedPath, hasLoader, virtualized } = useCascaderContext()
  const path = [...parentPath, node.value]
  const branch = node.items !== undefined || (hasLoader && node.leaf !== true)
  if (!branch) {
    return (
      <MenuPrimitive.RadioItem
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
    <MenuPrimitive.SubmenuRoot closeParentOnEsc defaultOpen={onSelectedPath}>
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
          <MenuPrimitive.Popup
            data-slot="cascader-submenu-popup"
            // Virtualized rows are absolutely positioned and give the panel no
            // intrinsic width, so the floor widens from 96px to 192px.
            className={cn(popupClassName, virtualized
              ? 'min-inline-48'
              : `min-inline-24`)}
          >
            <CascaderPanel nodes={node.items} path={path} />
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.SubmenuRoot>
  )
}

/**
 * A fixed-row-height virtual window over one panel's rows (the InfiniteSelect
 * treatment: absolutely positioned row shells inside a total-height spacer,
 * the panel's ScrollArea viewport as the scroll element). On mount it scrolls
 * this level's selected node into view — the reopen counterpart of the
 * submenu auto-open.
 *
 * ponytail: Menu has no upstream virtualization (Combobox only), so typeahead
 * and Home/End only see the mounted window; arrow keys walk fine because
 * focus drags the window along. Upgrade path: Base UI menu virtualization,
 * if it ever ships.
 */
function CascaderVirtualRows({ nodes, parentPath }: { nodes: CascaderNode[], parentPath: string[] }): ReactElement {
  const { rowHeight, selectedPath, maxListHeight } = useCascaderContext()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const virtualizer = useVirtualizer({
    count: nodes.length,
    estimateSize: () => rowHeight,
    getScrollElement: () => containerRef.current?.closest<HTMLElement>(viewportSelector) ?? null,
    // The viewport's height is `maxListHeight` until it is measured. Without
    // this the first window is computed against a zero-height rect and renders
    // nothing (InfiniteSelect precedent).
    initialRect: { width: 0, height: maxListHeight },
    overscan: 8,
  })
  const level = parentPath.length
  useEffect(() => {
    const segment = selectedPath?.[level]
    if (segment === undefined)
      return
    const index = nodes.findIndex(node => node.value === segment)
    if (index >= 0)
      virtualizer.scrollToIndex(index, { align: 'center' })
    // Mount-only: this restores the reopen position, it must not fight the
    // user's scrolling afterwards.
    // eslint-disable-next-line react/exhaustive-deps
  }, [])
  return (
    <div
      className="relative inline-full"
      data-slot="cascader-virtual-list"
      ref={containerRef}
      style={{ blockSize: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map(item => (
        // px-1 on the shell: the virtualized list drops its own padding
        // (p-0), absolute rows carry it instead (InfiniteSelect precedent).
        <div
          key={nodes[item.index].value}
          className="
            absolute inset-s-0 inset-bs-0 flex flex-col justify-center px-1
            inline-full
          "
          style={{ blockSize: item.size, transform: `translateY(${item.start}px)` }}
        >
          <CascaderRow node={nodes[item.index]} parentPath={parentPath} />
        </div>
      ))}
    </div>
  )
}

/**
 * The trailing intersection sentinel of a paged panel (InfiniteSelect
 * precedent): an invisible, `aria-hidden` div outside the menu-item
 * semantics. Scrolling it within one viewport-height of the panel requests
 * the next page. An observer, not a scroll handler — under virtualization the
 * scroll offset says nothing about remaining rows. The latest-ref keeps the
 * observer from re-mounting per render.
 */
function CascaderLoadMoreSentinel({ path }: { path: string[] }): ReactElement {
  const { panels, requestPage } = useCascaderContext()
  const latestRef = useRef({ panels, requestPage, path })
  latestRef.current = { panels, requestPage, path }
  const nodeRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = nodeRef.current
    if (node === null)
      return undefined
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting))
        return
      const { panels, requestPage, path } = latestRef.current
      const entry = panels.get(JSON.stringify(path))
      if (entry !== undefined && !entry.pending && entry.hasNextPage)
        requestPage(path)
    }, { root: node.closest(viewportSelector), rootMargin: '0px 0px 100% 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return <div aria-hidden data-slot="cascader-load-more-sentinel" ref={nodeRef} />
}
