import { generateAiText } from "@/lib/ai/provider";

export type FrameworkChunkInput = {
  chunkId: string;
  materialId: string;
  materialTitle: string;
  chunkIndex: number;
  sourcePage?: number | null;
  sourceSection?: string | null;
  contentType?: string | null;
  content: string;
};

export async function generateFramework(input: {
  subjectName: string;
  chunks: FrameworkChunkInput[];
  detail: "CONCISE" | "DETAILED";
}) {
  const detailInstruction =
    input.detail === "CONCISE"
      ? "生成提纲版：章节和节点数量适中，summary 简洁，突出期末复习主线与高频考点。"
      : "生成讲义版：章节、节点和概念展开更充分，summary 更完整，尽量保留资料中的定义、公式含义、易混点和章节关系。";

  const prompt = `请基于已解析并切片的课程资料，为“${input.subjectName}”生成知识框架 JSON。

重要限制：
- 只允许依据下方 chunks 内容生成，不要虚构资料外内容。
- 不要生成题目、练习题、选择题、答案或题库。
- 不要输出 Markdown，不要输出代码块，只输出一个合法 JSON object。
- JSON 必须能被 JSON.parse 解析。
- sourceFile 使用对应 materialTitle。
- 可把可能考点、核心概念、关键公式、易混点融入 keyConcepts、nodes.summary、overallFramework 中。
- ${detailInstruction}

JSON 结构必须完全兼容：
{
  "title": "课程知识框架标题",
  "courseSummary": "课程整体概述",
  "chapters": [
    {
      "chapterTitle": "章节标题",
      "sourceFile": "资料名称",
      "summary": "章节概述",
      "keyConcepts": ["关键概念"],
      "nodes": [
        {
          "name": "知识点名称",
          "summary": "知识点解释，包含定义、用途、考点或易混点",
          "children": []
        }
      ]
    }
  ],
  "overallFramework": {
    "mainThread": "课程知识主线",
    "learningPath": ["建议复习顺序"],
    "crossChapterRelations": [
      { "from": "章节或概念A", "to": "章节或概念B", "relation": "关系说明" }
    ],
    "coreConceptMap": [
      { "concept": "核心概念", "appearsIn": ["出现章节"], "importance": "为什么重要" }
    ]
  }
}

chunks JSON：
${JSON.stringify(input.chunks, null, 2)}`;

  return generateAiText({
    system: "你是严谨的课程教研助理，擅长把课程资料整理成结构化期末复习知识框架。你必须只输出合法 JSON。",
    prompt,
    temperature: 0.2,
    maxTokens: input.detail === "DETAILED" ? 9000 : 6000,
  });
}
