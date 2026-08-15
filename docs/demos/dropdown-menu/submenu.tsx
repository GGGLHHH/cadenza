import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuSubmenu,
  DropdownMenuSubmenuPopup,
  DropdownMenuSubmenuTrigger,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'

// 子菜单:Submenu 三件套嵌进 Popup。悬停或 ArrowRight 展开,
// 斜向移入子面板不丢焦点(Base UI 内置 safePolygon,与 Cascader 同款)。
export default function SubmenuDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        文件
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        <DropdownMenuItem>重命名</DropdownMenuItem>
        <DropdownMenuItem>移动到…</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSubmenu>
          <DropdownMenuSubmenuTrigger>导出为</DropdownMenuSubmenuTrigger>
          <DropdownMenuSubmenuPopup>
            <DropdownMenuItem>PDF</DropdownMenuItem>
            <DropdownMenuItem>CSV</DropdownMenuItem>
            <DropdownMenuItem>Markdown</DropdownMenuItem>
          </DropdownMenuSubmenuPopup>
        </DropdownMenuSubmenu>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
