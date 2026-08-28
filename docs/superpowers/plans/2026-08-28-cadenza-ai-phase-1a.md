# cadenza-ai Phase 1a — 包骨架、目录、thinking、mock、服务端与前四个 provider 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建起 `@gedatou/cadenza-ai` 包（root / `./server` / `./providers/<id>` / `./mock` 四入口），交付客户端目录与 thinking 归一、脚本化 transport、服务端 route handler 工厂，以及 openai / anthropic / gemini / openrouter 四个 preset，并让 docs 站的 `/api/ai/chat` 与 `/api/ai/catalog` 用真实 key 走通。

**Architecture:** 门面包（`export * from '@tanstack/ai-react'`）；catalog 是同构纯数据，不 import 任何 adapter；`./server` 的 `createChatHandler` 把 `chatParamsFromRequest → pickSelection（三键白名单）→ getByokKey/byokMissing → preset.create → preset.thinking → chat() → toServerSentEventsResponse` 接成一条线；`./providers/<id>` 每文件只 import 自己的 `@tanstack/ai-<id>`（optional peer）；`./mock` 的 `scripted()` 是 `ChatFetcher`（不是 `stream()`——后者丢 `runContext`），把步骤 DSL 翻成 AG-UI 事件。视图与运行时惯例（threads/usage/renderers/附件）在 Phase 1b。

**Tech Stack:** `@tanstack/ai` 0.51 / `ai-client` 0.29 / `ai-react` 0.22、adapter 包（openai 0.22 / anthropic 0.18 / gemini 0.26 / openrouter 0.19）、tsdown、vitest（jsdom + node）、Next 16 route handler。

**Spec:** `docs/superpowers/specs/2026-08-28-cadenza-ai-design.md` §形态、§包工程、§API 面（root 目录 / server / providers / mock）、§服务端、§客户端运行时「脚本化 transport」、§测试、附录 A。

## Global Constraints

- 包名 `@gedatou/cadenza-ai`，版本 `0.7.0`，`publishConfig.access: public`；上游 `@tanstack/ai`、`ai-client`、`ai-react` 是 dependency；13 个 `@tanstack/ai-<id>` 与 `@tanstack/ai-persistence` 是 optional peer。
- **root 入口永不 import 任何 `@tanstack/ai-<id>`**；`pnpm build` 后 `grep '@tanstack/ai-' packages/ai/dist/index.d.mts` 必须为空。
- `'use client'` banner 只打在 `index.mjs` 与 `mock/index.mjs`（tsdown `banner: ({ fileName }) => …`，ctx 只有 `format`/`fileName`）；`server`/`providers` 不带。
- `ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'`（七级）。
- `forwardedProps` 只读 `provider` / `model` / `thinking` 三键；`model` 必须匹配 `/^[\w.\-:\/~]{1,200}$/`；**永远不 spread 进 `chat()`**。
- 判别审批 interrupt 用 `metadata.kind === 'approval'`，客户端工具用 `'client_tool'`；脚本化 transport **不发 `MESSAGES_SNAPSHOT`**。
- 新三方依赖先进 `pnpm-workspace.yaml` `catalogs.ui`（版本以 npm 2026-08-28 为准，见 spec §包工程）。
- 每个 PR 只跑限定路径的 `eslint` 与 `vitest run packages/ai`；全仓 `pnpm lint` 会被 `.gitnexus` 缓存绊倒。
- 不起 dev server、不 kill 进程（3000 是用户的；自己起用 3001 并记 PID）。
- 提交 AG 规范 + trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`；不 push。
- 引用约定同 spec：`$TS` = `node_modules/@tanstack/`（研究 probe 在 scratchpad `probe/node_modules/@tanstack/`，装进仓库后以仓库内为准）。

---

### Task 1: 包骨架与仓库接线（PR-1 的第一步）

**Files:**
- Modify: `pnpm-workspace.yaml`（`catalogs.ui` 加 `@tanstack/ai ^0.51.0`、`@tanstack/ai-client ^0.29.1`、`@tanstack/ai-react ^0.22.3`、`@tanstack/ai-persistence ^0.5.3`、`@tanstack/ai-openai ^0.22.2`、`@tanstack/ai-anthropic ^0.18.2`、`@tanstack/ai-gemini ^0.26.3`、`@tanstack/ai-grok ^0.18.2`、`@tanstack/ai-groq ^0.7.2`、`@tanstack/ai-mistral ^0.5.2`、`@tanstack/ai-openrouter ^0.19.4`、`@tanstack/ai-vercel-gateway ^0.2.4`、`@tanstack/ai-llmgateway ^0.1.4`、`@tanstack/ai-bedrock ^0.3.2`、`@tanstack/ai-vertex ^0.2.4`、`@tanstack/ai-ollama ^0.10.2`、`streamdown ^2.6.0`、`@streamdown/code ^1.1.1`、`@streamdown/math ^1.0.2`、`@streamdown/cjk ^1.0.3`、`katex ^0.18.4`）
- Create: `packages/ai/package.json`、`packages/ai/tsdown.config.ts`、`packages/ai/tsconfig.json`、`packages/ai/README.md`、`packages/ai/styles.css`、`packages/ai/src/index.ts`、`packages/ai/src/server/index.ts`、`packages/ai/src/mock/index.ts`
- Modify: `docs/package.json`、`docs/next.config.ts`、`bump.config.ts`、`README.md`（根）
- Test: `packages/ai/test/entry.test.ts`

**Interfaces:**
- Produces: 四个入口可 import；`@gedatou/cadenza-ai` 转出 `useChat` 等 12 个 hook、`defineByok` 族、`toolDefinition/EventType/generateMessageId/parsePartialJSON/fromSpecTokenUsage`；`./server` 转出 `chat/toolDefinition/chatParamsFromRequest/mergeAgentTools/toServerSentEventsResponse/memoryStream/maxIterations/getByokKey/byokMissing/defineByokProvider`

- [ ] **Step 1: 写失败测试**

```ts
// packages/ai/test/entry.test.ts
import { describe, expect, it } from 'vitest'

