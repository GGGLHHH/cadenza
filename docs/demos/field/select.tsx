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

// Select 的根是个 div,触发器才是控件,所以 id 落在 SelectTrigger 上。
// 两条通道各管一半 ——
//   htmlFor → SelectTrigger 的 id:点文字聚焦并展开
//   Select 的 aria-label:无障碍名(RAC 自己在 trigger 上设了 aria-labelledby,
//                        它压过原生 <label for>,少了这条名字就没了)
export default function SelectDemo(): ReactElement {
  return (
    <Field className="max-inline-sm">
      <FieldLabel htmlFor="field-select-piece">曲目</FieldLabel>
      <Select aria-label="曲目" placeholder="选一首">
        <SelectTrigger id="field-select-piece">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem id="gaspard">夜之加斯帕</SelectItem>
            <SelectItem id="jeux">水之嬉戏</SelectItem>
            <SelectItem id="pavane">悼念公主的帕凡舞曲</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription>将原样印在节目单上。</FieldDescription>
    </Field>
  )
}
