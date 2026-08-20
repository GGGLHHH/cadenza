import type { ReactElement } from 'react'
import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'
import { HomeBackdrop } from '@/components/home-backdrop'
import { HomeCard } from '@/components/home-card'
import { HomeCta } from '@/components/home-cta'
import { HomeCursor } from '@/components/home-cursor'
import { DemoRenderer } from '@/demos'
import { getDictionary } from '@/lib/dictionary'
import { localizedHref } from '@/lib/i18n'

const INSTALL = 'pnpm add @gedatou/cadenza-ui'

// 橱窗挑四种不同的交互形态:纯按钮 / 弹层 / 日历 / 拖拽,证明「跑的是真组件」。
// 复用文档站同一个 lazy registry(@/demos),首页不另存一份 demo
const SHOWCASE = [
  { title: 'Button', name: 'button/variants', href: '/docs/components/button' },
  { title: 'Select', name: 'select/basic', href: '/docs/components/select' },
  { title: 'DatePicker', name: 'date-picker/basic', href: '/docs/components/date-picker' },
  { title: 'Slider', name: 'slider/basic', href: '/docs/components/slider' },
]

// 文案在字典里按 key 取,路径留在这——href 不是译文,不进 dictionary
const MORE = [
  { key: 'intro', href: '/docs' },
  { key: 'themes', href: '/docs/themes' },
  { key: 'components', href: '/docs/components/button' },
  { key: 'forms', href: '/docs/forms/tanstack-form' },
  { key: 'utils', href: '/docs/utils/use-controllable-state' },
] as const

export default async function Home(props: {
  params: Promise<{ lang: string }>
}): Promise<ReactElement> {
  const { lang } = await props.params
  const t = getDictionary(lang).home

  return (
    <div className="
      relative mx-auto flex flex-col gap-16 overflow-x-clip px-4 pbs-16 pbe-24
      inline-full max-inline-[1100px]
      lg:px-8
    "
    >
      <HomeBackdrop />
      <HomeCursor />

      <section className="flex flex-col items-center gap-5 text-center">
        <span className="
          rounded-full border px-3 py-1 text-xs font-medium
          text-muted-foreground
        "
        >
          {t.eyebrow}
        </span>
        <h1 className="
          text-4xl font-semibold tracking-tight text-balance
          sm:text-5xl
        "
        >
          Cadenza
        </h1>
        <p className="text-lg text-balance text-muted-foreground max-inline-2xl">
          {t.tagline}
        </p>
        <p className="text-sm text-balance text-muted-foreground max-inline-xl">
          {t.lede}
        </p>
        <div className="mbs-2">
          <HomeCta />
        </div>
      </section>

      <section className="mx-auto inline-full max-inline-xl">
        <h2 className="text-center text-sm font-medium text-muted-foreground">
          {t.install}
        </h2>
        {/* 站内代码块的既有外观(bg-code / 圆角 / 复制按钮锚点)全在这个 data 属性上 */}
        <figure data-rehype-pretty-code-figure="">
          <CopyButton value={INSTALL} />
          <pre className="px-4 py-3.5 font-mono">{INSTALL}</pre>
        </figure>
        <p className="mbs-3 text-center text-xs text-muted-foreground">
          {t.installNote}
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{t.showcase}</h2>
          <p className="text-sm text-muted-foreground">{t.showcaseNote}</p>
        </div>
        <div className="
          grid gap-4
          sm:grid-cols-2
        "
        >
          {SHOWCASE.map(item => (
            <HomeCard
              key={item.name}
              className="flex flex-col gap-4 p-6"
            >
              <Link
                href={localizedHref(lang, item.href)}
                className="
                  text-sm font-medium
                  hover:underline
                "
              >
                {item.title}
              </Link>
              <div className="flex flex-1 items-center">
                <DemoRenderer name={item.name} />
              </div>
            </HomeCard>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold tracking-tight">{t.features}</h2>
        <div className="
          grid gap-4
          sm:grid-cols-2
        "
        >
          {t.featureList.map(feature => (
            <HomeCard
              key={feature.title}
              className="flex flex-col gap-2 p-6"
            >
              <h3 className="text-sm font-semibold">{feature.title}</h3>
              <p className="text-sm/relaxed text-muted-foreground">
                {feature.body}
              </p>
            </HomeCard>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 border-bs pbs-8">
        <h2 className="text-sm font-medium text-muted-foreground">{t.more}</h2>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          {MORE.map(item => (
            <Link
              key={item.key}
              href={localizedHref(lang, item.href)}
              className="
                text-muted-foreground transition-colors
                hover:text-foreground
              "
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>
      </section>
    </div>
  )
}
