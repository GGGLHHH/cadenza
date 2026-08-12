'use client'

import type { DragControls } from 'motion/react'
import type { ReactElement, ReactNode } from 'react'
import type { ChangeEventDetails, GenericEventDetails } from '#lib/change-event-details'
import { useControllableState } from '@gedatou/cadenza-utils'
import { IconGripVertical } from '@tabler/icons-react'
import { Reorder, useDragControls } from 'motion/react'
import { createContext, Fragment, use, useMemo, useRef, useState } from 'react'
import { createChangeEventDetails, createGenericEventDetails } from '#lib/change-event-details'
import { cn } from '#lib/utils'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from './select'

/**
 * The column picker family, dual-shape like the rest of the Select world: the
 * root without children renders the default composition (trigger + popup +
 * list), the root with children hands the structure over to you. Trigger and
 * popup vocabulary is the existing Select family's — the parts that are new
 * here are only the ones with new behaviour: List (draft-ordered mapping),
 * Item (option × Reorder.Item merged onto one element) and Grip.
 *
 * Two kinds of machinery live in this file, kept apart on purpose so the
 * generic half could one day move into the Select family wholesale:
 * - the reorder machinery (draft order, capture guards, drag controls), which
 *   knows nothing about columns;
 * - the column semantics (`hideable` locks, id→header labels), which know
 *   nothing about dragging.
 */

/**
 * The slice of a column this picker needs. Deliberately structural rather than
 * `DataTableColumn<T>`: a `DataTableColumn` satisfies it as-is, and a caller
 * whose columns live in another shape (a TanStack Table instance, say) can map
 * to it in one line instead of synthesizing dummy `cell` functions.
 */
export interface DataTableColumnOption {
  id: string
  header: ReactNode
  hideable?: boolean
}

/**
 * `'item-press'` is a picker option toggling visibility, `'drag'` is the grip
 * reordering the list, `'none'` is programmatic.
 */
export type DataTableColumnsSelectChangeEventReason = 'item-press' | 'drag' | 'none'

export type DataTableColumnsSelectChangeEventDetails
  = ChangeEventDetails<DataTableColumnsSelectChangeEventReason>

/** `onOrderCommitted`'s second argument — a commit notice, so no `cancel()`. */
export type DataTableColumnsSelectOrderEventDetails = GenericEventDetails<'drag'>

// ── Contexts. Root-level carries the reorder machinery to List/Item/Grip;
//    item-level carries each option's drag controls to its own Grip. ──

interface ColumnsSelectContextValue {
  orderable: boolean
  /** Columns in draft order while a drag is in flight, prop order otherwise. */
  orderedColumns: DataTableColumnOption[]
  orderIds: string[]
  draggingRef: { current: boolean }
  swallowWhileDragging: (event: { stopPropagation: () => void }) => void
  onReorder: (next: string[]) => void
  onItemDragEnd: () => void
}

const ColumnsSelectContext = createContext<ColumnsSelectContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  ColumnsSelectContext.displayName = 'DataTableColumnsSelectContext'

function useColumnsSelectContext(): ColumnsSelectContextValue {
  const context = use(ColumnsSelectContext)
  if (context === null)
    throw new Error('cadenza-ui: DataTableColumnsSelectContext is missing. DataTableColumnsSelect parts must be placed within <DataTableColumnsSelect>.')
  return context
}

interface ColumnsSelectItemContextValue {
  dragControls: DragControls
}

const ColumnsSelectItemContext = createContext<ColumnsSelectItemContextValue | null>(null)
if (process.env.NODE_ENV !== 'production')
  ColumnsSelectItemContext.displayName = 'DataTableColumnsSelectItemContext'

function useColumnsSelectItemContext(): ColumnsSelectItemContextValue {
  const context = use(ColumnsSelectItemContext)
  if (context === null)
    throw new Error('cadenza-ui: DataTableColumnsSelectItemContext is missing. DataTableColumnsSelectGrip must be placed within <DataTableColumnsSelectItem>.')
  return context
}

