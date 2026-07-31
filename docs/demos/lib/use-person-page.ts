import type { Person } from './people'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPeoplePage } from './people'

// 数据适配器:offset 分页。真实项目里通常是 react-query 的 useQuery。
export function usePersonPage(page: number, limit: number): {
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
