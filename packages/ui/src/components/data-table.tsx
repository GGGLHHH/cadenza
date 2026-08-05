'use client'

import type { ComponentProps, CSSProperties, ReactElement, MouseEvent as ReactMouseEvent, ReactNode } from 'react'
import type { ChangeEventDetails, GenericEventDetails } from '#lib/change-event-details'
import type { Key, Selection, SortDescriptor } from '#lib/collections'
import type { ButtonProps } from './button'
import type { LoadingOverlayProps } from './loading-overlay'
import type { ScrollAreaScrollbars } from './scroll-area'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { createContext, use, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { createChangeEventDetails, createGenericEventDetails } from '#lib/change-event-details'
import { findComposedPart } from '#lib/find-part'
import { cn, dataAttr } from '#lib/utils'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#primitives/table'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { LoadingOverlay } from './loading-overlay'
import { ScrollArea } from './scroll-area'
import { Spinner } from './spinner'

/**
 * Data table on a native `<table>`, driven by a plain column-def array instead
 * of JSX composition. The chrome is a card with a sticky header inside its own
 * ScrollArea. Every interactive part is a real control: sorting is a `<button>`
 * in a `<th aria-sort>`, selection is real checkboxes, the row header is a
 * `<th scope="row">` — so the keyboard model is Tab traversal of those
 * controls, not arrow-key cell navigation. Like the rest of the library the
 * base renders zero copy — empty / loading / error come in through slot
 * children, infinite scroll and virtualization are opt-in.
 */
/** Column width: px number or a percentage like `'50%'`. */
export type DataTableColumnWidth = number | `${number}` | `${number}%`

export interface DataTableColumn<T> {
  id: string
  header: ReactNode
  /** Cell content. `index` is the row's position in the loaded list. */
  cell: (item: T, index: number) => ReactNode
  /**
   * Marks the cell that labels its row for screen readers. Exactly one column
   * should be the row header; when none opts in, the first column is used.
   */
  rowHeader?: boolean
  /** Lets the header toggle `sortDescriptor`. Sorting itself is the data layer's job. */
  sortable?: boolean
  /**
   * Column sizing, applied to the header and body cells. Sized columns also
   * keep virtualized windows from jittering as content scrolls in.
   */
  width?: DataTableColumnWidth
  minWidth?: DataTableColumnWidth
  maxWidth?: DataTableColumnWidth
  /**
   * Keep the column on screen while the table scrolls horizontally. By
   * convention `start` columns lead the array and `end` columns trail it —
   * sticky offsets accumulate in array order. Requires a numeric `width`
   * (offsets are computed from it). The edge fade skips pinned columns.
   */
  pinned?: 'start' | 'end'
  /** Extra classes for both the header and body cells of this column. */
  className?: string
}

/**
 * Why the selection changed. `'item-press'` covers a row click and a row
 * checkbox; `'select-all-press'` is the header checkbox (coined — the shared
 * reason vocabulary has no table words, so this follows its `<part>-press`
 * morphology); `'none'` is programmatic.
 */
export type DataTableChangeEventReason = 'item-press' | 'select-all-press' | 'none'

export type DataTableChangeEventDetails = ChangeEventDetails<DataTableChangeEventReason>

/**
 * `onSortChange` details. Generic, not cancelable: `sortDescriptor` is fully
 * controlled — there is no internal sort state a `cancel()` could skip, so
 * none is exposed. `'sort-press'` is coined on the `<part>-press` morphology.
 */
export type DataTableSortEventDetails = GenericEventDetails<'sort-press'>

/**
 * The convenience selection layer, mirroring InfiniteSelect's contract. It
 * owns the cross-page archive: ids survive page flips, `'all'` from the
 * header expands to "union the loaded rows in", deselect-all
 * expands to "remove the loaded rows", and item objects are cached across
 * pages — `ids` is the authoritative set, `items` only echoes objects whose
 * page was actually loaded. Persist `ids`. Server-side select-all ("all
 * 10000 matches, loaded or not") is inherently a business-layer contract the
 * component cannot express — it never saw the unloaded data.
 */
export type DataTableSelectionProps<T>
  = | {
    selectionMode?: 'none'
    value?: undefined
    defaultValue?: undefined
    onValueChange?: undefined
  }
  | {
    selectionMode: 'single'
    /** Controlled selected row id. `null` is the controlled empty value — `undefined` means uncontrolled. */
    value?: string | null
    defaultValue?: string
    /** `eventDetails.cancel()` rejects the change. */
    onValueChange?: (item: T | null, eventDetails: DataTableChangeEventDetails) => void
  }
  | {
    selectionMode: 'multiple'
    /** Controlled selected row ids — the cross-page archive. */
    value?: string[]
    defaultValue?: string[]
    onValueChange?: (items: T[], ids: string[], eventDetails: DataTableChangeEventDetails) => void
  }

export interface DataTableBaseProps<T> {
  /** Accessible name for the grid. */
  'aria-label': string
  'columns': DataTableColumn<T>[]
  'items': T[]
  /** Row key extractor. Defaults to reading `item.id`. */
  'getRowId'?: (item: T) => string

  // The list-state contract, shaped exactly like InfiniteSelectAdapterProps:
  // an adapter object can be spread straight in — `<DataTable {...list} />`.
  'isLoading'?: boolean
  'isFetchingNextPage'?: boolean
  'hasNextPage'?: boolean
  'isError'?: boolean
  'onLoadMore'?: () => void
  'onRetry'?: () => void
  /**
   * How far ahead of the visible bottom the next page starts loading, in
   * viewport heights. Larger values make the loading state rarer at the cost
   * of eager requests.
   */
  'loadMoreScrollOffset'?: number

  // Raw selection passthrough: `selectedKeys` is the controlled set verbatim
  // (`'all'` reads as "every loaded row"), with no cross-page bookkeeping.
  // Ignored while the value/onValueChange convenience layer (see
  // DataTableSelectionProps) is in use, except that onSelectionChange still
  // observes the raw selection.
  'selectedKeys'?: Iterable<Key> | 'all'
  /** `eventDetails.cancel()` also stops the convenience layer from applying the change. */
  'onSelectionChange'?: (keys: Selection, eventDetails: DataTableChangeEventDetails) => void
  'sortDescriptor'?: SortDescriptor
  'onSortChange'?: (descriptor: SortDescriptor, eventDetails: DataTableSortEventDetails) => void
  /**
   * Prepend a synthesized checkbox column wired to row selection: each row
   * cell is a Checkbox bound to that row's id, the header checkbox selects all
   * (multiple mode only; the header stays empty in single mode).
   * The column pins itself when the leading data columns are pinned, and is
   * never the row header. Ignored while `selectionMode` is off. Essential
   * together with `onRowAction`, which hands row clicks to the action and
   * leaves checkboxes as the selection gesture.
   */
  'selectionColumn'?: boolean
  /** Row activation (click). Selection stays the checkboxes' job. */
  'onRowAction'?: (item: T) => void
  // Accessible names for the checkbox column. English defaults, the house
  // pattern: they never render visibly, and a translation belongs to the
  // business layer.
  'selectAllLabel'?: string
  'selectRowLabel'?: string

  /**
   * Height cap for the scrollable row area; overflow scrolls under the sticky
   * header. A cap, not a height — a table shorter than it renders at its
   * natural height with no scrollbar.
   *
   * Defaults to {@link DEFAULT_MAX_HEIGHT}, because **that is what makes the
   * sticky header stick**: `position: sticky` needs a scrollport, and without a
   * cap the row area never scrolls — the whole table just scrolls away with the
   * page. Pass `Number.POSITIVE_INFINITY` for a table that grows without bound
   * and lets the page do the scrolling.
   */
  'maxHeight'?: number
  /** Scrollbar visibility: always shown, shown on hover, or none. */
  'scrollbars'?: ScrollAreaScrollbars
  /**
   * Virtualize rows with TanStack Virtual: only the visible window plus
   * overscan reaches the DOM, padded by two inert filler rows so the native
   * `<table>` keeps its full scroll height. Off by default — a few hundred
   * rows don't need it. Trade-offs while on: rows are fixed-height
   * (`rowHeight`, unless `dynamicRowHeight`), and only the window is in the
   * DOM — browser find-in-page and select-all reach the visible rows only.
   */
  'virtualized'?: boolean
  /**
   * Fixed row height in px while `virtualized`; never measured from the DOM.
   * Under `dynamicRowHeight` it becomes the initial estimate instead.
   */
  'rowHeight'?: number
  /**
   * Let virtualized rows keep their natural height: rows are estimated at
   * `rowHeight`, then measured from the DOM (ResizeObserver) and the layout
   * corrects itself. Costs measurement work and slight scrollbar adjustments
   * while scrolling — keep it off when rows are uniform. Without `virtualized`
   * rows are always natural-height and this flag is moot.
   */
  'dynamicRowHeight'?: boolean
  'className'?: string
  /**
   * Slot channel: the state slots (`DataTableEmpty` / `Loading` / `Error`),
   * rendered in the empty body region under the header. Zero copy in the base.
   */
  'children'?: ReactNode
}

export type DataTableProps<T> = DataTableBaseProps<T> & DataTableSelectionProps<T>

/** Shared status container for the state slots: `role=status` announces changes. */
export function DataTableStatus({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn('px-4 py-6 text-center text-sm text-muted-foreground', className)}
      data-slot="data-table-status"
      role="status"
      {...props}
    />
  )
}

