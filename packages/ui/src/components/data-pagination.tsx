'use client'

import type { ReactElement, ReactNode } from 'react'
import { cn } from '@gedatou/cadenza-ui/lib/utils'
import { Button } from '@gedatou/cadenza-ui/primitives/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@gedatou/cadenza-ui/primitives/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui/primitives/select'
import { useControllableState } from '@gedatou/cadenza-utils'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'
import { useEffect } from 'react'

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

export interface DataPaginationProps {
  /** Total row count across all pages. `0` reads as "not loaded yet" — the clamp effect leaves `page` alone. */
  total: number
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  limit?: number
  defaultLimit?: number
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
  showLimitChanger?: boolean
  /** Start-side summary (e.g. "共 N 条"). Omitted: the slot collapses. */
  summary?: (state: DataPaginationState) => ReactNode
  /** Visible label before the limit select. Omitted: no text renders. */
  rowsPerPageLabel?: ReactNode
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
    showLimitChanger = true,
    summary,
    rowsPerPageLabel,
    pageIndicator,
    firstPageLabel = 'First page',
    previousPageLabel = 'Previous page',
    nextPageLabel = 'Next page',
    lastPageLabel = 'Last page',
    className,
  } = props

  const [page, setPage] = useControllableState({
    value: props.page,
    defaultValue: props.defaultPage,
    onChange: props.onPageChange,
    fallback: 1,
  })
  const [limit, setLimit] = useControllableState({
    value: props.limit,
    defaultValue: props.defaultLimit,
    onChange: props.onLimitChange,
    fallback: 20,
  })

  // Guard against limit=0/NaN (e.g. parsed from an untrusted URL param):
  // unguarded division yields "page 1 / Infinity" and dead NaN buttons.
  const totalPages = Number.isFinite(limit) && limit > 0
    ? Math.max(1, Math.ceil(total / limit))
    : 1
  const canPrevious = page > 1
  const canNext = page < totalPages

  // Clamp only when data is known to exist and `page` overshoots. total=0 means
  // "not loaded yet" (react-query swaps data to undefined mid-flight) — walking
  // `page` back then would flash a stale page into a URL-synced caller.
  useEffect(() => {
    if (total > 0 && page > totalPages)
      setPage(totalPages)
  }, [total, totalPages, page, setPage])

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
        {showLimitChanger && (
          <div className="flex items-center gap-2">
            {rowsPerPageLabel !== undefined && (
              <span className="text-sm whitespace-nowrap">{rowsPerPageLabel}</span>
            )}
            <Select
              aria-label={typeof rowsPerPageLabel === 'string' ? rowsPerPageLabel : 'Rows per page'}
              data-slot="data-pagination-limit"
              value={limit}
              onChange={(key) => {
                if (key !== null)
                  setLimit(Number(key))
              }}
            >
              <SelectTrigger className="inline-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {limitOptions.map(size => (
                  <SelectItem id={size} key={size} textValue={String(size)}>
                    {size}
                  </SelectItem>
                ))}
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
                isDisabled={!canPrevious}
                onPress={() => setPage(1)}
                size="icon"
                variant="outline"
              >
                <IconChevronsLeft />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                aria-label={previousPageLabel}
                isDisabled={!canPrevious}
                onPress={() => setPage(current => current - 1)}
                size="icon"
                variant="outline"
              >
                <IconChevronLeft />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                aria-label={nextPageLabel}
                isDisabled={!canNext}
                onPress={() => setPage(current => current + 1)}
                size="icon"
                variant="outline"
              >
                <IconChevronRight />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                aria-label={lastPageLabel}
                isDisabled={!canNext}
                onPress={() => setPage(totalPages)}
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
