import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  const body = (await req.json()) as { subjectId: string; mode?: string };
  if (!body.subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });

  const session = await prisma.practiceSession.create({
    data: {
      subjectId: body.subjectId,
      mode: body.mode ?? "STANDARD",
    },
  });

  return NextResponse.json({ session });
}
