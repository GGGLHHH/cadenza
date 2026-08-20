// 外壳可见文案的双语字典。纯数据,server/client 都可 import;
// 组件收 lang prop 自取译文,不逐条穿 props。
// MDX 正文与 meta.json 不走这里 —— 那是 fumadocs i18n 按语言文件管的。
const dictionaries = {
  zh: {
    header: {
      docs: '文档',
      components: '组件',
      switchToEnglish: 'Switch to English',
      switchToChinese: '切换到中文',
    },
    search: {
      placeholder: '搜索文档...',
      open: '搜索',
      close: '关闭搜索',
      dialog: '搜索文档',
      hint: '输入关键词搜索文档',
      error: '搜索服务出错,请重试',
      empty: '没有找到相关内容',
    },
    toc: '本页目录',
    themeToggle: '切换主题',
    copy: '复制',
    pager: {
      previous: '上一页',
      next: '下一页',
    },
  },
  en: {
    header: {
      docs: 'Docs',
      components: 'Components',
      switchToEnglish: 'Switch to English',
      switchToChinese: '切换到中文',
    },
    search: {
      placeholder: 'Search docs...',
      open: 'Search',
      close: 'Close search',
      dialog: 'Search docs',
      hint: 'Type a keyword to search the docs',
      error: 'Search failed, please retry',
      empty: 'No results found',
    },
    toc: 'On this page',
    themeToggle: 'Toggle theme',
    copy: 'Copy',
    pager: {
      previous: 'Previous page',
      next: 'Next page',
    },
  },
} satisfies Record<string, unknown>

export type Dictionary = (typeof dictionaries)['zh']

export function getDictionary(lang: string): Dictionary {
  return lang === 'en' ? dictionaries.en : dictionaries.zh
}
