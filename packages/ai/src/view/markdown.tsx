'use client'
import type { ComponentProps, ReactElement } from 'react'
import type { StreamdownProps, StreamdownTranslations } from 'streamdown'
import { dataAttr } from '@gedatou/cadenza-ui'
import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { Streamdown } from 'streamdown'

export interface MarkdownProps {
  content: string
  /** Still receiving bytes: parse incomplete markdown leniently and animate. */
  streaming?: boolean
  /** streamdown's own UI strings (copy button, fullscreen …); English by default. */
  translations?: Partial<StreamdownTranslations>
  /** Lands on streamdown's root `<div>`. */
  className?: string
}

const PLUGINS: StreamdownProps['plugins'] = { code, math, cjk }
const SHIKI_THEME: StreamdownProps['shikiTheme'] = ['github-light-default', 'vesper']
// Copy buttons come from streamdown itself (spec T5); downloads and fullscreen are off.
const CONTROLS: StreamdownProps['controls'] = {
  code: { copy: true, download: false },
  table: { copy: true, download: false, fullscreen: false },
}

function Anchor({ node: _node, ...props }: ComponentProps<'a'> & { node?: unknown }): ReactElement {
  return <a {...props} target="_blank" rel="noreferrer" />
}

const COMPONENTS: StreamdownProps['components'] = { a: Anchor }

/** Product-grade Markdown: streamdown with code / math / CJK plugins and safe links. */
export function Markdown({ content, streaming = false, translations, className }: MarkdownProps): ReactElement {
  return (
    // streamdown spaces blocks with `space-y-4` on its root, but in streaming mode
    // every block sits in a `display: contents` wrapper that margins cannot reach —
    // the gaps only appear when the mode flips to static, and the reply jumps by
    // one margin per block the moment it completes. A flex column with `gap`
    // spaces the blocks whether or not they are wrapped, so both modes lay out
    // identically and completion moves nothing.
    <div
      data-slot="markdown"
      data-streaming={dataAttr(streaming)}
      className="[&>div]:flex [&>div]:flex-col [&>div]:gap-4 [&>div]:space-y-0"
    >
      <Streamdown
        mode={streaming ? 'streaming' : 'static'}
        isAnimating={streaming}
        parseIncompleteMarkdown
        plugins={PLUGINS}
        shikiTheme={SHIKI_THEME}
        controls={CONTROLS}
        dir="auto"
        translations={translations}
        components={COMPONENTS}
        className={className}
      >
        {content}
      </Streamdown>
    </div>
  )
}
