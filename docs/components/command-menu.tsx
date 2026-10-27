'use client'

import type { SortedResult } from 'fumadocs-core/search'
import type { ReactElement } from 'react'
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  InfiniteSelect,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectInputGroup,
  InfiniteSelectList,
} from '@gedatou/cadenza-ui'
import { AlignLeftIcon, AnimateIcon, FileIcon, HashIcon, SearchIcon } from '@gedatou/cadenza-ui/icons'
import { useDocsSearch } from 'fumadocs-core/search/client'
import { fetchClient } from 'fumadocs-core/search/client/fetch'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { getDictionary } from '@/lib/dictionary'
import { cn } from '@/lib/utils'

const TYPE_ICON = {
  page: FileIcon,
  heading: HashIcon,
  text: AlignLeftIcon,
} as const

/** 结果内容是 Markdown 片段:剥掉命中标记 <mark> 和行内记号(`、**) */
function cleanContent(content: string): string {
  return content.replace(/<\/?mark>/g, '').replace(/\*\*|`/g, '')
}

/**
 * ⌘K 搜索:本库的 Dialog 里放一个 InfiniteSelect。搜索在服务端(fumadocs 的
 * /api/search),正是 InfiniteSelect 的形状 —— 它不再过滤一遍,只负责列表:
 * 方向键与 Enter、滑动高亮、combobox / listbox 语义都是它的。焦点困在对话框里、
 * Esc 关闭、关闭后焦点回到触发器,是 Dialog 的。
 */
export function CommandMenu(): ReactElement {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { lang } = useParams<{ lang: string }>()
  const dict = getDictionary(lang)

  // 索引按语言隔离(loader 的 i18n 决定),不带 locale 会搜到另一语言的页面
  const client = useMemo(() => fetchClient({ api: '/api/search', locale: lang }), [lang])
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

  function onOpenChange(next: boolean): void {
    setOpen(next)
    if (!next)
      setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimateIcon animateOnHover asChild>
        <DialogTrigger
          className="
            hidden items-center justify-between gap-2 rounded-lg border
            bg-surface px-3 text-sm text-muted-foreground transition-colors
            block-8 inline-56
            hover:bg-muted/50
            md:inline-flex
            [&_svg]:block-4 [&_svg]:inline-4
          "
        >
          <span className="flex items-center gap-2">
            <SearchIcon />
            {dict.search.placeholder}
          </span>
          <kbd className="
            rounded-sm border bg-muted px-1.5 font-mono text-[10px]
            text-muted-foreground
          "
          >
            ⌘K
          </kbd>
        </DialogTrigger>
      </AnimateIcon>
      <AnimateIcon animateOnHover asChild>
        <DialogTrigger
          className="
            inline-flex items-center justify-center rounded-md text-foreground
            transition-colors block-8 inline-8
            hover:bg-muted
            md:hidden
            [&_svg]:block-4.5 [&_svg]:inline-4.5
          "
        >
          <span className="sr-only">{dict.search.open}</span>
          <SearchIcon />
        </DialogTrigger>
      </AnimateIcon>
      <DialogPopup
        className="
          gap-0 overflow-hidden p-0
          sm:max-inline-lg!
        "
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{dict.search.dialog}</DialogTitle>
        <InfiniteSelect<SortedResult>
          aria-label={dict.search.dialog}
          // 对话框是 grid,子项默认不比内容的最小宽度窄:不放开,最长的一条
          // 结果会把整个列表撑出对话框,截断失效。边框交给对话框自己
          className="border-0 min-inline-0"
          getOption={result => ({ id: result.id, label: cleanContent(result.content) })}
          inputValue={search}
          isError={query.error !== undefined}
          isLoading={query.isLoading}
          items={results}
          // 什么都不保持选中:选一条就是跳过去
          value={null}
          onInputValueChange={setSearch}
          onValueChange={(result) => {
            if (result === null)
              return
            onOpenChange(false)
            router.push(result.url)
          }}
        >
          <InfiniteSelectInputGroup autoFocus placeholder={dict.search.placeholder} />
          <InfiniteSelectList<SortedResult>
            maxListHeight={320}
            renderItem={({ item }) => {
              const Icon = TYPE_ICON[item.type]
              return (
                <span
                  className={cn(
                    `
                      flex flex-1 items-center gap-2 min-inline-0
                      [&_svg]:shrink-0 [&_svg]:text-muted-foreground
                      [&_svg]:block-4 [&_svg]:inline-4
                    `,
                    item.type !== 'page' && 'ps-4',
                  )}
                >
                  <Icon />
                  <span className="truncate">{cleanContent(item.content)}</span>
                </span>
              )
            }}
          />
          <InfiniteSelectEmpty className="py-8 text-center">
            {search === '' ? dict.search.hint : dict.search.empty}
          </InfiniteSelectEmpty>
          <InfiniteSelectError className="py-8 text-center">{dict.search.error}</InfiniteSelectError>
        </InfiniteSelect>
      </DialogPopup>
    </Dialog>
  )
}
