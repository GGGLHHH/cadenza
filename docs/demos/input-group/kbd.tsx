import type { ReactElement } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@gedatou/cadenza-ui'
import { IconSearch } from '@tabler/icons-react'

// 快捷键提示:addon 里放 <kbd>,InputGroup 会替它对齐并收掉多余的外边距
export default function KbdDemo(): ReactElement {
  return (
    <div className="inline-full max-inline-sm">
      <InputGroup>
        <InputGroupAddon>
          <IconSearch aria-hidden />
        </InputGroupAddon>
        <InputGroupInput aria-label="搜索文档" placeholder="搜索文档..." />
        <InputGroupAddon align="inline-end">
          <kbd className="
            rounded-sm border bg-muted px-1.5 font-mono text-[10px]
            text-muted-foreground
          "
          >
            ⌘K
          </kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
