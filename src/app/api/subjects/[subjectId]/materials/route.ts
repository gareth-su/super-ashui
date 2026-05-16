import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { subjectId: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  try {
    const { subjectId } = await ctx.params;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });

    if (!subject) {
      return NextResponse.json({ error: "课程不存在" }, { status: 404 });
    }

    const materials = await prisma.material.findMany({
      where: { subjectId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            chunks: true,
            questions: true,
            jobs: true,
          },
        },
      },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    const message = error instanceof Error ? error.message : "课程资料读取失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
