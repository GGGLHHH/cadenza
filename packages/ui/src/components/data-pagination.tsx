'use client'

import type { ReactElement, ReactNode, SetStateAction } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { useControllableState } from '@gedatou/cadenza-utils'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'
import { useCallback, useEffect, useRef } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { cn } from '#lib/utils'
import { Button } from '#primitives/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '#primitives/pagination'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

/**
 * Offset pagination bar: summary on the start side, controls on the end side.
 * `page` and `limit` are independently controllable (controlled via
 * `page`/`limit`, uncontrolled via `defaultPage`/`defaultLimit`). The bar
 * renders no words of its own — the page indicator defaults to the
 * language-neutral `page / totalPages`, everything else comes in through
 * props — so i18n stays in the caller's layer.
 */
export interface DataPaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Why `page`/`limit` changed: `'item-press'` for any control in the bar
 * (nav button or limit option), `'missing'` when the overshoot clamp walks an
 * out-of-range page back, `'none'` for programmatic `setPage`/`setLimit`.
 */
export type DataPaginationChangeEventReason = 'item-press' | 'missing' | 'none'

export type DataPaginationChangeEventDetails = ChangeEventDetails<DataPaginationChangeEventReason>

/** Options of the state hook — also the state slice of `DataPaginationProps`. */
export interface DataPaginationStateOptions {
  /** Total row count across all pages. `0` reads as "not loaded yet" — the clamp effect leaves `page` alone. */
  total: number
  page?: number
  defaultPage?: number
  /** `eventDetails.cancel()` rejects the change — including the overshoot clamp. */
  onPageChange?: (page: number, eventDetails: DataPaginationChangeEventDetails) => void
  limit?: number
  defaultLimit?: number
  onLimitChange?: (limit: number, eventDetails: DataPaginationChangeEventDetails) => void
}

export interface DataPaginationStateResult extends DataPaginationState {
  /** Details default to reason `'none'` (programmatic). */
  setPage: (page: SetStateAction<number>, eventDetails?: DataPaginationChangeEventDetails) => void
  setLimit: (limit: SetStateAction<number>, eventDetails?: DataPaginationChangeEventDetails) => void
  canPrevious: boolean
  canNext: boolean
}

/**
 * Pagination state, extracted hook-style (`useXxxState`): `page` and
 * `limit` independently controllable, derived page count with the zero/NaN
 * guard, and the overshoot clamp. `DataPagination` consumes it internally;
 * a custom pagination UI can be driven by it headlessly.
 */
export function useDataPaginationState(options: DataPaginationStateOptions): DataPaginationStateResult {
  const { total, onPageChange, onLimitChange } = options

  // No `onChange` wiring on the state hooks: the cancel protocol needs the
  // user callback to run before the state write, so it fires explicitly below.
  const [page, setPageState] = useControllableState({
    value: options.page,
    defaultValue: options.defaultPage,
    fallback: 1,
  })
  const [limit, setLimitState] = useControllableState({
    value: options.limit,
    defaultValue: options.defaultLimit,
    fallback: 20,
  })

  // Refs let the updater form resolve against the latest value even in a
  // same-tick chain of calls, where render-captured state would be stale.
  const pageRef = useRef(page)
  pageRef.current = page
  const limitRef = useRef(limit)
  limitRef.current = limit

  const setPage = useCallback(
    (action: SetStateAction<number>, eventDetails: DataPaginationChangeEventDetails = createChangeEventDetails('none')) => {
      const next = typeof action === 'function' ? action(pageRef.current) : action
      onPageChange?.(next, eventDetails)
      if (eventDetails.isCanceled)
        return
      setPageState(next)
      pageRef.current = next
    },
    [onPageChange, setPageState],
  )
  const setLimit = useCallback(
    (action: SetStateAction<number>, eventDetails: DataPaginationChangeEventDetails = createChangeEventDetails('none')) => {
      const next = typeof action === 'function' ? action(limitRef.current) : action
      onLimitChange?.(next, eventDetails)
      if (eventDetails.isCanceled)
        return
      setLimitState(next)
      limitRef.current = next
    },
    [onLimitChange, setLimitState],
  )

  // Guard against limit=0/NaN (e.g. parsed from an untrusted URL param):
  // unguarded division yields "page 1 / Infinity" and dead NaN buttons.
  const totalPages = Number.isFinite(limit) && limit > 0
    ? Math.max(1, Math.ceil(total / limit))
    : 1

  // Clamp only when data is known to exist and `page` overshoots. total=0 means
  // "not loaded yet" (react-query swaps data to undefined mid-flight) — walking
  // `page` back then would flash a stale page into a URL-synced caller.
  useEffect(() => {
    if (total > 0 && page > totalPages)
      setPage(totalPages, createChangeEventDetails('missing'))
  }, [total, totalPages, page, setPage])

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    canPrevious: page > 1,
    canNext: page < totalPages,
  }
}

