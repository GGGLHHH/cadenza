import type { ReactElement } from 'react'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from '@gedatou/cadenza-ui'
import { useRef, useState } from 'react'

const INSTRUMENTS = ['Violin', 'Viola', 'Cello', 'Flute', 'Oboe', 'French horn', 'Trumpet']

// With multiple, the value changes shape wholesale: Combobox<string, true> has
// string[] for both value and onValueChange. The chips row wraps and grows as
// items get selected, so hand its ref to ComboboxPopup's anchor — the popup
// then follows the whole row instead of the bare input inside it.
export default function MultipleDemo(): ReactElement {
  const chipsRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState<string[]>(['Violin'])

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Combobox<string, true> items={INSTRUMENTS} multiple onValueChange={setValue} value={value}>
        <ComboboxChips ref={chipsRef}>
          <ComboboxValue>
            {(selected: string[]) => (
              <>
                {selected.map(instrument => (
                  <ComboboxChip key={instrument}>{instrument}</ComboboxChip>
                ))}
                <ComboboxChipsInput
                  aria-label="Instrument"
                  placeholder={selected.length === 0 ? 'Pick a few instruments' : ''}
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxPopup anchor={chipsRef}>
          <ComboboxEmpty>No matching instruments</ComboboxEmpty>
          <ComboboxList>
            {(instrument: string) => (
              <ComboboxItem key={instrument} value={instrument}>{instrument}</ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">value</dt>
        <dd className="font-mono">{value.length === 0 ? '—' : value.join(', ')}</dd>
      </dl>
    </div>
  )
}
