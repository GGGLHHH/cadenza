import type { CascaderNode } from '@gedatou/cadenza-ui'
import type { ReactElement } from 'react'
import { Cascader } from '@gedatou/cadenza-ui'

// 分步异步 + 无限加载,一个 loader 全包:省、市两层逐级懒加载(返回裸数组
// = 该层一次加载完);区一层分页——返回 { items, hasNextPage },每页 20 条
// 共 3 页,滚到底哨兵自动追加,全部到齐后是渐隐横线的终止行。
// 面板首页在途时带 data-loading,由磨砂 LoadingOverlay 覆盖(InfiniteSelect
// 同款);结果缓存整个组件生命周期,关闭重开不重复请求。
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default function AsyncDemo(): ReactElement {
  return (
    <Cascader
      aria-label="地区"
      placeholder="选择地区（异步）"
      loadItems={async (path, { page }) => {
        await sleep(500)
        if (path.length < 2) {
          const kind = path.length === 0 ? '省' : '市'
          return Array.from({ length: 6 }, (_, index): CascaderNode => ({
            value: `${path.at(-1) ?? 'r'}-${index}`,
            label: `${kind} ${index + 1}`,
          }))
        }
        return {
          items: Array.from({ length: 20 }, (_, index): CascaderNode => {
            const ordinal = page * 20 + index + 1
            return { value: `${path.at(-1)}-${ordinal}`, label: `区 ${ordinal}`, leaf: true }
          }),
          hasNextPage: page < 2,
        }
      }}
    />
  )
}
