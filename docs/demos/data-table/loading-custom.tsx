import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable, DataTableLoadingOverlay, Spinner } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'
import { personColumns } from './columns'

// Slotted customization: the marker part lives in the slot channel and
// does not render in place — the card lifts it into the overlay position.
// children replaces the centered Spinner, className tunes the frost
export default function LoadingCustomDemo(): ReactElement {
  return (
    <DataTable<Person>
      aria-label="Composers (custom loading)"
      columns={personColumns}
      isLoading
      items={PEOPLE.slice(0, 4)}
    >
      <DataTableLoadingOverlay className="backdrop-blur-xs">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner aria-hidden />
          Syncing concert data…
        </span>
      </DataTableLoadingOverlay>
    </DataTable>
  )
}
