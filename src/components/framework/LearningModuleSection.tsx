import type { ReactNode } from "react";
import VisualBlockRenderer from "./VisualBlockRenderer";
import MathText from "./MathText";
import {
  classifyBlockTier,
  classifyNodeTier,
  getResourceAnchorId,
  type ContentTier,
  type LearningModule,
} from "./buildLearningModules";
import type { FrameworkNode } from "./FrameworkLearningView";

function BasicCard({ title, tone = "default", children }: { title?: string; tone?: "default" | "highlight"; children: ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "highlight" ? "border-red-100 bg-red-50/40" : "border-zinc-200 bg-zinc-50/60"}`}>
      {title && <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.14em] ${tone === "highlight" ? "text-red-600" : "text-zinc-500"}`}>{title}</p>}
      {children}
    </div>
  );
}

function splitByTier<T>(items: T[], classify: (item: T) => ContentTier) {
  const core: T[] = [];
  const support: T[] = [];
  const extension: T[] = [];

  for (const item of items) {
    const tier = classify(item);
    if (tier === "support") support.push(item);
    else if (tier === "extension") extension.push(item);
    else core.push(item);
  }

  return { core, support, extension };
}

function getBlockType(block: unknown): string {
  if (!block || typeof block !== "object" || !("type" in block)) return "";
  const type = (block as { type?: unknown }).type;
  return typeof type === "string" ? type : "";
}

function getResourceSummary(blocks: unknown[]) {
  const formulaCount = blocks.filter((block) => getBlockType(block) === "formula_card").length;
  const exampleCount = blocks.filter((block) => getBlockType(block) === "example_box").length;
  const chartTypes = new Set(["payoff_chart", "line_chart", "curve_chart", "chart_explanation", "cashflow_diagram", "decision_tree", "timeline", "process_flow"]);
  const chartCount = blocks.filter((block) => chartTypes.has(getBlockType(block))).length;
  const codeTypes = new Set(["stata_code_block", "stata_output_block"]);
  const codeCount = blocks.filter((block) => codeTypes.has(getBlockType(block))).length;
  const regressionCount = blocks.filter((block) => getBlockType(block) === "regression_table").length;
  const datasetCount = blocks.filter((block) => getBlockType(block) === "dataset_schema").length;
  const reproductionCount = blocks.filter((block) => getBlockType(block) === "reproduction_steps").length;
  const taskTypes = new Set(["exam_task", "interpretation_checklist", "common_stata_error"]);
  const taskCount = blocks.filter((block) => taskTypes.has(getBlockType(block))).length;
  return [
    formulaCount > 0 ? `公式 ${formulaCount}` : "",
    exampleCount > 0 ? `例题 ${exampleCount}` : "",
    chartCount > 0 ? `图表 ${chartCount}` : "",
    codeCount > 0 ? `代码 ${codeCount}` : "",
    regressionCount > 0 ? `回归表 ${regressionCount}` : "",
    datasetCount > 0 ? `数据集 ${datasetCount}` : "",
    reproductionCount > 0 ? `复现 ${reproductionCount}` : "",
    taskCount > 0 ? `任务 ${taskCount}` : "",
  ].filter(Boolean);
}

