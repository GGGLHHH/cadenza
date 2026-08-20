import type { InfiniteSelectAdapterProps } from '@gedatou/cadenza-ui'
import type { Person } from './people'
import { useCallback, useEffect, useRef, useState } from 'react'
import { delay, fetchPeople } from './people'

// Data adapter: wires the cursor-paginated API into the shape of
// InfiniteSelectAdapterProps. In a real project this role is usually
// played by react-query's useInfiniteQuery.
export function useFakeInfiniteList(
  query?: string,
  { failFirst = false, pageSize, limit }: { failFirst?: boolean, pageSize?: number, limit?: number } = {},
): InfiniteSelectAdapterProps<Person> {
  const [items, setItems] = useState<Person[]>([])
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [isError, setIsError] = useState(false)
  // Race guard: once the query changes, stale responses are dropped.
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
    const page = await fetchPeople({ query, pageSize, limit })
    if (requestId !== requestIdRef.current)
      return
    setItems(page.items)
    setNextCursor(page.nextCursor)
    setIsLoading(false)
  }, [failFirst, limit, pageSize, query])

  useEffect(() => {
    void loadFirstPage()
  }, [loadFirstPage])

  const onLoadMore = useCallback(async () => {
    if (nextCursor === undefined || isFetchingNextPage)
      return
    const requestId = requestIdRef.current
    setIsFetchingNextPage(true)
    const page = await fetchPeople({ cursor: nextCursor, query, pageSize, limit })
    if (requestId !== requestIdRef.current)
      return
    setItems(current => [...current, ...page.items])
    setNextCursor(page.nextCursor)
    setIsFetchingNextPage(false)
  }, [isFetchingNextPage, limit, nextCursor, pageSize, query])

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
