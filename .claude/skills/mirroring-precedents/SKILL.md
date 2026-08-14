---
name: mirroring-precedents
description: Use when implementing a capability a sibling component in this repo may already implement — loading, scrolling, load-more, pagination, empty/error states, overlays, virtualization — or when applying a seam-checklist remedy such as a ref/type patch. Applies especially under time pressure, "最小实现", "别过度工程", or "不用到处翻" requests.
---

# 镜像先例（不是参考先例）

## Overview

**读过先例不算数，镜像承重机制才算。**同一能力在仓库里的第二个实现，
每一处与先例的差异都必须能指着先例的某条注释或约束说「这条在我这里
不成立」；说不出，就照搬。检查单的每一剂药，开之前先用探针验证症状
——表面证据不裁决，tsc 和源头定义才裁决。

本技能来自实测：agent 打开过 infinite-select.tsx、引用了家法词汇，
交付的却是 onScroll 距离触发 + 伪元素 spinner——先例文件里明写着
「observer 而非 scroll handler：虚拟化下 offset 说明不了剩余行数」。
读过，没镜像。

## 触发场景

- 要给组件加 loading / 滚动容器 / 加载更多 / 空态 / 错误态 / 遮罩 /
  虚拟化——InfiniteSelect、DataTable、LoadingOverlay、ScrollArea
  几乎肯定已有一份带注释的实现
- 按 base-ui-conventions 检查单给 seam 类型补 ref / Omit / 泛型
- 任务里出现「赶时间」「最小实现」「直接写一个就行」——这些是本失败
  模式的高发条件，不是绕过下面配方的许可

## 配方（实现先例已覆盖的能力时，输出长这样）

1. **定位先例**：按能力词 grep（`sentinel` / `LoadingOverlay` /
   `virtualizer` / `Status` / `no-more`），找到干同一件事的组件。
2. **找出承重机制**：先例里带「为什么」注释的代码就是承重机制——
   IntersectionObserver 哨兵、ScrollArea viewport、状态槽在 listbox
   语义之外、`data-*` 落点。带 why 注释 = 付过学费，不是可替换的风格。
3. **逐机制搬运**：同名同形迁移，slot 前缀换成自家家族名。你的实现
   与先例逐项对照后，差异清单应当是空的或每条都附先例内的依据。
4. **结构性借口先找反例**：「塞不进 listbox」「children 是 render
   函数放不了哨兵」——先例几乎总在同样约束下解过（哨兵放 listbox 外、
   滚动容器内）。断言放不下之前，先在先例里找放法。
5. **检查单开药前跑探针**：症状要 tsc 裁决，不靠肉眼。补
   `RefAttributes` 前先写 `type Probe = X.Props['ref']`——能解析 =
   Props 已带 ref，不补。调用签名上挂着 `RefAttributes` 不算数：
   `BaseUIComponentProps` 就是 `ComponentPropsWithRef`，追到这一层
   或让探针说话。

## 合理化说辞表（基线实录）

| 说辞 | 事实 |
| --- | --- |
| 「最小实现，onScroll 最小」 | 先例注释明写 observer 是被虚拟化逼出来的；你的「最小」是先例付过学费的坑 |
| 「塞不进 sentinel div」 | 先例把哨兵放在 listbox 外、滚动容器内——反例就在你读过的文件里 |
| 「知道有 IO，先给降级版，ponytail 注释标了」 | ponytail 注释标记的是能力天花板，不是替换已验证机制的许可 |
| 「d.ts 调用签名上有 RefAttributes，所以 Props 没有 ref」 | 那是上游的冗余写法；Props 继承 `BaseUIComponentProps` = `ComponentPropsWithRef`，探针一行便知 |
| 「先例是全家桶，我这场景轻」 | 场景轻重改变取多少，不改变取的东西长什么样——搬轻量子集也要按原机制搬 |

## Red Flags —— 出现就停手回查

- 写了 `onScroll` / `setTimeout` / 手写 spinner div / 伪元素加载指示，
  而隔壁组件有同能力
- 正在打「先给个简版」「这里放不下」的注释
- 在按检查单条目补类型，却没跑过一行探针
- 差异清单里有一条说不出先例内的依据

## 真实代价

本技能对应的一次真实返工：Cascader 首版手搓了 Spinner 行 + 裸
overflow 滚动 + 会中途卸载的哨兵，被打回按 InfiniteSelect 重写
（ScrollArea + LoadingOverlay + 哨兵常驻 + 终止行），外加一个
`hasNextPage` 清零的真 bug——照着先例写，四处返工一处都不会发生。
