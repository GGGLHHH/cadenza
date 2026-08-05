---
name: writing-component-docs
description: Use when creating or restructuring a component docs page (docs/content/docs/components/*.mdx) or registering its demos — before deciding page structure, section names, or section order
---

# Writing Component Docs

## Overview

页面骨架与顺序对齐 shadcn v4(`apps/v4/content/docs/components/base/`),深度内容
(行为契约、data-* 表、Props 全表)是本库的差异化,保留但各就各位。
**顺序是 shadcn 的,深度是我们的。**

## 页面骨架(固定顺序)

````mdx
---
title: Xxx
description: 一句话钩子,一行写完
---

<ComponentPreview name="xxx/basic" />

开篇 1–2 段:封装层是什么、补了什么。写不下的下沉到对应特性节。

## 使用

```tsx
import { Xxx } from '@gedatou/cadenza-ui'
```

```tsx
<Xxx … />
```

## 组成

## 标签

## 变体 / 尺寸

## <家族特性节 ×N>

## 受控

## 表单

## 禁用

## 什么时候用 Xxx

## 状态与 className

## 键盘交互

## 导出的类型

## Props
````

硬规则:

- **hero 紧跟 frontmatter,它前面零 prose**。开篇段落在 hero 之后、`## 使用` 之前。
- **`## 使用` 必写**:import 语句 + 最小可用 JSX,两个代码块。
- **`## Props` 永远是最后一个 H2**,它之后不得再有任何节。
- 不再设「基础用法」节 —— hero(复用 `xxx/basic`)+ `## 使用` 取代它。
- 条件节按谓词取舍,谓词不成立就整节不写:
  - `## 组成`:组合式家族(≥2 个对外 part)才有,内容是 ```text 部件树。
  - `## 标签`:标签通道不走「`FieldLabel htmlFor` → 真元素 `id`」时才立节
    (box-only、group 根、无 id 落点);普通通道一句话进 `## 使用` 即可。
    四条通道的总表在 field.mdx,此处只写本控件那条并链过去。
  - `## 变体 / 尺寸`:有 cva 变体才写。
  - `## 禁用`:有超出「disabled 就是禁了」的话才立节(如 Field 联动)。
  - `## 什么时候用 Xxx`:库内有可混淆的对比对象才写。
  - `## 键盘交互`:控件有键盘行为才写,表格列出按键 → 效果。
  - `## 导出的类型`:类型多到一行列不完、且带泛型/hook 需要解释的大家族才立节;
    否则类型清单收进 Props 节结尾一行(见下)。

## 每节的形态

一句话引导(这节解决什么)→ `<ComponentPreview>` → 展开解释(契约、表格、陷阱)。

- preview 之前只放**一句**引导;长解释一律排在 preview 之后。
- 纯契约节(表单 / 键盘交互 / 状态与 className / Props)没有 preview,直接写。
- 一节内多个 preview 可以,每个前面同样只给一句引导。

## 节名对照(同概念只有一个名字)

| 概念 | 唯一节名 | 禁止再造的漂移名 |
| --- | --- | --- |
| 受控三件套 | `受控` | — |
| 表单序列化 | `表单` | 表单序列化 / 表单序列化是原生的 |
| 状态属性与样式钩子 | `状态与 className` | 按状态改样式 / 两条 className 通道 / data-slot 与 data-active |
| 标签通道 | `标签` | 标签怎么给 / 标签怎么接 / 两件命名的事… |
| 选型对比 | `什么时候用 Xxx` | 什么时候换 Xxx |
| 键盘 | `键盘交互` | 方向与键盘 |

`状态与 className` 一节内含两张表:`data-*` ↔ state 名 ↔ 出现时机;
`data-slot` ↔ 是什么(封装层自渲染部件才需要第二张)。

## Props 节(固定形态)

1. 开头一行:`顺序规则:**必填 → 非受控默认值 → 受控值 → 回调 → 行为开关 → 外观 → className**。`
2. 表列固定:`Prop | 类型 | 默认值 | 说明`,按顺序规则排行。
3. 倒数第二行:`其余 | Base UI Xxx.Root 的 props(元素原生属性 + ref) | — | 透传`。
4. 结尾一行:`N 个类型一并导出:XxxProps / XxxState / …`(已立「导出的类型」节的页面免)。

## 本站没有的节(shadcn 有,这里不写)

| shadcn 节 | 为什么这里没有 |
| --- | --- |
| Installation | 安装是包级的,写在 /docs 首页;组件页不重复 |
| API Reference | Props 全表就是 API 参考;上游文档链接放开篇段落 |
| RTL | 站点未做 RTL 配置 |
| CodeTabs / Steps / TabsList | mdx-components.tsx 只注册了 ComponentPreview / ComponentSource |

frontmatter 只有 `title` / `description` 会被模板渲染;别写 shadcn 的
`base:` / `component:` / `links:` 键。

## Demo 规范

- 文件:`docs/demos/<family>/<name>.tsx`,default export,注册进 `docs/demos/index.tsx`。
- 引用:`<ComponentPreview name="family/name" />`(斜杠命名,不是 shadcn 的连字符)。
- demo 只演示。组件该会的行为写进 seam,不在 demo 里补胶水。
- demo 顶部注释说明这个 demo 想证明什么。
- hero 复用 `family/basic`,不为 hero 单造 demo。

## Common Mistakes

| 症状 | 修正 |
| --- | --- |
| hero 之前压着开篇 prose | ComponentPreview 提到 frontmatter 后第一行 |
| 全页没有 import 语句 | 补 `## 使用` |
| 多段解释排在 preview 上面 | 一句引导 → preview → 展开 |
| Props 之后还有节(边界与无障碍、导出的类型…) | 一律上移到 Props 之前 |
| 同概念自造节名 | 查节名对照表 |
| 给组件页加 Installation / API Reference / RTL | 本站没有这些节 |

旧页尚未全部迁移到此骨架;重构旧页时以本骨架为目标,新页必须直接遵循。