describe('entry points', () => {
  it('re-exports the TanStack React surface and the byok helpers from the root', async () => {
    const root = await import('../src/index')
    expect(typeof root.useChat).toBe('function')
    expect(typeof root.fetchServerSentEvents).toBe('function')
    expect(typeof root.indexedDBPersistence).toBe('function')
    expect(typeof root.defineByok).toBe('function')
    expect(typeof root.memoryStorage).toBe('function')
    expect(typeof root.toolDefinition).toBe('function')
    expect(root.EventType.RUN_FINISHED).toBe('RUN_FINISHED')
    expect(typeof root.fromSpecTokenUsage).toBe('function')
  })

  it('re-exports the server surface from ./server', async () => {
    const server = await import('../src/server/index')
    expect(typeof server.chat).toBe('function')
    expect(typeof server.chatParamsFromRequest).toBe('function')
    expect(typeof server.toServerSentEventsResponse).toBe('function')
    expect(typeof server.getByokKey).toBe('function')
    expect(typeof server.byokMissing).toBe('function')
    expect(typeof server.defineByokProvider).toBe('function')
    expect(typeof server.maxIterations).toBe('function')
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — `pnpm vitest run packages/ai/test/entry.test.ts` → FAIL（包不存在）

- [ ] **Step 3: 写 package.json / tsdown / tsconfig / styles.css / README / 三个入口**

`packages/ai/package.json`：按 spec §包工程 的 jsonc 原样落地（去注释；`peerDependenciesMeta` 对 13 个 `@tanstack/ai-<id>` 与 `@tanstack/ai-persistence` 各写 `{ "optional": true }`；`devDependencies` 含全部 adapter + `@tanstack/ai-persistence` 供 typecheck 与 drift 测试）。

`packages/ai/tsdown.config.ts`：spec §构建 的代码原样（`readdirSync('src/providers')` 生成 entry；banner 按 `fileName`）。`src/providers/` 此时为空目录会让 `readdirSync` 返回 `[]`——先放 `.gitkeep` 会被当成 entry，所以 `readdirSync(...).filter(f => f.endsWith('.ts'))`。

`packages/ai/tsconfig.json`：`{ "extends": "../../tsconfig.json", "compilerOptions": { "types": ["node"] }, "include": ["src", "test", "tsdown.config.ts"] }`。

`packages/ai/styles.css`：
```css
@import 'streamdown/styles.css';
@import 'katex/dist/katex.min.css';
@source './dist';
```

`packages/ai/src/index.ts`：
```ts
export {
  defaultByokStorage,
  defineByok,
  isPasskeyStorageSupported,
  memoryStorage,
  passkeyStorage,
} from '@tanstack/ai-client/byok'
export type { ByokClient, ByokPrompt, ByokSnapshot, KeyringStorage, KeyStatus } from '@tanstack/ai-client/byok'
export * from '@tanstack/ai-react'
export {
  EventType,
  fromSpecTokenUsage,
  generateMessageId,
  parsePartialJSON,
  toolDefinition,
} from '@tanstack/ai/client'
export type { AnyClientTool, InferToolInput, InferToolOutput, ThinkingPart } from '@tanstack/ai/client'
// 后续任务在此追加：catalog / runtime / view
```

`packages/ai/src/server/index.ts`：
```ts
export {
  chat,
  chatParamsFromRequest,
  maxIterations,
  memoryStream,
  mergeAgentTools,
  toolDefinition,
  toServerSentEventsResponse,
} from '@tanstack/ai'
export { defineByokProvider } from '@tanstack/ai/byok'
export { byokMissing, getByokKey } from '@tanstack/ai/byok/server'
// 后续任务在此追加：preset / selection / chat-handler / catalog-handler
```

`packages/ai/src/mock/index.ts` 先只放 `export {}`（Task 4 填）。

`packages/ai/README.md`（中文，form 先例结构）：一句定位 → `## 用法`（四入口各三行）→ `## 与官方 API 的差异`（`useChat` 原样；新增导出不与上游同名；BYOK relay；七级 thinking）。

- [ ] **Step 4: 仓库接线**

- `docs/package.json` dependencies 加 `"@gedatou/cadenza-ai": "workspace:*"`、`"@tanstack/ai-persistence": "catalog:ui"`、`"streamdown": "catalog:ui"`、12 个 `"@tanstack/ai-<id>": "catalog:ui"`。
- `docs/next.config.ts` `sourceAlias` 加：`'@gedatou/cadenza-ai': '../packages/ai/src/index.ts'`、`'@gedatou/cadenza-ai/server': '../packages/ai/src/server/index.ts'`、`'@gedatou/cadenza-ai/mock': '../packages/ai/src/mock/index.ts'`，以及 `'@gedatou/cadenza-ai/providers/<id>': '../packages/ai/src/providers/<id>.ts'` ×14（openai anthropic gemini grok groq mistral openrouter vercel-gateway llmgateway bedrock vertex ollama openai-compatible byteplus——先列全，文件在 Task 6 / Phase 2 补齐；turbopack 对缺失文件的 alias 只在被 import 时报错）；`transpilePackages` 加 `'@gedatou/cadenza-ai'`。
- `bump.config.ts` `files` 加 `'packages/ai/package.json'`。
- 根 `README.md` 结构表加一行 `packages/ai`；「三个 packages/*/package.json」改「四个」。
- `pnpm install`（catalog 变更后 lockfile 更新）。

- [ ] **Step 5: 跑测试确认通过** — `pnpm vitest run packages/ai/test/entry.test.ts` PASS；`pnpm --filter @gedatou/cadenza-ai run build` 产出 `dist/index.mjs`（首行 `'use client'`）、`dist/server/index.mjs`（无 banner）、`dist/mock/index.mjs`（有）；`grep '@tanstack/ai-' packages/ai/dist/index.d.mts` 为空。

---

### Task 2: 目录（catalog）——类型、thinking 归一、成本、纯数据 provider 表

**Files:**
- Create: `packages/ai/src/catalog/types.ts`、`thinking.ts`、`cost.ts`、`catalog.ts`、`index.ts`
- Create: `packages/ai/src/catalog/providers/{openai,anthropic,gemini,grok,groq,mistral,openrouter,vercel-gateway,llmgateway,bedrock,vertex,ollama}.ts`
- Modify: `packages/ai/src/index.ts`（追加 `export * from './catalog'`）
- Test: `packages/ai/test/thinking.test.ts`、`packages/ai/test/catalog.test.ts`、`packages/ai/test/catalog-drift.test.ts`（`// @vitest-environment node`）

**Interfaces:**
- Produces: 类型 `ThinkingLevel`、`Modality`（re-alias `@tanstack/ai` 的）、`ModelCost`、`Model`、`Provider`、`Catalog`；常量 `THINKING_LEVELS`、`providers`、`defaultCatalog`；函数 `supportedThinkingLevels(model?)`、`clampThinkingLevel(model?, level)`、`estimateCost(model, usage)`、`createCatalog(providers)`、`modelRef(model)`、`parseModelRef(ref)`

- [ ] **Step 1: 写失败测试（thinking + catalog）**

```ts
import type { Model } from '../src/catalog/types'
// packages/ai/test/thinking.test.ts
import { describe, expect, it } from 'vitest'
import { clampThinkingLevel, supportedThinkingLevels, THINKING_LEVELS } from '../src/catalog/thinking'

const base: Model = { id: 'm', name: 'm', provider: 'p', input: ['text'], reasoning: true }

describe('thinking levels', () => {
  it('lists seven levels in strength order', () => {
    expect(THINKING_LEVELS).toEqual(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
  })

  it('offers only off for a model without reasoning', () => {
    expect(supportedThinkingLevels({ ...base, reasoning: false })).toEqual(['off'])
    expect(supportedThinkingLevels(undefined)).toEqual(['off'])
  })

  it('offers every level for a reasoning model without an explicit list', () => {
    expect(supportedThinkingLevels(base)).toEqual(THINKING_LEVELS)
  })

  it('clamps down to the nearest supported level, and never above off', () => {
    const m: Model = { ...base, thinkingLevels: ['off', 'medium'] }
    expect(clampThinkingLevel(m, 'xhigh')).toBe('medium')
    expect(clampThinkingLevel(m, 'low')).toBe('off')
    expect(clampThinkingLevel(m, 'medium')).toBe('medium')
  })

  it('clamps up to the floor when a model cannot be switched off', () => {
    const fable: Model = { ...base, thinkingLevels: ['low', 'medium', 'high', 'xhigh', 'max'] }
    expect(clampThinkingLevel(fable, 'off')).toBe('low')
    expect(clampThinkingLevel(fable, 'minimal')).toBe('low')
  })
})
```

```ts
// packages/ai/test/catalog.test.ts
import { describe, expect, it } from 'vitest'
import { defaultCatalog, providers } from '../src/catalog'
import { createCatalog, modelRef, parseModelRef } from '../src/catalog/catalog'
import { estimateCost } from '../src/catalog/cost'

describe('catalog', () => {
  it('resolves a model ref through the provider', () => {
    const model = defaultCatalog.getModel('openai/gpt-5.2')
    expect(model?.provider).toBe('openai')
    expect(modelRef(model!)).toBe('openai/gpt-5.2')
    expect(parseModelRef('openai/gpt-5.2')).toEqual({ provider: 'openai', id: 'gpt-5.2' })
    // OpenRouter ids contain a slash themselves — only the first one is the provider
    expect(parseModelRef('openrouter/anthropic/claude-sonnet-5')).toEqual({ provider: 'openrouter', id: 'anthropic/claude-sonnet-5' })
  })

  it('is immutable: withProvider returns a new catalog', () => {
    const custom = { id: 'local', label: 'Local', byok: null, keyRequired: false, runtime: 'local' as const, models: [] }
    const next = defaultCatalog.withProvider(custom)
    expect(next.getProvider('local')).toBe(custom)
    expect(defaultCatalog.getProvider('local')).toBeUndefined()
    expect(next.withoutProvider('local').getProvider('local')).toBeUndefined()
  })

  it('every provider id is a valid BYOK slug and keyRequired matches byok', () => {
    for (const p of Object.values(providers)) {
      expect(p.id).toMatch(/^[a-z][a-z0-9-]{0,63}$/)
      if (p.byok)
        expect(p.byok.id).toBe(p.id)
    }
  })

  it('estimates cost in USD from per-million pricing, counting cached input separately', () => {
    const model = { id: 'm', name: 'm', provider: 'p', input: ['text' as const], reasoning: false, cost: { input: 2, output: 10, cacheRead: 0.5 } }
    const usd = estimateCost(model, { promptTokens: 1_000_000, completionTokens: 100_000, totalTokens: 1_100_000, promptTokensDetails: { cachedTokens: 500_000 } })
    // 500k fresh @2 + 500k cached @0.5 + 100k output @10
    expect(usd).toBeCloseTo(1 + 0.25 + 1, 6)
    expect(estimateCost({ ...model, cost: undefined }, { promptTokens: 1, completionTokens: 1, totalTokens: 2 })).toBeUndefined()
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — 两个文件 FAIL（模块不存在）

- [ ] **Step 3: 写 types / thinking / cost / catalog**

```ts
// packages/ai/src/catalog/types.ts
import type { ByokProvider } from '@tanstack/ai/byok'
import type { Modality } from '@tanstack/ai/client'

export type { Modality }

/** 七级思考强度，顺序即强度；与 pi 的 `ModelThinkingLevel` 对齐（`'xhigh'` 是 Anthropic 4.7+ / OpenRouter / LLM Gateway 的真实档位）。 */
export type ThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/** USD per 1M tokens. */
export interface ModelCost {
  input: number
  output: number
  cacheRead?: number
  cacheWrite?: number
}

export interface Model {
  id: string
  name: string
  provider: string
  input: readonly Modality[]
  reasoning: boolean
  contextWindow?: number
  maxOutputTokens?: number
  cost?: ModelCost
  /** 缺省 = `reasoning ? THINKING_LEVELS : ['off']`。 */
  thinkingLevels?: readonly ThinkingLevel[]
}

export interface Provider {
  /** BYOK slug（`x-byok-<id>` 头），必须匹配 `/^[a-z][a-z0-9-]{0,63}$/`。 */
  id: string
  label: string
  byok: ByokProvider | null
  /** false = 无 key 也能跑（vertex 走 ADC，ollama 走 env host）。 */
  keyRequired: boolean
  runtime: 'node' | 'local'
  models: readonly Model[]
}

export interface Catalog {
  readonly providers: readonly Provider[]
  readonly models: readonly Model[]
  getProvider: (id: string) => Provider | undefined
  getModel: (ref: string) => Model | undefined
  withProvider: (provider: Provider) => Catalog
  withoutProvider: (id: string) => Catalog
}
```

```ts
// packages/ai/src/catalog/thinking.ts
import type { Model, ThinkingLevel } from './types'

export const THINKING_LEVELS: readonly ThinkingLevel[] = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']

export function supportedThinkingLevels(model: Model | undefined): readonly ThinkingLevel[] {
  if (!model || !model.reasoning)
    return ['off']
  return model.thinkingLevels ?? THINKING_LEVELS
}

/**
 * 向下取最近支持档；目标低于模型下限（Fable 5 这类不可关的模型）时取下限。
 */
export function clampThinkingLevel(model: Model | undefined, level: ThinkingLevel): ThinkingLevel {
  const supported = supportedThinkingLevels(model)
  if (supported.includes(level))
    return level
  const rank = (l: ThinkingLevel): number => THINKING_LEVELS.indexOf(l)
  const below = supported.filter(l => rank(l) < rank(level))
  if (below.length > 0)
    return below[below.length - 1]!
  return supported[0]!
}
```

```ts
// packages/ai/src/catalog/cost.ts
import type { TokenUsage } from '@tanstack/ai/client'
import type { Model } from './types'

/** USD；`cost` 缺失返回 undefined。cached 部分按 `cacheRead`（缺省同 `input`）计价。 */
export function estimateCost(model: Model, usage: TokenUsage): number | undefined {
  const cost = model.cost
  if (!cost)
    return undefined
  const cached = usage.promptTokensDetails?.cachedTokens ?? 0
  const fresh = Math.max(usage.promptTokens - cached, 0)
  const cacheRead = cost.cacheRead ?? cost.input
  return (fresh * cost.input + cached * cacheRead + usage.completionTokens * cost.output) / 1_000_000
}
```

```ts
// packages/ai/src/catalog/catalog.ts
import type { Catalog, Model, Provider } from './types'

export function modelRef(model: Pick<Model, 'provider' | 'id'>): string {
  return `${model.provider}/${model.id}`
}

/** 只切第一个斜杠：OpenRouter / Vercel Gateway 的模型 id 自带 `vendor/model`。 */
export function parseModelRef(ref: string): { provider: string, id: string } {
  const slash = ref.indexOf('/')
  if (slash === -1)
    return { provider: ref, id: '' }
  return { provider: ref.slice(0, slash), id: ref.slice(slash + 1) }
}

export function createCatalog(providers: readonly Provider[]): Catalog {
  const byId = new Map(providers.map(p => [p.id, p]))
  return {
    providers,
    models: providers.flatMap(p => p.models),
    getProvider: id => byId.get(id),
    getModel: (ref) => {
      const { provider, id } = parseModelRef(ref)
      return byId.get(provider)?.models.find(m => m.id === id)
    },
    withProvider: p => createCatalog([...providers.filter(x => x.id !== p.id), p]),
    withoutProvider: id => createCatalog(providers.filter(x => x.id !== id)),
  }
}
```

```ts
// packages/ai/src/catalog/index.ts
import { createCatalog } from './catalog'
import { anthropic } from './providers/anthropic'
// … 其余 11 个
export * from './catalog'
export * from './cost'
export * from './thinking'
export * from './types'

export const providers = { openai, anthropic, gemini, grok, groq, mistral, openrouter, vercelGateway, llmgateway, bedrock, vertex, ollama } as const
export const defaultCatalog = createCatalog(Object.values(providers))
```

- [ ] **Step 4: 写 12 个纯数据 provider 文件**

每个文件形如：

```ts
import type { Provider } from '../types'
// packages/ai/src/catalog/providers/openai.ts
import { defineByokProvider } from '@tanstack/ai/byok'

// sourceVersion: @tanstack/ai-openai 0.22.2 (model-meta.ts) — 升级 adapter 时 diff 这张表
export const openai: Provider = {
  id: 'openai',
  label: 'OpenAI',
  byok: defineByokProvider({ id: 'openai', label: 'OpenAI', env: 'OPENAI_API_KEY' }),
  keyRequired: true,
  runtime: 'node',
  models: [
    { id: 'gpt-5.2', name: 'GPT-5.2', provider: 'openai', input: ['text', 'image', 'document'], reasoning: true, contextWindow: 400_000, maxOutputTokens: 128_000, cost: { input: 1.75, output: 14, cacheRead: 0.175 } },
    // …
  ],
}
```

数据来源与取舍（执行者逐文件打开对应 adapter 的 `model-meta.ts` 抄）：
- `byok` 的 `id/label/env` **必须与 adapter `./byok` 导出一致**（`openaiByok` / `anthropicByok` / `geminiByok`（env `['GOOGLE_API_KEY','GEMINI_API_KEY']`）/ `grokByok`（`XAI_API_KEY`）/ `groqByok` / `mistralByok` / `openrouterByok` / `vercelGatewayByok`（`['AI_GATEWAY_API_KEY','VERCEL_OIDC_TOKEN']`）/ `ollamaByok`（无 env）；llmgateway 与 bedrock 无官方 byok 或无 env，按 spec 自定义：`llmgateway` env `LLM_GATEWAY_API_KEY`、`bedrock` env `['BEDROCK_API_KEY','AWS_BEARER_TOKEN_BEDROCK']`；`vertex` env `['GOOGLE_VERTEX_API_KEY']`、`keyRequired:false`）。catalog 文件**不 import** adapter 的 byok 常量（会把 SDK 拖进浏览器包）——用 `defineByokProvider` 重写一份，一致性由 drift 测试锁定。
- 每 provider 选 4–8 个旗舰模型：openai（gpt-5.6 / 5.5 / 5.4 / 5.2 / 5.1 / 5 / gpt-4.1 / o4-mini，以数组实际存在的为准）、anthropic（全部 12 个，元数据表就在同文件）、gemini（11 个全部）、grok（4 个全部）、groq（llama-3.3-70b-versatile / llama-3.1-8b-instant / openai/gpt-oss-120b / openai/gpt-oss-20b / qwen/qwen3-32b / moonshotai/kimi-k2-instruct-0905）、mistral（mistral-large-latest / mistral-medium-latest / mistral-small-latest / magistral-medium-latest / magistral-small-latest / pixtral-large-latest）、openrouter（10 个热门 `vendor/model`：openai/gpt-5.2、anthropic/claude-sonnet-5、google/gemini-3.5-flash、x-ai/grok-4.5、deepseek/deepseek-v4、qwen/qwen3-max、meta-llama/llama-4-maverick、mistralai/mistral-large、moonshotai/kimi-k3、openrouter/auto——以 `OPENROUTER_CHAT_MODELS` 里实际存在的 id 为准）、vercel-gateway（10 个同类）、llmgateway（14 个全部）、bedrock（Converse 目录里 6 个：Claude sonnet-4-5 / opus-4-5、Nova pro / lite、Llama、DeepSeek，以 `GENERATED_BEDROCK_MODELS` 为准）、vertex（复用 gemini 的 11 个，`provider: 'vertex'`）、ollama（8 个常见：llama3.3、qwen3、gpt-oss:20b、deepseek-r1、gemma3、mistral、phi4、llava，以 `OLLAMA_TEXT_MODELS` 为准）。
- `input` = meta `supports.input`；`reasoning` = features 含 `reasoning`/`thinking`/`extended_thinking` 或 meta 标 reasoning（各包字段名不同，执行者按包判断）；`contextWindow` = `context_window`/`context`；`maxOutputTokens` = `max_output_tokens`；`cost` = `pricing.input.normal` / `pricing.output.normal` / `pricing.input.cached`（单位已是 USD / 1M）。
- `thinkingLevels`：只在偏离缺省时写——anthropic 4.6 代 `['off','medium']`、Fable 5 `['low','medium','high','xhigh','max']`、mistral 与 bedrock Converse 全部 `['off']`（`reasoning:false` 即可，不必写）、grok-build `reasoning:false`。
- 每文件顶部一行 `// sourceVersion: @tanstack/ai-<id> <version> (model-meta.ts)`。

- [ ] **Step 5: 写 drift 测试**

```ts
// packages/ai/test/catalog-drift.test.ts
// @vitest-environment node
import { ANTHROPIC_MODELS } from '@tanstack/ai-anthropic'
import { anthropicByok } from '@tanstack/ai-anthropic/byok'
import { GEMINI_MODELS } from '@tanstack/ai-gemini'
import { geminiByok } from '@tanstack/ai-gemini/byok'
import { OPENAI_CHAT_MODELS } from '@tanstack/ai-openai'
import { openaiByok } from '@tanstack/ai-openai/byok'
import { OPENROUTER_CHAT_MODELS } from '@tanstack/ai-openrouter'
import { openrouterByok } from '@tanstack/ai-openrouter/byok'
import { describe, expect, it } from 'vitest'
import { providers } from '../src/catalog'

// 元数据表是手抄的；adapter 升级删掉模型时这里先红。
const CASES = [
  ['openai', OPENAI_CHAT_MODELS, openaiByok],
  ['anthropic', ANTHROPIC_MODELS, anthropicByok],
  ['gemini', GEMINI_MODELS, geminiByok],
  ['openrouter', OPENROUTER_CHAT_MODELS, openrouterByok],
] as const

describe('catalog drift', () => {
  it.each(CASES)('%s: every catalog model id exists in the adapter constant', (id, ids, byok) => {
    const p = providers[id as keyof typeof providers]
    const set = new Set<string>(ids)
    for (const m of p.models)
      expect(set.has(m.id), `${id}/${m.id}`).toBe(true)
    expect(p.byok?.id).toBe(byok.id)
    expect(p.byok?.env).toEqual(byok.env)
  })
})
```

Phase 2 补齐 grok/groq/mistral/vercel-gateway/llmgateway/bedrock 的 case（ollama/llmgateway 开放字符串不断言模型 id，只断言 byok）。

- [ ] **Step 6: 跑测试确认通过** — `pnpm vitest run packages/ai/test/thinking.test.ts packages/ai/test/catalog.test.ts packages/ai/test/catalog-drift.test.ts` 全 PASS；`pnpm --filter @gedatou/cadenza-ai typecheck`；`pnpm exec eslint packages/ai`。

---

### Task 3: thinking 映射（服务端）与 preset 类型

**Files:**
- Create: `packages/ai/src/server/preset.ts`、`packages/ai/src/server/thinking.ts`
- Test: `packages/ai/test/thinking-map.test.ts`

**Interfaces:**
- Produces: `ProviderPreset`、`definePreset(p)`、`resolveThinking(preset, model, level)`；各 provider 的 `thinking` 纯函数 `openaiThinking/anthropicThinking/geminiThinking/openrouterThinking`（供 Task 6 的 preset 与 Phase 2 复用）

- [ ] **Step 1: 写失败测试（快照锁映射表）**

```ts
import type { Model } from '../src/catalog/types'
// packages/ai/test/thinking-map.test.ts
import { describe, expect, it } from 'vitest'
import { THINKING_LEVELS } from '../src/catalog/thinking'
import { anthropicThinking, geminiThinking, openaiThinking, openrouterThinking } from '../src/server/thinking'

const m = (id: string, provider: string, extra: Partial<Model> = {}): Model => ({ id, name: id, provider, input: ['text'], reasoning: true, ...extra })
function table(fn: (l: Model['thinkingLevels'] extends infer _ ? any : never, model: Model) => unknown, model: Model): Record<string, unknown> {
  return Object.fromEntries(THINKING_LEVELS.map(l => [l, fn(l, model)]))
}

describe('thinking → modelOptions', () => {
  it('openai', () => {
    expect(table(openaiThinking, m('gpt-5.2', 'openai'))).toMatchInlineSnapshot()
    expect(openaiThinking('high', m('gpt-4.1', 'openai', { reasoning: false }))).toEqual({})
  })
  it('anthropic budget generation', () => {
    expect(table(anthropicThinking, m('claude-sonnet-4-5', 'anthropic'))).toMatchInlineSnapshot()
    expect(anthropicThinking('high', m('claude-opus-5', 'anthropic'))).toEqual({ thinking: { type: 'enabled', budget_tokens: 32000 } })
  })
  it('anthropic 4.6 adaptive without effort', () => {
    expect(table(anthropicThinking, m('claude-opus-4-6', 'anthropic', { thinkingLevels: ['off', 'medium'] }))).toMatchInlineSnapshot()
  })
  it('anthropic 4.7+ / sonnet 5 adaptive with output_config.effort', () => {
    expect(table(anthropicThinking, m('claude-opus-4-7', 'anthropic'))).toMatchInlineSnapshot()
    expect(anthropicThinking('off', m('claude-sonnet-5', 'anthropic'))).toEqual({ thinking: { type: 'disabled' } })
  })
  it('anthropic fable 5 cannot be switched off', () => {
    expect(anthropicThinking('off', m('claude-fable-5', 'anthropic', { thinkingLevels: ['low', 'medium', 'high', 'xhigh', 'max'] }))).toEqual({ thinking: { type: 'adaptive', display: 'summarized' }, output_config: { effort: 'low' } })
  })
  it('gemini 3.x uses thinkingLevel, 2.5 uses thinkingBudget', () => {
    expect(table(geminiThinking, m('gemini-3.5-flash', 'gemini'))).toMatchInlineSnapshot()
    expect(table(geminiThinking, m('gemini-2.5-pro', 'gemini'))).toMatchInlineSnapshot()
  })
  it('openrouter passes the effort through and disables with enabled:false', () => {
    expect(openrouterThinking('xhigh', m('anthropic/claude-sonnet-5', 'openrouter'))).toEqual({ reasoning: { effort: 'xhigh' } })
    expect(openrouterThinking('off', m('anthropic/claude-sonnet-5', 'openrouter'))).toEqual({ reasoning: { enabled: false } })
  })
})
```

首次运行 `--update` 生成 inline snapshot，然后**人工对照 spec 附录 A 逐格核对**再提交。

- [ ] **Step 2: 跑测试确认失败** — FAIL（模块不存在）

- [ ] **Step 3: 写 preset.ts 与 thinking.ts**

```ts
// packages/ai/src/server/preset.ts
import type { AnyTextAdapter } from '@tanstack/ai'
import type { Model, Provider, ThinkingLevel } from '../catalog/types'

export interface ProviderPreset extends Provider {
  create: (model: string, key: string | null) => AnyTextAdapter
  thinking: (level: ThinkingLevel, model: Model) => Record<string, unknown>
  discoverModels?: (key: string | null) => Promise<Model[]>
}

/** 恒等 + 校验 byok slug 与 preset id 一致（客户端头名 `x-byok-<id>` 由 id 生成）。 */
export function definePreset(preset: ProviderPreset): ProviderPreset {
  if (preset.byok && preset.byok.id !== preset.id)
    throw new Error(`cadenza-ai: preset "${preset.id}" declares a BYOK provider with a different id "${preset.byok.id}".`)
  return preset
}
```

```ts
import type { Model, ThinkingLevel } from '../catalog/types'
import type { ProviderPreset } from './preset'
// packages/ai/src/server/thinking.ts
import { clampThinkingLevel } from '../catalog/thinking'

type Fragment = Record<string, unknown>
type Effort3 = 'low' | 'medium' | 'high'

const EFFORT_3: Record<Exclude<ThinkingLevel, 'off'>, Effort3> = { minimal: 'low', low: 'low', medium: 'medium', high: 'high', xhigh: 'high', max: 'high' }

export function resolveThinking(preset: ProviderPreset, model: Model, level: ThinkingLevel): Fragment {
  const clamped = clampThinkingLevel(model, level)
  if (clamped === 'off' && !model.reasoning)
    return {}
  return preset.thinking(clamped, model)
}

// OpenAI Responses: reasoning.effort ∈ none|minimal|low|medium|high（text-provider-options.ts:151-177）
export function openaiThinking(level: ThinkingLevel, model: Model): Fragment {
  if (!model.reasoning)
    return {}
  if (level === 'off')
    return { reasoning: { effort: 'none' } }
  const effort = level === 'minimal' ? 'minimal' : level === 'xhigh' || level === 'max' ? 'high' : level
  return { reasoning: { effort, summary: 'auto' } }
}

const ANTHROPIC_BUDGET: Record<Exclude<ThinkingLevel, 'off'>, number> = { minimal: 1024, low: 4096, medium: 16000, high: 32000, xhigh: 48000, max: 64000 }
const ANTHROPIC_ADAPTIVE_EFFORT = new Set(['claude-opus-4-7', 'claude-opus-4-8', 'claude-sonnet-5', 'claude-fable-5'])
const ANTHROPIC_ADAPTIVE_ONLY = new Set(['claude-opus-4-6', 'claude-sonnet-4-6'])

// 四段分代的真源是 ai-anthropic model-meta.ts 的 AnthropicChatModelProviderOptionsByName；
// 按前缀猜会错（opus-5 / opus-5-fast 是 budget 代）。
export function anthropicThinking(level: ThinkingLevel, model: Model): Fragment {
  if (ANTHROPIC_ADAPTIVE_EFFORT.has(model.id)) {
    if (level === 'off')
      return { thinking: { type: 'disabled' } }
    const effort = level === 'minimal' ? 'low' : level
    return { thinking: { type: 'adaptive', display: 'summarized' }, output_config: { effort } }
  }
  if (ANTHROPIC_ADAPTIVE_ONLY.has(model.id)) {
    return level === 'off' ? { thinking: { type: 'disabled' } } : { thinking: { type: 'adaptive', display: 'summarized' } }
  }
  if (level === 'off')
    return { thinking: { type: 'disabled' } }
  return { thinking: { type: 'enabled', budget_tokens: ANTHROPIC_BUDGET[level] } }
}

const GEMINI_LEVEL: Record<Exclude<ThinkingLevel, 'off'>, 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH'> = { minimal: 'MINIMAL', low: 'LOW', medium: 'MEDIUM', high: 'HIGH', xhigh: 'HIGH', max: 'HIGH' }
const GEMINI_BUDGET: Record<Exclude<ThinkingLevel, 'off'>, number> = { minimal: 1024, low: 4096, medium: 8192, high: 16384, xhigh: 20480, max: 24576 }

export function geminiThinking(level: ThinkingLevel, model: Model): Fragment {
  const legacy = model.id.startsWith('gemini-2.')
  if (level === 'off')
    return legacy ? { thinkingConfig: { thinkingBudget: 0 } } : {}
  return legacy
    ? { thinkingConfig: { includeThoughts: true, thinkingBudget: GEMINI_BUDGET[level] } }
    : { thinkingConfig: { includeThoughts: true, thinkingLevel: GEMINI_LEVEL[level] } }
}

export function openrouterThinking(level: ThinkingLevel, _model: Model): Fragment {
  return level === 'off' ? { reasoning: { enabled: false } } : { reasoning: { effort: level } }
}

export { EFFORT_3 }
```

（Phase 2 在同文件追加 `grokThinking`/`groqThinking`/`vercelGatewayThinking`/`llmgatewayThinking`/`ollamaThinking`，用 `EFFORT_3`。）

- [ ] **Step 4: 跑测试并核对快照** — `pnpm vitest run packages/ai/test/thinking-map.test.ts -u` 生成 inline snapshot → 逐格对照 spec 附录 A → 再 `pnpm vitest run` 确认 PASS。

---

### Task 4: 脚本化 transport（`./mock`）

**Files:**
- Create: `packages/ai/src/mock/steps.ts`、`packages/ai/src/mock/run.ts`、`packages/ai/src/mock/index.ts`（覆盖占位）
- Test: `packages/ai/test/scripted.test.ts`

**Interfaces:**
- Produces: `scripted(script, options?)`、`sequence(turns)`、`respond(rules, fallback?)`、`echo(options?)`、`byokMissing(provider)`、`approvalOf(ctx, toolCallId)`、`clientResultOf(ctx, toolCallId)`、步骤构造器 `text/reasoning/tool/tool.result/custom/structured/usage/error/sleep/finish`；类型 `Script`、`ScriptContext`、`Step`、`ScriptedOptions`

- [ ] **Step 1: 写失败测试（用真实 `ChatClient` 端到端）**

```ts
// packages/ai/test/scripted.test.ts
import { ChatClient } from '@tanstack/ai-client'
import { describe, expect, it } from 'vitest'
import { approvalOf, byokMissing, reasoning, scripted, sequence, text, tool, usage } from '../src/mock'

function settle(client: ChatClient): Promise<void> {
  return new Promise((resolve) => {
    const tick = (): void => {
      if (client.getIsLoading())
        setTimeout(tick, 5)
      else
        resolve()
    }
    tick()
  })
}

describe('scripted transport', () => {
  it('streams text, reasoning and a tool call into parts, then finishes with usage', async () => {
    const fetcher = scripted(() => [reasoning('Think.'), tool('get_time', { tz: 'UTC' }, { output: { iso: '2026-08-28' } }), text('Done.'), usage({ inputTokens: 12, outputTokens: 3 })], { pace: 'instant' })
    const client = new ChatClient({ fetcher })
    client.attach()
    await client.sendMessage('hi')
    await settle(client)
    const last = client.getMessages().at(-1)!
    expect(last.role).toBe('assistant')
    const types = last.parts.map(p => p.type)
    expect(types).toContain('thinking')
    expect(types).toContain('tool-call')
    expect(types).toContain('text')
    const call = last.parts.find(p => p.type === 'tool-call')!
    expect(call.state).toBe('complete')
    expect(client.getStatus()).toBe('ready')
  })

  it('pauses on an approval interrupt and resumes with the decision on the next turn', async () => {
    const fetcher = scripted(sequence([
      [tool('move', { day: 'Fri' }, { approval: true })],
      ctx => (approvalOf(ctx, 'call-1')?.approved ? [tool.result('call-1', { moved: true }), text('Moved.')] : [text('Left alone.')]),
    ]), { pace: 'instant', toolCallId: () => 'call-1' })
    const client = new ChatClient({ fetcher })
    client.attach()
    await client.sendMessage('move it')
    await settle(client)
    const interrupts = client.getInterruptState().interrupts
    expect(interrupts).toHaveLength(1)
    expect(interrupts[0]!.kind).toBe('tool-approval')
    const approval = interrupts[0] as Extract<(typeof interrupts)[number], { kind: 'tool-approval' }>
    approval.resolveInterrupt(true)
    await settle(client)
    const last = client.getMessages().at(-1)!
    expect(last.parts.some(p => p.type === 'text' && p.content === 'Moved.')).toBe(true)
  })

  it('stops yielding once the signal aborts', async () => {
    const fetcher = scripted(() => [text('a '.repeat(500), { chunk: 'word' })], { pace: 5 })
    const client = new ChatClient({ fetcher })
    client.attach()
    const send = client.sendMessage('go')
    await new Promise(r => setTimeout(r, 30))
    client.stop()
    await send
    expect(client.getStatus()).toBe('ready')
  })

  it('byokMissing returns a 401 the client turns into a key request', async () => {
    const requests: string[] = []
    const { defineByok, memoryStorage } = await import('@tanstack/ai-client/byok')
    const byok = defineByok({ storage: memoryStorage() })
    byok.setServerCoverage({ openai: true })
    byok.subscribe(() => {
      const p = byok.getSnapshot().prompt
      if (p)
        requests.push(p.provider)
    })
    const client = new ChatClient({ fetcher: scripted(() => byokMissing('openai')), byok, byokProvider: () => 'openai' })
    client.attach()
    await client.sendMessage('hi').catch(() => {})
    await settle(client)
    expect(requests).toContain('openai')
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL

- [ ] **Step 3: 写 steps.ts / run.ts / index.ts**

`steps.ts`（纯数据）：

```ts
export type Step
  = | { kind: 'text', content: string, chunk?: 'word' | 'char' | number, pace?: number }
    | { kind: 'reasoning', content: string, chunk?: 'word' | 'char' | number, pace?: number, signature?: string }
    | { kind: 'tool', name: string, input: unknown, output?: unknown, error?: string, argsChunk?: number, approval?: boolean, client?: boolean, providerExecuted?: boolean, metadata?: Record<string, unknown>, toolCallId?: string }
    | { kind: 'tool-result', toolCallId: string, output: unknown, error?: boolean }
    | { kind: 'custom', name: string, value: unknown }
    | { kind: 'structured', object: unknown, chunk?: number }
    | { kind: 'usage', usage: { inputTokens: number, outputTokens: number, reasoningTokens?: number, cachedInputTokens?: number } }
    | { kind: 'error', message: string, code?: string }
    | { kind: 'sleep', ms: number }
    | { kind: 'finish', finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' }

export const text = (content: string, o: Omit<Extract<Step, { kind: 'text' }>, 'kind' | 'content'> = {}): Step => ({ kind: 'text', content, ...o })
export const reasoning = (content: string, o: Omit<Extract<Step, { kind: 'reasoning' }>, 'kind' | 'content'> = {}): Step => ({ kind: 'reasoning', content, ...o })
export const tool = Object.assign(
  (name: string, input: unknown, o: Omit<Extract<Step, { kind: 'tool' }>, 'kind' | 'name' | 'input'> = {}): Step => ({ kind: 'tool', name, input, ...o }),
  { result: (toolCallId: string, output: unknown, o: { error?: boolean } = {}): Step => ({ kind: 'tool-result', toolCallId, output, ...o }) },
)
export const custom = (name: string, value: unknown): Step => ({ kind: 'custom', name, value })
export const structured = (object: unknown, o: { chunk?: number } = {}): Step => ({ kind: 'structured', object, ...o })
export const usage = (u: Extract<Step, { kind: 'usage' }>['usage']): Step => ({ kind: 'usage', usage: u })
export const error = (message: string, code?: string): Step => ({ kind: 'error', message, code })
export const sleep = (ms: number): Step => ({ kind: 'sleep', ms })
export const finish = (o: { finishReason?: Extract<Step, { kind: 'finish' }>['finishReason'] } = {}): Step => ({ kind: 'finish', ...o })
```

`run.ts` 核心（`ChatFetcher` 包装 + 事件生成；类型来自 `@tanstack/ai/client`）：

```ts
import type { ChatFetcher, ChatFetcherInput, ChatFetcherOptions, RunAgentResumeItem, StreamChunk, UIMessage } from '@tanstack/ai-client'
import type { Step } from './steps'
import { EventType, generateMessageId, hashSchemaInput, INTERRUPT_BINDING_METADATA_KEY, INTERRUPT_BINDING_VERSION, normalizeApprovalSchema } from '@tanstack/ai/client'

export interface ScriptContext {
  messages: UIMessage[]
  lastUser?: UIMessage
  lastUserText: string
  data: Record<string, unknown>
  threadId: string
  runId: string
  parentRunId?: string
  resume?: RunAgentResumeItem[]
  turn: number
  signal: AbortSignal
}
export type Script = (ctx: ScriptContext) => Step[] | Iterable<Step> | AsyncIterable<Step> | Promise<Step[]> | Response
export interface ScriptedOptions {
  pace?: number | 'instant' // 默认 24ms
  chunk?: 'word' | 'char' | number // 默认 'word'
  messageId?: () => string
  toolCallId?: () => string
}

export function scripted(script: Script, options: ScriptedOptions = {}): ChatFetcher {
  let turn = 0
  return async (input: ChatFetcherInput, { signal }: ChatFetcherOptions) => {
    const ctx = toContext(input, signal, turn++, input.data ?? {})
    const out = await script(ctx)
    if (out instanceof Response)
      return out
    return run(ctx, out, options)
  }
}
```

`run()` 生成规则（写成 `async function*`）：
1. `yield { type: RUN_STARTED, threadId, runId, parentRunId? }`。
2. 遍历步骤。`text`：首个 text 步骤 `TEXT_MESSAGE_START{messageId, role:'assistant'}`（同一 run 只发一次，`messageId` 由 `options.messageId ?? generateMessageId` 生成，且 **在 RUN_STARTED 之后、第一个内容事件之前**决定，全 run 复用），按 `chunk` 切片逐个 `TEXT_MESSAGE_CONTENT{messageId, delta}`，每片 `await pace(signal)`；`TEXT_MESSAGE_END` 在 run 收尾前统一发（多个 text 步骤共一个 message）。`reasoning`：`REASONING_START{messageId}` → `REASONING_MESSAGE_START{messageId, role:'reasoning'}` → 分片 `REASONING_MESSAGE_CONTENT{messageId, delta}` → `REASONING_MESSAGE_END` → `REASONING_END`；`signature` 时再 `STEP_FINISHED{stepName:'reasoning', signature}`。`tool`：`toolCallId = step.toolCallId ?? options.toolCallId?.() ?? generateMessageId()`；`TOOL_CALL_START{toolCallId, toolCallName: name, parentMessageId: messageId, metadata?}` → `argsChunk` 片 `TOOL_CALL_ARGS{toolCallId, delta}` → `TOOL_CALL_END{toolCallId, input}` → 无 `approval/client` 时 `TOOL_CALL_RESULT{messageId: generateMessageId(), toolCallId, content: error ? JSON.stringify({ error }) : JSON.stringify(output ?? null), role:'tool', ...(error ? { metadata: { tanstack: { state: 'output-error' } } } : {})}`；`approval/client` 时记入 `pending[]`。`tool-result`：单发 `TOOL_CALL_RESULT`。`custom`：`CUSTOM{name, value}`。`structured`：`CUSTOM{name:'structured-output.start', value:{messageId}}` → JSON 文本分片 `TEXT_MESSAGE_*` → `CUSTOM{name:'structured-output.complete', value:{object, raw}}`。`usage`：记 `runUsage`。`error`：`RUN_ERROR{message, code}` 后 return。`sleep`：`await pace(signal, ms)`。`finish`：记 `finishReason`。
3. 每步之间检查 `signal.aborted` → return。
4. 收尾：若发过 TEXT_MESSAGE_START 则 `TEXT_MESSAGE_END`；有 `pending` → `RUN_FINISHED{threadId, runId, outcome:{ type:'interrupt', interrupts: pending.map(toInterrupt) }, metadata:{ tanstack:{ finishReason:'tool_calls' } }}`；否则 `RUN_FINISHED{threadId, runId, usage: runUsage ? [runUsage] : undefined, metadata:{ tanstack:{ finishReason: finishReason ?? 'stop' } }}`。
5. `toInterrupt`（审批）：`{ id: 'approval_'+toolCallId, reason:'tool_call', message: 'Approval required to run '+name, toolCallId, responseSchema: normalizeApprovalSchema(undefined, inputSchema).responseSchema, metadata: { kind:'approval', toolName, input, [INTERRUPT_BINDING_METADATA_KEY]: { v: INTERRUPT_BINDING_VERSION, kind:'tool-approval', interruptId: 'approval_'+toolCallId, toolName, toolCallId, originalArgs: input, inputSchemaHash: hashSchemaInput(inputSchema), approvalSchemaHash: undefined, responseSchemaHash: hashSchemaInput(responseSchema), interruptedRunId: runId, generation: 0 } } }`，其中 `inputSchema = { type:'object', additionalProperties: true }`（纯 JSON Schema）。执行者要打开 `$TS/ai/src/activities/chat/index.ts:2598-2626` 与 `interrupt-resume.ts`/`interrupt-manager.ts:176-231` 对齐字段名——**这是最容易写错的一步**；测试 2 是它的裁判。客户端工具同理 `id:'client_tool_'+toolCallId`、`reason:'tanstack:client_tool_execution'`、`metadata.kind:'client_tool'`、binding `kind:'client-tool-execution'`、`responseSchema:{ type:'object' }`。
6. `approvalOf(ctx, toolCallId)`：在 `ctx.resume` 找 `interruptId === 'approval_'+toolCallId` 且 `status==='resolved'` 的项，`payload` 为 `boolean` 或 `{ approved, editedArgs?, payload? }`，归一返回 `{ approved, editedArgs?, payload? } | undefined`。`clientResultOf` 同理取 `'client_tool_'`。
7. `sequence(turns)`：`ctx => { const t = turns[Math.min(ctx.turn, turns.length - 1)]; return typeof t === 'function' ? t(ctx) : t }`。`respond(rules, fallback)`：按 `lastUserText` 匹配 `RegExp | string | predicate`。`echo()`：`text` 复述 `lastUserText` + 附件 `mimeType` 列表 + `ctx.data.model`。`byokMissing(provider)`：`new Response(JSON.stringify({ error: { type:'byok_missing', provider, message: 'Missing '+provider+' API key' } }), { status: 401, headers: { 'content-type': 'application/json' } })`。

- [ ] **Step 4: 跑测试确认通过** — 4 tests PASS。若测试 2 卡在 interrupt 未被识别：打印 `client.getInterruptState()`，对照 `interrupt-manager.ts` 的 binding 校验（hash 字段等值）逐项修。

---

### Task 5: 服务端——`pickSelection`、`createChatHandler`、`createCatalogHandler`

**Files:**
- Create: `packages/ai/src/server/selection.ts`、`chat-handler.ts`、`catalog-handler.ts`
- Modify: `packages/ai/src/server/index.ts`（追加导出）
- Test: `packages/ai/test/selection.test.ts`、`packages/ai/test/chat-handler.test.ts`、`packages/ai/test/catalog-handler.test.ts`（均 `// @vitest-environment node`）

**Interfaces:**
- Produces: `pickSelection(forwardedProps, presets, { defaultModel? })`、`Selection`、`createChatHandler(options)`、`ChatHandlerOptions`、`createCatalogHandler(presets)`

- [ ] **Step 1: 写失败测试**

```ts
// packages/ai/test/selection.test.ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { definePreset } from '../src/server/preset'
import { pickSelection } from '../src/server/selection'

const fake = definePreset({
  id: 'fake',
  label: 'Fake',
  byok: null,
  keyRequired: false,
  runtime: 'node',
  models: [{ id: 'm1', name: 'm1', provider: 'fake', input: ['text'], reasoning: true }],
  create: () => { throw new Error('not used') },
  thinking: () => ({}),
})

describe('pickSelection', () => {
  it('reads only provider / model / thinking', () => {
    const sel = pickSelection({ provider: 'fake', model: 'm1', thinking: 'high', modelOptions: { tools: [] }, systemPrompts: ['x'] }, [fake], {})
    expect(sel).not.toBeInstanceOf(Response)
    expect((sel as any).model.id).toBe('m1')
    expect((sel as any).thinking).toBe('high')
  })
  it('falls back to defaultModel when provider/model are absent', () => {
    const sel = pickSelection({}, [fake], { defaultModel: 'fake/m1' })
    expect((sel as any).model.id).toBe('m1')
  })
  it('rejects unknown provider, unknown model, injection-shaped ids', () => {
    expect(pickSelection({ provider: '../x', model: 'm1' }, [fake], {})).toBeInstanceOf(Response)
    expect(pickSelection({ provider: 'fake', model: 'nope' }, [fake], {})).toBeInstanceOf(Response)
    expect(pickSelection({ provider: 'fake', model: 'x'.repeat(201) }, [fake], {})).toBeInstanceOf(Response)
    expect(pickSelection({}, [fake], {})).toBeInstanceOf(Response)
  })
  it('lets a preset with discoverModels accept ids outside the catalog', () => {
    const open = definePreset({ ...fake, id: 'open', discoverModels: async () => [] })
    const sel = pickSelection({ provider: 'open', model: 'anything:latest' }, [open], {})
    expect((sel as any).model.id).toBe('anything:latest')
  })
  it('normalises an unknown thinking level to off', () => {
    expect((pickSelection({ provider: 'fake', model: 'm1', thinking: 'ultra' }, [fake], {}) as any).thinking).toBe('off')
  })
})
```

```ts
// packages/ai/test/chat-handler.test.ts
// @vitest-environment node
import { EventType } from '@tanstack/ai/client'
import { describe, expect, it } from 'vitest'
import { createChatHandler } from '../src/server/chat-handler'
import { definePreset } from '../src/server/preset'

// 假 adapter：只 yield 一条文本；足以证明 handler 把 chat() 接到了 SSE
function fakeAdapter(seen: { modelOptions?: unknown }) {
  return {
    kind: 'text' as const,
    name: 'fake',
    model: 'm1',
    async* chatStream(options: any) {
      seen.modelOptions = options.modelOptions
      yield { type: EventType.TEXT_MESSAGE_START, messageId: 'a1', role: 'assistant' }
      yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'a1', delta: 'hello' }
      yield { type: EventType.TEXT_MESSAGE_END, messageId: 'a1' }
      yield { type: EventType.RUN_FINISHED, threadId: options.threadId, runId: options.runId, finishReason: 'stop' }
    },
    async structuredOutput() { throw new Error('unused') },
  }
}

const seen: { modelOptions?: unknown } = {}
const fake = definePreset({
  id: 'fake',
  label: 'Fake',
  byok: { id: 'fake', label: 'Fake', env: ['FAKE_KEY'] },
  keyRequired: true,
  runtime: 'node',
  models: [{ id: 'm1', name: 'm1', provider: 'fake', input: ['text'], reasoning: true }],
  create: () => fakeAdapter(seen) as any,
  thinking: level => ({ effort: level }),
})

function body(forwardedProps: Record<string, unknown>) {
  return JSON.stringify({
    threadId: 't1',
    runId: 'r1',
    state: {},
    tools: [],
    context: [],
    forwardedProps,
    messages: [{ id: 'u1', role: 'user', content: 'hi' }],
  })
}
const post = (handler: { POST: (r: Request) => Promise<Response> }, init: RequestInit) => handler.POST(new Request('http://x/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, ...init }))

describe('createChatHandler', () => {
  const handler = createChatHandler({ providers: [fake] })

  it('400 on a malformed body (thrown Response is returned, not rethrown)', async () => {
    const res = await post(handler, { body: '{not json' })
    expect(res.status).toBe(400)
  })
  it('401 byok_missing when the key is absent', async () => {
    const res = await post(handler, { body: body({ provider: 'fake', model: 'm1' }) })
    expect(res.status).toBe(401)
    expect((await res.json()).error.type).toBe('byok_missing')
  })
  it('413 when content-length exceeds maxBodyBytes', async () => {
    const small = createChatHandler({ providers: [fake], maxBodyBytes: 10 })
    const res = await post(small, { body: body({ provider: 'fake', model: 'm1' }), headers: { 'content-type': 'application/json', 'x-byok-fake': 'k', 'content-length': '999' } })
    expect(res.status).toBe(413)
  })
  it('streams SSE and passes only the thinking-derived modelOptions', async () => {
    const res = await post(handler, { body: body({ provider: 'fake', model: 'm1', thinking: 'high', modelOptions: { tools: ['evil'] } }), headers: { 'content-type': 'application/json', 'x-byok-fake': 'k' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const sse = await res.text()
    expect(sse).toContain('TEXT_MESSAGE_CONTENT')
    expect(sse).toContain('hello')
    expect(seen.modelOptions).toEqual({ effort: 'high' })
  })
  it('onSelect can short-circuit with a Response', async () => {
    const gated = createChatHandler({ providers: [fake], onSelect: () => new Response('nope', { status: 403 }) })
    const res = await post(gated, { body: body({ provider: 'fake', model: 'm1' }), headers: { 'content-type': 'application/json', 'x-byok-fake': 'k' } })
    expect(res.status).toBe(403)
  })
  it('drops local presets on Vercel', async () => {
    process.env.VERCEL = '1'
    const local = definePreset({ ...fake, id: 'ollama', byok: null, keyRequired: false, runtime: 'local' })
    const h = createChatHandler({ providers: [local] })
    const res = await post(h, { body: body({ provider: 'ollama', model: 'm1' }) })
    expect(res.status).toBe(400)
    delete process.env.VERCEL
  })
  it('GET without persistence/durability is 404', async () => {
    const res = await handler.GET(new Request('http://x/api/ai/chat?threadId=t1'))
    expect(res.status).toBe(404)
  })
})
```

```ts
// packages/ai/test/catalog-handler.test.ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createCatalogHandler } from '../src/server/catalog-handler'
import { definePreset } from '../src/server/preset'

const p = (id: string, extra: Record<string, unknown>) => definePreset({ id, label: id, byok: { id, label: id, env: [`${id.toUpperCase()}_KEY`] }, keyRequired: true, runtime: 'node', models: [], create: () => ({} as any), thinking: () => ({}), ...extra })

describe('createCatalogHandler', () => {
  it('reports coverage from env, keyless providers always covered, vertex needs key or project+location', async () => {
    process.env.A_KEY = 'x'
    delete process.env.B_KEY
    delete process.env.GOOGLE_VERTEX_API_KEY
    process.env.GOOGLE_CLOUD_PROJECT = 'proj'
    delete process.env.GOOGLE_CLOUD_LOCATION
    const { GET } = createCatalogHandler([p('a', {}), p('b', {}), p('c', { keyRequired: false }), p('vertex', { keyRequired: false })])
    const json = await (await GET(new Request('http://x/api/ai/catalog'))).json()
    expect(json.coverage).toEqual({ a: true, b: false, c: true, vertex: false })
    expect(json.providers[0]).not.toHaveProperty('create')
    delete process.env.A_KEY
    delete process.env.GOOGLE_CLOUD_PROJECT
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL

- [ ] **Step 3: 写 selection.ts / chat-handler.ts / catalog-handler.ts**

`selection.ts`：

```ts
import type { Model, ThinkingLevel } from '../catalog/types'
import type { ProviderPreset } from './preset'
import { parseModelRef } from '../catalog/catalog'
import { clampThinkingLevel, THINKING_LEVELS } from '../catalog/thinking'

export interface Selection { preset: ProviderPreset, model: Model, thinking: ThinkingLevel }

const MODEL_ID = /^[\w.\-:/~]{1,200}$/

function bad(type: string): Response {
  return new Response(JSON.stringify({ error: { type } }), { status: 400, headers: { 'content-type': 'application/json' } })
}

export function pickSelection(fp: Record<string, unknown>, presets: readonly ProviderPreset[], o: { defaultModel?: string }): Selection | Response {
  let provider = typeof fp.provider === 'string' ? fp.provider : undefined
  let modelId = typeof fp.model === 'string' ? fp.model : undefined
  if ((!provider || !modelId) && o.defaultModel) {
    const d = parseModelRef(o.defaultModel)
    provider ??= d.provider
    modelId ??= d.id
  }
  if (!provider || !modelId)
    return bad('unknown_model')
  const preset = presets.find(p => p.id === provider)
  if (!preset)
    return bad('unknown_provider')
  if (!MODEL_ID.test(modelId))
    return bad('unknown_model')
  let model = preset.models.find(m => m.id === modelId)
  if (!model) {
    if (!preset.discoverModels)
      return bad('unknown_model')
    model = { id: modelId, name: modelId, provider: preset.id, input: ['text'], reasoning: false }
  }
  const raw = typeof fp.thinking === 'string' && (THINKING_LEVELS as readonly string[]).includes(fp.thinking) ? fp.thinking as ThinkingLevel : 'off'
  return { preset, model, thinking: clampThinkingLevel(model, raw) }
}
```

`chat-handler.ts`（spec §服务端 生命周期原样）：

```ts
import type { AgentLoopStrategy, AnyTool, ChatMiddleware, DebugOption, StreamDurability, SystemPrompt } from '@tanstack/ai'
import type { ProviderPreset } from './preset'
import type { Selection } from './selection'
import { chat, chatParamsFromRequest, mergeAgentTools, toServerSentEventsResponse } from '@tanstack/ai'
import { byokMissing, getByokKey } from '@tanstack/ai/byok/server'
import { pickSelection } from './selection'
import { resolveThinking } from './thinking'

export interface ChatHandlerOptions<TContext = unknown> {
  providers: readonly ProviderPreset[]
  defaultModel?: string
  systemPrompts?: SystemPrompt[] | ((sel: Selection) => SystemPrompt[])
  tools?: ReadonlyArray<AnyTool>
  middleware?: ChatMiddleware<TContext>[]
  context?: (request: Request) => TContext | Promise<TContext>
  agentLoopStrategy?: AgentLoopStrategy
  onSelect?: (sel: Selection, request: Request) => Selection | Response
  persistence?: unknown // AIPersistence<ChatTranscriptStores>；动态 import @tanstack/ai-persistence
  authorize?: unknown // ReconstructChatOptions['authorize']
  durability?: (request: Request) => StreamDurability
  maxBodyBytes?: number
  ollamaHosts?: readonly string[]
  debug?: DebugOption
}

export function createChatHandler<TContext>(o: ChatHandlerOptions<TContext>): { POST: (r: Request) => Promise<Response>, GET: (r: Request) => Promise<Response> } {
  const onVercel = process.env.VERCEL === '1'
  const presets = o.providers.filter(p => !(onVercel && p.runtime === 'local'))
  const maxBody = o.maxBodyBytes ?? 4 * 1024 * 1024

  async function POST(request: Request): Promise<Response> {
    const len = Number(request.headers.get('content-length') ?? 0)
    if (len > maxBody)
      return new Response('Payload too large', { status: 413 })
    let params: Awaited<ReturnType<typeof chatParamsFromRequest>>
    try {
      params = await chatParamsFromRequest(request)
    }
    catch (e) {
      if (e instanceof Response)
        return e
      throw e
    }
    const picked = pickSelection(params.forwardedProps, presets, { defaultModel: o.defaultModel })
    if (picked instanceof Response)
      return picked
    const sel = o.onSelect ? o.onSelect(picked, request) : picked
    if (sel instanceof Response)
      return sel
    const key = sel.preset.byok ? getByokKey(request, sel.preset.byok) : null
    if (sel.preset.keyRequired && key === null && sel.preset.byok)
      return byokMissing(sel.preset.byok)
    if (sel.preset.id === 'ollama' && key && !hostAllowed(key, o.ollamaHosts))
      return new Response('Ollama host not allowed', { status: 400 })
    const adapter = sel.preset.create(sel.model.id, key)
    const modelOptions = resolveThinking(sel.preset, sel.model, sel.thinking)
    const abortController = new AbortController()
    const middleware = [...(o.middleware ?? [])]
    if (o.persistence) {
      const { withPersistence } = await import('@tanstack/ai-persistence')
      middleware.push(withPersistence(o.persistence as never) as never)
    }
    const stream = chat({
      adapter: adapter as never,
      messages: params.messages,
      threadId: params.threadId,
      runId: params.runId,
      parentRunId: params.parentRunId,
      resume: params.resume,
      tools: mergeAgentTools(o.tools ?? [], params.tools) as never,
      systemPrompts: typeof o.systemPrompts === 'function' ? o.systemPrompts(sel) : o.systemPrompts,
      modelOptions,
      middleware: middleware as never,
      agentLoopStrategy: o.agentLoopStrategy,
      context: o.context ? await o.context(request) : undefined,
      abortController,
      debug: o.debug,
    } as never)
    return toServerSentEventsResponse(stream as never, {
      abortController,
      ...(o.durability ? { durability: { adapter: o.durability(request) } } : {}),
      debug: o.debug,
    })
  }

  async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (o.persistence && url.searchParams.has('threadId')) {
      const { reconstructChat } = await import('@tanstack/ai-persistence')
      return reconstructChat(o.persistence as never, request, { authorize: o.authorize as never })
    }
    if (o.durability && (url.searchParams.has('runId') || request.headers.has('last-event-id'))) {
      const { resumeServerSentEventsResponse } = await import('@tanstack/ai')
      return resumeServerSentEventsResponse({ adapter: o.durability(request) })
    }
    return new Response('Not found', { status: 404 })
  }

  return { POST, GET }
}

function hostAllowed(host: string, allow?: readonly string[]): boolean {
  let url: URL
  try {
    url = new URL(host)
  }
  catch { return false }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    return false
  if (allow)
    return allow.some(a => url.host === a || url.hostname === a)
  const h = url.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(?:1[6-9]|2\d|3[01])\./.test(h)
}
```

执行者把 `as never` 收窄到最少：`chat()` 的泛型对 `AnyTextAdapter` 与 `AnyTool[]` 原本就能接受，先不加断言跑 typecheck，报错再逐个补并写注释。`ChatHandlerOptions.persistence/authorize` 用 `import type { AIPersistence, ChatTranscriptStores, ReconstructChatOptions } from '@tanstack/ai-persistence'`（optional peer 的 `import type` 不进运行时；若 dts 产物泄漏该包名，改回 `unknown` 并在 JSDoc 注明）。

`catalog-handler.ts`：

```ts
import type { Provider } from '../catalog/types'
import type { ProviderPreset } from './preset'

function covered(p: ProviderPreset): boolean {
  if (!p.keyRequired) {
    if (p.id !== 'vertex')
      return true
    const has = (...names: string[]): boolean => names.some(n => !!process.env[n])
    return has('GOOGLE_VERTEX_API_KEY') || (has('GOOGLE_CLOUD_PROJECT', 'GOOGLE_VERTEX_PROJECT') && has('GOOGLE_CLOUD_LOCATION', 'GOOGLE_VERTEX_LOCATION'))
  }
  return (p.byok?.env ?? []).some(n => !!process.env[n])
}

export function createCatalogHandler(presets: readonly ProviderPreset[]): { GET: (r: Request) => Promise<Response> } {
  return {
    async GET(_request: Request): Promise<Response> {
      const providers: Provider[] = presets.map(({ create: _c, thinking: _t, discoverModels: _d, ...rest }) => rest)
      const coverage = Object.fromEntries(presets.map(p => [p.id, covered(p)]))
      return Response.json({ providers, coverage, generatedAt: new Date().toISOString() })
    },
  }
}
```

（`?refresh=1&provider=` 的 `discoverModels` 在 Phase 3。）`server/index.ts` 追加：`export * from './catalog-handler'`、`export * from './chat-handler'`、`export * from './preset'`、`export * from './selection'`、`export * from './thinking'`。

- [ ] **Step 4: 跑测试确认通过** — 三个文件 PASS；typecheck；eslint `packages/ai`。

---

### Task 6: 前四个 provider preset + docs 站 route（PR-2）

**Files:**
- Create: `packages/ai/src/providers/{openai,anthropic,gemini,openrouter}.ts`
- Create: `docs/app/api/ai/chat/route.ts`、`docs/app/api/ai/catalog/route.ts`
- Test: `packages/ai/test/providers.test.ts`（`// @vitest-environment node`）

**Interfaces:**
- Produces: `openai`, `anthropic`, `gemini`, `openrouter`（各 `ProviderPreset`）

- [ ] **Step 1: 写失败测试**

```ts
// packages/ai/test/providers.test.ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { providers as catalog } from '../src/catalog'
import { anthropic } from '../src/providers/anthropic'
import { gemini } from '../src/providers/gemini'
import { openai } from '../src/providers/openai'
import { openrouter } from '../src/providers/openrouter'

describe('provider presets', () => {
  it.each([openai, anthropic, gemini, openrouter])('$id mirrors the catalog data and builds an adapter with a key', (p) => {
    const data = catalog[p.id as keyof typeof catalog]
    expect(p.models).toBe(data.models)
    expect(p.byok?.id).toBe(data.byok?.id)
    const adapter = p.create(p.models[0]!.id, 'sk-test')
    expect(adapter.kind).toBe('text')
    expect(adapter.model).toBe(p.models[0]!.id)
  })
})
```

- [ ] **Step 2: 跑测试确认失败** — FAIL

- [ ] **Step 3: 写四个 preset**

```ts
import type { OPENAI_CHAT_MODELS } from '@tanstack/ai-openai'
// packages/ai/src/providers/openai.ts
import { createOpenaiChat } from '@tanstack/ai-openai'
import { openai as data } from '../catalog/providers/openai'
import { definePreset } from '../server/preset'
import { openaiThinking } from '../server/thinking'

export const openai = definePreset({
  ...data,
  create: (model, key) => createOpenaiChat(model as (typeof OPENAI_CHAT_MODELS)[number], key ?? ''),
  thinking: openaiThinking,
})
```

anthropic（`createAnthropicChat`、`ANTHROPIC_MODELS`、`anthropicThinking`）、gemini（`createGeminiChat`、`GEMINI_MODELS`、`geminiThinking`）、openrouter（`createOpenRouterText`，模型 id 开放，不断言；`openrouterThinking`）同形。`key ?? ''`：这四家 `keyRequired:true`，handler 已在无 key 时 401；`''` 只为类型。

- [ ] **Step 4: docs route**

```ts
import { anthropic } from '@gedatou/cadenza-ai/providers/anthropic'
import { gemini } from '@gedatou/cadenza-ai/providers/gemini'
import { openai } from '@gedatou/cadenza-ai/providers/openai'
import { openrouter } from '@gedatou/cadenza-ai/providers/openrouter'
// docs/app/api/ai/chat/route.ts
import { createChatHandler, toolDefinition } from '@gedatou/cadenza-ai/server'
import { z } from 'zod'

export const maxDuration = 300

const getTime = toolDefinition({
  name: 'get_time',
  description: 'Current time in a timezone',
  inputSchema: z.object({ tz: z.string() }),
}).server(async ({ tz }) => ({ iso: new Date().toLocaleString('en-US', { timeZone: tz }) }))

export const { POST, GET } = createChatHandler({
  providers: [openai, anthropic, gemini, openrouter],
  defaultModel: 'openai/gpt-5.2',
  systemPrompts: ['You are the cadenza docs playground assistant. Keep answers short.'],
  tools: [getTime],
})
```

```ts
import { anthropic } from '@gedatou/cadenza-ai/providers/anthropic'
import { gemini } from '@gedatou/cadenza-ai/providers/gemini'
import { openai } from '@gedatou/cadenza-ai/providers/openai'
import { openrouter } from '@gedatou/cadenza-ai/providers/openrouter'
// docs/app/api/ai/catalog/route.ts
import { createCatalogHandler } from '@gedatou/cadenza-ai/server'

export const { GET } = createCatalogHandler([openai, anthropic, gemini, openrouter])
```

- [ ] **Step 5: 跑测试 + 构建 + 真实 curl**

- `pnpm vitest run packages/ai` 全绿；`pnpm --filter @gedatou/cadenza-ai run build`（确认 `dist/providers/openai.mjs` 存在、`dist/index.d.mts` 无 `@tanstack/ai-`）；`pnpm --filter docs typecheck`。
- `pnpm --filter docs run build`（ESM-only adapter 打包实测；失败则 `next.config.ts` 加 `serverExternalPackages` 并记录）。
- 起 docs（探测 3000，否则 `PORT=3001 pnpm --filter docs dev`，记 PID），`curl -s http://localhost:3001/api/ai/catalog | jq .coverage`；有真实 key 时 `curl -N -H 'x-byok-openai: sk-…' -d '<RunAgentInput JSON>' http://localhost:3001/api/ai/chat` 看到 `data: {"type":"TEXT_MESSAGE_CONTENT"…}`；没有 key 时确认 401 `byok_missing`。用完按 PID 收掉。

- [ ] **Step 6: 提交（两次）**

PR-1（Task 1–4）：`feat(ai): scaffold @gedatou/cadenza-ai with catalog, thinking map and mock transport`；PR-2（Task 5–6）：`feat(ai): server handler, first four providers and the docs api routes`。均带 trailer；`git add` 只加本 PR 的路径（含 `pnpm-lock.yaml`、`pnpm-workspace.yaml`）。

---

## Self-review

- **Spec coverage**：§形态 四入口 ✓（Task 1）；§API 面 root 目录 ✓（Task 2）、server ✓（Task 3/5）、providers（4/13，其余 Phase 2）✓、mock ✓（Task 4，含 `byokMissing`）；§服务端 生命周期 / 安全清单 1–8 ✓（413、白名单、ollama host、`VERCEL` 过滤、durability 信封）；附录 A 四家 ✓（其余随 Phase 2 preset）；§测试 中 catalog-drift / thinking / selection / chat-handler / catalog-handler / scripted ✓，threads/usage/renderers/messages/byok/view 属 Phase 1b。
- **Placeholder scan**：Task 2 Step 4 的模型清单以「以数组实际存在的 id 为准」交给执行者核对——这是数据抄录不是设计空洞；其余步骤均有代码。
- **Type consistency**：`ProviderPreset.create(model, key)` / `thinking(level, model)` 在 Task 3、5、6 一致；`pickSelection(fp, presets, { defaultModel })` 三处一致；`ScriptContext.resume` 与 `approvalOf` 对齐；`createChatHandler` 返回 `{ POST, GET }` 与 docs route 解构一致。
