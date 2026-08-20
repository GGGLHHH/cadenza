import type { ReactElement } from 'react'
import { ColorPicker, Field, FieldLabel } from '@gedatou/cadenza-ui'

// box-only 控件:可见标签不走 children,走 Field + FieldLabel htmlFor——id 落在
// 触发器按钮上。传了 id,内置的英文 aria fallback 会自动让位,读屏听到的
// 就是这个标签
export default function LabelDemo(): ReactElement {
  return (
    <Field className="max-inline-sm" orientation="horizontal">
      <FieldLabel htmlFor="brand-color">品牌色</FieldLabel>
      <ColorPicker id="brand-color" defaultValue="#16a34a" />
    </Field>
  )
}
