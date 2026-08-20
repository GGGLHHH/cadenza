import type { InfiniteSelectAdapterProps } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  InfiniteCombobox,
  InfiniteSelectLoadingOverlay,
  Spinner,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { DemoButton } from '../lib/demo-button'
import { getOption, PEOPLE } from '../lib/people'

// Slotted customisation: marker parts sit in the slots channel, render
// nothing in place, and List hoists them into the list shell. The adapter is
// pinned to the "results still present + isLoading" refresh state, so
// opening shows the custom frosted overlay
const refreshingList: InfiniteSelectAdapterProps<Person> = {
  items: PEOPLE.slice(0, 4),
  isLoading: true,
  isFetchingNextPage: false,
  hasNextPage: false,
  isError: false,
  onLoadMore: () => {},
  onRetry: () => {},
}

export default function LoadingCustomDemo(): ReactElement {
  const state = useInfiniteComboboxState()

  return (
    <InfiniteCombobox<Person>
      getOption={getOption}
      list={refreshingList}
      searchPlaceholder="Search composers…"
      state={state}
    >
      <DemoButton>Open for the custom overlay</DemoButton>
      <InfiniteSelectLoadingOverlay className="backdrop-blur-xs">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner aria-hidden />
          Syncing concert data…
        </span>
      </InfiniteSelectLoadingOverlay>
    </InfiniteCombobox>
  )
}
