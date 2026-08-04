import type { ReactElement } from 'react'
import { DataPagination } from '@gedatou/cadenza-ui'

// 全部文案自定义:pageIndicator 换掉默认的「3 / 13」,图标按钮的
// aria-label 传译文;不需要每页条数选择器时直接关掉
export default function LabelsDemo(): ReactElement {
  return (
    <DataPagination
      defaultPage={3}
      firstPageLabel="第一页"
      lastPageLabel="最后一页"
      nextPageLabel="下一页"
      pageIndicator={({ page, totalPages }) => `第 ${page} 页,共 ${totalPages} 页`}
      previousPageLabel="上一页"
      limitOptions={[]}
      summary={({ page, limit, total }) => {
        const start = (page - 1) * limit + 1
        const end = Math.min(page * limit, total)
        return `第 ${start}–${end} 条,共 ${total} 条`
      }}
      total={253}
    />
  )
}
