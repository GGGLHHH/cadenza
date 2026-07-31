import type { ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'

const variants = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const
const sizes = ['xs', 'sm', 'default', 'lg'] as const

export default function ButtonDemo(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {variants.map(variant => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        <Button isDisabled>disabled</Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {sizes.map(size => (
          <Button key={size} variant="outline" size={size}>
            {size}
          </Button>
        ))}
      </div>
    </div>
  )
}