export interface DataTableColumnsSelectProps {
  /** Every column, hidden ones included — this is the picker's menu, not the table's. */
  'columns': DataTableColumnOption[]
  /** Controlled ids of the visible columns. Uncontrolled starts with all of them. */
  'value'?: string[]
  'defaultValue'?: string[]
  /** `eventDetails.cancel()` rejects the change. */
  'onValueChange'?: (ids: string[], eventDetails: DataTableColumnsSelectChangeEventDetails) => void
  /**
   * The order **while the drag is in flight**, fired on every crossing.
   * Cancelable: `cancel()` keeps the picker's own draft from taking the change.
   *
   * This is the Slider pair — the thing you hang the table off is
   * {@link DataTableColumnsSelectProps.onOrderCommitted}, not this. Driving the
   * table from here reshuffles it under the user's cursor and re-renders every
   * column on every crossing.
   */
  'onOrderChange'?: (ids: string[], eventDetails: DataTableColumnsSelectChangeEventDetails) => void
  /**
   * The order **once the drag settles**, fired once. A commit notice, so no
   * `cancel()` — by then the picker has nothing left to skip.
   *
   * Either callback makes the grips appear. Absence over a boolean switch — a
   * grip with nowhere to report to is dead UI.
   */
  'onOrderCommitted'?: (ids: string[], eventDetails: DataTableColumnsSelectOrderEventDetails) => void
  /** Accessible name for the DEFAULT composition's trigger. English default, the house pattern. Moot once you compose children. */
  'aria-label'?: string
  /** Shown by the default composition when nothing is visible. Moot once you compose children. */
  'placeholder'?: string
  /** Lands on the default composition's trigger. Moot once you compose children. */
  'className'?: string
  /**
   * The composition channel. Absent, the root renders the default composition;
   * present, the structure is yours — Select vocabulary (`SelectTrigger`,
   * `SelectValue`, `SelectPopup`, `SelectSeparator`…) plus the three parts of
   * this family (`DataTableColumnsSelectList` / `Item` / `Grip`).
   */
  'children'?: ReactNode
}

/**
 * The column picker: a multi-select whose options are the table's columns and
 * whose value is the visible ones.
 *
 * It does not hide anything itself — hiding is `columns.filter(...)` at the call
 * site, because the table renders exactly the columns it is handed. Keeping the
 * filter in the open is what lets the same control drive a table whose column
 * state lives elsewhere (TanStack Table's `columnVisibility`, a URL param, a
 * saved view). Reordering follows the same rule: the picker reports ids, the
 * caller sorts.
 *
 * ```tsx
 * const [visible, setVisible] = useState<string[]>()
 * <DataTableColumnsSelect columns={allColumns} value={visible} onValueChange={setVisible} />
 * <DataTable columns={allColumns.filter(column => visible.includes(column.id))} items={items} />
 * ```
 */
