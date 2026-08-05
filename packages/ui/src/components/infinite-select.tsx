'use client'

import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import type { LoadingOverlayProps } from './loading-overlay'
import type { ScrollAreaScrollbars } from './scroll-area'
import { Combobox } from '@base-ui/react/combobox'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconCheck, IconSearch } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { createContext, use, useEffect, useMemo, useRef } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { cn, dataAttr } from '#lib/utils'
import { Button } from '#primitives/button'
import { Separator } from '#primitives/separator'
import { LoadingOverlay } from './loading-overlay'
import { ScrollArea } from './scroll-area'
import { Spinner } from './spinner'

/**
 * Searchable infinite-scrolling list panel, single or multi select.
 *
 * Base UI owns the behaviour: `Combobox.Root` in `inline` mode wires the search
 * input to the list with virtual focus (arrow keys navigate while the input
 * keeps DOM focus) and owns selection semantics. Filtering is *off*
 * (`filter={null}`) because it happens on the server — typing drives
 * `onInputValueChange`, the caller refetches, and the panel renders whatever comes
 * back. Rows can be virtualized with TanStack Virtual, and `onLoadMore` fires
 * from an intersection sentinel that trails the loaded rows. The panel renders
 * zero copy — empty/error messages come in through the slot children
 * (`InfiniteSelectEmpty` / `Error`), so i18n stays in the caller's layer;
 * loading is copyless by design, the List part's frosted `LoadingOverlay`.
 */
export interface InfiniteSelectOption {
  id: string
  label: ReactNode
  disabled?: boolean
}

/**
 * Why the selection changed. Base UI's Combobox reasons pass through whole
 * (`item-press`, `clear-press`, `escape-key`, …); `'none'` is programmatic.
 */
export type InfiniteSelectChangeEventReason = Combobox.Root.ChangeEventReason | 'none'

export type InfiniteSelectChangeEventDetails = ChangeEventDetails<InfiniteSelectChangeEventReason>

/**
 * Context handed to a custom item renderer. Unlike the DOM-level version this
 * replaces the row *content*, not the row: the `Combobox.Item` shell stays, so
 * keyboard navigation and selection wiring survive the override.
 */
export interface InfiniteSelectItemRenderParams<T> {
  item: T
  option: InfiniteSelectOption
  /**
   * Position in the currently loaded (server-filtered) list — a display
   * ordinal for ranks and zebra striping, not an identity: searching reshuffles
   * it. Identity is `option.id`. Provided because CSS ordinal selectors cannot
   * work across a virtualized window.
   */
  index: number
  // Base UI's item-state vocabulary, passed through whole: a custom renderer
  // gets the same states CSS gets as data-*.
  selected: boolean
  disabled: boolean
  selectionMode: 'single' | 'multiple'
}

/** The list-state props a data adapter must supply (a react-query wrapper, say). */
export interface InfiniteSelectAdapterProps<T> {
  items: T[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  isError: boolean
  onLoadMore: () => void
  onRetry: () => void
}

interface InfiniteSelectCommonProps<T> {
  /** Root accessible name; the List part falls back to it. */
  'aria-label'?: string
  'items': T[]

  'isLoading'?: boolean
  'isFetchingNextPage'?: boolean
  'hasNextPage'?: boolean
  'isError'?: boolean

  'onLoadMore'?: () => void
  'onRetry'?: () => void

  // The search text. The root hosts Base UI's Combobox, which context-wires any
  // Input / List descendants — that is what lets the parts compose freely as
  // children. The callback is Base UI's own, details included — `reason`
  // distinguishes typing from clearing from an item press backfilling.
  'inputValue'?: string
  'onInputValueChange'?: (value: string, eventDetails: Combobox.Root.ChangeEventDetails) => void

  /**
   * Identifies the selection when a form is submitted: with a `name` the panel
   * renders `<input type="hidden">` per selected id (one input for single
   * mode). Plain hidden inputs, not Base UI's focusable visually-hidden one —
   * that machinery exists for native validation and autofill, neither of which
   * a server-filtered panel participates in.
   */
  'name'?: string

  /**
   * Placeholder for the default composition's input group, doubling as its
   * accessible name — the same word `InfiniteCombobox` uses. Ignored once you
   * write your own children.
   */
  'searchPlaceholder'?: string

  'getOption': (item: T) => InfiniteSelectOption

