import type { ReactElement } from 'react'
import { Button, ColorPicker } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// The hidden input only renders with a name; an opaque value serializes
// to #rrggbb, one carrying alpha to 8-digit hex. Submitting exists only
// to fish the value out of FormData for a look
export default function FormDemo(): ReactElement {
  const [submitted, setSubmitted] = useState<string | null>(null)
  return (
    <form
      className="flex items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(new FormData(event.currentTarget).get('accent') as string)
      }}
    >
      <ColorPicker aria-label="Accent color" defaultValue="#6366f180" name="accent" />
      <Button size="sm" type="submit" variant="outline">Submit</Button>
      {submitted !== null && (
        <span className="font-mono text-xs text-muted-foreground">{submitted}</span>
      )}
    </form>
  )
}
