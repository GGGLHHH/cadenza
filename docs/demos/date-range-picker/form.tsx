import type { ReactElement } from 'react'
import { Button, DateRangePicker, Field, FieldLabel } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// A name brings two persistent hidden inputs (one per end, same name);
// native FormData.getAll returns ['2026-08-10', '2026-08-20'] in one go.
export default function FormDemo(): ReactElement {
  const [submitted, setSubmitted] = useState<string>('—')
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setSubmitted(JSON.stringify(data.getAll('stay')))
      }}
    >
      <Field>
        <FieldLabel htmlFor="stay">Stay dates</FieldLabel>
        <DateRangePicker
          defaultValue={{ from: new Date(2026, 7, 10), to: new Date(2026, 7, 20) }}
          id="stay"
          name="stay"
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button size="sm" type="submit">Submit</Button>
        <span className="text-sm text-muted-foreground">{submitted}</span>
      </div>
    </form>
  )
}
