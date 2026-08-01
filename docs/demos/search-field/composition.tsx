import type { ReactElement } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  SearchField,
  SearchFieldClearButton,
  SearchFieldInput,
} from '@gedatou/cadenza-ui'
import { IconSearch } from '@tabler/icons-react'

// 组合式:传了 children 就完全接管内部结构。
// 这里在尾部加了一个快捷键提示,清除按钮出现时它让位
export default function CompositionDemo(): ReactElement {
  return (
    <div className="inline-full max-inline-sm">
      <SearchField aria-label="搜索文档">
        <InputGroup>
          <InputGroupAddon>
            <IconSearch aria-hidden />
          </InputGroupAddon>
          <SearchFieldInput placeholder="搜索文档..." />
          <SearchFieldClearButton />
          <kbd className="
            order-last me-2 hidden rounded-sm border bg-muted px-1.5 font-mono
            text-[10px] text-muted-foreground
            group-data-empty/search-field:inline
          "
          >
            ⌘K
          </kbd>
        </InputGroup>
      </SearchField>
    </div>
  )
}
