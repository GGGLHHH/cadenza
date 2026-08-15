import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSubmenu,
  DropdownMenuSubmenuPopup,
  DropdownMenuSubmenuTrigger,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'
import {
  IconLogout,
  IconMail,
  IconMessage,
  IconSettings,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react'

// 综合:分组 + 图标 + 快捷键 + 子菜单在一个菜单里同场。
export default function ComplexDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        打开菜单
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>我的账户</DropdownMenuGroupLabel>
          <DropdownMenuItem>
            <IconUser />
            个人资料
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconSettings />
            设置
            <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSubmenu>
            <DropdownMenuSubmenuTrigger>
              <IconUserPlus />
              邀请成员
            </DropdownMenuSubmenuTrigger>
            <DropdownMenuSubmenuPopup>
              <DropdownMenuItem>
                <IconMail />
                邮件邀请
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconMessage />
                站内私信
              </DropdownMenuItem>
            </DropdownMenuSubmenuPopup>
          </DropdownMenuSubmenu>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <IconLogout />
          退出登录
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
