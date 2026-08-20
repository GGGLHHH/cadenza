import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  Button,
  DataTable,
  DataTableColumnsEmpty,
  DataTableColumnsSelect,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

// With no column locked, the user can hide every column — rows then have
// no cells to render and the table falls back to its status area. The
// message and the recovery action come in through the DataTableColumnsEmpty
// slot (the base stays copy-free, per house rules).
const allIds = personColumns.map(column => column.id)
const items = PEOPLE.slice(0, 4)

export default function ColumnsEmptyDemo(): ReactElement {
  const [visible, setVisible] = useState<string[]>(allIds)

  return (
    <div className="flex flex-col gap-3 inline-full">
      <DataTableColumnsSelect
        aria-label="Show columns"
        className="inline-56"
        columns={personColumns}
        placeholder="No visible columns"
        value={visible}
        onValueChange={setVisible}
      />
      <DataTable<Person>
        aria-label="Composers (clearable columns)"
        columns={personColumns.filter(column => visible.includes(column.id))}
        items={items}
      >
        <DataTableColumnsEmpty className="flex flex-col items-center gap-2">
          All columns are hidden
          <Button size="sm" variant="outline" onClick={() => setVisible(allIds)}>
            Show all columns
          </Button>
        </DataTableColumnsEmpty>
      </DataTable>
    </div>
  )
}
