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
import { IconShieldCheck } from '@tabler/icons-react'

// ItemMedia variant="icon" sizes a bare svg to size-4; an svg with its own
// size-* class is left alone.
export default function IconDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-md">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <IconShieldCheck />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Two-factor authentication</ItemTitle>
          <ItemDescription>Add an extra layer of security to your account.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Enable
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}
