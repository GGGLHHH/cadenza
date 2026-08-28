import type { BubbleVariant } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Bubble, BubbleContent } from '@gedatou/cadenza-ui'

const VARIANTS: { variant: BubbleVariant, text: string }[] = [
  { variant: 'default', text: 'Where does the interval go, if we make that change?' },
  { variant: 'secondary', text: 'After La Mer — it is the longest work of the evening.' },
  { variant: 'muted', text: 'And the winds get a real rest before the Firebird.' },
  { variant: 'tinted', text: 'Printed and sent to front of house.' },
  { variant: 'outline', text: 'Two cellists short that week — still nobody to cover.' },
  {
    variant: 'ghost',
    text: 'La Mer is the natural substitute: twenty-four minutes, three movements, and it asks far less of the low strings while keeping the programme inside the same decade. Note how this one runs the full width — ghost lifts the 80% cap the others live under.',
  },
  { variant: 'destructive', text: 'Upload failed — the parts never reached the library.' },
]

// Real sentences, not one-word labels: the 80% cap and ghost's escape from it
// are only visible when the text is long enough to reach the edge.
export default function VariantsDemo(): ReactElement {
  return (
    <div className="mx-auto flex flex-col gap-3 inline-full max-inline-sm">
      {VARIANTS.map(({ variant, text }) => (
        <Bubble key={variant} variant={variant}>
          <BubbleContent>{text}</BubbleContent>
        </Bubble>
      ))}
    </div>
  )
}
