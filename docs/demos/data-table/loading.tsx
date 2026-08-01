import type { ReactElement } from 'react'
import type { Person } from '../lib/people'
import { DataTable } from '@gedatou/cadenza-ui'
import { personColumns } from './columns'

// 首屏加载:isLoading 且还没有行 —— 卡片给最低高度防坍缩,
// 磨砂覆盖层就是加载视觉,没有文案插槽
export default function LoadingDemo(): ReactElement {
  return (
    <DataTable<Person> aria-label="作曲家(加载中)" columns={personColumns} isLoading items={[]} />
  )
}
