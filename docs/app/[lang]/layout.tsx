import type { Metadata } from 'next'
import type { ReactElement, ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { Toaster } from '@/components/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { htmlLang, i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import '@/app/globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Cadenza',
    template: '%s - Cadenza',
  },
  description: 'Accessible React components — Base UI behaviour, shadcn styling',
  icons: { icon: '/favicon.svg' },
}

export function generateStaticParams(): { lang: string }[] {
  return i18n.languages.map(lang => ({ lang }))
}

export default async function RootLayout({ params, children }: {
  params: Promise<{ lang: string }>
  children: ReactNode
}): Promise<ReactElement> {
  const { lang } = await params
  return (
    <html
      lang={htmlLang(lang)}
      suppressHydrationWarning
      className={cn(
        geistSans.variable,
        geistMono.variable,
        '[--header-height:--spacing(14)]',
      )}
    >
      <body className="bg-background font-sans antialiased min-block-svh">
        <ThemeProvider>
          <div className="relative flex flex-col min-block-svh">
            <SiteHeader lang={lang} />
            <main className="flex flex-1 flex-col">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
