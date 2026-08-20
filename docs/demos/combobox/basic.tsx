import type { ReactElement } from 'react'
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@gedatou/cadenza-ui'

// The full list lives in items; filtering happens in the browser: Base UI
// narrows this one array as you type. ComboboxList's children is a render
// function, and what it receives is exactly that narrowed array.
const COMPOSERS = [
  'Bach',
  'Mozart',
  'Beethoven',
  'Schubert',
  'Brahms',
  'Debussy',
  'Ravel',
  'Mahler',
]

export default function BasicDemo(): ReactElement {
  return (
    <Combobox<string> items={COMPOSERS}>
      <ComboboxInput aria-label="Composer" className="max-inline-sm" placeholder="Search composers" />
      <ComboboxPopup>
        <ComboboxEmpty>No matching composers</ComboboxEmpty>
        <ComboboxList>
          {(composer: string) => (
            <ComboboxItem key={composer} value={composer}>{composer}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}
