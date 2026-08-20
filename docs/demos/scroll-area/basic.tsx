import type { ReactElement } from 'react'
import { ScrollArea } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// Vertical by default; scrollbars appear only on hover / while
// scrolling (scrollbars="hover" is the default)
export default function BasicDemo(): ReactElement {
  return (
    <ScrollArea className="rounded-xl border block-64 inline-72">
      <ul className="flex flex-col gap-1 p-4 text-sm">
        {PEOPLE.slice(0, 40).map(person => (
          <li className="flex justify-between gap-4" key={person.id}>
            <span>{person.name}</span>
            <span className="text-muted-foreground">{person.role}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
