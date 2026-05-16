"use client";

import FrameworkLearningView, { type FrameworkData } from "@/components/framework/FrameworkLearningView";
import { useMemo, useState, useCallback } from "react";
import type { GeneratedCourse } from "@/lib/courses/course-registry";

type LoadResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

type Variant = "sample" | "full";
type Level = "concise" | "detailed";

type Props = {
  courseId: string;
  defaultVariant: Variant;
  defaultLevel: Level;
  sampleConcise: LoadResult;
  sampleDetailed: LoadResult;
  fullConcise: LoadResult;
  fullDetailed: LoadResult;
  allCourses: GeneratedCourse[];
};

function parseFramework(result: LoadResult): FrameworkData | null {
  if (!result.ok) return null;
  try {
    return JSON.parse(result.content) as FrameworkData;
  } catch {
    return null;
  }
}

function variantMeta(course: GeneratedCourse, variant: Variant): { label: string; description: string; path: string } {
  const variantPath = `${course.generatedPath}/${variant}/`;
  if (variant === "sample") {
    return { label: "样例内容", description: "用于快速检查结构与视觉效果", path: variantPath };
  }
  return { label: "完整课程", description: "整门课离线生成结果", path: variantPath };
}

/** Update browser URL params without full navigation. */
function syncUrl(cId: string, v: Variant, l: Level) {
  const params = new URLSearchParams();
  params.set("course", cId);
  if (v !== "sample") params.set("variant", v);
  if (l !== "detailed") params.set("level", l);
  window.history.replaceState(null, "", `/admin/preview/generated?${params.toString()}`);
}

export default function PreviewClient({
  courseId,
  defaultVariant,
  defaultLevel,
  sampleConcise,
  sampleDetailed,
  fullConcise,
  fullDetailed,
  allCourses,
}: Props) {
  const [variant, setVariant] = useState<Variant>(defaultVariant);
  const [level, setLevel] = useState<Level>(defaultLevel);

  const currentCourse = allCourses.find((c) => c.id === courseId) ?? allCourses[0];
  const multiCourse = allCourses.length > 1;

  const results: Record<Variant, { concise: LoadResult; detailed: LoadResult }> = {
    sample: { concise: sampleConcise, detailed: sampleDetailed },
    full: { concise: fullConcise, detailed: fullDetailed },
  };

  const result = results[variant][level];
  const framework = useMemo(() => parseFramework(result), [result]);
  const meta = variantMeta(currentCourse, variant);

  /* ---------- handlers ---------- */

  const handleVariantChange = useCallback((v: Variant) => {
    setVariant(v);
    syncUrl(courseId, v, level);
  }, [courseId, level]);

  const handleLevelChange = useCallback((l: Level) => {
    setLevel(l);
    syncUrl(courseId, variant, l);
  }, [courseId, variant]);

  function navigateToCourse(cId: string) {
    const params = new URLSearchParams();
    params.set("course", cId);
    if (variant !== "sample") params.set("variant", variant);
    if (level !== "detailed") params.set("level", level);
    window.location.assign(`/admin/preview/generated?${params.toString()}`);
  }

  /* ---------- controls ---------- */

  const sampleDisabled = !sampleConcise.ok && !sampleDetailed.ok;

  const toolbarExtra = (
    <div className="space-y-2">
      {/* Course selector */}
      {multiCourse && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-1.5 shadow-sm">
          <div className="mb-1 px-2 text-xs font-medium text-zinc-500">课程</div>
          <div className="flex gap-1">
            {allCourses.map((course) => (
              <button
                key={course.id}
                className={`rounded-xl px-4 py-2 text-left text-sm transition ${
                  course.id === currentCourse.id
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
                onClick={() => navigateToCourse(course.id)}
              >
                <span className="block font-semibold">{course.shortTitle}</span>
                <span className="block text-xs text-zinc-500">{course.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variant / level controls */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-1.5 shadow-sm">
        <div className="mb-1 px-2 text-xs font-medium text-zinc-500">数据范围</div>
        <div className="flex gap-1">
          {(["sample", "full"] as const).map((item) => {
            const m = variantMeta(currentCourse, item);
            const disabled = item === "sample" && sampleDisabled;
            return (
              <button
                key={item}
                disabled={disabled}
                className={`rounded-xl px-4 py-2 text-left text-sm transition ${
                  variant === item
                    ? "bg-white text-zinc-950 shadow-sm"
                    : disabled
                      ? "cursor-not-allowed text-zinc-300"
                      : "text-zinc-600 hover:text-zinc-950"
                }`}
                onClick={() => !disabled && handleVariantChange(item)}
              >
                <span className="block font-semibold">{m.label}</span>
                <span className="block text-xs text-zinc-500">{m.description}</span>
              </button>
            );
          })}
        </div>
        {/* sample-unavailable hint */}
        {variant === "sample" && sampleDisabled && (
          <p className="mt-2 px-2 text-xs text-amber-700">
            该课程暂未生成 sample 内容，请切换到「完整课程」。
          </p>
        )}
      </div>
    </div>
  );

  /* ---------- debug info ---------- */

  const debugDetails = (
    <details className="mt-4 max-w-4xl rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-amber-900">调试信息</summary>
      <div className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
        <p>当前课程：{currentCourse.title}（courseId: {currentCourse.id}）</p>
        <p>数据范围：{meta.label}（{variant}）</p>
        <p>详细程度：{level === "detailed" ? "详细" : "简洁"}</p>
        <p>读取目录：<code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">{meta.path}</code></p>
        <p>当前文件：<code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">framework-{level}.json</code></p>
        <p>该页面只用于内容预览，不会写入数据库。</p>
      </div>
    </details>
  );

  /* ---------- error states ---------- */

  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          <p className="font-semibold">预览失败</p>
          <p className="mt-2">{result.error}</p>
        </section>
      </main>
    );
  }

  if (!framework) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          <p className="font-semibold">预览失败</p>
          <p className="mt-2">当前内容不是合法 JSON。</p>
        </section>
      </main>
    );
  }

  /* ---------- main ---------- */

  return (
    <FrameworkLearningView
      framework={framework}
      courseName={currentCourse.title}
      showDiagnostics
      mode={level}
      onModeChange={handleLevelChange}
      toolbarExtra={toolbarExtra}
      headerEyebrow="内容预览"
      headerTitle="课程内容预览"
      headerDescription={framework.courseSummary ?? "预览课程知识框架、章节内容、公式、案例和图表的学习页效果。"}
      debugDetails={debugDetails}
    />
  );
}
