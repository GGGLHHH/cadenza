import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import {
  Button,
  createDialogHandle,
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

// 一个 handle 把三个触发器接到同一个对话框上 —— 触发器不必是它的子节点,
// 中间也不用一路传 state。每个触发器带自己的 payload,root 的 children
// 写成函数就能收到,于是「当前选中哪一行」根本不用变成组件状态。
const handle = createDialogHandle<Person>()

export default function HandleDemo(): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {PEOPLE.slice(0, 3).map(person => (
        <DialogTrigger
          handle={handle}
          key={person.id}
          payload={person}
          render={<Button variant="outline" />}
        >
          {person.name}
        </DialogTrigger>
      ))}

      <Dialog handle={handle}>
        {({ payload: person }) => (
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>{person?.name}</DialogTitle>
              <DialogDescription>
                {person?.role}
                ，
                {person?.born}
                {' '}
                年生，
                {person?.works}
                {' '}
                部作品。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>关闭</DialogClose>
            </DialogFooter>
          </DialogPopup>
        )}
      </Dialog>
    </div>
  )
}
