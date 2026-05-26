# 固定收益证券 full 内容质量报告

## 处理范围

- 课程：固定收益证券
- courseId：gdsyzq
- 原始资料目录：source-materials/gdsyzq/
- 输出目录：data/generated/gdsyzq/full/
- 资料类型：PPTX
- full 覆盖章节数：8

## 章节与资料对应

- 第一章：概论：1.概论(3).pptx（32 张幻灯片）
- 第二章：债券基本概念与债券市场组成：2.债券基本概念与债券市场组成(2).pptx（47 张幻灯片）
- 第三章：债券收益率：3.债券收益率(2).pptx（55 张幻灯片）
- 第四章：债券定价（一）：国债定价与无套利估值：更新版 4.债券定价 (一).pptx（54 张幻灯片）
- 第五章：债券定价（二）：含嵌入期权债券定价：5.债券定价 (二)(4).pptx（46 张幻灯片）
- 第六章：债券定价（三）：Z利差、OAS与可转换债券：6.债券定价 (三) 更新版.pptx（55 张幻灯片）
- 第七章：债券定价（四）：MBS与ABS估值：7.债券定价 (四)(3).pptx（30 张幻灯片）
- 第八章：债券投资风险（一）：信用风险与风险衡量：8.债券投资风险（一）(2).pptx（76 张幻灯片）

## chunk 提取情况

- sample chunks：78
- full chunks：394
- PPTX 文本可直接抽取，表格文本大多可抽取。部分图片、截图和复杂图形只能通过页面文字和标题推断学习含义，未伪造图片路径。

## 每章 visualBlocks

- 第一章：概论：concept_map、comparison_table、process_flow、data_table、case_card、chart_explanation
- 第二章：债券基本概念与债券市场组成：concept_map、comparison_table、formula_card、timeline、decision_tree、case_card
- 第三章：债券收益率：comparison_table、formula_card、example_box、process_flow、curve_chart
- 第四章：债券定价（一）：国债定价与无套利估值：formula_card、process_flow、comparison_table、cashflow_diagram
- 第五章：债券定价（二）：含嵌入期权债券定价：formula_card、process_flow、comparison_table、decision_tree
- 第六章：债券定价（三）：Z利差、OAS与可转换债券：formula_card、comparison_table、process_flow、example_box
- 第七章：债券定价（四）：MBS与ABS估值：formula_card、cashflow_diagram、process_flow、comparison_table、timeline、case_card
- 第八章：债券投资风险（一）：信用风险与风险衡量：concept_map、comparison_table、formula_card、process_flow、data_table、case_card

## visualBlocks 类型统计

- concept_map：3
- comparison_table：9
- process_flow：7
- data_table：2
- case_card：4
- chart_explanation：1
- formula_card：16
- timeline：2
- decision_tree：2
- example_box：2
- curve_chart：1
- cashflow_diagram：2

## 已重建的图表和结构

- 债券类型、条款类型、收益率指标、期限结构理论、嵌入期权债券、利差指标、MBS/ABS、债券风险等内容已转为 comparison_table 或 concept_map。
- 债券生命周期、利率树估值、OAS 校准、MBS/ABS 蒙特卡罗估值、Credit Metrics 计算流程已转为 process_flow 或 timeline。
- 附息债券现金流和资产证券化现金流已转为 cashflow_diagram。
- 收益率曲线形态已转为 curve_chart。

## 需要人工重点核对

- PPT 中部分截图、外部网页和图片型图表无法稳定读取，建议预览后决定是否人工截图补充。
- 债券定价表格中部分精确现值数字、利率树节点数值和 Altman Z 值模型完整系数未写入 framework，避免误填；如需精确计算样例，应人工核对原 PPT 表格。
- MBS/ABS 章节中的路径模拟图和现金流示意已做等效结构化重建，但没有直接插入原图。
- 课程后续如果补充“债券投资组合管理”和“中国债券市场实务”资料，应扩展 full 章节。

## 可视化语义检查

- 并列概念使用 comparison_table、concept_map 或 data_table。
- 箭头流程仅用于时间顺序、机制流程、判断分支或现金流方向。
- 债券现金流和资产证券化现金流使用 cashflow_diagram。
- 收益率曲线使用 curve_chart，未把普通分类误画成流程。

## 结论

- 当前 full 版本适合进入 /admin/preview/generated?course=gdsyzq&variant=full 预览。
- 本轮未导入数据库。
- 建议人工审核图表重建效果和精确数值案例后，再决定是否导入。
