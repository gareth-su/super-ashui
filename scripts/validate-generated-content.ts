import { readFile, readdir } from "node:fs/promises";
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

async function fileExists(filePath: string) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch {
    return false;
  }
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
/*  Math/content quality gates                                         */
/* ------------------------------------------------------------------ */

type ContentIssue = {
  severity: "error" | "warning";
  filePath: string;
  jsonPath: string;
  type: string;
  snippet: string;
  suggestion: string;
};

const MAX_ISSUES_TO_PRINT = 200;

const ERROR_PATTERNS: Array<[string, RegExp, string]> = [
  ["encoding corruption marker", /\?{5,}|\uFFFD|\u6D93|\u9365|\u9286|[\u00E7\u00E5]/, "Restore the source JSON from a UTF-8 backup; mojibake or replacement characters were detected."],
  ["backslash digit", /\\[1-9]/, "Remove the accidental backslash before the digit, or wrap the whole expression in valid \\(...\\)."],
  ["backslash Chinese punctuation (unicode)", /\\[\u3002\uff0c\uff1b\uff1a\u3001\uff09]/, "Remove the accidental backslash before Chinese punctuation."],
  ["backslash Chinese unit (unicode)", /\\(?:\u5143|\u7f8e\u5143)/, "Move the unit outside math mode or use \\text{...} inside LaTeX."],
  ["backslash Chinese punctuation", /\\[。，；：、）]/, "Remove the accidental backslash before Chinese punctuation."],
  ["backslash Chinese unit", /\\(?:元|美元|万|亿元)/, "Move the unit outside math mode or use \\text{...} inside LaTeX."],
  ["JSON control character", /[\x08\r\t\f]/, "Escape LaTeX commands in JSON source; do not let \\b, \\r, or \\t become control characters."],
  ["double escaped inline delimiter", /\\\\[()]/, "JSON should store inline math as \\\\( ... \\\\), which parses to \\( ... \\)."],
  ["broken inline delimiter after operator", /(?:\\cdot|\\times|=|\/)\\\(/, "Remove the inner delimiter or wrap the entire formula once in \\(...\\)."],
  ["broken left/right delimiter", /\\(?:left|right)\\(?:[()]|$)/, "Use \\left( ... \\right) inside one math expression; do not insert inline delimiters after \\left or \\right."],
];

const EARLY_INLINE_CLOSE_PATTERN = /\\%\\\)(?=[=+\-])|\\\)\\\)(?==)/g;

const FORMULA_LATEX_WRAPPER_PATTERN = /\$\$|\\\(|\\\)|\\\[|\\\]/;

