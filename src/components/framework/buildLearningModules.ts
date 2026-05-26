import type { FrameworkChapter, FrameworkNode } from "./FrameworkLearningView";

export type ContentTier = "core" | "support" | "extension";

type TieredLike = {
  priority?: unknown;
  displayMode?: unknown;
  title?: unknown;
  name?: unknown;
  note?: unknown;
  description?: unknown;
  type?: unknown;
};

export type TierStats = {
  coreResourceCount: number;
  supportItemCount: number;
  extensionItemCount: number;
  collapsedItemCount: number;
  priorityCounts: Partial<Record<"P0" | "P1" | "P2" | "P3", number>>;
};

const extensionTitlePatterns = ["拓展", "阅读", "链接", "新闻", "市场实践", "中证估值", "数据库", "研究报告"];
const supportTitlePatterns = ["补充", "背景", "延伸", "市场分类", "机构实践"];
const coreBlockTypes = new Set(["formula_card", "example_box"]);

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readObject(value: unknown): TieredLike {
  return value && typeof value === "object" ? (value as TieredLike) : {};
}

export function classifyTitleTier(title: string): ContentTier {
  if (extensionTitlePatterns.some((pattern) => title.includes(pattern))) return "extension";
  if (supportTitlePatterns.some((pattern) => title.includes(pattern))) return "support";
  return "core";
}

export function classifyNodeTier(node: FrameworkNode): ContentTier {
  return classifyTitleTier(`${node.name ?? ""} ${node.summary ?? ""}`);
}

export function classifyBlockTier(block: unknown): ContentTier {
  const b = readObject(block);
  const text = `${readText(b.title)} ${readText(b.description)} ${readText(b.note)}`;
  const titleTier = classifyTitleTier(text);
  if (titleTier !== "core") return titleTier;
  if (coreBlockTypes.has(readText(b.type))) return "core";
  return "core";
}

function readPriority(value: unknown): "P0" | "P1" | "P2" | "P3" | null {
  const priority = readText(readObject(value).priority).toUpperCase();
  return priority === "P0" || priority === "P1" || priority === "P2" || priority === "P3" ? priority : null;
}

