'use client'

import type { ReactElement } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function CopyButton({
  value,
  className,
}: {
  value: string
  className?: string
}): ReactElement {
  const [hasCopied, setHasCopied] = useState(false)

  useEffect(() => {
    if (!hasCopied)
      return
    const timer = setTimeout(setHasCopied, 2000, false)
    return () => clearTimeout(timer)
  }, [hasCopied])

  return (
    <button
      type="button"
      data-slot="copy-button"
      className={cn(
        `
          absolute inset-e-2 inset-bs-3 z-10 inline-flex items-center
          justify-center rounded-md bg-code text-code-foreground opacity-70
          transition-opacity block-7 inline-7
          hover:opacity-100
          [&_svg]:block-3.5 [&_svg]:inline-3.5
        `,
        className,
      )}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => setHasCopied(true))
      }}
    >
      <span className="sr-only">复制</span>
      {hasCopied ? <IconCheck /> : <IconCopy />}
    </button>
  )
}
