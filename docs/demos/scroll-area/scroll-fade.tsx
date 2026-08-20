import type { ReactElement } from 'react'
import { ScrollArea } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// scroll-fade-y hangs on the viewport: the edge not yet scrolled to
// fades out, vanishing once you reach the end. The scrollbar is the
// viewport's sibling, so the mask never dims it too -- which is exactly
// ScrollArea's reason to exist (a native scrollbar lives inside the
// scrolling element and cannot dodge the mask)
export default function ScrollFadeDemo(): ReactElement {
  return (
    <ScrollArea
      className="rounded-xl border block-64 inline-72"
      viewportClassName="scroll-fade-y"
    >
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
