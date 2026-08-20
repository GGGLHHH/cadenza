import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldLabel,
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

const PIECES = {
  gaspard: 'Gaspard de la nuit',
  jeux: 'Jeux d\'eau',
  pavane: 'Pavane pour une infante défunte',
}

// Select's root is a transparent container; the trigger is the control, so
// the id lands on SelectTrigger. One channel covers everything: the trigger
// is a real <button>, so the native <label for> both names it and lets the
// browser forward clicks to open the popup — no extra aria-label needed
export default function SelectDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="field-select-piece">Piece</FieldLabel>
      <Select items={PIECES}>
        <SelectTrigger id="field-select-piece">
          <SelectValue placeholder="Pick a piece" />
        </SelectTrigger>
        <SelectPopup>
          <SelectGroup>
            {Object.entries(PIECES).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectPopup>
      </Select>
      <FieldDescription>Printed on the programme as-is.</FieldDescription>
    </Field>
  )
}
