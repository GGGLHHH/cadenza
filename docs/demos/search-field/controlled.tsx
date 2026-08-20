import type { ReactElement } from 'react'
import { SearchField } from '@gedatou/cadenza-ui'
import { useState } from 'react'
import { DemoButton } from '../lib/demo-button'

// Controlled: the text lives in external state and the component only
// renders it -- a button outside writing that state fills the input
export default function ControlledDemo(): ReactElement {
  const [value, setValue] = useState('')

  return (
    <div className="flex flex-col gap-4 inline-full max-inline-sm">
      <SearchField
        aria-label="Search composers"
        placeholder="Search composers..."
        value={value}
        onValueChange={setValue}
      />
      <div className="flex flex-wrap items-center gap-2">
        <DemoButton onClick={() => setValue('Debussy')}>Fill in Debussy</DemoButton>
        <DemoButton onClick={() => setValue('')}>Clear</DemoButton>
        <span className="text-sm text-muted-foreground">
          value:
          {value === '' ? ' —' : ` ${value}`}
        </span>
      </div>
    </div>
  )
}
