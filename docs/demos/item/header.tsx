import type { ReactElement } from 'react'
import { Badge, Item, ItemContent, ItemDescription, ItemHeader, ItemTitle } from '@gedatou/cadenza-ui'

// An inline SVG banner stands in for a real image so the demo needs no network.
const BANNER = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 96"><rect width="320" height="96" fill="#27272a"/><path d="M0 72 Q80 24 160 60 T320 40 V96 H0Z" fill="#52525b"/></svg>',
)}`

// ItemHeader takes the full row width (basis-full) above the content, so a
// banner and a badge sit on their own line and the content wraps below.
export default function HeaderDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-md">
      <Item variant="outline">
        <ItemHeader>
          <img
            alt="Rolling hills"
            src={BANNER}
            className="rounded-sm inline-full"
          />
        </ItemHeader>
        <ItemContent>
          <ItemTitle>
            Summer recital
            <Badge variant="secondary">Draft</Badge>
          </ItemTitle>
          <ItemDescription>Programme notes and running order for the July concert.</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  )
}
