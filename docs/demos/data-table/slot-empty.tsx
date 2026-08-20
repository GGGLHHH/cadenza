import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  DataTable,
  DataTableEmpty,
  DataTableError,
  DataTableRetry,
} from '@gedatou/cadenza-ui'
import { personColumns } from './columns'

// Slots render by state and are mutually exclusive: with items empty
// (and neither loading nor errored), DataTableEmpty shows
export default function EmptySlotDemo(): ReactElement {
  return (
    <DataTable<Person> aria-label="Composers (empty)" columns={personColumns} items={[]}>
      <DataTableEmpty>No data</DataTableEmpty>
      <DataTableError>
        Failed to load
        <DataTableRetry>Retry</DataTableRetry>
      </DataTableError>
    </DataTable>
  )
}
