import type { ReactElement } from 'react'
import { Marker, MarkerContent, MarkerIcon } from '@gedatou/cadenza-ui'
import { IconExternalLink } from '@tabler/icons-react'

// render turns the whole row into a link or a button. The variants already
// style links, so an actionable note needs the right element, not new styles.
export default function InteractiveDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-4 inline-full max-inline-sm">
      <Marker render={<a href="#interactive" />}>
        <MarkerIcon>
          <IconExternalLink />
        </MarkerIcon>
        <MarkerContent>Open the running order</MarkerContent>
      </Marker>
      <Marker render={<button type="button" />} variant="border">
        <MarkerContent>Load 12 earlier messages</MarkerContent>
      </Marker>
    </div>
  )
}
