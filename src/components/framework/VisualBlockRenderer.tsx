"use client";

import "katex/dist/katex.min.css";
import katex from "katex";
import { useEffect, useState } from "react";
import MathText from "./MathText";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Safe KaTeX helpers – pure functions, safely wrapped in try/catch   */
/* ------------------------------------------------------------------ */

function repairControlEscapedLatex(text: string): string {
  return text
    .replace(/\beta/g, "\\beta")
    .replace(/\text/g, "\\text")
    .replace(/\times/g, "\\times")
    .replace(/\tau/g, "\\tau")
    .replace(/\frac/g, "\\frac")
    .replace(/\rho/g, "\\rho");
}

function renderLatex(latex: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(repairControlEscapedLatex(latex), {
      displayMode,
      throwOnError: false,
      strict: "ignore",
    });
  } catch {
    return null;
  }
}

function LatexBlock({ latex, fallback }: { latex: string; fallback: string }) {
  const html = renderLatex(latex, true);
  if (!html) return <p className="max-w-full overflow-x-auto font-mono text-sm leading-7 text-violet-950">{fallback}</p>;
  return <div className="max-w-full overflow-x-auto overscroll-x-contain text-center text-violet-950 [&_.katex-display]:my-0 [&_.katex-html]:min-w-max" dangerouslySetInnerHTML={{ __html: html }} />;
}

function LatexInline({ latex, fallback }: { latex: string; fallback: string }) {
  const html = renderLatex(latex, false);
  if (!html) return <span className="font-mono text-xs font-semibold text-zinc-800">{fallback}</span>;
  return <span className="align-baseline [&_.katex]:text-[0.92em] [&_.katex]:leading-normal" dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ------------------------------------------------------------------ */
/*  Types – kept deliberately loose so incomplete data won't crash     */
/* ------------------------------------------------------------------ */

type VisualBlockSource = {
  sourceFile?: string;
  sourcePage?: string | number;
  sourceChunkIds?: string[];
};

type ProcessFlowBlock = {
  type: "process_flow";
  title: string;
  description?: string;
  steps: Array<{ label: string; description?: string }>;
  source?: VisualBlockSource;
};

type ComparisonTableBlock = {
  type: "comparison_table";
  title: string;
  headers: string[];
  rows: string[][];
  source?: VisualBlockSource;
};

type FormulaCardBlock = {
  type: "formula_card";
  title: string;
  formula: string;
  formulaLatex?: string;
  variables?: Array<{ symbol: string; meaning: string }>;
  usage?: string;
  pitfalls?: string[];
  source?: VisualBlockSource;
};

type ConceptMapBlock = {
  type: "concept_map";
  title: string;
  concepts: Array<{ name: string; description?: string }>;
  relations?: Array<{ from: string; to: string; relation: string }>;
  source?: VisualBlockSource;
};

type ImageBlock = {
  type: "image";
  title: string;
  src: string;
  alt?: string;
  caption?: string;
  description?: string;
  source?: VisualBlockSource;
};

type CaseCardBlock = {
  type: "case_card";
  title: string;
  background?: string;
  scenario?: string;
  analysis?: string;
  lesson?: string;
  relatedConcepts?: string[];
};

type DataTableBlock = {
  type: "data_table";
  title: string;
  description?: string;
  headers: string[];
  rows: string[][];
  note?: string;
};

type ExampleBoxBlock = {
  type: "example_box";
  title: string;
  scenario?: string;
  steps: string[];
  result?: string;
  takeaway?: string;
};

type ChartExplanationBlock = {
  type: "chart_explanation";
  title: string;
  chartType?: "payoff" | "curve" | "timeline" | "relationship" | "other";
  xAxis?: string;
  yAxis?: string;
  elements?: Array<{ name: string; meaning: string }>;
  keyTakeaways: string[];
  examTips?: string[];
};

type ChartPoint = { x: number | string; y: number };

type PayoffChartBlock = {
  type: "payoff_chart";
  title: string;
  description?: string;
  xAxis: string;
  yAxis: string;
  curves: Array<{ name: string; points: ChartPoint[] }>;
  breakEvenPoints?: string[];
  annotations?: Array<{ x: number | string; label: string }>;
  regions?: Array<{ fromX: number; toX: number; label: string; kind?: "profit" | "loss" | "breakeven" | "other" }>;
  metrics?: Array<{ label: string; value: string }>;
  legs?: Array<{ name: string; position: string; strike?: string }>;
  keyTakeaways: string[];
};

type LineChartBlock = {
  type: "line_chart";
  title: string;
  description?: string;
  xAxis: string;
  yAxis: string;
  series: Array<{ name: string; points: ChartPoint[] }>;
  referenceLines?: Array<{ value: number; label: string }>;
  keyTakeaways: string[];
};

type CurveChartBlock = {
  type: "curve_chart";
  title: string;
  description?: string;
  xAxis: string;
  yAxis: string;
  curves: Array<{ name: string; shape?: string; points: ChartPoint[] }>;
  keyTakeaways: string[];
};

type CashflowDiagramBlock = {
  type: "cashflow_diagram";
  title: string;
  description?: string;
  nodes: Array<{ id: string; label: string; role?: string }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    label: string;
    cashflowType?: "fixed" | "floating" | "principal" | "interest" | "net" | "collateral" | "risk_transfer" | "other";
    timing?: string;
  }>;
  phases?: Array<{ title: string; edgeIds: string[] }>;
  outcome?: string;
  keyTakeaways: string[];
};

type DecisionTreeBlock = {
  type: "decision_tree";
  title: string;
  description?: string;
  root: {
    id: string;
    question: string;
    branches: Array<{ condition: string; target: string }>;
  };
  nodes: Array<{ id: string; label: string; content?: string }>;
  keyTakeaways: string[];
};

type TimelineBlock = {
  type: "timeline";
  title: string;
  description?: string;
  events: Array<{ time: string; title: string; description?: string }>;
  keyTakeaways: string[];
};

type StataCodeBlock = {
  type: "stata_code_block";
  title: string;
  description?: string;
  code: string;
  language?: "stata";
  sourceFile?: string;
  commands?: string[];
  notes?: string[];
};

type StataOutputBlock = {
  type: "stata_output_block";
  title: string;
  command?: string;
  output: string;
  highlights?: Array<{ label: string; value: string; meaning?: string }>;
  annotations?: Array<{ field: string; meaning: string; howToRead: string; examUse?: string }>;
  warnings?: string[];
  sourceFile?: string;
};

type StataInterfaceGuideBlock = {
  type: "stata_interface_guide";
  title: string;
  imageSrc?: string;
  areas: Array<{ name: string; location?: string; purpose: string; studentAction: string; commonMistake?: string }>;
};

type TableMappingBlock = {
  type: "table_mapping_block";
  title: string;
  targetTable: string;
  mappings: Array<{
    tableColumn: string;
    model?: string;
    command: string;
    logSource?: string;
    coefficientPath?: string;
    stdErrPath?: string;
    pValuePath?: string;
    examInterpretation: string;
    caution?: string;
  }>;
};

type CalloutTeacherNoteBlock = {
  type: "callout_teacher_note";
  title: string;
  tone?: "concept" | "exam" | "warning" | "intuition";
  body: string;
  example?: string;
};

type RegressionTableBlock = {
  type: "regression_table";
  title: string;
  description?: string;
  dependentVariable?: string;
  models: Array<{
    name: string;
    estimator?: string;
    fixedEffects?: string[];
    clusteredBy?: string;
    n?: string | number;
    r2?: string;
    rows: Array<{ variable: string; coef?: string; stdErr?: string; t?: string; p?: string; note?: string }>;
  }>;
  notes?: string[];
  sourceFile?: string;
};

