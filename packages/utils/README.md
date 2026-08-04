# @gedatou/cadenza-utils

[`@gedatou/cadenza-ui`](https://www.npmjs.com/package/@gedatou/cadenza-ui) 内部使用的 React hooks，单独发包以便业务层直接复用。
文档：<https://cadenza-ui-docs.vercel.app/docs/utils/use-controllable-state>。

## 安装

```bash
pnpm add @gedatou/cadenza-utils
```

## useControllableState

一个状态，两种用法：外部传 `value` 就是受控，不传就自己管。组件作者写一次，调用方两种写法都能用。

```tsx
import { useControllableState } from '@gedatou/cadenza-utils'

function Disclosure({ open, defaultOpen, onOpenChange, children }) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    fallback: false,
  })

  return (
    <>
      <button onClick={() => setOpen(!isOpen)}>切换</button>
      {isOpen && children}
    </>
  )
}
```

**`value` 非 `undefined` 即受控**：state 跟随 prop，`setOpen` 只触发 `onChange`，内部状态不动 —— 与 React 原生输入框的受控约定一致。否则 hook 自持状态，`defaultValue` 是初始值，`onChange` 照样触发。`fallback` 兜底「非受控且没给 `defaultValue`」的情形，让返回类型收窄为 `T` 而不是 `T | undefined`。

`setOpen` 是标准的 `Dispatch<SetStateAction<T>>`：接受值或 `(prev) => next` 更新函数，且引用恒定，可以安全放进依赖数组。

完整契约与进阶用法见[文档](https://github.com/GGGLHHH/cadenza)。

## resolveRenderChildren

统一解析「ReactNode 或 `(values) => ReactNode`」的双形态 children：封装层算好状态和默认组合，解析这一步交给它，各个 seam 的行为就是一致的。

```tsx
import { resolveRenderChildren } from '@gedatou/cadenza-utils'

function SearchField({ children }: { children?: RenderChildren<SearchFieldState> }) {
  const state = { empty: value === '', disabled }
  const defaultChildren = <DefaultComposition />

  return (
    <div data-slot="search-field">
      {resolveRenderChildren(children, state, defaultChildren)}
    </div>
  )
}
```

函数 children 以 `values` 外加 `defaultChildren` 为参数调用；两种形态的 nullish 结果都回落到 `defaultChildren`——函数返回 `null` 同样如此，想渲染空就别传 `defaultChildren`。是纯函数而非 hook：它不持状态、也不碰 React 的任何东西，调用点就在组件自己的 render 体里，写成 hook 只会白白背上 rules-of-hooks 的约束。文档：<https://cadenza-ui-docs.vercel.app/docs/utils/resolve-render-children>。

## License

MIT
