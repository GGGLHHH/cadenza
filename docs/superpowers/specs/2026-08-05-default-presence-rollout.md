# 默认在场(三态)逐家族对齐

2026-08-05。前置:家法成文于 skill `base-ui-conventions` §7.10,Select 已打样
(见 `bbd955e`)。本篇是全库盘点与其余家族的落地记录。

**判据**(逐家族逐部件问一遍):

1. 忘写这个部件,使用方会不会自己魔改?(会 → 该默认在场)
2. 它改语义吗?(改 → 只走 A 层默认组合 + 裸形容词总开关;无害结构件 → B 层组合路径也隐式补)
3. 它有文案吗?(有 → 不能默认,库零文案)

## 判定表

| 家族 | 部件/能力 | 判定 | 依据与机制 |
| --- | --- | --- | --- |
| Select | 全家 | ✅ 已打样 | 一行式 + 隐式组 + trigger 默认组合 + `clearable` |
| Tabs | 面板交叉滑动 + `TabsViewport` | ✅ **默认在场**(后补) | 官方 animated-panels 同款(175ms/350ms/±50%)。容器义务由根组件隐式代劳:连续 TabsPanel 自动收进 TabsViewport(B 层,同格叠放);`viewport={false}` 回退免容器进场微滑;藏进自定义包装的面板收不进(直接子元素边界)。教训 ×3:Base UI 的卸载等待启发式只看元素有无过渡时长(不看样式是否在变);Tailwind v4 位移走 translate 属性,过渡列表写 transform 会变瞬跳;vendored 根吞掉 orientation 从不传给 Base UI(上游 bug,纵向语义全坏、方向永远 none)——seam 直渲 Base UI Root 绕过,纵向动画由此才通 |
| Tabs | `TabsIndicator` | ✅ **默认在场**(本轮) | 6/6 demo 全写、零定制——它就是本库 tabs 的长相,忘写=长得和文档不一样。B 层:`TabsList` 自动渲染;`indicator={false}` 关默认那只;自己组合则让位(`findComposedPart` 检测)。开关只管默认的——indicator 不改语义,组合的归组合管(与 Select `clearable` 总开关语义不同,JSDoc 已注明) |
| InfiniteSelect | `InputGroup`+`List` | ✅ **默认组合**(本轮) | 裸面板不给 children 什么都不渲染,是「必须背部件名」的反例。A 层:children 缺席 → InputGroup+List;新增 `searchPlaceholder`(与 InfiniteCombobox 同词) |
| SearchField | 默认组合 | ✅ 早已符合 | 家法的原型:icon+input+clear 默认组合 |
| SearchField | `clearable` | ✅ **补总开关**(本轮) | 与 Select 对齐:默认开,`false` 连显式组合的一并关(clear 改语义 → 总开关)。Escape 清空不受管——那是 search 输入框自己的键盘语义 |
| InfiniteCombobox | 面板部件 | ✅ 早已符合 | 便利层本来就默认组好 InputGroup+List |
| InfiniteSelect/DataTable | LoadingOverlay/LoadingMore/NoMore | ✅ 早已符合 | 标记部件「组合是定制不是开关」,默认视觉照常渲染 |
| DataTable | 列驱动主体 | ✅ 早已符合 | monolith,columns 数据驱动 |
| DataPagination | 全家 | ✅ 早已符合 | monolith;`limitOptions` 有默认,标签英文兜底 |

## 判定为「不默认」的(有意,非遗漏)

| 部件 | 为什么不默认 |
| --- | --- |
| `SelectEmpty` / `InfiniteSelectEmpty` / `DataTableEmpty` / `*Error` | 内容槽,库零文案——默认在场就得替使用方写字 |
| `SelectClear`(手写组合路径上) | 改语义,A 层裁量:只住默认组合,手写 trigger 时显式组合 |
| `DataTable.selectionColumn` | 改语义(加一列真实复选框),显式开启 |
| `InfiniteSelectFooter` 一族 | 业务动作区,写不写本身就是产品决定 |
| 分组渲染(`SelectGroup`+`SelectLabel` 从数据出) | Base UI 用法:分组形态的 items 只喂标签解析,渲染分组是组合词汇 |

## 结果

Tabs / InfiniteSelect / SearchField 三处落地,172 单测全绿(新增 7:指示器三态、
裸面板默认组合与接管、clearable 总开关与 Escape 豁免),tsc ×3、lint 0 error、
build+publint 干净。tabs 的 6 个 demo 删去手写 `<TabsIndicator />`(默认在场后
demo 展示默认形态),浏览器验证指示器仍在、仍跟随悬停。
