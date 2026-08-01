import type { ReactElement } from 'react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@gedatou/cadenza-ui'
import { IconArrowRight, IconCopy } from '@tabler/icons-react'
import { useState } from 'react'

// 尾部按钮:InputGroupButton 底下是 React Aria 的 Button,所以用 onPress。
// size 默认 xs,图标按钮用 icon-xs
export default function ButtonDemo(): ReactElement {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-3 inline-full max-inline-sm">
      <InputGroup>
        <InputGroupInput aria-label="邀请链接" defaultValue="https://cadenza.dev/invite/8f2a" readOnly />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label="复制链接"
            size="icon-xs"
            onPress={() => {
              setCopied(true)
              setTimeout(setCopied, 1500, false)
            }}
          >
            <IconCopy aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="订阅邮箱" placeholder="订阅更新" type="email" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="default">
            订阅
            <IconArrowRight aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {copied ? '已复制到剪贴板' : ' '}
      </p>
    </div>
  )
}
