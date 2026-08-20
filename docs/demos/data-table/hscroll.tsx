import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const ERAS = ['Baroque', 'Classical', 'Romantic', 'Modern']
const LABELS = ['DG', 'Decca', 'EMI', 'Sony Classical', 'Philips']

// All 7 columns have numeric widths, 990px in total; once that exceeds
// the container, the table scrolls horizontally
const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', cell: person => person.name, rowHeader: true, width: 140 },
  { id: 'role', header: 'Role', cell: person => person.role, width: 130 },
  { id: 'born', header: 'Born', cell: person => person.born, width: 110 },
  { id: 'era', header: 'Era', cell: person => ERAS[person.born % ERAS.length], width: 110 },
  { id: 'active', header: 'Active years', cell: person => `${person.born + 20}–${person.born + 60}`, width: 150 },
  { id: 'label', header: 'Record label', cell: person => LABELS[person.works % LABELS.length], width: 150 },
  { id: 'works', header: 'Works', cell: person => person.works, width: 110 },
]

export default function HScrollDemo(): ReactElement {
  return (
    <DataTable<Person>
      aria-label="Composers (horizontal scroll)"
      columns={columns}
      items={PEOPLE.slice(0, 6)}
    />
  )
}
