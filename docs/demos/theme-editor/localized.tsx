import type { ReactElement } from 'react'
import { ThemeEditor } from '@gedatou/cadenza-ui'

// 一体化工具组件的文案通道:平铺的 *Label 字符串 props,默认英文,
// 逐条传译文即可整体换语言;分组标题跟着 groups 数据走
export default function LocalizedDemo(): ReactElement {
  return (
    <ThemeEditor
      aria-label="主题编辑器"
      applyLabel="应用导入"
      cancelLabel="取消"
      className="static items-start"
      closeLabel="关闭编辑器"
      exportLabel="导出 CSS"
      defaultOpen
      editingDarkLabel="正在编辑:暗色"
      editingLightLabel="正在编辑:亮色"
      groups={[
        { label: '主色', tokens: ['--primary', '--primary-foreground'] },
        { label: '破坏性', tokens: ['--destructive'] },
      ]}
      importErrorLabel="没有解析到可编辑的 token"
      importLabel="导入"
      redoLabel="重做"
      resetLabel="重置"
      storageKey={null}
      titleLabel="主题编辑器"
      undoLabel="撤回"
    />
  )
}
