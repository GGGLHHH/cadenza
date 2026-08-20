import type { ReactElement } from 'react'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectPopup,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

// SelectLabel titles a group, not the control — the control's label lives on
// the Field side. SelectSeparator works between groups and between items
// within a group
const INSTRUMENTS = {
  violin: 'Violin',
  viola: 'Viola',
  cello: 'Cello',
  flute: 'Flute',
  oboe: 'Oboe',
  clarinet: 'Clarinet',
}

export default function GroupDemo(): ReactElement {
  return (
    <Select items={INSTRUMENTS}>
      <SelectTrigger aria-label="Instrument" className="inline-56">
        <SelectValue placeholder="Pick an instrument" />
      </SelectTrigger>
      <SelectPopup>
        <SelectGroup>
          <SelectLabel>Strings</SelectLabel>
          <SelectItem value="violin">Violin</SelectItem>
          <SelectItem value="viola">Viola</SelectItem>
          <SelectItem value="cello">Cello</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Woodwinds</SelectLabel>
          <SelectItem value="flute">Flute</SelectItem>
          <SelectItem value="oboe">Oboe</SelectItem>
          <SelectItem value="clarinet">Clarinet</SelectItem>
        </SelectGroup>
      </SelectPopup>
    </Select>
  )
}
