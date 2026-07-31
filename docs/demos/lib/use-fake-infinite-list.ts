import type { InfiniteSelectAdapterProps } from '@gedatou/cadenza-ui'
import type { Person } from './people'
import { useCallback, useEffect, useRef, useState } from 'react'
import { delay, fetchPeople } from './people'

// 数据适配器:把游标分页接口接成 InfiniteSelectAdapterProps 的形状。
// 真实项目里通常由 react-query 的 useInfiniteQuery 担任这个角色。
export function useFakeInfiniteList(
  query?: string,
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
