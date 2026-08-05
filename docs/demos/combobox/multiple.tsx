import type { ReactElement } from 'react'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from '@gedatou/cadenza-ui'
import { useRef, useState } from 'react'

const INSTRUMENTS = ['小提琴', '中提琴', '大提琴', '长笛', '双簧管', '圆号', '小号']

// multiple 之后值整体换型:Combobox<string, true> 的 value / onValueChange 都是 string[]。
// chips 那一行会随选中项换行长高,所以把它的 ref 交给 ComboboxPopup 的 anchor ——
// 弹层跟着整行走,而不是跟着行里那个光秃秃的输入框。
export default function MultipleDemo(): ReactElement {
  const chipsRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState<string[]>(['小提琴'])

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <Combobox<string, true> items={INSTRUMENTS} multiple onValueChange={setValue} value={value}>
        <ComboboxChips ref={chipsRef}>
          <ComboboxValue>
            {(selected: string[]) => (
              <>
                {selected.map(instrument => (
                  <ComboboxChip key={instrument}>{instrument}</ComboboxChip>
                ))}
                <ComboboxChipsInput
                  aria-label="乐器"
                  placeholder={selected.length === 0 ? '挑几件乐器' : ''}
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxPopup anchor={chipsRef}>
          <ComboboxEmpty>没有匹配的乐器</ComboboxEmpty>
          <ComboboxList>
            {(instrument: string) => (
              <ComboboxItem key={instrument} value={instrument}>{instrument}</ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">value</dt>
        <dd className="font-mono">{value.length === 0 ? '—' : value.join(', ')}</dd>
      </dl>
    </div>
  )
}
