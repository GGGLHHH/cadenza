import type { ReactElement } from 'react'
import { BellIcon } from '@gedatou/cadenza-icons'
import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@gedatou/cadenza-ui'

// Three densities: default, sm and xs. xs also drops the content gap and
// shrinks the description text.
export default function SizeDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-md">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <BellIcon animateOnHover />
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
          <BellIcon animateOnHover />
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
          <BellIcon animateOnHover />
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
