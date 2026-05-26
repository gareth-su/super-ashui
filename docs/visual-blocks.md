# Visual Blocks 可视化内容块

## 概述

`visualBlocks` 是知识框架 JSON 中每个 `chapter` 的可选字段，用于在学生端 `/framework` 页面展示结构化的可视化复习内容。

该字段是完全可选的。旧的纯文字框架（没有 `visualBlocks`）仍然完全兼容，页面会保持原样。

## 支持的 block type

当前支持 15 种可视化内容块（含 1 种增强）：

### 1. `process_flow` — 机制流程图

用于展示线性流程、操作步骤、机制链条。

```json
{
  "type": "process_flow",
  "title": "期货交易基本流程",
  "description": "可选的整体说明",
  "steps": [
    {
      "label": "建立头寸",
      "description": "交易者买入或卖出期货合约"
    },
    {
      "label": "缴纳保证金",
      "description": "交易者向经纪商缴纳初始保证金"
    }
  ],
  "source": {
    "sourceFile": "可选：来源资料名称",
    "sourceChunkIds": ["可选：对应 chunk ID"]
  }
}
```

渲染效果：纵向编号步骤卡片，步骤之间用连线连接。

### 2. `comparison_table` — 概念对比表

用于展示两个或多个概念的维度对比。

```json
{
  "type": "comparison_table",
  "title": "远期合约 vs 期货合约",
  "headers": ["维度", "远期合约", "期货合约"],
  "rows": [
    ["交易场所", "场外交易", "交易所交易"],
    ["标准化程度", "个性化", "标准化"]
  ],
  "source": {
    "sourceFile": "可选"
  }
}
```

渲染效果：标准表格，支持横向滚动适配移动端。

### 3. `formula_card` — 公式卡片

用于展示公式、变量解释、用途和易混点。

支持两个公式字段：
- `formula`：普通文本 fallback（必填）
- `formulaLatex`：LaTeX 格式，用于 KaTeX 书面化数学公式渲染（推荐，可选）

```json
{
  "type": "formula_card",
  "title": "无收益资产远期价格",
  "formula": "F0 = S0 e^(rT)",
  "formulaLatex": "F_0 = S_0 e^{rT}",
  "variables": [
    {
      "symbol": "F_0",
      "meaning": "标的资产远期价格"
    },
    {
      "symbol": "S_0",
      "meaning": "当前现货价格"
    },
    {
      "symbol": "r",
      "meaning": "连续复利无风险利率"
    },
    {
      "symbol": "T",
      "meaning": "合约到期时间"
    }
  ],
  "usage": "用于计算无收益资产的远期理论价格。",
  "pitfalls": ["连续复利条件，不要和简单利率混用"],
  "source": {
    "sourceFile": "可选"
  }
}
```

渲染效果：
- `formulaLatex` 存在时，使用 KaTeX display 模式渲染数学公式（如 F_0 = S_0 e^{rT}）
- `formulaLatex` 不存在时，显示普通文本 `formula` 字符串
- LaTeX 渲染失败时自动 fallback 到 `formula`
- `variables` 中的 `symbol` 也支持 LaTeX 格式，会用 KaTeX inline 渲染
- 变量列表，用途说明，易混点用警告样式展示

### 4. `concept_map` — 概念关系图

用于展示概念之间的关联关系。当前使用概念卡片 + 关系列表，不引入复杂图可视化库。

```json
{
  "type": "concept_map",
  "title": "期货市场核心概念关系",
  "concepts": [
    {
      "name": "期货合约",
      "description": "标准化的交易合约"
    },
    {
      "name": "保证金",
      "description": "控制违约风险的担保资金"
    }
  ],
  "relations": [
    {
      "from": "期货合约",
      "to": "保证金",
      "relation": "期货交易需要保证金制度控制履约风险"
    }
  ],
  "source": {
    "sourceFile": "可选"
  }
}
```

渲染效果：概念以卡片网格展示，关系以箭头列表展示。

### 5. `image` — 图片

用于引用已有的图片文件。当前不支持自动从 PDF 抽图，只负责引用已手动放入 `public/` 目录的图片。

```json
{
  "type": "image",
  "title": "保证金制度示意图",
  "src": "/generated-assets/derivatives/margin-flow.png",
  "caption": "根据课件内容整理",
  "source": {
    "sourceFile": "可选",
    "sourcePage": 15,
    "sourceChunkIds": ["可选"]
  }
}
```