export interface DataPaginationProps extends DataPaginationStateOptions {
  /** Options for the limit select. `[]` removes the select entirely — absence over a show/hide switch. */
  limitOptions?: number[]
  /** Start-side summary (e.g. "共 N 条"). Omitted: the slot collapses. */
  summary?: (state: DataPaginationState) => ReactNode
  /**
   * Visible label before the limit select, and the select's accessible name.
   * A string like its sibling `*Label` props — not a `ReactNode`: content that
   * needs markup goes through a composition channel, and a rows-per-page label
   * is not that. Omitted: no text renders and the name falls back to English.
   */
  rowsPerPageLabel?: string
  /** Page position between the nav buttons. Defaults to `page / totalPages`. */
  pageIndicator?: (state: DataPaginationState) => ReactNode
  // Accessible names for the icon-only controls. English defaults; pass
  // translations from the business layer.
  firstPageLabel?: string
  previousPageLabel?: string
  nextPageLabel?: string
  lastPageLabel?: string
  className?: string
}

const DEFAULT_LIMIT_OPTIONS = [10, 20, 50, 100]

export function DataPagination(props: DataPaginationProps): ReactElement {
  const {
    total,
    limitOptions = DEFAULT_LIMIT_OPTIONS,
    summary,
    rowsPerPageLabel,
    pageIndicator,
    firstPageLabel = 'First page',
    previousPageLabel = 'Previous page',
    nextPageLabel = 'Next page',
    lastPageLabel = 'Last page',
    className,
  } = props

  const {
    page,
    limit,
    totalPages,
    setPage,
    setLimit,
    canPrevious,
    canNext,
  } = useDataPaginationState(props)

  const state: DataPaginationState = { page, limit, total, totalPages }

  return (
    <div
      className={cn('flex items-center justify-between gap-4', className)}
      data-slot="data-pagination"
    >
      {summary
        ? (
            <div
              className="text-sm text-muted-foreground"
              data-slot="data-pagination-summary"
            >
              {summary(state)}
            </div>
          )
        : <div />}
      <div className="flex items-center gap-6">
        {limitOptions.length > 0 && (
          <div className="flex items-center gap-2">
            {rowsPerPageLabel !== undefined && (
              <span className="text-sm whitespace-nowrap">{rowsPerPageLabel}</span>
            )}
            <Select
              value={limit}
              onValueChange={(value, details) => {
                if (value !== null)
                  setLimit(Number(value), createChangeEventDetails('item-press', details.event))
              }}
            >
              <SelectTrigger
                aria-label={rowsPerPageLabel ?? 'Rows per page'}
                className="inline-20"
                data-slot="data-pagination-limit"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {limitOptions.map(size => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        <span
          className="text-sm whitespace-nowrap tabular-nums"
          data-slot="data-pagination-indicator"
        >
          {pageIndicator ? pageIndicator(state) : `${page} / ${totalPages}`}
        </span>

        <Pagination className="mx-0 inline-auto">
          <PaginationContent className="gap-1.5">
            <PaginationItem>
              <Button
                aria-label={firstPageLabel}
                disabled={!canPrevious}
                onClick={event => setPage(1, createChangeEventDetails('item-press', event.nativeEvent))}
                size="icon"
                variant="outline"
              >
                <IconChevronsLeft />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                aria-label={previousPageLabel}
                disabled={!canPrevious}
                onClick={event => setPage(current => current - 1, createChangeEventDetails('item-press', event.nativeEvent))}
                size="icon"
                variant="outline"
              >
                <IconChevronLeft />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                aria-label={nextPageLabel}
                disabled={!canNext}
                onClick={event => setPage(current => current + 1, createChangeEventDetails('item-press', event.nativeEvent))}
                size="icon"
                variant="outline"
              >
                <IconChevronRight />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                aria-label={lastPageLabel}
                disabled={!canNext}
                onClick={event => setPage(totalPages, createChangeEventDetails('item-press', event.nativeEvent))}
                size="icon"
                variant="outline"
              >
                <IconChevronsRight />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
