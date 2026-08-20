import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectLoadingMore,
  InfiniteSelectRetry,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'

// The first load always fails; InfiniteSelectRetry hooks into the base's
// onRetry automatically, and pressing Retry recovers
export default function ErrorSlotDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue, { failFirst: true })

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={list}
      searchPlaceholder="Search composers…"
      state={state}
    >
      <DemoButton>First load will fail</DemoButton>
      <InfiniteSelectEmpty>No matching results</InfiniteSelectEmpty>
      <InfiniteSelectError>
        Failed to load
        <InfiniteSelectRetry>Retry</InfiniteSelectRetry>
      </InfiniteSelectError>
      <InfiniteSelectLoadingMore>Loading more…</InfiniteSelectLoadingMore>
    </InfiniteCombobox>
  )
}
