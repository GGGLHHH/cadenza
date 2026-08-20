import type { ReactElement } from 'react'
import { Button, DatePicker, Field, FieldLabel } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// A name brings a persistent hidden input: empty serializes to '' and a
// value to yyyy-MM-dd, readable straight from native FormData. The label
// takes the ordinary route: FieldLabel htmlFor points at the input's id.
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
        <FieldLabel htmlFor="checkin">Check-in date</FieldLabel>
        <DatePicker id="checkin" name="checkin" placeholder="Pick a date" />
      </Field>
      <div className="flex items-center gap-3">
        <Button size="sm" type="submit">Submit</Button>
        <span className="text-sm text-muted-foreground">{submitted}</span>
      </div>
    </form>
  )
}
