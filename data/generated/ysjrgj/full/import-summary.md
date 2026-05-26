# 衍生金融工具 full 离线内容生成摘要

## 处理范围

- 课程：衍生金融工具
- courseSlug：ysjrgj
- 资料目录：source-materials/ysjrgj/
- 输出目录：data/generated/ysjrgj/full/
- 本次未导入数据库，未修改代码，未修改学生端页面，未处理其他课程。

## 本轮优化

本轮专门优化 full 中的 case_card 和 example_box：

- case_card 统一改为案例材料风格：背景、情境、机制分析、复习启示、相关概念。
- example_box 统一改为例题卡片风格：条件、计算步骤、结果、复习启示。
- 新增第三章“铜采购的多头对冲”例子。
- 公式表达采用 inline LaTeX 风格，避免 F0、S0、e^(...) 和普通乘号残留。
- 没有新增题库内容，没有写入数据库。

## 统计

- 改写 case_card：6 个。
- 改写 example_box：21 个。
- concise 保持压缩版，只保留关键例子。
- detailed 保留更完整的条件、操作、计算和复习启示。

## 校验说明

- npm run validate:content 已通过，但该脚本默认校验根目录内容。
- 已额外用 framework-schema.ts 对 data/generated/ysjrgj/full/framework-concise.json 和 data/generated/ysjrgj/full/framework-detailed.json 做 schema 校验，均通过。
- 未运行 import:content，未写入数据库。

## 预览说明

当前 /admin/preview/generated 已支持 sample/full 切换，可通过 /admin/preview/generated?variant=full 查看 full 版本。
