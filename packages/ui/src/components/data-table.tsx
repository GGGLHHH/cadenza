'use client'

import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from 'react'
import type { Key, Selection, SortDescriptor } from 'react-aria-components'
import type { LoadingOverlayProps } from './loading-overlay'
import type { ScrollAreaScrollbars } from './scroll-area'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { createContext, use, useMemo, useRef } from 'react'
import {
  Collection,
  Table,
  TableLoadMoreItem,
} from 'react-aria-components'
import { findComposedPart } from '#lib/find-part'
import { cn } from '#lib/utils'
import { Button } from '#primitives/button'
import { Checkbox } from '#primitives/checkbox'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#primitives/table'
import { LoadingOverlay } from './loading-overlay'
import { ScrollArea } from './scroll-area'

/**
 * Data table on React Aria's `Table`: grid keyboard navigation, row selection
 * and column sorting are all RAC semantics, driven by a plain column-def
 * array instead of JSX composition. The chrome is a card with a sticky
 * header inside its own scroll container. Like the rest of the library the
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
  isRowHeader?: boolean
  /** Lets the header toggle `sortDescriptor`. Sorting itself is the data layer's job. */
  allowsSorting?: boolean
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
 * The convenience selection layer, mirroring InfiniteSelect's contract. It
 * owns the cross-page archive: ids survive page flips, `'all'` from the
 * header expands to "union the loaded rows in", deselect-all (and Esc)
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
    onChange?: undefined
  }
  | {
    selectionMode: 'single'
    /** Controlled selected row id; `undefined` while controlled means none. */
    value?: string
    defaultValue?: string
    onChange?: (item: T | undefined) => void
  }
  | {
    selectionMode: 'multiple'
    /** Controlled selected row ids — the cross-page archive. */
    value?: string[]
    defaultValue?: string[]
    onChange?: (items: T[], ids: string[]) => void
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
  /** In-flow indicator at the tail of the scrolled rows while a page loads. */
  'loadingMoreIndicator'?: ReactNode
  /**
   * How far ahead of the visible bottom the next page starts loading, in
   * viewport heights (the RAC sentinel's `scrollOffset` semantics). Larger
   * values make the loading state rarer at the cost of eager requests.
   */
  'loadMoreScrollOffset'?: number

  // Raw React Aria selection passthrough — RAC semantics verbatim, no
  // cross-page bookkeeping. Ignored while the value/onChange convenience
  // layer (see DataTableSelectionProps) is in use, except that
  // onSelectionChange still observes the raw selection.
  'selectedKeys'?: Iterable<Key> | 'all'
  'defaultSelectedKeys'?: Iterable<Key> | 'all'
  'onSelectionChange'?: (keys: Selection) => void
  'sortDescriptor'?: SortDescriptor
  'onSortChange'?: (descriptor: SortDescriptor) => void
  /**
   * Prepend a checkbox column wired to row selection (React Aria's
   * `slot="selection"` protocol): row checkboxes toggle, the header checkbox
   * selects all (multiple mode only; the header stays empty in single mode).
   * The column pins itself when the leading data columns are pinned, and is
   * never the row header. Ignored while `selectionMode` is off. Essential
   * together with `onRowAction`, which hands row clicks to the action and
   * leaves checkboxes as the selection gesture.
   */
  'selectionColumn'?: boolean
  /** Row activation (click / Enter). With selection on, RAC moves selection to the checkbox/long-press gestures. */
  'onRowAction'?: (item: T) => void

  /**
   * Height cap for the scrollable row area; overflow scrolls under the sticky
   * header. Required in practice for infinite scroll and virtualization
   * (virtualized falls back to 480 when unset).
   */
  'maxHeight'?: number
  /** Scrollbar visibility: always shown, shown on hover, or none. */
  'scrollbars'?: ScrollAreaScrollbars
  /**
   * Virtualize rows with TanStack Virtual: only the visible window plus
   * overscan reaches the DOM, padded by two inert filler rows so the native
   * `<table>` keeps its full scroll height. Off by default — a few hundred
   * rows don't need it. Trade-offs while on: rows are fixed-height
   * (`rowHeight`), and React Aria only knows the rendered window (typeahead /
   * Home / End / aria row counts are window-scoped).
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
interface DataTableState {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  isFetchingNextPage: boolean
  onRetry?: (() => void) | undefined
}

const DataTableStateContext = createContext<DataTableState | null>(null)

function useDataTableState(): DataTableState {
  const ctx = use(DataTableStateContext)
  if (!ctx)
    throw new Error('DataTable state slots must be used inside DataTable children')
  return ctx
}

/** Empty slot: renders its children when the table has no rows. */
export function DataTableEmpty(props: ComponentProps<'div'>): ReactElement | null {
  const { isEmpty } = useDataTableState()
  return isEmpty ? <DataTableStatus {...props} /> : null
}

/** Error slot: container for the error copy plus `DataTableRetry`. */
export function DataTableError({ className, ...props }: ComponentProps<'div'>): ReactElement | null {
  const { isError } = useDataTableState()
  return isError
    ? (
        <DataTableStatus
          className={cn('flex flex-col items-center gap-2', className)}
          {...props}
        />
      )
    : null
}

/** Retry button: wired to the table's `onRetry`; renders nothing without one. */
export function DataTableRetry({ onPress, ...props }: ComponentProps<typeof Button>): ReactElement | null {
  const { onRetry } = useDataTableState()
  if (!onRetry)
    return null
  return (
    <Button
      data-slot="data-table-retry"
      onPress={(event) => {
        onRetry()
        onPress?.(event)
      }}
      size="sm"
      type="button"
      variant="outline"
      {...props}
    />
  )
}

export type DataTableLoadingOverlayProps = Omit<LoadingOverlayProps, 'isLoading'>

/**
 * Slotted customization for the built-in loading overlay: compose it in the
 * slot channel and the card renders your props over the table — `children`
 * replace the centred spinner, `className` tunes the frost. A marker like
 * TabIndicator: it renders nothing where written (an absolute overlay cannot
 * live in the empty-state flow), and `isLoading` stays the base's wiring.
 * Direct child or inside a Fragment only — a custom wrapper hides it.
 */
export function DataTableLoadingOverlay(_props: DataTableLoadingOverlayProps): null {
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
    loadingMoreIndicator,
    loadMoreScrollOffset = 1,
    selectionMode,
    selectionColumn = false,
    selectedKeys,
    defaultSelectedKeys,
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
  } = props

  const rows = useMemo<DataTableRowEntry<T>[]>(
    () => items.map((item, index) => ({ id: getRowId(item), item, index })),
    [items, getRowId],
  )

  // One loading look everywhere: `isLoading` always renders the frosted
  // LoadingOverlay — over the rows when a reload keeps them on screen
  // (react-query's placeholderData), over a min-height blank when the first
  // page is still coming. Only errors clear the rows; empty/error copy still
  // lands through renderEmptyState, which fires on an empty collection.
  const showRows = !isError
  const displayRows = showRows ? rows : []
  const isEmpty = !isLoading && !isError && rows.length === 0
  const hasRows = showRows && rows.length > 0
  const loadingOverlayProps = findComposedPart(children, DataTableLoadingOverlay)

  // The row header defaults against the caller's columns, before the
  // synthesized selection column is prepended — a checkbox must never be what
  // a screen reader announces as the row's name.
  const rowHeaderId = columns.find(column => column.isRowHeader)?.id ?? columns[0]?.id

  const hasSelectionColumn = selectionColumn && selectionMode !== undefined && selectionMode !== 'none'
  const allColumns = useMemo<DataTableColumn<T>[]>(() => {
    if (!hasSelectionColumn)
      return columns
    const selection: DataTableColumn<T> = {
      id: '__cadenza-selection',
      header: selectionMode === 'multiple' ? <Checkbox slot="selection" /> : null,
      cell: () => <Checkbox slot="selection" />,
      width: 44,
      // Keep the pinned block contiguous when the leading data columns pin.
      pinned: columns.some(column => column.pinned === 'start') ? 'start' : undefined,
    }
    return [selection, ...columns]
  }, [hasSelectionColumn, selectionMode, columns])

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

  const handleRowAction = onRowAction === undefined
    ? undefined
    : (key: Key): void => {
        const row = rows.find(entry => entry.id === String(key))
        if (row)
          onRowAction(row.item)
      }

  // ── Convenience selection layer (cross-page archive). Active only when the
  //    caller opted into value/defaultValue/onChange; otherwise the raw RAC
  //    passthrough below behaves exactly as before. Controlled-ness is key
  //    presence, not `!== undefined` — a controlled single select clears with
  //    value={undefined} — so the ids are normalized to arrays BEFORE the
  //    hook, which turns that undefined into a controlled []. ──
  const usesSelectionValue = 'value' in props || 'defaultValue' in props || props.onChange !== undefined

  const normalizeIds = (value: string | string[] | undefined): string[] => {
    if (value === undefined)
      return []
    return Array.isArray(value) ? value : [value]
  }

  const [selectedIds, setSelectedIds] = useControllableState<string[]>({
    value: 'value' in props ? normalizeIds(props.value) : undefined,
    defaultValue: 'defaultValue' in props ? normalizeIds(props.defaultValue) : undefined,
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

  const handleSelectionValueChange = (selection: Selection): void => {
    const loadedIds = rows.map(row => row.id)
    let ids: string[]
    if (selection === 'all') {
      // Header select-all: union the loaded rows into the archive.
      ids = [...new Set([...selectedIds, ...loadedIds])]
    }
    else if (selection.size === 0) {
      // RAC clears to an empty set on header deselect-all (and Esc); the
      // archive interpretation is "remove the loaded rows", never "wipe".
      ids = selectedIds.filter(id => !loadedIds.includes(id))
    }
    else {
      // Per-row toggles: RAC preserves keys outside the current collection,
      // so the enumerated set already is the full archive.
      ids = [...selection].map(String)
    }

    const cache = selectedItemsCacheRef.current
    for (const row of rows) {
      if (ids.includes(row.id))
        cache.set(row.id, row.item)
    }
    for (const id of [...cache.keys()]) {
      if (!ids.includes(id))
        cache.delete(id)
    }

    // Controlled mode makes this a no-op (the hook only mirrors props there).
    setSelectedIds(ids)

    if (props.selectionMode === 'multiple') {
      const selectedItems = ids
        .map(id => cache.get(id))
        .filter((entry): entry is T => entry !== undefined)
      props.onChange?.(selectedItems, ids)
    }
    else if (props.selectionMode === 'single') {
      const id = ids[0]
      props.onChange?.(id === undefined ? undefined : cache.get(id))
    }
  }

  // Height must be bounded for a virtualizer viewport to exist at all, hence
  // the fallback.
  const effectiveMaxHeight = maxHeight ?? (virtualized ? 480 : undefined)

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
    initialRect: { width: 800, height: effectiveMaxHeight ?? 480 },
  })
  const virtualItems = virtualizer.getVirtualItems()
  const windowRows = virtualized
    ? virtualItems.map(virtualItem => displayRows[virtualItem.index])
    : displayRows
  const padStart = virtualized && virtualItems.length > 0 ? virtualItems[0].start : 0
  const padEnd = virtualized && virtualItems.length > 0
    ? virtualizer.getTotalSize() - virtualItems.at(-1)!.end
    : 0

  // The filler rows holding the scrolled-away height. Disabled (and skipped by
  // keyboard, via disabledBehavior="all" on the table), empty, hover-inert —
  // they only exist so the native <table> keeps its full scroll height.
  const spacerRow = (id: string, blockSize: number): ReactElement => (
    <TableRow
      className="hover:bg-transparent"
      data-slot="data-table-spacer"
      id={id}
      isDisabled
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

  const table = (
    <Table
      aria-label={ariaLabel}
      data-slot="data-table-grid"
      defaultSelectedKeys={usesSelectionValue ? undefined : defaultSelectedKeys}
      onRowAction={handleRowAction}
      onSortChange={onSortChange}
      selectedKeys={usesSelectionValue ? selectedIds : selectedKeys}
      selectionMode={selectionMode}
      sortDescriptor={sortDescriptor}
      onSelectionChange={usesSelectionValue
        ? (selection) => {
            handleSelectionValueChange(selection)
            onSelectionChange?.(selection)
          }
        : onSelectionChange}
      // border model declared explicitly: without Tailwind preflight the UA
      // default is border-separate + 2px border-spacing, which opens gaps
      // between the header cell backgrounds and the card's rounded corners.
      className="
        caption-bottom border-separate border-spacing-0 text-sm inline-full
      "
      disabledBehavior="all"
    >
      <TableHeader columns={allColumns} dependencies={[sortDescriptor]}>
        {column => (
          <TableHead
            allowsSorting={column.allowsSorting}
            className={cn(
              'sticky inset-bs-0 z-10 bg-muted',
              // Pinned headers stick on both axes and overlap their plain
              // siblings during horizontal scroll.
              column.pinned && 'z-20',
              column.className,
            )}
            id={column.id}
            isRowHeader={column.id === rowHeaderId}
            style={cellStyle(column)}
          >
            {({ sortDirection }) => (
              <span className="flex items-center gap-1">
                {column.header}
                {column.allowsSorting && <SortIndicator direction={sortDirection} />}
              </span>
            )}
          </TableHead>
        )}
      </TableHeader>
      <TableBody renderEmptyState={() => children}>
        {padStart > 0 && spacerRow('__cadenza-pad-start', padStart)}
        <Collection dependencies={[allColumns]} items={windowRows}>
          {row => (
            <TableRow
              columns={allColumns}
              data-slot="data-table-row"
              dependencies={[allColumns]}
              id={row.id}
              style={virtualized && !dynamicRowHeight ? { blockSize: rowHeight } : undefined}
              // TanStack's measureElement maps the node back to its item via
              // the data-index attribute; the callback ref feeds it the <tr>.
              // Spread, not inline: the vendored primitive's props type omits
              // `ref`, which React 19 nevertheless passes through at runtime.
              {...(virtualized && dynamicRowHeight
                ? { 'data-index': row.index, 'ref': virtualizer.measureElement }
                : {})}
            >
              {column => (
                <TableCell
                  className={cn(
                    column.pinned && cn('z-10', PINNED_BODY_CELL_CLASSNAME),
                    column.className,
                  )}
                  style={cellStyle(column)}
                >
                  {column.cell(row.item, row.index)}
                </TableCell>
              )}
            </TableRow>
          )}
        </Collection>
        {padEnd > 0 && spacerRow('__cadenza-pad-end', padEnd)}
        {hasRows && hasNextPage && (
          <TableLoadMoreItem
            isLoading={isFetchingNextPage}
            onLoadMore={onLoadMore ?? (() => {})}
            scrollOffset={loadMoreScrollOffset}
            className={cn(
              isFetchingNextPage
                ? 'text-center text-xs text-muted-foreground'
                : 'block-px',
            )}
          >
            {loadingMoreIndicator}
          </TableLoadMoreItem>
        )}
      </TableBody>
    </Table>
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
      data-slot="data-table"
    >
      <DataTableStateContext
        value={{ isLoading, isError, isEmpty, isFetchingNextPage, onRetry }}
      >
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
          isLoading={isLoading}
        />
      </DataTableStateContext>
    </div>
  )
}
