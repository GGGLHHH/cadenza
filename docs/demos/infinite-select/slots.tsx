import type { ReactNode } from 'react'
import {
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectRetry,
} from '@gedatou/cadenza-ui'

// State slots: copy (i18n included) is injected by the app layer; the base
// ships zero copy.
export const selectSlots: ReactNode = (
  <>
    <InfiniteSelectEmpty>No matching results</InfiniteSelectEmpty>
    <InfiniteSelectError>
      Failed to load
      <InfiniteSelectRetry>Retry</InfiniteSelectRetry>
    </InfiniteSelectError>
  </>
)
