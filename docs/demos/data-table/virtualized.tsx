import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { TOTAL } from '../lib/people'
import { useFakeInfiniteList } from '../lib/use-fake-infinite-list'
import { personColumns } from './columns'
import { tableSlots } from './slots'

// Pulls all 10000 rows at once, no paging — a pure rendering stress test:
// virtualization keeps the DOM at a few dozen nodes
export default function VirtualizedDemo(): ReactElement {
  const list = useFakeInfiniteList(undefined, { pageSize: TOTAL })

  return (
    <DataTable<Person>
      aria-label="Composers (virtualized)"
      columns={personColumns}
      maxHeight={400}
      virtualized
      {...list}
    >
      {tableSlots}
    </DataTable>
  )
}