type DatasetSchemaBlock = {
  type: "dataset_schema";
  title: string;
  datasetName: string;
  description?: string;
  observations?: string | number;
  variablesCount?: string | number;
  panelId?: string;
  timeId?: string;
  isBalancedPanel?: boolean;
  variables: Array<{ name: string; label?: string; type?: string; role?: string; generatedFrom?: string }>;
  notes?: string[];
};

type ReproductionStepsBlock = {
  type: "reproduction_steps";
  title: string;
  goal: string;
  steps: Array<{ label: string; command?: string; expectedOutput?: string; check?: string; explanation?: string }>;
  finalCheck?: string;
  sourceFiles?: string[];
};

type ExamTaskBlock = {
  type: "exam_task";
  title: string;
  prompt: string;
  requirements?: string[];
  answerPath?: string[];
  scoringPoints?: string[];
  commonMistakes?: string[];
};

type InterpretationChecklistBlock = {
  type: "interpretation_checklist";
  title: string;
  items: Array<{ label: string; question?: string; expected?: string; warning?: string }>;
};

type CommonStataErrorBlock = {
  type: "common_stata_error";
  title: string;
  message: string;
  cause?: string;
  fix?: string;
  example?: string;
};

type VisualBlock =
  | ProcessFlowBlock
  | ComparisonTableBlock
  | FormulaCardBlock
  | ConceptMapBlock
  | ImageBlock
  | CaseCardBlock
  | DataTableBlock
  | ExampleBoxBlock
  | ChartExplanationBlock
  | PayoffChartBlock
  | LineChartBlock
  | CurveChartBlock
  | CashflowDiagramBlock
  | DecisionTreeBlock
  | TimelineBlock
  | StataCodeBlock
  | StataOutputBlock
  | StataInterfaceGuideBlock
  | TableMappingBlock
  | CalloutTeacherNoteBlock
  | RegressionTableBlock
  | DatasetSchemaBlock
  | ReproductionStepsBlock
  | ExamTaskBlock
  | InterpretationChecklistBlock
  | CommonStataErrorBlock;

/* ------------------------------------------------------------------ */
/*  Shared block wrapper                                               */
/* ------------------------------------------------------------------ */

