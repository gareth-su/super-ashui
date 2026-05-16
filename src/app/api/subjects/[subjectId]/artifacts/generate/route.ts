import { z } from "zod";
import { NextResponse } from "next/server";
import { generateFramework } from "@/lib/ai/generate-framework";
import { parseFrameworkJson } from "@/lib/ai/framework-schema";
import { prisma } from "@/lib/db/prisma";

type Params = { subjectId: string };
type DetailLevel = "CONCISE" | "DETAILED";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function getNextFrameworkVersion(tx: Tx, subjectId: string, detailLevel: DetailLevel) {
  const latest = await tx.knowledgeArtifact.findFirst({
    where: {
      subjectId,
      type: "C1_FRAMEWORK",
      detailLevel,
    },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  return (latest?.version ?? 0) + 1;
}

export async function POST(_req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { subjectId } = await ctx.params;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return NextResponse.json({ error: "课程不存在" }, { status: 404 });

    const chunks = await prisma.materialChunk.findMany({
      where: { material: { subjectId } },
      include: {
        material: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
    });

    if (chunks.length === 0) {
      return NextResponse.json({ error: "没有可用解析内容，请先上传并解析资料" }, { status: 400 });
    }

    const sortedChunks = chunks.sort((a, b) => {
      const materialCreatedAtDiff = a.material.createdAt.getTime() - b.material.createdAt.getTime();
      if (materialCreatedAtDiff !== 0) return materialCreatedAtDiff;

      const materialTitleDiff = a.material.title.localeCompare(b.material.title, "zh-CN");
      if (materialTitleDiff !== 0) return materialTitleDiff;

      const pageDiff = (a.sourcePage ?? 0) - (b.sourcePage ?? 0);
      if (pageDiff !== 0) return pageDiff;

      return a.chunkIndex - b.chunkIndex;
    });

    const frameworkChunks = sortedChunks.map((chunk) => ({
      chunkId: chunk.id,
      materialId: chunk.materialId,
      materialTitle: chunk.material.title,
      chunkIndex: chunk.chunkIndex,
      sourcePage: chunk.sourcePage,
      sourceSection: chunk.sourceSection,
      contentType: chunk.contentType,
      content: chunk.content,
    }));

    const [conciseRaw, detailedRaw] = await Promise.all([
      generateFramework({ subjectName: subject.name, chunks: frameworkChunks, detail: "CONCISE" }),
      generateFramework({ subjectName: subject.name, chunks: frameworkChunks, detail: "DETAILED" }),
    ]);

    const conciseFramework = parseFrameworkJson(conciseRaw);
    const detailedFramework = parseFrameworkJson(detailedRaw);

    const saved = await prisma.$transaction(async (tx) => {
      const conciseVersion = await getNextFrameworkVersion(tx, subjectId, "CONCISE");
      const detailedVersion = await getNextFrameworkVersion(tx, subjectId, "DETAILED");

      const conciseArtifact = await tx.knowledgeArtifact.create({
        data: {
          subjectId,
          type: "C1_FRAMEWORK",
          detailLevel: "CONCISE",
          version: conciseVersion,
          contentJson: JSON.stringify(conciseFramework, null, 2),
        },
        select: { id: true, type: true, detailLevel: true, version: true, generatedAt: true },
      });

      const detailedArtifact = await tx.knowledgeArtifact.create({
        data: {
          subjectId,
          type: "C1_FRAMEWORK",
          detailLevel: "DETAILED",
          version: detailedVersion,
          contentJson: JSON.stringify(detailedFramework, null, 2),
        },
        select: { id: true, type: true, detailLevel: true, version: true, generatedAt: true },
      });

      return [conciseArtifact, detailedArtifact];
    });

    return NextResponse.json({ ok: true, generated: saved });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "AI 返回内容不符合知识框架 JSON Schema，未保存任何 KnowledgeArtifact",
          details: error instanceof z.ZodError ? z.treeifyError(error) : error.message,
        },
        { status: 422 },
      );
    }

    const message = error instanceof Error ? error.message : "知识框架生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
