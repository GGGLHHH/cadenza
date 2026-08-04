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

// 动态集合挂在 SelectGroup(或 SelectList)上,不是根组件 —— RAC 的 SelectProps
// 里根本没有 items。piece 的类型由 items 推出来,不是 unknown。
// children 不是纯字符串时要自己补 textValue,打字定位靠它检索
export default function DynamicDemo(): ReactElement {
  return (
    <Select aria-label="曲目" className="inline-72" placeholder="选一首">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup items={PIECES}>
          {piece => (
            <SelectItem id={piece.id} textValue={piece.title}>
              <span className="flex-1">{piece.title}</span>
              <span className="text-xs text-muted-foreground">{piece.opus}</span>
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
