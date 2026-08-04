import type { ReactElement } from 'react'
import {
  Field,
  FieldDescription,
  FieldLabel,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@gedatou/cadenza-ui'

const PIECES = {
  gaspard: '夜之加斯帕',
  jeux: '水之嬉戏',
  pavane: '悼念公主的帕凡舞曲',
}

// Select 的根是个透明容器,触发器才是控件,所以 id 落在 SelectTrigger 上。
// 一条通道全包了:触发器是真 <button>,原生 <label for> 既给它命名,
// 又由浏览器把点击转发过去把弹层打开 —— 不用再补 aria-label
export default function SelectDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="field-select-piece">曲目</FieldLabel>
      <Select items={PIECES}>
        <SelectTrigger id="field-select-piece">
          <SelectValue placeholder="选一首" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Object.entries(PIECES).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription>将原样印在节目单上。</FieldDescription>
    </Field>
  )
}
