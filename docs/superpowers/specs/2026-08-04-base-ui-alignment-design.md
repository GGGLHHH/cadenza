# Base UI 全面对齐(0.3.0 内完成)

2026-08-04。前置:底座迁移已完成(见 `2026-08-04-base-ui-migration-design.md`)。
本篇是第二步:**行为、命名、context 习惯全部对齐 Base UI**,由 4-agent 源码调查
(42 条惯例、47 条偏差,逐条源码实证)驱动。惯例已固化进
`.claude/skills/base-ui-conventions/SKILL.md`,本文只记偏差 → 整改。

## 用户拍板

| 决定 | 选择 |
| --- | --- |
| skill 定位 | 替代已删的 wrapping skill,习惯手册 + 检查单合一 |
| 调查深度 | 词汇层 + 行为层 + 实现层全部 |
| eventDetails | **完整复刻含 cancel**(内部 setState 前查 isCanceled) |
| 表单序列化 | **对齐 Base UI**:name + 隐藏 input |
| 类型导出 | 平铺 + 必导 State 类型;泛型不退化 |
| DataTableColumn | `isRowHeader`→`rowHeader`、`allowsSorting`→`sortable` |

调查中顺手定的(无分叉或低危,recommendation 直接采纳):
报错模板用品牌前缀式 `cadenza-ui: XxxContext is missing. …`;
react-query adapter 面成文豁免;`dataAttr` 一行 util;
styles.css 宽容 variant 保留(vendored 还在写值型);
dev-only displayName 逐个设;受控空值改 `null`(undefined 专属非受控)。

## 整改批次

### A. 基础设施(src/lib + packages/utils)

- `dataAttr(cond)`:`cond ? '' : undefined`,全 seam 统一空串存在型。
- `change-event-details.ts`:`createChangeEventDetails(reason, event?)` 与
  `CadenzaChangeEventDetails<Reason>`,形状同构 `$B/internals/createBaseUIEventDetails.mjs`
  (reason / event / cancel() / allowPropagation() / isCanceled / isPropagationAllowed)。
  reason 字面量复用 Base UI 词表(reason-parts.mjs 的 35 词)。
- `useControllableState`(packages/utils):首渲染锁定受控性 + DEV 切换/改 defaultValue 警告
  (对照 `@base-ui/utils/useControlled.mjs`)。

### B. 改名(公开 API,全部随 0.3.0 一次清账)

| 文件 | 0.3.0-pre(现) | 0.3.0(终) |
| --- | --- | --- |
| search-field | `onChange` | `onValueChange` |
| search-field | `SearchFieldClearButton` | `SearchFieldClear` |
| search-field | `SearchFieldRenderProps` | `SearchFieldState` |
| infinite-select / infinite-combobox | `onInputChange` | `onInputValueChange` |
| infinite-combobox | `lockScroll` | `modal` |
| infinite-select | `InfiniteSelectClearButton` | `InfiniteSelectClear` |
| infinite-select | `InfiniteSelectConfirmButton` | `InfiniteSelectClose`(关闭并提交 = Close 语义) |
| infinite-select | `InfiniteSelectSearch` | 按词表定名(InputGroup 族),实施时定 |
| tabs | `Tab` / `TabList` / `TabPanel` / `TabIndicator` | `TabsTab` / `TabsList` / `TabsPanel` / `TabsIndicator` |
| data-table | `isRowHeader` / `allowsSorting` | `rowHeader` / `sortable` |
| data-pagination | `showLimitChanger` | 移除(show* 禁词;由 `limitOptions` 缺席表达) |
| button | `loading` 别名 | 移除,只留 `pending` |
| select | `SelectProps` 泛型退化 | 泛型别名转发 `SelectProps<Value, Multiple>` |

### C. 行为

