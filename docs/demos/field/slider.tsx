import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'

// 唯一接不上 htmlFor 的那一类:Slider 的根是 role="group" 的 div,
// 原生 <label for> 只认可被标记的元素,指过去等于没指;拇指里的 input
// 拿的是生成 id,猜不到。
// 所以用 FieldTitle(它是 div、专给「没有单一控件可指」的编组用)+
// aria-labelledby —— Base UI 会把它一路转发到每个拇指的 input 上。
export default function SliderDemo(): ReactElement {
  return (
    <Field className="inline-full max-inline-sm">
      <FieldTitle id="field-slider-volume">主音量</FieldTitle>
      <Slider aria-labelledby="field-slider-volume" defaultValue={60} name="volume" />
      <FieldDescription>没有可见文字时才改用 aria-label —— 它只命名整组,不往拇指传。</FieldDescription>
    </Field>
  )
}
