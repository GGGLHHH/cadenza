import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'

// Six variants: default is the primary action, the rest weaken by semantics;
// destructive is reserved for irreversible operations
export default function VariantsDemo(): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link style</Button>
      <Button disabled>Disabled</Button>
    </div>
  )
}
