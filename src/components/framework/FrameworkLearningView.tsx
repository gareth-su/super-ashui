"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import VisualBlockRenderer from "./VisualBlockRenderer";
import { buildLearningModules, type LearningModule, type ModuleBuildResult } from "./buildLearningModules";
import LearningModuleSection from "./LearningModuleSection";
import ResourceIndex from "./ResourceIndex";
import MathText from "./MathText";

export type FrameworkNode = {
  name?: string;
  summary?: string;
  children?: FrameworkNode[];
};

export type FrameworkChapter = {
  chapterTitle?: string;
  sourceFile?: string;
  summary?: string;
  keyConcepts?: string[];
  nodes?: FrameworkNode[];
  visualBlocks?: unknown[];
};

export type FrameworkData = {
  title?: string;
  courseSummary?: string;
  chapters?: FrameworkChapter[];
  overallFramework?: {
    mainThread?: string;
    learningPath?: string[];
    crossChapterRelations?: Array<{ from?: string; to?: string; relation?: string }>;
    coreConceptMap?: Array<{ concept?: string; appearsIn?: string[]; importance?: string }>;
  };
};

type LearningMode = "concise" | "detailed";

type LearningPage =
  | { kind: "guide"; id: string; title: string; shortTitle: string }
  | { kind: "module"; id: string; title: string; shortTitle: string; module: LearningModule }
  | { kind: "review"; id: string; title: string; shortTitle: string }
  | { kind: "resource-index"; id: string; title: string; shortTitle: string }
  | { kind: "diagnostics"; id: string; title: string; shortTitle: string }
  | { kind: "supplements"; id: string; title: string; shortTitle: string };

type Props = {
  framework: FrameworkData;
  courseName: string;
  showDiagnostics?: boolean;
  mode: LearningMode;
  onModeChange?: (mode: LearningMode) => void;
  toolbarExtra?: ReactNode;
  headerEyebrow?: string;
  headerTitle?: string;
  headerDescription?: ReactNode;
  debugDetails?: ReactNode;
};

const modeMeta: Record<LearningMode, { label: string; description: string }> = {
  concise: { label: "快速复习", description: "提纲版：抓主线和考点" },
  detailed: { label: "系统学习", description: "讲义版：完整理解和展开" },
};

function stripChapterPrefix(title?: string) {
  return (title ?? "未命名章节")
    .replace(/^第[一二三四五六七八九十百\d]+章[：:\s、.-]*/u, "")
    .replace(/^Chapter\s*\d+[：:\s、.-]*/iu, "")
    .trim();
}

function formatChapterNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function getBlockType(block: unknown): string {
  if (!block || typeof block !== "object" || !("type" in block)) return "";
  const type = (block as { type?: unknown }).type;
  return typeof type === "string" ? type : "";
}

function getPageAnchor(page: LearningPage) {
  return page.id;
}

function buildLearningPages(result: ModuleBuildResult | null, showDiagnostics: boolean): LearningPage[] {
  if (!result) return [];

  const pages: LearningPage[] = [
    { kind: "guide", id: "guide", title: "本章导读", shortTitle: "本章导读" },
    ...result.modules.map((module, index) => ({
      kind: "module" as const,
      id: module.id,
      title: module.title,
      shortTitle: `${String(index + 1).padStart(2, "0")} ${module.title}`,
      module,
    })),
    { kind: "review", id: "chapter-review", title: "本章整合", shortTitle: "本章整合" },
    { kind: "resource-index", id: "resource-index", title: "资源索引", shortTitle: "资源索引" },
  ];

  if (showDiagnostics) {
    pages.push({ kind: "diagnostics", id: "diagnostics", title: "匹配诊断", shortTitle: "匹配诊断" });
  }

  if (result.supplements.length > 0) {
    pages.push({ kind: "supplements", id: "supplements", title: "补充材料", shortTitle: "补充材料" });
  }

  return pages;
}

