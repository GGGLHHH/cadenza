import type { ReactElement } from 'react'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@gedatou/cadenza-ui'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useState } from 'react'

// AlertDialogMedia 是标题上方(宽屏时是左侧)的图标格。它一出现,页眉的 grid
// 就换了形状 —— 所以它是个部件,不是自己嵌一个 <div> 就能等价的东西。
// 图标不用写尺寸:裸 svg 会被自动收成 size-6。
export default function MediaDemo(): ReactElement {
  const [revoked, setRevoked] = useState(false)

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        API 密钥:
        {revoked ? '已吊销' : 'sk-live-••••4f2a'}
      </p>

      <AlertDialog>
        <AlertDialogTrigger disabled={revoked} render={<Button variant="outline" />}>
          吊销密钥
        </AlertDialogTrigger>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconAlertTriangle />
            </AlertDialogMedia>
            <AlertDialogTitle>立即吊销这个密钥?</AlertDialogTitle>
            <AlertDialogDescription>
              正在用它调用接口的服务会在几秒内全部收到 401,需要换上新密钥才能恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>再想想</AlertDialogClose>
            <AlertDialogClose
              onClick={() => setRevoked(true)}
              render={<Button variant="destructive" />}
            >
              吊销
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}
