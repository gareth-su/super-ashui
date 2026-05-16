import { getGeneratedCourseById, getDefaultGeneratedCourse, generatedCourses } from "@/lib/courses/course-registry";
import { loadGeneratedFramework } from "@/lib/courses/generated-framework-loader";
import PreviewClient from "./PreviewClient";

export default async function PreviewGeneratedPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; course?: string; level?: string }>;
}) {
  const { variant, course, level } = await searchParams;

  const courseId = course ?? "";
  const courseObj = getGeneratedCourseById(courseId) ?? getDefaultGeneratedCourse();
  const defaultVariant = variant === "full" ? "full" : "sample";
  const defaultLevel = level === "concise" ? "concise" : "detailed";

  const [sampleConcise, sampleDetailed, fullConcise, fullDetailed] = await Promise.all([
    loadGeneratedFramework({ courseId: courseObj.id, variant: "sample", level: "concise" }),
    loadGeneratedFramework({ courseId: courseObj.id, variant: "sample", level: "detailed" }),
    loadGeneratedFramework({ courseId: courseObj.id, variant: "full", level: "concise" }),
    loadGeneratedFramework({ courseId: courseObj.id, variant: "full", level: "detailed" }),
  ]);

  return (
    <PreviewClient
      courseId={courseObj.id}
      defaultVariant={defaultVariant}
      defaultLevel={defaultLevel}
      sampleConcise={sampleConcise}
      sampleDetailed={sampleDetailed}
      fullConcise={fullConcise}
      fullDetailed={fullDetailed}
      allCourses={generatedCourses}
    />
  );
}
