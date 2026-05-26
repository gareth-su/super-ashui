# Project Handoff

## 1. 项目目标

这是一个面向期末复习的课程学习网站。当前样板课程是《衍生金融工具》。开发者离线整理课程资料，学生端用于知识学习、公式理解、案例复习、图表化理解。

当前主要路径不是运行时 AI 生成，而是使用 Codex / GPT Pro 等工具离线解析 PDF，生成结构化 JSON，再用于后台预览或后续导入数据库。

核心目标：把原始课程资料转成适合学生复习的结构化学习内容，包括章节知识框架、公式、案例、例题、现金流、图表、流程和判断路径。

## 2. 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Vercel

## 3. 当前重要路径

- `source-materials/ysjrgj/`：原始 PDF，本地资料目录，不应提交真实课件。
- `data/generated/ysjrgj/sample/`：样板内容。
- `data/generated/ysjrgj/full/`：整门课完整候选内容。
- `/admin/preview/generated?variant=full`：预览 full 内容。
- `/framework`：正式学生端页面。
- `src/lib/ai/framework-schema.ts`：framework JSON schema。
- `src/components/framework/VisualBlockRenderer.tsx`：visualBlocks 渲染器。
- `src/components/framework/MathText.tsx`：正文 inline LaTeX 渲染组件。

## 4. 当前 visualBlocks 支持情况

当前 `visualBlocks` 支持以下 block type：

1. `process_flow`：机制流程图，用于展示线性步骤、交易流程、制度流程。
2. `comparison_table`：概念对比表，用于展示多个概念在不同维度上的差异。
3. `formula_card`：公式卡片，用于展示公式、LaTeX 公式、变量解释、用途和易混点。
4. `concept_map`：概念关系图，用于展示概念卡片和概念之间的关系。
5. `image`：图片引用，用于展示已经放入 public 目录的图片资源。
6. `case_card`：案例卡片，用于展示真实事件、公司案例、市场案例和复习启示。
7. `data_table`：数据表，用于展示现金流表、保证金表、利率表、收益表、市场数据等。
8. `example_box`：数值例子或例题，用于展示条件、计算步骤、结果和复习要点。
9. `chart_explanation`：图表说明，用于在无法结构化绘制原图时，用结构化文字解释图形含义。
10. `payoff_chart`：期权收益图，用于展示期权或期权组合策略的 payoff / profit 曲线；已增强支持 `regions`、`metrics`、`legs`。
11. `line_chart`：折线趋势图，用于展示保证金余额、价格、利率等趋势变化。
12. `curve_chart`：概念曲线图，用于展示收益率曲线、基差收敛、凸性关系等概念性曲线。
13. `cashflow_diagram`：现金流方向图，用于展示互换结构、负债转换、中央清算关系、对手风险流转等。
14. `decision_tree`：判断分支图，用于展示套利方向选择、对冲策略选择、期权是否执行判断等条件分支。
15. `timeline`：时间线，用于展示交易生命周期、现金流时间点、互换不同阶段等。

## 5. 当前内容状态

- `full` 已覆盖《衍生金融工具》现有 9 章。
- `concise` / `detailed` 两版均存在。
- 已多轮优化公式、案例、图表、现金流图、期权收益图。
- 当前仍在优化页面结构和 UI。
- 不应继续大幅新增内容类型，除非明确发现现有 block type 无法表达某类关键教学内容。

## 6. 当前页面结构问题

历史问题：原页面把所有章节一页展示，full + detailed 时内容过长，页面像长文档预览器，不像正式学习网站。

当前选择方案 B：顶部章节标签页。

目标结构：

- 顶部切换章节。
- 主体只展示当前选中章节。
- 右侧显示当前章节大纲。
- 底部提供上一章 / 下一章导航。
- 现阶段不考虑移动端专项适配，优先优化桌面端学习体验。

## 7. 当前 UI 改造要求

- 采用顶部章节标签页。
- 保留 concise / detailed 切换。
- `/admin/preview/generated` 保留 sample / full 切换。
- visualBlocks 不能全部堆到一个“可视化内容”板块。
- visualBlocks 应尽量出现在对应知识点附近。
- 可以有“图表汇总”区域，但不能只有汇总区域。
- `decision_tree` 必须表现为条件分支，不要像顺序流程。
- `/framework` 不要出现“固定课程框架”“artifact”“fallback”等内部实现语言。
- `/admin/preview/generated` 可以保留预览属性，但主视觉应更像内容预览，调试路径和 JSON 信息应放入折叠区。

## 8. 禁止事项

- 不修改 generated JSON，除非任务明确要求内容修正。
- 不修改 `data/generated/ysjrgj/full/`，除非任务明确要求。
- 不修改 sample 内容，除非任务明确要求。
- 不修改 Prisma schema，除非明确要求。
- 不导入数据库，除非明确要求。
- 不调用在线 AI API。
- 不生成题库。
- 不提交 `source-materials/` 下真实课件。
- 不提交 `prisma/dev.db`。
- 不随意重写 `fixed-course-framework.ts`。
- 不把并列概念画成顺序流程。
- 不出现空引用：例如“如图2.1所示”但页面没有对应图或等效可视化。

## 9. 当前下一步

优先执行页面结构改造：方案 B 顶部章节标签页。

下一步重点：

- 修改 `/framework` 和 `/admin/preview/generated`，使其只展示当前选中章节。
- 强化章节导航、右侧章节大纲、concise / detailed 切换。
- 不做移动端专项适配。
- 不改内容，只改页面结构和展示体验。
- 继续复用 `VisualBlockRenderer`，不要重写 visualBlocks 渲染逻辑。

## 10. 常用验证命令

```bash
npm run lint
npm run build
npm run validate:content
```

`npm run validate:content` 默认校验 `data/generated/ysjrgj/`。可以用 `CONTENT_VARIANT=sample` 校验 `data/generated/ysjrgj/sample/`，或用 `CONTENT_VARIANT=full` 校验 `data/generated/ysjrgj/full/`。

每次涉及页面结构、schema、content validation 相关代码时，建议至少运行以上三条命令。
