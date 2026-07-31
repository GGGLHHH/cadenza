'use client'

import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from 'react'
import type { Key, Selection, SelectionMode, SortDescriptor } from 'react-aria-components'
import type { ScrollAreaScrollbars } from './scroll-area'
import { cn } from '@gedatou/cadenza-ui/lib/utils'
import { Button } from '@gedatou/cadenza-ui/primitives/button'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@gedatou/cadenza-ui/primitives/table'
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { createContext, use, useMemo, useRef } from 'react'
import {
  Collection,
  Table,
  TableLoadMoreItem,
} from 'react-aria-components'
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

export interface DataTableProps<T> {
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

  // Selection and sorting are React Aria passthroughs — RAC owns the
  // semantics, the data layer owns the actual sort.
  'selectionMode'?: SelectionMode
  'selectedKeys'?: Iterable<Key> | 'all'
  'defaultSelectedKeys'?: Iterable<Key> | 'all'
  'onSelectionChange'?: (keys: Selection) => void
  'sortDescriptor'?: SortDescriptor
  'onSortChange'?: (descriptor: SortDescriptor) => void
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

/** Loading slot: renders its children during the first-page load. */
export function DataTableLoading(props: ComponentProps<'div'>): ReactElement | null {
  const { isLoading } = useDataTableState()
  return isLoading ? <DataTableStatus {...props} /> : null
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

  // States are mutually exclusive, mirroring InfiniteSelect: while loading or
  // errored the rows give way to the status region (renderEmptyState fires on
  // an empty collection, which is where the slot children land).
  const showRows = !isLoading && !isError
  const displayRows = showRows ? rows : []
  const isEmpty = showRows && rows.length === 0
  const hasRows = showRows && rows.length > 0

  const rowHeaderId = columns.find(column => column.isRowHeader)?.id ?? columns[0]?.id

  const pinnedLayout = useMemo(() => computePinnedLayout(columns), [columns])

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
    getItemKey: index => displayRows[index]!.id,
    overscan: 12,
    initialRect: { width: 800, height: effectiveMaxHeight ?? 480 },
  })
  const virtualItems = virtualizer.getVirtualItems()
  const windowRows = virtualized
    ? virtualItems.map(virtualItem => displayRows[virtualItem.index]!)
    : displayRows
  const padStart = virtualized && virtualItems.length > 0 ? virtualItems[0]!.start : 0
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
      {columns.map(column => (
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
      defaultSelectedKeys={defaultSelectedKeys}
      onRowAction={handleRowAction}
      onSelectionChange={onSelectionChange}
      onSortChange={onSortChange}
      selectedKeys={selectedKeys}
      selectionMode={selectionMode}
      sortDescriptor={sortDescriptor}
      // border model declared explicitly: without Tailwind preflight the UA
      // default is border-separate + 2px border-spacing, which opens gaps
      // between the header cell backgrounds and the card's rounded corners.
      className="
        caption-bottom border-separate border-spacing-0 text-sm inline-full
      "
      disabledBehavior="all"
    >
      <TableHeader columns={columns} dependencies={[sortDescriptor]}>
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
        <Collection dependencies={[columns]} items={windowRows}>
          {row => (
            <TableRow
              columns={columns}
              data-slot="data-table-row"
              dependencies={[columns]}
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
          overflow-hidden rounded-lg border border-border bg-card
          text-card-foreground shadow-xs
        `,
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
      </DataTableStateContext>
    </div>
  )
}
