import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Button, Cascader, Field, FieldLabel } from '@gedatou/cadenza-ui'
import { useState } from 'react'

// 表单序列化:给 name,每个路径段渲染一个同名隐藏 input,提交顺序即路径顺序;
// 空值不渲染任何 input。标签走 FieldLabel htmlFor → 根的 id(落在触发器上,
// 真 <button>,点标签即开弹层)。
const REGIONS: CascaderNode[] = [
  {
    value: 'zhejiang',
    label: '浙江',
    items: [{ value: 'hangzhou', label: '杭州', items: [{ value: 'xihu', label: '西湖区' }] }],
  },
  { value: 'beijing', label: '北京' },
]

export default function FormDemo(): ReactElement {
  const [submitted, setSubmitted] = useState<string[] | null>(null)
  return (
    <form
      className="flex flex-col items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(new FormData(event.currentTarget).getAll('region').map(String))
      }}
    >
      <Field>
        <FieldLabel htmlFor="region">地区</FieldLabel>
        <Cascader id="region" items={REGIONS} name="region" placeholder="选择地区" />
      </Field>
      <Button type="submit" variant="outline">提交</Button>
      {submitted !== null && (
        <p className="text-sm text-muted-foreground">
          FormData region:
          {' '}
          {JSON.stringify(submitted)}
        </p>
      )}
    </form>
  )
}
