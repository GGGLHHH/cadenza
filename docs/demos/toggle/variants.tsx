import type { ReactElement } from 'react'
import { Toggle } from '@gedatou/cadenza-ui'

// variant / size are shadcn's cva knobs; Base UI's Toggle has neither prop.
// The second button in each row starts pressed, making the aria-pressed
// background easy to see
export default function VariantsDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Toggle size="sm">sm</Toggle>
        <Toggle defaultPressed>default</Toggle>
        <Toggle size="lg">lg</Toggle>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Toggle size="sm" variant="outline">sm</Toggle>
        <Toggle defaultPressed variant="outline">default</Toggle>
        <Toggle size="lg" variant="outline">lg</Toggle>
      </div>
    </div>
  )
}
