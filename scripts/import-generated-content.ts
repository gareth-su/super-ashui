import { prisma } from "../src/lib/db/prisma";
import { validateGeneratedContent } from "./validate-generated-content";

type DetailLevel = "CONCISE" | "DETAILED";

const subjectName = process.env.CONTENT_SUBJECT_NAME?.trim() || "衍生金融工具";

async function getNextFrameworkVersion(subjectId: string, detailLevel: DetailLevel) {
  const latest = await prisma.knowledgeArtifact.findFirst({
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

async function main() {
  const content = await validateGeneratedContent();

  const subject = await prisma.subject.upsert({
    where: { name: subjectName },
    update: { status: "ACTIVE" },
    create: { name: subjectName, status: "ACTIVE" },
    select: { id: true, name: true },
  });

  const materialIdMap = new Map<string, string>();

  for (const material of content.materials) {
    const existing = await prisma.material.findFirst({
      where: {
        subjectId: subject.id,
        title: material.title,
        filePath: material.filePath,
      },
      select: { id: true },
    });

    const saved = existing
      ? await prisma.material.update({
          where: { id: existing.id },
          data: {
            mimeType: material.mimeType ?? null,
            uploadStatus: "STORED",
            parseStatus: "SUCCESS",
            parseError: null,
          },
          select: { id: true },
        })
      : await prisma.material.create({
          data: {
            subjectId: subject.id,
            title: material.title,
            filePath: material.filePath,
            mimeType: material.mimeType ?? null,
            uploadStatus: "STORED",
            parseStatus: "SUCCESS",
          },
          select: { id: true },
        });

    materialIdMap.set(material.id, saved.id);
  }

  let chunkCount = 0;

  for (const chunk of content.chunks) {
    const materialId = materialIdMap.get(chunk.materialId);
    if (!materialId) throw new Error(`找不到 materialId 映射：${chunk.materialId}`);

    await prisma.materialChunk.upsert({
      where: {
        materialId_chunkIndex: {
          materialId,
          chunkIndex: chunk.chunkIndex,
        },
      },
      update: {
        content: chunk.content,
        tokenCount: chunk.tokenCount ?? 0,
        sourcePage: chunk.sourcePage ?? null,
        sourceSection: chunk.sourceSection ?? null,
        contentType: chunk.contentType ?? null,
      },
      create: {
        materialId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount ?? 0,
        sourcePage: chunk.sourcePage ?? null,
        sourceSection: chunk.sourceSection ?? null,
        contentType: chunk.contentType ?? null,
      },
    });

    chunkCount += 1;
  }

  const conciseVersion = await getNextFrameworkVersion(subject.id, "CONCISE");
  const detailedVersion = await getNextFrameworkVersion(subject.id, "DETAILED");

  const [conciseArtifact, detailedArtifact] = await prisma.$transaction([
    prisma.knowledgeArtifact.create({
      data: {
        subjectId: subject.id,
        type: "C1_FRAMEWORK",
        detailLevel: "CONCISE",
        version: conciseVersion,
        contentJson: JSON.stringify(content.conciseFramework, null, 2),
      },
      select: { id: true, detailLevel: true, version: true },
    }),
    prisma.knowledgeArtifact.create({
      data: {
        subjectId: subject.id,
        type: "C1_FRAMEWORK",
        detailLevel: "DETAILED",
        version: detailedVersion,
        contentJson: JSON.stringify(content.detailedFramework, null, 2),
      },
      select: { id: true, detailLevel: true, version: true },
    }),
  ]);

  console.log("离线内容导入完成");
  console.log(JSON.stringify({
    subject,
    materials: content.materials.length,
    chunks: chunkCount,
    artifacts: [conciseArtifact, detailedArtifact],
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