  /**
   * Virtualize rows with TanStack Virtual: only the visible window plus
   * overscan reaches the DOM. Off by default — a few hundred rows don't need
   * it. Lives on the root rather than the List because Base UI has to know too:
   * with rows missing from the DOM it navigates by the value list instead of by
   * DOM order.
   */
  'virtualized'?: boolean
  /**
   * Fixed pixel height of every virtualized row. Heights come from this number,
   * never from DOM measurement, so a custom `renderItem` taller than the default
   * must set it accordingly. Ignored when `virtualized` is off.
   */
  'rowHeight'?: number

  'className'?: string
  /**
   * The composition channel: parts (`InfiniteSelectInputGroup` /
   * `InfiniteSelectList`), state slots (`InfiniteSelectEmpty` / `Error`) and
   * the footer bar, in caller order. Not writing it renders the default
   * composition — input group + list (the default-presence rule); writing it
   * takes the whole channel over. The base renders no copy of its own either
   * way.
   */
  'children'?: ReactNode
}

/**
 * Props of the input-group part (Base UI's word for an input plus its
 * adornments — `Combobox.InputGroup` is the native sibling). `value` /
 * `onValueChange` are not reopened here: the root owns the query and the input
 * claims it from context, so a second channel would only be a way to sever it.
 */
export interface InfiniteSelectInputGroupProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * Placeholder for the default input, doubling as the field's accessible
   * name. No default copy: the base renders zero visible text of its own.
   * Without it (and without an `aria-label`) the accessible name falls back
   * to `'Search'` — a safety net, not copy, since it never renders.
   */
  placeholder?: string
  /**
   * Focus the input on mount. Off by default (an inline panel must not steal
   * page focus); popover hosts pass it so typing works the moment the panel
   * opens — `InfiniteCombobox` does.
   */
  autoFocus?: boolean
  /** Replaces the default composition (icon + input). */
  children?: ReactNode
}

/** Props of the option-list part. */
export interface InfiniteSelectListProps<T = unknown> {
  /** Accessible name for the listbox. Falls back to the root `aria-label`. */
  'aria-label'?: string
  /**
   * Replaces the default row content while keeping selection and focus.
   *
   * The keyboard/pointer highlight is deliberately absent from the params: it is
   * Base UI's to own and it is not readable during render. Style it off
   * `data-highlighted` on the row instead — that is the real API.
   */
  'renderItem'?: (params: InfiniteSelectItemRenderParams<T>) => ReactNode
  /**
   * How far ahead of the visible bottom the next page starts loading, in
   * viewport heights. Larger values make the loading state rarer at the cost of
   * eager requests.
   */
  'loadMoreScrollOffset'?: number
  'maxListHeight'?: number
  /** Scrollbar visibility for the list: always shown, shown on hover, or none. */
  'scrollbars'?: ScrollAreaScrollbars
  /** Class for the scroll container around the list. */
  'className'?: string
  /** Class for the listbox element itself. Function form receives Base UI's list state. */
  'listClassName'?: ComponentProps<typeof Combobox.List>['className']
  /** Class for every row. Function form receives Base UI's item state. */
  'itemClassName'?: ComponentProps<typeof Combobox.Item>['className']
}

/**
 * Controlled/uncontrolled selection props, discriminated on `selectionMode`
 * (an enum, same as our DataTable — never a `multiple` boolean).
 */
export type ControllableSelectionProps<TItem = unknown>
  = | {
    selectionMode: 'multiple'
    value?: string[]
    defaultValue?: string[]
    /**
     * `ids` is the authoritative selection (every toggled id), while `items`
     * only holds the objects that were actually loaded — a preselected id from
     * an unloaded page has an id but no item. Persist `ids`, not `items`.
     * `eventDetails.cancel()` rejects the change.
     */
    onChange?: (items: TItem[], ids: string[], eventDetails: InfiniteSelectChangeEventDetails) => void
  }
  | {
    selectionMode?: 'single'
    /** Controlled selected id. `null` is the controlled empty value — `undefined` means uncontrolled. */
    value?: string | null
    defaultValue?: string
    onChange?: (item: TItem | null, eventDetails: InfiniteSelectChangeEventDetails) => void
  }

export type InfiniteSelectProps<T> = InfiniteSelectCommonProps<T> & ControllableSelectionProps<T>

// ── Hooks layer: the selection state that drives the panel, exported for
//    headless composition. ──

export interface InfiniteSelectSelectionState<T> {
  /** The authoritative selection — unloaded pages included. */
  selectedIds: string[]
  /** Selected item objects, loaded pages only (cross-page cache). */
  selectedItems: T[]
  /**
   * Feed Base UI's `onValueChange` with this — its details pass straight
   * through. Driving it yourself means constructing the details too
   * (`createChangeEventDetails('none')` for a programmatic change): the second
   * argument is never optional, same as every other change callback here.
   */
  onValueChange: (value: string | string[] | null, eventDetails: InfiniteSelectChangeEventDetails) => void
}

