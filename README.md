# Cadenza

Base UI 负责行为与无障碍，Tailwind + cva 负责外观 —— shadcn 风格的可访问组件库。

**文档站：<https://cadenza-ui-docs.vercel.app>** —— 每个组件的交互 demo、Props 与状态表、
封装约定都在那里。

## 结构

分两层，只发布一层：

```
packages/ui/               @gedatou/cadenza-ui，tsdown 打包
  components.json          shadcn 配置：base-nova 预设，alias 走包名
  src/primitives/          shadcn add 写这里。原材料，不可变，不是公开 API
  src/hooks/               同上
  src/components/          我们的组件。唯一被发布的东西
  src/lib/utils.ts         cn()
  src/index.ts             只导出 ./components/*
  styles.css               base-nova token，@source 指向 dist
packages/utils/            @gedatou/cadenza-utils，useControllableState / resolveRenderChildren
packages/form/             @gedatou/cadenza-form，TanStack Form 门面
packages/ai/               @gedatou/cadenza-ai，TanStack AI 门面 + 会话视图
docs/                      Next.js + fumadocs（headless，自绘外壳），MDX 里直接跑 React demo
```

`src/primitives` 是 shadcn 的源码，不是我们准备的组件——原样发布等于把 shadcn 换个名字重新打包。
它们会随被引用而进入 `dist`，但身份是实现细节；没被 `src/components` 引用到的会被
tree-shaking 直接扔掉。

这条边界不只是洁癖，它决定三个数字：

| 首发时的测量（只有 Button） | 全量导出 primitives | 只导出 components |
| --- | --- | --- |
| `dist/index.mjs` | 177.8 kB | 3.6 kB |
| `dependencies` | 14 个 | 4 个 |
| 消费者 CSS（只用 Button） | 199.8 kB | 23.7 kB |

如今 36 个组件模块对应 320.7 kB / 13 个依赖 —— 体积随真正提升的组件走，边界的含义没变。

`recharts`、`embla-carousel-react` 这些是 chart / carousel 拖进来的，它们不发布就不必声明为
依赖——但仍是 `devDependencies`，因为 `tsc` 要 typecheck 全部 primitives。

## 不变量：src/primitives 不可手改

三层防护：

- `pnpm test` 对每个文件做 sha256 快照（`test/vendored-sources.test.ts`），手改立即失败
- eslint 忽略该目录，避免格式化破坏与上游的逐字节一致
- 合法更新走 `shadcn add -o` 后 `pnpm test -u` 显式接受新哈希

`src/components` 相反——那是我们的代码，正常 lint、正常测试。

## 命令

| 命令               | 作用                                    |
| ------------------ | --------------------------------------- |
| `pnpm dev`         | 并行跑 tsdown --watch 和 docs 站        |
| `pnpm build`       | 构建所有包（拓扑序：utils → ui / form → docs） |
| `pnpm test`        | vitest（jsdom + Testing Library），含 primitives 哈希校验 |
| `pnpm test -u`     | 接受新哈希，`shadcn add -o` 之后跑      |
| `pnpm typecheck`   | 各包 tsc（ui / utils / form + docs） |
| `pnpm lint`        | eslint                                  |
| `pnpm release`     | bumpp 打版本，GitHub Actions 负责发布   |

## 发布一个组件

primitives 已经全装好了。把其中一个变成公开 API 是**两步**：

1. 在 `src/components/` 建一个文件，从 primitive 转出你想暴露的东西
2. 在 `src/index.ts` 加一行导出

参考 `src/components/button.tsx`。这个文件是接缝：公开 API 的形状在这里决定，所以重命名
variant、收紧 prop、包一层 provider 都不必碰 vendored 代码、不会破坏哈希校验。它现在已经
在补 primitive 的缺口——primitive 把 props 类型内联在签名里没导出，谁想包一层都无从 import。

然后到 `docs/content/docs/components/` 加一页（demo 放 `docs/demos/`，在
`docs/demos/index.tsx` 注册）。

拉取新的 primitive：

```bash
npx shadcn@latest add -c packages/ui dialog
```

`-c packages/ui` 是必需的。`shadcn init` 源码里对非框架包直接 `process.exit(1)`
（`packages/ui` 没有 next/vite/astro 这类依赖），而 `--monorepo` 是从零生成新项目的开关，
套不到已有仓库上 —— 所以 `components.json` 按官方 monorepo 模板的形状写死（alias 用包名
`@gedatou/cadenza-ui/primitives/*`，不是 `@/*`）。`add` 不做框架检测，直接可用。

查上游有没有更新：

```bash
npx shadcn@latest add -c packages/ui button --dry-run   # identical / overwrite
npx shadcn@latest add -c packages/ui button -o          # 拉取覆盖，之后 pnpm test -u
```

注意 `--dry-run` 批量跑不可靠：两个 item 写同一文件时会误报（`input-otp` 也带 `input.tsx`，
名字不排序就会踩到），而且**一个文件真漂移会把整批标成 `overwrite`**。逐个跑才准确。

## 发布

```bash
pnpm release        # bumpp：改版本 → commit → tag vX → push
```

推 tag 触发 `.github/workflows/release.yml`：校验 tag 与 `packages/ui` 版本一致 →
构建 → 用 OIDC 可信发布推到 npm（无 NPM_TOKEN，npm 自带 provenance 溯源）。

版本由 `bump.config.ts` 管，根 `package.json` 与四个 `packages/*/package.json` 锁步。
`docs/` 是私有包，不参与版本、不发布。

**首次发布需要两步前置**，OIDC 引导不了一个不存在的包：

1. 本地手动 `pnpm --filter @gedatou/cadenza-ui publish --access public` 发出第一个版本
2. 到 npmjs.com 该包的 Settings → Trusted publishing，配上 `GGGLHHH/cadenza` 仓库和
   `release.yml` 这个 workflow

之后所有版本走 `pnpm release` 即可。

## License

[MIT](./LICENSE.md)
