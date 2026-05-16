import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getFixedCourseFramework } from "@/lib/fixed-course-framework";

type Params = { subjectId: string };
type DetailLevel = "CONCISE" | "DETAILED";

function getRequestedLevel(req: NextRequest): DetailLevel {
  const value = req.nextUrl.searchParams.get("level")?.toUpperCase();
  return value === "DETAILED" ? "DETAILED" : "CONCISE";
}

function getGeneratedFileName(level: DetailLevel) {
  return level === "DETAILED" ? "framework-detailed.json" : "framework-concise.json";
}

async function readGeneratedFramework(level: DetailLevel) {
  const filePath = path.join(process.cwd(), "data", "generated", "ysjrgj", getGeneratedFileName(level));
  return readFile(filePath, "utf8");
}

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  const { subjectId } = await ctx.params;
  const level = getRequestedLevel(req);

  try {
    const artifact = await prisma.knowledgeArtifact.findFirst({
      where: {
        subjectId,
        type: "C1_FRAMEWORK",
        detailLevel: level,
      },
      orderBy: { generatedAt: "desc" },
    });

    if (artifact) return NextResponse.json({ artifact });
  } catch {
  }

  try {
    const contentJson = await readGeneratedFramework(level);
    return NextResponse.json({
      artifact: {
        contentJson,
      },
    });
  } catch {
  }

  return NextResponse.json({
    artifact: {
      contentJson: JSON.stringify(getFixedCourseFramework(level), null, 2),
    },
  });
}
