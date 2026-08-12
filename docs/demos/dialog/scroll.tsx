import type { ReactElement } from 'react'
import {
  Button,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@gedatou/cadenza-ui'
import { PEOPLE } from '../lib/people'

// 外滚:内容比屏幕高时,整个对话框(连页眉页脚)在遮罩上一起滚。
// 不用写任何 overflow —— DialogPopup 自带的 Dialog.Viewport 就是那个滚动容器。
//
// 项数取 80 而不是"看起来够多"的二三十:demo 不该赌读者的屏幕高度,再高的屏也得装不下,
// 否则这一页演示的就是个普通对话框。序号是给 macOS 用的 —— 那里的覆盖式滚动条平时
// 隐藏、滚动时才浮现,没有序号就很难确认自己到底滚没滚。
const ROSTER = PEOPLE.slice(0, 80)

export default function ScrollDemo(): ReactElement {
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
            人,页眉页脚跟着一起滚 —— 滚到底才看得到「关闭」。
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>关闭</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