export function buildTierStats(modules: LearningModule[], supplements: unknown[]): TierStats {
  const stats: TierStats = {
    coreResourceCount: 0,
    supportItemCount: 0,
    extensionItemCount: 0,
    collapsedItemCount: 0,
    priorityCounts: {},
  };

  const countTier = (tier: ContentTier) => {
    if (tier === "core") stats.coreResourceCount++;
    if (tier === "support") {
      stats.supportItemCount++;
      stats.collapsedItemCount++;
    }
    if (tier === "extension") {
      stats.extensionItemCount++;
      stats.collapsedItemCount++;
    }
  };

  for (const mod of modules) {
    for (const child of mod.conceptItems) countTier(classifyNodeTier(child));
    for (const block of mod.visualBlocks) {
      countTier(classifyBlockTier(block));
      const priority = readPriority(block);
      if (priority) stats.priorityCounts[priority] = (stats.priorityCounts[priority] ?? 0) + 1;
    }
  }

  for (const block of supplements) countTier(classifyBlockTier(block));

  return stats;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type LearningModule = {
  id: string;
  title: string;
  index: number;
  sourceNode: FrameworkNode;
  conceptItems: FrameworkNode[];
  visualBlocks: unknown[];
};

export type ChapterReview = {
  pitfalls: string[] | null;
  reviewPath: FrameworkNode | null;
};

export type ModuleBuildResult = {
  guide: { summary?: string; keyConcepts?: string[]; guideNodes: FrameworkNode[] };
  modules: LearningModule[];
  chapterReview: ChapterReview;
  supplements: unknown[];
  /** Per-module matched block count for diagnostics */
  moduleBlockCounts: number[];
  stats: {
    moduleCount: number;
    totalBlocks: number;
    matchedBlocks: number;
    unmatchedBlocks: number;
    unmatchedRatio: string;
  } & TierStats;
};

/* ------------------------------------------------------------------ */
/*  Node classifiers                                                    */
/* ------------------------------------------------------------------ */

const guideNodePatterns = [
  "章节总览", "一句话定位", "课程作用", "为什么", "学习主线",
  "主线", "学习建议", "本章定位", "本章在课程中的作用",
  "本章主线", "本章边界",
];
const reviewPathPatterns = ["复习路径", "复习清单"];
const pitfallsPatterns = ["易混点", "易错点", "注意事项", "易混点 / 注意事项"];

function isGuideNode(node: FrameworkNode): boolean {
  const name = node.name ?? "";
  return guideNodePatterns.some((p) => name.includes(p));
}
function isReviewPathNode(node: FrameworkNode): boolean {
  return reviewPathPatterns.some((p) => (node.name ?? "").includes(p));
}
function isPitfallsNode(node: FrameworkNode): boolean {
  return pitfallsPatterns.some((p) => (node.name ?? "").includes(p));
}

/* ------------------------------------------------------------------ */
/*  Professional financial terms (weighted higher)                      */
/* ------------------------------------------------------------------ */

const domainTerms = new Set([
  // 固收 — 债券定价 & 收益率
  "债券定价","现金流贴现","到期收益率","净价","全价","应计利息","久期","凸性",
  "收益率曲线","无套利估值","零息债券","附息债券","远期利率","互换现金流","期权收益","保证金",
  "即期利率","信用利差","赎回权","回售权","国债定价","公司债","二叉树","逆向归纳",
  "可转换债券","可赎回债券","可回售债券","名义利差","期权成本","路径依赖","蒙特卡罗",
  "利率风险","信用风险","流动性风险","事件风险","违约风险","降级风险",
  "预期违约损失","套利定价","一价定律","现金流量估算","逐期折现","嵌入期权",
  "收益利差","绝对收益利差","相对收益利差","收益率比率","市场间收益利差","市场内收益利差",
  "信用利差期限结构","基准即期利率曲线","提前偿付","分期偿还",
  // 衍生品
  "期货合约","对冲策略","多头对冲","空头对冲","交叉对冲","基差","对冲比率",
  "最小方差","最优合约","每日结算","未平仓数量","中央清算","场外抵押",
  "期权策略","牛市差价","熊市差价","蝶式差价","跨式组合","宽跨式组合","异价跨式",
  "看涨期权","看跌期权","看涨","看跌","执行价格","到期日","标的资产","权利金","内在价值","时间价值",
  "差价策略","方向策略","波动策略","区间策略","组合策略","收益图形","加法原则",
  "保护性看跌","备兑看涨","牛市","熊市","蝶式","跨式","宽跨式",
  "互换定价","利率互换","货币互换","固定利率","浮动利率","做市商",
  "远期合约","期货价格","套利机会","现金结算","实物交割","平仓",
  "保证金账户","维持保证金","初始保证金","追加保证金",
  // 风险
  "信用评级","降级","违约","回收率","损失率",
  // 英文
  "YTM","OAS","DV01","VaR","MBS","ABS","CMO","CDS","IRS","FRA","FVA","KVA",
  "Z-spread","OAS spread","option cost","key rate duration",
]);

/** Domain-relevant bigrams found in chapter/node titles */
function extractDomainBigrams(text: string): string[] {
  const cleaned = text.replace(/[\s，。、《》【】（）()：:；;,.\-/_\\·]+/g, "");
  const result = new Set<string>();

  // Match known domain terms directly (3+ char)
  for (const term of domainTerms) {
    if (cleaned.includes(term)) result.add(term);
  }

  // Sliding bigrams and trigrams for general Chinese text
  for (let len = 5; len >= 2; len--) {
    for (let i = 0; i <= cleaned.length - len; i++) {
      const slice = cleaned.slice(i, i + len);
      result.add(slice);
    }
  }

  return [...result];
}

/* ------------------------------------------------------------------ */
/*  Stop-words (low discriminative power)                               */
/* ------------------------------------------------------------------ */

const stopWords = new Set([
  "核心","概念","机制","逻辑","计算","公式","图表","内容","关键","学习","复习",
  "本章","课程","章节","教学","说明","部分","相关","主要","其他","基本","一般",
  "作用","定位","位置","边界","组成","特点","特征","方法","步骤","流程","要素",
  "因素","类型","分类","关系","结构","功能","基础","前提","条件","结果","结论",
  "示例","举例","案例","例题","分析","总结","思考","练习","测试","考核",
  "债券","定价","价格","利率","收益率","风险","市场","交易","投资","证券",
  "价值","资金","资产","负债","收入","支出","利润","成本","费用",
]);

/**
 * Score a token — higher if domain term, lower if stop word, normal otherwise.
 * Returns weight multiplier: 2.0 for domain term, 0.15 for stop word, 1.0 otherwise.
 */
function tokenWeight(token: string): number {
  if (domainTerms.has(token)) return 2.0;
  if (stopWords.has(token)) return 0.15;
  return 1.0;
}

/* ------------------------------------------------------------------ */
/*  Extract block text by type                                          */
/* ------------------------------------------------------------------ */

function getBlockText(block: unknown): string {
  if (!block || typeof block !== "object") return "";
  const b = block as Record<string, unknown>;

  const parts: string[] = [];
  const push = (v: unknown) => { if (typeof v === "string" && v.trim()) parts.push(v.trim()); };

  push(b.title);

  // Type-specific fields
  const type = (typeof b.type === "string" ? b.type : "") as string;
  switch (type) {
    case "formula_card":
      push(b.formula);
      push(b.usage);
      if (Array.isArray(b.variables)) {
        for (const v of b.variables) {
          if (typeof v === "object" && v) {
            push((v as Record<string, unknown>).symbol);
            push((v as Record<string, unknown>).meaning);
          }
        }
      }
      break;
    case "comparison_table":
    case "data_table":
      if (Array.isArray(b.headers)) {
        for (const h of b.headers) push(h);
      }
      if (Array.isArray(b.rows)) {
        for (const row of b.rows) {
          if (Array.isArray(row)) for (const cell of row) push(cell);
          else push(row);
        }
      }
      break;
    case "process_flow":
      if (Array.isArray(b.steps)) {
        for (const s of b.steps) {
          if (typeof s === "object" && s) { push((s as Record<string, unknown>).label); push((s as Record<string, unknown>).description); }
          else push(s);
        }
      }
      break;
    case "timeline":
      if (Array.isArray(b.events)) {
        for (const e of b.events) {
          if (typeof e === "object" && e) {
            push((e as Record<string, unknown>).title);
            push((e as Record<string, unknown>).description);
          }
        }
      }
      break;
    case "decision_tree":
      if (b.root && typeof b.root === "object") {
        push((b.root as Record<string, unknown>).question);
        if (Array.isArray((b.root as Record<string, unknown>).branches)) {
          for (const br of (b.root as Record<string, unknown>).branches as Array<Record<string, unknown>>) {
            push(br.condition);
          }
        }
      }
      if (Array.isArray(b.nodes)) {
        for (const n of b.nodes) {
          if (typeof n === "object" && n) {
            push((n as Record<string, unknown>).label);
            push((n as Record<string, unknown>).content);
          }
        }
      }
      break;
    case "cashflow_diagram":
      if (Array.isArray(b.nodes)) {
        for (const n of b.nodes) {
          if (typeof n === "object" && n) push((n as Record<string, unknown>).label);
        }
      }
      if (Array.isArray(b.edges)) {
        for (const e of b.edges) {
          if (typeof e === "object" && e) push((e as Record<string, unknown>).label);
        }
      }
      break;
    case "payoff_chart":
    case "line_chart":
    case "curve_chart":
      if (Array.isArray(b.curves)) {
        for (const c of b.curves) {
          if (typeof c === "object" && c) push((c as Record<string, unknown>).name);
        }
      }
      if (Array.isArray(b.series)) {
        for (const s of b.series) {
          if (typeof s === "object" && s) push((s as Record<string, unknown>).name);
        }
      }
      push(b.xAxis);
      push(b.yAxis);
      break;
    case "chart_explanation":
      if (Array.isArray(b.elements)) {
        for (const e of b.elements) {
          if (typeof e === "object" && e) { push((e as Record<string, unknown>).name); push((e as Record<string, unknown>).meaning); }
        }
      }
      if (Array.isArray(b.keyTakeaways)) {
        for (const k of b.keyTakeaways) {
          if (typeof k === "string") push(k);
        }
      }
      break;
    case "example_box":
      push(b.scenario);
      if (Array.isArray(b.steps)) {
        for (const s of b.steps) { if (typeof s === "string") push(s); }
      }
      push(b.result);
      break;
    case "case_card":
      push(b.background);
      push(b.lesson);
      if (Array.isArray(b.relatedConcepts)) {
        for (const rc of b.relatedConcepts) { if (typeof rc === "string") push(rc); }
      }
      break;
    case "concept_map":
      if (Array.isArray(b.concepts)) {
        for (const c of b.concepts) {
          if (typeof c === "object" && c) { push((c as Record<string, unknown>).name); push((c as Record<string, unknown>).description); }
        }
      }
      break;
    case "stata_code_block":
      push(b.description);
      push(b.code);
      push(b.sourceFile);
      if (Array.isArray(b.commands)) for (const command of b.commands) push(command);
      if (Array.isArray(b.notes)) for (const note of b.notes) push(note);
      break;
    case "stata_output_block":
      push(b.command);
      push(b.output);
      push(b.sourceFile);
      if (Array.isArray(b.highlights)) {
        for (const h of b.highlights) {
          if (typeof h === "object" && h) { push((h as Record<string, unknown>).label); push((h as Record<string, unknown>).value); push((h as Record<string, unknown>).meaning); }
        }
      }
      if (Array.isArray(b.warnings)) for (const warning of b.warnings) push(warning);
      break;
    case "regression_table":
      push(b.description);
      push(b.dependentVariable);
      push(b.sourceFile);
      if (Array.isArray(b.models)) {
        for (const model of b.models) {
          if (typeof model === "object" && model) {
            const m = model as Record<string, unknown>;
            push(m.name);
            push(m.estimator);
            push(m.clusteredBy);
            if (Array.isArray(m.fixedEffects)) for (const fe of m.fixedEffects) push(fe);
            if (Array.isArray(m.rows)) {
              for (const row of m.rows) {
                if (typeof row === "object" && row) {
                  const r = row as Record<string, unknown>;
                  push(r.variable); push(r.coef); push(r.stdErr); push(r.t); push(r.p); push(r.note);
                }
              }
            }
          }
        }
      }
      if (Array.isArray(b.notes)) for (const note of b.notes) push(note);
      break;
    case "dataset_schema":
      push(b.datasetName);
      push(b.description);
      push(b.panelId);
      push(b.timeId);
      if (Array.isArray(b.variables)) {
        for (const variable of b.variables) {
          if (typeof variable === "object" && variable) {
            const v = variable as Record<string, unknown>;
            push(v.name); push(v.label); push(v.type); push(v.role); push(v.generatedFrom);
          }
        }
      }
      if (Array.isArray(b.notes)) for (const note of b.notes) push(note);
      break;
    case "reproduction_steps":
      push(b.goal);
      push(b.finalCheck);
      if (Array.isArray(b.sourceFiles)) for (const file of b.sourceFiles) push(file);
      if (Array.isArray(b.steps)) {
        for (const step of b.steps) {
          if (typeof step === "object" && step) {
            const s = step as Record<string, unknown>;
            push(s.label); push(s.command); push(s.expectedOutput); push(s.check); push(s.explanation);
          }
        }
      }
      break;
    case "exam_task":
      push(b.prompt);
      if (Array.isArray(b.requirements)) for (const item of b.requirements) push(item);
      if (Array.isArray(b.answerPath)) for (const item of b.answerPath) push(item);
      if (Array.isArray(b.scoringPoints)) for (const item of b.scoringPoints) push(item);
      if (Array.isArray(b.commonMistakes)) for (const item of b.commonMistakes) push(item);
      break;
    case "interpretation_checklist":
      if (Array.isArray(b.items)) {
        for (const item of b.items) {
          if (typeof item === "object" && item) {
            const checklistItem = item as Record<string, unknown>;
            push(checklistItem.label); push(checklistItem.question); push(checklistItem.expected); push(checklistItem.warning);
          }
        }
      }
      break;
    case "common_stata_error":
      push(b.message);
      push(b.cause);
      push(b.fix);
      push(b.example);
      break;
  }

  // Generic fields
  push(b.description);
  push(b.note);

  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/*  Keyword sets with weights                                           */
/* ------------------------------------------------------------------ */

type WeightedKeywords = Map<string, { weight: number }>;

function buildNodeKeywords(node: FrameworkNode): WeightedKeywords {
  const map = new Map<string, { weight: number }>();

  function add(text: string | undefined, w: number) {
    if (!text?.trim()) return;
    const tokens = extractDomainBigrams(text);
    for (const t of tokens) {
      const tw = tokenWeight(t) * w;
      const existing = map.get(t);
      if (!existing || existing.weight < tw) map.set(t, { weight: tw });
    }
  }

  // Title has highest weight
  add(node.name, 3.0);
  add(node.summary, 2.0);

  // Children names & summaries
  for (const child of node.children ?? []) {
    add(child.name, 2.0);
    add(child.summary, 1.5);
  }

  return map;
}

function buildBlockKeywords(block: unknown): WeightedKeywords {
  const text = getBlockText(block);
  const map = new Map<string, { weight: number }>();

  const tokens = extractDomainBigrams(text);
  for (const t of tokens) {
    const tw = tokenWeight(t);
    const existing = map.get(t);
    if (!existing || existing.weight < tw) map.set(t, { weight: tw });
  }

  return map;
}

/* ------------------------------------------------------------------ */
/*  Match scoring                                                       */
/* ------------------------------------------------------------------ */

function matchScore(block: unknown, node: FrameworkNode): number {
  if (!block || typeof block !== "object") return 0;

  const nodeKeywords = buildNodeKeywords(node);
  const blockKeywords = buildBlockKeywords(block);

  if (nodeKeywords.size === 0 || blockKeywords.size === 0) return 0;

  let score = 0;
  let strongMatches = 0;
  let weakMatches = 0;

  for (const [token, bw] of blockKeywords) {
    const nw = nodeKeywords.get(token);
    if (!nw) continue;

    // Multiply node weight (title > summary) with block weight (domain > normal > stop)
    const contrib = nw.weight * bw.weight;

    if (contrib >= 5.0) strongMatches++;
    else if (contrib < 0.5) weakMatches++;
    score += contrib;
  }

  // If we have strong matches (domain phrase × title level), bonus
  if (strongMatches >= 2) score *= 1.3;

  // If only weak matches, penalize
  if (strongMatches === 0 && weakMatches > 2) score *= 0.3;

  return score;
}

/* ------------------------------------------------------------------ */
/*  Main builder                                                       */
/* ------------------------------------------------------------------ */

export function buildLearningModules(
  chapter: FrameworkChapter,
): ModuleBuildResult {
  const nodes = chapter.nodes ?? [];
  const blocks = chapter.visualBlocks ?? [];

  // Step 1: Classify nodes
  const guideNodes: FrameworkNode[] = [];
  const moduleNodes: FrameworkNode[] = [];
  let pitfallsNode: FrameworkNode | null = null;
  let reviewPathNode: FrameworkNode | null = null;

  for (const node of nodes) {
    if (isGuideNode(node)) {
      guideNodes.push(node);
    } else if (isReviewPathNode(node)) {
      reviewPathNode = node;
    } else if (isPitfallsNode(node)) {
      pitfallsNode = node;
    } else {
      moduleNodes.push(node);
    }
  }

  // Step 2: Build modules
  const modules: LearningModule[] = moduleNodes.map((node, i) => ({
    id: `module-${String(i + 1).padStart(2, "0")}`,
    title: node.name ?? `模块 ${i + 1}`,
    index: i,
    sourceNode: node,
    conceptItems: node.children ?? [],
    visualBlocks: [],
  }));

  // Step 3: Match blocks to modules
  const matchedBlockIds = new Set<number>();
  const supplements: unknown[] = [];
  const moduleBlockCounts = new Array(modules.length).fill(0);

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    const scores: Array<{ mi: number; score: number }> = [];

    for (let mi = 0; mi < modules.length; mi++) {
      const s = matchScore(block, modules[mi].sourceNode);
      if (s > 0) scores.push({ mi, score: s });
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores.length === 1) {
      // Only one candidate — match if above noise
      if (scores[0].score >= 1.5) {
        modules[scores[0].mi].visualBlocks.push(block);
        moduleBlockCounts[scores[0].mi]++;
        matchedBlockIds.add(bi);
      }
    } else if (scores.length >= 2) {
      const best = scores[0];
      const second = scores[1];

      // Clear winner: best score is sufficiently higher than second
      const gap = best.score - second.score;
      const dominant = gap >= 1.5 || (best.score > 0 && best.score >= second.score * 1.3);

      // Match if: strong domain match (≥4) OR moderate match (≥2) with clear gap
      if (best.score >= 4.0 || (best.score >= 2.0 && dominant)) {
        modules[best.mi].visualBlocks.push(block);
        moduleBlockCounts[best.mi]++;
        matchedBlockIds.add(bi);
      }
    } else if (scores.length === 0) {
      // No match — will go to supplements
    }
  }

  // Step 4: Collect unmatched blocks
  for (let bi = 0; bi < blocks.length; bi++) {
    if (!matchedBlockIds.has(bi)) {
      supplements.push(blocks[bi]);
    }
  }

  // Step 5: Build pitfalls
  let pitfalls: string[] | null = null;
  if (pitfallsNode?.children?.length) {
    pitfalls = pitfallsNode.children.map((c) => c.name ?? "").filter(Boolean);
  }

  const tierStats = buildTierStats(modules, supplements);

  return {
    guide: {
      summary: chapter.summary,
      keyConcepts: chapter.keyConcepts,
      guideNodes,
    },
    modules,
    chapterReview: {
      pitfalls,
      reviewPath: reviewPathNode,
    },
    supplements,
    moduleBlockCounts,
    stats: {
      ...tierStats,
      moduleCount: modules.length,
      totalBlocks: blocks.length,
      matchedBlocks: matchedBlockIds.size,
      unmatchedBlocks: supplements.length,
      unmatchedRatio:
        blocks.length > 0
          ? `${((supplements.length / blocks.length) * 100).toFixed(0)}%`
          : "0%",
    },
  };
}
