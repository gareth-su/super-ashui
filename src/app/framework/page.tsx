import { getGeneratedCourseById, getDefaultGeneratedCourse } from "@/lib/courses/course-registry";
import { loadGeneratedFramework } from "@/lib/courses/generated-framework-loader";
import { getFixedCourseFramework } from "@/lib/fixed-course-framework";
import FrameworkPageClient from "./FrameworkPageClient";

export default async function FrameworkPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; chapter?: string; page?: string }>;
}) {
  const { course, chapter, page } = await searchParams;
  const courseId = course ?? "";
  const courseObj = getGeneratedCourseById(courseId) ?? getDefaultGeneratedCourse();
  const initialChapterIndex = chapter === undefined ? null : Number(chapter);
  const initialPageIndex = page === undefined ? null : Number(page);

  const detailedResult = await loadGeneratedFramework({
    courseId: courseObj.id,
    variant: "full",
    level: "detailed",
  });

  const detailedContent = detailedResult.ok
    ? detailedResult.content
    : JSON.stringify(getFixedCourseFramework("DETAILED"), null, 2);

  return (
    <FrameworkPageClient
      initialDetailedContent={detailedContent}
      currentCourseId={courseObj.id}
      courseName={courseObj.title}
      initialChapterIndex={Number.isFinite(initialChapterIndex) ? initialChapterIndex : null}
      initialPageIndex={Number.isFinite(initialPageIndex) ? initialPageIndex : null}
    />
  );
}
