import type { ReactElement } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@gedatou/cadenza-ui'

// Text prefixes and suffixes: InputGroupText embeds fixed protocol heads,
// units, and domain suffixes inside the same border, so users never have to
// type them
export default function TextDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-3 inline-full max-inline-sm">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Site address" placeholder="example" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.com</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>¥</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Amount" inputMode="decimal" placeholder="0.00" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>CNY</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
