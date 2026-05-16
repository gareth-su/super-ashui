import { safeTextResponse } from "@/lib/ai/client";

export async function generateCheatsheet(input: { subjectName: string; chunks: string[]; detail: "CONCISE" | "DETAILED"; }) {
  const prompt = `你是金融课程助教。请基于资料输出“${input.subjectName}”考前速记提纲（Markdown）。\n要求：\n1) 按章节输出\n2) 风格=${input.detail === "CONCISE" ? "简洁要点" : "详细复习版"}\n3) 列出关键概念、常考点、易错点\n资料：\n${input.chunks.join("\n\n---\n\n")}`;
  return safeTextResponse(prompt);
}
