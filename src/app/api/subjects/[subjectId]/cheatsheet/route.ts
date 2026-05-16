import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { subjectId: string };

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  const { subjectId } = await ctx.params;
  const level = req.nextUrl.searchParams.get("level") === "detailed" ? "DETAILED" : "CONCISE";

  const artifact = await prisma.knowledgeArtifact.findFirst({
    where: {
      subjectId,
      type: "C4_CHEATSHEET",
      detailLevel: level,
    },
    orderBy: { generatedAt: "desc" },
  });

  return NextResponse.json({ artifact });
}
