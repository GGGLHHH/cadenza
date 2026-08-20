import type { DataTableColumn } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

const BLURBS = [
  'Renowned for counterpoint.',
  'Late works famed for grand structures and intense emotion; deeply '
  + 'influential on later symphonists and still core concert repertoire.',
  'Focused on chamber music and art songs, with a delicate touch.',
  'Equally devoted to opera and sacred music, with a strong gift for '
  + 'melody; celebrated in his lifetime, with works long staged across '
  + 'Europe. Turned to teaching in later years, with many students.',
  'A leading nationalist composer, skilled with folk melodies.',
]

interface PersonWithBio extends Person {
  bio: string
}

const people: PersonWithBio[] = PEOPLE.map((person, index) => ({
  ...person,
  bio: BLURBS[index % BLURBS.length],
}))

const columns: DataTableColumn<PersonWithBio>[] = [
  { id: 'name', header: 'Name', cell: person => person.name, rowHeader: true, width: 140 },
  // Cells are nowrap by default; columns that need wrapping opt in
  { id: 'bio', header: 'Bio', cell: person => person.bio, className: 'whitespace-normal' },
]

// Row height follows content: rowHeight becomes an estimate, corrected
// by measurement after render
export default function DynamicRowHeightDemo(): ReactElement {
  return (
    <DataTable<PersonWithBio>
      aria-label="Composers (dynamic row height)"
      columns={columns}
      dynamicRowHeight
      items={people}
      maxHeight={400}
      virtualized
    />
  )
}
