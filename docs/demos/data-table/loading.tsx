import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { personColumns } from './columns'

// Initial load: isLoading with no rows yet — the card keeps a minimum
// height to avoid collapsing; the frosted overlay is the loading visual
// and there is no copy slot
export default function LoadingDemo(): ReactElement {
  return (
    <DataTable<Person> aria-label="Composers (loading)" columns={personColumns} isLoading items={[]} />
  )
}
