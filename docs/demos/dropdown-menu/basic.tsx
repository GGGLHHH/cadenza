import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'

// 基础组合:分组 + 组标题 + 分隔线。GroupLabel 是组的标题,不是控件的标签。
export default function BasicDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        我的账户
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>账户</DropdownMenuGroupLabel>
          <DropdownMenuItem>个人资料</DropdownMenuItem>
          <DropdownMenuItem>账单</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>团队</DropdownMenuItem>
          <DropdownMenuItem>订阅</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
