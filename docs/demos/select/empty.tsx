import type { ReactElement } from 'react'
import {
  Button,
  Select,
  SelectEmpty,
  SelectItem,
  SelectList,
  SelectPopover,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'
import { useState } from 'react'

interface Piece { id: string, title: string }

const PIECES: Piece[] = [
  { id: 'gaspard', title: '夜之加斯帕' },
  { id: 'jeux', title: '水之嬉戏' },
]

// 两件事缺一不可:
//   allowsEmptyCollection —— 没有它,空集合的 Select 根本打不开(react-stately
//                            在 open()/toggle() 里就挡住了),空状态永远看不到
//   renderEmptyState      —— SelectEmpty 的唯一入口,而它只在 SelectList 上,
//                            所以这里必须拆成 SelectPopover + SelectList 全写
export default function EmptyDemo(): ReactElement {
  const [pieces, setPieces] = useState<Piece[]>([])

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Select allowsEmptyCollection aria-label="曲目" placeholder="选一首">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPopover>
          <SelectList
            items={pieces}
            renderEmptyState={() => <SelectEmpty>还没有可选的曲目</SelectEmpty>}
          >
            {piece => <SelectItem id={piece.id}>{piece.title}</SelectItem>}
          </SelectList>
        </SelectPopover>
      </Select>
      <Button
        className="self-start"
        variant="outline"
        onPress={() => setPieces(current => (current.length === 0 ? PIECES : []))}
      >
        {pieces.length === 0 ? '灌入数据' : '清空数据'}
      </Button>
    </div>
  )
}
