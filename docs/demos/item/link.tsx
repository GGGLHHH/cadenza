import type { ReactElement } from 'react'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@gedatou/cadenza-ui'
import { IconChevronRight, IconHome } from '@tabler/icons-react'

// render={<a />} makes the whole row an anchor; hover and focus-visible
// styling follow because the classes land on the rendered element.
export default function LinkDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-md">
      <Item variant="outline" render={<a href="#" />}>
        <ItemMedia variant="icon">
          <IconHome />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Dashboard</ItemTitle>
          <ItemDescription>Overview of your account and activity.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <IconChevronRight className="text-muted-foreground block-4 inline-4" />
        </ItemActions>
      </Item>
    </div>
  )
}
