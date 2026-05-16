import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const materials = await prisma.material.findMany({
    orderBy: { createdAt: "desc" },
    include: { subject: true },
  });

  return NextResponse.json({ materials });
}