渲染效果：图片展示，加载失败时显示 fallback 文案。

图片文件需要手动放入 `public/` 目录。例如 `src` 为 `/generated-assets/derivatives/margin-flow.png` 时，对应文件应放在 `public/generated-assets/derivatives/margin-flow.png`。

**注意：`image` block 只引用真实存在的图片，不要伪造路径。**

### 6. `case_card` — 案例卡片

用于展示课件案例、真实事件、公司案例、市场案例。

与已有 block 的区别：`comparison_table` 用于概念对比，`case_card` 用于展示完整的案例故事和分析。

不需要 `source` 字段，页面不展示来源。

```json
{
  "type": "case_card",
  "title": "德国金属公司（MG）套期保值失败案例",
  "background": "案例背景...",
  "scenario": "案例情境...",
  "analysis": "案例分析...",
  "lesson": "复习启示...",
  "relatedConcepts": ["套期保值", "基差风险"]
}
```

字段说明：
- `title`：必填
- `background`、`scenario`、`analysis`、`lesson`：均为可选字符串
- `relatedConcepts`：可选，相关概念标签数组

渲染效果：独立卡片，4 个内容区块分别标注「背景」「情境」「分析」「复习启示」，浅 indigo 配色。relatedConcepts 显示为标签。

### 7. `data_table` — 数据表

用于展示课件中的真实数据：现金流表、套利表、利率表、收益表、市场数据。

与已有 block 的区别：`comparison_table` 用于概念对比（语义对比），`data_table` 用于真实数据和数值展示。

不需要 `source` 字段，页面不展示来源。

```json
{
  "type": "data_table",
  "title": "期货合约保证金追缴示例",
  "description": "可选说明文字",
  "headers": ["交易日", "结算价", "每日盈亏", "保证金余额", "追加保证金"],
  "rows": [
    ["Day 0", "$400.00", "—", "$4,000", "—"],
    ["Day 1", "$397.00", "−$600", "$3,400", "—"]
  ],
  "note": "可选备注"
}
```

字段说明：
- `title`：必填
- `headers`：必填，至少 1 项
- `rows`：必填，至少 1 行，每行为 `string[]`
- `description`：可选说明
- `note`：可选备注

渲染效果：标准表格，支持横向滚动。headers 加粗，note 用轻提示样式。

### 8. `example_box` — 数值例子

用于展示数值计算例子、课堂例子（保证金计算、套利计算、久期计算、期权策略收益等）。

与已有 block 的区别：`formula_card` 展示公式本身，`example_box` 展示公式的具体应用计算过程。

不需要 `source` 字段，页面不展示来源。

```json
{
  "type": "example_box",
  "title": "无套利定价：股指期货定价计算",
  "scenario": "已知条件或情境",
  "steps": [
    "步骤1：确定公式",
    "步骤2：代入数据",
    "步骤3：计算结果"
  ],
  "result": "期货理论价格 F₀ ≈ 1,007.53 点",
  "takeaway": "注意使用连续复利公式..."
}
```

字段说明：
- `title`：必填
- `steps`：必填，至少 1 项
- `scenario`：可选，已知条件
- `result`：可选，计算结果
- `takeaway`：可选，复习要点

渲染效果：步骤编号列表（紫色编号），scenario 在顶部灰色区块，result 在绿色突出区块，takeaway 在黄色提示区块。

### 9. `chart_explanation` — 图表说明

用于解释课件中的图形（收益图、曲线图、关系图等）。当无法直接抽取或展示原图时，用结构化方式解释图形含义。

对期权收益图、基差图、收益率曲线、久期凸性图等尤其重要。

不需要 `source` 字段，页面不展示来源。不需要真正画图。

```json
{
  "type": "chart_explanation",
  "title": "看涨期权买方收益图（Long Call Payoff）",
  "chartType": "payoff",
  "xAxis": "标的资产到期价格 S_T",
  "yAxis": "收益 / 利润",
  "elements": [
    {
      "name": "收益线（Payoff）",
      "meaning": "当 S_T ≤ K 时收益 = 0；当 S_T > K 时收益 = S_T − K"
    }
  ],
  "keyTakeaways": [
    "买入看涨期权最大损失为期权费 c",
    "理论最大收益无上限"
  ],
  "examTips": [
    "区分 payoff 和 profit"
  ]
}
```

