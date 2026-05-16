import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateQuestions } from "@/lib/ai/generate-questions";
import { hasValidCitations } from "@/lib/citation/validate-citations";

type Params = { subjectId: string };

export async function POST(_req: Request, ctx: { params: Promise<Params> }) {
  const { subjectId } = await ctx.params;

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return NextResponse.json({ error: "学科不存在" }, { status: 404 });

  const chunks = await prisma.materialChunk.findMany({
    where: { material: { subjectId } },
    include: { material: true },
    take: 300,
  });

  if (chunks.length === 0) {
    return NextResponse.json({ error: "无可用资料内容" }, { status: 400 });
  }

  const generated = await generateQuestions({
    subjectName: subject.name,
    chunks: chunks.map((c) => ({
      materialId: c.materialId,
      chunkId: c.id,
      page: c.sourcePage,
      content: c.content,
      contentType: c.contentType,
    })),
    count: 20,
  });

  const valid = generated.filter((q) => hasValidCitations(q.sourceCitationsJson));

  if (valid.length > 0) {
    await prisma.question.createMany({
      data: valid.map((q) => ({
        subjectId,
        questionType: q.questionType,
        stem: q.stem,
        optionsJson: q.optionsJson,
        answerJson: q.answerJson,
        analysis: q.analysis,
        autoGradable: q.autoGradable,
        sourceCitationsJson: q.sourceCitationsJson,
      })),
    });
  }

  return NextResponse.json({ generated: generated.length, saved: valid.length });
}
