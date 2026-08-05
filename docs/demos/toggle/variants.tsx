import type { ReactElement } from 'react'
import { Toggle } from '@gedatou/cadenza-ui'

// variant / size 是 shadcn 的 cva 旋钮,Base UI 的 Toggle 上没有这两个 prop。
// 每行第二颗默认按下,好看清 aria-pressed 画出来的底色
export default function VariantsDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Toggle size="sm">sm</Toggle>
        <Toggle defaultPressed>default</Toggle>
        <Toggle size="lg">lg</Toggle>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Toggle size="sm" variant="outline">sm</Toggle>
        <Toggle defaultPressed variant="outline">default</Toggle>
        <Toggle size="lg" variant="outline">lg</Toggle>
      </div>
    </div>
  )
}
