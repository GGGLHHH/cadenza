import type { MDXComponents } from 'mdx/types'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { isValidElement } from 'react'
import { ComponentPreview } from '@/components/component-preview'
import { ComponentSource } from '@/components/component-source'
import { CopyButton } from '@/components/copy-button'
import { ThemePreviewGrid } from '@/components/theme-preview-grid'
import { cn } from '@/lib/utils'

function getNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number')
    return String(node)

  if (Array.isArray(node))
    return node.map((child: ReactNode) => getNodeText(child)).join('')

  if (isValidElement<{ children?: ReactNode }>(node))
    return getNodeText(node.props.children)

  return ''
}

// 编译期(rehype)没给 id 时的兜底,与 TOC 的 slug 规则保持一致
function getHeadingId(children: ReactNode): string | undefined {
  const id = getNodeText(children)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/['?]/g, '')
    .toLowerCase()

  return id === '' ? undefined : id
}

function HeadingAnchor({
  id,
  children,
}: {
  id?: string
  children: ReactNode
}): ReactNode {
  if (id === undefined)
    return children

  return (
    <a className="group no-underline" href={`#${id}`}>
      <span className="
        underline-offset-4
        group-hover:underline
      "
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className="
          ms-2 text-muted-foreground opacity-0
          group-hover:opacity-100
        "
      >
        #
      </span>
    </a>
  )
}

function heading(Tag: 'h1' | 'h2' | 'h3' | 'h4') {
  return function Heading({ children, id, ...props }: ComponentProps<'h2'>): ReactElement {
    const headingId = id ?? getHeadingId(children)

    return (
      <Tag id={headingId} {...props}>
        <HeadingAnchor id={headingId}>{children}</HeadingAnchor>
      </Tag>
    )
  }
}

export const mdxComponents: MDXComponents = {
  h1: heading('h1'),
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
  table: (props: ComponentProps<'table'>) => (
    <div className="typeset-table no-scrollbar overflow-x-auto">
      <table {...props} />
    </div>
  ),
  pre: ({ className, ...props }: ComponentProps<'pre'>) => (
    <pre
      data-not-typeset=""
      className={cn(
        `
          no-scrollbar overflow-auto px-4 py-3.5 outline-none min-inline-0
          has-data-line-numbers:px-0
        `,
        className,
      )}
      {...props}
    />
  ),
  code: ({
    className,
    __raw__,
    ...props
  }: ComponentProps<'code'> & { __raw__?: string }) => {
    // 行内代码(children 是纯文本)
    if (typeof props.children === 'string') {
      return (
        <code
          className={cn(
            `
              rounded-md bg-muted px-[0.3rem] py-[0.15rem] font-mono
              text-[0.8em] wrap-break-word
            `,
            className,
          )}
          {...props}
        />
      )
    }

    // 围栏代码块:rehype-pretty-code 的 transformer 把原文挂在 __raw__ 上
    return (
      <>
        {__raw__ !== undefined && <CopyButton value={__raw__} />}
        <code className={className} {...props} />
      </>
    )
  },
  ComponentPreview,
  ComponentSource,
  ThemePreviewGrid,
}
