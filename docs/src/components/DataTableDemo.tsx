import type {
  DataTableColumn,
  SortDescriptor,
} from '@gedatou/cadenza-ui'
import type { ReactElement, ReactNode } from 'react'
import {
  DataPagination,
  DataTable,
  DataTableEmpty,
  DataTableError,
  DataTableLoading,
  DataTableRetry,
} from '@gedatou/cadenza-ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ── 模拟一个后端:Promise + 300–500ms 随机延时,支持 offset 分页与游标分页。 ──

interface Person {
  id: string
  name: string
  role: string
  born: number
  works: number
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
  born: 1650 + (index % 300),
  works: (index * 37) % 600,
}))

function delay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))
}

async function fetchPeoplePage(options: {
  page: number
  limit: number
}): Promise<{ items: Person[], total: number }> {
  await delay()
  const start = (options.page - 1) * options.limit
  return { items: PEOPLE.slice(start, start + options.limit), total: TOTAL }
}

async function fetchPeopleCursor(options: {
  cursor?: number
  pageSize?: number
}): Promise<{ items: Person[], nextCursor?: number }> {
  await delay()
  const { cursor = 0, pageSize = 20 } = options
  const next = cursor + pageSize
  return {
    items: PEOPLE.slice(cursor, next),
    nextCursor: next < PEOPLE.length ? next : undefined,
  }
}

// ── 适配器:返回值的形状就是 DataTable 的列表状态 props,直接展开传入。
//    真实项目里由 react-query 的 useQuery / useInfiniteQuery 担任这个角色。 ──

function usePersonPage(page: number, limit: number): {
  items: Person[]
  total: number
  isLoading: boolean
  isError: boolean
  onRetry: () => void
} {
  const [items, setItems] = useState<Person[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    const result = await fetchPeoplePage({ page, limit })
    if (requestId !== requestIdRef.current)
      return
    setItems(result.items)
    setTotal(result.total)
    setIsLoading(false)
  }, [page, limit])

  useEffect(() => {
    void load()
  }, [load])

  return { items, total, isLoading, isError: false, onRetry: () => void load() }
}

interface InfiniteListState {
  items: Person[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  isError: boolean
  onLoadMore: () => void
  onRetry: () => void
}

function useFakeInfiniteList(
  { failFirst = false, pageSize }: { failFirst?: boolean, pageSize?: number } = {},
): InfiniteListState {
  const [items, setItems] = useState<Person[]>([])
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [isError, setIsError] = useState(false)
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
    const page = await fetchPeopleCursor({ pageSize })
    if (requestId !== requestIdRef.current)
      return
    setItems(page.items)
    setNextCursor(page.nextCursor)
    setIsLoading(false)
  }, [failFirst, pageSize])

  useEffect(() => {
    void loadFirstPage()
  }, [loadFirstPage])

  const onLoadMore = useCallback(async () => {
    if (nextCursor === undefined || isFetchingNextPage)
      return
    const requestId = requestIdRef.current
    setIsFetchingNextPage(true)
    const page = await fetchPeopleCursor({ cursor: nextCursor, pageSize })
    if (requestId !== requestIdRef.current)
      return
    setItems(current => [...current, ...page.items])
    setNextCursor(page.nextCursor)
    setIsFetchingNextPage(false)
  }, [isFetchingNextPage, nextCursor, pageSize])

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

// ── 业务层:列定义 + 文案(含 i18n)在这一层注入,基座零文案。 ──

const columns: DataTableColumn<Person>[] = [
  { id: 'name', header: '姓名', cell: person => person.name, isRowHeader: true },
  { id: 'role', header: '角色', cell: person => person.role },
  { id: 'born', header: '生年', cell: person => person.born, width: 90 },
  { id: 'works', header: '作品数', cell: person => person.works, width: 90 },
]

const demoSlots: ReactNode = (
  <>
    <DataTableLoading>加载中…</DataTableLoading>
    <DataTableEmpty>暂无数据</DataTableEmpty>
    <DataTableError>
      加载失败
      <DataTableRetry>重试</DataTableRetry>
    </DataTableError>
  </>
)

export function BasicDemo(): ReactElement {
  return (
    <div className="not-content">
      <DataTable<Person>
        aria-label="作曲家"
        columns={columns}
        items={PEOPLE.slice(0, 5)}
      />
    </div>
  )
}

export function SortDemo(): ReactElement {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'name', direction: 'ascending' })
  const items = useMemo(() => {
    const column = sort.column as keyof Person
    const sorted = [...PEOPLE.slice(0, 8)].sort((a, b) =>
      String(a[column]).localeCompare(String(b[column]), undefined, { numeric: true }))
    return sort.direction === 'descending' ? sorted.reverse() : sorted
  }, [sort])

  const sortableColumns = useMemo(
    () => columns.map(column => ({ ...column, allowsSorting: true })),
    [],
  )

  return (
    <div className="not-content">
      <DataTable<Person>
        aria-label="作曲家(可排序)"
        columns={sortableColumns}
        items={items}
        onSortChange={setSort}
        sortDescriptor={sort}
      />
    </div>
  )
}

export function SelectionDemo(): ReactElement {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const items = PEOPLE.slice(0, 6)

  return (
    <div className="not-content flex flex-col gap-2">
      <DataTable<Person>
        aria-label="作曲家(可多选)"
        columns={columns}
        items={items}
        selectedKeys={selected}
        selectionMode="multiple"
        onSelectionChange={(keys) => {
          setSelected(keys === 'all' ? new Set(items.map(person => person.id)) : new Set([...keys].map(String)))
        }}
      />
      <p className="text-sm text-muted-foreground">
        已选
        {' '}
        {selected.size}
        {' '}
        行
      </p>
    </div>
  )
}

