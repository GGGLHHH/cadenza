import type { ReactElement } from 'react'
import { Field, FieldLabel, Switch } from '@gedatou/cadenza-ui'

// size 是 shadcn 加的,不是 Base UI 的:它镜像成根元素上的 data-size,
// 轨道和滑块都按它取尺寸
export default function SizesDemo(): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-6 max-inline-sm">
      <Field orientation="horizontal">
        <Switch id="switch-size-default" defaultChecked />
        <FieldLabel htmlFor="switch-size-default">default</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch id="switch-size-sm" size="sm" defaultChecked />
        <FieldLabel htmlFor="switch-size-sm">sm</FieldLabel>
      </Field>
    </div>
  )
}
