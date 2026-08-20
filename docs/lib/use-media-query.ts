import { useCallback, useSyncExternalStore } from 'react'

/**
 * 首页那几个装饰效果的开关。
 *
 * 走 useSyncExternalStore 而不是 useState + useEffect:matchMedia 本来就是个
 * 外部 store,这个 hook 只是订阅它。顺带白拿两件事 —— 服务端快照恒为 false,
 * 所以 SSR 期这些效果一律不渲染(WebGL 在服务端也无事可做),而且首帧客户端
 * 渲染与服务端一致,不会有 hydration 不匹配。
 *
 * 两个用法都在 home-backdrop / home-cursor 里:
 * - `(prefers-reduced-motion: reduce)` —— 用户明说了不要动效,就整个不挂
 * - `(pointer: fine)` —— 没有鼠标时这两个效果都失去意义,见各自的注释
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
