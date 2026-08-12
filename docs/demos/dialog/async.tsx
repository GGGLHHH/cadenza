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

// 异步保存:执行按钮**不是** DialogClose —— Close 会在请求刚发出时就关掉框。
// 用普通 Button + 受控 open,请求成功后自己 setOpen(false)。
//
// 保存进行中,cancel() 掉一切关闭意图。Dialog 比 AlertDialog 多两条路要拦:
// 右上角 ✕ 和点遮罩。cancel() 不分 reason,一次全挡住,所以这里不需要
// disablePointerDismissal 或 showCloseButton={false} —— 那些是永久的,
// 而"锁住"只该持续到请求回来。
export default function AsyncDemo(): ReactElement {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(INITIAL_NAME)
  const [draft, setDraft] = useState(INITIAL_NAME)
  const [pending, setPending] = useState(false)

  async function save(): Promise<void> {
    setPending(true)
    await new Promise((resolve) => {
      setTimeout(resolve, 1200)
    })
    setName(draft)
    setPending(false)
    setOpen(false)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        当前显示名:
        <span className="font-medium text-foreground">{name}</span>
      </p>

      <Dialog
        open={open}
        onOpenChange={(next, details) => {
          if (!next && pending) {
            details.cancel()
            return
          }
          if (next) {
            setDraft(name)
          }
          setOpen(next)
        }}
      >
        <DialogTrigger render={<Button variant="outline" />}>编辑资料</DialogTrigger>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>编辑资料</DialogTitle>
            <DialogDescription>
              {pending ? '正在保存 —— ✕、遮罩、Esc 现在都关不掉。' : '保存要 1.2 秒,期间对话框会锁住。'}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="dialog-async-name">显示名</FieldLabel>
            <Input
              disabled={pending}
              id="dialog-async-name"
              onValueChange={setDraft}
              value={draft}
            />
          </Field>
          <DialogFooter>
            <DialogClose disabled={pending} render={<Button variant="outline" />}>
              取消
            </DialogClose>
            <Button
              onClick={() => {
                void save()
              }}
              pending={pending}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
