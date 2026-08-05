import type { ReactElement } from 'react'
import { LoadingOverlay, Spinner } from '@gedatou/cadenza-ui'

// children 完全替换默认内容 —— 自带文案时记得让 Spinner 装饰化(aria-hidden),
// 由文字承担语义
export default function CustomDemo(): ReactElement {
  return (
    <div className="
      relative overflow-hidden rounded-xl border p-4 inline-full max-inline-sm
    "
    >
      <p className="text-sm text-muted-foreground">这一段内容正在刷新。</p>
      <p className="mbs-1 text-sm text-muted-foreground">磨砂层下还能隐约看到它。</p>
      <LoadingOverlay loading>
        <span className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Spinner aria-hidden />
          正在加载数据…
        </span>
      </LoadingOverlay>
    </div>
  )
}
