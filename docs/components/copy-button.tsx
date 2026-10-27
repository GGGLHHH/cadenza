'use client'

import type { ReactElement } from 'react'
import { CopyButton as AnimatedCopyButton, CopyButtonIcon } from '@animate-ui/react/primitives/buttons/copy'
import { AnimateIcon, CheckIcon, CopyIcon } from '@gedatou/cadenza-icons'
import { useParams } from 'next/navigation'
import { getDictionary } from '@/lib/dictionary'
import { cn } from '@/lib/utils'

/**
 * animate-ui's copy button: it writes the clipboard, holds `data-copied` for
 * two seconds and swaps the icons with its own transition. It renders
 * `data-slot="copy-button"`, which the preview card's code panel keys off.
 */
export function CopyButton({
  value,
  className,
}: {
  value: string
  className?: string
}): ReactElement {
  const { lang } = useParams<{ lang: string }>()

  return (
    <AnimateIcon animateOnHover asChild>
      <AnimatedCopyButton
        content={value}
        delay={2000}
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
      >
        <span className="sr-only">{getDictionary(lang).copy}</span>
        <CopyButtonIcon copiedIcon={<CheckIcon />} icon={<CopyIcon />} />
      </AnimatedCopyButton>
    </AnimateIcon>
  )
}
