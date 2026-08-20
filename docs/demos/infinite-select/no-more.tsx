import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectEmpty,
  InfiniteSelectLoadingMore,
  InfiniteSelectNoMore,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

// The data source is capped at 48 rows, 16 per page = exactly three pages.
// Scrolling to the bottom shows, in order:
// page 1 → loading → page 2 → loading → page 3 → the end row.
//
// Each page must be taller than the viewport for this to be visible:
// prefetching fires one viewport ahead by default (loadMoreScrollOffset),
// so pages that are too short chain-load before you ever scroll.
const PAGE_SIZE = 16
const TOTAL = PAGE_SIZE * 3

function ThreePages({ label, children }: { label: string, children?: ReactElement }): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue, { pageSize: PAGE_SIZE, limit: TOTAL })

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={list}
      searchPlaceholder="Search composers…"
      state={state}
    >
      <DemoButton>{label}</DemoButton>
      <InfiniteSelectEmpty>No matching results</InfiniteSelectEmpty>
      {children}
      <InfiniteSelectLoadingMore>Loading…</InfiniteSelectLoadingMore>
    </InfiniteCombobox>
  )
}

export default function NoMoreDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-start justify-center gap-4">
      {/* Without InfiniteSelectNoMore: after the third page the end row
          remains, rendering the default fading hairline */}
      <ThreePages label="Default: a hairline mark" />
      {/* Composing it = replacing that line with your own copy; the base
          still ships zero copy */}
      <ThreePages label="Custom: your own copy">
        <InfiniteSelectNoMore>No more data</InfiniteSelectNoMore>
      </ThreePages>
    </div>
  )
}
