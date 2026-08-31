import type { ReactElement } from 'react'
import { Kbd, KbdGroup } from '@gedatou/cadenza-ui'

// KbdGroup lays keys of one shortcut out inline with a small gap; the group
// itself is a <kbd> too, so the whole chord reads as one keyboard input
export default function GroupDemo(): ReactElement {
  return (
    <div className="flex items-center gap-6">
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>B</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>
    </div>
  )
}
