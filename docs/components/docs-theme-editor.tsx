'use client'

import type { ReactElement } from 'react'
import { ThemeEditor } from '@gedatou/cadenza-ui'
import { useParams } from 'next/navigation'

// 这层 wrapper 不是装饰:dev 下 next.config 把库 alias 到源码(换 Fast
// Refresh),而源码不是每个文件都带 'use client'(统一 banner 在 dist 上)——
// RSC 的 layout 直接 import 库入口会撞上无指令的模块。在这里立 client 边界,
// 顺便收拢 docs 站的中文文案与分组配置
const GROUPS = [
  { label: '基础', tokens: ['--background', '--foreground'] },
  { label: '主色', tokens: ['--primary', '--primary-foreground'] },
  { label: '次要', tokens: ['--secondary', '--secondary-foreground'] },
  { label: '弱化', tokens: ['--muted', '--muted-foreground'] },
  { label: '强调', tokens: ['--accent', '--accent-foreground'] },
  { label: '破坏性', tokens: ['--destructive'] },
  { label: '卡片', tokens: ['--card', '--card-foreground'] },
  { label: '弹层', tokens: ['--popover', '--popover-foreground'] },
  { label: '边框与焦点', tokens: ['--border', '--input', '--ring'] },
]

export function DocsThemeEditor(): ReactElement {
  const { lang } = useParams<{ lang: string }>()

  // 英文站什么都不传:ThemeEditor 的默认文案和默认分组本来就是英文
  if (lang === 'en')
    return <ThemeEditor exportFileName="cadenza-theme.css" />

  return (
    <ThemeEditor
      aria-label="主题编辑器"
      applyLabel="应用导入"
      cancelLabel="取消"
      closeLabel="关闭编辑器"
      exportFileName="cadenza-theme.css"
      exportLabel="导出 CSS"
      editingDarkLabel="正在编辑:暗色"
      editingLightLabel="正在编辑:亮色"
      groups={GROUPS}
      importErrorLabel="没有解析到可编辑的 token,确认粘贴的是 :root / .dark 格式的 CSS"
      importLabel="导入"
      redoLabel="重做"
      resetLabel="重置"
      titleLabel="主题编辑器"
      undoLabel="撤回"
    />
  )
}
