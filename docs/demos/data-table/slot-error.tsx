import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  DataTable,
  DataTableEmpty,
  DataTableError,
  DataTableRetry,
} from '@gedatou/cadenza-ui'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { personColumns } from './columns'

// The first load always fails; DataTableRetry wires itself to the base's
// onRetry, and clicking retry recovers
export default function ErrorSlotDemo(): ReactElement {
  const list = useFakeInfiniteList(undefined, { failFirst: true })

  return (
    <DataTable<Person>
      aria-label="Composers (first load fails)"
      columns={personColumns}
      maxHeight={320}
      {...list}
    >
      <DataTableEmpty>No data</DataTableEmpty>
      <DataTableError>
        Failed to load
        <DataTableRetry>Retry</DataTableRetry>
      </DataTableError>
    </DataTable>
  )
}