/**
 * Controllable selection + the cross-page item cache + the Base UI value →
 * business `onChange` translation. `InfiniteSelect` consumes it internally;
 * a custom composition can drive its own list with it.
 */
export function useInfiniteSelectSelection<T>(
  options: ControllableSelectionProps<T> & {
    items: T[]
    getOption: (item: T) => InfiniteSelectOption
  },
): InfiniteSelectSelectionState<T> {
  const { items, getOption } = options
  const isMultiple = options.selectionMode === 'multiple'

  // Controlled-ness is `value !== undefined`, Base UI's judgment: `undefined`
  // belongs to "uncontrolled", and a controlled single select clears with
  // `null` — never with `undefined`, which would read as handing control back.
  const normalizeIds = (value: string | string[] | null | undefined): string[] => {
    if (value === undefined || value === null)
      return []
    return Array.isArray(value) ? value : [value]
  }
  const [selectedIds, setSelectedIds] = useControllableState<string[]>({
    value: options.value !== undefined ? normalizeIds(options.value) : undefined,
    defaultValue: options.defaultValue !== undefined ? normalizeIds(options.defaultValue) : undefined,
    fallback: [],
  })

  // `ids` from onValueChange is authoritative; this cache only echoes item
  // objects for ids whose page happens to be loaded. Search can swap `items`
  // wholesale, so selected objects are remembered across pages here.
  const selectedItemsCacheRef = useRef<Map<string, T>>(new Map())
  if (isMultiple) {
    for (const item of items) {
      const id = getOption(item).id
      if (selectedIds.includes(id))
        selectedItemsCacheRef.current.set(id, item)
    }
  }

  const onValueChange = (
    value: string | string[] | null,
    eventDetails: InfiniteSelectChangeEventDetails,
  ): void => {
    const ids = value === null ? [] : Array.isArray(value) ? value : [value]

    // The user callback runs before the state write; cancel() skips it. When
    // the details came from Base UI, the same flag also stops Base UI's own
    // post-callback handling — one cancel, every layer.
    if (options.selectionMode === 'multiple') {
      // Staging additions before the callback so the emitted `items` resolve;
      // pruning waits for the commit.
      for (const item of items) {
        const id = getOption(item).id
        if (ids.includes(id))
          selectedItemsCacheRef.current.set(id, item)
      }
      const nextItems = ids
        .map(id => selectedItemsCacheRef.current.get(id))
        .filter((entry): entry is T => entry !== undefined)
      options.onChange?.(nextItems, ids, eventDetails)
      if (eventDetails.isCanceled)
        return
      // Map 迭代器允许边遍历边删,无需先拷贝
      for (const id of selectedItemsCacheRef.current.keys()) {
        if (!ids.includes(id))
          selectedItemsCacheRef.current.delete(id)
      }
      setSelectedIds(ids)
      return
    }

    const id = ids[0]
    options.onChange?.(
      id === undefined ? null : items.find(item => getOption(item).id === id) ?? null,
      eventDetails,
    )
    if (eventDetails.isCanceled)
      return
    // Controlled mode makes this a no-op (the hook only mirrors props there).
    setSelectedIds(ids)
  }

  const selectedItems = selectedIds
    .map(id => selectedItemsCacheRef.current.get(id))
    .filter((entry): entry is T => entry !== undefined)

  return { selectedIds, selectedItems, onValueChange }
}

// ── Wiring context: the root provides data + selection, the parts consume, so
//    parts compose in caller order as plain children. ──

export interface InfiniteSelectContextValue<T = unknown> {
  'items': T[]
  'getOption': (item: T) => InfiniteSelectOption
  'selectionMode': 'single' | 'multiple'
  'selectedIds': string[]
  /**
   * The list has rows to show (loaded, no error, non-empty) — Base UI's Field
   * word for "has content", not a coined `hasItems`.
   */
  'filled': boolean
  // Verbatim mirrors of the adapter contract props, kept in react-query's word
  // forms on purpose: a custom part reads them and hands them back to the same
  // adapter. The exemption covers these two, nothing derived.
  'hasNextPage': boolean
  'isFetchingNextPage': boolean
  'onLoadMore'?: (() => void) | undefined
  'virtualized': boolean
  'rowHeight': number
  /** Root-level accessible name — the List part's fallback. */
  'aria-label'?: string | undefined
  /** Lifted from a composed `InfiniteSelectLoadingOverlay`; the List renders it. */
  'loadingOverlayProps'?: InfiniteSelectLoadingOverlayProps | undefined
  /** Lifted from a composed `InfiniteSelectNoMore`; the List renders it. */
  'noMoreProps'?: InfiniteSelectNoMoreProps | undefined
  /** Lifted from a composed `InfiniteSelectLoadingMore`; the List renders it. */
  'loadingMoreProps'?: InfiniteSelectLoadingMoreProps | undefined
}

