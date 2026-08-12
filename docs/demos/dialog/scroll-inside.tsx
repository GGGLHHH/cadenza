import type { ReactElement } from 'react'
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// 内滚:页眉页脚钉住,只有中间滚。写一个 DialogBody 就够 —— 弹层看见它就自己
// 封顶到屏幕高度并改用 flex 布局(:has 规则),不需要任何 prop 或类名。
// 此时 popup 不再超出视口,外滚没东西可滚,自动让路。
//
// 项数同 scroll demo 取 80:少了在高屏上填不满封顶高度,就滚不起来,演示等于没演示。
const ROSTER = PEOPLE.slice(0, 80)

export default function ScrollInsideDemo(): ReactElement {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>查看名单</DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>参演名单</DialogTitle>
          <DialogDescription>
            共
            {ROSTER.length}
            {' '}
            人,页眉页脚不动 ——「关闭」始终在视线里。
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ol className="flex flex-col gap-2">
            {ROSTER.map((person, index) => (
              <li className="flex justify-between gap-4" key={person.id}>
                <span>
                  <span className="text-muted-foreground tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {' '}
                  {person.name}
                </span>
                <span className="text-muted-foreground">{person.role}</span>
              </li>
            ))}
          </ol>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>关闭</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