字段说明：
- `title`：必填
- `keyTakeaways`：必填，至少 1 项
- `chartType`：可选，值为 `payoff | curve | timeline | relationship | other`
- `xAxis`、`yAxis`：可选
- `elements`：可选，图形元素说明
- `examTips`：可选，考试提示

渲染效果：chartType 显示为小标签，轴信息和图形元素列表展示，关键结论和考试提示分区展示。

**何时使用 `chart_explanation` vs 真实图表 block：**
- 能结构化出具体数据点或曲线 → 使用 `payoff_chart` / `line_chart` / `curve_chart`
- 不能可靠结构化出数据点（纯概念描述）→ 使用 `chart_explanation`

### 10. `payoff_chart` — 期权收益图

用于展示期权、期权组合、策略的收益/利润图。使用 recharts 库渲染真实坐标图。

适用场景：买入/卖出看涨/看跌期权、保护性看跌、牛市/熊市价差、跨式/宽跨式组合、蝶式组合等。

```json
{
  "type": "payoff_chart",
  "title": "买入看涨期权收益图（Long Call）",
  "description": "可选说明",
  "xAxis": "到期标的价格 S_T",
  "yAxis": "收益 / 盈亏",
  "curves": [
    {
      "name": "收益（Payoff）",
      "points": [
        { "x": 30, "y": 0 },
        { "x": 50, "y": 0 },
        { "x": 55, "y": 5 },
        { "x": 80, "y": 30 }
      ]
    }
  ],
  "breakEvenPoints": ["K + c = 55"],
  "annotations": [
    { "x": 50, "label": "执行价格 K" }
  ],
  "keyTakeaways": [
    "最大损失 = 期权费（有限亏损）",
    "理论最大收益无上限"
  ]
}
```

字段说明：
- `title`：必填
- `xAxis`、`yAxis`：必填
- `curves`：必填，至少 1 条，每条至少 2 个 points
- `keyTakeaways`：必填，至少 1 条
- `description`：可选
- `breakEvenPoints`：可选，盈亏平衡点标签
- `annotations`：可选，标注点（垂直虚线 + 标签）

渲染效果：recharts 折线图，支持多条曲线、y=0 参考线、标注点垂直虚线、盈亏平衡标签。图表下方展示关键结论。

### 11. `line_chart` — 折线趋势图

用于展示普通折线趋势：市场规模变化、价格变化、利率变化、账户余额变化、保证金账户变化等。

支持字符串 x 轴（如 "Day 1", "第2日"）和数值 x 轴。

```json
{
  "type": "line_chart",
  "title": "保证金账户余额变化示意",
  "description": "可选说明",
  "xAxis": "交易日",
  "yAxis": "账户余额（$）",
  "series": [
    {
      "name": "保证金余额",
      "points": [
        { "x": "Day 0", "y": 4000 },
        { "x": "Day 1", "y": 3400 },
        { "x": "Day 2", "y": 2660 }
      ]
    }
  ],
  "referenceLines": [
    { "value": 3000, "label": "维持保证金" }
  ],
  "keyTakeaways": [
    "余额低于维持保证金时触发追加保证金通知"
  ]
}
```

字段说明：
- `title`：必填
- `xAxis`、`yAxis`：必填
- `series`：必填，至少 1 条，每条至少 2 个 points
- `keyTakeaways`：必填
- `description`：可选
- `referenceLines`：可选，水平参考线（红色虚线 + 标签）

渲染效果：recharts 折线图，支持多系列、水平参考线、数据点标记。自动判断 x 轴类型（数值/分类）。

### 12. `curve_chart` — 概念曲线图

用于展示概念曲线，不一定需要精确数值。适用于收益率曲线、久期与债券价格关系、凸性关系、远期价格与现货价格关系、基差收敛等。

```json
{
  "type": "curve_chart",
  "title": "基差收敛示意图",
  "description": "可选说明",
  "xAxis": "距交割日（月）",
  "yAxis": "基差",
  "curves": [
    {
      "name": "基差",
      "shape": "converging",
      "points": [
        { "x": 6, "y": 8 },
        { "x": 3, "y": 3.2 },
        { "x": 0, "y": 0 }
      ]
    }
  ],
  "keyTakeaways": [
    "随着交割日临近，基差趋于零"
  ]
}
```

