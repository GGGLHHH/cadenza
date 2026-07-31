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
  InfiniteSelectLoadingMore,
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

const PEOPLE: Person[] = NAMES.map((name, index) => ({
  id: `p${index + 1}`,
  name,
  role: ROLES[index % ROLES.length]!,
}))

const PAGE_SIZE = 8

function delay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
}

async function fetchPeople(options: {
  cursor?: number
  query?: string
}): Promise<{ items: Person[], nextCursor?: number }> {
  await delay()
  const { cursor = 0, query } = options
  const filtered = query
    ? PEOPLE.filter(person => person.name.toLowerCase().includes(query.toLowerCase()))
    : PEOPLE
  const items = filtered.slice(cursor, cursor + PAGE_SIZE)
  const next = cursor + PAGE_SIZE
  return { items, nextCursor: next < filtered.length ? next : undefined }
}

// ── 适配器:把任何异步分页源接成 InfiniteSelectAdapterProps。
//    真实项目里通常由 react-query 的 useInfiniteQuery 担任这个角色。 ──

function useFakeInfiniteList(
  query: string | undefined,
  { failFirst = false }: { failFirst?: boolean } = {},
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
    const page = await fetchPeople({ query })
    if (requestId !== requestIdRef.current)
      return
    setItems(page.items)
    setNextCursor(page.nextCursor)
    setIsLoading(false)
  }, [failFirst, query])

  useEffect(() => {
    void loadFirstPage()
  }, [loadFirstPage])

  const onLoadMore = useCallback(async () => {
    if (nextCursor === undefined || isFetchingNextPage)
      return
    const requestId = requestIdRef.current
    setIsFetchingNextPage(true)
    const page = await fetchPeople({ cursor: nextCursor, query })
    if (requestId !== requestIdRef.current)
      return
    setItems(current => [...current, ...page.items])
    setNextCursor(page.nextCursor)
    setIsFetchingNextPage(false)
  }, [isFetchingNextPage, nextCursor, query])

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
    <InfiniteSelectLoadingMore>加载更多…</InfiniteSelectLoadingMore>
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
        searchPlaceholder="搜索作曲家…"
        slots={demoSlots}
        state={state}
      >
        <Button variant="outline">首次加载会失败</Button>
      </InfiniteCombobox>
    </div>
  )
}
