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
    home: {
      eyebrow: 'Base UI 行为 × shadcn 外观',
      tagline: 'Base UI 负责行为与无障碍，Tailwind + cva 负责外观。',
      lede: '33 个组件、一套 base-nova token、每个文档页都能打开的主题编辑器。键盘交互与 ARIA 语义交给 Base UI，样式留给你改。',
      cta: {
        start: '开始使用',
        components: '浏览组件',
        github: 'GitHub',
      },
      install: '安装',
      installNote: 'styles.css 自带 @source，Tailwind 会自动扫描组件用到的类名，无需额外配置。',
      showcase: '这些不是截图',
      showcaseNote: '下面每块都是跑在这一页上的真组件，点标题看完整用法。',
      features: '为什么是这套',
      featureList: [
        {
          title: '行为交给 Base UI',
          body: '键盘导航、焦点管理、ARIA 语义全部由 Base UI 托管，组件层只决定长什么样。',
        },
        {
          title: 'className 双形态',
          body: '落在 Base UI 槽位上的 className 可以是字符串，也可以是 (state) => string；组件页的状态表就是那个参数的字典。',
        },
        {
          title: '主题实时可编辑',
          body: '右下角的调色盘按钮每个文档页都在，亮暗两套 token 分开调，改完导出成 CSS 直接引进项目。',
        },
        {
          title: '一行起步，需要时再拆开',
          body: '不写 children 就渲染完整的默认组合；要定制某一层时，再换成组合式写法。',
        },
      ],
      more: '从这里开始',
      nav: {
        intro: '介绍',
        themes: '主题',
        components: '组件',
        forms: '表单',
        utils: '工具',
      },
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
    home: {
      eyebrow: 'Base UI behaviour × shadcn looks',
      tagline: 'Base UI drives behaviour and accessibility, Tailwind + cva drive the looks.',
      lede: '33 components, one base-nova token set, and a theme editor you can open on any docs page. Keyboard interaction and ARIA semantics go to Base UI; the styling stays yours to change.',
      cta: {
        start: 'Get started',
        components: 'Browse components',
        github: 'GitHub',
      },
      install: 'Installation',
      installNote: 'styles.css ships with @source, so Tailwind picks up every class the components use — no extra configuration.',
      showcase: 'These are not screenshots',
      showcaseNote: 'Every block below is a real component running on this page — click a title for the full API.',
      features: 'Why this shape',
      featureList: [
        {
          title: 'Behaviour goes to Base UI',
          body: 'Keyboard navigation, focus management and ARIA semantics are all Base UI\'s job; the component layer only decides how it looks.',
        },
        {
          title: 'className in two forms',
          body: 'Any className landing on a Base UI slot can be a string or a (state) => string; each component page\'s state table doubles as the dictionary for that argument.',
        },
        {
          title: 'Themes editable live',
          body: 'The palette button sits in the corner of every docs page — tune light and dark tokens separately, then export the CSS straight into your project.',
        },
        {
          title: 'One line to start, open it up later',
          body: 'Omit children and the full default composition renders; switch to the composable form only when a layer needs customising.',
        },
      ],
      more: 'Start here',
      nav: {
        intro: 'Introduction',
        themes: 'Themes',
        components: 'Components',
        forms: 'Forms',
        utils: 'Utilities',
      },
    },
  },
} satisfies Record<string, unknown>

export type Dictionary = (typeof dictionaries)['zh']

export function getDictionary(lang: string): Dictionary {
  return lang === 'en' ? dictionaries.en : dictionaries.zh
}
