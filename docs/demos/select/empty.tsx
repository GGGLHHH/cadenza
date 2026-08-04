import type { ReactElement } from 'react'
import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

interface Piece { id: string, title: string }

const PIECES: Piece[] = [
  { id: 'gaspard', title: '夜之加斯帕' },
  { id: 'jeux', title: '水之嬉戏' },
]

// 空态没有专门的入口,也不需要:自己判断 length 写 JSX 就行。
// 空集合的 Select 照样能打开 —— 不像 React Aria 那版,那边 react-stately
// 在 open() 里就把空集合挡住了,不显式开 allowsEmptyCollection 根本看不到空态
export default function EmptyDemo(): ReactElement {
  const [pieces, setPieces] = useState<Piece[]>([])

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select items={pieces.map(piece => ({ value: piece.id, label: piece.title }))}>
        <SelectTrigger aria-label="曲目">
          <SelectValue placeholder="选一首" />
        </SelectTrigger>
        <SelectContent>
          {pieces.length === 0
            ? (
                <p className="
                  px-3 py-6 text-center text-sm text-muted-foreground
                "
                >
                  还没有可选的曲目
                </p>
              )
            : (
                <SelectGroup>
                  {pieces.map(piece => (
                    <SelectItem key={piece.id} value={piece.id}>{piece.title}</SelectItem>
                  ))}
                </SelectGroup>
              )}
        </SelectContent>
      </Select>
      <Button
        className="self-start"
        variant="outline"
        onClick={() => setPieces(current => (current.length === 0 ? PIECES : []))}
      >
        {pieces.length === 0 ? '灌入数据' : '清空数据'}
      </Button>
    </div>
  )
}
