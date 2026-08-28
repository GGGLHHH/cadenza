# @gedatou/cadenza-ai

TanStack AI 的薄门面：`useChat` 等 React API 原样可用，provider 接入、思考强度、会话列表、
用量、附件与会话视图（基于 `@gedatou/cadenza-ui`）作为包默认提供。

**文档与交互 demo：<https://cadenza-ui-docs.vercel.app/docs/ai/conversation>**

## 用法

```bash
pnpm add @gedatou/cadenza-ai @gedatou/cadenza-ui
pnpm add @tanstack/ai-openai   # 用到哪家装哪家；adapter 都是 optional peer
```

```tsx
// 客户端
import { fetchServerSentEvents, useChat } from '@gedatou/cadenza-ai'
```

```ts
// 服务端 route handler
import { openai } from '@gedatou/cadenza-ai/providers/openai'
import { createChatHandler } from '@gedatou/cadenza-ai/server'

export const { POST, GET } = createChatHandler({ providers: [openai] })
```

```tsx
// 无密钥的假流（demo / 测试）
import { useChat } from '@gedatou/cadenza-ai'
import { scripted, text } from '@gedatou/cadenza-ai/mock'

function Demo() {
  const chat = useChat({ fetcher: scripted(() => [text('Hello')]) })
  return <pre>{JSON.stringify(chat.messages)}</pre>
}
```

入口 CSS（streamdown 的样式与 KaTeX 都在里面；再让 Tailwind 扫到 streamdown 的产物）：

```css
@import "@gedatou/cadenza-ai/styles.css";
@source "../node_modules/streamdown/dist/*.js";
```

## 文档

- [会话](https://cadenza-ui-docs.vercel.app/docs/ai/conversation) — `useChat` 接线与 Transcript 家族
- [消息部件](https://cadenza-ui-docs.vercel.app/docs/ai/parts) — Markdown、推理、工具、审批、附件、来源、结构化输出
- [输入区](https://cadenza-ui-docs.vercel.app/docs/ai/composer) — 输入、附件、模型与思考强度、建议、排队、听写
- [会话列表](https://cadenza-ui-docs.vercel.app/docs/ai/threads) — 线程索引与本地持久化
- [接入提供者](https://cadenza-ui-docs.vercel.app/docs/ai/providers) — 目录、thinking 映射、BYOK、route handler
- [脚本化传输](https://cadenza-ui-docs.vercel.app/docs/ai/scripted) — `./mock` 的步骤 DSL
- [试玩](https://cadenza-ui-docs.vercel.app/docs/ai/playground) — 用自己的 key 跑真模型

## 与官方 API 的差异

- 根入口 `export * from '@tanstack/ai-react'`，不覆盖任何上游导出；本包新增的导出不与上游同名。
- 密钥走官方 BYOK relay 形态（浏览器 `x-byok-<id>` 头 → 你的 route handler），不做浏览器直连。
- 思考强度统一为七级 `ThinkingLevel`（`off | minimal | low | medium | high | xhigh | max`），
  由各 provider preset 翻译成自己的 `modelOptions`。
- 服务端只从 `forwardedProps` 读 `provider` / `model` / `thinking` 三个键。

## License

[MIT](../../LICENSE.md)
