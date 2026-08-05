import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldTitle,
  Slider,
} from '@gedatou/cadenza-ui'

// 一个值一个拇指:defaultValue 是 number,就只渲染一个 thumb。
// 根是 <div role="group">,不是可 label 的元素 —— 可见标签用 FieldTitle(div)
// 起个 id,再拿 aria-labelledby 指过去;这条会被 Base UI 往下传给每个 thumb
// 里的那个 <input type="range">,拇指自己也就有名字了。
// 压根没有可见文字时,直接写 aria-label。
export default function BasicDemo(): ReactElement {
  return (
    <FieldGroup className="max-inline-sm">
      <Field>
        <FieldTitle id="slider-basic-volume">主音量</FieldTitle>
        <Slider aria-labelledby="slider-basic-volume" defaultValue={40} name="volume" />
        <FieldDescription>方向键 ±1,Shift + 方向键 / PageUp / PageDown ±10。</FieldDescription>
      </Field>
      <Field>
        <Slider aria-label="混响" defaultValue={25} />
      </Field>
    </FieldGroup>
  )
}
