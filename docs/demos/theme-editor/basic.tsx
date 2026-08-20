import type { ReactElement } from 'react'
import { ThemeEditor } from '@gedatou/cadenza-ui'

// 库组件默认 fixed 悬浮在视口右下;demo 里用 className 覆盖成内联静置。
// storageKey={null} 让 demo 实例不碰 localStorage,不与站点右下角的全局
// 实例抢同一份存储。注入是文档级的——在这里改 token,整站立即跟着变
export default function BasicDemo(): ReactElement {
  return <ThemeEditor className="static items-start" defaultOpen storageKey={null} />
}
