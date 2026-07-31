import type { InfiniteSelectAdapterProps, InfiniteSelectOption } from '@gedatou/cadenza-ui'
import type { ReactElement, ReactNode } from 'react'
import {
  Button,
  InfiniteCombobox,
  InfiniteSelectClearButton,
  InfiniteSelectConfirmButton,
  InfiniteSelectEmpty,
  InfiniteSelectError,
  InfiniteSelectFooter,
  InfiniteSelectFooterSeparator,
  InfiniteSelectLoading,
  InfiniteSelectRetry,
  useInfiniteComboboxState,
} from '@gedatou/cadenza-ui'
import { useCallback, useEffect, useRef, useState } from 'react'

// ── 模拟一个游标分页接口:Promise + 300–500ms 随机延时。 ──

interface Person {
  id: string
  name: string
  role: string
}

const ROLES = ['Composer', 'Conductor', 'Pianist', 'Violinist', 'Cellist']
const NAMES = [
  'Bach',
  'Beethoven',
  'Brahms',
  'Chopin',
  'Debussy',
  'Dvořák',
  'Elgar',
  'Fauré',
  'Grieg',
  'Handel',
  'Haydn',
  'Liszt',
  'Mahler',
  'Mendelssohn',
  'Mozart',
  'Prokofiev',
  'Puccini',
  'Rachmaninoff',
  'Ravel',
  'Saint-Saëns',
  'Satie',
  'Schubert',
  'Schumann',
  'Shostakovich',
  'Sibelius',
  'Strauss',
  'Stravinsky',
  'Tchaikovsky',
  'Verdi',
  'Vivaldi',
]

const TOTAL = 10000

const PEOPLE: Person[] = Array.from({ length: TOTAL }, (_, index) => ({
  id: `p${index + 1}`,
  name: `${NAMES[index % NAMES.length]!} ${Math.floor(index / NAMES.length) + 1}`,
  role: ROLES[index % ROLES.length]!,
}))

const DEFAULT_PAGE_SIZE = 20

function delay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
}

async function fetchPeople(options: {
  cursor?: number
  query?: string
  pageSize?: number
}): Promise<{ items: Person[], nextCursor?: number }> {
  await delay()
  const { cursor = 0, query, pageSize = DEFAULT_PAGE_SIZE } = options
  const filtered = query
    ? PEOPLE.filter(person => person.name.toLowerCase().includes(query.toLowerCase()))
    : PEOPLE
  const items = filtered.slice(cursor, cursor + pageSize)
  const next = cursor + pageSize
  return { items, nextCursor: next < filtered.length ? next : undefined }
}

// ── 适配器:把任何异步分页源接成 InfiniteSelectAdapterProps。
//    真实项目里通常由 react-query 的 useInfiniteQuery 担任这个角色。 ──

function useFakeInfiniteList(
  query: string | undefined,
  { failFirst = false, pageSize }: { failFirst?: boolean, pageSize?: number } = {},
): InfiniteSelectAdapterProps<Person> {
  const [items, setItems] = useState<Person[]>([])
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [isError, setIsError] = useState(false)
  // 竞态防护:query 变化后,旧请求的响应直接丢弃。
  const requestIdRef = useRef(0)
  const attemptRef = useRef(0)

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setIsError(false)
    setItems([])
    attemptRef.current += 1
    if (failFirst && attemptRef.current === 1) {
      await delay()
      if (requestId !== requestIdRef.current)
        return
      setIsError(true)
      setIsLoading(false)
      return
    }
    const page = await fetchPeople({ query, pageSize })
    if (requestId !== requestIdRef.current)
      return
    setItems(page.items)
    setNextCursor(page.nextCursor)
    setIsLoading(false)
  }, [failFirst, pageSize, query])

  useEffect(() => {
    void loadFirstPage()
  }, [loadFirstPage])

  const onLoadMore = useCallback(async () => {
    if (nextCursor === undefined || isFetchingNextPage)
      return
    const requestId = requestIdRef.current
    setIsFetchingNextPage(true)
    const page = await fetchPeople({ cursor: nextCursor, query, pageSize })
    if (requestId !== requestIdRef.current)
      return
    setItems(current => [...current, ...page.items])
    setNextCursor(page.nextCursor)
    setIsFetchingNextPage(false)
  }, [isFetchingNextPage, nextCursor, pageSize, query])

  return {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage: nextCursor !== undefined,
    isError,
    onLoadMore: () => void onLoadMore(),
    onRetry: () => void loadFirstPage(),
  }
}

