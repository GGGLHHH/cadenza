import type { ReactElement } from 'react'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

interface Piece { id: string, title: string, opus: string }

const PIECES: Piece[] = [
  { id: 'gaspard', title: 'Gaspard de la nuit', opus: 'M. 55' },
  { id: 'jeux', title: 'Jeux d\'eau', opus: 'M. 30' },
  { id: 'pavane', title: 'Pavane pour une infante défunte', opus: 'M. 19' },
  { id: 'sonatine', title: 'Sonatine', opus: 'M. 40' },
]

// Data-driven options are just a map call — there is no collection API.
// Two places to keep apart:
//   items — feeds SelectValue only, deciding what the trigger prints
//     (here the title, not the opus number)
//   label — feeds typeahead; you must supply it yourself whenever
//     children is not a plain string
export default function DynamicDemo(): ReactElement {
  return (
    <Select items={PIECES.map(piece => ({ value: piece.id, label: piece.title }))}>
      <SelectTrigger aria-label="Piece" className="inline-72">
        <SelectValue placeholder="Pick a piece" />
      </SelectTrigger>
      <SelectPopup>
        <SelectGroup>
          {PIECES.map(piece => (
            <SelectItem key={piece.id} label={piece.title} value={piece.id}>
              <span className="flex-1">{piece.title}</span>
              <span className="text-xs text-muted-foreground">{piece.opus}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectPopup>
    </Select>
  )
}
