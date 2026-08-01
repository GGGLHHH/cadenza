import type { ReactElement } from 'react'
import { Spinner } from '@gedatou/cadenza-ui'

// 尺寸和颜色都从 className 来;默认 size-4、继承文字色
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
      <Spinner className="block-6 inline-6" />
      <Spinner className="text-primary block-8 inline-8" />
    </div>
  )
}