function getOption(person: Person): InfiniteSelectOption {
  return {
    id: person.id,
    label: person.name,
  }
}

// ── 业务层:文案(含 i18n)在这一层注入,基座零文案。 ──

const demoSlots: ReactNode = (
  <>
    <InfiniteSelectLoading>加载中…</InfiniteSelectLoading>
    <InfiniteSelectEmpty>没有匹配的结果</InfiniteSelectEmpty>
    <InfiniteSelectError>
      加载失败
      <InfiniteSelectRetry>重试</InfiniteSelectRetry>
    </InfiniteSelectError>
  </>
)

export function SingleDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [picked, setPicked] = useState<Person | undefined>(undefined)

  return (
    <div className="not-content">
      <InfiniteCombobox<Person>
        getOption={getOption}
        list={list}
        onChange={setPicked}
        loadingMoreIndicator="加载更多…"
        searchPlaceholder="搜索作曲家…"
        slots={demoSlots}
        state={state}
      >
        <Button variant="outline">{picked ? picked.name : '选择作曲家'}</Button>
      </InfiniteCombobox>
    </div>
  )
}

export function MultiDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [ids, setIds] = useState<string[]>([])

  return (
    <div className="not-content">
      <InfiniteCombobox<Person>
        commitOnClose
        getOption={getOption}
        list={list}
        multiple
        onChange={(_items, nextIds) => setIds(nextIds)}
        loadingMoreIndicator="加载更多…"
        searchPlaceholder="搜索作曲家…"
        state={state}
        value={ids}
        slots={(
          <>
            {demoSlots}
            <InfiniteSelectFooter>
              <InfiniteSelectClearButton>清空</InfiniteSelectClearButton>
              <InfiniteSelectFooterSeparator />
              <InfiniteSelectConfirmButton>确定</InfiniteSelectConfirmButton>
            </InfiniteSelectFooter>
          </>
        )}
      >
        <Button variant="outline">
          {ids.length > 0 ? `已选 ${ids.length} 位` : '选择多位作曲家'}
        </Button>
      </InfiniteCombobox>
    </div>
  )
}

export function ErrorDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue, { failFirst: true })

  return (
    <div className="not-content">
      <InfiniteCombobox<Person>
        getOption={getOption}
        list={list}
        loadingMoreIndicator="加载更多…"
        searchPlaceholder="搜索作曲家…"
        slots={demoSlots}
        state={state}
      >
        <Button variant="outline">首次加载会失败</Button>
      </InfiniteCombobox>
    </div>
  )
}

export function VirtualizedDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  // 一页直接拉全量 10000 条:没有翻页,纯粹考验渲染 —— 虚拟化让 DOM 始终只有
  // 可视窗口加 overscan 的几十个节点。
  const list = useFakeInfiniteList(state.queryValue, { pageSize: 10000 })
  const [picked, setPicked] = useState<Person | undefined>(undefined)

  return (
    <div className="not-content">
      <InfiniteCombobox<Person>
        getOption={getOption}
        list={list}
        onChange={setPicked}
        searchPlaceholder="在 10000 条里搜索…"
        slots={demoSlots}
        state={state}
        virtualized
      >
        <Button variant="outline">{picked ? picked.name : '虚拟化:一次载入 10000 条'}</Button>
      </InfiniteCombobox>
    </div>
  )
}

export function RenderItemDemo(): ReactElement {
  const state = useInfiniteComboboxState()
  const list = useFakeInfiniteList(state.queryValue)
  const [picked, setPicked] = useState<Person | undefined>(undefined)

  return (
    <div className="not-content">
      <InfiniteCombobox<Person>
        getOption={getOption}
        list={list}
        onChange={setPicked}
        loadingMoreIndicator="加载更多…"
        searchPlaceholder="搜索作曲家…"
        slots={demoSlots}
        state={state}
        // renderItem 替换整行内容:默认的对勾也没了,选中态用 selected 自绘
        renderItem={({ item, index, selected }) => (
          <>
            <span className="
              text-end text-xs text-muted-foreground tabular-nums inline-8
            "
            >
              {index + 1}
              .
            </span>
            <span className="flex-1 truncate">{item.name}</span>
            <span className="text-xs text-muted-foreground">{item.role}</span>
            {selected && <span className="text-xs text-primary">✓</span>}
          </>
        )}
      >
        <Button variant="outline">{picked ? picked.name : '自定义行内容'}</Button>
      </InfiniteCombobox>
    </div>
  )
}
