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

// 两个出口都是 AlertDialogClose,干活的那个把工作放在 onClick 里 ——
// 关闭是它本来就会做的事。没有右上角 ✕:alert dialog 的存在意义就是逼出一个答复,
// 一个不表态的出口与此矛盾。
export default function BasicDemo(): ReactElement {
  const [drafts, setDrafts] = useState(['夜之加斯帕', '水之嬉戏', '悼念公主的帕凡舞曲'])

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        草稿
        {' '}
        {drafts.length}
        {' '}
        份
        {drafts.length > 0 && `:${drafts.join('、')}`}
      </p>

      <AlertDialog>
        <AlertDialogTrigger
          disabled={drafts.length === 0}
          render={<Button variant="outline" />}
        >
          删除最后一份
        </AlertDialogTrigger>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              删除《
              {drafts.at(-1)}
              》?
            </AlertDialogTitle>
            <AlertDialogDescription>
              草稿删除后无法恢复,请确认这不是你还需要的那一份。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>取消</AlertDialogClose>
            <AlertDialogClose
              onClick={() => setDrafts(rest => rest.slice(0, -1))}
              render={<Button variant="destructive" />}
            >
              删除
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}
