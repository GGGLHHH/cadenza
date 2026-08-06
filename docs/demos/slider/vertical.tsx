import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'

// 方向:orientation="vertical" 把 data-orientation 一路翻成 vertical,轨道换轴变竖条。
// 外层刻意不给任何高度 —— 控件自带的 min-block-40 兜住底,不会塌成 0。
export default function VerticalDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldTitle id="slider-vertical-gain">增益</FieldTitle>
      <Slider aria-labelledby="slider-vertical-gain" defaultValue={60} orientation="vertical" />
      <FieldDescription>↑ / ↓ ±1,PageUp / PageDown ±10。</FieldDescription>
    </Field>
  )
}
