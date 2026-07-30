# Cadenza

React Aria 负责行为与无障碍，Tailwind + cva 负责外观 —— shadcn 风格的可访问组件库。

## 结构

```
packages/ui/               @gedatou/cadenza-ui —— 组件源码，tsdown 打包
  components.json          shadcn 配置：aria-nova 预设，alias 走包名 @gedatou/cadenza-ui/*
  src/components/          shadcn add 生成，保持与上游逐字节一致（eslint 已排除）
  src/lib/utils.ts         cn()
  styles.css               aria-nova token，@source 指向 dist
docs/                      Astro + Starlight 文档站，MDX 里直接跑 React 组件
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

```bash
npx shadcn@latest add -c packages/ui dialog
```

`-c packages/ui` 是必需的。`shadcn init` 源码里对非框架包直接 `process.exit(1)`
（`packages/ui` 没有 next/vite/astro 这类依赖），而 `--monorepo` 是从零生成新项目的
开关，套不到已有仓库上 —— 所以 `packages/ui/components.json` 按官方 monorepo 模板的
形状写死（alias 用包名 `@gedatou/cadenza-ui/*`，不是 `@/*`）。`add` 不做框架检测，直接可用。

生成后在 `src/index.ts` 导出，再到 `docs/src/content/docs/components/` 加一页。
`src/components/` 下的文件保持与上游逐字节一致（eslint 已排除该目录），这样
`--dry-run` 报的 identical / modified 才能真实反映上游有没有更新：

```bash
npx shadcn@latest add -c packages/ui button --dry-run   # 查上游有无更新
npx shadcn@latest add -c packages/ui button -o          # 拉取覆盖
```

## 发布

```bash
pnpm release        # bumpp：改版本 → commit → tag vX → push
```

推 tag 触发 `.github/workflows/release.yml`：校验 tag 与 `packages/ui` 版本一致 →
构建 → 用 OIDC 可信发布推到 npm（无 NPM_TOKEN，npm 自带 provenance 溯源）。

版本由 `bump.config.ts` 管，根 `package.json` 和 `packages/ui/package.json` 锁步。
`docs/` 是私有包，不参与版本、不发布。

**首次发布需要两步前置**，OIDC 引导不了一个不存在的包：

1. 本地手动 `pnpm --filter @gedatou/cadenza-ui publish --access public` 发出第一个版本
2. 到 npmjs.com 该包的 Settings → Trusted publishing，配上 `GGGLHHH/cadenza` 仓库和
   `release.yml` 这个 workflow

之后所有版本走 `pnpm release` 即可。

## License

[MIT](./LICENSE.md)
