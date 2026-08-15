import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'
import { IconTrash } from '@tabler/icons-react'

// variant="destructive" 给不可逆动作:文字、图标、聚焦底色整行转警示色。
export default function DestructiveDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        项目
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuItem>重命名</DropdownMenuItem>
        <DropdownMenuItem>归档</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <IconTrash />
          删除项目
        </DropdownMenuItem>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
