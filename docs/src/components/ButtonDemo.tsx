import type { ReactElement } from 'react'
import { Button } from '@cadenza/ui'

const variants = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const

export function ButtonDemo(): ReactElement {
  return (
    <div className="not-content flex flex-wrap items-center gap-3">
      {variants.map(variant => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
      <Button isDisabled>disabled</Button>
    </div>
  )
}