export function PaginationDemo(): ReactElement {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const { items, total, ...listState } = usePersonPage(page, limit)

  return (
    <div className="not-content flex flex-col gap-3">
      <DataTable<Person>
        aria-label="作曲家(分页)"
        columns={columns}
        items={items}
        {...listState}
      >
        {demoSlots}
      </DataTable>
      <DataPagination
        limit={limit}
        limitOptions={[10, 20, 50]}
        page={page}
        rowsPerPageLabel="每页"
        summary={({ total: totalCount }) => `共 ${totalCount} 条`}
        total={total}
        onLimitChange={(next) => {
          setLimit(next)
          setPage(1)
        }}
        onPageChange={setPage}
      />
    </div>
  )
}

export function InfiniteDemo(): ReactElement {
  const list = useFakeInfiniteList()

  return (
    <div className="not-content">
      {/* 无限滚动的已加载集无界累积,所以同时开虚拟化:DOM 始终只有窗口内的行 */}
      <DataTable<Person>
        aria-label="作曲家(无限滚动)"
        columns={columns}
        loadingMoreIndicator="加载更多…"
        maxHeight={320}
        virtualized
        {...list}
      >
        {demoSlots}
      </DataTable>
    </div>
  )
}

export function ErrorDemo(): ReactElement {
  const list = useFakeInfiniteList({ failFirst: true })

  return (
    <div className="not-content">
      <DataTable<Person>
        aria-label="作曲家(首次加载失败)"
        columns={columns}
        maxHeight={320}
        {...list}
      >
        {demoSlots}
      </DataTable>
    </div>
  )
}

// ── 横向滚动与固定列:列总宽超出容器时自动横向滚动。 ──

const ERAS = ['巴洛克', '古典', '浪漫', '现代']
const LABELS = ['DG', 'Decca', 'EMI', 'Sony Classical', 'Philips']

const wideColumns: DataTableColumn<Person>[] = [
  { id: 'name', header: '姓名', cell: person => person.name, isRowHeader: true, width: 140 },
  { id: 'role', header: '角色', cell: person => person.role, width: 130 },
  { id: 'born', header: '生年', cell: person => person.born, width: 110 },
  { id: 'era', header: '时期', cell: person => ERAS[person.born % ERAS.length], width: 110 },
  { id: 'active', header: '活跃年代', cell: person => `${person.born + 20}–${person.born + 60}`, width: 150 },
  { id: 'label', header: '唱片公司', cell: person => LABELS[person.works % LABELS.length], width: 150 },
  { id: 'works', header: '作品数', cell: person => person.works, width: 110 },
]

export function HScrollDemo(): ReactElement {
  return (
    <div className="not-content">
      <DataTable<Person>
        aria-label="作曲家(横向滚动)"
        columns={wideColumns}
        items={PEOPLE.slice(0, 6)}
      />
    </div>
  )
}

// 同侧多列固定:姓名 + 角色 都钉在左侧,sticky 偏移按数组顺序累加
const pinnedColumns: DataTableColumn<Person>[] = [
  { ...wideColumns[0]!, pinned: 'start' },
  { ...wideColumns[1]!, pinned: 'start' },
  ...wideColumns.slice(2),
  {
    id: 'actions',
    header: '操作',
    cell: () => <span className="cursor-pointer text-primary">查看</span>,
    width: 90,
    pinned: 'end',
  },
]

export function PinnedDemo(): ReactElement {
  return (
    <div className="not-content">
      <DataTable<Person>
        aria-label="作曲家(固定列)"
        columns={pinnedColumns}
        items={PEOPLE.slice(0, 6)}
      />
    </div>
  )
}

// ── 动态行高:每行的简介长短不一,行高由内容决定。 ──

const BLURBS = [
  '以对位法著称。',
  '晚期作品以宏大的结构与浓烈的情感著称,对后世交响乐影响深远,至今仍是音乐会保留曲目。',
  '专注于室内乐与艺术歌曲,笔触细腻。',
  '歌剧与宗教音乐并重,旋律感极强,生前即享有盛名,作品在欧洲各大剧院常演不衰;晚年转向教学,门生众多。',
  '民族乐派代表人物,善用民间旋律。',
]

interface PersonWithBio extends Person {
  bio: string
}

const DYNAMIC_PEOPLE: PersonWithBio[] = PEOPLE.map((person, index) => ({
  ...person,
  bio: BLURBS[index % BLURBS.length]!,
}))

const dynamicColumns: DataTableColumn<PersonWithBio>[] = [
  { id: 'name', header: '姓名', cell: person => person.name, isRowHeader: true, width: 140 },
  { id: 'bio', header: '简介', cell: person => person.bio, className: 'whitespace-normal' },
]

export function DynamicRowHeightDemo(): ReactElement {
  return (
    <div className="not-content">
      <DataTable<PersonWithBio>
        aria-label="作曲家(动态行高)"
        columns={dynamicColumns}
        dynamicRowHeight
        items={DYNAMIC_PEOPLE}
        maxHeight={400}
        virtualized
      />
    </div>
  )
}

export function VirtualizedDemo(): ReactElement {
  // 一次拉满 10000 条:没有翻页,纯粹考验渲染 —— 虚拟化让 DOM 始终只有
  // 可视窗口内的几十行。
  const list = useFakeInfiniteList({ pageSize: TOTAL })

  return (
    <div className="not-content">
      <DataTable<Person>
        aria-label="作曲家(虚拟化)"
        columns={columns}
        maxHeight={400}
        virtualized
        {...list}
      >
        {demoSlots}
      </DataTable>
    </div>
  )
}
