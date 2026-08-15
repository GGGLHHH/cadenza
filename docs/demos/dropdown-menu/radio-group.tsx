'use client'

import type { ReactElement } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuGroupLabel,
  DropdownMenuPopup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 单选组:受控三件套 value / onValueChange,同组互斥,触发器回显当前选择。
export default function RadioGroupDemo(): ReactElement {
  const [sort, setSort] = useState('name')
  const labels: Record<string, string> = { name: '按名称', date: '按日期', size: '按大小' }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {`排序:${labels[sort]}`}
      </DropdownMenuTrigger>
      <DropdownMenuPopup>
        {/* RadioGroup 本身就是组,GroupLabel 写在其内即成为组的标题 */}
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuGroupLabel>排序方式</DropdownMenuGroupLabel>
          <DropdownMenuRadioItem value="name">按名称</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">按日期</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="size">按大小</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuPopup>
    </DropdownMenu>
  )
}
