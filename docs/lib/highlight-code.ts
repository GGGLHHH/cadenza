import type { ShikiTransformer } from 'shiki'
import { codeToHtml } from 'shiki'

// 构建期高亮是确定性的,站点又小,进程内 Map 就够了
// ponytail: 无界缓存,页面数量级上来了再换 LRU
const highlightCache = new Map<string, string>()

/** MDX 围栏代码块经 rehype-pretty-code 走这里:把原文挂上,CopyButton 用 */
export const transformers = [
  {
    code(node) {
      if (node.tagName === 'code')
        node.properties.__raw__ = this.source
    },
  },
] as ShikiTransformer[]

/** ComponentSource 直接调 shiki,输出与 MDX 围栏同一套 CSS 变量协议 */
export async function highlightCode(code: string, language = 'tsx'): Promise<string> {
  const key = `${language}:${code}`
  const cached = highlightCache.get(key)
  if (cached !== undefined)
    return cached

  const html = await codeToHtml(code, {
    lang: language,
    themes: {
      dark: 'vesper',
      light: 'github-light-default',
    },
    defaultColor: false,
    transformers: [
      {
        pre(node) {
          // 滚动交给外层 ScrollArea 的视口;pre 只按内容撑开(w-max)
          node.properties.class
            = 'w-max min-w-full px-4 py-3.5 outline-none has-[[data-line-numbers]]:px-0 !bg-transparent'
        },
        code(node) {
          node.properties['data-line-numbers'] = ''
        },
        line(node) {
          node.properties['data-line'] = ''
        },
      },
    ],
  })

  highlightCache.set(key, html)
  return html
}
