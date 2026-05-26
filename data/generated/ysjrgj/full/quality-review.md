# 衍生金融工具 full 质量报告

## 处理对象

本轮只修正 full 版本中的可视化语义。未导入数据库，未修改代码、脚本、Prisma schema、学生端页面、docs 或 sample 目录。

## 本轮修正重点

- 全局审查 visualBlocks 的语义使用，重点检查 process_flow、decision_tree、timeline、cashflow_diagram、concept_map、comparison_table、payoff_chart 和 chart_explanation。
- 修正把并列概念误用箭头连接的情况，避免学生误解为时间顺序或逻辑推进。
- 修正现金流可视化里方向不够严谨的箭头，只保留可以确定方向的现金流、清算或风险控制关系。

## 可视化语义检查规则

1. 并列概念不得使用箭头流程展示。
2. 箭头仅用于顺序、判断、现金流或操作推进。
3. 分类关系优先使用 comparison_table 或 concept_map。
4. 策略收益优先使用 payoff_chart。
5. 现金流关系优先使用 cashflow_diagram。

## 本轮统计

- 检查 visualBlocks：185 个。
- 修正语义错误：4 个 block。
- 其中将 decision_tree 改为 comparison_table：1 个。
- 调整 cashflow_diagram 箭头语义：3 个。

## 具体修正

- concise 第七章 cashflow_diagram：Apple 与 Flower 利率互换现金流
- detailed 第七章 cashflow_diagram：Apple 与 Flower 利率互换现金流
- detailed 第二章 cashflow_diagram：中央清算后的共同对手方结构
- detailed 第十章 decision_tree -> comparison_table：期权到期执行判断路径

## 第十章与第十二章检查

- 第十章：四类期权头寸不再用 decision_tree 连接为分支，已改为 comparison_table 展示权利义务、到期判断、最大收益和最大损失；收益形状继续由 payoff_chart 表达。
- 第十二章：期权策略类别仍使用 comparison_table 做分类对比，收益结构使用 payoff_chart；保留 decision_tree 仅用于“根据市场观点选择策略”的判断路径，不把策略本身画成先后顺序。

## 仍需人工核对的内容

- 本轮未发现必须人工判断的可视化语义关系。
- 德国金属公司案例、金融危机流动性案例、互换确认书和较淡数据表仍属于内容细节核对范围，不属于本轮语义修正范围。

## 校验状态

- full 的 concise 与 detailed JSON 已按 framework-schema.ts 结构生成，等待本轮最终校验。
- 本轮未生成测验或练习内容。
- 本轮未运行 import:content，未写入数据库。

## 是否建议导入数据库

暂不建议立即导入。建议先通过 full 预览页检查第十章对比表、第七章现金流图和第二章中央清算图的显示效果。
