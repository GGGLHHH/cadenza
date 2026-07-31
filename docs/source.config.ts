import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import rehypePrettyCode from 'rehype-pretty-code'
import { transformers } from './lib/highlight-code'

export const docs = defineDocs({
  dir: 'content/docs',
})

export default defineConfig({
  mdxOptions: {
    // fumadocs 自带的 rehype-code 换成 rehype-pretty-code(shadcn docs 同款),
    // 双主题走 --shiki-light/--shiki-dark CSS 变量,样式在 globals.css
    rehypePlugins: (plugins) => {
      plugins.shift()
      plugins.push([
        rehypePrettyCode,
        {
          theme: {
            dark: 'vesper',
            light: 'github-light-default',
          },
          transformers,
        },
      ])
      return plugins
    },
  },
})
