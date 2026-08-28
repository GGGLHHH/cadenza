import type { ReactElement } from 'react'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@gedatou/cadenza-ui'
import { IconFolderOpen } from '@tabler/icons-react'

// The root already carries border-dashed and rounded-xl; a single `border`
// utility turns it into an outlined drop zone
export default function OutlineDemo(): ReactElement {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderOpen aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No projects</EmptyTitle>
        <EmptyDescription>Create a project to start organising your work.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">Create project</Button>
      </EmptyContent>
    </Empty>
  )
}