const InfiniteSelectContext = createContext<InfiniteSelectContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  InfiniteSelectContext.displayName = 'InfiniteSelectContext'

/** Read the panel wiring inside custom parts. Throws outside `InfiniteSelect`. */
export function useInfiniteSelectContext<T = unknown>(): InfiniteSelectContextValue<T> {
  const ctx = use(InfiniteSelectContext)
  if (ctx === null)
    throw new Error('cadenza-ui: InfiniteSelectContext is missing. InfiniteSelect parts must be placed within <InfiniteSelect>.')
  return ctx as InfiniteSelectContextValue<T>
}

/** Shared status container for the state slots: `role=status` announces changes. */
export function InfiniteSelectStatus({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn('px-2 py-3 text-sm text-muted-foreground', className)}
      data-slot="infinite-select-status"
      role="status"
      {...props}
    />
  )
}

// ── State slots: context-driven, zero copy in the base. States are mutually
//    exclusive, so at most one InfiniteSelectStatus renders at a time. ──
// Bare adjectives: the react-query word forms stop at the adapter props, they
// do not travel inward.
interface InfiniteSelectStateContextValue {
  loading: boolean
  error: boolean
  empty: boolean
  onRetry?: (() => void) | undefined
}

const InfiniteSelectStateContext = createContext<InfiniteSelectStateContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  InfiniteSelectStateContext.displayName = 'InfiniteSelectStateContext'

function useInfiniteSelectState(): InfiniteSelectStateContextValue {
  const ctx = use(InfiniteSelectStateContext)
  if (ctx === null)
    throw new Error('cadenza-ui: InfiniteSelectStateContext is missing. InfiniteSelect parts must be placed within <InfiniteSelect>.')
  return ctx
}

/** Empty slot: renders its children when the list has no results. */
export function InfiniteSelectEmpty(props: ComponentProps<'div'>): ReactElement | null {
  const { empty } = useInfiniteSelectState()
  return empty ? <InfiniteSelectStatus {...props} /> : null
}

export type InfiniteSelectLoadingOverlayProps = Omit<LoadingOverlayProps, 'loading'>

/**
 * Slotted customization for the built-in loading overlay: compose it anywhere
 * in the panel's children and the List part renders your props over the list
 * region — `children` replace the centred spinner, `className` tunes the
 * frost. A marker like TabsIndicator: it renders nothing where written (an
 * absolute overlay cannot live in the panel's flow), and `loading` stays
 * the base's wiring. Direct child or inside a Fragment only — a custom
 * wrapper hides it.
 */
export function InfiniteSelectLoadingOverlay(_props: InfiniteSelectLoadingOverlayProps): null {
  return null
}

export type InfiniteSelectLoadingMoreProps = ComponentProps<'div'>

/**
 * Slotted customization for the next-page indicator: while a page is fetching,
 * the List part renders a row at the end of the scrolled content. The default
 * is a Spinner — a mark, not a sentence, because the base ships zero copy.
 * Compose this to replace it:
 *
 * ```tsx
 * <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
 * ```
 *
 * In-flow on purpose: prefetch fires a viewport ahead, so a user at the top
 * never sees it — only someone at the bottom, exactly when it is relevant.
 *
 * A marker like `InfiniteSelectNoMore`: composing it is customization, not a
 * switch. Leave it out and the Spinner still renders.
 */
export function InfiniteSelectLoadingMore(_props: InfiniteSelectLoadingMoreProps): null {
  return null
}

export type InfiniteSelectNoMoreProps = ComponentProps<'div'>

/**
 * Slotted customization for the end-of-list mark: once every page is loaded,
 * the List part renders a terminal row at the end of the scrolled content so
 * the list visibly *ends* instead of just stopping. The default is a fading
 * rule — a mark, not a sentence, because the base ships zero copy. Compose
 * this to replace it with your own text:
 *
 * ```tsx
 * <InfiniteSelectNoMore>没有更多数据</InfiniteSelectNoMore>
 * ```
 *
 * A marker like `InfiniteSelectLoadingOverlay`: it renders nothing where
 * written, and composing it is customization, not a switch — leave it out and
 * the default rule still renders. Direct child or inside a Fragment only.
 *
 * It rides the scroll flow *outside* the listbox element, so it never counts
 * as an option: no `aria-setsize` distortion and nothing extra for
 * `getAllByRole('option')` to find.
 */
