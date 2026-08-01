import type { ReactElement } from 'react'
import { SearchField } from '@gedatou/cadenza-ui'

// 禁用:整个字段不可编辑,清除按钮也一并失效
export default function DisabledDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-3 inline-full max-inline-sm">
      <SearchField
        aria-label="搜索作曲家(禁用)"
        placeholder="搜索作曲家..."
        defaultValue="Ravel"
        isDisabled
      />
      <SearchField
        aria-label="搜索作曲家(只读)"
        placeholder="搜索作曲家..."
        defaultValue="Ravel"
        isReadOnly
      />
    </div>
  )
}
