import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { parseDocument } from "@/lib/parser/document-parser";
import { chunkText } from "@/lib/chunker/chunk-text";

type Params = { id: string };

export async function POST(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;

  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) {
    return NextResponse.json({ error: "资料不存在" }, { status: 404 });
  }

  await prisma.material.update({
    where: { id },
    data: { parseStatus: "PARSING", parseError: null },
  });

  try {
    const sections = await parseDocument(material.filePath);
    const validSections = sections.filter((s) => s.text && s.text.trim().length > 0);

    const chunks = chunkText(
      validSections.map((s, index) => ({
        content: s.text,
        sourcePage: s.page ?? index + 1,
        sourceSection: s.section,
      })),
    );

    await prisma.materialChunk.deleteMany({ where: { materialId: material.id } });

    if (chunks.length > 0) {
      await prisma.materialChunk.createMany({
        data: chunks.map((c) => ({
          materialId: material.id,
          chunkIndex: c.chunkIndex,
          content: c.content,
          tokenCount: c.tokenCount,
          sourcePage: c.sourcePage ?? null,
          sourceSection: c.sourceSection ?? null,
          contentType: c.contentType ?? null,
        })),
      });
    }

    await prisma.material.update({
      where: { id },
      data: { parseStatus: "SUCCESS" },
    });

    return NextResponse.json({ materialId: id, chunks: chunks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析失败";
    await prisma.material.update({
      where: { id },
      data: { parseStatus: "FAILED", parseError: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
