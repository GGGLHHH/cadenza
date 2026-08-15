import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'
import { IconCopy, IconPencil, IconShare, IconStar } from '@tabler/icons-react'

// 图标直接写进 item——item 的样式已为前置 svg 排好尺寸与间距。
export default function IconsDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        操作
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuItem>
          <IconPencil />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconCopy />
          复制副本
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconStar />
          收藏
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <IconShare />
          分享
        </DropdownMenuItem>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
