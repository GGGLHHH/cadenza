import type { ReactElement } from 'react'
import { Select } from '@gedatou/cadenza-ui'

const FRUITS = [
  { value: 'apple', label: '苹果' },
  { value: 'pear', label: '梨' },
  { value: 'yuzu', label: '柚子' },
]

// 清除是默认在场的:选中后 ✕ 站进 chevron 的位置,点击清空
// (onValueChange 收到 null,reason: 'clear-press')且不开弹层。
// clearable={false} 是总开关 —— 必填表单字段这类"可清除是语义错误"的场景用它。
export default function ClearableDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <Select aria-label="水果" items={FRUITS} placeholder="默认:可清除" />
      <Select aria-label="水果(必选)" clearable={false} items={FRUITS} placeholder="clearable={false}:不可清除" />
    </div>
  )
}
