import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 多个拇指:数组多长就有几个 thumb,编号从 0 起 —— data-index 写在每个拇指上。
// 也是三拇指以上播报的证据:正好两个值时 Base UI 会给 "start range" / "end range",
// 三个以上就不给 aria-valuetext 了,屏幕阅读器读的是 aria-valuenow 那个数字本身。
// 默认 thumbCollisionBehavior="push":把一个拇指拖到另一个身上,是推着它走。
export default function MultipleDemo(): ReactElement {
  const [stops, setStops] = useState([20, 50, 80])

  return (
    <Field className="max-inline-sm">
      <FieldTitle id="slider-multiple-stops">渐变节点</FieldTitle>
      <Slider
        aria-labelledby="slider-multiple-stops"
        onValueChange={next => setStops(next)}
        value={stops}
      />
      <FieldDescription className="tabular-nums">
        {stops.join(' / ')}
        {' —— 三个拇指,拖一个撞上另一个会推着它走。'}
      </FieldDescription>
    </Field>
  )
}
