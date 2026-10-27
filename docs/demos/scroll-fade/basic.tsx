import type { ReactElement } from 'react'
import { ScrollFade } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// A plain scrolling element: each edge with more to scroll fades, and the rows
// nearing it shrink and blur. The rows are found because they sit in a <ul>.
// The native scrollbar lives inside the scrolling element and would fade with
// it, so it is hidden here — ScrollArea's `fade` keeps a visible one
export default function BasicDemo(): ReactElement {
  return (
    <ScrollFade className="no-scrollbar rounded-xl border block-64 inline-72">
      <ul className="flex flex-col gap-1 p-4 text-sm">
        {PEOPLE.slice(0, 40).map(person => (
          <li className="flex justify-between gap-4" key={person.id}>
            <span>{person.name}</span>
            <span className="text-muted-foreground">{person.role}</span>
          </li>
        ))}
      </ul>
    </ScrollFade>
  )
}
