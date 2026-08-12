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
  Field,
  FieldLabel,
  Input,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

const INITIAL_NAME = '莫里斯·拉威尔'

// 完整组合:DialogPopup 一个组件就带齐了传送门、遮罩、滚动视口和右上角
// 关闭 ✕ —— 外面只写内容。
//
// 「保存」是一个带副作用的 DialogClose:关闭是它本来就会做的事,onClick 里补上
// 提交。这样不必把 open 提成受控状态 —— 要拦截关闭时才需要,见「关闭方式与拦截」。
// 草稿在打开时重置,所以「取消」和 ✕ 什么都不用做,丢弃是默认结果。
export default function BasicDemo(): ReactElement {
  const [name, setName] = useState(INITIAL_NAME)
  const [draft, setDraft] = useState(INITIAL_NAME)

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        当前显示名:
        <span className="font-medium text-foreground">{name}</span>
      </p>

      <Dialog>
        <DialogTrigger onClick={() => setDraft(name)} render={<Button variant="outline" />}>
          编辑资料
        </DialogTrigger>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>编辑资料</DialogTitle>
            <DialogDescription>改完记得保存,直接关掉不会提交。</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="dialog-basic-name">显示名</FieldLabel>
            <Input id="dialog-basic-name" onValueChange={setDraft} value={draft} />
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
            <DialogClose onClick={() => setName(draft)} render={<Button />}>
              保存
            </DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
