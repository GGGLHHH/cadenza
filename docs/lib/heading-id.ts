/**
 * 标题文本 → 锚点 id。与 TOC 的 slug 规则保持一致；mdx 渲染的兜底 id 与
 * 组件检索索引里的 `url#anchor` 共用这一份，两边才指向同一个位置。
 */
export function headingId(text: string): string | undefined {
  const id = text
    .trim()
    .replace(/\s+/g, '-')
    .replace(/['?]/g, '')
    .toLowerCase()

  return id === '' ? undefined : id
}
