import type { ReactElement } from 'react'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

// Two granularities: disabled on Select disables the whole control (the popup
// won't open); on SelectItem it disables just that row (keyboard navigation
// skips it)
export default function DisabledDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select defaultValue="viola" disabled items={{ viola: 'Viola' }}>
        <SelectTrigger aria-label="Fully disabled">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          <SelectGroup>
            <SelectItem value="viola">Viola</SelectItem>
          </SelectGroup>
        </SelectPopup>
      </Select>
      <Select items={{ violin: 'Violin', viola: 'Viola', cello: 'Cello' }}>
        <SelectTrigger aria-label="Single item disabled">
          <SelectValue placeholder="Cello is taken" />
        </SelectTrigger>
        <SelectPopup>
          <SelectGroup>
            <SelectItem value="violin">Violin</SelectItem>
            <SelectItem value="viola">Viola</SelectItem>
            <SelectItem disabled value="cello">Cello</SelectItem>
          </SelectGroup>
        </SelectPopup>
      </Select>
    </div>
  )
}