const visualBlockTypeMeta: Record<string, { label: string; className: string }> = {
  process_flow: { label: "流程图", className: "bg-zinc-100 text-zinc-700" },
  comparison_table: { label: "对比表", className: "bg-zinc-100 text-zinc-700" },
  formula_card: { label: "公式", className: "bg-red-50 text-red-700 ring-1 ring-red-100" },
  concept_map: { label: "概念图", className: "bg-zinc-100 text-zinc-700" },
  image: { label: "图片", className: "bg-zinc-100 text-zinc-700" },
  case_card: { label: "案例", className: "bg-zinc-100 text-zinc-700" },
  data_table: { label: "数据表", className: "bg-zinc-100 text-zinc-700" },
  example_box: { label: "例题", className: "bg-red-50 text-red-700 ring-1 ring-red-100" },
  chart_explanation: { label: "图表说明", className: "bg-zinc-100 text-zinc-700" },
  payoff_chart: { label: "收益图", className: "bg-zinc-100 text-zinc-700" },
  line_chart: { label: "趋势图", className: "bg-zinc-100 text-zinc-700" },
  curve_chart: { label: "曲线图", className: "bg-zinc-100 text-zinc-700" },
  cashflow_diagram: { label: "现金流图", className: "bg-zinc-100 text-zinc-700" },
  decision_tree: { label: "判断分支", className: "bg-zinc-100 text-zinc-700" },
  timeline: { label: "时间线", className: "bg-zinc-100 text-zinc-700" },
  stata_code_block: { label: "Stata 代码", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  stata_output_block: { label: "Stata 输出", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  stata_interface_guide: { label: "Stata 界面", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-100" },
  table_mapping_block: { label: "表格映射", className: "bg-violet-50 text-violet-700 ring-1 ring-violet-100" },
  callout_teacher_note: { label: "老师提示", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  regression_table: { label: "回归表", className: "bg-violet-50 text-violet-700 ring-1 ring-violet-100" },
  dataset_schema: { label: "数据集", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
  reproduction_steps: { label: "复现实验", className: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" },
  exam_task: { label: "考试任务", className: "bg-red-50 text-red-700 ring-1 ring-red-100" },
  interpretation_checklist: { label: "解释清单", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  common_stata_error: { label: "Stata 错误", className: "bg-red-50 text-red-700 ring-1 ring-red-100" },
};

function BlockCard({ title, type, children }: { title: string; type?: string; children: React.ReactNode }) {
  const meta = type ? visualBlockTypeMeta[type] : null;

  return (
    <div className="min-w-0 overflow-visible rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-2.5">
        {meta ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span> : null}
        <p className="text-sm font-semibold text-zinc-950"><MathText text={title} /></p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CodePanel({ code, tone = "zinc" }: { code?: string; tone?: "zinc" | "sky" | "red" }) {
  if (!code) return null;
  const toneClass =
    tone === "sky"
      ? "border-sky-100 bg-sky-950 text-sky-50"
      : tone === "red"
        ? "border-red-100 bg-red-950 text-red-50"
        : "border-zinc-800 bg-zinc-950 text-zinc-50";
  return (
    <div className={`max-w-full overflow-x-auto overscroll-x-contain rounded-xl border ${toneClass}`}>
      <pre className="max-h-[360px] min-w-max overflow-y-auto p-4 font-mono text-xs leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InlineMeta({ label, value }: { label: string; value?: string | number | boolean }) {
  if (value === undefined || value === "") return null;
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
      {label}：{String(value)}
    </span>
  );
}

function NoteList({ title = "备注", items, tone = "zinc" }: { title?: string; items?: string[]; tone?: "zinc" | "amber" | "red" }) {
  if (!items?.length) return null;
  const toneClass =
    tone === "amber"
      ? "border-amber-100 bg-amber-50/70 text-amber-900"
      : tone === "red"
        ? "border-red-100 bg-red-50/70 text-red-900"
        : "border-zinc-100 bg-zinc-50/70 text-zinc-700";
  const titleClass = tone === "amber" ? "text-amber-800" : tone === "red" ? "text-red-800" : "text-zinc-500";
  return (
    <div className={`mt-4 rounded-xl border px-4 py-3 ${toneClass}`}>
      <p className={`text-xs font-semibold ${titleClass}`}>{title}</p>
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => (
          <li key={`${title}-${i}`} className="flex gap-2 text-sm leading-6">
            <span className="mt-0.5 shrink-0">•</span>
            <span><MathText text={item} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  process_flow                                                       */
/* ------------------------------------------------------------------ */

function ProcessFlowView({ block }: { block: ProcessFlowBlock }) {
  if (!block.steps?.length) return null;

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? <p className="mb-4 text-sm leading-7 text-zinc-600"><MathText text={block.description} /></p> : null}
      <ol className="flex flex-col gap-0">
        {block.steps.map((step, i) => (
          <li key={`${step.label}-${i}`} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                {i + 1}
              </span>
              {i < block.steps.length - 1 ? <span className="my-0.5 h-8 w-px bg-zinc-300" /> : null}
            </div>
            <div className="pb-4">
              <p className="font-medium leading-7 text-zinc-900"><MathText text={step.label} /></p>
              {step.description ? <p className="mt-0.5 text-sm leading-6 text-zinc-600"><MathText text={step.description} /></p> : null}
            </div>
          </li>
        ))}
      </ol>
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  comparison_table                                                   */
/* ------------------------------------------------------------------ */

function ComparisonTableView({ block, compact = true }: { block: ComparisonTableBlock; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (!block.headers?.length || !block.rows?.length) return null;

  const shouldCompact = compact && block.rows.length > 6;
  const visibleRows = shouldCompact && !expanded ? block.rows.slice(0, 5) : block.rows;

  return (
    <BlockCard title={block.title} type={block.type}>
      <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-zinc-200">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100/80">
              {block.headers.map((header, i) => (
                <th key={`h-${i}`} className="max-w-[18rem] px-3 py-2.5 text-left align-top text-xs font-semibold uppercase text-zinc-700">
                  <MathText text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIdx) => (
              <tr key={`r-${rowIdx}`} className="border-b border-zinc-100 last:border-0">
                {row.map((cell, cellIdx) => (
                  <td
                    key={`c-${rowIdx}-${cellIdx}`}
                    className={`max-w-[22rem] whitespace-normal break-words px-3 py-2.5 align-top text-zinc-700 ${cellIdx === 0 ? "font-medium text-zinc-900" : ""}`}
                  >
                    <MathText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shouldCompact ? (
        <button
          type="button"
          className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "收起表格" : `展开完整表格（共 ${block.rows.length} 行）`}
        </button>
      ) : null}
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  formula_card                                                       */
/* ------------------------------------------------------------------ */

function FormulaCardView({ block }: { block: FormulaCardBlock }) {
  if (!block.formula) return null;

  return (
    <BlockCard title={block.title} type={block.type}>
      {/* Formula display – KaTeX if formulaLatex available, else plain text */}
      {block.formulaLatex ? (
        <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <LatexBlock latex={block.formulaLatex} fallback={block.formula} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3">
          <p className="font-mono text-sm leading-7 text-violet-950"><MathText text={block.formula} /></p>
        </div>
      )}

      {block.variables?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">变量说明</p>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {block.variables.map((v, i) => (
              <li key={`v-${i}`} className="flex items-baseline gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                <span className="shrink-0 rounded-md bg-white px-2 py-0.5 font-semibold text-zinc-800 shadow-sm">
                  <LatexInline latex={v.symbol} fallback={v.symbol} />
                </span>
                <span className="text-zinc-600"><MathText text={v.meaning} /></span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {block.usage ? (
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          <span className="font-medium text-zinc-900">用途：</span>
          <MathText text={block.usage} />
        </p>
      ) : null}

      {block.pitfalls?.length ? (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800">易混点 / 注意事项</p>
          <ul className="mt-2 space-y-1">
            {block.pitfalls.map((p, i) => (
              <li key={`p-${i}`} className="flex gap-2 text-sm leading-6 text-amber-900">
                <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                <span><MathText text={p} /></span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  concept_map                                                        */
/* ------------------------------------------------------------------ */

function ConceptMapView({ block }: { block: ConceptMapBlock }) {
  if (!block.concepts?.length) return null;

  return (
    <BlockCard title={block.title} type={block.type}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {block.concepts.map((concept, i) => (
          <div key={`concept-${i}`} className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
            <p className="font-medium text-zinc-900"><MathText text={concept.name} /></p>
            {concept.description ? <p className="mt-1 text-sm leading-6 text-zinc-600"><MathText text={concept.description} /></p> : null}
          </div>
        ))}
      </div>

      {block.relations?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">概念关系</p>
          <div className="mt-2 space-y-2">
            {block.relations.map((rel, i) => (
              <div key={`rel-${i}`} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 text-sm">
                <p className="font-medium text-zinc-900">
                  <MathText text={rel.from} /> <span className="text-zinc-400">→</span> <MathText text={rel.to} />
                </p>
                <p className="mt-1 leading-6 text-zinc-600"><MathText text={rel.relation} /></p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  image                                                              */
/* ------------------------------------------------------------------ */

function ImageBlockView({ block }: { block: ImageBlock }) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!block.src) return null;
  const alt = block.alt ?? block.caption ?? block.title;

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? (
        <p className="mb-3 text-sm leading-7 text-zinc-600">
          <MathText text={block.description} />
        </p>
      ) : null}
      {failed ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
          图片暂时无法显示
        </div>
      ) : (
        <div className="group relative overflow-visible rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
          <button
            type="button"
            className="block w-full cursor-zoom-in"
            onClick={() => setOpen(true)}
            aria-label={`查看大图：${alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.src}
              alt={alt}
              className="mx-auto block h-auto w-auto max-h-[520px] max-w-full object-contain"
              loading="lazy"
              onError={() => setFailed(true)}
            />
          </button>
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full border border-zinc-200 bg-white/95 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            onClick={() => setOpen(true)}
          >
            查看大图
          </button>
        </div>
      )}
      {block.caption ? <p className="mt-3 rounded-full bg-zinc-50 px-3 py-1 text-center text-xs leading-5 text-zinc-500"><MathText text={block.caption} /></p> : null}
      {open && !failed ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`大图预览：${alt}`}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[94vh] w-full max-w-[96vw] flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-semibold text-zinc-900">{block.title}</p>
              <button
                type="button"
                className="rounded-full border border-zinc-200 px-3 py-1 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                onClick={() => setOpen(false)}
              >
                关闭
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-zinc-100 p-3 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.src}
                alt={alt}
                className="mx-auto block h-auto max-h-none max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  case_card                                                          */
/* ------------------------------------------------------------------ */

const caseCardSections: { key: keyof CaseCardBlock; label: string }[] = [
  { key: "background", label: "背景" },
  { key: "scenario", label: "情境" },
  { key: "analysis", label: "分析" },
  { key: "lesson", label: "复习启示" },
];

function CaseCardView({ block }: { block: CaseCardBlock }) {
  return (
    <BlockCard title={block.title} type={block.type}>
      <div className="space-y-3">
        {caseCardSections.map(({ key, label }) => {
          const value = block[key];
          if (typeof value !== "string" || !value) return null;
          return (
            <div key={key} className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
              <p className="text-xs font-semibold text-indigo-700">{label}</p>
              <p className="mt-1 text-sm leading-7 text-zinc-800"><MathText text={value} /></p>
            </div>
          );
        })}
      </div>
      {block.relatedConcepts?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {block.relatedConcepts.map((concept, i) => (
            <span
              key={`rc-${i}`}
              className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-800"
            >
              {concept}
            </span>
          ))}
        </div>
      ) : null}
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  data_table                                                         */
/* ------------------------------------------------------------------ */

function DataTableView({ block, compact = true }: { block: DataTableBlock; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (!block.headers?.length || !block.rows?.length) return null;

  const shouldCompact = compact && block.rows.length > 6;
  const visibleRows = shouldCompact && !expanded ? block.rows.slice(0, 5) : block.rows;

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? <p className="mb-3 text-sm leading-7 text-zinc-600"><MathText text={block.description} /></p> : null}
      <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-zinc-200">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100/80">
              {block.headers.map((header, i) => (
                <th key={`dh-${i}`} className="max-w-[18rem] px-3 py-2.5 text-left align-top text-xs font-semibold uppercase text-zinc-700">
                  <MathText text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIdx) => (
              <tr key={`dr-${rowIdx}`} className="border-b border-zinc-100 last:border-0">
                {row.map((cell, cellIdx) => (
                  <td
                    key={`dc-${rowIdx}-${cellIdx}`}
                    className={`max-w-[22rem] whitespace-normal break-words px-3 py-2.5 align-top text-zinc-700 ${cellIdx === 0 ? "font-medium text-zinc-900" : ""}`}
                  >
                    <MathText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shouldCompact ? (
        <button
          type="button"
          className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "收起表格" : `展开完整表格（共 ${block.rows.length} 行）`}
        </button>
      ) : null}
      {block.note ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          <span className="font-medium">备注：</span>
          <MathText text={block.note} />
        </p>
      ) : null}
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  example_box                                                        */
/* ------------------------------------------------------------------ */

function ExampleBoxView({ block }: { block: ExampleBoxBlock }) {
  if (!block.steps?.length) return null;

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.scenario ? (
        <div className="mb-4 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
          <p className="text-xs font-semibold text-zinc-500">已知条件</p>
          <p className="mt-1 text-sm leading-7 text-zinc-800"><MathText text={block.scenario} /></p>
        </div>
      ) : null}

      <ol className="space-y-2">
        {block.steps.map((step, i) => (
          <li key={`es-${i}`} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
              {i + 1}
            </span>
            <p className="text-sm leading-7 text-zinc-800"><MathText text={step} /></p>
          </li>
        ))}
      </ol>

      {block.result ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold text-emerald-700">结果</p>
          <p className="mt-1 text-sm font-medium leading-7 text-emerald-900"><MathText text={block.result} /></p>
        </div>
      ) : null}

      {block.takeaway ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-700">复习要点</p>
          <p className="mt-1 text-sm leading-7 text-amber-900"><MathText text={block.takeaway} /></p>
        </div>
      ) : null}
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  chart_explanation                                                   */
/* ------------------------------------------------------------------ */

const chartTypeLabels: Record<string, string> = {
  payoff: "收益图",
  curve: "曲线图",
  timeline: "时间线",
  relationship: "关系图",
  other: "图表",
};

function ChartExplanationView({ block }: { block: ChartExplanationBlock }) {
  if (!block.keyTakeaways?.length) return null;

  return (
    <BlockCard title={block.title} type={block.type}>
      {/* chart type badge + axis info */}
      <div className="flex flex-wrap items-center gap-2">
        {block.chartType ? (
          <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-700">
            {chartTypeLabels[block.chartType] ?? block.chartType}
          </span>
        ) : null}
        {block.xAxis ? (
          <span className="text-xs text-zinc-500">横轴：<MathText text={block.xAxis} /></span>
        ) : null}
        {block.yAxis ? (
          <span className="text-xs text-zinc-500">纵轴：<MathText text={block.yAxis} /></span>
        ) : null}
      </div>

      {/* elements */}
      {block.elements?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">图形元素</p>
          <div className="mt-2 space-y-2">
            {block.elements.map((el, i) => (
              <div key={`ce-${i}`} className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-sm">
                <span className="font-medium text-zinc-900">{el.name}</span>
                <span className="mx-2 text-zinc-300">—</span>
                <span className="text-zinc-600"><MathText text={el.meaning} /></span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* key takeaways */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">关键结论</p>
        <ul className="mt-2 space-y-1.5">
          {block.keyTakeaways.map((t, i) => (
            <li key={`kt-${i}`} className="flex gap-2 text-sm leading-6 text-zinc-800">
              <span className="mt-0.5 shrink-0 text-zinc-400">•</span>
              <span><MathText text={t} /></span>
            </li>
          ))}
        </ul>
      </div>

      {/* exam tips */}
      {block.examTips?.length ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800">考试提示</p>
          <ul className="mt-2 space-y-1">
            {block.examTips.map((tip, i) => (
              <li key={`et-${i}`} className="flex gap-2 text-sm leading-6 text-amber-900">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span><MathText text={tip} /></span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared: key takeaways list (reused by chart blocks)                */
/* ------------------------------------------------------------------ */

function KeyTakeawaysList({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">关键结论</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((t, i) => (
          <li key={`kt-${i}`} className="flex gap-2 text-sm leading-6 text-zinc-800">
            <span className="mt-0.5 shrink-0 text-zinc-400">•</span>
            <span><MathText text={t} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recharts color palette                                              */
/* ------------------------------------------------------------------ */

const CHART_COLORS = [
  "#18181b", // zinc-950
  "#6366f1", // indigo-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
];

/* ------------------------------------------------------------------ */
/*  payoff_chart                                                        */
/* ------------------------------------------------------------------ */

function PayoffChartView({ block }: { block: PayoffChartBlock }) {
  if (!block.curves?.length) return null;

  // Merge all curve points into unified x-axis data rows
  const allXValues = new Set<number>();
  for (const curve of block.curves) {
    for (const pt of curve.points) {
      const xNum = typeof pt.x === "string" ? parseFloat(pt.x) : pt.x;
      if (!isNaN(xNum)) allXValues.add(xNum);
    }
  }
  const sortedX = [...allXValues].sort((a, b) => a - b);

  const data = sortedX.map((x) => {
    const row: Record<string, number> = { x };
    for (const curve of block.curves) {
      const pt = curve.points.find((p) => {
        const px = typeof p.x === "string" ? parseFloat(p.x) : p.x;
        return px === x;
      });
      if (pt) row[curve.name] = pt.y;
    }
    return row;
  });

  // Find y=0 crossing annotations
  const annotationXValues = block.annotations?.map((a) =>
    typeof a.x === "string" ? parseFloat(a.x) : a.x,
  ) ?? [];

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? <p className="mb-3 text-sm leading-7 text-zinc-600"><MathText text={block.description} /></p> : null}
      <div className="max-w-full overflow-x-auto overscroll-x-contain pb-2">
        <div className="w-[860px] max-w-none">
          <LineChart width={860} height={400} data={data} margin={{ top: 28, right: 64, left: 64, bottom: 76 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="x"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 11, fill: "#71717a" }}
                label={{ value: block.xAxis, position: "bottom", offset: 20, fontSize: 11, fill: "#71717a" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                label={{ value: block.yAxis, angle: -90, position: "left", offset: 18, fontSize: 11, fill: "#71717a" }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
              />
              {block.curves.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
              <ReferenceLine y={0} stroke="#a1a1aa" strokeDasharray="4 2" />
              {block.curves.map((curve, i) => (
                <Line
                  key={`pc-${i}`}
                  type="linear"
                  dataKey={curve.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
              {block.annotations?.map((ann, i) => {
                const xNum = typeof ann.x === "string" ? parseFloat(ann.x) : ann.x;
                if (isNaN(xNum)) return null;
                // Find y value at this x from data
                const row = data.find((d) => d.x === xNum);
                const yVal = row ? (Object.values(row).find((v, idx) => idx > 0 && typeof v === "number") ?? 0) : 0;
                return (
                  <ReferenceDot
                    key={`ann-${i}`}
                    x={xNum}
                    y={yVal as number}
                    r={4}
                    fill="#18181b"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              })}
              {annotationXValues.map((xVal, i) => {
                if (isNaN(xVal)) return null;
                const ann = block.annotations?.[i];
                return (
                  <ReferenceLine
                    key={`annl-${i}`}
                    x={xVal}
                    stroke="#a1a1aa"
                    strokeDasharray="2 2"
                    label={{ value: ann?.label ?? "", position: "top", fontSize: 10, fill: "#71717a" }}
                  />
                );
              })}
            </LineChart>
        </div>
      </div>
      {block.breakEvenPoints?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {block.breakEvenPoints.map((bp, i) => (
            <span key={`bp-${i}`} className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-700">
              盈亏平衡：<MathText text={bp} />
            </span>
          ))}
        </div>
      ) : null}

      {/* Strategy legs */}
      {block.legs?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">策略组成</p>
          <div className="mt-2 space-y-1.5">
            {block.legs.map((leg, i) => (
              <div key={`leg-${i}`} className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-medium text-zinc-800">
                  {leg.position}
                </span>
                <span className="text-zinc-700">
                  <MathText text={leg.name} />
                </span>
                {leg.strike ? (
                  <span className="text-xs text-zinc-500">
                    行权价: <MathText text={leg.strike} />
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Key metrics */}
      {block.metrics?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {block.metrics.map((m, i) => (
            <div key={`met-${i}`} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs font-medium text-zinc-500">{m.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                <MathText text={m.value} />
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Profit/loss regions */}
      {block.regions?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {block.regions.map((r, i) => {
            const kindClass =
              r.kind === "profit"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : r.kind === "loss"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700";
            return (
              <span key={`reg-${i}`} className={`rounded-full border px-3 py-0.5 text-xs font-medium ${kindClass}`}>
                <MathText text={r.label} /> ({r.fromX}–{r.toX})
              </span>
            );
          })}
        </div>
      ) : null}

      <KeyTakeawaysList items={block.keyTakeaways} />
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  line_chart                                                          */
/* ------------------------------------------------------------------ */

function LineChartView({ block }: { block: LineChartBlock }) {
  if (!block.series?.length) return null;

  // Determine if x is categorical (string) or numeric
  const firstPoint = block.series[0]?.points[0];
  const isNumericX = typeof firstPoint?.x === "number";

  // Build merged data
  type DataRow = Record<string, string | number>;
  const dataMap = new Map<string | number, DataRow>();

  for (const s of block.series) {
    for (const pt of s.points) {
      const xKey = pt.x;
      if (!dataMap.has(xKey)) {
        dataMap.set(xKey, { x: xKey });
      }
      dataMap.get(xKey)![s.name] = pt.y;
    }
  }

  const data = [...dataMap.values()];
  if (isNumericX) {
    data.sort((a, b) => (a.x as number) - (b.x as number));
  }

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? <p className="mb-3 text-sm leading-7 text-zinc-600"><MathText text={block.description} /></p> : null}
      <div className="max-w-full overflow-x-auto overscroll-x-contain pb-2">
        <div className="w-[780px] max-w-none">
          <LineChart width={780} height={360} data={data} margin={{ top: 24, right: 56, left: 36, bottom: 42 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="x"
                type={isNumericX ? "number" : "category"}
                interval={0}
                angle={isNumericX ? 0 : -35}
                textAnchor={isNumericX ? "middle" : "end"}
                height={isNumericX ? 48 : 76}
                tick={{ fontSize: 11, fill: "#71717a" }}
                tickMargin={10}
                label={{ value: block.xAxis, position: "bottom", offset: isNumericX ? 20 : 52, fontSize: 11, fill: "#71717a" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                width={64}
                domain={[0, "dataMax"]}
                label={{ value: block.yAxis, angle: -90, position: "left", offset: 42, fontSize: 11, fill: "#71717a" }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
              />
              {block.series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
              {block.referenceLines?.map((rl, i) => (
                <ReferenceLine
                  key={`rl-${i}`}
                  y={rl.value}
                  stroke="#ef4444"
                  strokeDasharray="6 3"
                  label={{ value: rl.label, position: "right", fontSize: 10, fill: "#ef4444" }}
                />
              ))}
              {block.series.map((s, i) => (
                <Line
                  key={`ls-${i}`}
                  type="monotone"
                  dataKey={s.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                  connectNulls
                />
              ))}
            </LineChart>
        </div>
      </div>
      <KeyTakeawaysList items={block.keyTakeaways} />
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  curve_chart                                                         */
/* ------------------------------------------------------------------ */

function CurveChartView({ block }: { block: CurveChartBlock }) {
  if (!block.curves?.length) return null;

  // Merge points, numeric x assumed
  const allXValues = new Set<number>();
  for (const curve of block.curves) {
    for (const pt of curve.points) {
      const xNum = typeof pt.x === "string" ? parseFloat(pt.x) : pt.x;
      if (!isNaN(xNum)) allXValues.add(xNum);
    }
  }
  const sortedX = [...allXValues].sort((a, b) => a - b);

  const data = sortedX.map((x) => {
    const row: Record<string, number> = { x };
    for (const curve of block.curves) {
      const pt = curve.points.find((p) => {
        const px = typeof p.x === "string" ? parseFloat(p.x) : p.x;
        return px === x;
      });
      if (pt) row[curve.name] = pt.y;
    }
    return row;
  });

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? <p className="mb-3 text-sm leading-7 text-zinc-600"><MathText text={block.description} /></p> : null}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-700">概念曲线</span>
        {block.curves.map((c) =>
          c.shape ? (
            <span key={c.name} className="text-xs text-zinc-500">
              {c.name}：{c.shape}
            </span>
          ) : null,
        )}
      </div>
      <div className="max-w-full overflow-x-auto overscroll-x-contain pb-2">
        <div className="w-[780px] max-w-none">
          <LineChart width={780} height={360} data={data} margin={{ top: 24, right: 56, left: 36, bottom: 42 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="x"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fontSize: 11, fill: "#71717a" }}
                label={{ value: block.xAxis, position: "bottom", offset: 20, fontSize: 11, fill: "#71717a" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                label={{ value: block.yAxis, angle: -90, position: "left", offset: 18, fontSize: 11, fill: "#71717a" }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
              />
              {block.curves.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
              {block.curves.map((curve, i) => (
                <Line
                  key={`cc-${i}`}
                  type="monotone"
                  dataKey={curve.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                  connectNulls
                />
              ))}
            </LineChart>
        </div>
      </div>
      <KeyTakeawaysList items={block.keyTakeaways} />
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  cashflow_diagram                                                    */
/* ------------------------------------------------------------------ */

const CASHFLOW_COLORS: Record<string, { line: string; text: string; bg: string }> = {
  fixed: { line: "bg-indigo-300", text: "text-indigo-700", bg: "bg-indigo-50" },
  floating: { line: "bg-emerald-300", text: "text-emerald-700", bg: "bg-emerald-50" },
  principal: { line: "bg-violet-300", text: "text-violet-700", bg: "bg-violet-50" },
  interest: { line: "bg-amber-300", text: "text-amber-700", bg: "bg-amber-50" },
  net: { line: "bg-zinc-300", text: "text-zinc-700", bg: "bg-zinc-50" },
  collateral: { line: "bg-orange-300", text: "text-orange-700", bg: "bg-orange-50" },
  risk_transfer: { line: "bg-red-300", text: "text-red-700", bg: "bg-red-50" },
  other: { line: "bg-zinc-300", text: "text-zinc-700", bg: "bg-zinc-50" },
};

function CashflowEdgeRow({
  edge,
  fromLabel,
  toLabel,
}: {
  edge: CashflowDiagramBlock["edges"][number];
  fromLabel: string;
  toLabel: string;
}) {
  const colors = CASHFLOW_COLORS[edge.cashflowType ?? "other"] ?? CASHFLOW_COLORS.other;
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
        {fromLabel}
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <div className="flex w-full items-center">
          <div className={`h-0.5 flex-1 ${colors.line}`} />
          <span className={`mx-0.5 text-sm leading-none ${colors.text}`}>▶</span>
        </div>
        <p className="mt-0.5 text-center text-xs font-medium text-zinc-800">
          <MathText text={edge.label} />
        </p>
        {edge.timing ? <p className="text-center text-[10px] text-zinc-500"><MathText text={edge.timing} /></p> : null}
      </div>
      <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
        {toLabel}
      </span>
    </div>
  );
}

function CashflowDiagramView({ block }: { block: CashflowDiagramBlock }) {
  if (!block.nodes?.length || !block.edges?.length) return null;

  const nodeMap = new Map(block.nodes.map((n) => [n.id, n]));
  const hasPhases = block.phases && block.phases.length > 0;

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? (
        <p className="mb-4 text-sm leading-7 text-zinc-600">
          <MathText text={block.description} />
        </p>
      ) : null}

      {/* Nodes overview */}
      <div className="mb-4 flex flex-wrap gap-2">
        {block.nodes.map((node) => (
          <div key={node.id} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-sm font-semibold text-zinc-900"><MathText text={node.label} /></p>
            {node.role ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                <MathText text={node.role} />
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-2 overflow-x-auto overscroll-x-contain">
        {hasPhases
          ? block.phases!.map((phase, pi) => {
              const phaseEdges = block.edges.filter((e) => phase.edgeIds.includes(e.id));
              if (!phaseEdges.length) return null;
              return (
                <div key={`phase-${pi}`} className="mb-3 min-w-[720px]">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500"><MathText text={phase.title} /></p>
                  {phaseEdges.map((edge) => (
                    <CashflowEdgeRow
                      key={edge.id}
                      edge={edge}
                      fromLabel={nodeMap.get(edge.from)?.label ?? edge.from}
                      toLabel={nodeMap.get(edge.to)?.label ?? edge.to}
                    />
                  ))}
                </div>
              );
            })
          : block.edges.map((edge) => (
              <div key={edge.id} className="min-w-[720px]">
                <CashflowEdgeRow
                  edge={edge}
                  fromLabel={nodeMap.get(edge.from)?.label ?? edge.from}
                  toLabel={nodeMap.get(edge.to)?.label ?? edge.to}
                />
              </div>
            ))}
      </div>

      {block.outcome ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold text-emerald-700">结论</p>
          <p className="mt-1 text-sm leading-7 text-emerald-900">
            <MathText text={block.outcome} />
          </p>
        </div>
      ) : null}

      <KeyTakeawaysList items={block.keyTakeaways} />
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  decision_tree                                                       */
/* ------------------------------------------------------------------ */

function DecisionTreeView({ block }: { block: DecisionTreeBlock }) {
  if (!block.root?.question || !block.nodes?.length) return null;

  const nodeMap = new Map(block.nodes.map((n) => [n.id, n]));

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? (
        <p className="mb-4 text-sm leading-7 text-zinc-600">
          <MathText text={block.description} />
        </p>
      ) : null}

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
            判断分支
          </span>
          <span className="text-xs text-indigo-500">每个条件对应一个独立结果</span>
        </div>
        <div className="mt-3 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-center shadow-sm">
          <p className="text-sm font-semibold leading-7 text-indigo-950">
            <MathText text={block.root.question} />
          </p>
        </div>
      </div>

      <div className="relative mt-4 overflow-x-auto overscroll-x-contain">
        <div className="min-w-[720px]">
          <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-zinc-200" />
          <div className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {block.root.branches.map((branch, bi) => {
              const targetNode = nodeMap.get(branch.target);
              return (
                <div key={`br-${bi}`} className="relative rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="absolute -top-4 left-1/2 h-4 w-px -translate-x-1/2 bg-zinc-200" />
                  <div className="mb-3 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
                    条件：<MathText text={branch.condition} />
                  </div>
                  {targetNode ? (
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-3">
                      <p className="text-sm font-semibold text-zinc-950">
                        结果：<MathText text={targetNode.label} />
                      </p>
                      {targetNode.content ? (
                        <p className="mt-2 text-sm leading-7 text-zinc-600">
                          <MathText text={targetNode.content} />
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">未找到目标节点：{branch.target}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <KeyTakeawaysList items={block.keyTakeaways} />
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  timeline                                                            */
/* ------------------------------------------------------------------ */

function TimelineView({ block }: { block: TimelineBlock }) {
  if (!block.events?.length) return null;

  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? (
        <p className="mb-4 text-sm leading-7 text-zinc-600">
          <MathText text={block.description} />
        </p>
      ) : null}

      <div className="relative ml-2 border-l-2 border-zinc-200 pl-6">
        {block.events.map((event, i) => (
          <div key={`te-${i}`} className="relative pb-6 last:pb-0">
            {/* Dot on the line */}
            <div className="absolute -left-[calc(1.5rem+5px)] top-1 h-3 w-3 rounded-full border-2 border-zinc-900 bg-white" />
            <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
              {event.time}
            </span>
            <p className="mt-1 font-medium text-zinc-900">
              <MathText text={event.title} />
            </p>
            {event.description ? (
              <p className="mt-0.5 text-sm leading-7 text-zinc-600">
                <MathText text={event.description} />
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <KeyTakeawaysList items={block.keyTakeaways} />
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  econometrics / Stata blocks                                        */
/* ------------------------------------------------------------------ */

function StataCodeBlockView({ block }: { block: StataCodeBlock }) {
  if (!block.code) return null;
  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? <p className="mb-3 text-sm leading-7 text-zinc-600"><MathText text={block.description} /></p> : null}
      <div className="mb-3 flex flex-wrap gap-2">
        <InlineMeta label="语言" value={block.language ?? "stata"} />
        <InlineMeta label="来源" value={block.sourceFile} />
      </div>
      {block.commands?.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {block.commands.map((command, i) => (
            <span key={`cmd-${i}`} className="rounded-lg bg-sky-50 px-2.5 py-1 font-mono text-xs font-medium text-sky-800 ring-1 ring-sky-100">
              {command}
            </span>
          ))}
        </div>
      ) : null}
      <CodePanel code={block.code} tone="sky" />
      <NoteList items={block.notes} />
    </BlockCard>
  );
}

function StataOutputBlockView({ block }: { block: StataOutputBlock }) {
  if (!block.output) return null;
  return (
    <BlockCard title={block.title} type={block.type}>
      <div className="mb-3 flex flex-wrap gap-2">
        <InlineMeta label="命令" value={block.command} />
        <InlineMeta label="来源" value={block.sourceFile} />
      </div>
      <CodePanel code={block.output} />
      {block.highlights?.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {block.highlights.map((item, i) => (
            <div key={`hl-${i}`} className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3">
              <p className="text-xs font-semibold text-sky-700"><MathText text={item.label} /></p>
              <p className="mt-1 font-mono text-sm font-semibold text-zinc-950">{item.value}</p>
              {item.meaning ? <p className="mt-1 text-sm leading-6 text-zinc-600"><MathText text={item.meaning} /></p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {block.annotations?.length ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">输出字段怎么读</p>
          <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-zinc-200">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/80">
                  {['字段', '含义', '怎么看', '考试怎么用'].map((header) => (
                    <th key={header} className="px-3 py-2.5 text-left align-top text-xs font-semibold uppercase text-zinc-700">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.annotations.map((item, i) => (
                  <tr key={`ann-${i}`} className="border-b border-zinc-100 last:border-0">
                    <td className="px-3 py-2.5 align-top font-mono text-xs font-semibold text-zinc-950">{item.field}</td>
                    <td className="max-w-64 px-3 py-2.5 align-top text-zinc-700"><MathText text={item.meaning} /></td>
                    <td className="max-w-72 px-3 py-2.5 align-top text-zinc-700"><MathText text={item.howToRead} /></td>
                    <td className="max-w-72 px-3 py-2.5 align-top text-zinc-700"><MathText text={item.examUse ?? ""} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      <NoteList title="警告 / 注意" items={block.warnings} tone="amber" />
    </BlockCard>
  );
}

function StataInterfaceGuideView({ block }: { block: StataInterfaceGuideBlock }) {
  if (!block.areas?.length) return null;
  return (
    <BlockCard title={block.title} type={block.type}>
      {block.imageSrc ? (
        <div className="mb-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.imageSrc} alt={block.title} className="mx-auto block h-auto max-h-[520px] max-w-full object-contain" loading="lazy" />
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {block.areas.map((area, i) => (
          <div key={`${area.name}-${i}`} className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-zinc-950"><MathText text={area.name} /></p>
              {area.location ? (
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-sky-100">
                  <MathText text={area.location} />
                </span>
              ) : null}
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
              <p><span className="font-medium text-zinc-950">用途：</span><MathText text={area.purpose} /></p>
              <p><span className="font-medium text-zinc-950">学生动作：</span><MathText text={area.studentAction} /></p>
              {area.commonMistake ? <p className="text-amber-800"><span className="font-medium">常见错误：</span><MathText text={area.commonMistake} /></p> : null}
            </div>
          </div>
        ))}
      </div>
    </BlockCard>
  );
}

function TableMappingBlockView({ block }: { block: TableMappingBlock }) {
  if (!block.mappings?.length) return null;
  const headers = ["表格列", "模型", "Stata 命令", "log 位置", "系数", "标准误", "p 值", "考试解释", "注意事项"];
  return (
    <BlockCard title={block.title} type={block.type}>
      <div className="mb-3 flex flex-wrap gap-2">
        <InlineMeta label="目标表" value={block.targetTable} />
      </div>
      <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-zinc-200">
        <table className="w-full min-w-[1040px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100/80">
              {headers.map((header) => (
                <th key={header} className="px-3 py-2.5 text-left align-top text-xs font-semibold uppercase text-zinc-700">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.mappings.map((item, i) => (
              <tr key={`${item.tableColumn}-${i}`} className="border-b border-zinc-100 last:border-0">
                <td className="max-w-40 px-3 py-2.5 align-top font-semibold text-zinc-950"><MathText text={item.tableColumn} /></td>
                <td className="max-w-36 px-3 py-2.5 align-top text-zinc-700"><MathText text={item.model ?? ""} /></td>
                <td className="max-w-64 whitespace-pre-wrap break-words px-3 py-2.5 align-top font-mono text-xs text-sky-900">{item.command}</td>
                <td className="max-w-52 px-3 py-2.5 align-top text-zinc-700"><MathText text={item.logSource ?? ""} /></td>
                <td className="max-w-44 px-3 py-2.5 align-top text-zinc-700"><MathText text={item.coefficientPath ?? ""} /></td>
                <td className="max-w-44 px-3 py-2.5 align-top text-zinc-700"><MathText text={item.stdErrPath ?? ""} /></td>
                <td className="max-w-44 px-3 py-2.5 align-top text-zinc-700"><MathText text={item.pValuePath ?? ""} /></td>
                <td className="max-w-80 px-3 py-2.5 align-top text-zinc-700"><MathText text={item.examInterpretation} /></td>
                <td className="max-w-72 px-3 py-2.5 align-top text-amber-800"><MathText text={item.caution ?? ""} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BlockCard>
  );
}

const teacherNoteToneMeta: Record<NonNullable<CalloutTeacherNoteBlock["tone"]>, { label: string; className: string }> = {
  concept: { label: "概念提示", className: "border-sky-100 bg-sky-50/70 text-sky-900" },
  exam: { label: "考试提醒", className: "border-red-100 bg-red-50/70 text-red-900" },
  warning: { label: "误区提醒", className: "border-amber-100 bg-amber-50/70 text-amber-900" },
  intuition: { label: "直觉理解", className: "border-emerald-100 bg-emerald-50/70 text-emerald-900" },
};

function CalloutTeacherNoteView({ block }: { block: CalloutTeacherNoteBlock }) {
  if (!block.body) return null;
  const tone = teacherNoteToneMeta[block.tone ?? "concept"];
  return (
    <BlockCard title={block.title} type={block.type}>
      <div className={`rounded-2xl border px-4 py-3 ${tone.className}`}>
        <p className="text-xs font-semibold">{tone.label}</p>
        <div className="mt-2 space-y-2 text-sm leading-7">
          {block.body.split("\n").map((line, i) => (
            <p key={`body-${i}`}><MathText text={line} /></p>
          ))}
        </div>
      </div>
      {block.example ? (
        <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50/70 px-4 py-3">
          <p className="text-xs font-semibold text-zinc-500">例子</p>
          <p className="mt-1 text-sm leading-7 text-zinc-800"><MathText text={block.example} /></p>
        </div>
      ) : null}
    </BlockCard>
  );
}

function RegressionTableView({ block }: { block: RegressionTableBlock }) {
  if (!block.models?.length) return null;
  const variables = Array.from(new Set(block.models.flatMap((model) => model.rows?.map((row) => row.variable) ?? [])));
  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? <p className="mb-3 text-sm leading-7 text-zinc-600"><MathText text={block.description} /></p> : null}
      <div className="mb-3 flex flex-wrap gap-2">
        <InlineMeta label="被解释变量" value={block.dependentVariable} />
        <InlineMeta label="来源" value={block.sourceFile} />
      </div>
      <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-zinc-200">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100/80">
              <th className="w-44 px-3 py-2.5 text-left align-top text-xs font-semibold uppercase text-zinc-700">变量</th>
              {block.models.map((model, i) => (
                <th key={`model-${i}`} className="min-w-44 px-3 py-2.5 text-left align-top text-xs font-semibold uppercase text-zinc-700">
                  <MathText text={model.name} />
                  <div className="mt-1 space-y-0.5 text-[11px] font-normal leading-5 text-zinc-500">
                    {model.estimator ? <p><MathText text={model.estimator} /></p> : null}
                    {model.fixedEffects?.length ? <p>FE: {model.fixedEffects.join(" + ")}</p> : null}
                    {model.clusteredBy ? <p>Cluster: {model.clusteredBy}</p> : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variables.map((variable) => (
              <tr key={variable} className="border-b border-zinc-100 last:border-0">
                <td className="px-3 py-3 align-top font-medium text-zinc-900"><MathText text={variable} /></td>
                {block.models.map((model, i) => {
                  const row = model.rows.find((item) => item.variable === variable);
                  return (
                    <td key={`${variable}-${i}`} className="px-3 py-3 align-top text-zinc-700">
                      {row ? (
                        <div className="space-y-1">
                          {row.coef ? <p className="font-mono text-sm font-semibold text-zinc-950">{row.coef}</p> : null}
                          {row.stdErr ? <p className="font-mono text-xs text-zinc-500">({row.stdErr})</p> : null}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                            {row.t ? <span>t={row.t}</span> : null}
                            {row.p ? <span>p={row.p}</span> : null}
                          </div>
                          {row.note ? <p className="text-xs leading-5 text-amber-700"><MathText text={row.note} /></p> : null}
                        </div>
                      ) : <span className="text-zinc-300">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-zinc-200 bg-zinc-50/70">
              <td className="px-3 py-2 font-medium text-zinc-700">N</td>
              {block.models.map((model, i) => <td key={`n-${i}`} className="px-3 py-2 font-mono text-xs text-zinc-700">{model.n ?? "—"}</td>)}
            </tr>
            <tr className="bg-zinc-50/70">
              <td className="px-3 py-2 font-medium text-zinc-700">R²</td>
              {block.models.map((model, i) => <td key={`r2-${i}`} className="px-3 py-2 font-mono text-xs text-zinc-700">{model.r2 ?? "—"}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <NoteList items={block.notes} />
    </BlockCard>
  );
}

function DatasetSchemaView({ block }: { block: DatasetSchemaBlock }) {
  if (!block.variables?.length) return null;
  return (
    <BlockCard title={block.title} type={block.type}>
      {block.description ? <p className="mb-3 text-sm leading-7 text-zinc-600"><MathText text={block.description} /></p> : null}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
          <p className="text-xs font-semibold text-emerald-700">数据集</p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-950">{block.datasetName}</p>
        </div>
        <InlineMeta label="观测值" value={block.observations} />
        <InlineMeta label="变量数" value={block.variablesCount} />
        <InlineMeta label="平衡面板" value={block.isBalancedPanel === undefined ? undefined : block.isBalancedPanel ? "是" : "否"} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <InlineMeta label="Panel ID" value={block.panelId} />
        <InlineMeta label="Time ID" value={block.timeId} />
      </div>
      <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-zinc-200">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-100/80">
              {['变量名', '标签', '类型', '角色', '生成来源'].map((header) => (
                <th key={header} className="px-3 py-2.5 text-left align-top text-xs font-semibold uppercase text-zinc-700">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.variables.map((variable, i) => (
              <tr key={`${variable.name}-${i}`} className="border-b border-zinc-100 last:border-0">
                <td className="px-3 py-2 align-top font-mono text-xs font-semibold text-zinc-950">{variable.name}</td>
                <td className="max-w-64 px-3 py-2 align-top text-zinc-700"><MathText text={variable.label ?? ""} /></td>
                <td className="px-3 py-2 align-top font-mono text-xs text-zinc-600">{variable.type ?? "—"}</td>
                <td className="px-3 py-2 align-top text-zinc-700"><MathText text={variable.role ?? ""} /></td>
                <td className="max-w-56 px-3 py-2 align-top text-zinc-600"><MathText text={variable.generatedFrom ?? ""} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NoteList items={block.notes} />
    </BlockCard>
  );
}

function ReproductionStepsView({ block }: { block: ReproductionStepsBlock }) {
  if (!block.steps?.length) return null;
  return (
    <BlockCard title={block.title} type={block.type}>
      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <p className="text-xs font-semibold text-indigo-700">复现目标</p>
        <p className="mt-1 text-sm leading-7 text-zinc-800"><MathText text={block.goal} /></p>
      </div>
      <ol className="space-y-3">
        {block.steps.map((step, i) => (
          <li key={`rep-${i}`} className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-7 text-zinc-900"><MathText text={step.label} /></p>
                {step.explanation ? <p className="mt-1 text-sm leading-6 text-zinc-600"><MathText text={step.explanation} /></p> : null}
                {step.command ? <div className="mt-3"><CodePanel code={step.command} tone="sky" /></div> : null}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {step.expectedOutput ? <div className="rounded-xl bg-white px-3 py-2 text-sm leading-6 text-zinc-700"><span className="font-medium text-zinc-900">预期输出：</span><MathText text={step.expectedOutput} /></div> : null}
                  {step.check ? <div className="rounded-xl bg-white px-3 py-2 text-sm leading-6 text-emerald-800"><span className="font-medium">核对：</span><MathText text={step.check} /></div> : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {block.finalCheck ? <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-900"><span className="font-semibold">最终核对：</span><MathText text={block.finalCheck} /></div> : null}
      {block.sourceFiles?.length ? <NoteList title="相关文件" items={block.sourceFiles} /> : null}
    </BlockCard>
  );
}

function ExamTaskView({ block }: { block: ExamTaskBlock }) {
  return (
    <BlockCard title={block.title} type={block.type}>
      <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
        <p className="text-xs font-semibold text-red-700">题目</p>
        <p className="mt-1 text-sm leading-7 text-zinc-800"><MathText text={block.prompt} /></p>
      </div>
      <NoteList title="作答要求" items={block.requirements} />
      <NoteList title="答题路径" items={block.answerPath} />
      <NoteList title="得分点" items={block.scoringPoints} />
      <NoteList title="常见失分" items={block.commonMistakes} tone="amber" />
    </BlockCard>
  );
}

function InterpretationChecklistView({ block }: { block: InterpretationChecklistBlock }) {
  if (!block.items?.length) return null;
  return (
    <BlockCard title={block.title} type={block.type}>
      <div className="space-y-2">
        {block.items.map((item, i) => (
          <div key={`chk-${i}`} className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-4 py-3">
            <p className="font-medium text-zinc-900">{i + 1}. <MathText text={item.label} /></p>
            {item.question ? <p className="mt-1 text-sm leading-6 text-zinc-600">问题：<MathText text={item.question} /></p> : null}
            {item.expected ? <p className="mt-1 text-sm leading-6 text-emerald-800">应答：<MathText text={item.expected} /></p> : null}
            {item.warning ? <p className="mt-1 text-sm leading-6 text-amber-800">注意：<MathText text={item.warning} /></p> : null}
          </div>
        ))}
      </div>
    </BlockCard>
  );
}

function CommonStataErrorView({ block }: { block: CommonStataErrorBlock }) {
  return (
    <BlockCard title={block.title} type={block.type}>
      <div className="rounded-xl border border-red-100 bg-red-50/70 px-4 py-3">
        <p className="text-xs font-semibold text-red-700">错误 / 警告信息</p>
        <p className="mt-1 font-mono text-sm font-semibold leading-6 text-red-950">{block.message}</p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {block.cause ? <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900"><p className="text-xs font-semibold text-amber-800">原因</p><p className="mt-1"><MathText text={block.cause} /></p></div> : null}
        {block.fix ? <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-900"><p className="text-xs font-semibold text-emerald-800">修复</p><p className="mt-1"><MathText text={block.fix} /></p></div> : null}
      </div>
      {block.example ? <div className="mt-3"><CodePanel code={block.example} tone="red" /></div> : null}
    </BlockCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Main renderer                                                      */
/* ------------------------------------------------------------------ */

export default function VisualBlockRenderer({
  blocks,
  showHeading = true,
  compactTables = true,
}: {
  blocks?: unknown[];
  showHeading?: boolean;
  compactTables?: boolean;
}) {
  if (!blocks?.length) return null;

  return (
    <div className="mt-6 space-y-4">
      {showHeading ? <p className="text-sm font-semibold text-zinc-900">可视化内容</p> : null}
      {blocks.map((block, index) => {
        const b = block as VisualBlock | undefined;
        if (!b?.type) return null;

        try {
          switch (b.type) {
            case "process_flow":
              return <ProcessFlowView key={`vb-${index}`} block={b} />;
            case "comparison_table":
              return <ComparisonTableView key={`vb-${index}`} block={b} compact={compactTables} />;
            case "formula_card":
              return <FormulaCardView key={`vb-${index}`} block={b} />;
            case "concept_map":
              return <ConceptMapView key={`vb-${index}`} block={b} />;
            case "image":
              return <ImageBlockView key={`vb-${index}`} block={b} />;
            case "case_card":
              return <CaseCardView key={`vb-${index}`} block={b} />;
            case "data_table":
              return <DataTableView key={`vb-${index}`} block={b} compact={compactTables} />;
            case "example_box":
              return <ExampleBoxView key={`vb-${index}`} block={b} />;
            case "chart_explanation":
              return <ChartExplanationView key={`vb-${index}`} block={b} />;
            case "payoff_chart":
              return <PayoffChartView key={`vb-${index}`} block={b} />;
            case "line_chart":
              return <LineChartView key={`vb-${index}`} block={b} />;
            case "curve_chart":
              return <CurveChartView key={`vb-${index}`} block={b} />;
            case "cashflow_diagram":
              return <CashflowDiagramView key={`vb-${index}`} block={b} />;
            case "decision_tree":
              return <DecisionTreeView key={`vb-${index}`} block={b} />;
            case "timeline":
              return <TimelineView key={`vb-${index}`} block={b} />;
            case "stata_code_block":
              return <StataCodeBlockView key={`vb-${index}`} block={b} />;
            case "stata_output_block":
              return <StataOutputBlockView key={`vb-${index}`} block={b} />;
            case "stata_interface_guide":
              return <StataInterfaceGuideView key={`vb-${index}`} block={b} />;
            case "table_mapping_block":
              return <TableMappingBlockView key={`vb-${index}`} block={b} />;
            case "callout_teacher_note":
              return <CalloutTeacherNoteView key={`vb-${index}`} block={b} />;
            case "regression_table":
              return <RegressionTableView key={`vb-${index}`} block={b} />;
            case "dataset_schema":
              return <DatasetSchemaView key={`vb-${index}`} block={b} />;
            case "reproduction_steps":
              return <ReproductionStepsView key={`vb-${index}`} block={b} />;
            case "exam_task":
              return <ExamTaskView key={`vb-${index}`} block={b} />;
            case "interpretation_checklist":
              return <InterpretationChecklistView key={`vb-${index}`} block={b} />;
            case "common_stata_error":
              return <CommonStataErrorView key={`vb-${index}`} block={b} />;
            default:
              return null;
          }
        } catch {
          return null;
        }
      })}
    </div>
  );
}
