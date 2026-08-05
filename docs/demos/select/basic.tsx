import type { ReactElement } from 'react'
import { Select } from '@gedatou/cadenza-ui'

// 一行式:不给 children 就渲染完整默认组合 —— 触发器、回显、清除 ✕、
// 弹层、选项全部来自 items。清除默认在场(clearable={false} 关掉)。
// 要定制任何一层时再写 children,组合示例见「分组」。
const VOICES = {
  soprano: '女高音',
  alto: '女中音',
  tenor: '男高音',
  bass: '男低音',
}

export default function BasicDemo(): ReactElement {
  return <Select aria-label="声部" items={VOICES} placeholder="选一个声部" />
}
