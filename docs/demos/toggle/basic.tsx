import type { ReactElement } from 'react'
import { Toggle } from '@gedatou/cadenza-ui'
import { IconBold, IconItalic } from '@tabler/icons-react'

// 真 <button aria-pressed>:根元素就是那颗按钮,名字直接来自 children,
// 所以没有 Checkbox/Switch 那条 FieldLabel htmlFor 通道。
// 只有图标、没有可见文字时才补 aria-label。
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle aria-label="加粗" defaultPressed><IconBold /></Toggle>
      <Toggle aria-label="斜体"><IconItalic /></Toggle>
      <Toggle variant="outline">
        <IconBold />
        加粗
      </Toggle>
    </div>
  )
}