const BARE_FORMULA_PATTERNS: Array<[string, RegExp]> = [
  ["exponential expression", /\b\d*(?:\.\d+)?e\^\{[^}]+\}|\be\^\{[A-Z]/],
  ["forward rate chain", /R1T1|R2T2|RF\(/],
  ["math multiplication symbol", /[A-Za-z0-9)}%]\s*[×·]\s*[A-Za-z0-9({]/],
  ["greek variable assignment", /\b(sigma|rho|beta|alpha|gamma|delta)\s*[=<>]/i],
  ["formula assignment", /\b(?:P|F|V|PV|FV|EL|LGD|PD|EAD|VaR|I_[A-Za-z]+)\s*=/],
  ["starred hedge variable", /\b[Nh]\*/],
  ["latex command without wrapper", /\b(?:sqrt|sum|frac)\b/],
];

const PLAIN_PAREN_FORMULA_PATTERN =
  /(?:（[^）]{1,140}(?:=|_[A-Za-z]|\^\{|PV|FV|swap|fixed|float|R1T1|R2T2|RF\()[^）]{0,140}）|(?<!\\)\([^()]{1,140}(?:=|_[A-Za-z]|\^\{|PV|FV|swap|fixed|float|R1T1|R2T2|RF\()[^()]{0,140}\))/;

const HIGH_CONFIDENCE_PERCENT_CHAIN_PATTERN =
  /LIBOR[+-]\d+(?:\.\d+)?\\%|\d+(?:\.\d+)?\\%\s*[-+\u2212]\s*\d+(?:\.\d+)?\\%\s*=\s*\d+(?:\.\d+)?\\%|(?:\u56fa\u5b9a\u5229\u5dee|\u6d6e\u52a8\u5229\u5dee|\u603b\u6536\u76ca\u7a7a\u95f4|\u4f18\u52bf|\u5229\u5dee)[\s\S]{0,120}\\%/;

const BARE_SWAP_FORMULA_PATTERN =
  /B_\{fixed\}\s*=\s*B_\{float\}|V_\{swap\}\s*=\s*B_\{fixed\}\s*[-\u2212]\s*B_\{float\}|V_swap\s*=\s*B_fixed\s*[-\u2212]\s*B_float/;

function shouldSkipBareFormulaWarning(jsonPath: string): boolean {
  return /\.type$/.test(jsonPath) || /formulaLatex$/.test(jsonPath) || /\.variables\[\d+\]\.symbol$/.test(jsonPath);
}

function findBareFormulaPattern(text: string): [string, string] | null {
  for (const [label, pattern] of BARE_FORMULA_PATTERNS) {
    const match = pattern.exec(text);
    if (match) return [label, match[0]];
  }
  return null;
}

function stripInlineMath(text: string): string {
  return text.replace(/\\\([\s\S]*?\\\)/g, " ").replace(/\\\[[\s\S]*?\\\]/g, " ");
}

function findBarePercentOutsideMath(text: string): number | null {
  const textWithoutInlineMath = stripInlineMath(text);
  const index = textWithoutInlineMath.indexOf("\\%");
  return index >= 0 ? index : null;
}

function textOutsideTextCommands(mathBody: string): string {
  return mathBody.replace(/\\text\{[^}]*[\u4e00-\u9fff][^}]*\}/g, "");
}

function createSnippet(value: string, matchText: string): string {
  const index = value.indexOf(matchText);
  if (index < 0) return value.slice(0, 160);
  const start = Math.max(0, index - 60);
  const end = Math.min(value.length, index + matchText.length + 80);
  return value.slice(start, end);
}

function createSnippetAt(value: string, index: number): string {
  const start = Math.max(0, index - 60);
  const end = Math.min(value.length, index + 120);
  return value.slice(start, end);
}

function findInlineDelimiterErrors(value: string) {
  const issues: Array<{ type: string; index: number; snippet: string; suggestion: string }> = [];
  const stack: number[] = [];
  let openCount = 0;
  let closeCount = 0;

  for (let i = 0; i < value.length - 1; i += 1) {
    const token = value.slice(i, i + 2);
    if (token === "\\(") {
      stack.push(i);
      openCount += 1;
      i += 1;
    } else if (token === "\\)") {
      closeCount += 1;
      if (stack.length === 0) {
        issues.push({
          type: "orphan inline math close delimiter",
          index: i,
          snippet: createSnippetAt(value, i),
          suggestion: "Remove the stray \\) or add a matching \\( before the formula body.",
        });
      } else {
        stack.pop();
      }
      i += 1;
    }
  }

  for (const index of stack) {
    issues.push({
      type: "unclosed inline math open delimiter",
      index,
      snippet: createSnippetAt(value, index),
      suggestion: "Add the missing \\) after the formula body, before Chinese punctuation.",
    });
  }

  if (openCount !== closeCount) {
    issues.push({
      type: "inline math delimiter count mismatch",
      index: 0,
      snippet: value.slice(0, 180),
      suggestion: `Inline math delimiters must be paired; found ${openCount} \\( and ${closeCount} \\).`,
    });
  }

  let earlyCloseMatch: RegExpExecArray | null;
  while ((earlyCloseMatch = EARLY_INLINE_CLOSE_PATTERN.exec(value)) !== null) {
    issues.push({
      type: "likely early inline math close delimiter",
      index: earlyCloseMatch.index,
      snippet: createSnippetAt(value, earlyCloseMatch.index),
      suggestion: "The formula appears to continue after \\); move the closing delimiter to the end of the calculation.",
    });
  }

  return issues;
}

function walkStrings(obj: unknown, jsonPath: string, visitor: (val: string, jsonPath: string) => void) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "string") {
    visitor(obj, jsonPath);
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => walkStrings(item, `${jsonPath}[${i}]`, visitor));
  } else if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      walkStrings(value, jsonPath ? `${jsonPath}.${key}` : key, visitor);
    }
  }
}

