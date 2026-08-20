import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable, DataTableColumnsSelect } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

// The columns select neither hides columns nor reorders them itself — it
// only reports "which ids are visible" and "the new id order"; filtering
// and ordering are one line each on the caller's side. Keeping this in the
// open is deliberate: the same control can therefore drive tables whose
// state lives elsewhere (TanStack Table's columnVisibility / columnOrder,
// URL params).
const allColumns: DataTableColumn<Person>[] = [
  // The row-header column is locked: screen readers announce rows by it,
  // so hiding it would leave the whole table nameless.
  { ...personColumns[0], hideable: false },
  ...personColumns.slice(1),
]

const items = PEOPLE.slice(0, 6)

export default function ColumnsSelectDemo(): ReactElement {
  const [order, setOrder] = useState<string[]>(allColumns.map(column => column.id))
  const [visible, setVisible] = useState<string[]>(allColumns.map(column => column.id))

  // The order is a list of ids and the column defs follow it — the table
  // only ever renders the columns you hand it.
  const ordered = order.map(id => allColumns.find(column => column.id === id)!)

  return (
    <div className="flex flex-col gap-3 inline-full">
      <DataTableColumnsSelect
        aria-label="Show columns"
        className="inline-56"
        columns={ordered}
        placeholder="All"
        value={visible}
        // Committed, not Change: while dragging, the order lives only
        // inside the select; the table below moves once, on release.
        onOrderCommitted={setOrder}
        onValueChange={setVisible}
      />
      <DataTable<Person>
        aria-label="Composers (columns select)"
        columns={ordered.filter(column => visible.includes(column.id))}
        items={items}
      />
    </div>
  )
}
