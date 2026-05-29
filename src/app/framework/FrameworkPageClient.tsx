"use client";

import { generatedCourses } from "@/lib/courses/course-registry";
import FrameworkLearningView, { type FrameworkData } from "@/components/framework/FrameworkLearningView";
import { useMemo } from "react";

type Props = {
  initialDetailedContent: string;
  currentCourseId: string;
  courseName: string;
  initialChapterIndex?: number | null;
  initialPageIndex?: number | null;
};

function parseFramework(content: string): FrameworkData | null {
  try {
    return JSON.parse(content) as FrameworkData;
  } catch {
    return null;
  }
}

export default function FrameworkPageClient({
  initialDetailedContent,
  currentCourseId,
  courseName,
  initialChapterIndex,
  initialPageIndex,
}: Props) {
  const framework = useMemo(() => parseFramework(initialDetailedContent), [initialDetailedContent]);
  const currentCourse = useMemo(
    () => generatedCourses.find((course) => course.id === currentCourseId),
    [currentCourseId],
  );

  function switchCourse(cId: string) {
    const params = new URLSearchParams();
    params.set("course", cId);
    window.location.assign(`/framework?${params.toString()}`);
  }

  if (!framework) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 text-sm whitespace-pre-wrap">{initialDetailedContent}</pre>
      </main>
    );
  }

  return (
    <div>
      <div className="mx-auto mt-6 flex w-full max-w-6xl flex-col gap-3 px-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2.5 text-sm shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">当前课程</span>
          <span className="h-4 w-px bg-zinc-200" />
          <span className="font-semibold text-zinc-950">{currentCourse?.title ?? courseName}</span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm sm:w-auto">
          <span className="px-2 text-xs font-semibold text-red-600">切换课程</span>
          {generatedCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => switchCourse(course.id)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                currentCourseId === course.id
                  ? "border-red-600 bg-red-600 text-white shadow-sm"
                  : "border-transparent bg-zinc-50 text-zinc-600 hover:border-red-100 hover:bg-red-50 hover:text-red-700"
              }`}
            >
              {course.shortTitle}
            </button>
          ))}
        </div>
      </div>

      <FrameworkLearningView
        framework={framework}
        courseName={courseName}
        courseId={currentCourseId}
        initialChapterIndex={initialChapterIndex}
        initialPageIndex={initialPageIndex}
        mode="detailed"
        headerEyebrow="期末复习"
        headerTitle={framework.title ?? "课程知识框架"}
        headerDescription={framework.courseSummary ?? "围绕课程进行系统化梳理，帮助快速定位章节主线、核心概念、公式、案例和图表。"}
      />
    </div>
  );
}