function walkObjects(obj: unknown, jsonPath: string, visitor: (val: Record<string, unknown>, jsonPath: string) => void) {
  if (obj === null || obj === undefined) return;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => walkObjects(item, `${jsonPath}[${i}]`, visitor));
  } else if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    visitor(record, jsonPath);
    for (const [key, value] of Object.entries(record)) {
      walkObjects(value, jsonPath ? `${jsonPath}.${key}` : key, visitor);
    }
  }
}

function runContentQualityChecks(filePath: string, framework: unknown): ContentIssue[] {
  const issues: ContentIssue[] = [];

  walkStrings(framework, "", (value, jsonPath) => {
    for (const issue of findInlineDelimiterErrors(value)) {
      issues.push({
        severity: "error",
        filePath,
        jsonPath,
        type: issue.type,
        snippet: issue.snippet,
        suggestion: issue.suggestion,
      });
    }

    for (const [type, pattern, suggestion] of ERROR_PATTERNS) {
      const match = pattern.exec(value);
      if (match) {
        issues.push({ severity: "error", filePath, jsonPath, type, snippet: createSnippet(value, match[0]), suggestion });
      }
    }

    if (/formulaLatex$/.test(jsonPath)) {
      const match = FORMULA_LATEX_WRAPPER_PATTERN.exec(value);
      if (match) {
        issues.push({
          severity: "error",
          filePath,
          jsonPath,
          type: "formulaLatex contains math delimiters",
          snippet: createSnippet(value, match[0]),
          suggestion: "formulaLatex should contain only the LaTeX body, without $$, \\(...\\), or \\[...\\].",
        });
      }
    }

    const textWithoutInlineMath = stripInlineMath(value);
    if (!/formulaLatex$/.test(jsonPath)) {
      const barePercentIndex = findBarePercentOutsideMath(value);
      if (barePercentIndex !== null) {
        issues.push({
          severity: "warning",
          filePath,
          jsonPath,
          type: "bare percent outside math mode",
          snippet: createSnippetAt(textWithoutInlineMath, barePercentIndex),
          suggestion: "Use a plain percent sign (%) in prose/table text, or keep \\% only inside valid math mode.",
        });
      }

      const percentChainMatch = HIGH_CONFIDENCE_PERCENT_CHAIN_PATTERN.exec(textWithoutInlineMath);
      if (percentChainMatch) {
        issues.push({
          severity: "warning",
          filePath,
          jsonPath,
          type: "high-confidence bare percent calculation chain",
          snippet: createSnippet(value, percentChainMatch[0]),
          suggestion: "Wrap the complete percentage or LIBOR calculation in \\(...\\), with Chinese punctuation outside math.",
        });
      }

      const bareSwapMatch = BARE_SWAP_FORMULA_PATTERN.exec(textWithoutInlineMath);
      if (bareSwapMatch) {
        issues.push({
          severity: "warning",
          filePath,
          jsonPath,
          type: "bare swap valuation formula",
          snippet: createSnippet(value, bareSwapMatch[0]),
          suggestion: "Wrap the swap valuation formula in \\(...\\) and normalize subscripts such as V_{swap}, B_{fixed}, and B_{float}.",
        });
      }
    }

    if (!shouldSkipBareFormulaWarning(jsonPath)) {
      const bareFormulaMatch = findBareFormulaPattern(textWithoutInlineMath);
      if (bareFormulaMatch) {
        const [label, text] = bareFormulaMatch;
        issues.push({
          severity: "warning",
          filePath,
          jsonPath,
          type: `bare formula candidate: ${label}`,
          snippet: createSnippet(value, text),
          suggestion: "If this is a displayed formula, wrap it in \\(...\\), normalize operators, or move the body to formulaLatex.",
        });
      }
    }

    const plainParenMatch = /formulaLatex$/.test(jsonPath) ? null : PLAIN_PAREN_FORMULA_PATTERN.exec(textWithoutInlineMath);
    if (plainParenMatch) {
      issues.push({
        severity: "warning",
        filePath,
        jsonPath,
        type: "plain parentheses formula candidate",
        snippet: createSnippet(value, plainParenMatch[0]),
        suggestion: "Convert clear formula parentheses to \\(...\\), with _{...}, \\times/\\cdot, and ASCII minus where appropriate.",
      });
    }

    const mathModePattern = /\\\(([\s\S]*?)\\\)/g;
    let mathMatch: RegExpExecArray | null;
    while ((mathMatch = mathModePattern.exec(value)) !== null) {
      const body = mathMatch[1] ?? "";
      if (/[\u4e00-\u9fff]/.test(textOutsideTextCommands(body))) {
        issues.push({
          severity: "warning",
          filePath,
          jsonPath,
          type: "Chinese text in math mode",
          snippet: createSnippet(value, mathMatch[0]),
          suggestion: "Move Chinese explanation outside math mode or wrap units/labels with \\text{...}.",
        });
      }
    }

    if (/−/.test(textWithoutInlineMath) && /[A-Za-z0-9_=^{}]/.test(textWithoutInlineMath)) {
      issues.push({
        severity: "warning",
        filePath,
        jsonPath,
        type: "Unicode minus in formula candidate",
        snippet: createSnippet(value, "−"),
        suggestion: "Use ASCII '-' inside formula expressions.",
      });
    }
  });

  walkObjects(framework, "", (record, jsonPath) => {
    if (typeof record.formula === "string" && typeof record.formulaLatex === "string") {
      const normalizedFormula = record.formula.replace(/\s+/g, "");
      const normalizedLatex = record.formulaLatex
        .replace(/\\(?:frac|sum|times|cdot|text|left|right|begin|end|max|min|approx|bar|geq|leq)/g, "")
        .replace(/[{}\\_\s]/g, "");
      if (normalizedFormula && normalizedLatex && normalizedFormula !== normalizedLatex) {
        issues.push({
          severity: "warning",
          filePath,
          jsonPath: jsonPath ? `${jsonPath}.formula` : "formula",
          type: "formula/formulaLatex differ",
          snippet: record.formula.slice(0, 180),
          suggestion: "Rendering uses formulaLatex; keep formula as readable fallback or align it when the mismatch is unintended.",
        });
      }
    }
  });

  return issues;
}