// ── State slots: context-driven, zero copy in the base. States are mutually
//    exclusive, so at most one DataTableStatus renders at a time. ──
// Bare adjectives: the react-query word forms stop at the adapter props, they
// do not travel inward.
interface DataTableStateContextValue {
  empty: boolean
  error: boolean
  onRetry?: (() => void) | undefined
}

const DataTableStateContext = createContext<DataTableStateContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  DataTableStateContext.displayName = 'DataTableStateContext'

function useDataTableState(): DataTableStateContextValue {
  const ctx = use(DataTableStateContext)
  if (ctx === null)
    throw new Error('cadenza-ui: DataTableStateContext is missing. DataTable parts must be placed within <DataTable>.')
  return ctx
}

/** Empty slot: renders its children when the table has no rows. */
export function DataTableEmpty(props: ComponentProps<'div'>): ReactElement | null {
  const { empty } = useDataTableState()
  return empty ? <DataTableStatus {...props} /> : null
}

/** Error slot: container for the error copy plus `DataTableRetry`. */
export function DataTableError({ className, ...props }: ComponentProps<'div'>): ReactElement | null {
  const { error } = useDataTableState()
  return error
    ? (
        <DataTableStatus
          className={cn('flex flex-col items-center gap-2', className)}
          {...props}
        />
      )
    : null
}

