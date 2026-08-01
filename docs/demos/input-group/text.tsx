import type { ReactElement } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@gedatou/cadenza-ui'

// 文本前后缀:InputGroupText 把固定的协议头、单位、域名后缀嵌进同一个边框里,
// 用户就不用自己敲了
export default function TextDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-3 inline-full max-inline-sm">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="站点地址" placeholder="example" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>¥</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="金额" inputMode="decimal" placeholder="0.00" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>CNY</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