- **eventDetails 接线**(SearchField / DataTable / InfiniteSelect / InfiniteCombobox /
  DataPagination):change 回调补 `(value, eventDetails)`;用户回调先跑,内部查
  `isCanceled` 决定是否 setState;reason 从词表挑
  (`input-change` / `clear-press` / `escape-key` / `item-press` / `trigger-press` /
  `outside-press` / `none` …)。SearchField 的独立 `onClear` 语义并入 reason。
  包装 Base UI 组件处(infinite-*)透传底层 details 而非丢弃。
- **表单序列化**:InfiniteSelect / InfiniteCombobox 根加 `name?`;单值 visually-hidden
  input,multiple 每值一个 `<input type="hidden">`(SelectRoot.mjs:372-447 模式)。
- **data-\* 空串化**:button `data-pending`、data-table 行 `data-selected`、
  search-field 根三属性、loading-overlay `data-loading` 全改 `dataAttr`。
- **根状态属性**:infinite-select、data-table 根补 `data-loading`/`data-empty`/`data-error`
  (空串),壳层样式从 JS 条件类迁到 CSS 变体。
- **受控空值**:infinite-select 单选空值 `undefined`→`null`,受控判定回
  `value !== undefined`,弃 key-presence。
- infinite-select 多选 checkbox 视觉从 JS 三元改 `group-data-selected` CSS 通道。
- `listClassName` 透传函数 className 类型(对齐 itemClassName)。

### D. Context

- SearchFieldContext:`use(…)?.` → 守卫 hook,统一报错模板。
- 报错文案三处收敛成模板:`cadenza-ui: XxxContext is missing. Xxx parts must be placed within <Xxx>.`
- value 补 `useMemo`:InfiniteSelectContext、InfiniteSelectStateContext、
  DataTableStateContext、InfiniteCombobox 的 actions(close 用稳定引用)。
  SearchFieldContext 豁免(逐键变,已注释)。
- `InfiniteSelectActionsProvider` 标 `@internal` 并停止导出。
- 全部 context 补 dev-only displayName。

### E. 涟漪与验证

- tests / docs demos / 组件文档页 / CHANGELOG(改名表扩充;删「isRowHeader/allowsSorting
  故意保留」两行豁免注)。
- `pnpm test` + typecheck(ui/docs/utils)+ lint;浏览器复查:cancel 生效、
  隐藏 input 序列化、空串化后选中行底色、sticky 表头。

## 结果(2026-08-05)

A–E 全部落地。验证:148 单测全绿(新增 cancel 拒改、reason 断言、隐藏 input
序列化、受控锁定警告)、typecheck ×3 干净、lint 0 error(8 条既有 warning)、
build+publint 干净(105.18 kB / gzip 24.94 kB),浏览器 7 项视觉/行为断言全过
(checkbox 的 `group-data-selected/option` CSS 通道、空串 `data-selected` 后的
选中行底色、改名后的 tabs 指示器与 `:has()` 抑制)。实施中修正两处计划外:
`InfiniteSelectSearch` 的词表定名为 `InfiniteSelectInputGroup`(Base UI 的
combobox 家族自有 InputGroup 部件);隐藏 input 采用普通 `type="hidden"` 而非
Base UI 的可聚焦 visually-hidden(那套机械为原生校验和 autofill 存在,本组件
两者都不参与),弹层宿主的隐藏 input 渲染在触发器旁。skill 已同步修正。

## 保持不动(有意,非遗漏)

- react-query adapter 面的 `is*` 字段(成文豁免,见 skill §1.1)。
- `SelectLabel` 词义冲突(shadcn 继承,注释已澄清;新代码用 GroupLabel)。
- seam field.tsx 的纯 DOM label 线(base-nova 上游背书)。
- styles.css 宽容 `@custom-variant`(vendored 仍写值型)。
- LoadingMore/NoMore 自造部件词(词表无对应且语义不重叠,已在 skill 固定)。
- 封闭复合件不透传 rest/ref、context 传状态(既定第二套家法)。
