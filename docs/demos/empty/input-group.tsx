import type { ReactElement } from 'react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@gedatou/cadenza-ui'
import { IconSearch } from '@tabler/icons-react'

// EmptyContent takes any control, not just buttons: an InputGroup turns the
// empty state into the place where the next search starts
export default function InputGroupDemo(): ReactElement {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconSearch aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No results</EmptyTitle>
        <EmptyDescription>Nothing matched that query. Try a different keyword.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <InputGroup className="max-inline-xs">
          <InputGroupInput aria-label="Search again" placeholder="Search again..." />
          <InputGroupAddon align="inline-end">
            <InputGroupButton variant="default">Search</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </EmptyContent>
    </Empty>
  )
}
