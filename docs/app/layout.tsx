import type { Metadata } from 'next'
import type { ReactElement, ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { Geist, Geist_Mono } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
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

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={cn(
        geistSans.variable,
        geistMono.variable,
        '[--header-height:--spacing(14)]',
      )}
    >
      <body className="bg-background font-sans antialiased min-block-svh">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex flex-col min-block-svh">
            <SiteHeader />
            <main className="flex flex-1 flex-col">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
