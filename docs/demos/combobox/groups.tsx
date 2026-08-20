import type { ReactElement } from 'react'
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@gedatou/cadenza-ui'

// The only key grouped data must have is items — that is how Base UI decides
// "this is a group"; call the group name whatever you like, value by
// convention. Filtering runs per group: matching items stay in their group,
// and a group with no matches disappears entirely.
interface Section {
  value: string
  items: string[]
}

const SECTIONS: Section[] = [
  { value: 'Strings', items: ['Violin', 'Viola', 'Cello', 'Double bass'] },
  { value: 'Woodwinds', items: ['Flute', 'Oboe', 'Clarinet', 'Bassoon'] },
  { value: 'Brass', items: ['French horn', 'Trumpet', 'Trombone', 'Tuba'] },
]

// Two levels of render functions: ComboboxList receives a group, ComboboxGroup
// items hands that group to the ComboboxCollection inside, which then receives
// each item within the group.
export default function GroupsDemo(): ReactElement {
  return (
    <Combobox<string> items={SECTIONS}>
      <ComboboxInput aria-label="Instrument" className="max-inline-sm" placeholder="Search instruments" />
      <ComboboxPopup>
        <ComboboxEmpty>No matching instruments</ComboboxEmpty>
        <ComboboxList>
          {(section: Section) => (
            <ComboboxGroup items={section.items} key={section.value}>
              <ComboboxGroupLabel>{section.value}</ComboboxGroupLabel>
              <ComboboxCollection>
                {(instrument: string) => (
                  <ComboboxItem key={instrument} value={instrument}>{instrument}</ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}
