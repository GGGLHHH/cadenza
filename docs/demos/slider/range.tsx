import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// Range: defaultValue / value is an array, and it grows one thumb per
// value in it. The generic follows the value -- value is number[] here,
// so next is number[] too, no narrowing needed. minStepsBetweenValues
// keeps the thumbs at least one step apart, never stacked dead on the
// same point.
export default function RangeDemo(): ReactElement {
  const [price, setPrice] = useState([180, 680])

  return (
    <Field className="max-inline-sm">
      <FieldTitle id="slider-range-price">Ticket price range</FieldTitle>
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
        $
        {price[0]}
        {' – $'}
        {price[1]}
        ; on submit, price appears twice -- one input per thumb.
      </FieldDescription>
    </Field>
  )
}
