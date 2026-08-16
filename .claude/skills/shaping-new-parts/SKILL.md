---
name: shaping-new-parts
description: Use when adding a new slot, action area, or named part to a component family — footer / toolbar / header / actions 插槽、confirm/cancel/clear 按钮组、任何带可见文案的部件——尤其当它感觉是「库里没有的全新能力」时。设计 props 面（label props? children? variant 内置?）之前必读。
---

# 新插槽也有先例（API 形态判例检索）

## Overview

**插槽和动作区的 API 形态，与运行时机制一样，都是先例已覆盖的能力。**
[[mirroring-precedents]] 管「承重机制」（哨兵、observer、滚动容器）；本技能管
它的姐妹面——**部件怎么切、props 面长什么样、文案和 variant 归谁**。这些
问题库里几乎总有判例，而且常以两种形态存在：正面实现，和**否决注释**。

本技能来自真实失败：设计 DatePicker 的 Footer（clear/cancel/confirm）时
自认「库里没有 footer，全新能力」，跳过检索、按 MUI/antd 类比自造了
`clearLabel`/`cancelLabel`/`confirmLabel` 三个 props（文案+variant 打包进
库）。实际库内有两处直接判例：`InfiniteSelectFooter` 家族（Footer 壳 +
Clear/Cancel/Close，JSDoc 连「不造 Confirm 新词」都写好了）和
alert-dialog 的否决注释。被指出后按判例返工。

> 验证状态：六个 baseline 场景（含热上下文复现）中冷启动 agent 均主动查
> 先例、未复现此失败——它的触发条件是**长会话热上下文**：连做几个真无
> 先例的组件后，「无先例」判断会惯性延续，恰在此时开始出错。本技能按
> writing-skills 流程属未通过 RED 的豁免部署（用户拍板），针对的就是
> 「自认已知全库」的时刻。

## 触发场景

- 给组件加 footer / toolbar / header / actions 等插槽或动作按钮组
- 新部件需要**可见文案**（按钮字、标题、提示语）——文案归属是判例高发区
- 心里冒出「这是库里没有的全新能力」——这句话是跑下面两条 grep 的
  **信号**，不是跳过的许可

## 配方

1. **两条 grep，动笔写签名之前跑**：

   ```bash
   # 同类部件（正面判例）
   grep -rn "Footer\|Toolbar\|Actions\|Cancel\|Close\|Separator" packages/ui/src/components/*.tsx -l
   # 否决注释（反面判例——付过学费的 API 裁定，比正面实现更值钱）
   grep -rn "not promoted\|neither is promoted" packages/ui/src/components/
   ```

2. **从判例读形态，不从记忆推**。已裁定过的（出处在括号里）：
   - 组合面里**文案是 children、variant/布局归 caller**；Footer 是纯布局壳
     （alert-dialog 注释：「a line the caller writes anyway, and writing it
     keeps the wording and the variant where they belong」）
   - `*Label` string props 只属于**无组合面的一体组件**（DataPagination）——
     表面词形相似不等于同一场景
   - 「关闭并提交」的词是 **Close**，不造 Confirm/Apply
     （InfiniteSelectClose、DatePickerClose 的 JSDoc）
   - **Cancel ≠ Clear**：清空是提交空值，取消是什么都不提交
     （InfiniteSelectCancel 的 JSDoc）
   - caller 的 `onClick` 先跑、查 `defaultPrevented` 再执行内部行为，
     handler 写在 spread 之后

3. **相似先例按场景维度配对**（组合面组件 vs 一体化组件；弹层宿主 vs
   inline 面板），不按 prop 词形表面相似。配错维度的先例比没有先例更害人。

## 说辞表（实录）

| 说辞 | 事实 |
| --- | --- |
| 「这是全新能力，库里没有」 | 正是本次失败的原话。能力可能新，**形态问题**（文案归谁、按钮怎么切）几乎总被裁决过 |
| 「我今天已经把库过了一遍」 | 过了一遍 ≠ 带着「footer 该长什么样」的问题查过。热上下文自信是检索盲区高发时刻 |
| 「MUI/antd 都是 labels/actions 配置」 | 外部类比不是本库判例。本库对同一问题有自己的裁定，还写了理由 |
| 「label props 一行出三按钮，更省事」 | 省的是使用方的一行 `<X>文案</X>`，代价是文案和 variant 从 caller 手里被拿走——判例明确否决 |

## Red Flags —— 出现就停手回查

- 正在给新部件写 `xxxLabel?: string` 之类的**可见文案 prop**
- 正在部件内部写死 `variant=` 而它不是该部件的语义本身
- 新按钮部件名里出现 Confirm / Apply / Ok
- 一条 grep 都没跑就开始写部件签名
- 「这是全新能力」已经说出口，而下一步不是检索
