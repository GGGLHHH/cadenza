import type { ReactElement } from 'react'
import { DataPagination } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'

// Controlled: page / limit are lifted out of the component, and the data
// slice follows the state -- this is exactly the shape used when composing
// with DataTable (see the "Pagination" section on the DataTable page)
export default function ControlledDemo(): ReactElement {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const pageItems = PEOPLE.slice((page - 1) * limit, page * limit)

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-1 text-sm">
        {pageItems.map(person => (
          <li className="flex justify-between gap-4" key={person.id}>
            <span>{person.name}</span>
            <span className="text-muted-foreground">{person.role}</span>
          </li>
        ))}
      </ul>
      <DataPagination
        limit={limit}
        limitOptions={[5, 10, 20]}
        page={page}
        rowsPerPageLabel="Per page"
        summary={({ total }) => `${total} items`}
        total={PEOPLE.length}
        onLimitChange={(next) => {
          setLimit(next)
          setPage(1)
        }}
        onPageChange={setPage}
      />
    </div>
  )
}
