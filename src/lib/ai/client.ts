import { generateAiText } from "@/lib/ai/provider";

export async function safeTextResponse(prompt: string): Promise<string> {
  return generateAiText({
    system: "你是严谨的课程知识框架生成助手。只输出请求要求的内容。",
    prompt,
  });
}
