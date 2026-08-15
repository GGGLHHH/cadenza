import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuPopup,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'

// 勾选项:点击就地翻转,菜单保持打开——设置菜单经得起自己的开关。
export default function CheckboxesDemo(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        视图
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        {/* GroupLabel 必须在 Group(或 RadioGroup)内——Base UI 靠组的 context 接 aria-labelledby */}
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>外观</DropdownMenuGroupLabel>
          <DropdownMenuCheckboxItem defaultChecked>显示行号</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem defaultChecked>自动换行</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>显示缩进参考线</DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
