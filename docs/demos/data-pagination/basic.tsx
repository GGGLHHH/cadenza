import type { ReactElement } from 'react'
import { DataPagination } from '@gedatou/cadenza-ui'

// 非受控:defaultPage / defaultLimit,组件自持状态。
// 组件本身零文案 —— 摘要和「每页」标签都从外面注入
export default function BasicDemo(): ReactElement {
  return (
    <DataPagination
      defaultLimit={10}
      defaultPage={3}
      limitOptions={[10, 20, 50]}
      rowsPerPageLabel="每页"
      summary={({ total }) => `共 ${total} 条`}
      total={123}
    />
  )
}
