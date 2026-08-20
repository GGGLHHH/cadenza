import type { InfiniteSelectAdapterProps } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectRetry,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { DemoButton } from '../lib/demo-button'
import { getOption } from '../lib/people'

// Static empty adapter: InfiniteSelectEmpty renders itself when the list is
// empty (and neither loading nor in error)
const emptyList: InfiniteSelectAdapterProps<Person> = {
  items: [],
  isLoading: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  isError: false,
  onLoadMore: () => {},
  onRetry: () => {},
}

export default function EmptySlotDemo(): ReactElement {
  const state = useInfiniteComboboxState()

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={emptyList}
      searchPlaceholder="Search composers…"
      state={state}
    >
      <DemoButton>Empty data source</DemoButton>
      <InfiniteSelectEmpty>No matching results</InfiniteSelectEmpty>
      <InfiniteSelectError>
        Failed to load
        <InfiniteSelectRetry>Retry</InfiniteSelectRetry>
      </InfiniteSelectError>
    </InfiniteCombobox>
  )
}
