import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const [
      subjectCount,
      materialCount,
      artifactCount,
      questionCount,
      jobCount,
      pendingMaterialCount,
      parsingMaterialCount,
      successMaterialCount,
      failedMaterialCount,
      recentJobs,
    ] = await Promise.all([
      prisma.subject.count(),
      prisma.material.count(),
      prisma.knowledgeArtifact.count(),
      prisma.question.count(),
      prisma.job.count(),
      prisma.material.count({ where: { parseStatus: "PENDING" } }),
      prisma.material.count({ where: { parseStatus: "PARSING" } }),
      prisma.material.count({ where: { parseStatus: "SUCCESS" } }),
      prisma.material.count({ where: { parseStatus: "FAILED" } }),
      prisma.job.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          subject: { select: { id: true, name: true } },
          material: { select: { id: true, title: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        subjects: subjectCount,
        materials: materialCount,
        artifacts: artifactCount,
        questions: questionCount,
        jobs: jobCount,
        materialsByParseStatus: {
          PENDING: pendingMaterialCount,
          PARSING: parsingMaterialCount,
          SUCCESS: successMaterialCount,
          FAILED: failedMaterialCount,
        },
        recentJobs,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "后台统计读取失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
