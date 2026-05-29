import {
  classifyBlockTier,
  getResourceAnchorId,
  type ContentTier,
  type LearningModule,
} from "./buildLearningModules";

type ResourceJumpTarget = {
  anchorId: string;
  moduleIndex: number;
};

type ResourceEntry = ResourceJumpTarget & {
  title: string;
  moduleId: string;
  moduleTitle: string;
  tier: ContentTier;
};

type ResourceGroup = {
  formulas: ResourceEntry[];
  examples: ResourceEntry[];
  cases: ResourceEntry[];
  charts: ResourceEntry[];
};

type ResourceIndexData = {
  core: ResourceGroup;
  extension: ResourceGroup;
};

function createGroup(): ResourceGroup {
  return { formulas: [], examples: [], cases: [], charts: [] };
}

function getBlockTitle(block: unknown): string {
  if (!block || typeof block !== "object") return "";
  const b = block as { title?: string };
  return b.title ?? "";
}

function getBlockType(block: unknown): string {
  if (!block || typeof block !== "object" || !("type" in block)) return "";
  return typeof (block as { type?: unknown }).type === "string" ? (block as { type: string }).type : "";
}

function pushEntry(group: ResourceGroup, type: string, entry: ResourceEntry) {
  switch (type) {
    case "formula_card":
      group.formulas.push(entry);
      break;
    case "example_box":
      group.examples.push(entry);
      break;
    case "case_card":
      group.cases.push(entry);
      break;
    case "payoff_chart":
    case "line_chart":
    case "curve_chart":
    case "chart_explanation":
    case "cashflow_diagram":
    case "decision_tree":
    case "timeline":
    case "process_flow":
      group.charts.push(entry);
      break;
  }
}

function buildIndex(modules: LearningModule[]): ResourceIndexData {
  const index: ResourceIndexData = { core: createGroup(), extension: createGroup() };

  for (const mod of modules) {
    for (const block of mod.visualBlocks) {
      const title = getBlockTitle(block);
      if (!title) continue;
      const tier = classifyBlockTier(block);
      const anchorId = getResourceAnchorId(mod, block);
      if (!anchorId) continue;
      const entry: ResourceEntry = { title, anchorId, moduleId: mod.id, moduleIndex: mod.index, moduleTitle: mod.title, tier };
      const type = getBlockType(block);
      pushEntry(tier === "core" ? index.core : index.extension, type, entry);
    }
  }

  return index;
}

function hasAny(group: ResourceGroup) {
  return group.formulas.length > 0 || group.examples.length > 0 || group.cases.length > 0 || group.charts.length > 0;
}

function countResources(group: ResourceGroup) {
  return group.formulas.length + group.examples.length + group.cases.length + group.charts.length;
}

export function countIndexableResources(modules: LearningModule[]) {
  const index = buildIndex(modules);
  return countResources(index.core) + countResources(index.extension);
}

export function hasIndexableResources(modules: LearningModule[]) {
  return countIndexableResources(modules) > 0;
}

const resourceSections: Array<{ key: keyof ResourceGroup; label: string }> = [
  { key: "formulas", label: "公式" },
  { key: "examples", label: "例题" },
  { key: "cases", label: "案例" },
  { key: "charts", label: "图表" },
];

function ResourceGroupView({
  group,
  muted = false,
  onJumpToResource,
}: {
  group: ResourceGroup;
  muted?: boolean;
  onJumpToResource?: (target: ResourceJumpTarget) => void;
}) {
  const linkClass = muted
    ? "text-left text-zinc-500 hover:text-zinc-800 hover:underline"
    : "text-left text-zinc-700 hover:text-red-700 hover:underline";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {resourceSections.map(({ key, label }) => {
        const entries = group[key];
        if (entries.length === 0) return null;
        return (
          <div key={key} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-900">{label}</p>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500">{entries.length}</span>
            </div>
            <ol className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.anchorId} className="rounded-xl bg-zinc-50/80 px-3 py-2 text-sm">
                  {onJumpToResource ? (
                    <button
                      type="button"
                      className={linkClass}
                      onClick={() => onJumpToResource({ anchorId: entry.anchorId, moduleIndex: entry.moduleIndex })}
                    >
                      {entry.title}
                    </button>
                  ) : (
                    <a href={`#${entry.moduleId}`} className={linkClass}>{entry.title}</a>
                  )}
                  <span className="mt-1 block truncate text-xs text-zinc-400">来自：{entry.moduleTitle}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

export default function ResourceIndex({
  modules,
  onJumpToResource,
}: {
  modules: LearningModule[];
  onJumpToResource?: (target: ResourceJumpTarget) => void;
}) {
  const index = buildIndex(modules);
  const hasCore = hasAny(index.core);
  const hasExtension = hasAny(index.extension);
  const coreCount = countResources(index.core);
  const extensionCount = countResources(index.extension);
  const totalCount = coreCount + extensionCount;
  if (!hasCore && !hasExtension) return null;

  return (
    <section id="resource-index" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Resource center</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">本章资源索引</h2>
          <p className="mt-1.5 text-sm leading-7 text-zinc-500">优先定位核心公式、例题、案例和图表。</p>
        </div>
        {hasCore && <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">核心资源</span>}
      </div>

      <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs font-medium text-zinc-600">
        <span>总计 {totalCount}</span>
        <span className="text-zinc-300">/</span>
        <span>核心 {coreCount}</span>
        <span className="text-zinc-300">/</span>
        <span>拓展 {extensionCount}</span>
      </div>

      {hasCore && <ResourceGroupView group={index.core} onJumpToResource={onJumpToResource} />}

      {hasExtension && (
        <details className={hasCore ? "mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3" : "rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3"}>
          <summary className="cursor-pointer text-sm font-semibold text-zinc-600">拓展资源</summary>
          <div className="mt-3">
            <ResourceGroupView group={index.extension} muted onJumpToResource={onJumpToResource} />
          </div>
        </details>
      )}
    </section>
  );
}
