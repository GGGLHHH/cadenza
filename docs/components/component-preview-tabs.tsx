'use client'

import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export type ComponentPreviewAlign = 'center' | 'start' | 'end' | 'stretch'

/**
 * shadcn v4 同款展示卡:上半是活预览,下半默认折叠成 3 行源码 + 渐隐遮罩 +
 * View Code 按钮,点开后完整源码可滚动、可复制。
 */
export function ComponentPreviewTabs({
  className,
  previewClassName,
  align = 'center',
  component,
  source,
  sourcePreview,
}: {
  className?: string
  previewClassName?: string
  align?: ComponentPreviewAlign
  component: ReactNode
  source: ReactNode
  sourcePreview: ReactNode
}): ReactElement {
  const [isCodeVisible, setIsCodeVisible] = useState(false)

  return (
    <div
      data-slot="component-preview"
      data-not-typeset=""
      className={cn(
        `
          group relative mbs-4 mbe-12 flex flex-col overflow-hidden rounded-2xl
          border
        `,
        className,
      )}
    >
      <div data-slot="preview">
        <div
          data-align={align}
          className={cn(
            `
              relative flex justify-center p-10 block-72 inline-full
              data-[align=center]:items-center
              data-[align=end]:items-end
              data-[align=start]:items-start
              data-[align=stretch]:items-stretch data-[align=stretch]:p-6
              data-[align=stretch]:block-auto data-[align=stretch]:min-block-72
              data-[align=stretch]:*:inline-full
            `,
            previewClassName,
          )}
        >
          {component}
        </div>
      </div>
      <div
        data-slot="code"
        data-code-visible={isCodeVisible}
        className="
          relative overflow-hidden
          **:data-rehype-pretty-code-figure:m-0!
          **:data-rehype-pretty-code-figure:rounded-t-none
          **:data-rehype-pretty-code-figure:border-bs
          **:data-[slot=copy-button]:inset-e-4 **:data-[slot=copy-button]:hidden
          data-[code-visible=true]:**:data-[slot=copy-button]:flex
        "
      >
        {isCodeVisible
          ? source
          : (
              <div className="relative">
                {sourcePreview}
                <div className="
                  absolute inset-0 flex items-center justify-center pbe-4
                "
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, var(--color-code), color-mix(in oklab, var(--color-code) 60%, transparent), transparent)',
                    }}
                  />
                  <button
                    type="button"
                    className="
                      relative z-10 inline-flex items-center rounded-lg border
                      bg-background px-3 text-sm font-medium text-foreground
                      transition-colors block-8
                      hover:bg-muted
                    "
                    onClick={() => setIsCodeVisible(true)}
                  >
                    View Code
                  </button>
                </div>
              </div>
            )}
      </div>
    </div>
  )
}
