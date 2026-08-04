import type { ReactElement } from 'react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  InputGroup,
  InputGroupInput,
} from '@gedatou/cadenza-ui'

// responsive:窄时上下、宽时左右。断点看的是 FieldGroup 的容器宽度
// (@container 查询),不是视口。左列用 FieldContent 装「标签 + 描述」——
// 宽屏下长大的是这个文本块,光放一个裸标签会拉出一片空白(上游解剖同款)
export default function ResponsiveDemo(): ReactElement {
  return (
    <FieldGroup className="max-inline-lg">
      <Field orientation="responsive">
        <FieldContent>
          <FieldLabel htmlFor="responsive-name">姓名</FieldLabel>
          <FieldDescription>用于演出署名,公开可见。</FieldDescription>
        </FieldContent>
        <InputGroup>
          <InputGroupInput id="responsive-name" placeholder="莫里斯" />
        </InputGroup>
      </Field>
      <Field orientation="responsive">
        <FieldContent>
          <FieldLabel htmlFor="responsive-city">城市</FieldLabel>
          <FieldDescription>巡演行程按它排序。</FieldDescription>
        </FieldContent>
        <InputGroup>
          <InputGroupInput id="responsive-city" placeholder="巴黎" />
        </InputGroup>
      </Field>
    </FieldGroup>
  )
}
