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

// Static loading adapter: during first load the list area renders a
// min-height frosted shell — one unified loading visual, so the copy slots
// are down to just the empty and error states
const loadingList: InfiniteSelectAdapterProps<Person> = {
  items: [],
  isLoading: true,
  isFetchingNextPage: false,
  hasNextPage: false,
  isError: false,
  onLoadMore: () => {},
  onRetry: () => {},
}

export default function LoadingDemo(): ReactElement {
  const state = useInfiniteComboboxState()

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={loadingList}
      searchPlaceholder="Search composers…"
      state={state}
    >
      <DemoButton>Loading forever</DemoButton>
      <InfiniteSelectEmpty>No matching results</InfiniteSelectEmpty>
      <InfiniteSelectError>
        Failed to load
        <InfiniteSelectRetry>Retry</InfiniteSelectRetry>
      </InfiniteSelectError>
    </InfiniteCombobox>
  )
}