字段说明：
- `title`：必填
- `xAxis`、`yAxis`：必填
- `curves`：必填，至少 1 条，每条至少 2 个 points
- `keyTakeaways`：必填
- `description`：可选
- `shape`：可选，描述曲线形态（如 converging、increasing、decreasing）

渲染效果：recharts 平滑曲线图，带「概念曲线」标签和 shape 描述。用于表达方向和关系，不要求精确还原原图。

### 13. `cashflow_diagram` — 现金流方向图

用于展示金融现金流、互换结构、负债转换、中央清算关系、风险流转。

适用场景：
- 利率互换（Apple/Flower 双方现金流方向）
- 货币互换本金和利息交换
- 利率互换改变负债性质（固定 ↔ 浮动）
- 中央清算关系（CCP 在中间）
- 场外交易对手风险流转

```json
{
  "type": "cashflow_diagram",
  "title": "Apple 与 Flower 利率互换现金流",
  "description": "展示固定利率端和浮动利率端之间的现金流方向。",
  "nodes": [
    { "id": "apple", "label": "Apple", "role": "支付固定、收入浮动" },
    { "id": "flower", "label": "Flower", "role": "收入固定、支付浮动" }
  ],
  "edges": [
    {
      "id": "fixed-leg",
      "from": "apple",
      "to": "flower",
      "label": "支付固定利率",
      "cashflowType": "fixed",
      "timing": "每 6 个月"
    },
    {
      "id": "floating-leg",
      "from": "flower",
      "to": "apple",
      "label": "支付浮动利率",
      "cashflowType": "floating",
      "timing": "每 6 个月"
    }
  ],
  "phases": [
    { "title": "存续期间", "edgeIds": ["fixed-leg", "floating-leg"] }
  ],
  "outcome": "双方通常只交换净额，名义本金只用于计算利息。",
  "keyTakeaways": [
    "先判断谁付固定、谁收浮动。",
    "净额现金流取决于固定端和浮动端的大小。"
  ]
}
```

字段说明：
- `title`：必填
- `nodes`：必填，至少 2 个。每个 node 有 `id`（必填）、`label`（必填）、`role`（可选）
- `edges`：必填，至少 1 条。每条 edge 有 `id`、`from`、`to`、`label`（均必填），`cashflowType`（可选枚举：fixed、floating、principal、interest、net、collateral、risk_transfer、other）、`timing`（可选）
- `phases`：可选，分阶段展示。每个 phase 有 `title`（必填）和 `edgeIds`（必填，引用 edge.id）
- `outcome`：可选，整体结论
- `keyTakeaways`：必填，至少 1 条

渲染效果：节点以卡片展示，边以带颜色编码的箭头展示（不同 cashflowType 对应不同颜色），箭头上标注 label 和 timing。phases 分区显示。outcome 以绿色结论卡片展示。

### 14. `decision_tree` — 判断路径图

用于展示判断路径、套利方向选择、对冲策略选择、期权执行判断。

适用场景：
- 远期价格偏离时的套利方向选择
- 期权是否执行的判断
- 对冲策略的选择路径
- 互换定价中的利率判断

```json
{
  "type": "decision_tree",
  "title": "远期价格套利判断路径",
  "description": "根据市场远期价格与理论远期价格的关系判断套利方向。",
  "root": {
    "id": "root",
    "question": "市场远期价格是否高于理论远期价格？",
    "branches": [
      { "condition": "高于理论价格", "target": "cash-and-carry" },
      { "condition": "低于理论价格", "target": "reverse-cash-and-carry" }
    ]
  },
  "nodes": [
    {
      "id": "cash-and-carry",
      "label": "正向套利",
      "content": "买入现货，同时卖出远期合约。"
    },
    {
      "id": "reverse-cash-and-carry",
      "label": "反向套利",
      "content": "卖出现货或借入标的，同时买入远期合约。"
    }
  ],
  "keyTakeaways": [
    "套利方向由市场价格相对理论价格的偏离方向决定。"
  ]
}
```

字段说明：
- `title`：必填
- `root`：必填，含 `id`、`question`（必填）和 `branches`（至少 1 条，每条含 `condition` 和 `target`）
- `nodes`：必填，至少 1 个。每个 node 有 `id`（必填）、`label`（必填）、`content`（可选）
- `keyTakeaways`：必填，至少 1 条
- `description`：可选

