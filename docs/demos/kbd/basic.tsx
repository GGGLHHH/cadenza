import type { ReactElement } from 'react'
import { Kbd } from '@gedatou/cadenza-ui'

// A single key at a glance: muted chip, fixed height, sans label
export default function BasicDemo(): ReactElement {
  return (
    <div className="flex items-center gap-4">
      <Kbd>⌘</Kbd>
      <Kbd>Ctrl</Kbd>
      <Kbd>⇧</Kbd>
    </div>
  )
}
