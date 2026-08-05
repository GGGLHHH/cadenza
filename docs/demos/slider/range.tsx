import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 区间:defaultValue / value 是数组,数组里有几个值就有几个 thumb。
// 泛型跟着值走 —— 这里 value 是 number[],所以 next 也是 number[],不用再窄化。
// minStepsBetweenValues 让两个拇指之间至少隔开一步,不会叠死在同一个点上。
export default function RangeDemo(): ReactElement {
  const [price, setPrice] = useState([180, 680])

  return (
    <Field className="max-inline-sm">
      <FieldTitle id="slider-range-price">票价区间</FieldTitle>
      <Slider
        aria-labelledby="slider-range-price"
        max={1200}
        min={0}
        minStepsBetweenValues={1}
        name="price"
        onValueChange={next => setPrice(next)}
        step={20}
        value={price}
      />
      <FieldDescription className="tabular-nums">
        ¥
        {price[0]}
        {' – ¥'}
        {price[1]}
        ,提交时 price 出现两次 —— 每个拇指一个 input。
      </FieldDescription>
    </Field>
  )
}
