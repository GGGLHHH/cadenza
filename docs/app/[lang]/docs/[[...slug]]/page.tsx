import type { Metadata } from 'next'
import type { ReactElement } from 'react'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import { findNeighbour } from 'fumadocs-core/page-tree'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocsTableOfContents } from '@/components/docs-toc'
import { getDictionary } from '@/lib/dictionary'
import { source } from '@/lib/source'
import { mdxComponents } from '@/mdx-components'

export const revalidate = false
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams(): { lang: string, slug?: string[] }[] {
  return source.generateParams()
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string, slug?: string[] }>
}): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug, params.lang)

  if (!page)
    notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}

// 基类不带尺寸/内边距:px-0 盖不过 px-3(同优先级看样式表顺序,不看
// className 先后),各变体自己给,图标 shrink-0 防止被 flex 压扁
const NEIGHBOUR_LINK_CLASSNAME = `
  inline-flex items-center justify-center gap-1 rounded-lg bg-secondary
  text-sm font-medium text-secondary-foreground transition-colors
  hover:bg-secondary/80
  [&_svg]:shrink-0 [&_svg]:block-4 [&_svg]:inline-4
`

export default async function Page(props: {
  params: Promise<{ lang: string, slug?: string[] }>
}): Promise<ReactElement> {
  const params = await props.params
  const page = source.getPage(params.slug, params.lang)

  if (!page)
    notFound()

  const dict = getDictionary(params.lang)
  const doc = page.data
  const MDX = doc.body
  const neighbours = findNeighbour(source.getPageTree(params.lang), page.url)

  return (
    <div
      data-slot="docs"
      className="
        flex items-stretch pbe-8 text-[15px]
        xl:inline-full
      "
    >
      <div className="flex flex-1 flex-col min-inline-0">
        <div className="
          mx-auto flex flex-1 flex-col gap-6 px-4 py-6 text-foreground
          inline-full max-inline-3xl min-inline-0
          md:px-0
          lg:py-8
        "
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <h1 className="scroll-m-24 text-3xl font-semibold tracking-tight">
                {doc.title}
              </h1>
              <div className="flex items-center gap-2">
                {neighbours.previous && (
                  <Link
                    href={neighbours.previous.url}
                    className={`
                      ${NEIGHBOUR_LINK_CLASSNAME}
                      block-8 inline-8
                      md:block-7 md:inline-7
                    `}
                  >
                    <IconArrowLeft />
                    <span className="sr-only">{dict.pager.previous}</span>
                  </Link>
                )}
                {neighbours.next && (
                  <Link
                    href={neighbours.next.url}
                    className={`
                      ${NEIGHBOUR_LINK_CLASSNAME}
                      block-8 inline-8
                      md:block-7 md:inline-7
                    `}
                  >
                    <span className="sr-only">{dict.pager.next}</span>
                    <IconArrowRight />
                  </Link>
                )}
              </div>
            </div>
            {doc.description !== undefined && (
              <p className="
                text-base text-balance text-muted-foreground
                md:max-inline-[80%]
              "
              >
                {doc.description}
              </p>
            )}
          </div>
          <div className="
            typeset flex-1 pbe-16 inline-full
            sm:pbe-0
          "
          >
            <MDX components={mdxComponents} />
          </div>
          <div className="
            hidden items-center gap-2 block-16 inline-full
            sm:flex
          "
          >
            {neighbours.previous && (
              <Link
                href={neighbours.previous.url}
                className={`
                  ${NEIGHBOUR_LINK_CLASSNAME}
                  px-3 block-8
                `}
              >
                <IconArrowLeft />
                {neighbours.previous.name}
              </Link>
            )}
            {neighbours.next && (
              <Link
                href={neighbours.next.url}
                className={`
                  ${NEIGHBOUR_LINK_CLASSNAME}
                  ms-auto px-3 block-8
                `}
              >
                {neighbours.next.name}
                <IconArrowRight />
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="
        sticky inset-bs-(--header-height) z-30 ms-auto hidden flex-col gap-4
        overflow-hidden pbe-8 block-[calc(100svh-var(--header-height)-2rem)]
        inline-64
        xl:flex
      "
      >
        <div className="shrink-0 block-8" />
        {doc.toc.length > 0 && (
          <div className="
            no-scrollbar flex scroll-fade-y flex-col gap-8 overflow-y-auto px-8
          "
          >
            <DocsTableOfContents toc={doc.toc} />
          </div>
        )}
      </div>
    </div>
  )
}
