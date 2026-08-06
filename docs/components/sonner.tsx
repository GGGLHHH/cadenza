'use client'

import type { ReactElement } from 'react'
import type { ToasterProps } from 'sonner'
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
  IconLoader2,
} from '@tabler/icons-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

// shadcn v4 的 sonner 封装(registry/new-york-v4/ui/sonner.tsx),
// 图标换成本站在用的 tabler;主题跟随 next-themes
export function Toaster(props: ToasterProps): ReactElement {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      icons={{
        success: <IconCircleCheck className="block-4 inline-4" />,
        info: <IconInfoCircle className="block-4 inline-4" />,
        warning: <IconAlertTriangle className="block-4 inline-4" />,
        error: <IconCircleX className="block-4 inline-4" />,
        loading: <IconLoader2 className="animate-spin block-4 inline-4" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
