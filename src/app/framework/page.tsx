import { cookies } from "next/headers";
import AccessGate from "@/components/access/AccessGate";
import { getGeneratedCourseById, getDefaultGeneratedCourse } from "@/lib/courses/course-registry";
import { loadGeneratedFramework } from "@/lib/courses/generated-framework-loader";
import { getFixedCourseFramework } from "@/lib/fixed-course-framework";
import { isAccessControlConfigured, isAccessTokenValid } from "@/lib/access/access-control";
import FrameworkPageClient from "./FrameworkPageClient";

export default async function FrameworkPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("ashui_access")?.value;

  if (!isAccessControlConfigured()) {
    return <AccessGate message="访问码暂未配置，请联系管理员。" />;
  }

  if (!isAccessTokenValid(accessToken)) {
    return <AccessGate />;
  }

  const { course } = await searchParams;
  const courseId = course ?? "";
  const courseObj = getGeneratedCourseById(courseId) ?? getDefaultGeneratedCourse();

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
    />
  );
}
