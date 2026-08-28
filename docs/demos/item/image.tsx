import type { ReactElement } from 'react'
import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@gedatou/cadenza-ui'
import { IconDots } from '@tabler/icons-react'

// An inline SVG stands in for a real cover so the demo needs no network.
const COVER = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#3f3f46"/><g stroke="#a1a1aa" stroke-width="2">${[20, 30, 40, 50, 60].map(y => `<line x1="8" y1="${y}" x2="72" y2="${y}"/>`).join('')}</g><circle cx="28" cy="40" r="6" fill="#fafafa"/><circle cx="52" cy="30" r="6" fill="#fafafa"/></svg>`,
)}`

// ItemMedia variant="image" crops the img to a rounded 40px tile (32 at
// size="sm", 24 at "xs") with object-cover.
export default function ImageDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-md">
      <Item variant="outline">
        <ItemMedia variant="image">
          <img alt="Two notes on a stave" src={COVER} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Nocturne in E-flat</ItemTitle>
          <ItemDescription>Chopin · Op. 9 No. 2</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            <IconDots />
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}