渲染效果：纵向判断路径。根节点以带边框的高亮问题框展示，条件以小标签连接，目标节点以卡片展示内容。移动端友好的纵向布局。

### 15. `timeline` — 时间线

用于展示时间顺序、现金流时间点、交易生命周期。

适用场景：
- 货币互换在不同阶段的本金/利息现金流
- 期货合约的生命周期
- 互换协议从签订到到期的时间线
- 期权策略执行的时间节点

```json
{
  "type": "timeline",
  "title": "货币互换现金流时间线",
  "description": "展示货币互换在不同时间点发生的本金和利息现金流。",
  "events": [
    {
      "time": "期初",
      "title": "交换本金",
      "description": "双方按约定汇率交换两种货币本金。"
    },
    {
      "time": "存续期间",
      "title": "交换利息",
      "description": "双方定期支付各自货币的利息。"
    },
    {
      "time": "到期",
      "title": "返还本金",
      "description": "双方按初始约定金额返还本金。"
    }
  ],
  "keyTakeaways": [
    "货币互换通常包含期初和期末的本金交换。"
  ]
}
```

字段说明：
- `title`：必填
- `events`：必填，至少 2 个。每个 event 有 `time`（必填）、`title`（必填）、`description`（可选）
- `keyTakeaways`：必填，至少 1 条
- `description`：可选

渲染效果：纵向时间线，左侧有连接线和圆点标记，每个事件显示时间标签、标题和描述。移动端友好。

### payoff_chart 增强字段

在原有 `payoff_chart` 的基础上，新增 3 个可选字段，旧 JSON 无这些字段时仍正常渲染：

```json
{
  "type": "payoff_chart",
  "title": "牛市看涨价差",
  "regions": [
    { "fromX": 55, "toX": 65, "label": "盈利区", "kind": "profit" },
    { "fromX": 30, "toX": 50, "label": "最大亏损区", "kind": "loss" }
  ],
  "metrics": [
    { "label": "最大收益", "value": "K_2 - K_1 - 净期权费" },
    { "label": "最大损失", "value": "净期权费" }
  ],
  "legs": [
    { "name": "买入低执行价看涨期权", "position": "long_call", "strike": "K_1" },
    { "name": "卖出高执行价看涨期权", "position": "short_call", "strike": "K_2" }
  ]
}
```

- `regions`：可选。每个区域有 `fromX`、`toX`（数值范围）、`label`、`kind`（可选枚举：profit、loss、breakeven、other）。渲染为带颜色的标签。
- `metrics`：可选。每个指标有 `label` 和 `value`。渲染为小卡片。
- `legs`：可选。每条腿有 `name`（必填）、`position`（必填，如 long_call、short_put）、`strike`（可选）。渲染为策略组成列表。

## 关于图表引用的说明

「禁止空引用」的准确含义是：**禁止在文本中引用了某个图表但没有对应的图表或等效可视化内容来支撑。** 这不是禁止重建图表——恰恰相反，当课件中有重要图表时，应该用 `payoff_chart`、`line_chart`、`curve_chart`、`cashflow_diagram` 等 block 重建等效可视化，或至少用 `chart_explanation` 提供结构化的图表解读。

## 正文公式渲染（MathText）

所有 block type 的文本字段（如 description、scenario、analysis、steps、result、keyTakeaways、examTips、usage、pitfalls、elements.meaning 等）均支持行内 LaTeX 和块级 LaTeX 渲染。

### 支持的语法

| 语法 | 类型 | 示例 |
|------|------|------|
| `\( ... \)` | 行内公式 | `代入得到 \(F_0 = S_0 e^{rT}\)` |
| `\[ ... \]` | 块级公式 | `根据公式 \[F_0 = (S_0 - I)e^{rT}\]` |

### 示例

example_box 中使用行内公式：

```json
{
  "type": "example_box",
  "title": "股指期货定价计算",
  "scenario": "已知 \(S_0 = 0.7500\), \(r = 0.01\), \(q = 0.03\), \(T = 2\)",
  "steps": [
    "代入公式 \(F_0 = S_0 e^{(r-q)T}\)",
    "得到 \(F_0 = 0.7500e^{(0.01-0.03)\times 2} = 0.7206\)"
  ],
  "result": "理论价格 \(F_0 \approx 0.7206\)",
  "takeaway": "注意 \(r\) 和 \(q\) 都是连续复利，\(T\) 以年为单位"
}
```

### 渲染规则

