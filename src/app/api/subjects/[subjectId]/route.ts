import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { subjectId: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { subjectId } = await ctx.params;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        artifacts: {
          orderBy: { generatedAt: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
            detailLevel: true,
            version: true,
            generatedAt: true,
          },
        },
        _count: {
          select: {
            materials: true,
            artifacts: true,
            questions: true,
            practiceSessions: true,
            jobs: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    return NextResponse.json({ subject });
  } catch (error) {
    const message = error instanceof Error ? error.message : "课程详情读取失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
