import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  DataTable,
  DataTableLoadingMore,
} from '@gedatou/cadenza-ui'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { personColumns } from './columns'
import { tableSlots } from './slots'

// Infinite scroll accumulates loaded rows without bound, so enable
// virtualization too: the DOM only ever holds the rows in the window
export default function InfiniteDemo(): ReactElement {
  const list = useFakeInfiniteList()

  return (
    <DataTable<Person>
      aria-label="Composers (infinite scroll)"
      columns={personColumns}
      maxHeight={320}
      virtualized
      {...list}
    >
      {tableSlots}
      <DataTableLoadingMore>Loading more…</DataTableLoadingMore>
    </DataTable>
  )
}
