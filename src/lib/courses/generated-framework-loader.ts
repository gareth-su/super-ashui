import { readFile } from "node:fs/promises";
import path from "node:path";
import { getGeneratedCourseById, getDefaultGeneratedCourse } from "./course-registry";

export type FrameworkLevel = "concise" | "detailed";
export type FrameworkVariant = "sample" | "full";

export type FrameworkLoadResult =
  | { ok: true; content: string; courseId: string; level: FrameworkLevel; variant: FrameworkVariant; filePath: string }
  | { ok: false; error: string; courseId: string; level: FrameworkLevel; variant: FrameworkVariant; filePath: string };

export type LoadFrameworkOptions = {
  courseId?: string;
  variant?: FrameworkVariant;
  level?: FrameworkLevel;
};

function getFrameworkFileName(level: FrameworkLevel): string {
  return `framework-${level}.json`;
}

export async function loadGeneratedFramework(
  options: LoadFrameworkOptions = {},
): Promise<FrameworkLoadResult> {
  const courseId = options.courseId ?? getDefaultGeneratedCourse().id;
  const course = getGeneratedCourseById(courseId) ?? getDefaultGeneratedCourse();
  const variant = options.variant ?? course.defaultVariant;
  const level = options.level ?? course.defaultLevel;

  const filePath = path.join(
    process.cwd(),
    course.generatedPath,
    variant,
    getFrameworkFileName(level),
  );

  try {
    const raw = await readFile(filePath, "utf8");
    JSON.parse(raw); // validate before returning
    return { ok: true, content: raw, courseId: course.id, level, variant, filePath };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        ok: false,
        error: `${getFrameworkFileName(level)} 不是合法 JSON：${error.message}`,
        courseId: course.id, level, variant, filePath,
      };
    }
    const isNotFound =
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isNotFound) {
      return {
        ok: false,
        error: `文件不存在：${filePath}`,
        courseId: course.id, level, variant, filePath,
      };
    }
    const message = error instanceof Error ? error.message : "读取文件失败";
    return { ok: false, error: message, courseId: course.id, level, variant, filePath };
  }
}
