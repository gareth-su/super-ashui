"use client";

import { generatedCourses } from "@/lib/courses/course-registry";
import FrameworkLearningView, { type FrameworkData } from "@/components/framework/FrameworkLearningView";
import { useMemo } from "react";

type Props = {
  initialDetailedContent: string;
  currentCourseId: string;
  courseName: string;
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
}: Props) {
  const framework = useMemo(() => parseFramework(initialDetailedContent), [initialDetailedContent]);

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
      <div className="mx-auto mt-8 flex w-full max-w-6xl items-center gap-3 px-6 text-sm">
        <span className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">课程</span>
        <div className="flex gap-0.5">
          {generatedCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => switchCourse(course.id)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                currentCourseId === course.id
                  ? "bg-zinc-900 font-medium text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
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
        mode="detailed"
        headerEyebrow="期末复习"
        headerTitle={framework.title ?? "课程知识框架"}
        headerDescription={framework.courseSummary ?? "围绕课程进行系统化梳理，帮助快速定位章节主线、核心概念、公式、案例和图表。"}
      />
    </div>
  );
}
