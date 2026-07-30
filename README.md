# Cadenza

React Aria 负责行为与无障碍，Tailwind + cva 负责外观 —— shadcn 风格的可访问组件库。

## 结构

```
packages/ui/          @cadenza/ui —— 组件源码，tsdown 打包
  src/components/     每个组件一个文件
  src/lib/utils.ts    cn()
  styles.css          设计 token，@source 指向 dist
docs/                 Astro + Starlight 文档站，MDX 里直接跑 React 组件
```

## 命令

| 命令               | 作用                                    |
| ------------------ | --------------------------------------- |
| `pnpm dev`         | 并行跑 tsdown --watch 和 docs 站        |
| `pnpm build`       | 构建所有包（拓扑序：ui → docs）         |
| `pnpm test`        | vitest（jsdom + Testing Library）       |
| `pnpm typecheck`   | 根 tsc + docs 的 astro sync && tsc      |
| `pnpm lint`        | eslint                                  |
| `pnpm release`     | bumpp 打版本，GitHub Actions 负责发布   |

## 加一个组件

照着 `packages/ui/src/components/button.tsx` 抄：React Aria 组件负责行为并吐出 `data-*`
状态属性，`cva` 用 `data-[hovered]` / `data-[pressed]` / `data-[focus-visible]` 这类
Tailwind 变体上样式，不需要 render props。然后在 `src/index.ts` 导出、在
`docs/src/content/docs/components/` 加一页。

## 发布

首次需手动 `pnpm publish` 建包，然后到 `https://www.npmjs.com/package/@cadenza/ui/access`
连上 GitHub 仓库启用 [npm Trusted Publisher](https://github.com/e18e/ecosystem-issues/issues/201)。
之后 `pnpm run release` 交给 CI。

## License

[MIT](./LICENSE.md)
