---
name: reading-base-ui-internals
description: Use when the seam needs a runtime mechanism Base UI does not hand over as a prop — deciding whether focus left the field, whether a press was "outside", how a popup nested in another popup is recognised, what a portal's container resolves to. Especially when about to invent a data attribute, marker, ref or closest() query so two Base UI parts can recognise each other, or when a containment check (`ref.current.contains(x)`) returns false for something that is obviously ours.
---

# 读 Base UI 的内部判据（不是它的 API）

## Overview

**Base UI 暴露给你的是 props；它内部还有一整套判据，你的 seam 遇到的
"机制问题"多半在那套判据里已经解决过。**[[base-ui-conventions]] 管公开面
**长什么样**（词形、data-*、协议），本技能管**里面怎么算**——焦点算不算
离开、按下算不算外部、嵌套弹层算不算自己人。

判据不是 API，不会出现在 `.d.ts` 里。要拿到它，只能读
`packages/ui/node_modules/@base-ui/react/floating-ui-react/`（下称 `$F`）。

本技能来自真实失败：DatePicker 弹层里放本库 Select 做年月下拉，输入框的
失焦判定 `popupRef.current.contains(next)` 判不出那个下拉——它 portal 出去了。
于是自造 `data-calendar-nav` 标记 + `next.closest()` 认亲，写了测试、过了
RED、上线级别的完整度。被打回后读 `$F/components/FloatingFocusManager.js:262`，
发现 Base UI 判"焦点去了无关的地方"检查的是
`contains(portalContext?.portalNode, relatedTarget)`——**锚点是 portal 节点，
不是 popup 元素**。换成 portal 节点后，标记、closest、注释全部删除，判定还
顺带覆盖了任何嵌套进来的 Base UI 弹层。

> 验证状态：按 [[writing-skills]] 属**未跑 baseline 的豁免部署**（用户
> 拍板写入）。失败实录是单次真实事故，没有用 subagent 复现过 RED，所以
> 触发条件是推测的：大概率是「上游没这个 prop」被当成了「上游没解决」。
> 下次谁撞上同类问题，回来补一句它当时的原话。

## 触发场景

- 手写「焦点是否还在本控件内」「这次按下算不算外部」的判定
- 弹层里出现第二个弹层（Select/Combobox/Menu 嵌在 Popover/Dialog 里）
- `ref.current.contains(x)` 对一个明明是自己人的元素返回 false
- 正准备加一个 data 属性 / class / id 让两个 Base UI 部件互相认识

## 配方

1. **按问题词定位判据文件**（先例已验证的三处）：

   ```bash
   B=packages/ui/node_modules/@base-ui/react
   grep -rn "movedToUnrelatedNode\|isFocusInsideFloatingTree" $B/floating-ui-react/components/FloatingFocusManager.js
   grep -rn "resolvedContainer\|parentPortalNode"            $B/floating-ui-react/components/FloatingPortal.js
   grep -rn "outsidePress\|isEventTargetWithin"              $B/floating-ui-react/hooks/useDismiss.js
   ```

2. **抄那一行布尔表达式，别抄结论**。它是一串 `||`，每一项都是一条已裁定的
   「这也算自己人」。把你的判定改成它的**同一个锚点**，而不是在你原来的锚点上
   打补丁。

3. **拿到锚点的引用走 Base UI 自己的 ref**，不要 DOM 爬树。
   `Popover.Portal` / `Select.Portal` 都是 `forwardRef<HTMLDivElement>` 直通
   `FloatingPortal`，ref 收到的就是 portalNode：`<Popover.Portal ref={portalRef}>`。

4. **验证判据真的在承担工作**：把那一条从表达式里删掉，测试必须变红。
   没红就说明是别的东西顺带兜住了，你抄错了地方。

## 已挖出的判据（可直接复用）

- **焦点归属的锚点是 portal 节点，不是 popup 元素**
  （`FloatingFocusManager.js:262` 的 `contains(portalContext?.portalNode, …)`）。
- **嵌套的 `FloatingPortal` 自动挂进父 portal 节点**，不是 `<body>`：
  `resolvedContainer = containerProp ?? parentPortalNode ?? document.body`
  （`FloatingPortal.js:64`）。所以"弹层里的弹层"天生落在父 portal 子树内——
  **不需要认亲**。
- 认亲的另外两条通道：`insideElements`（显式声明"这些外部元素算我的"）和
  floating tree 的父子节点遍历。自造标记之前先问这两条够不够。

## 说辞表（实录）

| 说辞 | 事实 |
| --- | --- |
| 「Base UI 没暴露这个能力，只能自己写」 | 没暴露成 prop ≠ 没解决。判据在源码里，读得到就抄得到 |
| 「portal 出去了，DOM 上够不着，只能打标记」 | 正是本次原话。够不着的是 popup 元素；portal 节点够得着，而且 Base UI 用的就是它 |
| 「我的方案有测试、验过 RED、能工作」 | 能工作的自造机制仍是自造机制：它要维护、会漂移、覆盖面比上游判据窄 |
| 「读 node_modules 太重了」 | 一条 grep 的事。这次三条 grep 换掉了一整套标记 + closest + 两处注释 |
| 「先上，回头再对齐上游」 | 自造标记一旦进 DOM 就是公开契约，回头要按 breaking 处理 |

## Red Flags —— 出现就停手回查

- 正在给一个 Base UI 部件加自造 `data-*`，目的是让另一个部件认出它
- 判定里出现 `closest('[data-...]')` 而两端都是 Base UI 弹层
- 说得出「Base UI 应该有办法，但我没找到」——那就是去 grep 的信号，不是
  自己写的许可
- 手写的 containment 判定只检查了自己的 popup/root，没检查 portal 节点
- 打算 DOM 爬树（`parentElement.parentElement`）拿 portal 节点，而不是用
  Portal 的 ref

## 版本漂移

行号会随 `@base-ui/react` 升级变化，函数名（`movedToUnrelatedNode`、
`resolvedContainer`、`parentPortalNode`）比行号稳。判据变了要一并修 seam ——
这是抄判据而不是抄 API 的代价，写进注释认下来。
