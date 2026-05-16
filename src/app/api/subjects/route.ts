import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { createdAt: "desc" },
      include: {
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

    return NextResponse.json({ subjects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "课程列表读取失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string };
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "课程名称不能为空" }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "课程名称已存在" }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "课程创建失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
