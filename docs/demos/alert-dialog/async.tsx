import type { ReactElement } from 'react'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 异步确认的三件事,缺一不可:
//
// 1. 执行按钮**不是** AlertDialogClose —— Close 会在请求刚发出时就把框关掉。
//    用普通 Button,请求成功后自己 setOpen(false)。
// 2. open 受控,否则第 1 条没法关。
// 3. 请求进行中 cancel() 掉所有关闭意图 —— 取消按钮、Esc 都算。不然用户能在
//    请求飞在路上时关掉框,回来看到的是一个说不清做没做成的界面。
export default function AsyncDemo(): ReactElement {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [removed, setRemoved] = useState(0)

  async function remove(): Promise<void> {
    setPending(true)
    await new Promise((resolve) => {
      setTimeout(resolve, 1200)
    })
    setPending(false)
    setOpen(false)
    setRemoved(count => count + 1)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        已删除
        {' '}
        {removed}
        {' '}
        次
      </p>

      <AlertDialog
        open={open}
        onOpenChange={(next, details) => {
          if (!next && pending) {
            details.cancel()
            return
          }
          setOpen(next)
        }}
      >
        <AlertDialogTrigger render={<Button variant="outline" />}>删除账号</AlertDialogTrigger>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这个账号?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending ? '正在删除,请稍候 —— 这期间关不掉。' : '删除要 1.2 秒,期间对话框会锁住。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose disabled={pending} render={<Button variant="outline" />}>
              取消
            </AlertDialogClose>
            <Button
              onClick={() => {
                void remove()
              }}
              pending={pending}
              variant="destructive"
            >
              删除
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}
