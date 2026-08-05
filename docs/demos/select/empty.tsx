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
  { id: 'gaspard', title: '夜之加斯帕' },
  { id: 'jeux', title: '水之嬉戏' },
]

// SelectEmpty 与选项写在一起,列表里没有任何选项时它自动现身(:only-child,
// 零 JS)。唯一的约束:数据为空时别渲染空的 SelectGroup 壳,否则它不再是
// 唯一子元素。空集合的 Select 照样能打开 —— 不像 React Aria 那版,那边
// react-stately 在 open() 里就把空集合挡住了。
export default function EmptyDemo(): ReactElement {
  const [pieces, setPieces] = useState<Piece[]>([])

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select items={pieces.map(piece => ({ value: piece.id, label: piece.title }))}>
        <SelectTrigger aria-label="曲目">
          <SelectValue placeholder="选一首" />
        </SelectTrigger>
        <SelectPopup>
          <SelectEmpty>还没有可选的曲目</SelectEmpty>
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
        {pieces.length === 0 ? '灌入数据' : '清空数据'}
      </Button>
    </div>
  )
}