export function InfiniteSelectNoMore(_props: InfiniteSelectNoMoreProps): null {
  return null
}

/** Error slot: container for the error copy plus `InfiniteSelectRetry`. */
export function InfiniteSelectError({ className, ...props }: ComponentProps<'div'>): ReactElement | null {
  const { error } = useInfiniteSelectState()
  return error
    ? (
        <InfiniteSelectStatus
          className={cn(`flex flex-col items-center gap-2 py-4`, className)}
          {...props}
        />
      )
    : null
}

/** Retry button: wired to the panel's `onRetry`; renders nothing without one. */
export function InfiniteSelectRetry({ onClick, ...props }: ComponentProps<typeof Button>): ReactElement | null {
  const { onRetry } = useInfiniteSelectState()
  if (!onRetry)
    return null
  return (
    <Button
      data-slot="infinite-select-retry"
      onClick={(event) => {
        onRetry()
        onClick?.(event)
      }}
      size="sm"
      type="button"
      variant="outline"
      {...props}
    />
  )
}

export function InfiniteSelect<T>(props: InfiniteSelectProps<T>): ReactElement {
  const {
    items,
    isLoading = false,
    isFetchingNextPage = false,
    hasNextPage = false,
    isError = false,
    onLoadMore,
    onRetry,
    inputValue,
    onInputValueChange,
    getOption,
    name,
    searchPlaceholder,
    virtualized = false,
    rowHeight = 32,
    'aria-label': ariaLabel,
    className,
    children,
  } = props

  const selectionMode = props.selectionMode ?? 'single'
  const isMultiple = selectionMode === 'multiple'
  const { selectedIds, onValueChange } = useInfiniteSelectSelection<T>(props)

  // One loading look everywhere: `isLoading` always renders the List part's
  // frosted LoadingOverlay — over the results when a reload keeps them on
  // screen (react-query placeholderData), over a min-height blank while the
  // first page is still coming. Only errors unmount the list.
  const isEmpty = !isLoading && !isError && items.length === 0
  const filled = !isError && items.length > 0

  // Provider value memoised (the house rule): the wiring context feeds every
  // part, and an unstable object would re-render them all per keystroke of
  // unrelated state. The marker-part lookups live inside so `children` is
  // their honest dependency.
  const contextValue = useMemo<InfiniteSelectContextValue<T>>(() => ({
    items,
    getOption,
    selectionMode,
    selectedIds,
    filled,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    virtualized,
    rowHeight,
    'aria-label': ariaLabel,
    'loadingOverlayProps': findComposedPart(children, InfiniteSelectLoadingOverlay),
    'noMoreProps': findComposedPart(children, InfiniteSelectNoMore),
    'loadingMoreProps': findComposedPart(children, InfiniteSelectLoadingMore),
  }), [
    items,
    getOption,
    selectionMode,
    selectedIds,
    filled,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    virtualized,
    rowHeight,
    ariaLabel,
    children,
  ])

  const stateContextValue = useMemo<InfiniteSelectStateContextValue>(
    () => ({ loading: isLoading, error: isError, empty: isEmpty, onRetry }),
    [isLoading, isError, isEmpty, onRetry],
  )

  return (
    <div
      className={cn(
        `
          flex flex-col rounded-md border border-border bg-popover
          text-popover-foreground shadow-md inline-full
        `,
        className,
      )}
      data-empty={dataAttr(isEmpty)}
      data-error={dataAttr(isError)}
      data-loading={dataAttr(isLoading)}
      data-slot="infinite-select"
    >
      <InfiniteSelectStateContext value={stateContextValue}>
        <InfiniteSelectContext value={contextValue as InfiniteSelectContextValue}>
          <Combobox.Root
            // `inline` + a pinned `open`: no popup of its own, the list is just
            // part of the panel. A popover host (InfiniteCombobox) provides the
            // overlay around the whole thing instead.
            inline
            open
            // Our filtering is the server's: typing drives onInputValueChange, the
            // caller refetches, and `items` is already the answer. Leaving Base
            // UI's client filter on would filter the results a second time.
            filter={null}
            inputValue={inputValue}
            items={items.map(item => getOption(item).id)}
            multiple={isMultiple}
            value={isMultiple ? selectedIds : (selectedIds[0] ?? null)}
            virtualized={virtualized}
            onInputValueChange={onInputValueChange}
            onValueChange={onValueChange}
          >
            {children ?? (
              <>
                <InfiniteSelectInputGroup placeholder={searchPlaceholder} />
                <InfiniteSelectList />
              </>
            )}
          </Combobox.Root>
        </InfiniteSelectContext>
      </InfiniteSelectStateContext>
      {name !== undefined && (isMultiple
        ? selectedIds.map(id => (
            <input key={id} name={name} type="hidden" value={id} />
          ))
        : <input name={name} type="hidden" value={selectedIds[0] ?? ''} />)}
    </div>
  )
}

