import type { ReactElement } from 'react'
import { Button, Field, FieldLabel, TimePicker } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// A name brings a persistent hidden input: empty serializes to '' and a
// value to HH:mm -- <input type="time">'s own wire format -- readable straight
// from native FormData. The label takes the ordinary FieldLabel htmlFor route.
export default function FormDemo(): ReactElement {
  const [submitted, setSubmitted] = useState<string>('—')
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setSubmitted(JSON.stringify(Object.fromEntries(data)))
      }}
    >
      <Field>
        <FieldLabel htmlFor="opens">Opens at</FieldLabel>
        <TimePicker id="opens" name="opens" placeholder="Pick a time" />
      </Field>
      <div className="flex items-center gap-3">
        <Button size="sm" type="submit">Submit</Button>
        <span className="text-sm text-muted-foreground">{submitted}</span>
      </div>
    </form>
  )
}
