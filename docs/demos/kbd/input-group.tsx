import type { ReactElement } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput, Kbd } from '@gedatou/cadenza-ui'
import { IconSearch } from '@tabler/icons-react'

// A shortcut hint in an InputGroupAddon: the addon aligns the key and strips
// its extra margins, Kbd brings the chip styling
export default function InputGroupDemo(): ReactElement {
  return (
    <InputGroup className="max-inline-sm">
      <InputGroupAddon>
        <IconSearch aria-hidden />
      </InputGroupAddon>
      <InputGroupInput aria-label="Search docs" placeholder="Search docs..." />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘K</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}
