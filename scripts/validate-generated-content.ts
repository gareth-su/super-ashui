import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { parseFrameworkJson } from "../src/lib/ai/framework-schema";
import { generatedCourses } from "../src/lib/courses/course-registry";
import type { GeneratedCourse } from "../src/lib/courses/course-registry";

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

const MaterialInputSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  filePath: z.string().trim().min(1),
  mimeType: z.string().trim().min(1).nullable().optional(),
});

const ChunkInputSchema = z.object({
  materialId: z.string().trim().min(1),
  chunkIndex: z.number().int().nonnegative(),
  content: z.string().trim().min(1),
  tokenCount: z.number().int().nonnegative().optional(),
  sourcePage: z.number().int().positive().nullable().optional(),
  sourceSection: z.string().trim().min(1).nullable().optional(),
  contentType: z.string().trim().min(1).nullable().optional(),
});

const MaterialsInputSchema = z.array(MaterialInputSchema).min(1);
const ChunksInputSchema = z.array(ChunkInputSchema).min(1);

function formatZodError(error: z.ZodError) {
  return z.prettifyError(error);
}

/* ------------------------------------------------------------------ */
/*  Per-course validation                                              */
/* ------------------------------------------------------------------ */

async function readJsonText(filePath: string) {
  return readFile(filePath, "utf8");
}

async function parseJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await readJsonText(filePath);
  const parsed = JSON.parse(raw) as unknown;
  return schema.parse(parsed);
}

type CourseValidationResult = {
  courseId: string;
  courseTitle: string;
  variant: string;
  materials: number;
  chunks: number;
  conciseChapters: number;
  detailedChapters: number;
};

/* ------------------------------------------------------------------ */
/*  Content quality warnings                                            */
/* ------------------------------------------------------------------ */

const UNWRAPPED_MATH_PATTERNS = [
  /\([^)]*_{[A-Za-z0-9,]+}[^)]*\)/,
  /\([^)]*\^\{[^)]*\}[^)]*\)/,
  /\([^)]*\b(sigma|alpha|beta|gamma|delta|theta|lambda|mu|rho|tau|phi|psi|omega|pi)\b[^)]*\)/,
];

function looksLikeProseFormula(text: string): boolean {
  const proseWords = /\b(equals|expected|discounted|value|under|nodes|where|represents|means|calculated|derived|obtained|given by|expressed as)\b/i;
  const mathChars = /[_^{}\\]/;
  const hasEqualOrOp = /[=+\-*/]/.test(text);
  return proseWords.test(text) && (!mathChars.test(text) || !hasEqualOrOp);
}

function walkStrings(obj: unknown, path: string, visitor: (val: string, path: string) => void) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "string") {
    visitor(obj, path);
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => walkStrings(item, `${path}[${i}]`, visitor));
  } else if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      walkStrings(value, path ? `${path}.${key}` : key, visitor);
    }
  }
}

