import type { ReactElement } from 'react'
import { Button, DateTimePicker, Field, FieldLabel } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// A name brings a persistent hidden input: empty serializes to '' and a
// value to yyyy-MM-ddTHH:mm -- <input type="datetime-local">'s own wire
// format -- readable straight from native FormData. The label takes the
// ordinary FieldLabel htmlFor route.
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
        <FieldLabel htmlFor="visit">Visit</FieldLabel>
        <DateTimePicker id="visit" name="visit" placeholder="Pick a date and time" />
      </Field>
      <div className="flex items-center gap-3">
        <Button size="sm" type="submit">Submit</Button>
        <span className="text-sm text-muted-foreground">{submitted}</span>
      </div>
    </form>
  )
}
