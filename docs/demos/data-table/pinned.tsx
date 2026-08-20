import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const ERAS = ['Baroque', 'Classical', 'Romantic', 'Modern']
const LABELS = ['DG', 'Decca', 'EMI', 'Sony Classical', 'Philips']

// Multiple columns pinned on the same side: Name + Role both stick to the
// start, sticky offsets accumulate in array order; the actions column
// pins to the end
const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: 'Name', cell: person => person.name, rowHeader: true, width: 140, pinned: 'start' },
  { id: 'role', header: 'Role', cell: person => person.role, width: 130, pinned: 'start' },
  { id: 'born', header: 'Born', cell: person => person.born, width: 110 },
  { id: 'era', header: 'Era', cell: person => ERAS[person.born % ERAS.length], width: 110 },
  { id: 'active', header: 'Active years', cell: person => `${person.born + 20}–${person.born + 60}`, width: 150 },
  { id: 'label', header: 'Record label', cell: person => LABELS[person.works % LABELS.length], width: 150 },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => <span className="cursor-pointer text-primary">View</span>,
    width: 90,
    pinned: 'end',
  },
]

export default function PinnedDemo(): ReactElement {
  return (
    <DataTable<Person>
      aria-label="Composers (pinned columns)"
      columns={columns}
      items={PEOPLE.slice(0, 6)}
    />
  )
}
