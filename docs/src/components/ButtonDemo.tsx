import type { ReactElement } from 'react'
import { Button } from '@cadenza/ui'

const variants = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const
const sizes = ['xs', 'sm', 'default', 'lg'] as const

export function ButtonDemo(): ReactElement {
  return (
    <div className="not-content flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {variants.map(variant => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        <Button isDisabled>disabled</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {sizes.map(size => (
          <Button key={size} variant="outline" size={size}>
            {size}
          </Button>
        ))}
      </div>
    </div>
  )
}