- 只渲染被 `\( ... \)` 或 `\[ ... \]` 明确包裹的内容
- 不会自动把 `F0`、`S0`、`e^(rT)` 等转为公式
- LaTeX 渲染失败时自动 fallback 到原始文本，不会导致页面崩溃
- 一段文字中支持多个公式混合
- 没有 LaTeX 标记的文本保持原样

### 推荐写法

在 JSON 文本字段中嵌入 LaTeX：

```
"代入得到 \(F_0 = S_0 e^{rT}\)，因此远期价格受融资成本影响。"
```

**注意：** 不要在普通文本字段中使用 `$$...$$` 或 Markdown 代码块。只使用 `\(...\)`（行内）和 `\[...\]`（块级）。

## 如何在知识框架 JSON 中使用

`visualBlocks` 是每个 `chapter` 的可选字段：

```json
{
  "chapters": [
    {
      "chapterTitle": "第一章 期货交易机制",
      "summary": "...",
      "keyConcepts": ["..."],
      "nodes": [],
      "visualBlocks": [
        { "type": "process_flow", "..." : "..." },
        { "type": "comparison_table", "..." : "..." }
      ]
    }
  ]
}
```

如果某个章节不需要可视化内容块，不写 `visualBlocks` 字段即可，页面保持原样。

## Codex 生成时的使用建议

后续使用 Codex / GPT Pro 离线生成知识框架时，可以在 prompt 中指定：

1. 如果章节内容包含流程、步骤，使用 `process_flow`
2. 如果章节涉及两个以上概念的对比，使用 `comparison_table`
3. 如果章节包含公式、计算方法，使用 `formula_card`
4. 如果章节涉及多个相互关联的概念，使用 `concept_map`
5. 如果有需要引用的图片，使用 `image`（只引用真实存在的图片，不伪造路径）
6. 如果章节包含案例、真实事件、公司案例，使用 `case_card`
7. 如果章节包含数据表、现金流表、利率表、市场数据，使用 `data_table`
8. 如果章节包含数值计算例子、课堂例子，使用 `example_box`
9. 如果章节包含图表解读但无法结构化出数据点，使用 `chart_explanation`
10. 如果能结构化出期权收益/利润数据点，使用 `payoff_chart`（组合策略可使用 regions/metrics/legs 增强字段）
11. 如果能结构化出折线趋势数据点（余额变化、价格变化等），使用 `line_chart`
12. 如果能结构化出概念曲线数据点（收益率曲线、基差收敛等），使用 `curve_chart`
13. 如果章节涉及现金流方向、互换结构、清算关系、风险流转，使用 `cashflow_diagram`
14. 如果章节包含判断路径、套利方向选择、策略选择，使用 `decision_tree`
15. 如果章节包含时间顺序、交易生命周期、分阶段现金流，使用 `timeline`

生成的 JSON 需要通过 `npm run validate:content` 校验。

### 在文本字段中使用 LaTeX 公式

所有文本字段（description、scenario、steps、result、takeaway、analysis、lesson、usage、pitfalls、keyTakeaways、examTips 等）都支持行内 LaTeX。

将课件中的数学公式用 `\( ... \)` 包裹写入 JSON 字段即可：

```
代入得到 \(F_0 = S_0 e^{(r-q)T}\)，因此理论价格取决于融资成本和股息率。
```

不要在普通文本中使用：
- `$$...$$`（不支持）
- Markdown 代码块（不支持）
- `F0 = S0 e^(rT)` 等非规范写法（不会被自动识别）

## 当前限制

- 不支持自动从 PDF 抽取图片
- `image` block 只能引用已手动放入 `public/` 目录的图片
- `concept_map` 目前使用卡片 + 关系列表，不使用复杂图可视化库
- 不引入 Mermaid
- 图表使用 recharts 轻量库渲染，不引入 D3 等大型库
- 不连接 AI API
- 不自动生成内容

## Schema 校验

`visualBlocks` 的结构校验复用了 [framework-schema.ts](../src/lib/ai/framework-schema.ts)，使用 Zod `discriminatedUnion` 按 `type` 字段区分不同 block。

在线生成和离线导入使用同一套 schema。

## 示例文件

完整示例参见：

```text
data/generated/ysjrgj/example-visual-framework.json
```

该文件包含所有 15 种 block type 的示例（含增强的 payoff_chart），不会被自动导入数据库。
