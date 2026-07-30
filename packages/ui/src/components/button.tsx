import type { VariantProps } from 'class-variance-authority'
import type { ReactElement } from 'react'
import type { ButtonProps as AriaButtonProps } from 'react-aria-components'
import { cva } from 'class-variance-authority'
import { Button as AriaButton } from 'react-aria-components'
import { cn } from '../lib/utils'

/**
 * Reference component for the library: React Aria owns behaviour and emits
 * `data-*` state attributes; cva + Tailwind own the look. Copy this shape.
 */
export const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap',
    'rounded-md text-sm font-medium outline-none transition-all',
    '[&_svg]:pointer-events-none [&_svg]:size-4',
    'data-[focus-visible]:ring-ring/50 data-[focus-visible]:ring-[3px]',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    'data-[pending]:cursor-progress',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs data-[hovered]:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs data-[hovered]:bg-destructive/90 data-[focus-visible]:ring-destructive/20',
        outline: 'border border-input bg-background shadow-xs data-[hovered]:bg-accent data-[hovered]:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs data-[hovered]:bg-secondary/80',
        ghost: 'data-[hovered]:bg-accent data-[hovered]:text-accent-foreground',
        link: 'text-primary underline-offset-4 data-[hovered]:underline',
      },
      size: {
        sm: 'h-8 rounded-md px-3',
        default: 'h-9 px-4 py-2',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends Omit<AriaButtonProps, 'className'>,
  VariantProps<typeof buttonVariants> {
  className?: string
}

export function Button({ className, variant, size, ...props }: ButtonProps): ReactElement {
  return (
    <AriaButton
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
