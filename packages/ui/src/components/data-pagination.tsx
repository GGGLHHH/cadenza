'use client'

import type { ReactElement, ReactNode, SetStateAction } from 'react'
import type { ChangeEventDetails } from '#lib/change-event-details'
import { AnimateIcon } from '@animate-ui/react/icons'
import { Root as PaginationRoot } from '@animate-ui/react/primitives/pagination'
import { useControllableState } from '@gedatou/cadenza-utils'
import { useCallback, useEffect, useRef } from 'react'
import { createChangeEventDetails } from '#lib/change-event-details'
import { cn } from '#lib/utils'
import { PaginationContent, PaginationItem } from '#primitives/pagination'
import { ChevronLeftIcon } from '../icons/animate-ui/chevron-left'
import { ChevronRightIcon } from '../icons/animate-ui/chevron-right'
import { EllipsisIcon } from '../icons/animate-ui/ellipsis'
import { Button } from './button'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from './select'

/**
 * Offset pagination bar: summary on the start side, controls on the end side.
 * `page` and `limit` are independently controllable (controlled via
 * `page`/`limit`, uncontrolled via `defaultPage`/`defaultLimit`). The bar
 * renders no words of its own — the pages are numbers, everything else comes
 * in through props — so i18n stays in the caller's layer.
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
  /** Text before the page buttons (e.g. "第 3 页,共 13 页"). Omitted: none — the numbers say it. */
  pageIndicator?: (state: DataPaginationState) => ReactNode
  // Accessible names for the icon-only controls. English defaults; pass
  // translations from the business layer.
  previousPageLabel?: string
  nextPageLabel?: string
  className?: string
}

const DEFAULT_LIMIT_OPTIONS = [10, 20, 50, 100]

/**
 * The page buttons: the first and last page always, the current one with a
 * neighbour on each side, and an ellipsis for each gap — MUI's usePagination
 * with one boundary and one sibling. Past 7 pages it is always 7 slots, so the
 * row keeps its width as the page moves and the buttons stay where they are.
 */
function pageSlots(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  const start = Math.min(Math.max(page - 1, 3), totalPages - 4)
  return [
    1,
    start > 3 ? 'ellipsis' : 2,
    start,
    start + 1,
    start + 2,
    start + 2 < totalPages - 2 ? 'ellipsis' : totalPages - 1,
    totalPages,
  ]
}

export function DataPagination(props: DataPaginationProps): ReactElement {
  const {
    total,
    limitOptions = DEFAULT_LIMIT_OPTIONS,
    summary,
    rowsPerPageLabel,
    pageIndicator,
    previousPageLabel = 'Previous page',
    nextPageLabel = 'Next page',
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
              <SelectPopup>
                <SelectGroup>
                  {limitOptions.map(size => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectPopup>
            </Select>
          </div>
        )}

        {pageIndicator && (
          <span
            className="text-sm whitespace-nowrap tabular-nums"
            data-slot="data-pagination-indicator"
          >
            {pageIndicator(state)}
          </span>
        )}

        {/* animate-ui's Root: the current page's outline slides to the page
            pressed. It finds the pages by `data-slot="pagination-link"` and
            the current one by `aria-current="page"`. */}
        <PaginationRoot aria-label="pagination" className="flex">
          <PaginationContent className="gap-1">
            <PaginationItem>
              <AnimateIcon animateOnHover asChild>
                <Button
                  aria-label={previousPageLabel}
                  disabled={!canPrevious}
                  onClick={event => setPage(current => current - 1, createChangeEventDetails('item-press', event.nativeEvent))}
                  size="icon"
                  variant="ghost"
                >
                  <ChevronLeftIcon />
                </Button>
              </AnimateIcon>
            </PaginationItem>
            {/* Keyed by slot, not by page: the 7 buttons stay put and only
                their numbers change, so the outline slides from where it was
                drawn. */}
            {pageSlots(page, totalPages).map((slot, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <PaginationItem key={index}>
                {slot === 'ellipsis'
                  ? (
                      <span
                        aria-hidden
                        className="
                          flex items-center justify-center block-8 inline-8
                          [&>svg]:block-4 [&>svg]:inline-4
                        "
                        data-slot="pagination-ellipsis"
                      >
                        <EllipsisIcon />
                      </span>
                    )
                  : (
                      <Button
                        aria-current={slot === page ? 'page' : undefined}
                        className="tabular-nums"
                        data-slot="pagination-link"
                        // The current page again is no change (Base UI's Tabs on the active tab).
                        onClick={event => slot !== page && setPage(slot, createChangeEventDetails('item-press', event.nativeEvent))}
                        size="icon"
                        variant={slot === page ? 'outline' : 'ghost'}
                      >
                        {slot}
                      </Button>
                    )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <AnimateIcon animateOnHover asChild>
                <Button
                  aria-label={nextPageLabel}
                  disabled={!canNext}
                  onClick={event => setPage(current => current + 1, createChangeEventDetails('item-press', event.nativeEvent))}
                  size="icon"
                  variant="ghost"
                >
                  <ChevronRightIcon />
                </Button>
              </AnimateIcon>
            </PaginationItem>
          </PaginationContent>
        </PaginationRoot>
      </div>
    </div>
  )
}
