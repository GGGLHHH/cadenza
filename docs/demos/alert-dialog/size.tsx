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

// size="sm":窄一档,页眉始终居中,页脚排成等宽两列。
// 用在两个选项分量相当、没有明显"默认项"的场合 —— 等宽正是在说"你自己选"。
export default function SizeDemo(): ReactElement {
  const [choice, setChoice] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        上次选择:
        {choice ?? '还没选'}
      </p>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline" />}>离开编辑器</AlertDialogTrigger>
        <AlertDialogPopup size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>还有未保存的改动</AlertDialogTitle>
            <AlertDialogDescription>离开前要先保存吗?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              onClick={() => setChoice('直接离开')}
              render={<Button variant="outline" />}
            >
              直接离开
            </AlertDialogClose>
            <AlertDialogClose onClick={() => setChoice('保存并离开')} render={<Button />}>
              保存并离开
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}
