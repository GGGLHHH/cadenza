import type { ReactElement } from 'react'
import { ScrollArea } from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// scroll-fade-y 挂在视口上:未滚到的边缘渐隐,滚到头自动消失。
// 滚动条是视口的兄弟节点,不会被 mask 一起压暗 —— 这正是 ScrollArea
// 存在的理由(原生滚动条长在滚动元素里,躲不开 mask)
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
