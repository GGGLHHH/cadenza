import type { Person } from './people'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPeoplePage } from './people'

// Data adapter: offset pagination. In a real project this is usually
// react-query's useQuery.
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
