import type { ReactElement } from 'react'
import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@gedatou/cadenza-ui'
import { IconMusic } from '@tabler/icons-react'

const PIECES = [
  { title: 'Prelude in C', description: 'Bach · BWV 846' },
  { title: 'Clair de lune', description: 'Debussy · Suite bergamasque' },
  { title: 'Gymnopédie No. 1', description: 'Satie' },
]

// ItemGroup is role="list" and stacks rows; ItemSeparator rules between them.
// Rows get render={<li />} so the list semantics are complete.
export default function GroupDemo(): ReactElement {
  return (
    <ItemGroup className="max-inline-md">
      {PIECES.map((piece, index) => (
        <div key={piece.title} className="contents">
          {index > 0 && <ItemSeparator />}
          <Item render={<li />}>
            <ItemMedia variant="icon">
              <IconMusic />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{piece.title}</ItemTitle>
              <ItemDescription>{piece.description}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="outline" size="sm">
                Play
              </Button>
            </ItemActions>
          </Item>
        </div>
      ))}
    </ItemGroup>
  )
}
