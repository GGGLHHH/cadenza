import type { ReactElement } from 'react'
import { Field, FieldDescription, FieldTitle, Slider } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// The two callbacks each mind their own business: onValueChange keeps
// firing throughout the drag (reason is 'drag') and is a cancelable
// change event; onValueCommitted fires once when the gesture settles --
// a notification, with no cancel(). Hang the expensive work (a request,
// a DB write, a recompute) on the latter.
export default function CommitDemo(): ReactElement {
  const [live, setLive] = useState(40)
  const [committed, setCommitted] = useState(40)
  const [saves, setSaves] = useState(0)

  return (
    <Field className="max-inline-sm">
      <FieldTitle id="slider-commit-quality">Export bitrate</FieldTitle>
      <Slider
        aria-labelledby="slider-commit-quality"
        onValueChange={next => setLive(next)}
        onValueCommitted={(next) => {
          setCommitted(next)
          // This is where the request belongs
          setSaves(count => count + 1)
        }}
        value={live}
      />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">While dragging (onValueChange)</div>
          <div className="font-medium tabular-nums">{live}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Settled (onValueCommitted)</div>
          <div className="font-medium tabular-nums">{committed}</div>
        </div>
      </div>
      <FieldDescription>
        Committed
        {' '}
        {saves}
        {' '}
        times -- a whole drag counts once, each key press counts once.
      </FieldDescription>
    </Field>
  )
}
