import type { ReactElement } from 'react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@gedatou/cadenza-ui'
import { IconSearch } from '@tabler/icons-react'

// InputGroup 的全貌:图标、输入框、按钮共处同一个边框,焦点环画在整组上 ——
// 聚焦时变的是外面那一圈,而不是输入框自己的边框
export default function BasicDemo(): ReactElement {
  return (
    <InputGroup className="max-inline-sm">
      <InputGroupAddon>
        <IconSearch aria-hidden />
      </InputGroupAddon>
      <InputGroupInput aria-label="搜索作品" placeholder="搜索作品..." />
      <InputGroupAddon align="inline-end">
        <InputGroupButton variant="default">搜索</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
