import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// Multiple thumbs: as many as the array is long, numbered from 0 --
// data-index sits on each thumb. Also the evidence for the 3+ thumb
// announcement rule: with exactly two values Base UI provides
// "start range" / "end range"; with three or more it stops providing
// aria-valuetext, and screen readers read the aria-valuenow number
// itself. Default thumbCollisionBehavior="push": drag one thumb onto
// another and it pushes it along.
export default function MultipleDemo(): ReactElement {
  const [stops, setStops] = useState([20, 50, 80])

  return (
    <Field className="max-inline-sm">
      <FieldTitle id="slider-multiple-stops">Gradient stops</FieldTitle>
      <Slider
        aria-labelledby="slider-multiple-stops"
        onValueChange={next => setStops(next)}
        value={stops}
      />
      <FieldDescription className="tabular-nums">
        {stops.join(' / ')}
        {' -- three thumbs; drag one into another and it pushes it along.'}
      </FieldDescription>
    </Field>
  )
}
