'use client'

import type { ReactElement } from 'react'
import { IconAlignLeft, IconFile, IconHash, IconSearch } from '@tabler/icons-react'
import { useDocsSearch } from 'fumadocs-core/search/client'
import { fetchClient } from 'fumadocs-core/search/client/fetch'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const TYPE_ICON = {
  page: IconFile,
  heading: IconHash,
  text: IconAlignLeft,
} as const

/** 结果内容是 Markdown 片段:剥掉命中标记 <mark> 和行内记号(`、**) */
function cleanContent(content: string): string {
  return content.replace(/<\/?mark>/g, '').replace(/\*\*|`/g, '')
}

export function CommandMenu(): ReactElement {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const client = useMemo(() => fetchClient({ api: '/api/search' }), [])
  const { search, setSearch, query } = useDocsSearch({ client })

  const results = Array.isArray(query.data) ? query.data : []

  // ⌘K / Ctrl+K 全局唤起
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // 打开时锁滚动 + 聚焦输入框
  useEffect(() => {
    if (!open)
      return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  function close(): void {
    setOpen(false)
    setSearch('')
    setActiveIndex(0)
  }

  function go(url: string): void {
    close()
    router.push(url)
  }

  return (
    <>
      <button
        type="button"
        className="
          hidden items-center justify-between gap-2 rounded-lg border bg-surface
          px-3 text-sm text-muted-foreground transition-colors block-8 inline-56
          hover:bg-muted/50
          md:inline-flex
          [&_svg]:block-4 [&_svg]:inline-4
        "
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <IconSearch />
          搜索文档...
        </span>
        <kbd className="
          rounded-sm border bg-muted px-1.5 font-mono text-[10px]
          text-muted-foreground
        "
        >
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        className="
          inline-flex items-center justify-center rounded-md text-foreground
          transition-colors block-8 inline-8
          hover:bg-muted
          md:hidden
          [&_svg]:block-4.5 [&_svg]:inline-4.5
        "
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">搜索</span>
        <IconSearch />
      </button>
      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="关闭搜索"
            className="absolute inset-0 bg-black/40"
            onClick={close}
          />
          <div
            role="dialog"
            aria-label="搜索文档"
            className="
              absolute inset-s-1/2 inset-bs-[20svh] flex -translate-x-1/2
              flex-col overflow-hidden rounded-xl border bg-popover
              text-popover-foreground shadow-2xl inline-full max-inline-lg
            "
          >
            <div className="flex items-center gap-2 border-be px-3">
              <IconSearch className="
                shrink-0 text-muted-foreground block-4 inline-4
              "
              />
              <input
                ref={inputRef}
                value={search}
                placeholder="搜索文档..."
                className="
                  flex-1 bg-transparent py-3 text-sm outline-none
                  placeholder:text-muted-foreground
                "
                onChange={(event) => {
                  setSearch(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    close()
                  }
                  else if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    setActiveIndex(prev => Math.min(prev + 1, results.length - 1))
                  }
                  else if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    setActiveIndex(prev => Math.max(prev - 1, 0))
                  }
                  else if (event.key === 'Enter') {
                    const active = results.at(activeIndex)
                    if (active !== undefined)
                      go(active.url)
                  }
                }}
              />
              <kbd className="
                rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[10px]
                text-muted-foreground
              "
              >
                Esc
              </kbd>
            </div>
            <div className="overflow-y-auto p-2 max-block-80">
              {results.length === 0 && (
                <p className="
                  px-3 py-8 text-center text-sm text-muted-foreground
                "
                >
                  {search === ''
                    ? '输入关键词搜索文档'
                    : query.error
                      ? '搜索服务出错,请重试'
                      : '没有找到相关内容'}
                </p>
              )}
              {results.map((result, index) => {
                const Icon = TYPE_ICON[result.type]
                return (
                  <button
                    key={result.id}
                    type="button"
                    data-active={index === activeIndex}
                    className={cn(
                      `
                        flex cursor-pointer items-center gap-2 rounded-lg px-3
                        py-2 text-start text-sm inline-full
                        data-[active=true]:bg-accent
                        data-[active=true]:text-accent-foreground
                        [&_svg]:shrink-0 [&_svg]:text-muted-foreground
                        [&_svg]:block-4 [&_svg]:inline-4
                      `,
                      result.type !== 'page' && 'ps-6',
                    )}
                    onClick={() => go(result.url)}
                    onMouseMove={() => setActiveIndex(index)}
                  >
                    <Icon />
                    <span className="truncate">{cleanContent(result.content)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
