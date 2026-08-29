import type { Metadata } from 'next'
import type { ReactElement } from 'react'
import { PlaygroundApp } from '@/demos/ai/playground'
import { getDictionary } from '@/lib/dictionary'
import { i18n } from '@/lib/i18n'

export function generateStaticParams(): { lang: string }[] {
  return i18n.languages.map(lang => ({ lang }))
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await props.params
  const t = getDictionary(lang).playground
  return { title: t.title, description: t.description }
}

// Full-bleed: the workspace owns the viewport below the sticky header, so the
// transcript scrolls inside its own frame and the composer stays at the bottom.
export default function PlaygroundPage(): ReactElement {
  return (
    <div className="
      flex flex-col block-[calc(100svh-var(--header-height))] min-block-0
    "
    >
      <PlaygroundApp />
    </div>
  )
}
