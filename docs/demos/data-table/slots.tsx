import type { ReactNode } from 'react'
import {
  DataTableEmpty,
  DataTableError,
  DataTableRetry,
} from '@gedatou/cadenza-ui'

// Status slots: copy (including i18n) is injected by the app layer;
// the base ships zero copy.
export const tableSlots: ReactNode = (
  <>
    <DataTableEmpty>No data</DataTableEmpty>
    <DataTableError>
      Failed to load
      <DataTableRetry>Retry</DataTableRetry>
    </DataTableError>
  </>
)