function getModuleMeta(page: LearningPage) {
  if (page.kind !== "module") return "";
  const formulaCount = page.module.visualBlocks.filter((block) => getBlockType(block) === "formula_card").length;
  const exampleCount = page.module.visualBlocks.filter((block) => getBlockType(block) === "example_box").length;
  return [
    formulaCount > 0 ? `公式 ${formulaCount}` : "",
    exampleCount > 0 ? `例题 ${exampleCount}` : "",
  ].filter(Boolean).join(" · ");
}

function getProgressPercent(activeIndex: number, total: number) {
  if (total <= 0) return 0;
  return Math.round(((activeIndex + 1) / total) * 100);
}

function ChapterTabs({ chapters, activeIndex, onChange }: { chapters: FrameworkChapter[]; activeIndex: number; onChange: (index: number) => void }) {
  return (
    <div className="border-y border-zinc-200/80 bg-zinc-50/95">
      <div className="mx-auto flex w-full max-w-screen-2xl gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:thin]">
        {chapters.map((chapter, index) => (
          <button
            key={`${chapter.chapterTitle ?? "chapter"}-${index}`}
            className={`flex h-10 max-w-[220px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition ${
              activeIndex === index
                ? "border-red-200 bg-white text-red-700 shadow-sm ring-1 ring-red-100"
                : "border-transparent bg-transparent text-zinc-500 hover:border-zinc-200 hover:bg-white hover:text-zinc-900"
            }`}
            onClick={() => onChange(index)}
          >
            <span className={activeIndex === index ? "font-semibold text-red-600" : "text-zinc-400"}>{formatChapterNumber(index)}</span>
            <span className="truncate">{stripChapterPrefix(chapter.chapterTitle)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChapterGuide({ summary, keyConcepts, guideNodes }: { summary?: string; keyConcepts?: string[]; guideNodes: { name?: string; summary?: string }[] }) {
  if (!summary && !keyConcepts?.length && !guideNodes.length) return null;

  return (
    <section id="guide" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Start here</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">本章导读</h2>
        </div>
        <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">学习启动页</span>
      </div>

      <div className="space-y-5">
        {summary && (
          <div className="rounded-2xl border border-red-100 bg-red-50/50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">章节总览</p>
            <p className="mt-2 text-sm leading-7 text-zinc-700"><MathText text={summary} /></p>
          </div>
        )}

        {guideNodes.length > 0 && (
          <div className="grid gap-3 lg:grid-cols-2">
            {guideNodes.map((node, index) => (
              <div key={`${node.name ?? "guide"}-${index}`} className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">{node.name}</p>
                {node.summary && <p className="mt-1.5 text-sm leading-7 text-zinc-600"><MathText text={node.summary} /></p>}
              </div>
            ))}
          </div>
        )}

        {keyConcepts && keyConcepts.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-zinc-900">核心概念</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {keyConcepts.map((concept, index) => (
                <span key={concept} className={`rounded-full border px-3 py-1 text-xs font-medium ${index < 3 ? "border-red-100 bg-red-50 text-red-700" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ChapterReviewSection({ pitfalls, reviewPath }: { pitfalls: string[] | null; reviewPath: { name?: string; children?: { name?: string }[] } | null }) {
  if (!pitfalls && !reviewPath) return null;

  return (
    <section id="chapter-review" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Review</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">本章整合</h2>
        <p className="mt-1.5 text-sm leading-7 text-zinc-500">易错提醒和复习路径。</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {pitfalls && pitfalls.length > 0 && (
          <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
            <p className="mb-3 text-sm font-semibold text-red-700">易错点 / 易混点</p>
            <ul className="space-y-2">
              {pitfalls.map((item, i) => (
                <li key={`p-${i}`} className="flex gap-2 text-sm leading-6 text-zinc-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span><MathText text={item} /></span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reviewPath?.children?.length ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
            <p className="mb-3 text-sm font-semibold text-zinc-900">复习路径</p>
            <ol className="space-y-2">
              {reviewPath.children.map((step, i) => (
                <li key={`r-${i}`} className="flex gap-2 text-sm leading-6 text-zinc-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-600 shadow-sm">
                    {i + 1}
                  </span>
                  <span><MathText text={step.name ?? ""} /></span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SupplementsSection({ blocks, compactTables }: { blocks: unknown[]; compactTables: boolean }) {
  if (blocks.length === 0) return null;

  const grouped: Record<string, unknown[]> = {};
  for (const block of blocks) {
    const type = getBlockType(block);
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(block);
  }

  const typeLabels: Record<string, string> = {
    formula_card: "补充公式",
    case_card: "补充案例",
    example_box: "补充例题",
    chart_explanation: "补充图表说明",
    payoff_chart: "补充收益图",
    line_chart: "补充趋势图",
    curve_chart: "补充曲线图",
    cashflow_diagram: "补充现金流图",
    decision_tree: "补充判断分支",
    timeline: "补充时间线",
    process_flow: "补充流程图",
    comparison_table: "补充对比表",
    data_table: "补充数据表",
    concept_map: "补充概念图",
    image: "补充图片",
  };

  return (
    <section id="supplements" className="scroll-mt-24 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Supplement</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">补充材料</h2>
        <p className="mt-1.5 text-sm leading-7 text-zinc-500">
          以下内容未能匹配到具体学习模块{blocks.length > 1 ? `（共 ${blocks.length} 项）` : ""}。
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([type, items]) => (
          <details key={type} className="rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-600">
              {typeLabels[type] ?? type}（{items.length}）
            </summary>
            <VisualBlockRenderer blocks={items} showHeading={false} compactTables={compactTables} />
          </details>
        ))}
      </div>
    </section>
  );
}

function DiagnosticsSection({ result }: { result: ModuleBuildResult }) {
  return (
    <section id="diagnostics" className="scroll-mt-24 rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-5">
      <div className="mb-3">
        <h2 className="text-base font-semibold tracking-tight text-amber-900">匹配诊断</h2>
        <p className="mt-1 text-sm text-amber-700">
          模块数 {result.stats.moduleCount}，visualBlocks 总数 {result.stats.totalBlocks}，
          已匹配 {result.stats.matchedBlocks}，未匹配 {result.stats.unmatchedBlocks}（{result.stats.unmatchedRatio}）
        </p>
        <p className="mt-1 text-sm text-amber-700">
          核心资源 {result.stats.coreResourceCount}，补充理解 {result.stats.supportItemCount}，
          拓展材料 {result.stats.extensionItemCount}，折叠内容 {result.stats.collapsedItemCount}
        </p>
        {Object.keys(result.stats.priorityCounts).length > 0 && (
          <p className="mt-1 text-xs text-amber-700">
            Priority：{(["P0", "P1", "P2", "P3"] as const)
              .map((key) => `${key} ${result.stats.priorityCounts[key] ?? 0}`)
              .join(" · ")}
          </p>
        )}
      </div>
      {result.moduleBlockCounts.length > 0 && (
        <div className="space-y-1 text-sm text-amber-800">
          {result.modules.map((mod, i) => (
            <div key={mod.id} className="flex justify-between gap-4">
              <span className="truncate">{String(i + 1).padStart(2, "0")} {mod.title}</span>
              <span className="shrink-0 font-mono text-xs">
                {result.moduleBlockCounts[i] ?? 0} 资源{mod.conceptItems.length > 0 ? ` · ${mod.conceptItems.length} 知识点` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ModuleTabs({ pages, activeIndex, expanded, onSelect }: { pages: LearningPage[]; activeIndex: number; expanded: boolean; onSelect: (index: number) => void }) {
  const progress = getProgressPercent(activeIndex, pages.length);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="shrink-0 border-zinc-100 lg:w-32 lg:border-r lg:pr-4">
          <p className="text-xs font-semibold text-zinc-500">本章进度</p>
          <div className="mt-1.5 flex items-end gap-2">
            <span className="text-xl font-semibold tracking-tight text-zinc-950">{progress}%</span>
            <span className="pb-0.5 text-xs text-zinc-500">{activeIndex + 1} / {pages.length}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-red-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]">
          <div className="flex min-w-max items-center gap-1.5 pb-1">
            {pages.map((page, index) => {
              const active = !expanded && activeIndex === index;
              const visited = index < activeIndex;
              return (
                <button
                  key={page.id}
                  title={page.title}
                  className={`group flex max-w-48 shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-red-200 bg-red-50 text-red-700 ring-1 ring-red-100"
                      : "border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                  onClick={() => onSelect(index)}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    active
                      ? "bg-red-600 text-white"
                      : visited
                        ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                        : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {visited ? "✓" : index + 1}
                  </span>
                  <span className="min-w-0 truncate font-semibold">{page.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ModulePager({
  pages,
  activeIndex,
  hasNextChapter,
  onPrevious,
  onNext,
}: {
  pages: LearningPage[];
  activeIndex: number;
  hasNextChapter: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === pages.length - 1;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isFirst}
          onClick={onPrevious}
        >
          ← 上一模块
        </button>
        <p className="text-sm font-medium text-zinc-500">
          当前模块 <span className="font-semibold text-zinc-900">{activeIndex + 1}</span> / {pages.length}
        </p>
        <button
          className="rounded-xl border border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:border-red-700 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isLast && !hasNextChapter}
          onClick={onNext}
        >
          {isLast ? (hasNextChapter ? "下一章 →" : "完成本课程") : "下一模块 →"}
        </button>
      </div>
    </section>
  );
}

function Sidebar({
  pages,
  chapter,
  activeChapterIndex,
  totalChapters,
  activePageIndex,
  expanded,
  onSelect,
}: {
  pages: LearningPage[];
  chapter: FrameworkChapter;
  activeChapterIndex: number;
  totalChapters: number;
  activePageIndex: number;
  expanded: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <aside className="sticky top-5 hidden self-start rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm xl:block">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-6 text-zinc-950">本章目录</h3>
          <p className="mt-1 text-xs text-zinc-500">第 {activeChapterIndex + 1} / {totalChapters} 章</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">{activePageIndex + 1} / {pages.length}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">{stripChapterPrefix(chapter.chapterTitle)}</p>

      <div className="mt-4 space-y-1.5 border-t border-zinc-100 pt-3 text-sm">
        {pages.map((page, index) => {
          const meta = getModuleMeta(page);
          const active = activePageIndex === index;
          const visited = index < activePageIndex;
          return (
            <button
              key={page.id}
              className={`block w-full rounded-xl border-l-2 px-3 py-2 text-left transition ${
                active && !expanded
                  ? "border-l-red-500 bg-red-50 text-red-700"
                  : "border-l-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
              }`}
              onClick={() => onSelect(index)}
            >
              <span className="flex items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  active && !expanded ? "bg-red-600 text-white" : visited ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-400"
                }`}>
                  {visited ? "✓" : index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold" title={page.title}>{page.shortTitle}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${active && !expanded ? "bg-white text-red-600" : "bg-zinc-100 text-zinc-500"}`}>
                  {active && !expanded ? "学习中" : visited ? "已浏览" : "未学习"}
                </span>
              </span>
              {meta ? <span className="ml-7 mt-1 block text-xs text-zinc-400">{meta}</span> : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default function FrameworkLearningView({
  framework,
  courseName,
  showDiagnostics = false,
  mode,
  onModeChange,
  toolbarExtra,
  headerEyebrow = "课程学习页",
  headerTitle,
  headerDescription,
  debugDetails,
}: Props) {
  const chapters = framework.chapters ?? [];
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const contentTopRef = useRef<HTMLDivElement>(null);

  const activeChapter = chapters[Math.min(activeChapterIndex, Math.max(chapters.length - 1, 0))];
  const result = useMemo(() => (activeChapter ? buildLearningModules(activeChapter) : null), [activeChapter]);
  const pages = useMemo(() => buildLearningPages(result, showDiagnostics), [result, showDiagnostics]);
  const activePage = pages[Math.min(activePageIndex, Math.max(pages.length - 1, 0))];
  const compactTables = !showDiagnostics;
  const previousChapter = activeChapterIndex > 0 ? chapters[activeChapterIndex - 1] : null;
  const nextChapter = activeChapterIndex < chapters.length - 1 ? chapters[activeChapterIndex + 1] : null;
  const progress = getProgressPercent(activePageIndex, pages.length);

  function scrollToContentTop() {
    window.requestAnimationFrame(() => {
      contentTopRef.current?.scrollIntoView({ block: "start" });
    });
  }

  function selectPage(index: number) {
    const bounded = Math.max(0, Math.min(index, pages.length - 1));
    if (expanded) {
      document.getElementById(getPageAnchor(pages[bounded]))?.scrollIntoView({ block: "start" });
      return;
    }
    setActivePageIndex(bounded);
    scrollToContentTop();
  }

  function selectChapter(index: number) {
    setActiveChapterIndex(index);
    setActivePageIndex(0);
    setExpanded(false);
    scrollToContentTop();
  }

  function goPreviousPage() {
    if (activePageIndex > 0) selectPage(activePageIndex - 1);
  }

  function goNextPage() {
    if (activePageIndex < pages.length - 1) {
      selectPage(activePageIndex + 1);
      return;
    }
    if (nextChapter) selectChapter(activeChapterIndex + 1);
  }

  function renderPage(page: LearningPage) {
    if (!result) return null;
    switch (page.kind) {
      case "guide":
        return <ChapterGuide summary={result.guide.summary} keyConcepts={result.guide.keyConcepts} guideNodes={result.guide.guideNodes} />;
      case "module":
        return <LearningModuleSection module={page.module} compactTables={compactTables} />;
      case "review":
        return <ChapterReviewSection pitfalls={result.chapterReview.pitfalls} reviewPath={result.chapterReview.reviewPath} />;
      case "resource-index":
        return <ResourceIndex modules={result.modules} />;
      case "diagnostics":
        return showDiagnostics ? <DiagnosticsSection result={result} /> : null;
      case "supplements":
        return <SupplementsSection blocks={result.supplements} compactTables={compactTables} />;
      default:
        return null;
    }
  }

  if (!activeChapter) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-zinc-500">暂无章节内容。</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-black tracking-tight">
              <span className="text-zinc-950">超级</span>
              <span className="text-red-600">阿水</span>
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-500 md:flex">
              <Link href="/" className="transition-colors hover:text-zinc-950">
                首页
              </Link>
              <Link href="/courses" className="text-zinc-950">
                课程
                <span className="mt-1 block h-0.5 rounded-full bg-red-600" />
              </Link>
              <Link href="/about" className="transition-colors hover:text-zinc-950">
                关于我们
              </Link>
            </nav>
          </div>
          <div />
        </div>
      </header>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-screen-2xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-stretch">
          <div className="min-w-0 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white via-white to-red-50/40 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="font-medium text-zinc-700">{courseName}</span>
              <span className="text-zinc-300">/</span>
              <span>{headerEyebrow}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="truncate text-3xl font-semibold tracking-tight text-zinc-950">
                {stripChapterPrefix(activeChapter.chapterTitle) || headerTitle || framework.title || "课程知识框架"}
              </h1>
              <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                第 {activeChapterIndex + 1} 章 · 共 {chapters.length} 章
              </span>
            </div>
            {headerDescription && <p className="mt-3 line-clamp-2 max-w-4xl text-sm leading-6 text-zinc-600">{headerDescription}</p>}
            <details className="mt-3 max-w-4xl rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-700">课程总览</summary>
              <div className="mt-2 space-y-3 text-sm leading-7 text-zinc-600">
                {framework.overallFramework?.mainThread && <p><MathText text={framework.overallFramework.mainThread} /></p>}
                {!framework.overallFramework?.mainThread && framework.courseSummary && <p><MathText text={framework.courseSummary} /></p>}
                {framework.overallFramework?.learningPath?.length && (
                  <ol className="space-y-1.5">
                    {framework.overallFramework.learningPath.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-zinc-100 text-center text-xs font-semibold leading-5 text-zinc-700">{index + 1}</span>
                        <span><MathText text={item} /></span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </details>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">课程进度</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <span className="text-3xl font-semibold tracking-tight text-zinc-950">{progress}%</span>
              <span className="text-sm font-medium text-zinc-500">{activeChapterIndex + 1} / {chapters.length} 章</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-red-600" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">当前模块</p>
                <p className="mt-1 font-semibold text-zinc-950">{activePageIndex + 1} / {pages.length}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">学习状态</p>
                <p className="mt-1 font-semibold text-red-600">学习中</p>
              </div>
            </div>
          </div>
        </div>
        {showDiagnostics && (
          <div className="mx-auto w-full max-w-screen-2xl px-4 pb-4 sm:px-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 lg:flex-row lg:items-start lg:justify-between">
              {toolbarExtra}
              {onModeChange && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
                  <div className="flex gap-1">
                    {(["concise", "detailed"] as const).map((item) => (
                      <button
                        key={item}
                        className={`rounded-xl px-3 py-2 text-left text-sm transition ${mode === item ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"}`}
                        onClick={() => onModeChange(item)}
                      >
                        <span className="block font-semibold">{modeMeta[item].label}</span>
                        <span className="block text-[11px] text-zinc-500">{modeMeta[item].description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {debugDetails}
          </div>
        )}
      </section>

      <ChapterTabs chapters={chapters} activeIndex={activeChapterIndex} onChange={selectChapter} />

      <div ref={contentTopRef} className="scroll-mt-5" />
      <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6 xl:mx-auto xl:w-full xl:max-w-5xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">当前章节</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">{stripChapterPrefix(activeChapter.chapterTitle)}</h2>
              </div>
              <button
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
                onClick={() => {
                  setExpanded((value) => !value);
                  scrollToContentTop();
                }}
              >
                {expanded ? "返回模块分页" : showDiagnostics ? "展开全章审核" : "展开全章"}
              </button>
            </div>
            {pages.length > 0 && (
              <div className="mt-4">
                <ModuleTabs pages={pages} activeIndex={activePageIndex} expanded={expanded} onSelect={selectPage} />
              </div>
            )}
          </div>

          {expanded ? pages.map((page) => <div key={page.id}>{renderPage(page)}</div>) : activePage ? renderPage(activePage) : null}

          {!expanded && pages.length > 0 && (
            <ModulePager
              pages={pages}
              activeIndex={activePageIndex}
              hasNextChapter={Boolean(nextChapter)}
              onPrevious={goPreviousPage}
              onNext={goNextPage}
            />
          )}

          {expanded && (
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!previousChapter}
                  onClick={() => previousChapter && selectChapter(activeChapterIndex - 1)}
                >
                  上一章{previousChapter ? `：${stripChapterPrefix(previousChapter.chapterTitle)}` : ""}
                </button>
                <p className="text-sm font-medium text-zinc-500">第 {activeChapterIndex + 1} / {chapters.length} 章</p>
                <button
                  className="rounded-xl border border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!nextChapter}
                  onClick={() => nextChapter && selectChapter(activeChapterIndex + 1)}
                >
                  下一章{nextChapter ? `：${stripChapterPrefix(nextChapter.chapterTitle)}` : ""}
                </button>
              </div>
            </section>
          )}
        </div>

        <Sidebar
          pages={pages}
          chapter={activeChapter}
          activeChapterIndex={activeChapterIndex}
          totalChapters={chapters.length}
          activePageIndex={activePageIndex}
          expanded={expanded}
          onSelect={selectPage}
        />
      </div>
    </main>
  );
}
