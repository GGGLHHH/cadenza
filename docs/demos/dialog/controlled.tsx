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

// 受控 + 拦截关闭。改过内容后,点遮罩或按 Esc 会被 cancel() 顶回去 ——
// 内部状态原地不动,不需要 disablePointerDismissal 再自己补一套判断。
// reason 说明这次关闭从哪来,所以「取消」按钮(close-press)照常放行。
export default function ControlledDemo(): ReactElement {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('莫里斯·拉威尔')
  const [blocked, setBlocked] = useState(false)
  const dirty = name !== '莫里斯·拉威尔'

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next && dirty && details.reason !== 'close-press') {
          details.cancel()
          setBlocked(true)
          return
        }
        setBlocked(false)
        setOpen(next)
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>编辑资料</DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>编辑资料</DialogTitle>
          <DialogDescription>
            {dirty ? '改过了 —— 点遮罩和 Esc 都会被拦住。' : '随便改一个字试试。'}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="dialog-controlled-name">显示名</FieldLabel>
          <Input
            id="dialog-controlled-name"
            value={name}
            onValueChange={setName}
          />
        </Field>
        {blocked && (
          <p className="text-sm text-destructive">有未保存的改动,用下面的按钮离开。</p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>放弃修改</DialogClose>
          <Button onClick={() => setOpen(false)}>保存</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
