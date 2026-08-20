import type { ReactElement } from 'react'
import { Button, Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@gedatou/cadenza-ui'
import { IconChevronDown } from '@tabler/icons-react'

// Minimal composition: trigger + panel. The expand/collapse height transition
// is a default of the seam layer -- this demo writes zero animation classes.
// The only customisation here is the chevron rotating with data-panel-open
export default function BasicDemo(): ReactElement {
  return (
    <Collapsible className="flex flex-col gap-2 inline-80">
      <CollapsibleTrigger
        className="group/trigger justify-between"
        render={<Button variant="outline" />}
      >
        Can I use this in commercial projects?
        <IconChevronDown className="
          transition-transform
          group-data-panel-open/trigger:rotate-180
        "
        />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <p className="rounded-md border p-4 text-sm text-muted-foreground">
          Yes. Free for personal and commercial projects, no attribution required.
        </p>
      </CollapsiblePanel>
    </Collapsible>
  )
}
