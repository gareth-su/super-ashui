import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { subjectId: string };

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  const { subjectId } = await ctx.params;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");

  const questions = await prisma.question.findMany({
    where: { subjectId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return NextResponse.json({ questions });
}
