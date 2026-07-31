import type { ReactElement } from 'react'
import { ScrollArea } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// 默认纵向;滚动条 hover / 滚动进行中才出现(scrollbars="hover" 是默认值)
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
