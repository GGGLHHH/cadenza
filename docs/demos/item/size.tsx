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
import { IconBell } from '@tabler/icons-react'

// Three densities: default, sm and xs. xs also drops the content gap and
// shrinks the description text.
export default function SizeDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-md">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <IconBell />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Default size</ItemTitle>
          <ItemDescription>Roomy padding for standalone rows.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Action
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          <IconBell />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Small</ItemTitle>
          <ItemDescription>Tighter group gap when stacked.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Action
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline" size="xs">
        <ItemMedia variant="icon">
          <IconBell />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Extra small</ItemTitle>
          <ItemDescription>Dense enough for a menu row.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="xs">
            Action
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}
