import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Button, Cascader, Field, FieldLabel } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// Form serialization: given a name, each path segment renders one hidden
// input under that name, submitted in path order; an empty value renders
// no input at all. The label goes through FieldLabel htmlFor → the
// root's id (which lands on the trigger, a real <button>, so pressing
// the label opens the popup).
const REGIONS: CascaderNode[] = [
  {
    value: 'united-states',
    label: 'United States',
    items: [{ value: 'california', label: 'California', items: [{ value: 'san-francisco', label: 'San Francisco' }] }],
  },
  { value: 'singapore', label: 'Singapore' },
]

export default function FormDemo(): ReactElement {
  const [submitted, setSubmitted] = useState<string[] | null>(null)
  return (
    <form
      className="flex flex-col items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(new FormData(event.currentTarget).getAll('region').map(String))
      }}
    >
      <Field>
        <FieldLabel htmlFor="region">Region</FieldLabel>
        <Cascader id="region" items={REGIONS} name="region" placeholder="Select a region" />
      </Field>
      <Button type="submit" variant="outline">Submit</Button>
      {submitted !== null && (
        <p className="text-sm text-muted-foreground">
          FormData region:
          {' '}
          {JSON.stringify(submitted)}
        </p>
      )}
    </form>
  )
}