function runContentWarnings(courseId: string, variant: string, level: string, framework: unknown) {
  const warnings: string[] = [];

  walkStrings(framework, "", (value, path) => {
    // Skip already-wrapped LaTeX
    if (/\\(\(|\[)/.test(value)) return;

    // Check for unwrapped inline math in parentheses
    for (const pattern of UNWRAPPED_MATH_PATTERNS) {
      const match = pattern.exec(value);
      if (match) {
        warnings.push(
          `Potential unwrapped inline math found:\n` +
          `  path: ${path}\n` +
          `  text: ${match[0]}\n` +
          `  suggestion: use \\(...\\) wrapping, convert sigma→\\sigma, %→\\%`
        );
        break;
      }
    }

    // Check for prose in formula fields
    if (/formula(Latex)?$/.test(path) && looksLikeProseFormula(value)) {
      warnings.push(
        `Formula field appears to contain prose instead of a mathematical expression:\n` +
        `  path: ${path}\n` +
        `  text: ${value}\n` +
        `  suggestion: move explanatory text to description/explanation fields`
      );
    }
  });

  if (warnings.length > 0) {
    console.warn(`\n[${courseId}/${variant}/${level}] 内容质量警告 (${warnings.length}):`);
    for (const w of warnings) {
      console.warn(`  ⚠ ${w.replace(/\n/g, "\n    ")}`);
    }
  }
}

async function validateCourseVariant(course: GeneratedCourse, variant: "sample" | "full"): Promise<CourseValidationResult | null> {
  const variantDir = path.join(process.cwd(), course.generatedPath, variant);

  // Skip if variant directory doesn't exist (e.g. a new course that only has full/)
  try {
    await readFile(path.join(variantDir, "materials.json"), "utf8");
  } catch {
    return null;
  }

  const [materials, chunks, conciseRaw, detailedRaw] = await Promise.all([
    parseJsonFile(path.join(variantDir, "materials.json"), MaterialsInputSchema),
    parseJsonFile(path.join(variantDir, "chunks.json"), ChunksInputSchema),
    readJsonText(path.join(variantDir, "framework-concise.json")),
    readJsonText(path.join(variantDir, "framework-detailed.json")),
  ]);

  const materialIds = new Set(materials.map((material) => material.id));
  const unknownMaterialIds = chunks
    .map((chunk) => chunk.materialId)
    .filter((materialId) => !materialIds.has(materialId));

  if (unknownMaterialIds.length > 0) {
    throw new Error(
      `[${course.id}/${variant}] chunks.json 引用了不存在的 materialId：${[...new Set(unknownMaterialIds)].join("、")}`,
    );
  }

  const conciseFramework = parseFrameworkJson(conciseRaw);
  const detailedFramework = parseFrameworkJson(detailedRaw);

  /* ---------- content quality warnings ---------- */
  runContentWarnings(course.id, variant, "concise", conciseFramework);
  runContentWarnings(course.id, variant, "detailed", detailedFramework);

  return {
    courseId: course.id,
    courseTitle: course.title,
    variant,
    materials: materials.length,
    chunks: chunks.length,
    conciseChapters: conciseFramework.chapters.length,
    detailedChapters: detailedFramework.chapters.length,
  };
}

async function validateCourse(course: GeneratedCourse): Promise<CourseValidationResult[]> {
  const results: CourseValidationResult[] = [];

  const fullResult = await validateCourseVariant(course, "full");
  if (fullResult) results.push(fullResult);

  const sampleResult = await validateCourseVariant(course, "sample");
  if (sampleResult) results.push(sampleResult);

  return results;
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  let allPassed = true;

  for (const course of generatedCourses) {
    try {
      const results = await validateCourse(course);
      if (results.length === 0) {
        console.log(`[${course.id}] ${course.title} — 跳过（无有效 variant）`);
        continue;
      }
      for (const r of results) {
        console.log(`[${r.courseId}/${r.variant}] ${r.courseTitle}`);
        console.log(`  materials: ${r.materials}, chunks: ${r.chunks}`);
        console.log(`  framework concise chapters: ${r.conciseChapters}, detailed chapters: ${r.detailedChapters}`);
      }
    } catch (error) {
      console.error(`[${course.id}] ${course.title} — 校验失败`);

      if (error instanceof z.ZodError) {
        console.error(formatZodError(error));
      } else if (error instanceof SyntaxError) {
        console.error(`  JSON 解析失败：${error.message}`);
      } else {
        console.error(`  ${error instanceof Error ? error.message : error}`);
      }

      allPassed = false;
    }
  }

  if (allPassed && generatedCourses.length > 0) {
    console.log("\n离线生成内容校验通过");
  }

  if (!allPassed) {
    process.exitCode = 1;
  }
}

void main();

/* ------------------------------------------------------------------ */
/*  Re-export original function for import-generated-content.ts        */
/* ------------------------------------------------------------------ */

export async function validateGeneratedContent() {
  const defaultCourse = generatedCourses[0];
  const variant = "full";

  const [materials, chunks, conciseRaw, detailedRaw] = await Promise.all([
    parseJsonFile(
      path.join(process.cwd(), defaultCourse.generatedPath, variant, "materials.json"),
      MaterialsInputSchema,
    ),
    parseJsonFile(
      path.join(process.cwd(), defaultCourse.generatedPath, variant, "chunks.json"),
      ChunksInputSchema,
    ),
    readJsonText(
      path.join(process.cwd(), defaultCourse.generatedPath, variant, "framework-concise.json"),
    ),
    readJsonText(
      path.join(process.cwd(), defaultCourse.generatedPath, variant, "framework-detailed.json"),
    ),
  ]);

  return {
    materials,
    chunks,
    conciseFramework: parseFrameworkJson(conciseRaw),
    detailedFramework: parseFrameworkJson(detailedRaw),
  };
}
