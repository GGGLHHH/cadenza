import type { ReactElement } from 'react'
import {
  Button,
  Select,
  SelectEmpty,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

interface Piece { id: string, title: string }

const PIECES: Piece[] = [
  { id: 'gaspard', title: 'Gaspard de la nuit' },
  { id: 'jeux', title: 'Jeux d\'eau' },
]

// SelectEmpty sits alongside the options and shows itself automatically when
// the list holds no options (:only-child, zero JS). The one constraint: when
// data is empty, don't render an empty SelectGroup shell, or it is no longer
// the only child. A Select with an empty collection still opens — unlike the
// React Aria version, where react-stately blocks empty collections in open().
export default function EmptyDemo(): ReactElement {
  const [pieces, setPieces] = useState<Piece[]>([])

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select items={pieces.map(piece => ({ value: piece.id, label: piece.title }))}>
        <SelectTrigger aria-label="Piece">
          <SelectValue placeholder="Pick a piece" />
        </SelectTrigger>
        <SelectPopup>
          <SelectEmpty>No pieces to choose from yet</SelectEmpty>
          {pieces.map(piece => (
            <SelectItem key={piece.id} value={piece.id}>{piece.title}</SelectItem>
          ))}
        </SelectPopup>
      </Select>
      <Button
        className="self-start"
        variant="outline"
        onClick={() => setPieces(current => (current.length === 0 ? PIECES : []))}
      >
        {pieces.length === 0 ? 'Load data' : 'Clear data'}
      </Button>
    </div>
  )
}
