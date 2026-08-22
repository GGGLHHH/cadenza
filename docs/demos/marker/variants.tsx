import type { MarkerVariant } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Marker, MarkerContent } from '@gedatou/cadenza-ui'

const LABELS: Record<MarkerVariant, string> = {
  default: 'Inline note, status, or action',
  border: 'Bordered row — separates what follows',
  separator: 'Labelled divider',
}

// Three shapes, and the difference is entirely the rule around the text:
// nothing, an underline, or a hairline out to both edges with the label
// centred between them.
export default function VariantsDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-5 inline-full max-inline-sm">
      {(Object.keys(LABELS) as MarkerVariant[]).map(variant => (
        <Marker key={variant} variant={variant}>
          <MarkerContent>{LABELS[variant]}</MarkerContent>
        </Marker>
      ))}
    </div>
  )
}