/** The input-group part: Base UI's `Combobox.Input` plus the icon, wired by the root. */
export function InfiniteSelectInputGroup({
  placeholder,
  autoFocus = false,
  className,
  children,
  ...props
}: InfiniteSelectInputGroupProps): ReactElement {
  return (
    <div
      className={cn('flex items-center gap-2 border-be border-border px-3', className)}
      data-slot="infinite-select-input-group"
      {...props}
    >
      {children ?? (
        <>
          <IconSearch
            className="shrink-0 text-muted-foreground block-4 inline-4"
            data-slot="infinite-select-input-group-icon"
          />
          <Combobox.Input
            aria-label={placeholder ?? 'Search'}
            autoFocus={autoFocus}
            className="
              flex-1 bg-transparent py-2 text-sm/5 text-popover-foreground
              outline-none min-inline-0
              placeholder:text-muted-foreground
              [&::-webkit-search-cancel-button]:appearance-none
            "
            data-slot="infinite-select-input"
            placeholder={placeholder}
            type="search"
          />
        </>
      )}
    </div>
  )
}

/**
 * Fires `onLoadMore` when it scrolls into view, a viewport-height early by
 * default. This is the whole of infinite scroll here: an empty div trailing the
 * rows, *outside* the listbox so it is never mistaken for an option.
 *
 * An observer rather than a scroll handler because the sentinel's position is
 * what matters, not the scroll offset — under virtualization the offset says
 * nothing about how many rows are left.
 */
function LoadMoreSentinel({
  onLoadMore,
  isFetchingNextPage,
  scrollOffset,
}: {
  onLoadMore: (() => void) | undefined
  isFetchingNextPage: boolean
  scrollOffset: number
}): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  // Read at fire time so a re-render never has to re-arm the observer.
  const latestRef = useRef({ onLoadMore, isFetchingNextPage })
  latestRef.current = { onLoadMore, isFetchingNextPage }

  useEffect(() => {
    const node = ref.current
    const viewport = node?.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')
    if (!node || !viewport)
      return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !latestRef.current.isFetchingNextPage)
          latestRef.current.onLoadMore?.()
      },
      { root: viewport, rootMargin: `0px 0px ${scrollOffset * 100}% 0px` },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [scrollOffset])

  return <div aria-hidden data-slot="infinite-select-load-more-sentinel" ref={ref} />
}