export function DataTableColumnsSelect({
  columns,
  value,
  defaultValue,
  onValueChange,
  onOrderChange,
  onOrderCommitted,
  'aria-label': ariaLabel = 'Columns',
  placeholder,
  className,
  children,
}: DataTableColumnsSelectProps): ReactElement {
  const allIds = useMemo(() => columns.map(column => column.id), [columns])
  const lockedIds = useMemo(
    () => columns.filter(column => column.hideable === false).map(column => column.id),
    [columns],
  )
  // The trigger prints values, and the values are ids — this is what turns them
  // back into header content. Fed to the Select root, so a composed
  // `SelectValue` resolves labels exactly like the default one.
  const items = useMemo(
    () => Object.fromEntries(columns.map(column => [column.id, column.header])),
    [columns],
  )

  const [visibleIds, setVisibleIds] = useControllableState<string[]>({
    value,
    defaultValue,
    fallback: allIds,
  })

  // Locked columns are on no matter what the caller's state says, and the
  // emitted list says so too: `hideable: false` is the column's own word, and a
  // picker that could contradict it would let a caller's `.filter()` drop the
  // row header. Ordering follows `columns`, not click order.
  const normalize = (ids: string[]): string[] =>
    allIds.filter(id => ids.includes(id) || lockedIds.includes(id))

  const orderable = onOrderChange !== undefined || onOrderCommitted !== undefined
  // Whether a drag is in flight. A ref, not state: this is read from event
  // handlers during the gesture, and re-rendering mid-drag would fight Motion.
  const draggingRef = useRef(false)

  // ── The draft order. While a drag is in flight the new order lives HERE and
  //    nowhere else, so the table outside does not reshuffle under the cursor —
  //    it only hears about it on `onOrderCommitted`. `null` means "no drag in
  //    flight, follow the `columns` prop". ──
  const [draftIds, setDraftIds] = useState<string[] | null>(null)
  const draftRef = useRef<string[] | null>(null)
  draftRef.current = draftIds

  const orderIds = useMemo(() => draftIds ?? allIds, [draftIds, allIds])
  // Both the rendered options AND Motion's `values` follow this: Reorder
  // matches them up positionally, so letting them disagree scrambles it.
  const orderedColumns = useMemo(() => {
    const byId = new Map(columns.map(column => [column.id, column]))
    return orderIds
      .map(id => byId.get(id))
      .filter((column): column is DataTableColumnOption => column !== undefined)
  }, [columns, orderIds])

  const contextValue = useMemo<ColumnsSelectContextValue>(() => ({
    orderable,
    orderedColumns,
    orderIds,
    draggingRef,
    // Releasing the pointer lands it on whatever option is under it by then —
    // never the one the drag started on. Base UI reads that as a press and
    // toggles that column off. Swallowing at the group in the CAPTURE phase is
    // what stops it; guarding the grip cannot, because the grip is long gone
    // from under the cursor.
    swallowWhileDragging: (event) => {
      if (draggingRef.current)
        event.stopPropagation()
    },
    onReorder: (next) => {
      const eventDetails = createChangeEventDetails('drag') as DataTableColumnsSelectChangeEventDetails
      onOrderChange?.(next, eventDetails)
      if (eventDetails.isCanceled)
        return
      setDraftIds(next)
      draftRef.current = next
    },
    onItemDragEnd: () => {
      const committed = draftRef.current
      if (committed !== null)
        onOrderCommitted?.(committed, createGenericEventDetails('drag'))
      // Back to following the prop. The caller's state write above batches with
      // this one, so applying the commit renders no intermediate frame;
      // ignoring it snaps the list back, which is the honest signal that
      // nothing landed.
      setDraftIds(null)
      draftRef.current = null
      // One tick late: the release that ends the drag still has its
      // pointerup/click to deliver, and that is what the capture guard eats.
      setTimeout(() => {
        draggingRef.current = false
      }, 0)
    },
  }), [orderable, orderedColumns, orderIds, onOrderChange, onOrderCommitted])

  return (
    <Select<string, true>
      items={items}
      multiple
      value={normalize(visibleIds)}
      onValueChange={(next, details) => {
        const ids = normalize(next)
        const eventDetails = createChangeEventDetails(
          'item-press',
          details.event,
        ) as DataTableColumnsSelectChangeEventDetails
        onValueChange?.(ids, eventDetails)
        if (eventDetails.isCanceled)
          return
        setVisibleIds(ids)
      }}
    >
      <ColumnsSelectContext value={contextValue}>
        {children ?? (
          <>
            <SelectTrigger
              aria-label={ariaLabel}
              className={className}
              data-slot="data-table-columns-select"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectPopup>
              <DataTableColumnsSelectList>
                {column => (
                  <DataTableColumnsSelectItem column={column}>
                    <DataTableColumnsSelectGrip />
                    {column.header}
                  </DataTableColumnsSelectItem>
                )}
              </DataTableColumnsSelectList>
            </SelectPopup>
          </>
        )}
      </ColumnsSelectContext>
    </Select>
  )
}

export interface DataTableColumnsSelectListProps {
  /**
   * Renders one option per column — a function, not static children, and that
   * is load-bearing: while a drag is in flight the render order follows the
   * picker's internal draft, which static JSX cannot do. Motion matches
   * `values` and children up positionally; letting them disagree scrambles the
   * list.
   */
  children: (column: DataTableColumnOption) => ReactNode
  className?: string
}

/**
 * The option list. With a reorder callback on the root it is Motion's
 * `Reorder.Group` carrying the capture-phase guards; without one it is a plain
 * list. Either way it owns the mapping over the columns, in draft order.
 */
