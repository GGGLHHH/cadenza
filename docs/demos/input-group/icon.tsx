import type { ReactElement } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@gedatou/cadenza-ui'
import { IconCheck, IconMail, IconSearch } from '@tabler/icons-react'

// 图标前后缀:align 决定放行首还是行尾,默认 inline-start
export default function IconDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-3 inline-full max-inline-sm">
      <InputGroup>
        <InputGroupAddon>
          <IconSearch aria-hidden />
        </InputGroupAddon>
        <InputGroupInput aria-label="搜索" placeholder="搜索..." />
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <IconMail aria-hidden />
        </InputGroupAddon>
        <InputGroupInput aria-label="邮箱" placeholder="you@example.com" type="email" />
        <InputGroupAddon align="inline-end">
          <IconCheck aria-hidden className="text-emerald-600" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
