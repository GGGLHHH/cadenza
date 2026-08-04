import type { ReactElement } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

interface Piece { id: string, title: string, opus: string }

const PIECES: Piece[] = [
  { id: 'gaspard', title: '夜之加斯帕', opus: 'M. 55' },
  { id: 'jeux', title: '水之嬉戏', opus: 'M. 30' },
  { id: 'pavane', title: '悼念公主的帕凡舞曲', opus: 'M. 19' },
  { id: 'sonatine', title: '小奏鸣曲', opus: 'M. 40' },
]

// 数据驱动的选项就是一次 map,没有集合 API。
// 两处要分开看:
//   items —— 只喂 SelectValue,决定触发器上印什么(这里印标题,不印作品号)
//   label —— 喂键盘打字定位;children 不是纯字符串时必须自己给
export default function DynamicDemo(): ReactElement {
  return (
    <Select items={PIECES.map(piece => ({ value: piece.id, label: piece.title }))}>
      <SelectTrigger aria-label="曲目" className="inline-72">
        <SelectValue placeholder="选一首" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {PIECES.map(piece => (
            <SelectItem key={piece.id} label={piece.title} value={piece.id}>
              <span className="flex-1">{piece.title}</span>
              <span className="text-xs text-muted-foreground">{piece.opus}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
