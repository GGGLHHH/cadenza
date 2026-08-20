import type { ReactElement } from 'react'
import { ScrollArea } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// orientation="horizontal" renders only the horizontal scrollbar;
// the content stretches out via inline-max
export default function HorizontalDemo(): ReactElement {
  return (
    <ScrollArea className="rounded-xl border inline-96" orientation="horizontal">
      <div className="flex gap-3 p-4 inline-max">
        {PEOPLE.slice(0, 12).map(person => (
          <figure
            className="
              flex shrink-0 flex-col items-center justify-center gap-1
              rounded-lg bg-muted/50 text-sm block-24 inline-32
            "
            key={person.id}
          >
            <span>{person.name}</span>
            <figcaption className="text-xs text-muted-foreground">
              {person.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </ScrollArea>
  )
}
