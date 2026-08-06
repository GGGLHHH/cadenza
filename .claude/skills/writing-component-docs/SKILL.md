---
name: writing-component-docs
description: Use when creating or restructuring a component docs page (docs/content/docs/components/*.mdx) or registering its demos — before deciding page structure, section names, or section order
---

# Writing Component Docs

## Overview

页面骨架与顺序对齐 shadcn v4 的 base 目录(`apps/v4/content/docs/components/base/`),
深度内容(行为契约、data-* 表、Props 全表)是本库的差异化,保留但各就各位。
**顺序是 shadcn 的,深度是我们的。**

## 第一步:找母版

```bash
curl -sf https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/content/docs/components/base/<name>.mdx
```

- **有同名页 → 它就是母版**:H2/H3 的顺序、粒度、每节形态照抄,节名按
  [词典](#词典母版节名--本站节名)翻译;只删
  [本站没有的节](#本站没有的节shadcn-有这里不写);本库深度节按
  [插入点](#本库深度节的插入点)加入。
- **404(本库独有组件,如 InfiniteSelect / SearchField)→ 用通用骨架。**
- **重名不等于同一个东西。** 母版开头若自称是「how to build your own」这类教程
  (shadcn 的 data-table 就是:它明说不提供组件,只教你用 TanStack Table 手搓),
  那它不是母版,按 404 处理走通用骨架。判据是母版的开篇,不是文件名。
- **母版必须读全文再动笔。** field 的母版 400 多行,只读开头得出的「骨架」缺了
  主体的十几个节 —— 本条就是为那次事故立的。

## 通用骨架(无母版时的固定顺序)

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

硬规则(有母版时同样生效):

- **hero 紧跟 frontmatter,它前面零 prose**。开篇段落在 hero 之后、`## 使用` 之前。
- **`## 使用` 必写**:import 语句 + 最小可用 JSX,两个代码块。
- **`## Props` 永远是最后一个 H2**,它之后不得再有任何节。
- 不设「基础用法」节 —— hero(复用 `xxx/basic`)+ `## 使用` 取代它;母版有
  `Basic` 节且 hero 已复用同一 demo 时,该节整节省去。
- 条件节按谓词取舍,谓词不成立就整节不写:
  - `## 组成`:组合式家族(≥2 个对外 part)才有,内容是 ```text 部件树。
    母版按层/按形态分了 H3 的(field / combobox 都是),H3 结构照抄:每个 H3 一行
    定位 + 树,并链到对应示例节。
  - `## 标签`:标签通道不走「`FieldLabel htmlFor` → 真元素 `id`」时才立节
    (box-only、group 根、无 id 落点);普通通道一句话进 `## 使用` 即可。
    四条通道的总表在 field.mdx,此处只写本控件那条并链过去。
  - `## 变体 / 尺寸`:有**外观**变体(variant / size 这类 cva 维度)才写;
    orientation 是布局不是外观,即使实现走 cva 也归 `## 方向` 特性节。
  - `## 禁用`:有超出「disabled 就是禁了」的话才立节(如 Field 联动)。
  - `## 什么时候用 Xxx`:库内有可混淆的对比对象才写。
  - `## 键盘交互`:控件有键盘行为才写,表格列出按键 → 效果。
  - `## 导出的类型`:类型多到一行列不完、且带泛型/hook 需要解释的大家族才立节;
    否则类型清单收进 Props 节结尾一行(见下)。

## 词典(母版节名 → 本站节名)

概念词翻译,控件/部件名保持英文原样;表外的节名照母版直译。

| 母版 | 本站 |
| --- | --- |
| Usage | 使用 |
| Composition | 组成 |
| Anatomy | 解剖 |
| Form | 表单 |
| Basic | 基础(hero 已复用同一 demo 时整节省去) |
| Controlled / Checked State | 受控 |
| Disabled | 禁用 |
| Invalid / Invalid State | 无效态 |
| Multiple / Multiple Selection | 多选 |
| Groups | 分组 |
| Scrollable | 滚动 |
| Clear Button | 可清除 |
| Custom Items | 自定义条目 |
| Vertical | 方向 |
| Responsive Layout | 响应式布局 |
| Validation and Errors | 校验与错误 |
| Accessibility | 无障碍 |
| API Reference | Props(母版的外链形式换成本站全表) |

母版节是**站内外链**、本站无对应页的(如 field 的 Form 链去 /docs/forms):
节保留,内容改写成本库契约;确无内容可写才删节,并在迁移 commit 里说明。

## 本库深度节的插入点

母版没有这些节;跟母版走时按下表插入,Props 前的尾巴顺序固定:
**什么时候用 → 状态与 className → 键盘交互 → 导出的类型 → Props**。

| 节 | 插在 |
| --- | --- |
| `标签`(通道特殊时) | `使用` / `组成` 之后。母版有 `无障碍` 节的页面**不另立 `标签`**,内容并入 `无障碍`(位置照母版,在尾部) |
| `什么时候用 Xxx` | Props 前 |
| `状态与 className` | Props 前 |
| `键盘交互` | Props 前 |
| `导出的类型` | Props 前 |

本库多出的控件/特性节(如 InfiniteCombobox)插在最近亲缘节之后(Select 之后)。
深度展开不另立节的,跟在母版对应节的 preview 之后(见「每节的形态」)。

## 家族枢纽页(母版证据:field)

- 逐控件配对节用**裸控件名**作节名(Input / Textarea / Select / Slider /
  Checkbox / Radio / Switch…),一节一控件,preview 为主,顺序照母版;
  **不用「配 X」**。
- `解剖`:典型单字段代码块 + 每个部件职责的 bullets。
- Props 按部件立 H3:每个部件 = 一行定位 + 迷你表(`Prop | 类型 | 默认值`)+
  用法片段。

## 每节的形态

一句话引导(这节解决什么)→ `<ComponentPreview>` → 展开解释(契约、表格、陷阱)。

- preview 之前只放**一句**引导;长解释一律排在 preview 之后。
- 纯契约节(标签 / 表单 / 键盘交互 / 状态与 className / Props)没有 preview,直接写。
- 一节内多个 preview 可以,每个前面同样只给一句引导。
- 母版里整节只有代码块没有 preview 的「配方节」(如 combobox 的 Custom Items),
  照抄这个形态。

## 节名对照(同概念只有一个名字)

优先级:**有母版时节名以词典为准**;本表治理无母版页与库内自造名。

| 概念 | 唯一节名 | 禁止再造的漂移名 |
| --- | --- | --- |
| 受控三件套 | `受控` | — |
| 表单序列化 | `表单` | 表单序列化 / 表单序列化是原生的 |
| 状态属性与样式钩子 | `状态与 className` | 按状态改样式 / 两条 className 通道 / data-slot 与 data-active |
| 标签通道 | `标签` | 标签怎么给 / 标签怎么接 / 两件命名的事… |
| 选型对比 | `什么时候用 Xxx` | 什么时候换 Xxx |
| 键盘 | `键盘交互` | 方向与键盘 |
| 排布方向(orientation) | `方向` | 垂直排列 |
| 家族页控件配对 | 裸控件名 | 配 X |

`状态与 className` 一节内含两张表:`data-*` ↔ state 名 ↔ 出现时机;
`data-slot` ↔ 是什么(封装层自渲染部件才需要第二张)。
纯 DOM 家族(底下没有 Base UI state,属性是手动挂的)第一张表列
`属性 | 效果` 即可,`data-slot` 一行 prose 带过。

## Props 节(固定形态)

1. 开头一行:`顺序规则:**必填 → 非受控默认值 → 受控值 → 回调 → 行为开关 → 外观 → className**。`
2. 表列固定:`Prop | 类型 | 默认值 | 说明`,按顺序规则排行。
3. 倒数第二行:`其余 | Base UI Xxx.Root 的 props(元素原生属性 + ref) | — | 透传`。
4. 结尾一行:`N 个类型一并导出:XxxProps / XxxState / …`(已立「导出的类型」节的页面免)。
5. 家族枢纽页(Field / InputGroup 这类没有单一 Root 的)不用单张总表,按部件立
   H3(见「家族枢纽页」);顺序规则行与透传行免,第 4 条照旧。

## 本站没有的节(shadcn 有,这里不写)

| shadcn 节 | 为什么这里没有 |
| --- | --- |
| Installation | 安装是包级的,写在 /docs 首页;组件页不重复 |
| RTL | 站点未做 RTL 配置 |
| Choice Card 这类本库没有对应 demo 的特性节 | 删节时在迁移 commit 里说明 |
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
| 没查母版(或只读了开头)就按通用骨架开写 | 先 curl 母版**读全文**;有母版时通用骨架靠边 |
| hero 之前压着开篇 prose | ComponentPreview 提到 frontmatter 后第一行 |
| 全页没有 import 语句 | 补 `## 使用` |
| 多段解释排在 preview 上面 | 一句引导 → preview → 展开 |
| Props 之后还有节(边界与无障碍、导出的类型…) | 一律上移到 Props 之前 |
| 家族页配对节叫「配 X」 | 裸控件名,一节一控件 |
| 同概念自造节名 | 查节名对照表 |
| 给组件页加 Installation / RTL | 本站没有这些节 |

旧页尚未全部迁移到此骨架;重构旧页时以本骨架为目标,新页必须直接遵循。