/** Retry button: wired to the table's `onRetry`; renders nothing without one. */
export function DataTableRetry({ onClick, ...props }: ButtonProps): ReactElement | null {
  const { onRetry } = useDataTableState()
  if (!onRetry)
    return null
  return (
    <Button
      data-slot="data-table-retry"
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

export type DataTableLoadingOverlayProps = Omit<LoadingOverlayProps, 'loading'>

/**
 * Slotted customization for the built-in loading overlay: compose it in the
 * slot channel and the card renders your props over the table — `children`
 * replace the centred spinner, `className` tunes the frost. A marker part: it
 * renders nothing where written (an absolute overlay cannot live in the
 * empty-state flow) — the card lifts its props out of the slot channel and
 * renders the overlay itself, so `loading` stays the base's wiring.
 * Direct child or inside a Fragment only — a custom wrapper hides it.
 */
export function DataTableLoadingOverlay(_props: DataTableLoadingOverlayProps): null {
  return null
}

// `tr`, not `div`: these props are spread onto `LoadMoreRow`, which renders a
// `<tr>` (a `<tbody>` may only contain rows), so a div's ref type would clash.
export type DataTableLoadingMoreProps = ComponentProps<'tr'>

/**
 * Slotted customization for the next-page indicator: while a page is fetching,
 * a row renders at the tail of the scrolled rows. The default is a Spinner —
 * a mark, not a sentence, because the base ships zero copy. Compose this to
 * replace it:
 *
 * ```tsx
 * <DataTableLoadingMore>加载更多…</DataTableLoadingMore>
 * ```
 *
 * A marker like `DataTableLoadingOverlay`: composing it is customization, not a
 * switch. Leave it out and the Spinner still renders — the row mounts whenever
 * there is a next page, and its children fall back to the Spinner, so the next
 * page never lands without feedback.
 */
export function DataTableLoadingMore(_props: DataTableLoadingMoreProps): null {
  return null
}

interface DataTableRowEntry<T> {
  id: string
  item: T
  index: number
}

function defaultGetRowId(item: unknown): string {
  return String((item as { id: unknown }).id)
}

function columnSizeStyle<T>(column: DataTableColumn<T>): CSSProperties | undefined {
  if (column.width === undefined && column.minWidth === undefined && column.maxWidth === undefined)
    return undefined
  // `width` alone is only a suggestion to table auto layout — the table would
  // squeeze sized columns to fit its container instead of overflowing into a
  // horizontal scroll. Pin min/max to it (unless given) so a sized column is a
  // fixed column; unsized columns stay flexible and absorb leftover space.
  return {
    boxSizing: 'border-box',
    maxWidth: column.maxWidth ?? column.width,
    minWidth: column.minWidth ?? column.width,
    width: column.width,
  }
}

interface PinnedLayout {
  /** Sticky inset per pinned column id, from its own edge. */
  offsets: Map<string, number>
  startTotal: number
  endTotal: number
}

function computePinnedLayout<T>(columns: DataTableColumn<T>[]): PinnedLayout {
  const offsets = new Map<string, number>()
  let startTotal = 0
  for (const column of columns) {
    if (column.pinned === 'start') {
      offsets.set(column.id, startTotal)
      startTotal += typeof column.width === 'number' ? column.width : 0
    }
  }
  let endTotal = 0
  for (const column of [...columns].reverse()) {
    if (column.pinned === 'end') {
      offsets.set(column.id, endTotal)
      endTotal += typeof column.width === 'number' ? column.width : 0
    }
  }
  return { offsets, startTotal, endTotal }
}

// Opaque background so scrolled content never shows through, recreating the
// row's translucent hover tint (muted/50 over card) as a solid mix, and the
// selected tint verbatim. Background lives in classes, not inline style, so
// theme tokens keep working.
const PINNED_BODY_CELL_CLASSNAME = `
  bg-card transition-colors
  [tr:hover>&]:bg-[color-mix(in_oklab,var(--color-muted)_50%,var(--color-card))]
  [tr[data-selected]>&]:bg-muted
`

function SortIndicator({ direction }: { direction: 'ascending' | 'descending' | undefined }): ReactElement {
  const Icon = direction === 'ascending'
    ? IconChevronUp
    : direction === 'descending' ? IconChevronDown : IconSelector
  return (
    <Icon
      aria-hidden
      className={cn(
        'shrink-0 block-4 inline-4',
        direction === undefined ? 'text-muted-foreground/60' : 'text-foreground',
      )}
    />
  )
}

const HEADER_HEIGHT = 40

/**
 * The default height cap for the row area. Its job is to give the sticky header
 * a scrollport — see `maxHeight`. Chosen to match what virtualization already
 * fell back to, so turning `virtualized` on never changes the table's size.
 */
const DEFAULT_MAX_HEIGHT = 480

/** The synthesized checkbox column's id — never a caller's. */
const SELECTION_COLUMN_ID = '__cadenza-selection'

/**
 * Fires `onLoadMore` when the tail of the table scrolls into view, a viewport
 * early by default. A `<tr>` because a `<tbody>` may only contain rows; it is
 * `aria-hidden` and holds nothing, so it never reads as a data row.
 */
function LoadMoreRow({
  onLoadMore,
  isFetchingNextPage,
  scrollOffset,
  colSpan,
  children,
  className,
  ref: composedRef,
  ...props
}: ComponentProps<'tr'> & {
  onLoadMore: (() => void) | undefined
  isFetchingNextPage: boolean
  scrollOffset: number
  colSpan: number
}): ReactElement {
  const ref = useRef<HTMLTableRowElement>(null)
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

  return (
    <tr
      // A tail row, not a data row: the same treatment the spacer rows get, so
      // a screen reader never counts the sentinel among the results.
      aria-hidden
      className={cn('hover:bg-transparent', className)}
      {...props}
      // After the spread and merged, never replaced: in React 19 `ref` is an
      // ordinary prop, so a composed `DataTableLoadingMore ref` would otherwise
      // overwrite the observer's and the sentinel would silently stop firing.
      ref={(node) => {
        ref.current = node
        if (typeof composedRef === 'function')
          composedRef(node)
        else if (composedRef !== null && composedRef !== undefined)
          composedRef.current = node
      }}
    >
      <td className={isFetchingNextPage ? 'py-1.5 text-center' : 'block-px'} colSpan={colSpan}>
        {isFetchingNextPage ? children : null}
      </td>
    </tr>
  )
}

export function DataTable<T>(props: DataTableProps<T>): ReactElement {
  const {
    'aria-label': ariaLabel,
    columns,
    items,
    getRowId = defaultGetRowId,
    isLoading = false,
    isFetchingNextPage = false,
    hasNextPage = false,
    isError = false,
    onLoadMore,
    onRetry,
    loadMoreScrollOffset = 1,
    selectionMode,
    selectionColumn = false,
    selectedKeys,
    onSelectionChange,
    sortDescriptor,
    onSortChange,
    onRowAction,
    maxHeight,
    scrollbars,
    virtualized = false,
    rowHeight = 40,
    dynamicRowHeight = false,
    className,
    children,
    selectAllLabel = 'Select all rows',
    selectRowLabel = 'Select row',
  } = props

  const rows = useMemo<DataTableRowEntry<T>[]>(
    () => items.map((item, index) => ({ id: getRowId(item), item, index })),
    [items, getRowId],
  )

  // One loading look everywhere: `isLoading` always renders the frosted
  // LoadingOverlay — over the rows when a reload keeps them on screen
  // (react-query's placeholderData), over a min-height blank when the first
  // page is still coming. Only errors clear the rows; empty/error copy still
  // lands through the `children` slot, rendered in the empty body row whenever
  // `hasRows` is false.
  const showRows = !isError
  const displayRows = showRows ? rows : []
  const isEmpty = !isLoading && !isError && rows.length === 0
  const hasRows = showRows && rows.length > 0
  const loadingOverlayProps = findComposedPart(children, DataTableLoadingOverlay)
  const loadingMoreProps = findComposedPart(children, DataTableLoadingMore)

  // The row header defaults against the caller's columns, before the
  // synthesized selection column is prepended — a checkbox must never be what
  // a screen reader announces as the row's name.
  const rowHeaderId = columns.find(column => column.rowHeader)?.id ?? columns[0]?.id

  const hasSelectionColumn = selectionColumn && selectionMode !== undefined && selectionMode !== 'none'
  const allColumns = useMemo<DataTableColumn<T>[]>(() => {
    if (!hasSelectionColumn)
      return columns
    const selection: DataTableColumn<T> = {
      id: SELECTION_COLUMN_ID,
      // Filled in at render time — both cells need the selection state, which
      // is not in scope where the column list is built.
      header: null,
      cell: () => null,
      width: 44,
      // Keep the pinned block contiguous when the leading data columns pin.
      pinned: columns.some(column => column.pinned === 'start') ? 'start' : undefined,
    }
    return [selection, ...columns]
  }, [hasSelectionColumn, columns])

  const pinnedLayout = useMemo(() => computePinnedLayout(allColumns), [allColumns])

  const cellStyle = (column: DataTableColumn<T>): CSSProperties | undefined => {
    const size = columnSizeStyle(column)
    if (!column.pinned)
      return size
    return {
      ...size,
      position: 'sticky',
      ...(column.pinned === 'start'
        ? { insetInlineStart: pinnedLayout.offsets.get(column.id) }
        : { insetInlineEnd: pinnedLayout.offsets.get(column.id) }),
    }
  }

  // ── Convenience selection layer (cross-page archive). Active only when the
  //    caller opted into value/defaultValue/onValueChange; otherwise the raw
  //    `selectedKeys` passthrough below is what drives the rows. Controlled-ness
  //    is `value !== undefined`, Base UI's judgment — `undefined` belongs to
  //    "uncontrolled", and a controlled single select clears with `null`. ──
  const usesSelectionValue = props.value !== undefined || props.defaultValue !== undefined
    || props.onValueChange !== undefined

  const normalizeIds = (value: string | string[] | null | undefined): string[] => {
    if (value === undefined || value === null)
      return []
    return Array.isArray(value) ? value : [value]
  }

  const [selectedIds, setSelectedIds] = useControllableState<string[]>({
    value: props.value !== undefined ? normalizeIds(props.value) : undefined,
    defaultValue: props.defaultValue !== undefined ? normalizeIds(props.defaultValue) : undefined,
    fallback: [],
  })

  // `ids` is authoritative; this cache only echoes item objects for ids whose
  // page happens to be loaded. Page flips swap `items` wholesale, so selected
  // objects are remembered across pages here.
  const selectedItemsCacheRef = useRef<Map<string, T>>(new Map())
  if (usesSelectionValue) {
    for (const row of rows) {
      if (selectedIds.includes(row.id))
        selectedItemsCacheRef.current.set(row.id, row.item)
    }
  }

  const handleSelectionValueChange = (selection: Selection, eventDetails: DataTableChangeEventDetails): void => {
    const loadedIds = rows.map(row => row.id)
    let ids: string[]
    if (selection === 'all') {
      // Header select-all: union the loaded rows into the archive.
      ids = [...new Set([...selectedIds, ...loadedIds])]
    }
    else if (selection.size === 0) {
      // An empty set is what header deselect-all (and a single-mode deselect)
      // emits; the archive reading is "remove the loaded rows", never "wipe".
      ids = selectedIds.filter(id => !loadedIds.includes(id))
    }
    else {
      // Per-row toggles: `toggleRow` builds the set from `effectiveSelected`,
      // which already is the archive, so nothing outside the page is dropped.
      ids = [...selection].map(String)
    }

    // Staging additions before the callbacks so the emitted `items` resolve;
    // a superset cache is harmless if the change is then canceled — pruning
    // only happens on commit.
    const cache = selectedItemsCacheRef.current
    for (const row of rows) {
      if (ids.includes(row.id))
        cache.set(row.id, row.item)
    }

    // The same details object flows through every layer (raw
    // `onSelectionChange` already ran): each callback runs before the state
    // write, and a cancel() from any of them skips it — Base UI's
    // checkbox-to-group layering.
    if (props.selectionMode === 'multiple') {
      const selectedItems = ids
        .map(id => cache.get(id))
        .filter((entry): entry is T => entry !== undefined)
      props.onValueChange?.(selectedItems, ids, eventDetails)
    }
    else if (props.selectionMode === 'single') {
      const id = ids[0]
      props.onValueChange?.(id === undefined ? null : cache.get(id) ?? null, eventDetails)
    }
    if (eventDetails.isCanceled)
      return

    for (const id of [...cache.keys()]) {
      if (!ids.includes(id))
        cache.delete(id)
    }
    // Controlled mode makes this a no-op (the hook only mirrors props there).
    setSelectedIds(ids)
  }

  // Provider value memoised (the house rule): these fields change rarely, and
  // an unstable object would re-render every slot on every keystroke of
  // unrelated state.
  const stateContextValue = useMemo<DataTableStateContextValue>(
    () => ({ empty: isEmpty, error: isError, onRetry }),
    [isEmpty, isError, onRetry],
  )

  // A bounded height is what gives the sticky header a scrollport, and what
  // lets a virtualizer viewport exist at all. Infinity is the opt-out: no cap,
  // the page scrolls the table, and the header goes with it.
  const cappedHeight = maxHeight ?? DEFAULT_MAX_HEIGHT
  const effectiveMaxHeight = Number.isFinite(cappedHeight) ? cappedHeight : undefined

  // TanStack Virtual owns windowing (same engine as InfiniteSelect) while the
  // table stays a native <table>: only the window's rows render, and two inert
  // filler rows above and below keep the full scroll height, so sticky header,
  // borders and column layout all behave exactly like the plain path. The hook
  // must run unconditionally (rules of hooks); count 0 keeps it inert when
  // virtualization is off.
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const virtualizer = useVirtualizer({
    count: virtualized ? displayRows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    getItemKey: index => displayRows[index].id,
    overscan: 12,
    initialRect: { width: 800, height: effectiveMaxHeight ?? DEFAULT_MAX_HEIGHT },
  })
  const virtualItems = virtualizer.getVirtualItems()

  // A new batch of rows starts at the top. Otherwise "next page" leaves the old
  // page's offset on the new data — click it halfway down and you land halfway
  // down page 2, with its first rows scrolled past.
  //
  // The table only ever sees `items`, never a page number, so the tell is the
  // first row's id: appending the next page (infinite scroll) and refreshing in
  // place (react-query's placeholderData) keep it, while paging, changing the
  // page size, sorting and searching all replace it. Deleting the first row
  // reads as a new batch too — a reset right after the user's own destructive
  // action, against landing mid-page on every single page turn.
  //
  // Vertical only: the columns did not change, so a horizontal offset stays.
  const firstRowId = displayRows[0]?.id
  const previousFirstRowIdRef = useRef(firstRowId)
  useLayoutEffect(() => {
    if (previousFirstRowIdRef.current === firstRowId)
      return
    previousFirstRowIdRef.current = firstRowId
    // Assigned, not `scrollTo`: the virtualizer listens to the scroll event
    // either way, and a smooth-scroll option would animate through rows that
    // are no longer there.
    if (scrollRef.current !== null)
      scrollRef.current.scrollTop = 0
  }, [firstRowId])
  const windowRows = virtualized
    ? virtualItems.map(virtualItem => displayRows[virtualItem.index])
    : displayRows
  const padStart = virtualized && virtualItems.length > 0 ? virtualItems[0].start : 0
  const padEnd = virtualized && virtualItems.length > 0
    ? virtualizer.getTotalSize() - virtualItems.at(-1)!.end
    : 0

  // The filler rows holding the scrolled-away height. Empty and hover-inert —
  // they only exist so the native <table> keeps its full scroll height.
  const spacerRow = (key: string, blockSize: number): ReactElement => (
    <TableRow
      aria-hidden
      className="hover:bg-transparent"
      data-slot="data-table-spacer"
      key={key}
      style={{ blockSize }}
    >
      {allColumns.map(column => (
        <TableCell className="p-0" key={column.id} />
      ))}
    </TableRow>
  )

  // scroll-fade-inset parks the fades past the sticky header
  // (--scroll-fade-head) and drives both axes at once, so neither the header
  // nor the horizontal edges dim wrongly. It sits on the ScrollArea viewport:
  // the sibling scrollbars stay outside the mask and never fade.
  const fadeStyle = {
    'maxHeight': effectiveMaxHeight,
    '--scroll-fade-head': `${HEADER_HEIGHT}px`,
    '--scroll-fade-pin-l': `${pinnedLayout.startTotal}px`,
    '--scroll-fade-pin-r': `${pinnedLayout.endTotal}px`,
  } as CSSProperties

  // ── Selection, wired by hand now that the base is a native <table>. The
  //    effective set is the convenience layer's archive when it is in use, and
  //    the raw passthrough otherwise. ──
  const effectiveSelected = usesSelectionValue
    ? selectedIds
    : [...(selectedKeys === 'all' ? rows.map(row => row.id) : (selectedKeys ?? []))].map(String)
  const emitSelection = (selection: Selection, eventDetails: DataTableChangeEventDetails): void => {
    // User callbacks run before any state write; the raw observer first, then
    // the convenience layer — a cancel() at either level stops the commit.
    onSelectionChange?.(selection, eventDetails)
    if (eventDetails.isCanceled)
      return
    if (usesSelectionValue)
      handleSelectionValueChange(selection, eventDetails)
  }
  const loadedIds = rows.map(row => row.id)
  const allLoadedSelected = loadedIds.length > 0 && loadedIds.every(id => effectiveSelected.includes(id))
  const someLoadedSelected = loadedIds.some(id => effectiveSelected.includes(id))

  const toggleRow = (id: string, next: boolean, eventDetails: DataTableChangeEventDetails): void => {
    if (selectionMode === 'single') {
      emitSelection(next ? new Set([id]) : new Set(), eventDetails)
      return
    }
    const ids = new Set(effectiveSelected)
    if (next)
      ids.add(id)
    else ids.delete(id)
    emitSelection(ids, eventDetails)
  }

  // Row click selects only when there is no other gesture for it: with a
  // checkbox column the checkboxes own selection, and with `onRowAction` the
  // click is the action.
  const rowClickSelects = selectionMode !== undefined && selectionMode !== 'none'
    && !hasSelectionColumn && onRowAction === undefined

  const sortToggle = (columnId: string, event: Event): void => {
    const isCurrent = sortDescriptor?.column === columnId
    onSortChange?.(
      {
        column: columnId,
        direction: isCurrent && sortDescriptor.direction === 'ascending' ? 'descending' : 'ascending',
      },
      createGenericEventDetails('sort-press', event),
    )
  }

  const renderCell = (column: DataTableColumn<T>, row: DataTableRowEntry<T>): ReactNode => {
    if (hasSelectionColumn && column.id === SELECTION_COLUMN_ID) {
      return (
        <Checkbox
          aria-label={selectRowLabel}
          checked={effectiveSelected.includes(row.id)}
          onCheckedChange={(next, details) => toggleRow(row.id, next, createChangeEventDetails('item-press', details.event))}
        />
      )
    }
    return column.cell(row.item, row.index)
  }

  const renderHeader = (column: DataTableColumn<T>): ReactNode => {
    if (hasSelectionColumn && column.id === SELECTION_COLUMN_ID) {
      if (selectionMode !== 'multiple')
        return null
      return (
        <Checkbox
          aria-label={selectAllLabel}
          checked={allLoadedSelected}
          indeterminate={!allLoadedSelected && someLoadedSelected}
          onCheckedChange={(next, details) => emitSelection(
            next ? 'all' : new Set(effectiveSelected.filter(id => !loadedIds.includes(id))),
            createChangeEventDetails('select-all-press', details.event),
          )}
        />
      )
    }
    const direction = sortDescriptor?.column === column.id ? sortDescriptor.direction : undefined
    const label = <span className="flex items-center gap-1">{column.header}</span>
    if (!column.sortable)
      return label
    // A button, not a click handler on the <th>: sorting has to be reachable
    // and announceable, and `aria-sort` on the header is what says which way.
    return (
      <button
        className="
          flex items-center gap-1 rounded-sm outline-none inline-full
          focus-visible:ring-3 focus-visible:ring-ring/50
        "
        data-slot="data-table-sort-button"
        type="button"
        onClick={event => sortToggle(column.id, event.nativeEvent)}
      >
        {column.header}
        <SortIndicator direction={direction} />
      </button>
    )
  }

  // A bare <table>, not the vendored `Table`: that one wraps itself in its own
  // `overflow-x-auto` container, and a second scroll container between the
  // sticky header and the ScrollArea viewport is exactly what stops the header
  // from sticking — `position: sticky` resolves against the NEAREST scrolling
  // ancestor, and that inner wrapper never scrolls (it has no height cap).
  // Horizontal scrolling is the ScrollArea's job here, on the same element that
  // owns the vertical scroll and the fade mask.
  const table = (
    <table
      aria-label={ariaLabel}
      data-slot="data-table-grid"
      // border model declared explicitly: without Tailwind preflight the UA
      // default is border-separate + 2px border-spacing, which opens gaps
      // between the header cell backgrounds and the card's rounded corners.
      className="
        caption-bottom border-separate border-spacing-0 text-sm inline-full
      "
    >
      <TableHeader>
        <TableRow>
          {allColumns.map(column => (
            <TableHead
              aria-sort={column.sortable
                ? (sortDescriptor?.column === column.id ? sortDescriptor.direction : 'none')
                : undefined}
              key={column.id}
              style={cellStyle(column)}
              className={cn(
                'sticky inset-bs-0 z-10 bg-muted',
                // Pinned headers stick on both axes and overlap their plain
                // siblings during horizontal scroll.
                column.pinned && 'z-20',
                column.className,
              )}
            >
              {renderHeader(column)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {hasRows
          ? (
              <>
                {padStart > 0 && spacerRow('__cadenza-pad-start', padStart)}
                {windowRows.map((row) => {
                  // One activation path for pointer and keyboard. A clickable
                  // row that only answers the mouse locks keyboard users out of
                  // the gesture entirely — and with `selectionColumn` off (the
                  // default) row clicking is the *only* way to select.
                  const activate = onRowAction !== undefined
                    ? (): void => onRowAction(row.item)
                    : rowClickSelects
                      ? (event: Event): void => toggleRow(
                          row.id,
                          !effectiveSelected.includes(row.id),
                          createChangeEventDetails('item-press', event),
                        )
                      : undefined
                  return (
                    <TableRow
                    // The tint has to be spelled out here. The vendored row
                    // styles its selected background off `data-[state=selected]`
                    // — Radix's vocabulary, inherited from the shadcn preset —
                    // and nothing in this library writes `data-state`. So the
                    // row carries `data-selected` (what the rest of the library
                    // and Base UI speak) and the class that actually reads it.
                      className="data-selected:bg-muted"
                      data-selected={dataAttr(effectiveSelected.includes(row.id))}
                      data-slot="data-table-row"
                      key={row.id}
                      style={virtualized && !dynamicRowHeight ? { blockSize: rowHeight } : undefined}
                      tabIndex={activate === undefined ? undefined : 0}
                      onClick={activate === undefined
                        ? undefined
                        : (event: ReactMouseEvent) => activate(event.nativeEvent)}
                      onKeyDown={activate === undefined
                        ? undefined
                        : (event) => {
                            if (event.key !== 'Enter' && event.key !== ' ')
                              return
                            // Space would scroll the region out from under the row.
                            event.preventDefault()
                            activate(event.nativeEvent)
                          }}
                      // TanStack's measureElement maps the node back to its item
                      // via the data-index attribute; the ref feeds it the <tr>.
                      {...(virtualized && dynamicRowHeight
                        ? { 'data-index': row.index, 'ref': virtualizer.measureElement }
                        : {})}
                    >
                      {allColumns.map((column) => {
                        const cellClassName = cn(
                          column.pinned && cn('z-10', PINNED_BODY_CELL_CLASSNAME),
                          column.className,
                        )
                        // The row-header column is a <th scope="row">: that is
                        // what makes a screen reader announce the row by its name
                        // instead of reading every cell bare.
                        return column.id === rowHeaderId
                          ? (
                              <TableHead
                                className={cn('font-normal text-foreground', cellClassName)}
                                key={column.id}
                                scope="row"
                                style={cellStyle(column)}
                              >
                                {renderCell(column, row)}
                              </TableHead>
                            )
                          : (
                              <TableCell className={cellClassName} key={column.id} style={cellStyle(column)}>
                                {renderCell(column, row)}
                              </TableCell>
                            )
                      })}
                    </TableRow>
                  )
                })}
                {padEnd > 0 && spacerRow('__cadenza-pad-end', padEnd)}
                {hasNextPage && (
                  <LoadMoreRow
                    colSpan={allColumns.length}
                    data-slot="data-table-load-more"
                    isFetchingNextPage={isFetchingNextPage}
                    scrollOffset={loadMoreScrollOffset}
                    onLoadMore={onLoadMore}
                    {...loadingMoreProps}
                    className={cn('text-xs text-muted-foreground', loadingMoreProps?.className)}
                  >
                    {/* A default, not an optional extra: without it the next
                        page would land with no feedback at all. */}
                    {loadingMoreProps?.children ?? (
                      <Spinner
                        aria-hidden
                        className="mx-auto block-3.5 inline-3.5"
                      />
                    )}
                  </LoadMoreRow>
                )}
              </>
            )
          : (
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-center block-24" colSpan={allColumns.length}>
                  {children}
                </TableCell>
              </TableRow>
            )}
      </TableBody>
    </table>
  )

  return (
    <div
      className={cn(
        `
          relative overflow-hidden rounded-lg border border-border bg-card
          text-card-foreground shadow-xs
        `,
        // First page still coming: nothing is sizing the card yet, and a
        // frosted overlay over a zero-height area is invisible.
        isLoading && rows.length === 0 && 'min-block-32',
        className,
      )}
      data-empty={dataAttr(isEmpty)}
      data-error={dataAttr(isError)}
      data-loading={dataAttr(isLoading)}
      data-slot="data-table"
    >
      <DataTableStateContext value={stateContextValue}>
        <ScrollArea
          orientation="both"
          scrollbars={scrollbars}
          viewportClassName="scroll-fade-inset"
          viewportRef={scrollRef}
          viewportStyle={fadeStyle}
        >
          {table}
        </ScrollArea>
        {/* Header included on purpose: re-sorting mid-refresh would only queue
            contradictory requests. z-30 clears the pinned header cells' z-20. */}
        <LoadingOverlay
          {...loadingOverlayProps}
          className={cn('z-30', loadingOverlayProps?.className)}
          loading={isLoading}
        />
      </DataTableStateContext>
    </div>
  )
}
