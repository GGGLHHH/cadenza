import { createTokenizer } from '@orama/tokenizers/mandarin'
import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

// 中英混排内容:Orama 默认按英文分词,中文查询会搜不到,换 mandarin tokenizer;
// threshold/tolerance 置 0 是 fumadocs 对中文的推荐参数(避免误召回)
export const { GET } = createFromSource(source, {
  tokenizer: createTokenizer(),
  search: {
    threshold: 0,
    tolerance: 0,
  },
})
