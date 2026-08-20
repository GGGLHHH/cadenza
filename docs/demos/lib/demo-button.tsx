import type { ComponentProps, ReactElement } from 'react'
import { Button } from '@gedatou/cadenza-ui'

/**
 * Demo-only trigger button: Button is not part of the documented surface,
 * so demo sources route through this shell and readers never see an
 * undocumented API. Underneath it is still the library Button — the
 * InfiniteCombobox trigger is taken over by Base UI's Popover.Trigger
 * (any element works), and a real button is the easiest choice.
 */
export function DemoButton({
  variant = 'outline',
  ...props
}: ComponentProps<typeof Button>): ReactElement {
  return <Button variant={variant} {...props} />
}