/** The option-list part: ScrollArea + Base UI `Combobox.List`, virtualized on demand. */
export function InfiniteSelectList<T = unknown>(props: InfiniteSelectListProps<T>): ReactElement | null {
  const {
    renderItem,
    loadMoreScrollOffset = 1,
    maxListHeight = 256,
    scrollbars,
    className,
    listClassName,
    itemClassName,
    'aria-label': ariaLabelProp,
  } = props

  const ctx = useInfiniteSelectContext<T>()
  const {
    items,
    getOption,
    selectionMode,
    selectedIds,
    filled,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    virtualized,
    rowHeight,
    loadingOverlayProps,
    noMoreProps,
    loadingMoreProps,
  } = ctx
  const { loading } = useInfiniteSelectState()
  const isMultiple = selectionMode === 'multiple'
  const ariaLabel = ariaLabelProp ?? ctx['aria-label']

  const viewportRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: virtualized ? items.length : 0,
    estimateSize: () => rowHeight,
    getScrollElement: () => viewportRef.current,
    // The viewport's height is `maxListHeight` until it is measured. Without
    // this the first window is computed against a zero-height rect and renders
    // nothing — on the server, and anywhere ResizeObserver has not fired yet.
    initialRect: { width: 0, height: maxListHeight },
    overscan: 8,
  })
  const virtualItems = virtualizer.getVirtualItems()

  const renderOption = (item: T, index: number): ReactElement => {
    const option = getOption(item)
    const isSelected = selectedIds.includes(option.id)
    return (
      <Combobox.Item
        key={option.id}
        className={cn(
          `
            group/option flex cursor-default items-center gap-2 rounded-lg px-2
            py-1.5 text-sm/5 text-popover-foreground transition-colors
            outline-none select-none
          `,
          `
            data-highlighted:bg-muted
            data-selected:bg-muted/50
            data-selected:data-highlighted:bg-muted
          `,
          `data-disabled:cursor-not-allowed data-disabled:opacity-50`,
          itemClassName,
        )}
        data-slot="infinite-select-item"
        disabled={option.disabled}
        value={option.id}
      >
        {renderItem
          ? renderItem({
              item,
              option,
              index,
              selected: isSelected,
              disabled: option.disabled ?? false,
              selectionMode,
            })
          : (
              <>
                {/* State lives on the row's data-selected (Base UI writes it);
                    the visuals read it through CSS — no JS re-render needed to
                    restyle, and a custom itemClassName sees the same channel.
                    The check inherits currentColor, so text-transparent IS the
                    unchecked state. */}
                {isMultiple && (
                  <span
                    aria-hidden
                    data-slot="infinite-select-checkbox"
                    className="
                      flex shrink-0 items-center justify-center rounded-[4px]
                      border border-input bg-background text-transparent
                      transition-colors block-4 inline-4
                      group-data-selected/option:border-primary
                      group-data-selected/option:bg-primary
                      group-data-selected/option:text-primary-foreground
                    "
                  >
                    <IconCheck className="block-3 inline-3" />
                  </span>
                )}
                <span className="flex-1 truncate min-inline-0">{option.label}</span>
                {!isMultiple && (
                  <IconCheck
                    className="
                      hidden shrink-0 text-primary block-4 inline-4
                      group-data-selected/option:block
                    "
                  />
                )}
              </>
            )}
      </Combobox.Item>
    )
  }

  // First page still coming: nothing exists to size the list yet, so the
  // shell gets a minimum height for the frosted overlay to show on. Same
  // look as a refresh — one loading visual everywhere.
  if (!filled) {
    return loading
      ? (
          <div className="relative min-block-24" data-slot="infinite-select-list-container">
            <LoadingOverlay {...loadingOverlayProps} loading />
          </div>
        )
      : null
  }

  return (
    // The overlay must cover the visible viewport, not scroll with the rows —
    // hence the positioned shell around the ScrollArea rather than inside it.
    // The search field stays outside on purpose: typing is what drives the
    // refresh, covering the input would interrupt it.
    <div className="relative" data-slot="infinite-select-list-container">
      <ScrollArea
        className={className}
        scrollbars={scrollbars}
        viewportClassName="scroll-fade-y overscroll-contain"
        viewportRef={viewportRef}
        viewportStyle={{ maxHeight: maxListHeight }}
      >
        <Combobox.List
          aria-label={ariaLabel}
          className={cn(
            'flex flex-col gap-0.5 p-1 outline-none',
            virtualized && 'relative block gap-0 p-0',
            listClassName,
          )}
          data-slot="infinite-select-list"
        >
          {virtualized
            ? (
                <div className="relative inline-full" style={{ height: virtualizer.getTotalSize() }}>
                  {virtualItems.map(virtualItem => (
                    <div
                      key={virtualItem.key}
                      className="absolute inset-s-0 px-1 inline-full"
                      style={{ height: virtualItem.size, transform: `translateY(${virtualItem.start}px)` }}
                    >
                      {renderOption(items[virtualItem.index], virtualItem.index)}
                    </div>
                  ))}
                </div>
              )
            : items.map((item, index) => renderOption(item, index))}
        </Combobox.List>

        {hasNextPage
          ? (
              <>
                <LoadMoreSentinel
                  isFetchingNextPage={isFetchingNextPage}
                  scrollOffset={loadMoreScrollOffset}
                  onLoadMore={onLoadMore}
                />
                {isFetchingNextPage && (
                  <div
                    data-slot="infinite-select-load-more"
                    {...loadingMoreProps}
                    className={cn(
                      `
                        flex items-center justify-center py-1.5 text-center
                        text-xs text-muted-foreground
                      `,
                      loadingMoreProps?.className,
                    )}
                  >
                    {/* A default, not an optional extra: without it the next
                        page would arrive with no feedback at all. A Spinner is
                        the copyless default, same rule as LoadingOverlay. */}
                    {loadingMoreProps?.children ?? (
                      <Spinner
                        aria-hidden
                        className="block-3.5 inline-3.5"
                      />
                    )}
                  </div>
                )}
              </>
            )
          : (
              // Every page is in: the list visibly ends instead of just stopping.
              <div
                data-slot="infinite-select-no-more"
                {...noMoreProps}
                className={cn(
                  `
                    flex items-center justify-center py-3 text-center text-xs
                    text-muted-foreground
                  `,
                  noMoreProps?.className,
                )}
              >
                {noMoreProps?.children ?? (
                  <span
                    aria-hidden
                    className={`
                      bg-linear-to-r from-transparent via-muted-foreground/40
                      to-transparent block-px inline-24
                    `}
                    data-slot="infinite-select-no-more-rule"
                  />
                )}
              </div>
            )}
      </ScrollArea>
      <LoadingOverlay {...loadingOverlayProps} loading={loading} />
    </div>
  )
}