function printContentIssues(courseId: string, variant: string, level: string, issues: ContentIssue[]) {
  if (issues.length === 0) return;
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  console.warn(`\n[${courseId}/${variant}/${level}] content quality: ${errors.length} error(s), ${warnings.length} warning(s)`);

  for (const issue of issues.slice(0, MAX_ISSUES_TO_PRINT)) {
    const label = issue.severity === "error" ? "ERROR" : "WARN";
    console.warn(
      `  [${label}] ${issue.type}\n` +
      `    file: ${issue.filePath}\n` +
      `    path: ${issue.jsonPath || "$"}\n` +
      `    snippet: ${issue.snippet}\n` +
      `    suggestion: ${issue.suggestion}`,
    );
  }

  if (issues.length > MAX_ISSUES_TO_PRINT) {
    console.warn(`  ... ${issues.length - MAX_ISSUES_TO_PRINT} more issue(s) omitted from console output`);
  }
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectJsonFiles(filePath);
      if (entry.isFile() && entry.name.endsWith(".json")) return [filePath];
      return [];
    }),
  );
  return files.flat();
}

async function runGlobalInlineDelimiterGate() {
  const generatedDir = path.join(process.cwd(), "data", "generated");
  const files = await collectJsonFiles(generatedDir);
  const issues: ContentIssue[] = [];

  for (const filePath of files) {
    const raw = await readJsonText(filePath);
    const parsed = JSON.parse(raw) as unknown;
    walkStrings(parsed, "", (value, jsonPath) => {
      for (const issue of findInlineDelimiterErrors(value)) {
        issues.push({
          severity: "error",
          filePath,
          jsonPath,
          type: issue.type,
          snippet: issue.snippet,
          suggestion: issue.suggestion,
        });
      }
    });
  }

  if (issues.length === 0) return;

  console.error(`\n[data/generated] inline math delimiter gate failed: ${issues.length} error(s)`);
  for (const issue of issues.slice(0, MAX_ISSUES_TO_PRINT)) {
    console.error(
      `  [ERROR] ${issue.type}\n` +
      `    file: ${issue.filePath}\n` +
      `    path: ${issue.jsonPath || "$"}\n` +
      `    snippet: ${issue.snippet}\n` +
      `    suggestion: ${issue.suggestion}`,
    );
  }
  if (issues.length > MAX_ISSUES_TO_PRINT) {
    console.error(`  ... ${issues.length - MAX_ISSUES_TO_PRINT} more issue(s) omitted from console output`);
  }
  throw new Error(`Inline math delimiter gate failed with ${issues.length} error(s)`);
}

