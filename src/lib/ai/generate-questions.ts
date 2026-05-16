import { QuestionType } from "@prisma/client";
import { safeTextResponse } from "@/lib/ai/client";

export type GeneratedQuestion = {
  questionType: QuestionType;
  stem: string;
  optionsJson: string | null;
  answerJson: string;
  analysis: string;
  autoGradable: boolean;
  sourceCitationsJson: string;
};

export async function generateQuestions(input: {
  subjectName: string;
  chunks: Array<{ materialId: string; chunkId: string; page?: number | null; content: string; contentType?: string | null; }>;
  count?: number;
}): Promise<GeneratedQuestion[]> {
  const count = input.count ?? 20;

  if (!process.env.ANTHROPIC_API_KEY) {
    return input.chunks.slice(0, Math.min(count, input.chunks.length)).map((c, idx) => ({
      questionType: idx % 5 === 0 ? "SHORT" : "SINGLE",
      stem: `基于资料片段，请回答：${c.content.slice(0, 40)}...`,
      optionsJson: idx % 5 === 0 ? null : JSON.stringify(["A", "B", "C", "D"]),
      answerJson: idx % 5 === 0 ? JSON.stringify({ reference: "见解析" }) : JSON.stringify({ answer: "A" }),
      analysis: "这是本地占位题，配置 API Key 后将生成高质量题目。",
      autoGradable: idx % 5 !== 0,
      sourceCitationsJson: JSON.stringify([
        { materialId: c.materialId, page: c.page ?? null, chunkId: c.chunkId, quote: c.content.slice(0, 80) },
      ]),
    }));
  }

  const prompt = `你是金融课程出题助理。基于资料为“${input.subjectName}”生成${count}道题。\n要求：\n1) JSON数组输出\n2) 每题字段：questionType, stem, optionsJson, answerJson, analysis, autoGradable, sourceCitationsJson\n3) sourceCitationsJson必须含materialId/page/chunkId/quote\n4) 客观题可自动判分，主观题给参考答案\n资料：\n${input.chunks
    .map((c) => `materialId=${c.materialId}; chunkId=${c.chunkId}; page=${c.page ?? ""}; text=${c.content}`)
    .join("\n\n")}`;

  const raw = await safeTextResponse(prompt);
  try {
    const parsed = JSON.parse(raw) as GeneratedQuestion[];
    return parsed;
  } catch {
    return [];
  }
}
