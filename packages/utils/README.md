# @gedatou/cadenza-utils

[`@gedatou/cadenza-ui`](https://www.npmjs.com/package/@gedatou/cadenza-ui) 内部使用的 React hooks，单独发包以便业务层直接复用。

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

## License

MIT