function ConceptList({ items }: { items: FrameworkNode[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((child, i) => (
        <div key={`kp-${i}`} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-[11px] font-semibold text-red-600 ring-1 ring-red-100">
              {i + 1}
            </span>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-zinc-900">
                {child.name}
              </span>
              {child.summary && (
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  <MathText text={child.summary} />
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FoldedTierSection({
  title,
  description,
  concepts,
  blocks,
  defaultOpen = false,
  compactTables,
  getBlockAnchorId,
  highlightedAnchorId,
}: {
  title: string;
  description: string;
  concepts: FrameworkNode[];
  blocks: unknown[];
  defaultOpen?: boolean;
  compactTables: boolean;
  getBlockAnchorId?: (block: unknown) => string | null;
  highlightedAnchorId?: string | null;
}) {
  if (concepts.length === 0 && blocks.length === 0) return null;

  const shouldOpen = defaultOpen || Boolean(highlightedAnchorId && blocks.some((block) => getBlockAnchorId?.(block) === highlightedAnchorId));

  return (
    <details
      className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3"
      open={shouldOpen}
    >
      <summary className="cursor-pointer text-sm font-semibold text-zinc-600">
        {title}
        <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-normal text-zinc-400">
          {concepts.length + blocks.length} 项
        </span>
      </summary>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{description}</p>
      <div className="mt-3 space-y-3">
        {concepts.length > 0 && (
          <BasicCard title="知识补充">
            <ConceptList items={concepts} />
          </BasicCard>
        )}
        {blocks.length > 0 && (
          <VisualBlockRenderer
            blocks={blocks}
            showHeading={false}
            compactTables={compactTables}
            getBlockAnchorId={getBlockAnchorId}
            highlightedAnchorId={highlightedAnchorId}
          />
        )}
      </div>
    </details>
  );
}

export default function LearningModuleSection({
  module,
  compactTables = true,
  highlightedAnchorId,
}: {
  module: LearningModule;
  compactTables?: boolean;
  highlightedAnchorId?: string | null;
}) {
  const node = module.sourceNode;
  const nodeSummary = node.summary;

  const conceptItems = module.conceptItems;
  const blocks = module.visualBlocks;
  const tieredConcepts = splitByTier(conceptItems, classifyNodeTier);
  const tieredBlocks = splitByTier(blocks, classifyBlockTier);
  const resourceSummary = getResourceSummary(blocks);
  const getBlockAnchorId = (block: unknown) => getResourceAnchorId(module, block);

  const hasCoreConcepts = tieredConcepts.core.length > 0;
  const hasCoreBlocks = tieredBlocks.core.length > 0;
  const hasContent =
    nodeSummary ||
    conceptItems.length > 0 ||
    blocks.length > 0;

  if (!hasContent) {
    return (
      <section
        id={module.id}
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            模块 {String(module.index + 1).padStart(2, "0")}
          </p>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">当前学习</span>
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
          {module.title}
        </h2>
      </section>
    );
  }

  return (
    <section
      id={module.id}
      className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              模块 {String(module.index + 1).padStart(2, "0")}
            </p>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">学习模块</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            {module.title}
          </h2>
        </div>
        {resourceSummary.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {resourceSummary.map((item) => (
              <span key={item} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        {nodeSummary && (
          <BasicCard tone="highlight" title="模块速记">
            <p className="text-sm leading-7 text-zinc-700">
              <MathText text={nodeSummary} />
            </p>
          </BasicCard>
        )}

        {hasCoreConcepts && (
          <BasicCard title="核心知识点">
            <ConceptList items={tieredConcepts.core} />
          </BasicCard>
        )}

        {hasCoreBlocks && (
          <VisualBlockRenderer
            blocks={tieredBlocks.core}
            showHeading={false}
            compactTables={compactTables}
            getBlockAnchorId={getBlockAnchorId}
            highlightedAnchorId={highlightedAnchorId}
          />
        )}

        <FoldedTierSection
          title="补充理解"
          description="背景、机制补充和低频细节默认收起，需要时展开查看。"
          concepts={tieredConcepts.support}
          blocks={tieredBlocks.support}
          compactTables={compactTables}
          getBlockAnchorId={getBlockAnchorId}
          highlightedAnchorId={highlightedAnchorId}
        />

        <FoldedTierSection
          title="拓展材料"
          description="阅读链接、市场实践、外部资料和延伸材料默认收起。"
          concepts={tieredConcepts.extension}
          blocks={tieredBlocks.extension}
          compactTables={compactTables}
          getBlockAnchorId={getBlockAnchorId}
          highlightedAnchorId={highlightedAnchorId}
        />
      </div>
    </section>
  );
}
