import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { Button, DataTable } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'

const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', cell: person => person.name, rowHeader: true },
  { id: 'role', header: 'Role', cell: person => person.role },
]

// Refresh with rows present: isLoading while rows are still on screen
// (placeholderData semantics) — old rows frost in place, the header is
// covered too, and no slot appears
export default function RefreshDemo(): ReactElement {
  const [isLoading, setIsLoading] = useState(false)
  return (
    <div className="flex flex-col items-start gap-3 inline-full">
      <DataTable<Person>
        aria-label="Composers"
        columns={columns}
        isLoading={isLoading}
        items={PEOPLE.slice(0, 4)}
      />
      <Button
        size="sm"
        variant="outline"
        pending={isLoading}
        onClick={() => {
          setIsLoading(true)
          setTimeout(setIsLoading, 2000, false)
        }}
      >
        Refresh
      </Button>
    </div>
  )
}