async function validateCourseVariant(course: GeneratedCourse, variant: "sample" | "full"): Promise<CourseValidationResult | null> {
  const variantDir = path.join(process.cwd(), course.generatedPath, variant);
  const concisePath = path.join(variantDir, "framework-concise.json");
  const detailedPath = path.join(variantDir, "framework-detailed.json");

  if (!(await fileExists(concisePath)) || !(await fileExists(detailedPath))) {
    return null;
  }

  const materialsPath = path.join(variantDir, "materials.json");
  const chunksPath = path.join(variantDir, "chunks.json");
  const hasMaterialsAndChunks = (await fileExists(materialsPath)) && (await fileExists(chunksPath));

  const [materials, chunks, conciseRaw, detailedRaw] = await Promise.all([
    hasMaterialsAndChunks ? parseJsonFile(materialsPath, MaterialsInputSchema) : Promise.resolve([]),
    hasMaterialsAndChunks ? parseJsonFile(chunksPath, ChunksInputSchema) : Promise.resolve([]),
    readJsonText(concisePath),
    readJsonText(detailedPath),
  ]);

  const materialIds = new Set(materials.map((material) => material.id));
  const unknownMaterialIds = chunks
    .map((chunk) => chunk.materialId)
    .filter((materialId) => !materialIds.has(materialId));

  if (unknownMaterialIds.length > 0) {
    throw new Error(
      `[${course.id}/${variant}] chunks.json references unknown materialId: ${[...new Set(unknownMaterialIds)].join(", ")}`,
    );
  }

  const conciseFramework = parseFrameworkJson(conciseRaw);
  const detailedFramework = parseFrameworkJson(detailedRaw);

  const conciseIssues = runContentQualityChecks(concisePath, conciseFramework);
  const detailedIssues = runContentQualityChecks(detailedPath, detailedFramework);
  printContentIssues(course.id, variant, "concise", conciseIssues);
  printContentIssues(course.id, variant, "detailed", detailedIssues);

  const errorCount = [...conciseIssues, ...detailedIssues].filter((issue) => issue.severity === "error").length;
  if (errorCount > 0) {
    throw new Error(`[${course.id}/${variant}] content quality gate failed with ${errorCount} error(s)`);
  }

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

  try {
    await runGlobalInlineDelimiterGate();
  } catch (error) {
    console.error(`  ${error instanceof Error ? error.message : error}`);
    allPassed = false;
  }

  for (const course of generatedCourses) {
    try {
      const results = await validateCourse(course);
      if (results.length === 0) {
        console.log(`[${course.id}] ${course.title} - skipped (no valid variant)`);
        continue;
      }
      for (const r of results) {
        console.log(`[${r.courseId}/${r.variant}] ${r.courseTitle}`);
        console.log(`  materials: ${r.materials}, chunks: ${r.chunks}`);
        console.log(`  framework concise chapters: ${r.conciseChapters}, detailed chapters: ${r.detailedChapters}`);
      }
    } catch (error) {
      console.error(`[${course.id}] ${course.title} - validation failed`);

      if (error instanceof z.ZodError) {
        console.error(formatZodError(error));
      } else if (error instanceof SyntaxError) {
        console.error(`  JSON parse failed: ${error.message}`);
      } else {
        console.error(`  ${error instanceof Error ? error.message : error}`);
      }

      allPassed = false;
    }
  }

  if (allPassed && generatedCourses.length > 0) {
    console.log("\nGenerated content validation passed");
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
