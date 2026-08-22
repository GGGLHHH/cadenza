import type { ReactElement } from 'react'
import { Marker, MarkerContent, MarkerIcon } from '@gedatou/cadenza-ui'
import { IconCheck, IconGitBranch } from '@tabler/icons-react'

// border keeps the row left-aligned like default — unlike separator, which
// centres it — and adds an underline to fence off whatever comes next. Use it
// for a status row that introduces the block below it.
export default function BorderDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Marker variant="border">
        <MarkerIcon>
          <IconGitBranch />
        </MarkerIcon>
        <MarkerContent>Programme revised — third draft</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerIcon>
          <IconCheck />
        </MarkerIcon>
        <MarkerContent>Sent to front of house</MarkerContent>
      </Marker>
    </div>
  )
}
