import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

// loader 带 i18n 后索引按语言隔离,client 用 locale 过滤;
// fumadocs-core 16 的默认 tokenizer 已是 multilingual(中文零配置),
// 旧的 mandarin tokenizer 不再需要。threshold/tolerance 置 0 仍是
// fumadocs 对中文的推荐参数(避免误召回)。
export const { GET } = createFromSource(source, {
  search: {
    threshold: 0,
    tolerance: 0,
  },
})
