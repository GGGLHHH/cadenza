import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataPagination, DataTable } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { usePersonPage } from '../lib/use-person-page'
import { personColumns } from './columns'
import { tableSlots } from './slots'

export default function PaginationDemo(): ReactElement {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const { items, total, ...listState } = usePersonPage(page, limit)

  return (
    <div className="flex flex-col gap-3">
      <DataTable<Person>
        aria-label="作曲家(分页)"
        columns={personColumns}
        items={items}
        {...listState}
      >
        {tableSlots}
      </DataTable>
      <DataPagination
        limit={limit}
        limitOptions={[10, 20, 50]}
        page={page}
        rowsPerPageLabel="每页"
        summary={({ total: totalCount }) => `共 ${totalCount} 条`}
        total={total}
        onLimitChange={(next) => {
          setLimit(next)
          setPage(1)
        }}
        onPageChange={setPage}
      />
    </div>
  )
}