// ── Footer actions (clear/close): the context lives in this base layer because
//    infinite-combobox already imports this file — hosting the hook up there
//    would make the import cycle. The combobox only fills the value. ──

/** Selection actions available inside the footer. The combobox supplies them. */
export interface InfiniteSelectActions<T = unknown> {
  /** Currently selected item objects (loaded pages only). */
  selectedItems: T[]
  /** Authoritative selected ids. */
  selectedIds: string[]
  /** Clear the selection. Details default to reason `'none'`. */
  clear: (eventDetails?: InfiniteSelectChangeEventDetails) => void
  /** Close the popover host, if there is one. */
  close: (eventDetails?: InfiniteSelectChangeEventDetails) => void
}

const InfiniteSelectActionsContext = createContext<InfiniteSelectActions | null>(null)
if (process.env.NODE_ENV !== 'production')
  InfiniteSelectActionsContext.displayName = 'InfiniteSelectActionsContext'

/**
 * Wiring between `InfiniteCombobox` and the footer parts. It lives here only
 * because hosting it up there would make an import cycle. Not public API:
 * compose the exported footer parts instead.
 *
 * @internal
 */
export function InfiniteSelectActionsProvider<T>({ value, children }: {
  value: InfiniteSelectActions<T>
  children: ReactNode
}): ReactElement {
  return (
    <InfiniteSelectActionsContext value={value}>
      {children}
    </InfiniteSelectActionsContext>
  )
}

export function useInfiniteSelectActions<T = unknown>(): InfiniteSelectActions<T> {
  const ctx = use(InfiniteSelectActionsContext)
  if (ctx === null)
    throw new Error('cadenza-ui: InfiniteSelectActionsContext is missing. Footer action parts must be placed within <InfiniteCombobox>.')
  return ctx as InfiniteSelectActions<T>
}

/** Footer bar: the row of actions under the list. */
export function InfiniteSelectFooter({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn('flex items-center border-bs border-border', className)}
      data-slot="infinite-select-footer"
      {...props}
    />
  )
}

/** Divider between footer actions. Vertical, sized by the footer's height. */
export function InfiniteSelectFooterSeparator({ className, ...props }: ComponentProps<typeof Separator>): ReactElement {
  return (
    <Separator
      className={className}
      data-slot="infinite-select-footer-separator"
      orientation="vertical"
      {...props}
    />
  )
}

/**
 * Clears the selection and closes the popover. Label via children. `Clear` is
 * the vocabulary word for this role (`Combobox.Clear`), never `ClearButton` —
 * named action parts carry the role, not the element.
 */
export function InfiniteSelectClear({ className, onClick, ...props }: ComponentProps<typeof Button>): ReactElement {
  const { clear, close } = useInfiniteSelectActions()
  return (
    <Button
      className={cn('flex-1 rounded-none rounded-es-lg', className)}
      data-slot="infinite-select-clear"
      onClick={(event) => {
        clear(createChangeEventDetails('clear-press', event.nativeEvent))
        close(createChangeEventDetails('close-press', event.nativeEvent))
        onClick?.(event)
      }}
      size="sm"
      type="button"
      variant="ghost"
      {...props}
    />
  )
}

/**
 * Closes the popover, which commits the draft under `commitOnClose` — "close
 * and submit" is exactly the vocabulary's `Close` (`Dialog.Close`), so no
 * `Confirm` coinage.
 */
export function InfiniteSelectClose({ className, onClick, ...props }: ComponentProps<typeof Button>): ReactElement {
  const { close } = useInfiniteSelectActions()
  return (
    <Button
      className={cn('flex-1 rounded-none rounded-ee-lg', className)}
      data-slot="infinite-select-close"
      onClick={(event) => {
        close(createChangeEventDetails('close-press', event.nativeEvent))
        onClick?.(event)
      }}
      size="sm"
      type="button"
      variant="ghost"
      {...props}
    />
  )
}