export function DataTableColumnsSelectList({ children, className }: DataTableColumnsSelectListProps): ReactElement {
  const { orderable, orderedColumns, orderIds, swallowWhileDragging, onReorder } = useColumnsSelectContext()

  const rendered = orderedColumns.map(column => (
    <Fragment key={column.id}>{children(column)}</Fragment>
  ))

  if (!orderable) {
    return (
      <div className={className} data-slot="data-table-columns-select-list">
        {rendered}
      </div>
    )
  }

  return (
    <Reorder.Group
      as="div"
      axis="y"
      className={className}
      data-slot="data-table-columns-select-list"
      values={orderIds}
      onClickCapture={swallowWhileDragging}
      onMouseUpCapture={swallowWhileDragging}
      onPointerUpCapture={swallowWhileDragging}
      onReorder={onReorder}
    >
      {rendered}
    </Reorder.Group>
  )
}

export interface DataTableColumnsSelectItemProps {
  'column': DataTableColumnOption
  /**
   * Overrides the option's accessible name. The vendored SelectItem wraps
   * children in ItemText — the option's OWN name — so decorated content
   * (icons, counts, extra copy) lands in what a screen reader announces and
   * what typeahead matches. Set this to keep the announced name clean.
   */
  'aria-label'?: string
  'className'?: string
  /** Option content. Defaults to `column.header`. Compose a Grip to make it draggable. */
  'children'?: ReactNode
}

/**
 * One option. The option and the drag target are the SAME element: Base UI's
 * `render` prop merges `Reorder.Item` into it, rather than nesting two boxes.
 * That is what keeps `role="option"`, typeahead and selection intact while
 * Motion owns position.
 */
export function DataTableColumnsSelectItem({
  column,
  'aria-label': ariaLabel,
  className,
  children,
}: DataTableColumnsSelectItemProps): ReactElement {
  const { orderable, draggingRef, onItemDragEnd } = useColumnsSelectContext()
  // `dragListener={false}` plus these controls means only the Grip starts a
  // drag: pressing the row itself still toggles the column.
  const dragControls = useDragControls()
  const itemContextValue = useMemo<ColumnsSelectItemContextValue>(
    () => ({ dragControls }),
    [dragControls],
  )

  return (
    <ColumnsSelectItemContext value={itemContextValue}>
      <SelectItem
        aria-label={ariaLabel}
        className={className}
        disabled={column.hideable === false}
        value={column.id}
        render={orderable
          ? (
              <Reorder.Item
                as="div"
                dragControls={dragControls}
                dragListener={false}
                value={column.id}
                whileDrag={{ scale: 1.02 }}
                onDragEnd={onItemDragEnd}
                onDragStart={() => {
                  draggingRef.current = true
                }}
              />
            )
          : undefined}
      >
        {children ?? column.header}
      </SelectItem>
    </ColumnsSelectItemContext>
  )
}

export interface DataTableColumnsSelectGripProps {
  className?: string
  /** Replaces the default grip icon. */
  children?: ReactNode
}

/**
 * The drag handle. Renders nothing while the root has no reorder callback —
 * absence over dead UI, the `DataTableRetry` rule. Hidden from the accessible
 * name on purpose: anything named inside the option lands in what a screen
 * reader announces ("Reorder name 姓名") and in what typeahead matches. The
 * grip is a pointer affordance — keyboard users reorder through the caller's
 * own UI.
 */
export function DataTableColumnsSelectGrip({ className, children }: DataTableColumnsSelectGripProps): ReactElement | null {
  const { orderable } = useColumnsSelectContext()
  const { dragControls } = useColumnsSelectItemContext()

  if (!orderable)
    return null

  return (
    <span
      aria-hidden
      data-slot="data-table-columns-select-grip"
      className={cn(
        `
          -ms-0.5 cursor-grab text-muted-foreground
          active:cursor-grabbing
        `,
        className,
      )}
      // Swallow the press so the option never sees it; never preventDefault —
      // starting the drag is the default here.
      onPointerDown={(event) => {
        event.stopPropagation()
        dragControls.start(event)
      }}
    >
      {children ?? <IconGripVertical className="block-3.5 inline-3.5" />}
    </span>
  )
}
