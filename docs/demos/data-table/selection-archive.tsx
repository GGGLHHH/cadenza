import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataPagination, DataTable } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { usePersonPage } from '../lib/use-person-page'
import { personColumns } from './columns'
import { tableSlots } from './slots'

// Cross-page archive: the selection set lives outside paging state. The
// ids are the authoritative full set; cross-page objects in items come
// from the component's cache.
export default function ArchiveDemo(): ReactElement {
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<Person[]>([])
  const { items, total, ...listState } = usePersonPage(page, 5)

  return (
    <div className="flex flex-col gap-3">
      <DataTable<Person>
        aria-label="Composers (cross-page archive)"
        columns={personColumns}
        items={items}
        selectionColumn
        selectionMode="multiple"
        value={selectedIds}
        onValueChange={(nextItems, nextIds) => {
          setSelectedIds(nextIds)
          setSelectedItems(nextItems)
        }}
        {...listState}
      >
        {tableSlots}
      </DataTable>
      <DataPagination
        limit={5}
        page={page}
        limitOptions={[]}
        summary={({ total: totalCount }) => `${totalCount} rows in total`}
        total={total}
        onPageChange={setPage}
      />
      <p className="text-sm text-muted-foreground">
        {selectedIds.length}
        {' '}
        selected
        {selectedItems.length > 0 && `: ${selectedItems.map(person => person.name).join(', ')}`}
      </p>
    </div>
  )
}
