# 第二章期货市场的运作机制 - sample 优化质量报告

## 1. 处理对象

- 文件名称：`02期货市场的运作机制.pdf`
- 本次只优化 `data/generated/derivatives/sample/` 下的样板内容。
- 未导入数据库，未修改代码，未修改学生端页面，未修改 Prisma schema。

## 2. 本章核心主题

本章围绕“期货市场如何运作”展开。优化后的框架把重点放在机制理解上：标准化合约如何形成，多头和空头如何建立，保证金账户如何随每日结算变化，头寸如何通过平仓或交割退出，交易所和清算机制如何降低信用风险。

## 3. 页面展示优化

已从 `framework-concise.json` 和 `framework-detailed.json` 的网页可见文字中移除：

- 资料来源描述
- 页码描述
- chunk 标识
- 内部整理痕迹
- 对原始编号表格和编号图示的空引用

visualBlocks 中也删除了 `source` 字段，避免后续渲染逻辑扩展时把来源信息展示出来。chapter 的 `sourceFile` 已置为空字符串，以尽量减少当前页面上的来源值显示。

## 4. 空引用处理

原先直接提到的编号表格和编号图示，已经改成两类处理：

- 能重建的内容改为 visualBlocks，例如远期合约与期货合约对比、保证金账户相关概念对比、每日盯市流程、中央清算流程。
- 不需要重建的内容改成普通机制说明，例如价格收敛、报价字段和外汇报价口径。

这样学生在网页上看到的每个“流程”“对比”“公式”“关系图”，都对应实际可见的 visualBlock，而不是指向不存在的原图或原表。

## 5. chunk 情况

底层 `chunks.json` 仍保留 10 个资料切片，用于内部追溯和后续导入前复核。它不属于 `/framework` 页面展示内容，因此没有按页面展示规则清除内部来源字段。

## 6. concise 与 detailed 差异

`framework-concise.json`：

- 面向考前快速复习。
- 节点更短，解释更少。
- 只保留主线、核心概念、关键计算逻辑、主要易混点和 5 个高价值 visualBlocks。

`framework-detailed.json`：

- 面向系统学习。
- 展开机制链条、概念组、公式逻辑、场外市场制度扩展、易混点和复习路径。
- 使用更多 visualBlocks 承担流程、对比、公式和概念关系展示。

## 7. visualBlocks 覆盖情况

已重建或优化的 visualBlocks 包括：

- `process_flow`：期货交易基本流程。
- `process_flow`：每日盯市与保证金调整流程。
- `process_flow`：追加保证金触发流程。
- `process_flow`：平仓或交割的退出流程。
- `process_flow`：中央清算降低违约风险的流程。
- `formula_card`：期货每日盈亏计算逻辑。
- `comparison_table`：远期合约 vs 期货合约。
- `comparison_table`：初始保证金 vs 维持保证金。
- `comparison_table`：平仓 vs 交割。
- `comparison_table`：场外抵押 vs 中央清算。
- `comparison_table`：保证金账户相关概念对比。
- `comparison_table`：未平仓数量 vs 成交数。
- `concept_map`：本章核心概念关系图。

没有生成 `image` block，因为当前没有放入 `public/` 的可引用图片资源。

## 8. 结构调整检查

优化后的 chapter 内部结构已经把“章节定位”从具体知识点中分离：

- chapter `summary` 承担一句话定位、课程作用和主线。
- nodes 的第一个一级节点是“章节总览”。
- 具体知识点放在“核心机制”“核心概念”“关键公式与计算逻辑”“易混点”等节点中。
- visualBlocks 放在 chapter 下，作为流程、表格、公式、概念关系的展示辅助。

## 9. 人工复核建议

建议重新预览 concise 和 detailed 两种页面：

- 检查页面上是否还出现来源、页码或内部标识。
- 检查新增对比表和流程图是否比原先纯文字更清楚。
- 检查公式卡中多头/空头方向和追加保证金逻辑是否符合老师口径。
- 检查 detailed 是否足够系统，concise 是否足够短。

## 10. 是否建议进入批量生成阶段

暂不建议直接进入无人值守批量生成。建议先以本次优化后的 sample 作为标准模板，确认展示效果、层级结构和 visualBlocks 形态都满意后，再迁移到其他章节。
